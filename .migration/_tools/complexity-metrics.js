#!/usr/bin/env node
// Per-site metrics behind the complexity-drivers table.
// Usage: node complexity-metrics.js <repoRoot>
const fs = require('fs');
const R = process.argv[2];
const j = (p) => JSON.parse(fs.readFileSync(`${R}/.migration/${p}`, 'utf8'));
const map = j('../.migration/reports/nhb-shared-block-library.mapping.json');
const out = {};
for (const k of ['acm', 'ihc', 'mhc', 'nms', 'pm', 'sysnmh']) {
  const all = j(`${k}-scope/urls-all.json`)['analysis-urls-all'];
  const lay = j(`${k}-scope/layouts.json`);
  const fe = j(`${k}-scope/integrations.json`).integrations.filter((i) => i.category !== 'Unclassified');
  const be = (() => { try { return j(`${k}-scope/backend.json`).services; } catch (e) { return []; } })();
  const mine = map.filter((m) => m.site === k);
  const shared = new Set(mine.filter((m) => m.block !== 'default-content').map((m) => `${m.block}/${m.variant}`));
  const inst = mine.reduce((a, m) => a + m.instances, 0);
  const dcInst = mine.filter((m) => m.block === 'default-content').reduce((a, m) => a + m.instances, 0);
  const paths = all.urls.map((o) => new URL(o.url).pathname);
  const events = paths.filter((p) => /whats-?on\//.test(p) && p.split('/').filter(Boolean).length >= 3).length;
  const years = paths.map((p) => (p.match(/20[0-2]\d/) || [])[0]).filter(Boolean).map(Number);
  const docs = all.documents;
  const pdf = docs.filter((d) => /\.pdf(\?|$)/i.test(d.url)).length;
  const custom = new Set(mine.filter((m) => ['itinerary', 'search', 'map', 'embed', 'form', 'newsletter'].includes(m.block) || (m.block === 'cards' && m.variant === 'listing')).map((m) => `${m.block}/${m.variant}`));
  out[k] = {
    pages: all.urls.length, non200: all.urls.filter((o) => o.status !== 200).length, docs: docs.length, pdf,
    families: new Set(lay.templates.map((t) => t.name)).size, signatures: lay.distinctSignatures,
    sharedVariants: shared.size, blockInstances: inst, defaultContentShare: Math.round(dcInst / inst * 100),
    events, oldestYear: years.length ? Math.min(...years) : null,
    fe: fe.length, be: be.length, custom: [...custom].sort(),
  };
}
console.log(JSON.stringify(out, null, 1));
