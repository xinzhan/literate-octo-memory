import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Link tiles: small thumbnail beside a title and a "Learn more" link.
 * Row: [thumbnail] [body: title, link]. The whole tile becomes clickable via
 * the first link in the body.
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
        ? 'cards-link-tile-card-image' : 'cards-link-tile-card-body';
      li.append(cell);
    });
    const link = li.querySelector('.cards-link-tile-card-body a[href]');
    if (link) {
      link.classList.add('cards-link-tile-link');
      li.classList.add('linked');
    }
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]));
  });
  block.replaceChildren(ul);
}
