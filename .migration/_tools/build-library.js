#!/usr/bin/env node
// Consolidated cross-site block library: maps every per-site block variant onto a shared
// block/variant (library-map.json) and writes an HTML report, a Markdown summary and a
// machine-readable mapping.
// Usage: node build-library.js <libraryDir> <reportsDir>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const [libDir, reportsDir] = process.argv.slice(2);
const variants = JSON.parse(fs.readFileSync(path.join(libDir, 'variants-index.json'), 'utf8'));
const MAP = JSON.parse(fs.readFileSync(path.join(libDir, 'library-map.json'), 'utf8'));
const SITES = ['acm', 'ihc', 'mhc', 'nms', 'pm', 'sysnmh'];
const SITE_NAME = { acm: 'Asian Civilisations Museum', ihc: 'Indian Heritage Centre', mhc: 'Malay Heritage Centre', nms: 'National Museum of Singapore', pm: 'Peranakan Museum', sysnmh: 'Sun Yat Sen Nanyang Memorial Hall' };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf = (n) => Number(n || 0).toLocaleString('en-US');

// ---- assign every variant ----
const problems = [];
for (const v of variants) {
  const target = MAP.overrides[v.id] || MAP.defaultsByBase[v.base];
  const [block, variant] = (target || '').split('/');
  if (!MAP.blocks[block] || !MAP.blocks[block].variants[variant]) problems.push(`${v.id} -> ${target}`);
  v.block = block; v.variant = variant;
}
if (problems.length) { console.error('unmapped / invalid targets:\n' + problems.join('\n')); process.exit(1); }
const unusedOverrides = Object.keys(MAP.overrides).filter((id) => !variants.some((v) => v.id === id));
if (unusedOverrides.length) console.warn('overrides with no matching variant:', unusedOverrides.join(', '));

// ---- aggregate ----
const lib = {};
for (const v of variants) {
  const b = (lib[v.block] = lib[v.block] || { variants: {}, instances: 0, sites: new Set() });
  const x = (b.variants[v.variant] = b.variants[v.variant] || { members: [], instances: 0, pages: 0, sites: {} });
  x.members.push(v); x.instances += v.instances; x.pages += v.pages;
  x.sites[v.site] = (x.sites[v.site] || 0) + v.instances;
  b.instances += v.instances; b.sites.add(v.site);
}
const blockOrder = Object.keys(MAP.blocks).filter((b) => lib[b]);
const realBlocks = blockOrder.filter((b) => b !== 'default-content');
const totalInst = variants.reduce((a, v) => a + v.instances, 0);
const usedVariants = realBlocks.reduce((a, b) => a + Object.keys(lib[b].variants).length, 0);
const multiSite = realBlocks.reduce((a, b) => a + Object.values(lib[b].variants).filter((x) => Object.keys(x.sites).length >= 2).length, 0);

// ---- thumbnails (one per site per shared variant: that site's most-used member) ----
const tmp = fs.mkdtempSync('/tmp/libthumb-');
let tn = 0;
function thumb(file) {
  if (!fs.existsSync(file)) return '';
  const out = path.join(tmp, `t${tn++}.jpg`);
  try {
    execFileSync('convert', [file, '-resize', '420x', '-gravity', 'North', '-crop', '420x520+0+0', '+repage', '-quality', '68', out]);
    return 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64');
  } catch (e) { return ''; }
}

// ---- HTML ----
const SEQ = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b'];
let maxCell = 0;
for (const b of realBlocks) for (const x of Object.values(lib[b].variants)) for (const n of Object.values(x.sites)) maxCell = Math.max(maxCell, n);
const cellStyle = (n) => {
  if (!n) return '';
  const c = SEQ[Math.min(SEQ.length - 1, Math.round(Math.sqrt(n / maxCell) * (SEQ.length - 1)))];
  return `background:${c};color:${SEQ.indexOf(c) >= 7 ? '#fff' : '#0b0b0b'}`;
};

const matrixRows = realBlocks.flatMap((b) => Object.entries(lib[b].variants).sort((p, q) => q[1].instances - p[1].instances).map(([vn, x], i) => `<tr>
  ${i === 0 ? `<th rowspan="${Object.keys(lib[b].variants).length}" class="blk"><a href="#b-${b}">${esc(MAP.blocks[b].label)}</a></th>` : ''}
  <td><a href="#v-${b}-${vn}">${esc(vn)}</a></td>
  ${SITES.map((s) => `<td class="c" style="${cellStyle(x.sites[s])}" data-tip="${esc(SITE_NAME[s])} · ${esc(MAP.blocks[b].label)} (${esc(vn)}): ${nf(x.sites[s] || 0)} instances">${x.sites[s] ? nf(x.sites[s]) : '<span class="muted">–</span>'}</td>`).join('')}
  <td class="num">${Object.keys(x.sites).length}/6</td><td class="num">${nf(x.instances)}</td><td class="num">${x.members.length}</td></tr>`)).join('');

