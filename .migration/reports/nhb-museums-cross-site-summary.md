# NHB museum & heritage sites — cross-site summary

Generated 2026-11-06. 6 domains, each analysed individually.

| Site | Pages | Non-200 | Docs/media | Rendered | Layout families | Block instances | Variants | Unknown share | FE services | Backend services | Dashboard |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Asian Civilisations Museum (acm.nhb.gov.sg) | 211 | 0 | 77 | 201 | 8 | 1072 | 77 | 8% | 12 | 7 | acm-nhb-gov-sg-site-analysis-dashboard.html |
| Indian Heritage Centre (indianheritage.gov.sg) | 156 | 1 | 10 | 155 | 9 | 626 | 67 | 12% | 9 | 1 | indianheritage-gov-sg-site-analysis-dashboard.html |
| Malay Heritage Centre (malayheritage.gov.sg) | 89 | 11 | 20 | 78 | 9 | 165 | 42 | 1% | 9 | 8 | malayheritage-gov-sg-site-analysis-dashboard.html |
| National Museum of Singapore (nationalmuseum.nhb.gov.sg) | 98 | 0 | 0 | 98 | 11 | 246 | 103 | 5% | 11 | 4 | nationalmuseum-nhb-gov-sg-site-analysis-dashboard.html |
| Peranakan Museum (peranakanmuseum.nhb.gov.sg) | 95 | 1 | 9 | 94 | 7 | 364 | 40 | 3% | 10 | 3 | peranakanmuseum-nhb-gov-sg-site-analysis-dashboard.html |
| Sun Yat Sen Nanyang Memorial Hall (sysnmh.org.sg) | 321 | 1 | 46 | 320 | 6 | 1261 | 22 | 19% | 6 | 1 | sysnmh-org-sg-site-analysis-dashboard.html |
| **Total** | **970** | **14** | **162** | **946** | 12 distinct | **3734** | **351** | | | | |

## Asian Civilisations Museum

