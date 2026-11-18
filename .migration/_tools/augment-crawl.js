#!/usr/bin/env node
// Merge sitemap URLs into a finished crawl before build-urls-all.js runs.
//  - resolves every sitemap <loc> (following redirects) and records the final URL + status
//  - rewrites off-origin sitemap hosts (e.g. cms.nhb.gov.sg) onto config.siteOrigin
//  - keeps the untouched crawl in .crawl.raw.json; writes the merged list to .crawl.out
//  - writes sitemap-audit.json (sitemap URL -> final URL/status) for the report
// Usage: node augment-crawl.js <catalogFolder> [sitemap.xml file]
const fs = require('fs');
const path = require('path');
const cf = process.argv[2];
const smFile = process.argv[3] || path.join(cf, 'sitemap.xml');
const cfg = JSON.parse(fs.readFileSync(path.join(cf, 'config.json'), 'utf8'));
const origin = cfg.siteOrigin.replace(/\/$/, '');
const rawFile = path.join(cf, '.crawl.raw.json');
if (!fs.existsSync(rawFile)) fs.copyFileSync(path.join(cf, '.crawl.out'), rawFile);
const raw = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
const norm = (u) => { try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/$/, '').toLowerCase(); } catch (e) { return u; } };
const sm = fs.existsSync(smFile) ? [...fs.readFileSync(smFile, 'utf8').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].trim()) : [];
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

async function resolve(u) {
  try {
    const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
    const ct = r.headers.get('content-type') || '';
    await r.body?.cancel();
    return { final: r.url, status: r.status, html: ct.includes('html') };
  } catch (e) { return { final: u, status: 0, html: false, error: String(e.message || e) }; }
}

(async () => {
  const audit = [];
  const known = new Map(raw.map((r) => [norm(r.url), r]));
  let added = 0;
  for (const loc of sm) {
    let target = loc;
    let rewritten = false;
    try { if (new URL(loc).origin !== origin) { target = origin + new URL(loc).pathname; rewritten = true; } } catch (e) { /* keep */ }
    const res = await resolve(target);
    const offOriginStatus = rewritten ? (await resolve(loc)).status : null;
    audit.push({ sitemapUrl: loc, requested: target, rewrittenFromHost: rewritten ? new URL(loc).host : null, offOriginStatus, finalUrl: res.final, status: res.status, redirected: norm(res.final) !== norm(target) });
    if (!res.final.startsWith(origin)) continue;
    const k = norm(res.final);
    if (!known.has(k)) { known.set(k, { url: res.final, status: res.status, source: 'sitemap' }); added++; }
    await new Promise((r) => setTimeout(r, 200));
  }
  fs.writeFileSync(path.join(cf, '.crawl.out'), JSON.stringify([...known.values()], null, 1));
  fs.writeFileSync(path.join(cf, 'sitemap-audit.json'), JSON.stringify({ sitemapCount: sm.length, addedFromSitemap: added, entries: audit }, null, 1));
  const bad = audit.filter((a) => a.status !== 200).length;
  const offOrigin403 = audit.filter((a) => a.offOriginStatus && a.offOriginStatus >= 400).length;
  console.log(`${path.basename(cf)}: sitemap ${sm.length} | added ${added} new pages | sitemap entries not 200 after redirects: ${bad} | redirected: ${audit.filter((a) => a.redirected).length} | off-origin entries failing on their own host: ${offOrigin403}`);
})();
