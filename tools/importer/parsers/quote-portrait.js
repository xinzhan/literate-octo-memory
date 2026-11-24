/* eslint-disable */
/* global WebImporter */

/**
 * Parser: quote-portrait
 * Source: .quote.quote--with-image
 * Rows: quotation paragraph (highlighted inner span -> strong) | portrait image.
 */

/** Copy nodes into target, converting highlight spans to <strong>. */
function copyQuote(document, source, target, depth) {
  [...source.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      target.append(document.createTextNode(n.textContent));
    } else if (n.nodeType === 1) {
      const tag = n.tagName;
      if (tag === 'BR') {
        target.append(document.createElement('br'));
      } else if (tag === 'SPAN' && depth > 0) {
        const strong = document.createElement('strong');
        copyQuote(document, n, strong, depth + 1);
        target.append(strong);
      } else if (['STRONG', 'B', 'EM', 'I', 'A'].includes(tag)) {
        const el = n.cloneNode(false);
        copyQuote(document, n, el, depth + 1);
        target.append(el);
      } else {
        copyQuote(document, n, target, depth + 1);
      }
    }
  });
}

export default function parse(element, { document }) {
  const cells = [];
  const root = element.querySelector('.quote__content') || element;

  const quote = [];
  const paras = [...root.querySelectorAll(':scope > p')];
  if (paras.length) {
    paras.forEach((src) => {
      if (!src.textContent.trim()) return;
      const p = document.createElement('p');
      copyQuote(document, src, p, 1);
      quote.push(p);
    });
  } else if (root.textContent.trim()) {
    const p = document.createElement('p');
    // An outer wrapper span (sole child, no loose text) is plain; spans inside it are the
    // highlight. The importer may unwrap that wrapper before parsing, leaving the highlight
    // span as a direct child next to loose text, so only treat it as a wrapper when it is.
    const kids = [...root.childNodes].filter((n) => n.nodeType === 1
      || (n.nodeType === 3 && n.textContent.trim()));
    const outer = kids.length === 1 && kids[0].nodeType === 1 && kids[0].tagName === 'SPAN'
      ? kids[0] : null;
    copyQuote(document, outer || root, p, 1);
    quote.push(p);
  }
  if (quote.length) cells.push([quote]);

  const img = element.querySelector('.quote__bg img, img');
  if (img) cells.push([img]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote-portrait', cells });
  element.replaceWith(block);
}
