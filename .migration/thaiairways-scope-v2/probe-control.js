#!/usr/bin/env node
// probe-control.js — is Cloudflare blocking us right now? Loads a known-good control page.
// Prints "ok" (control page loads normally) or "blocked" (403 / Service Notice / failure).
const { chromium } = require('playwright-core');

const CONTROL = 'https://www.thaiairways.com/th-th/content/our-fleet/';
(async () => {
  let verdict = 'blocked';
  const b = await chromium.launch({ args: ['--no-sandbox', '--disable-http2'] });
  try {
    const p = await (await b.newContext({ userAgent: process.env.SCOPE_UA })).newPage();
    const r = await p.goto(CONTROL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const title = await p.title();
    if (r && r.status() === 200 && !title.includes('Service Notice')) verdict = 'ok';
  } catch (e) { /* treat as blocked */ }
  await b.close();
  console.log(verdict);
})();
