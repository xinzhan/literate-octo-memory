#!/bin/bash
# run-sections.sh — slow, section-by-section, one-page-at-a-time render + block capture for
# /th-th/content/, then the remaining dashboard stages. Resumable: re-run to continue.
# Cloudflare serves blocked requests as a "Service Notice / Under Maintenance" page; those are
# detected (sections.js mark), and the page is retried after a cool-down.
# Usage: bash run-sections.sh <catalogFolder>
set +H 2>/dev/null || true
CF="${1:?usage: run-sections.sh <catalogFolder>}"
SKILL=/backups/xinzhan/literate-octo-memory/repo/.claude/skills/site-analysis-dashboard/scripts
# guard against environment resets: the skill must exist, and the Thai font is restored from backup
[ -f "$SKILL/render-pages.js" ] || { echo "❌ skill scripts missing at $SKILL" | tee -a "$CF/progress.log"; exit 1; }
if ! fc-match 'sans-serif:lang=th' | grep -qi 'Noto Sans Thai'; then
  mkdir -p ~/.local/share/fonts && cp "$CF"/.fonts/NotoSansThai-*.ttf ~/.local/share/fonts/ && fc-cache -f ~/.local/share/fonts >/dev/null 2>&1
fi
export NODE_PATH="$(dirname "$(find /home/node/.excat-marketplaces -type d -name playwright-core 2>/dev/null | head -1)")"
export SCOPE_UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
export SCOPE_DELAY="${SCOPE_DELAY:-1000}"     # ms extra wait inside block/backend capture
export SCOPE_SETTLE="${SCOPE_SETTLE:-15000}"  # max ms to let the React app finish rendering content
PAGE_PAUSE="${PAGE_PAUSE:-10}"                # s between page visits
SECTION_PAUSE="${SECTION_PAUSE:-60}"          # s between sections
COOLDOWN="${COOLDOWN:-300}"                   # s to back off after a Cloudflare block (doubles, max 1800)
MAX_TRIES="${MAX_TRIES:-4}"
PAGE_LIMIT="${PAGE_LIMIT:-180}"               # s hard limit per page per stage
LOG="$CF/progress.log"
log(){ echo "$(date -u +%H:%M:%S) $*" | tee -a "$LOG"; }
H="node $CF/sections.js $CF"
cool=$COOLDOWN

# visit <url> <stage: render|blocks> — runs one stage for one page with block detection + retry
visit(){
  local u="$1" stage="$2" t s r b
  for ((t=1; t<=MAX_TRIES; t++)); do
    $H only "$u"
    # hard per-page limit: some pages (e.g. search) never finish loading and hang the browser
    if [ "$stage" = render ]; then timeout -k 10 "$PAGE_LIMIT" node "$SKILL/render-pages.js" "$CF" --concurrency 1 >>"$LOG" 2>&1
    else timeout -k 10 "$PAGE_LIMIT" node "$SKILL/capture-blocks.js" "$CF" --concurrency 1 >>"$LOG" 2>&1; fi
    if [ $? -ge 124 ]; then log "   ⏱ $stage exceeded ${PAGE_LIMIT}s: ${u#https://www.thaiairways.com}"; $H timeout "$u" "$stage"; fi
    $H mark >>"$LOG"
    read r b <<<"$($H state "$u")"; s=$r; [ "$stage" = blocks ] && s=$b
    sleep "$PAGE_PAUSE"
    case "$s" in
      ok|none) cool=$COOLDOWN; return 0 ;;
      error)   # genuine page failure (broken redirect, timeout…): one quick retry, then keep the error
        [ "$t" -ge 2 ] && { log "   ✖ $stage page error kept: ${u#https://www.thaiairways.com}"; return 1; }
        log "   ⚠ $stage page error (try $t): ${u#https://www.thaiairways.com} — quick retry"; $H drop "$u"; continue ;;
      blocked)
        # a page can show Thai Airways' own "Service Notice" (e.g. an app page under maintenance);
        # if a control page loads fine right now, it is not Cloudflare — keep it as a page finding
        if [ "$(node "$CF/probe-control.js")" = ok ]; then
          $H drop "$u"; $H timeout "$u" "$stage" "site-side Service Notice (page under maintenance; control page loads fine)"
          log "   ✖ $stage shows site-side Service Notice (not Cloudflare): ${u#https://www.thaiairways.com}"; return 1
        fi
        [ "$t" -ge "$MAX_TRIES" ] && { log "   ✖ still blocked after $MAX_TRIES tries: ${u#https://www.thaiairways.com}"; return 1; }
        log "   ⚠ $stage Cloudflare block (try $t/$MAX_TRIES): ${u#https://www.thaiairways.com} — cooling down ${cool}s"
        sleep "$cool"; cool=$(( cool*2 > 1800 ? 1800 : cool*2 )); $H drop "$u" ;;
    esac
  done
}

