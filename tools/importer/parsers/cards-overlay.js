/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-overlay
 * Source: .card__wrap--2col (one a.card per item)
 * Row per card: image | linked title (title text linked to the card href).
 */
export default function parse(element, { document }) {
  const cells = [];

  let cards = [...element.querySelectorAll('a.card')];
  if (!cards.length) cards = [...element.querySelectorAll('.card')];

  cards.forEach((card) => {
    const img = card.querySelector('.card__image img, img');
    const titleEl = card.querySelector('.card__title, .card__desc');
    const href = card.getAttribute('href')
      || (card.querySelector('a[href]') && card.querySelector('a[href]').getAttribute('href'));
    const titleText = titleEl ? titleEl.textContent.trim() : ((img && img.getAttribute('alt')) || '').trim();

    const content = [];
    if (titleText) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        p.append(a);
      } else {
        p.textContent = titleText;
      }
      content.push(p);
    }

    if (!img && !content.length) return;
    cells.push([img || '', content.length ? content : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-overlay', cells });
  element.replaceWith(block);
}