function variantCard(b, vn, x) {
  const ex = SITES.filter((s) => x.sites[s]).map((s) => {
    const best = x.members.filter((m) => m.site === s).sort((p, q) => q.instances - p.instances)[0];
    const src = thumb(best.repFile);
    return `<figure><a href="${esc(best.repUrl)}" target="_blank" rel="noopener">${src ? `<img loading="lazy" src="${src}" alt="${esc(MAP.blocks[b].label)} ${esc(vn)} example from ${esc(SITE_NAME[s])}">` : '<div class="noimg">no screenshot</div>'}</a>
      <figcaption><b>${s.toUpperCase()}</b> · ${nf(x.sites[s])} inst. · <span class="muted">${esc(best.id)}</span></figcaption></figure>`;
  }).join('');
  const members = x.members.slice().sort((p, q) => q.instances - p.instances).map((m) => `<li><b>${m.site.toUpperCase()}</b> ${esc(m.id)} — ${nf(m.instances)} inst. / ${nf(m.pages)} pages — <a href="${esc(m.repUrl)}" target="_blank" rel="noopener">${esc(m.repUrl.replace(/^https?:\/\//, ''))}</a></li>`).join('');
  return `<div class="variant" id="v-${b}-${vn}"><h4>${esc(MAP.blocks[b].label)} <span class="vn">(${esc(vn)})</span></h4>
  <p class="muted">${esc(MAP.blocks[b].variants[vn])}</p>
  <div class="meta">${Object.keys(x.sites).length} of 6 sites · ${nf(x.instances)} instances · replaces ${x.members.length} per-site variant${x.members.length === 1 ? '' : 's'}</div>
  <div class="examples">${ex}</div>
  <details><summary>Per-site variants consolidated here (${x.members.length})</summary><ul class="members">${members}</ul></details></div>`;
}

const blockSections = realBlocks.map((b) => {
  const B = MAP.blocks[b]; const L = lib[b];
  const vs = Object.entries(L.variants).sort((p, q) => q[1].instances - p[1].instances);
  return `<section id="b-${b}"><h2>${esc(B.label)} <span class="muted small">— ${esc(B.purpose)}</span></h2>
  <p class="lead">${vs.length} variant${vs.length === 1 ? '' : 's'} · used on ${L.sites.size} of 6 sites · ${nf(L.instances)} instances. Unused library variants: ${Object.keys(B.variants).filter((v) => !L.variants[v]).join(', ') || 'none'}.</p>
  ${vs.map(([vn, x]) => variantCard(b, vn, x)).join('')}</section>`;
}).join('');

const dc = lib['default-content'];
const dcVars = dc ? Object.values(dc.variants)[0] : { members: [], instances: 0 };
const dcBySite = SITES.map((s) => `${s.toUpperCase()} ${nf(dcVars.members.filter((m) => m.site === s).length)}`).join(' · ');

const perSiteRows = SITES.map((s) => {
  const mine = variants.filter((v) => v.site === s);
  const blocks = new Set(mine.filter((v) => v.block !== 'default-content').map((v) => `${v.block}/${v.variant}`));
  return `<tr><th>${esc(SITE_NAME[s])}</th><td class="num">${mine.length}</td><td class="num">${blocks.size}</td><td class="num">${mine.filter((v) => v.block === 'default-content').length}</td><td>${[...new Set(mine.filter((v) => v.block !== 'default-content').map((v) => MAP.blocks[v.block].label))].join(', ')}</td></tr>`;
}).join('');

