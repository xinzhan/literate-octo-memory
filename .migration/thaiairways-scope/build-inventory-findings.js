#!/usr/bin/env node
/*
 * build-inventory-findings.js — Thai Airways inventory findings for the inventory-only dashboard
 * (see build-dashboard.js, config.inventoryOnly). Every figure is computed from urls-all.json and
 * sitemaps.json; nothing is fetched. Writes inventory-findings.json.
 * Usage: node build-inventory-findings.js <catalogFolder>
 */
const fs = require('fs');
const path = require('path');
const { flightKind } = require('./flight-kinds.js');

const CF = process.argv[2] || __dirname;
const rd = (f) => JSON.parse(fs.readFileSync(path.join(CF, f), 'utf8'));
const raw = rd('urls-all.json')['analysis-urls-all'].urls.map((u) => u.url);
const sitemaps = rd('sitemaps.json').sitemaps;
const nf = (n) => Number(n).toLocaleString('en-US');
const clean = (u) => u.replace(/^(https?:\/\/[^/]+)\/+/, '$1/');
const urls = [...new Set(raw.map(clean))];
const segs = (u) => decodeURI(new URL(u).pathname).split('/').filter(Boolean).map((s) => s.toLowerCase());
const pathOf = (u) => new URL(u).pathname;
const count = (arr) => arr.reduce((m, k) => { m[k] = (m[k] || 0) + 1; return m; }, {});
const groupBy = (arr, key) => arr.reduce((m, x) => { (m[key(x)] = m[key(x)] || []).push(x); return m; }, {});

const locUrls = urls.filter((u) => segs(u)[0] !== 'flights');
const flUrls = urls.filter((u) => segs(u)[0] === 'flights');
const locales = Object.keys(groupBy(locUrls, (u) => segs(u)[0]));
const perLocale = Object.values(groupBy(locUrls, (u) => segs(u)[0])).map((l) => l.length);
const flLocales = new Set(flUrls.map((u) => segs(u)[1]));
const sec = (s) => (s[1] === 'content' ? `content/${s[2] || ''}` : s[1] || '(home)');
const subKey = (s) => s.slice(0, s[1] === 'content' ? 4 : 3).join('/');
const inContent = locUrls.filter((u) => segs(u)[1] === 'content').length;

// en-th reference tree
const enth = locUrls.filter((u) => segs(u)[0] === 'en-th').map(segs);
const enthSecs = new Set(enth.map(sec));
const enthSubs = new Set(enth.map(subKey));

// cross-locale section consistency
const secLocales = {};
locUrls.forEach((u) => { const s = segs(u); (secLocales[sec(s)] = secLocales[sec(s)] || new Set()).add(s[0]); });
const universal = Object.values(secLocales).filter((set) => set.size >= locales.length - 2).length;
const translated = ['de-de', 'fr-fr', 'it-it'].map((l) => {
  const S = new Set(locUrls.filter((u) => segs(u)[0] === l).map((u) => sec(segs(u))));
  return `${l} ${[...S].filter((x) => !enthSecs.has(x)).length}`;
});

// flights page types
const byKind = groupBy(flUrls, (u) => flightKind(segs(u)));
const kn = (k) => (byKind[k] || []).length;
const campaigns = byKind['campaign-or-deal'] || [];
const campSlugs = new Set(campaigns.map((u) => segs(u)[2]));
const enCamp = new Set(campaigns.filter((u) => segs(u)[1].startsWith('en')).map((u) => segs(u)[2]));
const enCampLocales = new Set(campaigns.filter((u) => segs(u)[1].startsWith('en')).map((u) => segs(u)[1]));
const UTIL = /privacy|bootstrap|destination-information/;
const utilCamp = [...campSlugs].filter((s) => UTIL.test(s));
const nonLatin = flUrls.filter((u) => /[^\x00-\x7F]/.test(decodeURI(pathOf(u)))).length;

