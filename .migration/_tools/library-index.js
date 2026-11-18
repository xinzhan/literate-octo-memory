#!/usr/bin/env node
// Index every block variant across site catalogs and build labelled contact sheets for review.
// Usage: node library-index.js <outDir> <catalogFolder>...
//  -> <outDir>/variants-index.json, <outDir>/sheets/<base>-<n>.jpg (ImageMagick montage)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [outDir, ...cfs] = process.argv.slice(2);
const sheetDir = path.join(outDir, 'sheets');
fs.mkdirSync(sheetDir, { recursive: true });
const PER_SHEET = 20;

const variants = [];
for (const cf of cfs) {
  const site = path.basename(cf).replace(/-scope$/, '');
  const cat = JSON.parse(fs.readFileSync(path.join(cf, 'block-catalog.json'), 'utf8'));
  for (const v of cat.variants) {
    variants.push({
      site, base: v.base, key: v.key, instances: v.instances, pages: v.pagesFound,
      repFile: path.join(cf, 'blocks', v.repFile), repUrl: v.repUrl,
      samples: (v.samples || []).map((s) => ({ url: s.url, file: path.join(cf, 'blocks', s.file) })),
    });
  }
}
// stable ids per base, most-used first
const byBase = {};
variants.forEach((v) => (byBase[v.base] = byBase[v.base] || []).push(v));
for (const [base, list] of Object.entries(byBase)) {
  list.sort((a, b) => b.instances - a.instances || a.site.localeCompare(b.site));
  list.forEach((v, i) => { v.id = `${base}-${String(i + 1).padStart(3, '0')}`; });
}
fs.writeFileSync(path.join(outDir, 'variants-index.json'), JSON.stringify(variants, null, 1));

for (const [base, list] of Object.entries(byBase)) {
  const usable = list.filter((v) => fs.existsSync(v.repFile));
  for (let s = 0; s * PER_SHEET < usable.length; s++) {
    const chunk = usable.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
    const args = [];
    for (const v of chunk) args.push('-label', `${v.id} ${v.site} x${v.instances}/${v.pages}p`, v.repFile);
    const out = path.join(sheetDir, `${base}-${s + 1}.jpg`);
    execFileSync('montage', [...args, '-font', 'DejaVu-Sans', '-tile', '5x', '-geometry', '300x260>+6+6', '-pointsize', '15', '-background', '#ffffff', '-quality', '70', out]);
  }
}
const summary = Object.entries(byBase).map(([b, l]) => `${b}:${l.length}`).join(' ');
console.log('variants', variants.length, '|', summary);
console.log('sheets:', fs.readdirSync(sheetDir).join(' '));
