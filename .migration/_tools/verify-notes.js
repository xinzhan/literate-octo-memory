#!/usr/bin/env node
// Spot-check facts quoted in site-notes.json against the catalog data.
// Usage: node verify-notes.js <repoRoot>
const fs = require('fs');
const R = process.argv[2];
const j = (p) => JSON.parse(fs.readFileSync(`${R}/.migration/${p}`, 'utf8'));
const isTa = (u) => /\/ta(\/|$)/.test(new URL(u).pathname);
const ihcRaw = j('ihc-scope/.crawl.raw.json');
const ihcAll = j('ihc-scope/.crawl.out');
const added = ihcAll.filter((r) => r.source === 'sitemap');
console.log('ihc: tamil crawled', ihcRaw.filter((r) => isTa(r.url)).length, '| tamil total', ihcAll.filter((r) => isTa(r.url)).length,
  '| sitemap-added', added.length, '| of which tamil', added.filter((r) => isTa(r.url)).length, '| programmes', added.filter((r) => r.url.includes('/programmes/')).length);
const sr = j('sysnmh-scope/.crawl.raw.json');
console.log('sysnmh: crawl html pages', sr.filter((r) => !r.url.includes('/api/') && !/\.(pdf|png|jpe?g)$/i.test(r.url)).length);
for (const k of ['acm', 'ihc', 'mhc', 'nms', 'pm', 'sysnmh']) {
  const i = j(`${k}-scope/integrations.json`);
  console.log(k, '|', i.integrations.map((x) => x.name.replace('Other third-party: ', '?')).join(', '));
}
