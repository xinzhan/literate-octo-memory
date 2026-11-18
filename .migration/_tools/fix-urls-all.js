#!/usr/bin/env node
// Post-process urls-all.json: extension-less media endpoints (/api/media/..., /-/media/...)
// are assets, not pages — move them from `urls` to `documents` so they are never rendered.
// Usage: node fix-urls-all.js <catalogFolder>
const fs = require('fs');
const path = require('path');
const f = path.join(process.argv[2], 'urls-all.json');
const j = JSON.parse(fs.readFileSync(f, 'utf8'));
const a = j['analysis-urls-all'];
const isMedia = (u) => /\/(api\/media|-\/media)\//i.test(u);
const moved = a.urls.filter((o) => isMedia(o.url));
a.urls = a.urls.filter((o) => !isMedia(o.url));
a.documents = a.documents.concat(moved.map((o) => ({ ...o, kind: 'media-endpoint' })));
a.totalUrls = a.urls.length;
a.totalDocuments = a.documents.length;
a.method = 'crawl + sitemap.xml (resolved)';
fs.writeFileSync(f, JSON.stringify(j, null, 2));
console.log(path.basename(process.argv[2]), '| pages', a.totalUrls, '| documents/media', a.totalDocuments, `(moved ${moved.length} media endpoints)`);
