import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Feature cards: icon disc beside a title and paragraph, in a 2-column grid.
 * Row: [icon image] [body: title, text]. A missing icon cell is tolerated.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.some((c) => c.textContent.trim() || c.querySelector('picture, .icon'))) return;
    const li = document.createElement('li');
    cells.forEach((cell) => {
      const hasMedia = !!cell.querySelector('picture, .icon');
      if (!cell.textContent.trim() && !hasMedia) return;
      cell.className = hasMedia && !cell.textContent.trim()
        ? 'cards-feature-card-icon' : 'cards-feature-card-body';
      li.append(cell);
    });
    if (!li.querySelector('.cards-feature-card-icon')) li.classList.add('no-icon');
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]));
  });
  block.replaceChildren(ul);
}
