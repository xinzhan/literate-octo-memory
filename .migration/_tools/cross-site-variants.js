#!/usr/bin/env node
// How many block variants (base::structural signature) recur across sites?
// Usage: node cross-site-variants.js <catalogFolder>...
const fs = require('fs');
const path = require('path');
const byKey = {};
const perBase = {};
for (const cf of process.argv.slice(2)) {
  const site = path.basename(cf).replace(/-scope$/, '');
  const cat = JSON.parse(fs.readFileSync(path.join(cf, 'block-catalog.json'), 'utf8'));
  for (const v of cat.variants) {
    (byKey[v.key] = byKey[v.key] || { base: v.base, sites: {} }).sites[site] = v.instances;
    (perBase[v.base] = perBase[v.base] || new Set()).add(v.key);
  }
}
const keys = Object.values(byKey);
const dist = {};
keys.forEach((k) => { const n = Object.keys(k.sites).length; dist[n] = (dist[n] || 0) + 1; });
console.log('distinct variants across all sites:', keys.length, '| by number of sites sharing:', JSON.stringify(dist));
for (const [b, s] of Object.entries(perBase).sort((a, c) => c[1].size - a[1].size)) {
  const shared = [...s].filter((k) => Object.keys(byKey[k].sites).length >= 2).length;
  console.log(b.padEnd(14), 'variants', String(s.size).padStart(3), '| shared by 2+ sites', shared);
}
