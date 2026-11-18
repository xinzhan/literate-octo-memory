import { createOptimizedPicture } from '../../scripts/aem.js';

const HEADING = 'h1, h2, h3, h4, h5, h6';

/**
 * Optimizes same-origin, non-SVG pictures inside a container.
 * @param {Element} root Container element
 */
function optimizePictures(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
}

/**
 * True when an element only holds pictures (and whitespace / overflow text like "+2").
 * @param {Element} el Element
 */
function isPictureRow(el) {
  return el.tagName === 'P' && !!el.querySelector('picture');
}

/**
 * Groups `label paragraph + list (+ picture paragraphs)` runs into list sections.
 * Elements before the first list stay in the main body.
 * @param {Element} body The card body cell
 * @returns {{ main: Element[], groups: Element[][] }}
 */
function groupBody(body) {
  const children = [...body.children];
  const firstList = children.findIndex((el) => el.tagName === 'UL' || el.tagName === 'OL');
  if (firstList === -1) return { main: children, groups: [] };

  // the paragraph right before a list is its label
  const mainEnd = firstList > 0 && children[firstList - 1].tagName === 'P'
    && !children[firstList - 1].querySelector('a') ? firstList - 1 : firstList;
  const main = children.slice(0, mainEnd);
  const groups = [];
  let current = [];
  children.slice(mainEnd).forEach((el, i, rest) => {
    const next = rest[i + 1];
    const startsGroup = el.tagName === 'P' && !isPictureRow(el) && next
      && (next.tagName === 'UL' || next.tagName === 'OL');
    if (startsGroup && current.some((c) => c.tagName === 'UL' || c.tagName === 'OL')) {
      groups.push(current);
      current = [];
    }
    current.push(el);
  });
  if (current.length) groups.push(current);
  return { main, groups };
}

/**
 * Marks known parts of the main body: badge, promo pill, strike price.
 * @param {Element[]} main Main body elements
 * @param {HTMLLIElement} li Card element
 * @returns {Element[]} Elements remaining in the body
 */
function decorateMain(main, li) {
  const remaining = [...main];
  const headingIndex = remaining.findIndex((el) => el.matches(HEADING));

  // a short paragraph before the title is the tab badge
  if (headingIndex > 0) {
    const badge = remaining[0];
    if (badge.tagName === 'P' && !badge.querySelector('a, picture')) {
      badge.classList.add('cards-plan-badge');
      li.prepend(badge);
      remaining.shift();
    }
  }

  const heading = remaining.find((el) => el.matches(HEADING));
  if (heading) {
    heading.classList.add('cards-plan-title');
    const pill = heading.nextElementSibling;
    if (pill && pill.tagName === 'P' && !pill.querySelector('a, picture')) {
      const only = pill.children.length === 1 ? pill.firstElementChild : null;
      if (only && ['STRONG', 'EM'].includes(only.tagName)
        && only.textContent.trim() === pill.textContent.trim()) {
        pill.classList.add('cards-plan-promo');
      }
    }
  }

  remaining.forEach((el) => {
    if (el.tagName === 'P' && el.querySelector('del, s')) el.classList.add('cards-plan-strike');
  });
  return remaining;
}

/**
 * Adds prev/next buttons that scroll the card list.
 * @param {Element} block The block element
 * @param {HTMLUListElement} ul Card list
 */
function addScroller(block, ul) {
  const nav = document.createElement('div');
  nav.className = 'cards-plan-nav';
  const makeButton = (dir, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `cards-plan-${dir}`;
    button.setAttribute('aria-label', label);
    nav.append(button);
    return button;
  };
  const prev = makeButton('prev', 'Previous plans');
  const next = makeButton('next', 'Next plans');

  const step = () => {
    const card = ul.querySelector(':scope > li');
    const gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : ul.clientWidth;
  };
  const update = () => {
    const max = ul.scrollWidth - ul.clientWidth - 1;
    block.classList.toggle('scrollable', max > 0);
    prev.disabled = ul.scrollLeft <= 0;
    next.disabled = ul.scrollLeft >= max;
  };

  prev.addEventListener('click', () => ul.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => ul.scrollBy({ left: step(), behavior: 'smooth' }));
  ul.addEventListener('scroll', update, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(update).observe(ul);
  block.append(nav);
  update();
}

/**
 * Plan cards in a horizontal scroller.
 * Row: [image] [body: badge, title, promo, price lines, CTAs, lists] [optional exclusives].
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    // ignore empty cells so an omitted image cell doesn't shift the body
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture'));
    if (!cells.length) return;

    const li = document.createElement('li');
    const imageCell = cells.find((c) => c.children.length === 1 && c.querySelector(':scope > picture, :scope > p > picture')
      && !c.textContent.trim());
    const textCells = cells.filter((c) => c !== imageCell);
    const body = textCells.shift() || document.createElement('div');
    const extraCell = textCells.length ? textCells : [];

    if (imageCell) {
      imageCell.className = 'cards-plan-card-image';
      li.append(imageCell);
    }

    const { main, groups } = groupBody(body);
    body.className = 'cards-plan-card-body';
    body.replaceChildren(...decorateMain(main, li));
    li.append(body);

    // explicit third cell is the exclusives panel; otherwise the list group with logos
    let exclusiveGroup = null;
    if (!extraCell.length) {
      exclusiveGroup = [...groups].reverse().find((g) => g.some(isPictureRow)) || null;
    }
    groups.forEach((group) => {
      const section = document.createElement('div');
      section.className = group === exclusiveGroup ? 'cards-plan-card-exclusive' : 'cards-plan-card-list';
      section.append(...group);
      const label = section.firstElementChild;
      if (label && label.tagName === 'P' && !isPictureRow(label)) label.classList.add('cards-plan-list-label');
      li.append(section);
    });
    extraCell.forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture')) return;
      cell.className = 'cards-plan-card-exclusive';
      li.append(cell);
    });
    li.querySelectorAll('.cards-plan-card-exclusive p').forEach((p) => {
      if (isPictureRow(p)) p.classList.add('cards-plan-logos');
    });

    ul.append(li);
  });

  optimizePictures(ul);
  block.replaceChildren(ul);
  addScroller(block, ul);
}
