/* eslint-disable */
/* global WebImporter */

/**
 * Parser: widget-countdown
 * Source: div.sc-d670ebe-0 (hours / minutes / seconds tiles rendered client-side)
 * Table:
 *   | Widget Countdown          |
 *   | 2026-12-31T23:59:59+08:00 |
 *
 * The source only renders the live remaining time, not the campaign end date,
 * so the end date is an authored placeholder (edit per campaign). It is plain
 * text on purpose: a /widgets/ link would be auto-blocked by scripts.js into a
 * nested generic widget block. The "Don't miss out! ... ends in:" lead-in sits
 * outside this element and stays as default content.
 */

const END_DATE_PLACEHOLDER = '2026-12-31T23:59:59+08:00';

export default function parse(element, { document }) {
  const p = document.createElement('p');
  p.textContent = END_DATE_PLACEHOLDER;
  const cells = [[p]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'widget-countdown', cells });
  element.replaceWith(block);
}