const css = `
.viz-root{color-scheme:light;--surface-0:#f4f3f0;--surface-1:#fcfcfb;--border:#e2e1dc;--text-primary:#0b0b0b;--text-secondary:#52514e;--text-muted:#76756f;--series-1:#2a78d6}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])) .viz-root{color-scheme:dark;--surface-0:#121211;--surface-1:#1a1a19;--border:#33332f;--text-primary:#f0efec;--text-secondary:#c3c2b7;--text-muted:#9a998f;--series-1:#3987e5}}
:root[data-theme="dark"] .viz-root{color-scheme:dark;--surface-0:#121211;--surface-1:#1a1a19;--border:#33332f;--text-primary:#f0efec;--text-secondary:#c3c2b7;--text-muted:#9a998f;--series-1:#3987e5}
*{box-sizing:border-box}body{margin:0}
.viz-root{font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--surface-0);color:var(--text-primary);min-height:100vh}
a{color:var(--series-1)}.wrap{max-width:1280px;margin:0 auto;padding:32px 24px 64px}
header h1{font-size:28px;margin:4px 0 6px}header p{color:var(--text-secondary);max-width:900px;margin:0}
.eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:12px;color:var(--text-muted)}
nav.toc{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}nav.toc a{color:var(--text-secondary);text-decoration:none;border:1px solid var(--border);border-radius:999px;padding:4px 12px;background:var(--surface-1)}
section{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:20px 22px;margin:18px 0}
section h2{font-size:19px;margin:0 0 4px}.lead{color:var(--text-secondary);margin:0 0 14px}.small{font-size:14px;font-weight:400}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.tile{border:1px solid var(--border);border-radius:10px;padding:12px 14px}.tile b{display:block;font-size:26px;font-variant-numeric:tabular-nums}.tile span{color:var(--text-secondary);font-size:13px}
table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{padding:6px 9px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}
thead th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);font-weight:600}
td.num,th.num{text-align:right}td.c{text-align:center;border:2px solid var(--surface-1);border-radius:4px;min-width:60px}th.blk{vertical-align:middle}
.muted{color:var(--text-muted)}.scroll{overflow-x:auto}
.variant{border-top:1px solid var(--border);padding:16px 0 8px}.variant h4{margin:0 0 2px;font-size:16px}.vn{color:var(--text-secondary);font-weight:500}
.variant .meta{font-size:13px;color:var(--text-secondary);margin:2px 0 10px}
.examples{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
figure{margin:0;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#fff}
figure img{display:block;width:100%;height:200px;object-fit:cover;object-position:top}
figcaption{font-size:12px;padding:6px 8px;background:var(--surface-1);color:var(--text-secondary)}
.noimg{height:200px;display:grid;place-items:center;color:#76756f}
details{margin-top:8px}summary{cursor:pointer;color:var(--text-secondary);font-size:13px}.members{font-size:12.5px;margin:6px 0 0 18px;padding:0}.members li{margin:2px 0;word-break:break-all}
#tip{position:fixed;pointer-events:none;background:var(--text-primary);color:var(--surface-1);padding:6px 9px;border-radius:6px;font-size:12px;max-width:320px;opacity:0;z-index:9}
.theme{float:right;border:1px solid var(--border);background:var(--surface-1);color:var(--text-secondary);border-radius:8px;padding:4px 10px;cursor:pointer}
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NHB shared block library — cross-site consolidation</title><style>${css}</style></head><body><div class="viz-root"><div class="wrap">
<header><button class="theme" id="themeBtn" type="button">Toggle theme</button>
<div class="eyebrow">National Heritage Board · 6 sites · Shared block library</div>
<h1>One block library for six museum sites</h1>
<p>Every block variant detected on the six sites (${variants.length} per-site variants, ${nf(totalInst)} instances) was reviewed visually and mapped onto a shared Edge Delivery Services block and variant. Similar components become one block with a variant option instead of a per-site copy; rich text with no component behaviour becomes default content.</p></header>
<nav class="toc"><a href="#overview">Overview</a><a href="#matrix">Block × site matrix</a>${realBlocks.map((b) => `<a href="#b-${b}">${esc(MAP.blocks[b].label)}</a>`).join('')}<a href="#default">Default content</a><a href="#sites">Per site</a><a href="#method">Method</a></nav>
<section id="overview"><h2>Overview</h2><p class="lead">From per-site variants to a shared library.</p><div class="tiles">
<div class="tile"><b>${variants.length}</b><span>per-site variants detected</span></div>
<div class="tile"><b>${realBlocks.length}</b><span>shared blocks</span></div>
<div class="tile"><b>${usedVariants}</b><span>shared block variants</span></div>
<div class="tile"><b>${multiSite}</b><span>variants used on 2+ sites</span></div>
<div class="tile"><b>${nf(dcVars.members.length)}</b><span>per-site variants → default content</span></div>
<div class="tile"><b>${Math.round((1 - usedVariants / variants.length) * 100)}%</b><span>fewer variants to build</span></div>
</div></section>
<section id="matrix"><h2>Block × site matrix</h2><p class="lead">Instances of each shared variant per site (darker = more). Rows are grouped by block; click a name to jump to its examples.</p>
<div class="scroll"><table><thead><tr><th>Block</th><th>Variant</th>${SITES.map((s) => `<th>${s.toUpperCase()}</th>`).join('')}<th class="num">Sites</th><th class="num">Instances</th><th class="num">Per-site variants</th></tr></thead><tbody>${matrixRows}</tbody></table></div></section>
${blockSections}
<section id="default"><h2>Default content</h2><p class="lead">${nf(dcVars.members.length)} per-site variants (${nf(dcVars.instances)} instances) are body copy: headings, paragraphs, lists, inline images, buttons, legal text and layout tables used only for formatting. In EDS these are authored as normal document content — no block code. By site: ${dcBySite}.</p></section>
<section id="sites"><h2>Per site</h2><div class="scroll"><table><thead><tr><th>Site</th><th class="num">Per-site variants</th><th class="num">Shared variants used</th><th class="num">→ default content</th><th>Shared blocks used</th></tr></thead><tbody>${perSiteRows}</tbody></table></div></section>
<section id="method"><h2>Method</h2><ul>
<li>Input: the block catalogs of the six site analyses (every live page rendered; block instances cropped and grouped into structural variants per site).</li>
<li>Each per-site variant's representative screenshot was reviewed on labelled contact sheets and assigned to a shared block/variant by appearance and purpose — not by markup, which differs in detail even where components are the same.</li>
<li>Instance counts come from the analyses; a page can contain several instances of one variant.</li>
<li>Only the main content area was catalogued. Components placed in the site header or footer (e.g. breadcrumbs on ACM/NMS, newsletter sign-ups in footers) are not counted, so an empty cell means "not detected in page content", not necessarily "absent from the site". Header/footer are migrated separately as EDS nav and footer fragments.</li>
<li>The mapping is in <code>nhb-shared-block-library.mapping.json</code> (site, per-site variant key, shared block, shared variant) for use when writing import parsers.</li>
</ul></section>
</div><div id="tip" role="tooltip"></div></div>
<script>
const tip=document.getElementById('tip');
document.addEventListener('mousemove',e=>{const t=e.target.closest('[data-tip]');if(!t){tip.style.opacity=0;return}tip.textContent=t.dataset.tip;tip.style.opacity=1;tip.style.left=Math.min(e.clientX+14,innerWidth-tip.offsetWidth-8)+'px';tip.style.top=(e.clientY+16)+'px'});
document.getElementById('themeBtn').addEventListener('click',()=>{const r=document.documentElement;const d=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=d?'light':'dark'});
</script></body></html>`;
fs.writeFileSync(path.join(reportsDir, 'nhb-shared-block-library.html'), html);
fs.rmSync(tmp, { recursive: true, force: true });

