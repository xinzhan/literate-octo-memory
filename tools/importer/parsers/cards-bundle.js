/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-bundle
 * Source: div.sc-44916527-68 (bundle carousel, same structure as cards-plan).
 * Cards are div.sc-44916527-73; arrow buttons (div.sc-44916527-70) are ignored.
 * Table (one row per bundle):
 *   | image | H3 title with price, description, **Select** link, recontract link |
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

function parseCard(card, document) {
  let image = '';
  const srcImg = card.querySelector('div.sc-44916527-76 img');
  const s = srcImg ? (srcImg.getAttribute('src') || srcImg.src || '') : '';
  if (s && !s.startsWith('data:')) {
    image = document.createElement('img');
    image.src = absUrl(s, document);
    image.alt = srcImg.getAttribute('alt') || '';
  }

  const body = [];
  const h = card.querySelector('div.sc-44916527-77 h3, div.sc-44916527-77 h2, div.sc-44916527-77 h4');
  if (h && clean(h.textContent)) {
    const h3 = document.createElement('h3');
    h3.textContent = clean(h.textContent);
    body.push(h3);
  }

  const desc = card.querySelector('div.sc-44916527-78');
  if (desc) {
    desc.querySelectorAll('p').forEach((p) => {
      const t = clean(p.textContent);
      if (!t) return;
      const para = document.createElement('p');
      para.textContent = t;
      body.push(para);
    });
  }

  const ctaWrap = card.querySelector('div.sc-44916527-51');
  if (ctaWrap) {
    ctaWrap.querySelectorAll('a[href]').forEach((a, i) => {
      const label = clean(a.textContent);
      if (!label) return;
      const link = document.createElement('a');
      link.href = absUrl(a.getAttribute('href'), document);
      link.textContent = label;
      const p = document.createElement('p');
      if (i === 0) {
        const strong = document.createElement('strong');
        strong.append(link);
        p.append(strong);
      } else {
        p.append(link);
      }
      body.push(p);
    });
  }

  return [image, body];
}

export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('div.sc-44916527-73').forEach((card) => {
    if (!clean(card.textContent) && !card.querySelector('img')) return;
    cells.push(parseCard(card, document));
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-bundle', cells });
  element.replaceWith(block);
}
