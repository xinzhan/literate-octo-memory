# Singtel Fibre Page Migration Plan

**Source page:** https://www.singtel.com/personal/products-services/fibre
**Target:** the `literate-octo-memory` Edge Delivery site (content source: Document Authoring, `xinzhan/literate-octo-memory`)

> **Status: ready to run, but I can't start yet.** You asked me to go ahead, and the plan is ready. The session is still in Plan mode, where I can only read and plan. Switch to Execute mode and I'll start with Step 1.

## Overview

This moves the content of the Singtel Fibre product page into the project. The page's structure is analysed, matching blocks are built, an import script is generated, and the page is imported into the local workspace so you can check it in the preview.

What I found in the project:
- **Starting from scratch.** There is no earlier page analysis, no page template list, no import scripts and no imported Fibre page. Nothing will be overwritten.
- **No site catalog**, so the up-front catalog block build is skipped. Blocks are built only for what this page needs.
- **Content source is Document Authoring**, so the project type is probably `da`. Step 1 confirms this.

## How "slowly" will work

You asked me to go slowly, so I'll run one step at a time and stop at these checkpoints:

- **After each step** I'll give you a short summary of what was done and found.
- **Review checkpoints (marked ⏸ below):** I'll stop and wait for your go-ahead before continuing. Here you can change things, for example rename a block, merge two blocks, or leave a section out.
- I won't run several steps in a row or in the background without telling you first.

## Scope

**In scope**
- Main page content of `/personal/products-services/fibre`: hero, plan and price cards, feature sections, promo banners, FAQs and similar content.
- Page metadata: title, description and social image.
- Images used on the page.

**Out of scope (separate steps you can start afterwards)**
- Header/navigation and footer migration.
- Design and styling to match Singtel's look (the "Start Design Migration" step).
- Uploading to Document Authoring, or previewing or publishing on Edge Delivery. Everything stays in the local workspace unless you ask for more.

## Steps

1. **Project setup.** Confirm the project type (`da`) and the block library, and record them in the project's migration config.
2. **Page template.** Classify the URL into a page template, such as a "product landing" template. With one URL there is one template, and it is the representative page.
3. **Page analysis.** Load the live page, take a screenshot, clean the HTML, and identify the sections, blocks, variants and metadata.
   - Singtel may block automated visits. If it does, the scrape falls back to the bot-protection workaround automatically.
   - Interactive parts like tabbed plan selectors, carousels, accordions and address-check widgets are noted. Dynamic widgets such as the coverage check can't be migrated as working features; they are imported as static content or placeholders.
   - ⏸ **Checkpoint:** I'll show you the list of sections and blocks found, and wait for your OK before any code is generated.
4. **Block generation.** For each block found, reuse an existing project block where one fits, extend it with a variant where needed, or create a new block. Likely candidates are hero, cards (plans), columns, tabs, accordion (FAQ) and banner/teaser.
   - ⏸ **Checkpoint:** I'll list which blocks are reused, extended or created, and wait for your OK before generating them.
5. **Block mapping.** Record where each block sits in the source page so the importer can find it.
6. **Import infrastructure.** Generate the parsers (one per block variant) and the cleanup transformers, which strip cookie banners, chat widgets, tracking and the source header and footer. If the page's images come from Adobe Dynamic Media, the Dynamic Media handling is added too.
7. **Content import.** Build the template import script, run it on the Fibre URL, and check the imported page in the preview.
   - ⏸ **Checkpoint:** I'll report how the imported page looks in the preview and point out anything missing or wrong before wrapping up.
8. **Wrap-up.** Summarise what was built, offer to refine the new blocks against the imported content, and suggest "Start Design Migration" as the next step.

## Checklist

- [x] Switch to Execute mode (you do this; it's needed before anything can run)
- [x] Initialize migration plan and progress tracking
- [x] Project setup: confirm project type (`da`) and block library
- [x] Classify the Fibre URL into a page template and name it
- [x] Run page analysis (screenshot, cleaned HTML, metadata, sections, blocks, variants)
- [x] Handle bot protection if the live page blocks access
- [x] Mark the interactive or dynamic parts that can't be migrated as working features
- [x] ⏸ Review the analysed sections and blocks with you
- [x] Get each block's status (reuse, extend or create) and write the block generation list
- [x] ⏸ Review the block generation list with you
- [x] Generate or extend the blocks the page needs
- [x] Validate the generated block files
- [x] Map block selectors into the page template list
- [x] Generate parsers and cleanup and section transformers
- [x] Check the image URLs for Dynamic Media and add that handling if needed
- [x] Generate the import script for the template
- [x] Import the Fibre page into the local workspace
- [x] Check the imported page renders correctly in the preview (structure, blocks, images, metadata)
- [x] ⏸ Review the imported page with you
- [x] Summarise the results and offer block refinement
- [x] Suggest "Start Design Migration" as the next step

## Risks and notes

- **Bot protection:** singtel.com may block automated access. There is a built-in fallback, but it can make loading slower.
- **Dynamic content:** prices, plan selectors and personalised offers may load through JavaScript or APIs. The import captures what the page shows when it is loaded.
- **Local only:** the imported page exists only in the local workspace and preview. Running the import again overwrites any manual edits to it.

## Execution

Switch to Execute mode and I'll start with Step 1 (project setup), then stop at each ⏸ checkpoint for your go-ahead.
