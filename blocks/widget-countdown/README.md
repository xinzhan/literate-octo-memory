# widget-countdown

Custom **widget** block. Purpose: Live hours/minutes/seconds countdown to an authored end date (e.g. deal ends in).

## Authoring (Document Authoring)

Model: `configuration`

Key/value rows (label in the first cell, value in the second): either one cell with the ISO end datetime, or rows End | <datetime> and Labels | hours, minutes, seconds.

### Example

| Widget Countdown |
| --- |
| 2026-12-31T23:59:59+08:00 |

### Guidance

Author the end date as plain text in ISO 8601 with a timezone, e.g. 2026-12-31T23:59:59+08:00 (placeholder; edit per campaign). Optional key/value rows: "End | <datetime>", "Labels | hours, minutes, seconds". Do NOT author a /widgets/... link: scripts.js auto-blocks /widgets/ links into the generic widget block. Put the lead-in text as default content above the block. Shows 00 tiles and adds class "expired" after the end date, "no-end-date" if none parses.

## Visual reference

Light grey band (#f5f5f8), centered. Bold lead-in line then three dark rounded tiles (hours / minutes / seconds) ticking down.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
