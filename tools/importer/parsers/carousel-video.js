/* eslint-disable */
/* global WebImporter */

/**
 * Parser: carousel-video
 * Source: .slider--basic (slick slider of YouTube iframes)
 * Row per non-cloned slide: YouTube watch link | optional caption.
 */

function toWatchUrl(src) {
  if (!src) return null;
  try {
    const url = new URL(src, 'https://www.youtube.com');
    const host = url.hostname.replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    else if (/youtube(-nocookie)?\.com$/.test(host)) {
      const m = url.pathname.match(/\/(?:embed|shorts|v)\/([^/?#]+)/);
      id = m ? m[1] : url.searchParams.get('v');
    }
    return id ? `https://www.youtube.com/watch?v=${id}` : url.href;
  } catch (e) {
    return src;
  }
}

export default function parse(element, { document }) {
  const cells = [];

  let slides = [...element.querySelectorAll('.slick-slide:not(.slick-cloned)')];
  if (!slides.length) slides = [...element.querySelectorAll(':scope .slider__content:not(.slider__video)')];

  slides.forEach((slide) => {
    const iframe = slide.querySelector('iframe[src]');
    const href = iframe ? toWatchUrl(iframe.getAttribute('src')) : null;
    if (!href) return;

    const link = document.createElement('a');
    link.href = href;
    link.textContent = href;

    const caption = [];
    const cap = slide.querySelector('.slider__content__caption');
    if (cap && cap.textContent.trim()) {
      const p = document.createElement('p');
      p.innerHTML = cap.innerHTML;
      caption.push(p);
    }
    // additional non-empty paragraphs after the caption (e.g. italic credits)
    slide.querySelectorAll('.slider__content > p:not(.slider__content__caption)').forEach((p) => {
      if (p.textContent.trim()) {
        const np = document.createElement('p');
        np.innerHTML = p.innerHTML;
        caption.push(np);
      }
    });

    cells.push([link, caption.length ? caption : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-video', cells });
  element.replaceWith(block);
}