- 211 pages discovered (211 live, 0 non-200) and 77 documents/media assets; all 201 unique live pages (after collapsing query-string/duplicate URLs) were rendered and fingerprinted — no sampling.
- 8 layout families from 63 structural signatures — largest: article-text (~85), media-article (~70), embed-page (~21).
- 1,072 block instances roll up into 77 variants; Unknown/Custom share 8% of instances.
- Front-end services: WOGAA (SG Gov analytics), Meta (Facebook) Pixel, Google Tag Manager, Quantcast, Twitter/X Pixel, AddThis (discontinued 2023), Meta Conversions API automation, Campaign Monitor, YouTube embed, VThere 3D virtual tours, Conversant / Epsilon (Dotomi), Matterport.
- No sitemap.xml published — discovery relied on the crawl alone.
- No sitemap.xml (404) and robots.txt returns a Next.js error page instead of a robots file — search engines get no crawl guidance; discovery here relied on the crawl alone.
- AddThis sharing script still loads on every page although the service was shut down in 2023 — dead third-party code to drop in the migration. ACM is also the only site with Quantcast and Twitter/X pixels, and embeds both VThere and Matterport 3D tours.
- Event and lecture detail pages (whats-on/*) are the bulk of the site: rich-text bodies beside a lead image map to EDS default content + a Columns block; a few pages embed VThere 3D virtual tours and data tables.
- Largest document library of the six (60 PDFs, e.g. social stories, gallery guides) served via the shared /api/media endpoint.

## Indian Heritage Centre

- 156 pages discovered (155 live, 1 non-200) and 10 documents/media assets; all 155 unique live pages (after collapsing query-string/duplicate URLs) were rendered and fingerprinted — no sampling.
- 9 layout families from 49 structural signatures — largest: breadcrumb-page (~46), media-article (~38), article-text (~35).
- 626 block instances roll up into 67 variants; Unknown/Custom share 12% of instances.
- Front-end services: WOGAA (SG Gov analytics), Google Tag Manager, Meta (Facebook) Pixel, Meta Conversions API automation, Google Analytics, Campaign Monitor, YouTube embed, Google Programmable Search, Conversant / Epsilon (Dotomi).
- sitemap.xml lists 115 URLs; 79 pages were found only via the sitemap (not linked in crawlable HTML). 115 entries redirect (stale paths). 1 entries do not resolve to a 200 page.
- Bilingual English / Tamil (/en, /ta — 36 Tamil pages); the sitemap omits the language prefix, so all 115 sitemap URLs redirect — and 79 pages (70 of them programme pages) were found only via the sitemap, not through links.
- Programme pages (en/whats-on/programmes, 76 pages) dominate and share one detail layout — one import parser covers half the site.
- Collection highlights are captured as individual card tiles; site search uses Google Programmable Search.

## Malay Heritage Centre

- 89 pages discovered (78 live, 11 non-200) and 20 documents/media assets; all 78 unique live pages (after collapsing query-string/duplicate URLs) were rendered and fingerprinted — no sampling.
- 9 layout families from 29 structural signatures — largest: minimal-page (~24), article-text (~21), data-table (~10).
- 165 block instances roll up into 42 variants; Unknown/Custom share 1% of instances.
- Front-end services: WOGAA (SG Gov analytics), Meta (Facebook) Pixel, Google Tag Manager, Google Analytics, Meta Conversions API automation, Campaign Monitor, YouTube embed, CDN/JS libs, Conversant / Epsilon (Dotomi).
- sitemap.xml lists 79 URLs; 11 pages were found only via the sitemap (not linked in crawlable HTML). 10 entries redirect (stale paths). 9 entries do not resolve to a 200 page.
- Section landing URLs listed in the sitemap (/whats-on, /plan-your-visit, /resources) redirect to /%23 (an encoded '#') and return 404 — broken top-level navigation targets.
- 11 URLs return 404, including 6 archived programme pages still in the sitemap and an e-mail address published as a relative link (/plan-your-visit/NHB_MHC@nhb.gov.sg).
- Header and footer sit inside the <main> element (treated as page chrome by the analysis); the smallest site of the six by page count — a quick win for a pilot.

## National Museum of Singapore

- 98 pages discovered (98 live, 0 non-200) and 0 documents/media assets; all 98 unique live pages (after collapsing query-string/duplicate URLs) were rendered and fingerprinted — no sampling.
- 11 layout families from 31 structural signatures — largest: article-text (~52), embed-page (~14), data-table (~10).
- 246 block instances roll up into 103 variants; Unknown/Custom share 5% of instances.
- Front-end services: Meta (Facebook) Pixel, TikTok Pixel, WOGAA (SG Gov analytics), Google Tag Manager, UserWay accessibility overlay, CDN/JS libs, Meta Conversions API automation, Google Analytics, YouTube embed, Conversant / Epsilon (Dotomi), Google Programmable Search.
- sitemap.xml lists 71 URLs; 43 pages were found only via the sitemap (not linked in crawlable HTML). 4 entries redirect (stale paths).
- A hidden UserWay accessibility overlay injects a zero-height '.content' element ahead of <main>; the analysis selects the visible main container instead.
- What's On listings are filterable, paginated card grids with an 'Add to itinerary' feature (visitor itinerary planner) — custom functionality to rebuild as an EDS block plus a small client-side store.
- Only site with a TikTok pixel and the UserWay overlay; no documents served from its own host (assets are referenced from cms.nhb.gov.sg).
- A '/chinese-hidden-page' is listed in the sitemap — confirm whether it should be published or retired.

## Peranakan Museum

- 95 pages discovered (94 live, 1 non-200) and 9 documents/media assets; all 94 unique live pages (after collapsing query-string/duplicate URLs) were rendered and fingerprinted — no sampling.
- 7 layout families from 27 structural signatures — largest: breadcrumb-page (~60), embed-page (~16), form-page (~6).
- 364 block instances roll up into 40 variants; Unknown/Custom share 3% of instances.
- Front-end services: WOGAA (SG Gov analytics), Google Tag Manager, Meta (Facebook) Pixel, Meta Conversions API automation, Google Analytics, Campaign Monitor, Conversant / Epsilon (Dotomi), Google Programmable Search, VThere 3D virtual tours, Google Ads/DoubleClick.
- sitemap.xml lists 59 URLs; 27 pages were found only via the sitemap (not linked in crawlable HTML). 59 entries point at cms.nhb.gov.sg instead of the public host. 1 entries do not resolve to a 200 page.
- All 59 sitemap.xml entries point at cms.nhb.gov.sg (the CMS host), which returns 403 — the published sitemap is unusable for search engines; it also lists a /404 page.
- Digital resources (learn/digital-resources, 25 pages) pair an embedded video/viewer with a 'Related resources' list — map to Embed/Video + Cards (list) blocks.
- Gallery pages (galleries/*) and in-gallery content form a second, consistent layout family.

## Sun Yat Sen Nanyang Memorial Hall

- 321 pages discovered (320 live, 1 non-200) and 46 documents/media assets; all 320 unique live pages (after collapsing query-string/duplicate URLs) were rendered and fingerprinted — no sampling.
- 6 layout families from 23 structural signatures — largest: breadcrumb-page (~230), media-article (~58), data-table (~25).
- 1,261 block instances roll up into 22 variants; Unknown/Custom share 19% of instances.
- Front-end services: WOGAA (SG Gov analytics), Google Tag Manager, Google Analytics, Campaign Monitor, YouTube embed, Google Programmable Search.
- sitemap.xml lists 304 URLs; 284 pages were found only via the sitemap (not linked in crawlable HTML). 304 entries redirect (stale paths). 1 entries do not resolve to a 200 page.
- Largest site (320 pages): 203 event pages and 76 exhibition pages under en/whats-on, going back to 2011 — a content-pruning / archive decision will materially reduce migration volume.
- The sitemap omits the /en prefix, so all 304 entries redirect; the crawler found only 37 HTML pages by following links — 284 pages came only from the sitemap.
- Event detail pages share an article + 'Information' sidebar layout (dates, venue, admission) — model as default content + an Event Info block.
- Bilingual English / Chinese (/en, /ch) — only 18 Chinese pages, so the two locales are not in parity.

## Recommendations

- Treat the six sites as one programme: all run the same stack (Next.js with incremental static regeneration on AWS CloudFront, a shared /api/media asset API and the cms.nhb.gov.sg headless CMS). Build one shared EDS block library and one set of import parsers, then theme per museum.
- Start with a pilot on the Malay Heritage Centre (smallest, 78 live pages) or the Peranakan Museum (few custom blocks, 3% Unknown), then scale the same parsers to National Museum, IHC, ACM and SYSNMH.
- Core shared blocks: Columns (text|image), Cards (grid + list variants, incl. filterable listings with pagination), Embed/Video, Table, Accordion, Breadcrumbs, Event Info (sidebar facts) and a Form block for FormSG/Campaign Monitor sign-ups.
- Fix discovery before cut-over: publish correct sitemaps (IHC/SYSNMH missing /en, Peranakan pointing at the CMS host, MHC listing 404s and redirect-to-/%23 sections, ACM without sitemap or robots.txt). EDS can generate sitemaps from the query index.
- Decide archive scope for past events/programmes (SYSNMH back to 2011, ACM lectures, IHC programmes) — migrate, archive as PDFs/static, or redirect.
- Rationalise third-party tags during migration: keep WOGAA (mandatory for SG Government sites), GA4/GTM and required pixels; drop AddThis (discontinued) and review Quantcast, Dotomi, Twitter/X and TikTok pixels; load all via delayed.js to protect Core Web Vitals.
- Plan locale structure for IHC (en/ta) and SYSNMH (en/ch) as EDS language folders, and decide whether the partial Chinese/Tamil content should reach parity.
- Rebuild custom features as EDS blocks: NMS itinerary planner, filterable What's On listings, VThere 3D tour embeds, and site search (Google Programmable Search today).
