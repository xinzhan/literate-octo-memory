#!/usr/bin/env node
// Cross-site summary for several site-analysis-dashboard catalogs.
// Reads each <catalog>/ outputs and writes <reportsDir>/<name>.html + .md
// Usage: node build-summary.js <reportsDir> <name> <catalogFolder>...
const fs = require('fs');
const path = require('path');

const [reportsDir, outName, ...cfs] = process.argv.slice(2);
const rd = (cf, f, d = null) => { try { return JSON.parse(fs.readFileSync(path.join(cf, f), 'utf8')); } catch (e) { return d; } };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf = (n) => Number(n || 0).toLocaleString('en-US');
const NOTES = rd(path.dirname(process.argv[1]), 'site-notes.json', {});
const TITLE = NOTES._title || outName;

const BASE_LABEL = {
  text: 'Text', media: 'Media', columns: 'Columns', cards: 'Cards', table: 'Table', video: 'Video', 'iframe-embed': 'Embed',
  accordion: 'Accordion', carousel: 'Carousel', tabs: 'Tabs', form: 'Form', hero: 'Hero', list: 'List', breadcrumbs: 'Breadcrumbs', unknown: 'Unknown / Custom',
};

const sites = cfs.map((cf) => {
  const cfg = rd(cf, 'config.json');
  const key = path.basename(cf).replace(/-scope$/, '');
  const all = rd(cf, 'urls-all.json')['analysis-urls-all'];
  const layouts = rd(cf, 'layouts.json');
  const cat = rd(cf, 'block-catalog.json');
  const integ = rd(cf, 'integrations.json', { integrations: [] });
  const be = rd(cf, 'backend.json', { services: [], otherHosts: [] });
  const insp = rd(cf, 'inspection.json');
  const smA = rd(cf, 'sitemap-audit.json');
  const ns = (cfg.site || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fam = {};
  for (const t of layouts.templates) fam[t.name] = (fam[t.name] || 0) + t.estPop;
  const families = Object.entries(fam).sort((a, b) => b[1] - a[1]);
  const seg = {};
  for (const o of all.urls) { const s = new URL(o.url).pathname.split('/').filter(Boolean)[0] || '(home)'; seg[s] = (seg[s] || 0) + 1; }
  const non200 = all.urls.filter((o) => o.status !== 200);
  const bases = {};
  for (const b of cat.baseSummary) bases[b.base] = { variants: b.variants, instances: b.instances };
  const unk = bases.unknown ? bases.unknown.instances : 0;
  return {
    key, cfg, name: (cfg.accountName || '').split(' — ').pop() || cfg.site, site: cfg.site, url: cfg.siteUrl,
    report: `${ns}-site-analysis-dashboard.html`,
    pages: all.urls.length, live: all.urls.length - non200.length, non200, docs: all.totalDocuments,
    sections: Object.entries(seg).sort((a, b) => b[1] - a[1]),
    rendered: layouts.renderedPages, signatures: layouts.distinctSignatures, families,
    instances: cat.totalInstances, variants: cat.totalVariants, bases, unkShare: cat.totalInstances ? unk / cat.totalInstances : 0,
    fe: integ.integrations, be: be.services || [], beOther: be.otherHosts || [], beSampled: be.sampledPages || 0,
    coverage: insp ? insp.selInspect : null, sitemap: smA,
    notes: NOTES[key] || {},
  };
});

// ---- cross-site aggregates ----
const tot = (f) => sites.reduce((a, s) => a + f(s), 0);
const allBases = Object.keys(BASE_LABEL).filter((b) => sites.some((s) => s.bases[b]));
const feNames = {};
for (const s of sites) for (const i of s.fe) if (i.category !== 'Unclassified') (feNames[i.name] = feNames[i.name] || { cat: i.category, sites: {} }).sites[s.key] = i.hits;
const feRows = Object.entries(feNames).sort((a, b) => Object.keys(b[1].sites).length - Object.keys(a[1].sites).length || a[0].localeCompare(b[0]));
const beNames = {};
for (const s of sites) for (const v of s.be) (beNames[v.name] = beNames[v.name] || { cat: v.category, sites: {} }).sites[s.key] = v.coverage;
const beRows = Object.entries(beNames).sort((a, b) => Object.keys(b[1].sites).length - Object.keys(a[1].sites).length || a[0].localeCompare(b[0]));
const famNames = {};
for (const s of sites) for (const [f, n] of s.families) (famNames[f] = famNames[f] || {})[s.key] = n;
const famRows = Object.entries(famNames).sort((a, b) => Object.values(b[1]).reduce((x, y) => x + y, 0) - Object.values(a[1]).reduce((x, y) => x + y, 0));
const sharedFe = feRows.filter(([, v]) => Object.keys(v.sites).length === sites.length).map(([n]) => n);

// ---- chart helpers ----
const SEQ = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];
function seqColor(v, max) {
  if (!v) return null;
  const t = Math.sqrt(v / max); // sqrt keeps small counts visible next to large text buckets
  return SEQ[Math.min(SEQ.length - 1, Math.round(t * (SEQ.length - 1)))];
}
const inkOn = (hex) => (SEQ.indexOf(hex) >= 7 ? '#ffffff' : '#0b0b0b');

