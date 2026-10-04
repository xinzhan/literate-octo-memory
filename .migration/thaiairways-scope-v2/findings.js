#!/usr/bin/env node
// findings.js — final numbers for the summary: coverage, page errors, homepage redirects, blocks
const fs = require('fs');

const CF = process.argv[2];
const rd = (f) => fs.readFileSync(`${CF}/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const P = [...new Map(rd('pages.jsonl').map((r) => [r.url, r])).values()];
const B = rd('blocks.jsonl');
const short = (u) => u.replace('https://www.thaiairways.com', '');

const ok = P.filter((r) => r.status === 'ok');
const err = P.filter((r) => r.status === 'error');
const withBlocks = new Set(B.filter((r) => r.status !== 'error').map((r) => r.pageUrl));
const HOME = /^Flight Tickets Online \| Book International/;
const STUB = /^Thai Airways \| Book International Tickets Online/;
const toHome = ok.filter((r) => HOME.test(r.title || '') && r.url !== 'https://www.thaiairways.com/th-th/');
const stubTitle = ok.filter((r) => STUB.test(r.title || ''));
const empty = ok.filter((r) => !withBlocks.has(r.url));

console.log(`pages: ${P.length} records | rendered ok ${ok.length} | errors ${err.length} | with captured blocks ${withBlocks.size}`);
err.forEach((r) => console.log(`  ERROR ${short(r.url)} — ${(r.error || '').split('\n')[0].slice(0, 110)}`));
const bySec = (arr) => { const c = {}; arr.forEach((r) => { const s = r.url.split('/content/')[1].split('/')[0]; c[s] = (c[s] || 0) + 1; }); return JSON.stringify(c); };
console.log(`homepage-titled (redirect to /th-th/): ${toHome.length} ${bySec(toHome)}`);
console.log(`generic "Book International Tickets Online" title: ${stubTitle.length} ${bySec(stubTitle)}`);
console.log(`rendered ok but no blocks captured: ${empty.length} ${bySec(empty)}`);
const cat = JSON.parse(fs.readFileSync(`${CF}/block-catalog.json`, 'utf8'));
const variants = cat.variants || cat.blocks || cat;
const byType = {};
(Array.isArray(variants) ? variants : Object.values(variants)).forEach((v) => {
  const t = v.type || v.baseType; byType[t] = byType[t] || { variants: 0, instances: 0 };
  byType[t].variants += 1; byType[t].instances += v.count || v.instances || 0;
});
console.log('block catalog by type:', JSON.stringify(byType));
const lay = JSON.parse(fs.readFileSync(`${CF}/layouts.json`, 'utf8'));
const fam = {};
lay.templates.forEach((t) => { fam[t.family] = (fam[t.family] || 0) + (t.estPop || 0); });
console.log(`layouts: ${lay.templates.length} signatures | families ${JSON.stringify(fam)}`);
