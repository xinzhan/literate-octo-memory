#!/usr/bin/env node
// Print page counts by first path segment and status for a catalog's urls-all.json.
// Usage: node url-summary.js <catalogFolder>...
const fs = require('fs');
const path = require('path');
for (const cf of process.argv.slice(2)) {
  const a = JSON.parse(fs.readFileSync(path.join(cf, 'urls-all.json'), 'utf8'))['analysis-urls-all'];
  const seg = {};
  const st = {};
  for (const o of a.urls) {
    const s = new URL(o.url).pathname.split('/').filter(Boolean)[0] || '(root)';
    seg[s] = (seg[s] || 0) + 1;
    st[o.status] = (st[o.status] || 0) + 1;
  }
  const top = Object.entries(seg).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(`${path.basename(cf)} | pages ${a.urls.length} | status ${JSON.stringify(st)}\n   ${top}`);
}
