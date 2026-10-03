const { chromium } = require('playwright-core');
const { settle } = require('/backups/xinzhan/literate-octo-memory/repo/.claude/skills/site-analysis-dashboard/scripts/settle.js');
(async () => {
  const b = await chromium.launch({ args: ['--disable-http2'] });
  const p = await (await b.newContext({ userAgent: process.env.SCOPE_UA, viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto(process.argv[2], { waitUntil: 'domcontentloaded', timeout: 45000 }); await settle(p);
  await p.screenshot({ path: process.argv[3], fullPage: true, type: 'jpeg', quality: 50 });
  console.log(await p.evaluate(() => { const r = document.querySelector('.root') || document.body; const walk = (e, d) => d > 4 ? [] : [...e.children].filter(c => c.innerText && c.innerText.length > 20).map(c => '  '.repeat(d) + c.tagName.toLowerCase() + '.' + String(c.className).split(' ').slice(0, 2).join('.') + ' (' + c.innerText.length + ')').concat(...[...e.children].map(c => walk(c, d + 1))); return walk(r, 0).slice(0, 30).join('\n'); }));
  await b.close();
})();
