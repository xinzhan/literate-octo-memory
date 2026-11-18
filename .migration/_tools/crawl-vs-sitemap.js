#!/usr/bin/env node
// Compare a finished crawl (.crawl.out) against the site's sitemap.xml.
// Usage: node crawl-vs-sitemap.js <catalogFolder> <sitemap.xml file>
const fs = require('fs');
const path = require('path');
const [cf, smFile] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(path.join(cf, 'config.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.join(cf, '.crawl.out'), 'utf8'));
const norm = (u) => { try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/$/, '').toLowerCase(); } catch (e) { return u; } };
const st = {};
raw.forEach((r) => { st[r.status] = (st[r.status] || 0) + 1; });
const api = raw.filter((r) => /\/api\//.test(r.url)).length;
const crawled = new Set(raw.map((r) => norm(r.url)));
const sm = fs.existsSync(smFile) ? [...fs.readFileSync(smFile, 'utf8').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]) : [];
const origin = cfg.siteOrigin.toLowerCase();
const smOn = sm.filter((u) => u.toLowerCase().startsWith(origin));
const smOff = sm.filter((u) => !u.toLowerCase().startsWith(origin));
const missing = smOn.filter((u) => !crawled.has(norm(u)));
console.log(path.basename(cf), '| crawl', raw.length, JSON.stringify(st), '| api/*', api,
  '| sitemap', sm.length, '(on-origin', smOn.length, 'off-origin', smOff.length + ')', '| sitemap-not-crawled', missing.length);
if (smOff.length) console.log('  off-origin hosts:', [...new Set(smOff.map((u) => new URL(u).host))].join(', '));
missing.slice(0, 8).forEach((u) => console.log('  missing:', u));
fs.writeFileSync(path.join(cf, 'sitemap-missing.json'), JSON.stringify(missing, null, 1));
