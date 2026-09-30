#!/usr/bin/env node
/*
 * build-stratified-set.js — Thai Airways render plan (replaces build-render-set.js output).
 *   Phase A (render-set.json): every en-th section (1-3 samples, spread across sub-sections) plus
 *     a child page of every sub-section that has children; home + one page per top-level section
 *     in 8 other locales; one page of every flights page kind (flight-kinds.js) in 5 languages,
 *     plus extra flights samples per kind (EXTRA) spread across languages.
 *   Phase B (render-set-all.json): Phase A first, then every remaining URL round-robin across
 *     locale x section buckets so partial progress stays representative.
 * Usage: node build-stratified-set.js <catalogFolder>
 */
const fs = require('fs');
const path = require('path');

const CF = process.argv[2] || __dirname;
const clean = (u) => u.replace(/^(https?:\/\/[^/]+)\/+/, '$1/');
const all = [...new Set(JSON.parse(fs.readFileSync(path.join(CF, 'urls-all.json'), 'utf8'))['analysis-urls-all'].urls.map((u) => clean(u.url)))];
const segs = (u) => decodeURI(new URL(u).pathname).split('/').filter(Boolean).map((s) => s.toLowerCase());
const groupBy = (arr, key) => arr.reduce((m, u) => { (m[key(u)] = m[key(u)] || []).push(u); return m; }, {});

// pick n urls from a list, preferring distinct values of sub-key (spread across sub-sections)
function spread(list, n, subKey) {
  const subs = Object.values(groupBy(list, subKey));
  const out = [];
  for (let i = 0; out.length < n && subs.some((s) => s.length > i); i++) {
    subs.forEach((s) => { if (out.length < n && s[i]) out.push(s[i]); });
  }
  return out;
}

const phaseA = [];
const add = (u) => { if (u && !phaseA.includes(u)) phaseA.push(u); };

// 1) en-th: every level-3 section, plus one level down — a child page of every sub-section
//    that has its own children (e.g. offers-promotions/special-offers/*, earn-miles/credit-card-partners/*)
const enth = all.filter((u) => segs(u)[0] === 'en-th');
const sec = (u) => { const s = segs(u); return s[1] === 'content' ? `content/${s[2] || ''}` : s[1] || '(home)'; };
const subKey = (u) => { const s = segs(u); return s.slice(0, s[1] === 'content' ? 4 : 3).join('/'); };
Object.values(groupBy(enth, sec)).forEach((list) => {
  const n = list.length >= 20 ? 3 : list.length >= 5 ? 2 : 1;
  spread(list, n, subKey).forEach(add);
});
Object.values(groupBy(enth, subKey)).filter((list) => list.length >= 2).forEach((list) => {
  const depth = (u) => segs(u).length;
  add(list.slice().sort((a, b) => depth(b) - depth(a))[0]); // a child page, not the sub-section landing
});

// 2) key pages in other languages/regions — home + one page per top-level section (section slugs
//    are translated in de/fr/it, so take whatever top-level sections each locale has) + offers + news
['th-th', 'ja-jp', 'zh-cn', 'ko-kr', 'de-de', 'fr-fr', 'it-it', 'en-us'].forEach((loc) => {
  const L = all.filter((u) => segs(u)[0] === loc);
  add(L.find((u) => segs(u).length === 1));
  Object.values(groupBy(L.filter((u) => segs(u).length >= 2 && segs(u)[1] !== 'content'), (u) => segs(u)[1])).forEach((g) => add(g[0]));
  add(L.find((u) => segs(u)[1] === 'content' && /offer|promo/.test(segs(u)[2] || '') && segs(u).length >= 4));
  add(L.find((u) => segs(u)[1] === 'content' && /news/.test(segs(u)[2] || '') && segs(u).length >= 4));
});

// 3) flights: one page of every kind (hub, destination, origin, pair, business-class route,
//    HTML sitemap listing, campaign/deal) in 5 languages
const { flightKind } = require('./flight-kinds.js');
['en-th', 'th-th', 'ja-jp', 'zh-cn', 'de-de'].forEach((loc) => {
  const F = all.filter((u) => segs(u)[0] === 'flights' && segs(u)[1] === loc);
  Object.values(groupBy(F, (u) => flightKind(segs(u)))).forEach((g) => add(g[0]));
});

// 4) extra flights samples per kind (requested on top of the above), spread round-robin across
//    languages, preferring distinct slugs (routes/campaigns) before repeating one in another
//    locale — the en-* locales share the same slugs. Hubs are one per locale, so no slug check.
const EXTRA = { pair: 20, destination: 20, origin: 20, 'campaign-or-deal': 100, 'business-class-route': 20, 'html-sitemap-listing': 10, hub: 10 };
const flights = all.filter((u) => segs(u)[0] === 'flights');
Object.entries(EXTRA).forEach(([kind, n]) => {
  const pool = flights.filter((u) => flightKind(segs(u)) === kind && !phaseA.includes(u));
  const byLocale = Object.values(groupBy(pool, (u) => segs(u)[1]));
  const rr = [];
  for (let i = 0; byLocale.some((g) => g.length > i); i++) byLocale.forEach((g) => { if (g[i]) rr.push(g[i]); });
  const slug = (u) => segs(u).slice(2).join('/');
  const seen = new Set(); const picks = [];
  rr.forEach((u) => { if (picks.length < n && (kind === 'hub' || !seen.has(slug(u)))) { picks.push(u); seen.add(slug(u)); } });
  rr.forEach((u) => { if (picks.length < n && !picks.includes(u)) picks.push(u); });
  picks.forEach(add);
});

// Phase B: everything else, round-robin across (locale|flights-locale) x section buckets
const setA = new Set(phaseA);
const bucket = (u) => { const s = segs(u); return s[0] === 'flights' ? `flights/${s[1]}/${flightKind(s)}` : `${s[0]}/${sec(u)}`; };
const buckets = Object.values(groupBy(all.filter((u) => !setA.has(u)), bucket));
const rest = [];
for (let i = 0; buckets.some((b) => b.length > i); i++) buckets.forEach((b) => { if (b[i]) rest.push(b[i]); });

const meta = (urls, strategy) => ({ captured: new Date().toISOString(), strategy, totalLivePages: all.length, renderCount: urls.length, urls });
fs.writeFileSync(path.join(CF, 'render-set.json'), JSON.stringify(meta(phaseA, 'Phase A: every en-th section (1-3 samples) + a child page of every en-th sub-section that has children + key pages per top-level section in th-th/ja-jp/zh-cn/ko-kr/de-de/fr-fr/it-it/en-us + every flights page kind in 5 languages + extra flights samples per kind (pair/destination/origin 20, campaign 100, business-class 20, listing 10, hub 10)'), null, 1));
fs.writeFileSync(path.join(CF, 'render-set-all.json'), JSON.stringify(meta([...phaseA, ...rest], 'Phase B: ALL live pages (Phase A first, then round-robin across locale x section buckets)'), null, 1));
console.log(`phase A: ${phaseA.length} pages | phase B (all): ${phaseA.length + rest.length} pages | buckets: ${buckets.length}`);
console.log(`  en-th: ${phaseA.filter((u) => segs(u)[0] === 'en-th').length} | other locales: ${phaseA.filter((u) => !['en-th', 'flights'].includes(segs(u)[0])).length} | flights: ${phaseA.filter((u) => segs(u)[0] === 'flights').length}`);
