import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Replaces a picture with an optimized one when the image is same-origin and not SVG.
 * @param {HTMLPictureElement} picture The authored picture
 * @returns {HTMLPictureElement} The picture to use
 */
function optimize(picture) {
  const img = picture.querySelector('img');
  if (!img) return picture;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return picture;
  const optimized = createOptimizedPicture(img.src, img.alt, true, [
    { media: '(min-width: 900px)', width: '2000' },
    { width: '900' },
  ]);
  return optimized;
}

/**
 * Hero promo banner: full-bleed background picture with overlaid text and CTA.
 * Expected rows: [picture], [heading, text, CTA]. Rows/cells may be missing or
 * merged; the first picture becomes the background and everything else is content.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');

  const media = document.createElement('div');
  media.className = 'hero-promo-banner-media';
  if (picture) {
    const pictureParent = picture.parentElement;
    picture.remove();
    media.append(optimize(picture));
    // drop the now-empty paragraph wrapper the picture came from
    if (pictureParent && pictureParent.tagName === 'P' && !pictureParent.textContent.trim()
      && !pictureParent.children.length) {
      pictureParent.remove();
    }
  } else {
    block.classList.add('no-image');
  }

  const content = document.createElement('div');
  content.className = 'hero-promo-banner-content';
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    content.append(...cell.childNodes);
  });
  // strip whitespace-only text nodes left behind by cell moves
  [...content.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
  });

  block.replaceChildren(...(picture ? [media] : []), content);
}
