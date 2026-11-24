/* eslint-disable */
/* global WebImporter */

/**
 * Parser: carousel-hero
 * Source: .banner__wrap--homepage (foundersmemorial.gov.sg/shapeourmemorial/en)
 * Images and text live in two separate slick sliders (.slider__home--visual and
 * .slider__home--text); slides are paired by index, skipping .slick-cloned.
 * Row per slide: image | title (h1 for slide 1, h2 after) + description + optional CTA.
 */

/** Pick the largest candidate URL from a srcset string. */
function largestFromSrcset(srcset) {
  if (!srcset) return null;
  let best = null;
  let bestW = -1;
  srcset.split(/,\s+(?=\S)/).forEach((part) => {
    const [url, descriptor] = part.trim().split(/\s+/);
    if (!url) return;
    const w = descriptor && /w$/.test(descriptor) ? parseInt(descriptor, 10) : 0;
    if (w > bestW) { bestW = w; best = url; }
  });
  return best;
}

/** Build an <img> using the desktop 1280x640 source when available. */
function buildImage(document, slide) {
  const img = slide.querySelector('img');
  if (!img) return null;
  const base = img.src || img.getAttribute('src') || '';
  let src = null;
  const sources = [...slide.querySelectorAll('picture source')];
  const desktop = sources.find((s) => /desktop/i.test(s.getAttribute('srcset') || ''))
    || sources.find((s) => /min-width/i.test(s.getAttribute('media') || ''));
  if (desktop) src = largestFromSrcset(desktop.getAttribute('srcset'));
  if (!src) src = base;
  try { src = new URL(src, base || undefined).href; } catch (e) { /* keep as is */ }

  const out = document.createElement('img');
  out.src = src;
  out.alt = img.getAttribute('alt') || '';
  return out;
}

function realSlides(root, sliderSel, itemSel) {
  let slides = [...root.querySelectorAll(`${sliderSel} .slick-slide:not(.slick-cloned)`)];
  if (!slides.length) slides = [...root.querySelectorAll(itemSel)];
  return slides;
}

export default function parse(element, { document }) {
  const cells = [];

  const visuals = realSlides(element, '.slider__home--visual', '.banner__item');
  const texts = realSlides(element, '.slider__home--text', '.banner__text-item');
  const count = Math.max(visuals.length, texts.length);

  for (let i = 0; i < count; i += 1) {
    const visual = visuals[i];
    const text = texts[i];

    const image = visual ? buildImage(document, visual) : null;
    const content = [];

    if (text) {
      const titleEl = text.querySelector('.banner__title');
      if (titleEl && titleEl.textContent.trim()) {
        const h = document.createElement(i === 0 ? 'h1' : 'h2');
        [...titleEl.childNodes].forEach((n) => {
          if (n.nodeType === 1 && n.tagName === 'SPAN') {
            h.append(document.createTextNode(n.textContent));
          } else {
            h.append(n.cloneNode(true));
          }
        });
        content.push(h);
      }

      text.querySelectorAll('.banner__desc').forEach((d) => {
        if (d.textContent.trim()) {
          const p = document.createElement('p');
          p.innerHTML = d.innerHTML;
          content.push(p);
        }
      });

      // optional CTA links (excluding anything inside title/description)
      text.querySelectorAll('a[href]').forEach((a) => {
        if (a.closest('.banner__title, .banner__desc')) return;
        if (!a.textContent.trim()) return;
        const p = document.createElement('p');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.trim();
        p.append(link);
        content.push(p);
      });
    }

    if (!image && !content.length) continue;
    cells.push([image || '', content.length ? content : '']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
