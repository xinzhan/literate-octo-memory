import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const pic = row.querySelector('picture') || row.querySelector('img');
    if (!pic) return; // image-only block: rows without a logo are skipped
    const li = document.createElement('li');
    li.className = 'cards-logo-item';

    // keep an authored link around the logo if there is one
    const link = row.querySelector('a[href]');
    if (link) {
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'cards-logo-link';
      const img = pic.tagName === 'IMG' ? pic : pic.querySelector('img');
      a.setAttribute('aria-label', (img && img.alt) || link.textContent.trim() || 'Partner');
      a.append(pic);
      li.append(a);
    } else {
      li.append(pic);
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });

  block.replaceChildren(ul);
}
