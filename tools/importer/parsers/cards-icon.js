/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-icon
 * Source: #section2 .row (one .icon__wrap per card)
 * Row per card: icon image | title (p > strong) + CTA link.
 */
export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.icon__wrap').forEach((item) => {
    const img = item.querySelector('.icon__image img, img');
    const content = [];

    const title = item.querySelector('.icon__title');
    if (title && title.textContent.trim()) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = title.textContent.trim();
      p.append(strong);
      content.push(p);
    }

    item.querySelectorAll('a[href]').forEach((a) => {
      const label = a.textContent.trim();
      if (!label) return;
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = label;
      p.append(link);
      content.push(p);
    });

    if (!img && !content.length) return;
    cells.push([img || '', content.length ? content : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
