#!/bin/bash
# After run-queue.sh finishes, bring every site onto the final classifier:
#  - nms: full re-render (its first run picked a hidden ".content" div as <main>, so no blocks were found)
#  - ihc, mhc, pm: re-capture blocks only (render + backend data are reused)
R=/backups/xinzhan/literate-octo-memory/repo
RUN="$R/.claude/skills/site-analysis-dashboard/scripts/run-analysis.sh"
until grep -q "ALL DONE" "$R/.migration/_tools/queue.log" 2>/dev/null; do sleep 30; done
for k in nms ihc mhc pm; do
  CF="$R/.migration/$k-scope"
  rm -rf "$CF/blocks" "$CF/blocks.jsonl" "$CF/block-catalog.json" "$CF/block-heatmap.json" "$CF/diagrams.json"
  [ "$k" = "nms" ] && rm -rf "$CF/pages.jsonl" "$CF/layouts.json" "$CF/shots" "$CF/shots.json"
  echo "$(date -u +%T) start $k-recapture" >> "$R/.migration/_tools/queue.log"
  RENDER_SAMPLE=100000 CONCURRENCY=3 bash "$RUN" "$CF" > "$CF/.pipeline-rerun.log" 2>&1
  echo "$(date -u +%T) end $k-recapture exit=$?" >> "$R/.migration/_tools/queue.log"
done
echo "RECAPTURE DONE" >> "$R/.migration/_tools/queue.log"
