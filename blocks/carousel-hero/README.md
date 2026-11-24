# carousel-hero

Custom **carousel** block. Purpose: Top-of-page masthead carousel: full-width photo slides with a text panel (title, description, optional CTA) on the right, bar indicators and edge arrows.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1: Carousel (hero); row 2..n (one per slide): Image (mandatory, nothing else) | Title (heading), description paragraph(s), optional CTA link.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Notes

Source title is p.banner__title (the source page has no h1). Author slide 1's title as h1 and later slides' as h2. Use the desktop 1280x640 masthead images (masthead_carousel_0N_desktop_1280x640) rather than the mobile 360x318 crops in cleaned.html. The scroll-down chevron (#next) is decorative and is dropped or added by the block JS.

Use for a page-opening carousel of photo stories. For a single static banner use hero; for video slides use carousel-video.