function barChart(rows, unit) {
  const max = Math.max(...rows.map((r) => r.v)) || 1;
  return `<div class="bars" role="img" aria-label="${esc(unit)} per site">${rows.map((r) => `
    <div class="bar-row" data-tip="${esc(r.label)}: ${nf(r.v)} ${esc(unit)}${r.extra ? ' · ' + esc(r.extra) : ''}">
      <span class="bar-label">${esc(r.label)}</span>
      <span class="bar-track"><span class="bar" style="width:${(r.v / max * 100).toFixed(1)}%"></span></span>
      <span class="bar-val">${nf(r.v)}</span>
    </div>`).join('')}</div>`;
}

function heatTable(rowKeys, rowLabel, cell, title) {
  let max = 0;
  for (const rk of rowKeys) for (const s of sites) max = Math.max(max, cell(rk, s) || 0);
  return `<table class="heat" aria-label="${esc(title)}"><thead><tr><th>${esc(rowLabel(null))}</th>${sites.map((s) => `<th>${esc(s.key.toUpperCase())}</th>`).join('')}</tr></thead><tbody>
  ${rowKeys.map((rk) => `<tr><th>${esc(rowLabel(rk))}</th>${sites.map((s) => {
    const v = cell(rk, s) || 0; const c = seqColor(v, max);
    return `<td data-tip="${esc(s.name)} · ${esc(rowLabel(rk))}: ${nf(v)}" style="${c ? `background:${c};color:${inkOn(c)}` : ''}">${v ? nf(v) : '<span class="muted">–</span>'}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table>`;
}

function matrix(rows, fmt) {
  return `<table class="matrix"><thead><tr><th>Service</th><th>Category</th>${sites.map((s) => `<th>${esc(s.key.toUpperCase())}</th>`).join('')}<th>Sites</th></tr></thead><tbody>
  ${rows.map(([n, v]) => `<tr><th>${esc(n)}</th><td class="muted">${esc(v.cat)}</td>${sites.map((s) => (v.sites[s.key] !== undefined
    ? `<td class="yes" data-tip="${esc(s.name)} · ${esc(n)}: ${esc(fmt(v.sites[s.key]))}"><span class="dot" aria-hidden="true"></span><span class="sr">yes</span></td>`
    : '<td class="no"><span class="muted">–</span></td>')).join('')}<td>${Object.keys(v.sites).length}/${sites.length}</td></tr>`).join('')}</tbody></table>`;
}

// ---- per-site findings (computed + curated notes) ----
function findings(s) {
  const f = [];
  const top = s.families.slice(0, 3).map(([n, c]) => `${n} (~${c})`).join(', ');
  f.push(`${nf(s.pages)} pages discovered (${nf(s.live)} live, ${s.non200.length} non-200) and ${nf(s.docs)} documents/media assets; all ${nf(s.rendered)} unique live pages (after collapsing query-string/duplicate URLs) were rendered and fingerprinted — no sampling.`);
  f.push(`${s.families.length} layout families from ${s.signatures} structural signatures — largest: ${top}.`);
  f.push(`${nf(s.instances)} block instances roll up into ${s.variants} variants; Unknown/Custom share ${(s.unkShare * 100).toFixed(0)}% of instances.`);
  const named = s.fe.filter((i) => i.category !== 'Unclassified').map((i) => i.name);
  if (named.length) f.push(`Front-end services: ${named.join(', ')}.`);
  if (s.sitemap) {
    const a = s.sitemap;
    const off = a.entries.filter((e) => e.rewrittenFromHost).length;
    const red = a.entries.filter((e) => e.redirected).length;
    const bad = a.entries.filter((e) => e.status !== 200).length;
    let t = `sitemap.xml lists ${a.sitemapCount} URLs; ${a.addedFromSitemap} pages were found only via the sitemap (not linked in crawlable HTML).`;
    if (off) t += ` ${off} entries point at ${[...new Set(a.entries.filter((e) => e.rewrittenFromHost).map((e) => e.rewrittenFromHost))].join(', ')} instead of the public host.`;
    else if (red) t += ` ${red} entries redirect (stale paths).`;
    if (bad) t += ` ${bad} entries do not resolve to a 200 page.`;
    f.push(t);
  } else f.push('No sitemap.xml published — discovery relied on the crawl alone.');
  return f.concat(s.notes.findings || []);
}

// ---- HTML ----
const css = `
.viz-root{color-scheme:light;--surface-0:#f4f3f0;--surface-1:#fcfcfb;--border:#e2e1dc;--text-primary:#0b0b0b;--text-secondary:#52514e;--text-muted:#76756f;--series-1:#2a78d6;--track:#ecebe7}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])) .viz-root{color-scheme:dark;--surface-0:#121211;--surface-1:#1a1a19;--border:#33332f;--text-primary:#f0efec;--text-secondary:#c3c2b7;--text-muted:#9a998f;--series-1:#3987e5;--track:#262624}}
:root[data-theme="dark"] .viz-root{color-scheme:dark;--surface-0:#121211;--surface-1:#1a1a19;--border:#33332f;--text-primary:#f0efec;--text-secondary:#c3c2b7;--text-muted:#9a998f;--series-1:#3987e5;--track:#262624}
*{box-sizing:border-box}body{margin:0}
.viz-root{font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--surface-0);color:var(--text-primary);min-height:100vh}
.wrap{max-width:1240px;margin:0 auto;padding:32px 24px 64px}
header h1{font-size:28px;margin:4px 0 6px}header p{color:var(--text-secondary);max-width:860px;margin:0}
.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:12px;color:var(--text-muted)}
nav.toc{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}nav.toc a{color:var(--text-secondary);text-decoration:none;border:1px solid var(--border);border-radius:999px;padding:4px 12px;background:var(--surface-1)}
section{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:20px 22px;margin:18px 0}
section h2{font-size:18px;margin:0 0 4px}.lead{color:var(--text-secondary);margin:0 0 14px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.tile{border:1px solid var(--border);border-radius:10px;padding:12px 14px}.tile b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.tile span{color:var(--text-secondary);font-size:13px}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{padding:7px 9px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}
thead th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);font-weight:600}
td.num,th.num{text-align:right}.muted{color:var(--text-muted)}
.scroll{overflow-x:auto}
.heat td{text-align:center;border:2px solid var(--surface-1);border-radius:4px;min-width:64px}
.matrix td.yes,.matrix td.no{text-align:center}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--series-1)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.bars{display:grid;gap:6px}.bar-row{display:grid;grid-template-columns:200px 1fr 60px;align-items:center;gap:10px;padding:3px 0}
.bar-label{color:var(--text-secondary)}.bar-track{height:14px;background:var(--track);border-radius:4px;overflow:hidden}
.bar{display:block;height:100%;background:var(--series-1);border-radius:0 4px 4px 0}.bar-val{text-align:right;font-variant-numeric:tabular-nums}
.bar-row:hover .bar{filter:brightness(1.12)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}@media(max-width:900px){.grid2{grid-template-columns:1fr}}
.site{border:1px solid var(--border);border-radius:10px;padding:16px 18px;margin:12px 0}
.site h3{margin:0 0 2px;font-size:16px}.site .meta{color:var(--text-muted);font-size:13px;margin-bottom:8px}
.site ul{margin:6px 0 0 18px;padding:0}.site li{margin:3px 0}
a.btn{display:inline-block;margin-top:10px;padding:6px 12px;border-radius:8px;border:1px solid var(--series-1);color:var(--series-1);text-decoration:none;font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.chip{border:1px solid var(--border);border-radius:999px;padding:1px 8px;font-size:12px;color:var(--text-secondary)}
#tip{position:fixed;pointer-events:none;background:var(--text-primary);color:var(--surface-1);padding:6px 9px;border-radius:6px;font-size:12px;max-width:320px;opacity:0;transition:opacity .08s;z-index:9}
.theme{float:right;border:1px solid var(--border);background:var(--surface-1);color:var(--text-secondary);border-radius:8px;padding:4px 10px;cursor:pointer}
`;

const kpis = [
  [nf(tot((s) => s.pages)), 'pages discovered'],
  [nf(tot((s) => s.rendered)), 'pages rendered (100%)'],
  [nf(tot((s) => s.docs)), 'documents / media'],
  [String(Object.keys(famNames).length), 'distinct layout families'],
  [nf(tot((s) => s.instances)), 'block instances'],
  [nf(tot((s) => s.variants)), 'block variants'],
  [String(feRows.length), 'named front-end services'],
];

const cmpRows = sites.map((s) => `<tr><th><a href="${esc(s.report)}">${esc(s.name)}</a><div class="muted">${esc(s.site)}</div></th>
  <td class="num">${nf(s.pages)}</td><td class="num">${s.non200.length}</td><td class="num">${nf(s.docs)}</td><td class="num">${nf(s.rendered)}</td>
  <td class="num">${s.families.length}</td><td class="num">${nf(s.instances)}</td><td class="num">${s.variants}</td><td class="num">${(s.unkShare * 100).toFixed(0)}%</td>
  <td class="num">${s.fe.filter((i) => i.category !== 'Unclassified').length}</td><td class="num">${s.be.length}</td>
  <td>${esc(s.notes.locales || s.sections.filter(([k]) => /^(en|ta|ch|zh|ms|cn)$/.test(k)).map(([k, v]) => `${k}:${v}`).join(' ') || 'en')}</td></tr>`).join('');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(TITLE)} — cross-site summary</title><style>${css}</style></head>
<body><div class="viz-root"><div class="wrap">
<header><button class="theme" id="themeBtn" type="button">Toggle theme</button>
<div class="eyebrow">National Heritage Board · Site Analysis · ${new Date().toISOString().slice(0, 10)}</div>
<h1>Cross-site summary — ${sites.length} museum &amp; heritage sites</h1>
<p>Each domain was analysed separately with the Site Analysis Dashboard pipeline: full crawl merged with the resolved sitemap.xml, every live page rendered and structurally fingerprinted, layouts clustered into families, block instances cropped and consolidated into variants, front-end tags and runtime API calls captured. This page compares the six results; open any site's dashboard for the full evidence (screenshots, galleries, URL coverage, human review).</p></header>
<nav class="toc"><a href="#kpi">Overview</a><a href="#compare">Comparison</a><a href="#scale">Scale</a><a href="#layouts">Layout families</a><a href="#blocks">Block types</a><a href="#fe">Front-end services</a><a href="#be">Backend calls</a><a href="#sites">Per-site findings</a><a href="#recs">Recommendations</a><a href="#method">Method &amp; caveats</a></nav>

<section id="kpi"><h2>Overview</h2><p class="lead">Totals across all six domains.</p>
<div class="tiles">${kpis.map(([v, l]) => `<div class="tile"><b>${v}</b><span>${esc(l)}</span></div>`).join('')}</div></section>

<section id="compare"><h2>Site comparison</h2><p class="lead">One row per domain. Site names open the individual dashboard.</p><div class="scroll"><table>
<thead><tr><th>Site</th><th class="num">Pages</th><th class="num">Non-200</th><th class="num">Docs/media</th><th class="num">Rendered</th><th class="num">Layout families</th><th class="num">Block instances</th><th class="num">Variants</th><th class="num">Unknown share</th><th class="num">FE services</th><th class="num">Backend services</th><th>Languages</th></tr></thead>
<tbody>${cmpRows}</tbody></table></div></section>

<section id="scale"><h2>Scale</h2><p class="lead">Pages discovered per domain (crawl + resolved sitemap), and block variants per domain.</p><div class="grid2">
<div><h3 class="muted" style="font-size:13px;margin:0 0 8px">Pages discovered</h3>${barChart(sites.map((s) => ({ label: s.name, v: s.pages, extra: `${s.docs} docs/media` })), 'pages')}</div>
<div><h3 class="muted" style="font-size:13px;margin:0 0 8px">Block variants</h3>${barChart(sites.map((s) => ({ label: s.name, v: s.variants, extra: `${s.instances} instances` })), 'variants')}</div>
</div></section>

<section id="layouts"><h2>Layout families</h2><p class="lead">Estimated pages per layout family. Families recur across sites — a strong sign that one shared set of templates and import parsers can serve the whole portfolio.</p>
<div class="scroll">${heatTable(famRows.map(([n]) => n), (k) => (k === null ? 'Family' : k), (k, s) => famNames[k][s.key], 'layout families per site')}</div></section>

<section id="blocks"><h2>Block types</h2><p class="lead">Block instances per base type (cell = instances; darker = more). Text is body copy (EDS default content); Unknown / Custom needs a bespoke block or authoring decision.</p>
<div class="scroll">${heatTable(allBases, (k) => (k === null ? 'Block type' : BASE_LABEL[k]), (k, s) => (s.bases[k] || {}).instances, 'block instances per type and site')}</div>
<p class="lead" style="margin-top:14px">Variants per base type</p>
<div class="scroll">${heatTable(allBases, (k) => (k === null ? 'Block type' : BASE_LABEL[k]), (k, s) => (s.bases[k] || {}).variants, 'block variants per type and site')}</div></section>

<section id="fe"><h2>Front-end services</h2><p class="lead">Third-party scripts / tags detected while rendering every page (unclassified hosts are listed in each site's dashboard).${sharedFe.length ? ` Present on all ${sites.length} sites: <b>${esc(sharedFe.join(', '))}</b>.` : ''}</p>
<div class="scroll">${matrix(feRows, (v) => `${nf(v)} hits`)}</div></section>

<section id="be"><h2>Probable backend integrations</h2><p class="lead">Inferred from XHR/fetch calls captured on a page sample per site (coverage = share of sampled pages making the call). Based on observed traffic, not server access.</p>
<div class="scroll">${matrix(beRows, (v) => `${v} of sampled pages`)}</div></section>

<section id="sites"><h2>Per-site findings</h2>
${sites.map((s) => `<div class="site"><h3>${esc(s.name)}</h3><div class="meta"><a href="${esc(s.url)}">${esc(s.url)}</a> · ${nf(s.pages)} pages · ${s.families.length} layout families · ${s.variants} block variants</div>
<div class="chips">${s.sections.slice(0, 12).map(([k, v]) => `<span class="chip">/${esc(k)} ${v}</span>`).join('')}</div>
<ul>${findings(s).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
<a class="btn" href="${esc(s.report)}">Open ${esc(s.key.toUpperCase())} dashboard →</a></div>`).join('')}
</section>

<section id="recs"><h2>Recommendations</h2><ul>${(NOTES._recommendations || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>

<section id="method"><h2>Method &amp; caveats</h2><ul>
<li>Discovery: breadth-first crawl of each domain (robots-aware, ≤3,000 pages) merged with every sitemap.xml entry resolved through redirects; off-host sitemap entries were mapped onto the public host. Extension-less media endpoints (<code>/api/media/…</code>) were classed as assets.</li>
<li>Rendering: headless Chromium at 1440px; every unique live page rendered (sampling disabled); Noto Sans CJK and Noto Sans Tamil installed so Chinese and Tamil pages screenshot correctly.</li>
<li>Blocks: structural + ARIA classifier; rich-text bodies count as Text (default content). Fixed/sticky headers are hidden while cropping block screenshots.</li>
<li>Backend: XHR/fetch traffic on a sample of pages per site — labelled "probable".</li>
<li>Pages reachable only through search, filters or JavaScript-only navigation and not listed in the sitemap may be missing.</li>
${(NOTES._caveats || []).map((t) => `<li>${esc(t)}</li>`).join('')}
</ul></section>
</div><div id="tip" role="tooltip"></div></div>
<script>
const tip=document.getElementById('tip');
document.addEventListener('mousemove',e=>{const t=e.target.closest('[data-tip]');if(!t){tip.style.opacity=0;return}tip.textContent=t.dataset.tip;tip.style.opacity=1;const x=Math.min(e.clientX+14,innerWidth-tip.offsetWidth-8);tip.style.left=x+'px';tip.style.top=(e.clientY+16)+'px'});
document.getElementById('themeBtn').addEventListener('click',()=>{const r=document.documentElement;const dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark'});
</script></body></html>`;

fs.writeFileSync(path.join(reportsDir, `${outName}.html`), html);

// ---- Markdown ----
const md = [`# ${TITLE} — cross-site summary`, '', `Generated ${new Date().toISOString().slice(0, 10)}. ${sites.length} domains, each analysed individually.`, '',
  '| Site | Pages | Non-200 | Docs/media | Rendered | Layout families | Block instances | Variants | Unknown share | FE services | Backend services | Dashboard |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
  ...sites.map((s) => `| ${s.name} (${s.site}) | ${s.pages} | ${s.non200.length} | ${s.docs} | ${s.rendered} | ${s.families.length} | ${s.instances} | ${s.variants} | ${(s.unkShare * 100).toFixed(0)}% | ${s.fe.filter((i) => i.category !== 'Unclassified').length} | ${s.be.length} | ${s.report} |`),
  `| **Total** | **${tot((s) => s.pages)}** | **${tot((s) => s.non200.length)}** | **${tot((s) => s.docs)}** | **${tot((s) => s.rendered)}** | ${Object.keys(famNames).length} distinct | **${tot((s) => s.instances)}** | **${tot((s) => s.variants)}** | | | | |`,
  '', ...sites.flatMap((s) => [`## ${s.name}`, '', ...findings(s).map((t) => `- ${t}`), '']),
  '## Recommendations', '', ...(NOTES._recommendations || []).map((t) => `- ${t}`), ''].join('\n');
fs.writeFileSync(path.join(reportsDir, `${outName}.md`), md);
console.log('written', path.join(reportsDir, `${outName}.html`), (Buffer.byteLength(html) / 1024).toFixed(0) + 'KB', '+ .md');
