/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-logo
 * Source: .section--partners .section__content (one .partners__logo per logo)
 * Row per logo: logo image | (empty, or link if the logo is linked in source).
 */
export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.partners__logo').forEach((item) => {
    const img = item.querySelector('img');
    if (!img) return;
    const a = item.querySelector('a[href]');
    let second = '';
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim() || img.getAttribute('alt') || a.getAttribute('href');
      second = link;
    }
    cells.push([img, second]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logo', cells });
  element.replaceWith(block);
}
