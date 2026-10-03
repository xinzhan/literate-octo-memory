#!/usr/bin/env node
// probe-structure.js — inspect why the block finder sees no blocks on a page
const { chromium } = require('playwright-core');

(async () => {
  const b = await chromium.launch({ args: ['--disable-http2'] });
  const ctx = await b.newContext({ userAgent: process.env.SCOPE_UA, viewport: { width: 1440, height: 900 } });
  for (const u of process.argv.slice(2)) {
    const p = await ctx.newPage();
    const r = await p.goto(u, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const snap = async (label) => console.log(label, JSON.stringify(await p.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const shadowHosts = [...document.querySelectorAll('*')].filter((e) => e.shadowRoot).length;
      return {
        title: document.title.slice(0, 40),
        mainTag: main.tagName,
        mainChildren: main.children.length,
        bodyText: document.body.innerText.length,
        mainText: main.innerText.length,
        iframes: document.querySelectorAll('iframe').length,
        shadowHosts,
        topChildren: [...main.children].slice(0, 8).map((c) => `${c.tagName.toLowerCase()}.${(c.className || '').toString().split(' ')[0]}(${c.innerText.length})`),
      };
    })));
    console.log('==', r.status(), u.split('/content/')[1]);
    await p.waitForTimeout(1000); await snap(' t+1s ');
    await p.waitForTimeout(5000); await snap(' t+6s ');
    await p.close();
    await new Promise((res) => setTimeout(res, 8000));
  }
  await b.close();
})();
