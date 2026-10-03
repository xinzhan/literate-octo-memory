const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file://' + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: process.argv[3], type: 'jpeg', quality: 60 });
  await b.close();
})();