$H mark >>"$LOG"   # re-tag any blocked records from earlier runs
SECTIONS=$($H list); TOTAL=$(echo "$SECTIONS" | wc -l); i=0
log "▶ start: $TOTAL sub-sections under /th-th/content/"
for s in $SECTIONS; do
  i=$((i+1))
  if [ -f "$CF/.done/$s" ]; then continue; fi
  URLS=$($H urls "$s"); n=$(echo "$URLS" | wc -l); j=0
  log "[$i/$TOTAL] $s — $n pages"
  for u in $URLS; do
    j=$((j+1))
    read r b <<<"$($H state "$u")"
    # resume: retry Cloudflare-blocked records; keep genuine page errors as findings
    [ "$r" = blocked ] && $H drop "$u" && r=none
    [ "$b" = blocked ] && $H drop "$u" && b=none
    [ "$r" = none ] && visit "$u" render
    read r _ <<<"$($H state "$u")"
    [ "$r" = ok ] && [ "$b" = none ] && [ ! -f "$CF/.done/blk$(echo -n "$u" | md5sum | cut -c1-12)" ] && { visit "$u" blocks; mkdir -p "$CF/.done"; touch "$CF/.done/blk$(echo -n "$u" | md5sum | cut -c1-12)"; }
    [ $((j % 10)) = 0 ] && log "   $s: $j/$n"
  done
  read n pe be <<<"$($H errors "$s")"
  log "   ✔ $s done — render errors $pe/$n, block errors $be/$n"
  mkdir -p "$CF/.done" && touch "$CF/.done/$s"
  sleep "$SECTION_PAUSE"
done
$H final
log "▶ all sections rendered — running remaining dashboard stages"
# Remaining stages run explicitly (not via run-analysis.sh): its bulk render/block-capture
# stages would re-visit zero-block pages at full speed and trip Cloudflare.
ORIGIN="$(node -e "console.log(require('$CF/config.json').siteOrigin)")"
stage(){ log "▶ $1"; shift; "$@" >>"$LOG" 2>&1 || log "   ✖ failed (exit $?): $*"; }
stage "[4] cluster layouts + front-end integrations" node "$SKILL/cluster-layouts.js" "$CF"
stage "[6] consolidate block variants"               node "$SKILL/consolidate-blocks.js" "$CF"
# Cloudflare block pages screenshot to byte-identical JPEGs: set those aside and retake after a cool-down
for try in 1 2 3; do
  stage "[7] template screenshots (pass $try)" env SCOPE_DELAY=30000 node "$SKILL/capture-shots.js" "$CF"
  dups=$(ls -l "$CF"/shots/t*.jpg 2>/dev/null | awk '{print $5}' | sort | uniq -d)
  [ -z "$dups" ] && break
  mkdir -p "$CF/shots-blocked"
  for sz in $dups; do ls -l "$CF"/shots/t*.jpg | awk -v s="$sz" '$5==s {print $9}' | xargs -r -I{} mv {} "$CF/shots-blocked/"; done
  log "   ⚠ blocked screenshots set aside — cooling down ${COOLDOWN}s before retaking"; sleep "$COOLDOWN"
done
stage "[8] methodology diagrams"                     node "$SKILL/make-diagrams.js" "$CF"
stage "[9] URL coverage"                             node "$SKILL/compute-inspection.js" "$CF"
[ -f "$CF/backend.json" ] || { stage "[10] backend API calls" env SCOPE_DELAY=8000 node "$SKILL/capture-backend.js" "$CF" --sample 40 --concurrency 1
                               stage "[10b] consolidate backend" node "$SKILL/consolidate-backend.js" "$CF"; }
stage "[11] supplementary data"                      node "$SKILL/compute-data.js" "$CF" "$ORIGIN"
stage "[12] build dashboard"                         node "$SKILL/build-dashboard.js" "$CF"
log "▶ pipeline finished"
