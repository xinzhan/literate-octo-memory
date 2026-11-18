/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero-promo-banner
 * Source: div.sc-94066a71-1 (Singtel top-of-page banner)
 * Table:
 *   | Hero Promo Banner |
 *   | background image  |
 *   | H1, offer paragraph, CTA link (bold = primary) |
 */

function absUrl(url, document) {
  if (!url) return '';
  try {
    return new URL(url, document.baseURI || document.location.href).href;
  } catch (e) {
    return url;
  }
}

function minWidthOf(media) {
  if (!media) return 0;
  const m = media.match(/min-width:\s*([\d.]+)\s*(em|rem|px)?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return (m[2] && m[2].toLowerCase() !== 'px') ? n * 16 : n;
}

/** Pick the desktop / largest source from the picture, fall back to the img. */
function bestImageSrc(picture, img) {
  let best = null;
  let bestWidth = -1;
  if (picture) {
    picture.querySelectorAll('source').forEach((source) => {
      const srcset = source.getAttribute('srcset') || source.getAttribute('srcSet') || '';
      const first = srcset.split(',')[0].trim().split(/\s+/)[0];
      if (!first) return;
      const w = minWidthOf(source.getAttribute('media'));
      if (w > bestWidth) {
        bestWidth = w;
        best = first;
      }
    });
  }
  if (best) return best;
  return img ? (img.getAttribute('src') || img.src || '') : '';
}

export default function parse(element, { document }) {
  const cells = [];

  // Row 1: background image (desktop rendition).
  const picture = element.querySelector('picture');
  const srcImg = element.querySelector('picture img, img');
  const src = bestImageSrc(picture, srcImg);
  if (src) {
    const img = document.createElement('img');
    img.src = absUrl(src, document);
    img.alt = srcImg ? (srcImg.getAttribute('alt') || '') : '';
    cells.push([img]);
  } else {
    cells.push(['']);
  }

  // Row 2: heading, offer text, CTA.
  const content = [];
  const heading = element.querySelector('h1, h2, h3');
  if (heading) {
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent.trim();
    content.push(h1);
  }

  element.querySelectorAll('p').forEach((p) => {
    if (p.closest('a, button')) return;
    const text = p.textContent.replace(/​/g, '').trim();
    if (!text) return;
    const para = document.createElement('p');
    para.textContent = text;
    content.push(para);
  });

  element.querySelectorAll('a[href]').forEach((a) => {
    const label = a.textContent.replace(/\s+/g, ' ').trim();
    if (!label) return;
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'), document);
    link.textContent = label;
    strong.append(link);
    p.append(strong);
    content.push(p);
  });

  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-promo-banner', cells });
  element.replaceWith(block);
}
