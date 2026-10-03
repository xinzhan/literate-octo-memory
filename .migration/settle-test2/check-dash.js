const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 150)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 150)); });
  await p.goto('file://' + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(3000);
  console.log(await p.evaluate(() => JSON.stringify({
    title: document.title,
    nav: [...document.querySelectorAll('nav a, .nav a, [data-section], .sidebar a')].map((a) => a.innerText.trim()).filter(Boolean).slice(0, 20),
    h2: [...document.querySelectorAll('h1,h2')].map((h) => h.innerText.trim()).filter(Boolean).slice(0, 20),
    imgs: document.images.length,
    brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
  }, null, 1)));
  console.log('errors:', errs.length, errs.slice(0, 5));
  await b.close();
})();
