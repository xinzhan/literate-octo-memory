#!/usr/bin/env node
/*
 * sections.js — helpers for the section-by-section run (scope: /th-th/content/ only).
 *   node sections.js <CF> list                 -> prints sub-section keys in run order
 *   node sections.js <CF> add <section>        -> appends that section's URLs to render-set.json
 *   node sections.js <CF> errors <section>     -> prints "<total> <renderErrors> <blockErrors>"
 *   node sections.js <CF> strip <section>      -> removes error records for the section (so they retry)
 */
const fs = require('fs');
const path = require('path');

const [, , CF, cmd, section] = process.argv;
const PREFIX = '/th-th/content/';
const all = JSON.parse(fs.readFileSync(path.join(CF, 'urls-all.json'), 'utf8'))['analysis-urls-all'].urls.map((o) => o.url);

const keyOf = (u) => {
  const p = new URL(u).pathname;
  if (!p.startsWith(PREFIX)) return null;
  return p.slice(PREFIX.length).split('/').filter(Boolean)[0] || '(content-root)';
};
const bySection = {};
all.forEach((u) => { const k = keyOf(u); if (k) (bySection[k] = bySection[k] || []).push(u); });

const readJsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean) : []);

if (cmd === 'list') {
  console.log(Object.keys(bySection).sort((a, b) => a.localeCompare(b)).join('\n'));
} else if (cmd === 'add') {
  const f = path.join(CF, 'render-set.json');
  const rs = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { urls: [] };
  const urls = [...new Set([...(rs.urls || []), ...(bySection[section] || [])])];
  fs.writeFileSync(f, JSON.stringify({
    captured: new Date().toISOString(),
    strategy: `scope limited to ${PREFIX} (user request); every page rendered, section by section, concurrency 1 with delays`,
    totalLivePages: all.length,
    renderCount: urls.length,
    urls,
  }, null, 1));
  console.log(`render-set: +${(bySection[section] || []).length} (${section}) -> ${urls.length}`);
} else if (cmd === 'urls') {
  console.log((bySection[section] || []).join('\n'));
} else if (cmd === 'only' || cmd === 'final') {
  // 'only <url>': point render-set.json at one page (per-page pacing; jsonl outputs accumulate).
  // 'final': write the full in-scope set for the downstream stages (inspection, backend, dashboard).
  const urls = cmd === 'only' ? [section] : Object.keys(bySection).sort((a, b) => a.localeCompare(b)).flatMap((k) => bySection[k]);
  fs.writeFileSync(path.join(CF, 'render-set.json'), JSON.stringify({
    captured: new Date().toISOString(),
    strategy: `scope limited to ${PREFIX} (user request); every page rendered, section by section, one page at a time with delays`,
    totalLivePages: all.length,
    renderCount: urls.length,
    urls,
  }, null, 1));
} else if (cmd === 'state') {
  // 'state <url>' -> "<render> <blocks>" each one of: none | ok | blocked | error
  // blocked = Cloudflare block page (retry after cool-down); error = genuine page failure
  const st = (recs, key) => {
    const r = recs.filter((x) => x[key] === section);
    if (!r.length) return 'none';
    const e = r.find((x) => x.status === 'error');
    if (!e) return 'ok';
    return (e.error || '').startsWith('cloudflare-block') ? 'blocked' : 'error';
  };
  console.log(`${st(readJsonl(path.join(CF, 'pages.jsonl')), 'url')} ${st(readJsonl(path.join(CF, 'blocks.jsonl')), 'pageUrl')}`);
} else if (cmd === 'drop') {
  // 'drop <url>': remove error records for one page so it can be retried
  [['pages.jsonl', 'url'], ['blocks.jsonl', 'pageUrl']].forEach(([file, key]) => {
    const f = path.join(CF, file);
    if (!fs.existsSync(f)) return;
    const keep = readJsonl(f).filter((r) => !(r[key] === section && r.status === 'error'));
    fs.writeFileSync(f, keep.map((r) => JSON.stringify(r)).join('\n') + (keep.length ? '\n' : ''));
  });
} else if (cmd === 'timeout') {
  // 'timeout <url> <render|blocks> [message]': record a genuine page failure (kept as a finding),
  // by default a stage that hung past the hard limit
  const stage = process.argv[5] || 'render';
  const msg = process.argv[6] || `${stage} timeout: page never finished loading`;
  const [file, key] = stage === 'render' ? ['pages.jsonl', 'url'] : ['blocks.jsonl', 'pageUrl'];
  fs.appendFileSync(path.join(CF, file), `${JSON.stringify({ [key]: section, status: 'error', error: msg })}\n`);
} else if (cmd === 'errors') {
  const set = new Set(bySection[section] || []);
  const pe = readJsonl(path.join(CF, 'pages.jsonl')).filter((r) => set.has(r.url) && r.status === 'error').length;
  const be = readJsonl(path.join(CF, 'blocks.jsonl')).filter((r) => set.has(r.pageUrl) && r.status === 'error').length;
  console.log(`${set.size} ${pe} ${be}`);
} else if (cmd === 'strip') {
  const set = new Set(bySection[section] || []);
  [['pages.jsonl', 'url'], ['blocks.jsonl', 'pageUrl']].forEach(([file, key]) => {
    const f = path.join(CF, file);
    if (!fs.existsSync(f)) return;
    const keep = fs.readFileSync(f, 'utf8').split('\n').filter((l) => {
      if (!l.trim()) return false;
      try { const r = JSON.parse(l); return !(set.has(r[key]) && r.status === 'error'); } catch (e) { return true; }
    });
    fs.writeFileSync(f, keep.length ? `${keep.join('\n')}\n` : '');
  });
} else if (cmd === 'mark') {
  // Cloudflare serves its 403 block as a styled "Service Notice / Under Maintenance" page that
  // the render/capture scripts record as ok. Re-tag those records as errors so they get retried.
  const BLOCKED_TITLE = 'Thai Airways | Service Notice';
  const BLOCKED_LABEL = 'Under Maintenance';
  let pm = 0;
  const pf = path.join(CF, 'pages.jsonl');
  if (fs.existsSync(pf)) {
    const out = readJsonl(pf).map((r) => {
      if (r.status === 'ok' && (r.title || '').trim() === BLOCKED_TITLE) { pm++; return { url: r.url, status: 'error', error: 'cloudflare-block (Service Notice)' }; }
      return r;
    });
    fs.writeFileSync(pf, out.map((r) => JSON.stringify(r)).join('\n') + (out.length ? '\n' : ''));
  }
  const bf = path.join(CF, 'blocks.jsonl');
  const blockedPages = new Set();
  if (fs.existsSync(bf)) {
    const recs = readJsonl(bf);
    recs.forEach((r) => { if (r.status !== 'error' && (r.label || '').trim() === BLOCKED_LABEL) blockedPages.add(r.pageUrl); });
    const out = [];
    recs.forEach((r) => {
      if (!blockedPages.has(r.pageUrl)) { out.push(r); return; }
      if (r.file) { try { fs.unlinkSync(path.join(CF, 'blocks', r.file)); } catch (e) { /* gone */ } }
    });
    blockedPages.forEach((u) => out.push({ pageUrl: u, status: 'error', error: 'cloudflare-block (Under Maintenance)' }));
    fs.writeFileSync(bf, out.map((r) => JSON.stringify(r)).join('\n') + (out.length ? '\n' : ''));
  }
  console.log(`marked blocked: pages ${pm}, block-capture pages ${blockedPages.size}`);
} else {
  console.error('usage: sections.js <CF> list|add|errors|strip|mark [section]');
  process.exit(1);
}