// ---- mapping + markdown ----
fs.writeFileSync(path.join(reportsDir, 'nhb-shared-block-library.mapping.json'), JSON.stringify(variants.map((v) => ({
  site: v.site, perSiteVariantId: v.id, detectedType: v.base, signature: v.key, instances: v.instances, pages: v.pages, example: v.repUrl, block: v.block, variant: v.variant,
})), null, 1));
const md = ['# NHB shared block library — cross-site consolidation', '',
  `${variants.length} per-site variants (${nf(totalInst)} instances) → **${realBlocks.length} shared blocks / ${usedVariants} variants** (${multiSite} used on 2+ sites) + default content (${dcVars.members.length} per-site variants).`, '',
  '| Block | Variant | ' + SITES.map((s) => s.toUpperCase()).join(' | ') + ' | Sites | Instances | Description |',
  '|---|---|' + SITES.map(() => '---:').join('|') + '|---:|---:|---|',
  ...realBlocks.flatMap((b) => Object.entries(lib[b].variants).sort((p, q) => q[1].instances - p[1].instances).map(([vn, x]) => `| ${MAP.blocks[b].label} | ${vn} | ${SITES.map((s) => x.sites[s] || '').join(' | ')} | ${Object.keys(x.sites).length} | ${x.instances} | ${MAP.blocks[b].variants[vn]} |`)),
  `| Default content | rich-text | ${SITES.map((s) => dcVars.members.filter((m) => m.site === s).reduce((a, m) => a + m.instances, 0)).join(' | ')} | 6 | ${dcVars.instances} | ${MAP.blocks['default-content'].variants['rich-text']} |`, ''].join('\n');
fs.writeFileSync(path.join(reportsDir, 'nhb-shared-block-library.md'), md);
console.log(`blocks ${realBlocks.length} | variants ${usedVariants} | multi-site ${multiSite} | default-content ${dcVars.members.length} | html ${(Buffer.byteLength(html) / 1048576).toFixed(1)}MB`);
