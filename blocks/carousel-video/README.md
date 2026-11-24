# carousel-video

Custom **carousel** block. Purpose: Carousel of full-width 16:9 YouTube videos with edge arrows and bar indicators; iframes load lazily.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1: Carousel (video); row 2..n (one per slide): YouTube link (in place of the image) | Optional caption (empty in source).

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)

## Notes

Slides carry YouTube links (https://www.youtube.com/watch?v=ttLUNi9sqpk, https://www.youtube.com/watch?v=XblaSObutgI) in the media cell instead of an image; the block JS turns them into iframes. Captions are empty in the source.

Use when several YouTube videos share one slot. For a single video use embed-video.
