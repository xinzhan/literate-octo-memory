const { chromium } = require('playwright-core');
const { settle } = require('/backups/xinzhan/literate-octo-memory/repo/.claude/skills/site-analysis-dashboard/scripts/settle.js');
(async () => {
  const b = await chromium.launch({ args: ['--disable-http2'] });
  const p = await (await b.newContext({ userAgent: process.env.SCOPE_UA, viewport: { width: 1440, height: 900 } })).newPage();
  await p.goto(process.argv[2], { waitUntil: 'domcontentloaded', timeout: 45000 }); await settle(p);
  console.log(await p.evaluate(() => {
    const out = [];
    const main = document.querySelector('main, #main, .main, #contents, .contents, #content, .content, [role=main]') || document.body;
    out.push('main=' + main.tagName + '.' + main.className + ' h=' + main.getBoundingClientRect().height);
    const vis = (el) => Array.from(el.children).filter((c) => { const t = c.tagName; if (['SCRIPT','STYLE','NOSCRIPT','TEMPLATE'].includes(t)) return false; const s = getComputedStyle(c); if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') return false; return c.offsetHeight > 8; });
    const d = (el, depth) => { if (depth > 6) return; for (const c of vis(el)) { out.push('  '.repeat(depth) + c.tagName.toLowerCase() + '.' + String(c.className).slice(0, 70) + ' h=' + Math.round(c.getBoundingClientRect().height)); d(c, depth + 1); } };
    d(main, 0);
    return out.slice(0, 40).join('\n');
  }));
  await b.close();
})();
