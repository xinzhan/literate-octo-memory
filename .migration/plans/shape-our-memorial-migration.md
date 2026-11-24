# Founders' Memorial "Shape Our Memorial" Page Migration Plan

## Goal
Move the single page **https://www.foundersmemorial.gov.sg/shapeourmemorial/en** to AEM Edge Delivery Services so that it looks as close to the original as possible. That covers layout, typography, colours, spacing, imagery, header and footer, on both desktop and mobile. All requests to the source site will be throttled so its bot protection isn't triggered.

## Scope
- **In scope:** this one page with its content, blocks, styling, header, footer and images.
- **Out of scope:** other pages on foundersmemorial.gov.sg, and any upload, preview or publish to Document Authoring or live. Everything stays in the local workspace unless you ask for more later.

## Context & Assumptions
- The project is a Document Authoring (DA) site, `xinzhan/literate-octo-memory`. It already has these blocks: cards, columns, hero, footer, header, fragment and widget.
- The Founders' Memorial site is a Singapore government site. It probably renders most of its content with JavaScript, like the National Heritage Board (NHB) museum sites analysed earlier. That stack sits behind a content delivery network (CDN) that is known to rate-limit, so the capture step will use a real browser, at a slow pace.
- I can't inspect the live page until Execute mode starts, so the section and block breakdown will come from the page analysis step.
- The site's existing global styles, header and footer were built for other work. Getting a close match means extracting this page's own design tokens: fonts, colours and spacing. These may change the site-wide styles.

## Throttling Strategy (avoid bot protection)
- **Fetch once, then reuse the copy.** The page is captured a single time: rendered HTML, desktop and mobile screenshots, computed styles, header and footer markup, and all image files. Every later step (analysis, parsers, import, design, critique) reads that local copy and doesn't go back to the live site.
- **One request at a time.** There are no parallel browser sessions and no parallel sub-agents hitting the source. Pages and tabs are opened one at a time and closed right away.
- **Delays between requests.** I'll leave 3–5 seconds, randomised, between page loads. Image and asset downloads run one after another with about 1–2 seconds between them.
- **Browser-like behaviour.** The capture uses a real Chromium session with a normal desktop user-agent and viewport. It waits for the network to go idle instead of reloading over and over, and scrolls gradually so lazy-loaded content appears without a burst of requests.
- **Minimal live visits during the critique.** The visual critique compares against the source screenshots and computed styles captured at the start. If a live check is really needed (for example a hover state or the mobile menu), it's a single paced visit, not repeated reloads.
- **Back off at the first sign of blocking.** On a 403 or 429, a challenge or CAPTCHA page, or an empty shell page, all requests stop. I'll wait 60 seconds or more, then retry once at a slower pace. If it's still blocked, I'll use the fallback scraper once and won't keep retrying the live site.
- **Bulk import with no extra fetches.** The import runs against the captured HTML wherever possible. If it has to fetch the live URL, it does so once, with no concurrency.

## Approach
1. **Capture the page once, throttled:** follow the strategy above to take screenshots, the rendered and cleaned HTML, computed styles, the header and footer, and the images.
2. **Analyse the page:** split the captured copy into sections and note every visual element, including hero banners, carousels, cards, accordions, embedded media, call-to-action (CTA) buttons and background treatments.
3. **Map blocks:** match each section to an existing block, a new variant of one (for example `hero (memorial)` or `cards (stories)`), or plain content. Write the mappings into the page template configuration.
4. **Build the import pipeline:** create parsers and transformers, then an import script for this page template.
5. **Import the content:** run the bulk import for the URL, with no concurrency. Images are served from the local copies.
6. **Generate the blocks:** build or extend the block JavaScript and CSS for any new block or variant.
7. **Migrate the design:** apply the captured fonts, colour palette, spacing and button styles site-wide, then style each block from the source's computed styles.
8. **Migrate the header and footer:** rebuild the Founders' Memorial navigation (desktop and mobile menu) and footer from the captured markup.
9. **Run a visual critique loop:** compare each block and then the full page against the captured source screenshots on desktop and mobile. Fix the differences and repeat until they match closely.

## Checklist
- [ ] Capture the source page once, throttled: desktop and mobile screenshots, rendered HTML, computed styles, header and footer, images (one request at a time, 3–5 s delays)
- [ ] Check the capture is complete and isn't a bot-challenge page; back off and use the fallback scraper if it was blocked
- [ ] Analyse the captured page (sections, block variants, cleaned HTML)
- [ ] Map the blocks and sections into the page template configuration
- [ ] Generate the import parsers and transformers
- [ ] Generate the import script for the page template
- [ ] Import the page into the local workspace with no concurrency, and check that the content is complete (text, images, links)
- [ ] Generate or extend the blocks and variants this page needs
- [ ] Extract and apply the site-wide design from the captured styles: fonts, colours, spacing, buttons
- [ ] Style each block to match the source's computed styles
- [ ] Migrate the header and navigation, including mobile behaviour (at most one paced live visit for interaction states)
- [ ] Migrate the footer
- [ ] Run a visual critique of each block against the captured source and fix the differences
- [ ] Run a full-page critique on desktop and mobile and fix what's left
- [ ] Final check in the preview, with a summary of what changed (local workspace only) and any known differences

## Risks / Notes
- **Bot protection:** even with throttling, the CDN may still challenge automated visits. If that happens, I'll use the fallback scraper once and work only from that capture. Any states that couldn't be captured, such as hover effects, will be listed.
- **Throttling costs time:** spacing out requests and downloading images one by one makes the capture slower. This is deliberate.
- **Fonts:** if the source uses licensed or custom web fonts, I'll match them where the files can be used legally. Otherwise I'll use the closest web-safe or Google Font.
- **Interactive pieces:** carousels, video embeds and forms are rebuilt as EDS blocks. A form that submits to the original site's backend can't be made to work and may need a placeholder.
- **Shared styles:** the global style changes affect other pages already in this project. Any conflicts will be flagged.

*The work starts once you switch to Execute mode.*
