#!/usr/bin/env node
/*
 * scan-levels.js — offline structure scan of urls-all.json one level below the section level
 * (no requests to the site). Writes level-scan.json and prints a summary.
 * Usage: node scan-levels.js <catalogFolder>
 */
const fs = require('fs');
const path = require('path');

const CF = process.argv[2] || __dirname;
const clean = (u) => u.replace(/^(https?:\/\/[^/]+)\/+/, '$1/');
const urls = [...new Set(JSON.parse(fs.readFileSync(path.join(CF, 'urls-all.json'), 'utf8'))['analysis-urls-all'].urls.map((u) => clean(u.url)))];
const segs = (u) => decodeURI(new URL(u).pathname).split('/').filter(Boolean).map((s) => s.toLowerCase());
const count = (arr) => arr.reduce((m, k) => { m[k] = (m[k] || 0) + 1; return m; }, {});
const sortDesc = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]);

// section = level below locale ("content/x" counts as one level, since /content/ is just a container)
const secOf = (s) => (s[1] === 'content' ? `content/${s[2] || ''}` : s[1] || '(home)');
const subOf = (s) => (s[1] === 'content' ? s[3] : s[2]) || '(section landing)';
const depthBelowSub = (s) => Math.max(0, s.length - (s[1] === 'content' ? 4 : 3));

const loc = urls.filter((u) => segs(u)[0] !== 'flights').map(segs);
const fl = urls.filter((u) => segs(u)[0] === 'flights').map(segs);

// 1) en-th: section -> sub-sections
const enth = loc.filter((s) => s[0] === 'en-th');
const tree = {};
enth.forEach((s) => {
  const sec = secOf(s); const sub = subOf(s);
  tree[sec] = tree[sec] || { pages: 0, subs: {} };
  tree[sec].pages++;
  tree[sec].subs[sub] = tree[sec].subs[sub] || { pages: 0, deeper: 0 };
  tree[sec].subs[sub].pages++;
  if (depthBelowSub(s) > 0) tree[sec].subs[sub].deeper++;
});
const subCount = Object.values(tree).reduce((n, t) => n + Object.keys(t.subs).length, 0);
console.log(`en-th: ${enth.length} pages | ${Object.keys(tree).length} sections | ${subCount} sub-sections`);
console.log('\nsections with more than one sub-section (pages → sub-sections, largest subs):');
sortDesc(Object.fromEntries(Object.entries(tree).map(([k, v]) => [k, v.pages]))).forEach(([sec]) => {
  const t = tree[sec]; const subs = sortDesc(Object.fromEntries(Object.entries(t.subs).map(([k, v]) => [k, v.pages])));
  if (subs.length > 1) console.log(`  ${sec}: ${t.pages} pages → ${subs.length} subs | ${subs.slice(0, 6).map(([k, v]) => `${k}(${v})`).join(', ')}${subs.length > 6 ? ', …' : ''}`);
});
const singles = Object.entries(tree).filter(([, t]) => Object.keys(t.subs).length === 1).map(([k]) => k);
console.log(`\nsingle-page / single-sub sections: ${singles.length}`);

// 2) depth distribution below the sub-section (en-th)
console.log('\nen-th depth below sub-section:', JSON.stringify(count(enth.map(depthBelowSub))));

// 3) cross-locale consistency: does every locale mirror en-th's sections?
const locales = [...new Set(loc.map((s) => s[0]))];
const secByLoc = {}; locales.forEach((l) => { secByLoc[l] = new Set(loc.filter((s) => s[0] === l).map(secOf)); });
const enSecs = secByLoc['en-th'];
const cross = locales.map((l) => {
  const S = secByLoc[l];
  const shared = [...S].filter((x) => enSecs.has(x)).length;
  return { locale: l, pages: loc.filter((s) => s[0] === l).length, sections: S.size, sharedWithEnTh: shared, localOnly: [...S].filter((x) => !enSecs.has(x)) };
}).sort((a, b) => a.sharedWithEnTh / a.sections - b.sharedWithEnTh / b.sections);
console.log('\nlocales least like en-th (sections shared / total, local-only examples):');
cross.slice(0, 10).forEach((c) => console.log(`  ${c.locale}: ${c.sharedWithEnTh}/${c.sections} shared | local-only ${c.localOnly.length}: ${c.localOnly.slice(0, 5).join(', ')}`));
const allSecs = count(loc.map((s) => `${secOf(s)}`));
const secLocales = {}; loc.forEach((s) => { const k = secOf(s); (secLocales[k] = secLocales[k] || new Set()).add(s[0]); });
const universal = Object.keys(secLocales).filter((k) => secLocales[k].size >= locales.length - 2).length;
console.log(`\nsections across all locales: ${Object.keys(allSecs).length} | present in ≥${locales.length - 2} of ${locales.length} locales: ${universal}`);

// 4) flights one level down: page kinds by slug shape
const { flightKind } = require('./flight-kinds.js');
const fk = count(fl.map(flightKind));
console.log(`\nflights: ${fl.length} pages across ${new Set(fl.map((s) => s[1])).size} locales`);
sortDesc(fk).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
const other = fl.filter((s) => flightKind(s) === 'campaign-or-deal').map((s) => s[2]);
console.log('  campaign-or-deal samples:', other.slice(0, 8).join(' | '));
const deep = fl.filter((s) => s.length >= 5).map((s) => s.slice(2).join('/'));
console.log('  deep samples:', deep.slice(0, 5).join(' | '));

fs.writeFileSync(path.join(CF, 'level-scan.json'), JSON.stringify({ captured: new Date().toISOString(), enthTree: tree, crossLocale: cross, flightKinds: fk }, null, 1));
