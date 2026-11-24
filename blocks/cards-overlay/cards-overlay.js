import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-overlay-card';

    const image = document.createElement('div');
    image.className = 'cards-overlay-card-image';
    const body = document.createElement('div');
    body.className = 'cards-overlay-card-body';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && !image.children.length) image.append(pic);
      if (cell.textContent.trim()) body.append(...cell.childNodes);
    });
    // drop empty wrappers left behind by a moved picture
    body.querySelectorAll('p').forEach((p) => { if (!p.textContent.trim() && !p.querySelector('img')) p.remove(); });

    // The whole tile is the link (source: a.card wraps image + title).
    const link = body.querySelector('a[href]');
    let card = li;
    if (link) {
      const a = document.createElement('a');
      a.className = 'cards-overlay-card-link';
      a.href = link.href;
      if (link.target) a.target = link.target;
      if (link.title) a.title = link.title;
      // unwrap inner links so we don't nest anchors
      body.querySelectorAll('a').forEach((inner) => {
        inner.replaceWith(...inner.childNodes);
      });
      li.append(a);
      card = a;
    }

    if (image.children.length) card.append(image);
    else li.classList.add('no-image');
    if (body.textContent.trim()) card.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}
