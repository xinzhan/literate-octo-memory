#!/usr/bin/env node
/*
 * fetch-sitemaps.js — stage-1 replacement for sites whose WAF blocks plain HTTP (the skill's
 * crawler uses curl). Loads every robots.txt-listed sitemap through headless Chromium, follows
 * sitemap indexes, drops robots-disallowed URLs, and writes .crawl.out (array of URLs) for
 * build-urls-all.js. Honours robots Crawl-Delay between requests. Resumable via sitemaps.json.
 * Usage: node fetch-sitemaps.js <catalogFolder>
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const CF = process.argv[2] || __dirname;
const robots = fs.readFileSync(path.join(CF, 'robots.txt'), 'utf8');
const DELAY = (parseFloat((robots.match(/^Crawl-Delay:\s*([\d.]+)/mi) || [])[1]) || 5) * 1000;

// robots rules (User-agent: * group) -> regexes; `*` wildcard, `$` end anchor, longest match wins
const toRe = (p) => new RegExp(`^${p.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')}`);
const rules = [];
robots.split('\n').forEach((line) => {
  const m = line.match(/^(Allow|Disallow):\s*(\S+)/i);
  if (m) rules.push({ allow: /^allow$/i.test(m[1]), len: m[2].length, re: toRe(m[2]) });
});
const allowed = (u) => {
  const { pathname, search } = new URL(u);
  const hits = rules.filter((r) => r.re.test(pathname + search)).sort((a, b) => b.len - a.len);
  return !hits.length || hits[0].allow;
};

const stateFile = path.join(CF, 'sitemaps.json');
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : { sitemaps: {} };
const save = () => fs.writeFileSync(stateFile, JSON.stringify(state, null, 1));
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
const locs = (xml, tag) => [...xml.matchAll(new RegExp(`<${tag}>[\\s\\S]*?<loc>\\s*([^<\\s]+)\\s*</loc>`, 'g'))]
  .map((m) => m[1].replace(/&amp;/g, '&'));

(async () => {
  const queue = [...robots.matchAll(/^Sitemap:\s*(\S+)/gmi)].map((m) => m[1]);
  const browser = await chromium.launch({ executablePath: '/ms-playwright/chromium-1205/chrome-linux64/chrome', args: ['--no-sandbox', '--disable-http2'] });
  const page = await browser.newPage();
  console.log(`sitemaps listed: ${queue.length} | crawl-delay ${DELAY / 1000}s | ua: ${await page.evaluate(() => navigator.userAgent)}`);
  while (queue.length) {
    const sm = queue.shift();
    if (state.sitemaps[sm] && state.sitemaps[sm].status === 200) {
      (state.sitemaps[sm].children || []).forEach((c) => queue.push(c));
      continue;
    }
    let status = 0; let xml = '';
    try {
      const res = await page.goto(sm, { waitUntil: 'domcontentloaded', timeout: 60000 });
      status = res.status(); xml = await res.text();
    } catch (e) { status = `ERR ${e.message.split('\n')[0]}`; }
    const children = status === 200 ? locs(xml, 'sitemap') : [];
    const urls = status === 200 ? locs(xml, 'url') : [];
    children.forEach((c) => queue.push(c));
    const kept = urls.filter(allowed);
    state.sitemaps[sm] = { status, children, urls: kept, disallowed: urls.length - kept.length };
    save();
    console.log(`${status}  ${sm}  urls=${kept.length}${urls.length - kept.length ? ` (robots-dropped ${urls.length - kept.length})` : ''}${children.length ? ` children=${children.length}` : ''}`);
    await sleep(DELAY);
  }
  await browser.close();
  const all = [...new Set(Object.values(state.sitemaps).flatMap((s) => s.urls))];
  fs.writeFileSync(path.join(CF, '.crawl.out'), JSON.stringify(all));
  const failed = Object.entries(state.sitemaps).filter(([, s]) => s.status !== 200);
  console.log(`DONE unique urls=${all.length} | sitemaps ok=${Object.keys(state.sitemaps).length - failed.length} failed=${failed.length}`);
})();