// housekeeping candidates
const dated = locUrls.filter((u) => /privacy[-_]policy[-_]\d|historical[-_]change/.test(segs(u).join('/'))).length;
const redirects = locUrls.filter((u) => segs(u)[2] === 'redirect').length;
const technical = locUrls.filter((u) => /(^|\/)(healthcheck|under-maintenance)(\/|$)/.test(segs(u).join('/'))).length;
const dbl = raw.filter((u) => /^https?:\/\/[^/]+\/\//.test(u));
const dblMaps = Object.entries(sitemaps).filter(([, v]) => v.urls.some((u) => /^https?:\/\/[^/]+\/\//.test(u))).map(([k]) => k.replace(/^https?:\/\/[^/]+/, ''));

// page types table: locale homes, top sections (all locales), then flights types
const sample = (list) => { const en = list.find((u) => segs(u)[0] === 'en-th' || segs(u)[1] === 'en-th'); return pathOf(en || list[0]); };
const pageTypes = [];
const homes = locUrls.filter((u) => segs(u).length === 1);
pageTypes.push({ type: 'Locale homepage', pages: homes.length, description: `One per locale site (${locales.length} locales).`, sampleUrl: sample(homes) });
const secGroups = Object.entries(groupBy(locUrls.filter((u) => segs(u).length > 1), (u) => sec(segs(u)))).sort((a, b) => b[1].length - a[1].length);
secGroups.slice(0, 20).forEach(([k, list]) => {
  // distinct sub-section names, not counting each locale's copy separately
  const subs = new Set(list.map((u) => subKey(segs(u)).split('/').slice(1).join('/'))).size;
  const nl = secLocales[k].size;
  pageTypes.push({ type: `Section: ${k.replace(/^content\//, '')}`, pages: list.length, description: `${nl} locale${nl === 1 ? '' : 's'} · ${subs} distinct sub-sections/pages at the next level.`, sampleUrl: sample(list) });
});
const restSec = secGroups.slice(20);
pageTypes.push({ type: `Other sections (${restSec.length})`, pages: restSec.reduce((a, [, l]) => a + l.length, 0), description: 'Smaller sections, legal/policy pages and locale-specific sections (incl. translated section URLs in de/fr/it).', sampleUrl: '' });
const FL = [
  ['pair', 'Flights — from X to Y', 'Generated route pages for city/country pairs, in every language.'],
  ['destination', 'Flights — to X', 'Generated destination pages.'],
  ['origin', 'Flights — from X', 'Generated origin pages.'],
  ['business-class-route', 'Flights — business-class route', 'Business-class route pages (English sites; Thai "ชั้นธุรกิจ" pages).'],
  ['campaign-or-deal', 'Flights — campaign / deal', `Campaign and deal landing pages: only ${campSlugs.size} distinct campaigns, repeated across country sites (${utilCamp.length} are utility pages, not campaigns).`],
  ['html-sitemap-listing', 'Flights — link-listing index', 'Paged HTML listings of routes (e.g. /flights/{locale}/sitemap/city-to-city-flights/page-N).'],
  ['hub', 'Flights — hub', 'One flights landing page per language/market.'],
];
FL.forEach(([k, type, description]) => pageTypes.push({ type, pages: kn(k), description, sampleUrl: byKind[k] ? sample(byKind[k]) : '' }));

const out = {
  kpis: [{ n: nf(flUrls.length), l: 'Generated flight pages' }, { n: String(enthSecs.size), l: 'Sections (en-th)' }],
  summary: [
    `${nf(locUrls.length)} pages sit on ${locales.length} locale sites (${Math.min(...perLocale)}–${Math.max(...perLocale)} pages each); ${nf(flUrls.length)} more are generated /flights/ route pages in ${flLocales.size} language/market variants.`,
    `The English–Thailand site (${enth.length} pages) has ${enthSecs.size} sections and ${enthSubs.size} sub-sections; the hierarchy goes at most about two levels below a section.`,
    `${universal} sections appear on at least ${locales.length - 2} of the ${locales.length} locale sites. German, French and Italian translate their section URLs (local-only sections: ${translated.join(', ')}).`,
    `Flight pages fall into ${FL.length} URL types: from-X-to-Y ${nf(kn('pair'))}, to-X ${nf(kn('destination'))}, from-X ${nf(kn('origin'))}, business-class ${nf(kn('business-class-route'))}, campaign/deal ${nf(kn('campaign-or-deal'))}, link-listing ${nf(kn('html-sitemap-listing'))}, hubs ${nf(kn('hub'))}.`,
  ],
  observations: [
    `${Math.round(inContent / locUrls.length * 100)}% of locale pages sit under a /content/ container folder that carries no meaning; section names start one level below it.`,
    `The /flights/ pages look programmatically generated from route data (${nf(kn('pair'))} from-X-to-Y pages alone), so they are likely a handful of templates fed by data, not hand-authored pages.`,
    `Only ${campSlugs.size} distinct campaign/deal pages exist: ${enCamp.size} English campaigns repeated on ${enCampLocales.size} English country sites, plus locale-only ones. ${utilCamp.length} of them are utility pages (${utilCamp.join(', ')}).`,
    `${nf(nonLatin)} flight URLs use non-Latin characters (Thai, Japanese, Chinese, Korean) in the address.`,
    `Housekeeping candidates in the inventory: ${dated} dated/historical privacy-policy versions, ${redirects} /content/redirect/ stubs, ${technical} technical pages (healthcheck, under-maintenance).`,
    `Sitemap data quality: ${dbl.length} entries have a doubled slash after the domain (${dblMaps.join(', ')}).`,
  ],
  recommendations: [
    'Model the /flights/ pages as data-driven templates (one per URL type) fed by route data, rather than migrating ~25k pages one by one.',
    `Treat the ${locales.length} locale sites as regional/translated variants of one content tree: migrate one reference tree (en-th) and localise, with a URL map for the translated section slugs in de/fr/it.`,
    'Decide the URL strategy for non-Latin slugs (keep, transliterate or redirect) before building the flights templates.',
    'Exclude or redirect rather than migrate: /content/redirect/ stubs, healthcheck/under-maintenance pages and flights utility pages; archive the dated privacy-policy versions.',
    'Fix the doubled-slash sitemap entries at source.',
  ],
  methodology: [
    `Structure scan one level below each section, and classification of flight URLs into ${FL.length} types using localised "from/to" wording (en, th, de, fr, it, no, sv, tr, ko, zh, ja).`,
  ],
  appendix: [
    `Discovery: ${Object.keys(sitemaps).length} sitemaps (${Object.keys(sitemaps).filter((k) => !/\/flights\//.test(k)).length} locale sitemaps plus the flights index and its ${Object.keys(sitemaps).filter((k) => /\/flights\/.+\/sitemap\.xml$/.test(k)).length} children), all fetched successfully; ${Object.values(sitemaps).reduce((a, v) => a + (v.disallowed || 0), 0)} listed URLs fell under robots Disallow rules.`,
    'A test render of 24 pages was blocked by Cloudflare after 3 pages and stopped immediately. Allowlisting was requested and declined; no further page requests were made.',
  ],
  page_types: pageTypes,
};
fs.writeFileSync(path.join(CF, 'inventory-findings.json'), JSON.stringify(out, null, 1));
console.log(`inventory-findings.json: ${out.summary.length} summary, ${out.observations.length} observations, ${out.recommendations.length} recommendations, ${out.page_types.length} page types`);
out.summary.concat(out.observations).forEach((s) => console.log(' -', s));
