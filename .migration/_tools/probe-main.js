#!/usr/bin/env node
// Diagnose which element the block finder treats as <main> on a page, and its child structure.
// Usage: NODE_PATH=... node probe-main.js <url>
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-http2'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(45000);
  await page.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const d = (el) => el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className || '').trim().split(/\s+/).slice(0, 3).join('.')} h=${Math.round(el.getBoundingClientRect().height)} kids=${el.children.length}` : null;
    const sels = ['main', '#main', '.main', '#contents', '.contents', '#content', '.content', '[role=main]'];
    const hits = sels.map((s) => [s, d(document.querySelector(s))]);
    const m = document.querySelector('main,#main,.main,#contents,.contents,#content,.content,[role=main]');
    const kids = m ? Array.from(m.children).map(d) : [];
    const body = Array.from(document.body.children).map(d);
    return { hits, chosen: d(m), kids, body };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();
