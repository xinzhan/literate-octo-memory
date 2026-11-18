/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-link-tile
 * Source: div.sc-44916527-8; each tile is an <a> wrapping div.sc-cb1d8bc9-0
 * (thumbnail div.sc-cb1d8bc9-6, title div.sc-cb1d8bc9-19, "Learn more" div.sc-cb1d8bc9-20).
 * Table (one row per tile):
 *   | thumbnail image | title, Learn more link |
 */

function clean(text) {
  return (text || '').replace(/[​ ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function absUrl(url, document) {
  if (!url) return '';
  try {
    return new URL(url, document.baseURI || document.location.href).href;
  } catch (e) {
    return url;
  }
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('div.sc-cb1d8bc9-0').forEach((tile) => {
    const anchor = tile.closest('a[href]');
    const href = anchor ? absUrl(anchor.getAttribute('href'), document) : '';

    let image = '';
    const srcImg = tile.querySelector('div.sc-cb1d8bc9-6 img, img');
    const s = srcImg ? (srcImg.getAttribute('src') || srcImg.src || '') : '';
    if (s && !s.startsWith('data:')) {
      image = document.createElement('img');
      image.src = absUrl(s, document);
      image.alt = srcImg.getAttribute('alt') || '';
    }

    const body = [];
    const title = tile.querySelector('div.sc-cb1d8bc9-19');
    if (title && clean(title.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(title.textContent);
      body.push(p);
    }
    const cta = tile.querySelector('div.sc-cb1d8bc9-20');
    const ctaText = cta ? clean(cta.textContent) : '';
    if (ctaText || href) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = ctaText || 'Learn more';
        p.append(a);
      } else {
        p.textContent = ctaText;
      }
      body.push(p);
    }

    if (!image && !body.length) return;
    cells.push([image, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-link-tile', cells });
  element.replaceWith(block);
}
