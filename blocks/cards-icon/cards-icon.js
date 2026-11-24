function isCta(el) {
  const links = el.querySelectorAll('a[href]');
  return links.length > 0 && el.textContent.trim() === [...links].map((a) => a.textContent).join('').trim();
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-icon-card';

    const image = document.createElement('div');
    image.className = 'cards-icon-card-image';
    const title = document.createElement('div');
    title.className = 'cards-icon-card-title';
    const cta = document.createElement('div');
    cta.className = 'cards-icon-card-cta';

    // Gather all content regardless of which cell the author used.
    [...row.children].forEach((cell) => {
      [...cell.children].forEach((child) => {
        if (child.matches('picture') || (child.querySelector('picture, img') && !child.textContent.trim())) {
          image.append(child);
        } else if (isCta(child)) {
          cta.append(child);
        } else if (child.textContent.trim()) {
          title.append(child);
        }
      });
      // a cell holding bare text (no wrapping element)
      if (!cell.children.length && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = cell.textContent.trim();
        title.append(p);
      }
    });

    // CTA links always render as pill buttons
    cta.querySelectorAll('a[href]').forEach((a) => {
      a.classList.add('cards-icon-button');
    });

    // source order is title, icon, CTA (the authored table puts the icon first)
    [title, image, cta].forEach((part) => { if (part.children.length) li.append(part); });
    if (li.children.length) ul.append(li);
  });

  block.replaceChildren(ul);
}
