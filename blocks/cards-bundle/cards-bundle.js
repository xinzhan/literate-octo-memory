import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Bundle cards: static grid of product cards.
 * Row: [image] [body: title with price, text, Select CTA, recontract link].
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.some((c) => c.textContent.trim() || c.querySelector('picture'))) return;
    const li = document.createElement('li');
    cells.forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture')) return;
      cell.className = cell.querySelector('picture') && !cell.textContent.trim()
        ? 'cards-bundle-card-image' : 'cards-bundle-card-body';
      li.append(cell);
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
