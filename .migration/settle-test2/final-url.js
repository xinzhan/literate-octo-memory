const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ args: ['--disable-http2'] });
  const ctx = await b.newContext({ userAgent: process.env.SCOPE_UA });
  for (const u of process.argv.slice(2)) {
    const p = await ctx.newPage();
    try {
      const r = await p.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await p.waitForTimeout(6000);
      console.log(r.status(), (await p.title()).slice(0, 40), '|', u.split('/content/')[1], '->', p.url().replace('https://www.thaiairways.com', ''));
    } catch (e) { console.log('err', e.message.slice(0, 80)); }
    await p.close(); await new Promise((res) => setTimeout(res, 8000));
  }
  await b.close();
})();
