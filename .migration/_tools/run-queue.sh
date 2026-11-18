#!/bin/bash
# Run the site-analysis pipeline for the remaining NHB sites one at a time (one browser at a time).
# Waits for any pipeline already running, then: mhc, nms, pm, sysnmh (CJK), then re-runs ACM's
# block stages with the updated capture-blocks.js.
R=/backups/xinzhan/literate-octo-memory/repo
RUN="$R/.claude/skills/site-analysis-dashboard/scripts/run-analysis.sh"
while pgrep -f "run-analysis.sh" >/dev/null; do sleep 20; done
for k in mhc nms pm sysnmh; do
  CF="$R/.migration/$k-scope"
  CJKV=0; [ "$k" = "sysnmh" ] && CJKV=1
  echo "$(date -u +%T) start $k" >> "$R/.migration/_tools/queue.log"
  CJK=$CJKV RENDER_SAMPLE=100000 CONCURRENCY=3 bash "$RUN" "$CF" > "$CF/.pipeline.log" 2>&1
  echo "$(date -u +%T) end $k exit=$?" >> "$R/.migration/_tools/queue.log"
done
# ACM: redo block capture with the improved classifier / sticky-header hiding
CF="$R/.migration/acm-scope"
rm -rf "$CF/blocks" "$CF/blocks.jsonl" "$CF/block-catalog.json" "$CF/block-heatmap.json" "$CF/diagrams.json"
echo "$(date -u +%T) start acm-rerun" >> "$R/.migration/_tools/queue.log"
RENDER_SAMPLE=100000 CONCURRENCY=3 bash "$RUN" "$CF" > "$CF/.pipeline-rerun.log" 2>&1
echo "$(date -u +%T) end acm-rerun exit=$?" >> "$R/.migration/_tools/queue.log"
echo "ALL DONE" >> "$R/.migration/_tools/queue.log"
