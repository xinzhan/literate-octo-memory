#!/usr/bin/env node
// diagnose.js — compare render fingerprints vs block-capture records per page
const fs = require('fs');
const CF = process.argv[2];
const rd = (f) => (fs.existsSync(`${CF}/${f}`) ? fs.readFileSync(`${CF}/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const P = rd('pages.jsonl');
const B = rd('blocks.jsonl');
const okBlocks = new Set(B.filter((r) => r.status !== 'error').map((r) => r.pageUrl));
const errBlocks = new Set(B.filter((r) => r.status === 'error').map((r) => r.pageUrl));
const okPages = P.filter((r) => r.status === 'ok');
const noBlk = okPages.filter((r) => !okBlocks.has(r.url));
const bc = {};
noBlk.forEach((r) => { bc[r.blockCount] = (bc[r.blockCount] || 0) + 1; });
console.log('rendered ok', okPages.length, '| pages with captured blocks', okBlocks.size, '| block-capture errors', errBlocks.size);
console.log('rendered-ok pages without captured blocks:', noBlk.length, '-> render blockCount histogram', JSON.stringify(bc));
const bySec = {};
noBlk.forEach((r) => { const s = r.url.split('/content/')[1].split('/')[0]; bySec[s] = (bySec[s] || 0) + 1; });
console.log('by section', JSON.stringify(bySec));
console.log('examples:', noBlk.slice(0, 3).map((r) => `${r.url} [${r.signature}]`).join('\n  '));
