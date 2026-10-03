#!/usr/bin/env node
/*
 * reset-empty.js — queue pages for re-capture with the fixed block detector:
 * every page that rendered ok but has no captured blocks (incl. Cloudflare-blocked captures).
 * Removes their pages.jsonl/blocks.jsonl records and the runner's .done markers, keeps
 * genuine page errors (broken redirect, timeouts), and de-duplicates error records.
 * Usage: node reset-empty.js <CF> [--dry]
 */
const fs = require('fs');
const crypto = require('crypto');

const CF = process.argv[2];
const DRY = process.argv.includes('--dry');
const rd = (f) => fs.readFileSync(`${CF}/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const wr = (f, recs) => fs.writeFileSync(`${CF}/${f}`, recs.map((r) => JSON.stringify(r)).join('\n') + (recs.length ? '\n' : ''));

const P = rd('pages.jsonl');
const B = rd('blocks.jsonl');
const captured = new Set(B.filter((r) => r.status !== 'error').map((r) => r.pageUrl));
const redo = new Set(P.filter((r) => r.status === 'ok' && !captured.has(r.url)).map((r) => r.url));

// keep one record per page: drop redo pages, de-dupe the rest (last record wins)
const pagesOut = [...new Map(P.filter((r) => !redo.has(r.url)).map((r) => [r.url, r])).values()];
const blocksOut = B.filter((r) => !redo.has(r.pageUrl));

const sections = new Set([...redo].map((u) => u.split('/th-th/content/')[1].split('/')[0]));
const markers = [...[...sections].map((s) => `${CF}/.done/${s}`),
  ...[...redo].map((u) => `${CF}/.done/blk${crypto.createHash('md5').update(u).digest('hex').slice(0, 12)}`)];

console.log(`redo pages: ${redo.size} in ${sections.size} sections | pages.jsonl ${P.length} -> ${pagesOut.length} | blocks.jsonl ${B.length} -> ${blocksOut.length}`);
if (DRY) process.exit(0);
wr('pages.jsonl', pagesOut);
wr('blocks.jsonl', blocksOut);
let n = 0;
markers.forEach((m) => { try { fs.unlinkSync(m); n += 1; } catch (e) { /* not present */ } });
fs.writeFileSync(`${CF}/redo-pages.json`, JSON.stringify([...redo].sort(), null, 1));
console.log(`removed ${n} markers; list saved to redo-pages.json`);
