const fs = require('fs');
const rd = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const [, , T, CF] = process.argv;
const np = rd(`${T}/pages.jsonl`); const nb = rd(`${T}/blocks.jsonl`);
const op = rd(`${CF}/pages.jsonl`); const ob = rd(`${CF}/blocks.jsonl`);
for (const p of np) {
  const o = op.find((x) => x.url === p.url) || {};
  const types = (arr) => arr.filter((b) => b.pageUrl === p.url && b.type).map((b) => b.type).join(',');
  console.log(p.url.split('/content/')[1]);
  console.log('   render OLD', o.blockCount, `[${o.signature}]`);
  console.log('   render NEW', p.blockCount, `[${p.signature}]`);
  console.log('   blocks OLD', types(ob));
  console.log('   blocks NEW', types(nb));
}
