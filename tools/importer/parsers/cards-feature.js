/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-feature
 * Source: 2-column feature grid; each feature is div.sc-736da13b-0
 * (icon wrapper div.sc-736da13b-4, text wrapper div.sc-736da13b-7).
 * Table (one row per feature):
 *   | icon image | H3 title, description |
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

/** Copy a paragraph keeping inline links and emphasis, with absolute hrefs. */
function copyParagraph(p, document) {
  const out = document.createElement('p');
  out.innerHTML = p.innerHTML;
  out.querySelectorAll('[class]').forEach((n) => n.removeAttribute('class'));
  out.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', absUrl(a.getAttribute('href'), document)));
  return out;
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('div.sc-736da13b-0').forEach((item) => {
    let image = '';
    const srcImg = item.querySelector('div.sc-736da13b-4 img');
    const s = srcImg ? (srcImg.getAttribute('src') || srcImg.src || '') : '';
    if (s && !s.startsWith('data:')) {
      image = document.createElement('img');
      image.src = absUrl(s, document);
      image.alt = srcImg.getAttribute('alt') || '';
    }

    const body = [];
    const textWrap = item.querySelector('div.sc-736da13b-7') || item;
    const h = textWrap.querySelector('h1, h2, h3, h4, h5, h6');
    if (h && clean(h.textContent)) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(h.textContent);
      body.push(h3);
    }
    textWrap.querySelectorAll('p').forEach((p) => {
      if (!clean(p.textContent)) return;
      if (p.querySelector('p')) return;
      body.push(copyParagraph(p, document));
    });

    if (!image && !body.length) return;
    cells.push([image, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
