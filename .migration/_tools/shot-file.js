#!/usr/bin/env node
// Screenshot a local HTML file (light + dark) for visual QA, and report layout overflow.
// Usage: NODE_PATH=... node shot-file.js <file.html> <outPrefix>
const { chromium } = require('playwright-core');
(async () => {
  const [file, out] = process.argv.slice(2);
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1360, height: 900 }, colorScheme: scheme });
    page.setDefaultTimeout(15000);
    await page.goto('file://' + file, { waitUntil: 'load' });
    const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('section')).filter((s) => s.scrollWidth > s.clientWidth + 2).map((s) => s.id));
    console.log(scheme, 'sections overflowing horizontally:', overflow.join(', ') || 'none');
    await page.screenshot({ path: `${out}-${scheme}.jpg`, type: 'jpeg', quality: 70, fullPage: true });
    await page.close();
  }
  await browser.close();
})();
