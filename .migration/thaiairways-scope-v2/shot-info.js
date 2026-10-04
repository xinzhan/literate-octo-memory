#!/usr/bin/env node
// shot-info.js — which page each named template screenshot came from, plus the layout's members
const fs = require('fs');

const CF = process.argv[2];
const want = process.argv.slice(3);
const s = JSON.parse(fs.readFileSync(`${CF}/shots.json`, 'utf8'));
const shots = Array.isArray(s) ? s : (s.shots || []);
const lay = JSON.parse(fs.readFileSync(`${CF}/layouts.json`, 'utf8')).templates;
shots.filter((x) => want.some((w) => x.file.startsWith(w))).forEach((x) => {
  const t = lay[x.idx] || {};
  console.log(`${x.file} | estPop ${x.estPop} | sig ${x.signature} | ${x.url}`);
  (t.urls || []).slice(0, 12).forEach((u) => console.log(`    member: ${u.replace('https://www.thaiairways.com', '')}`));
});
