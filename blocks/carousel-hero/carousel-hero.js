import { createOptimizedPicture } from '../../scripts/aem.js';

let instanceCount = 0;

function optimizeImages(root, eagerFirst) {
  root.querySelectorAll('picture > img').forEach((img, idx) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    const eager = eagerFirst && idx === 0;
    img.closest('picture').replaceWith(createOptimizedPicture(
      img.src,
      img.alt,
      eager,
      [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }],
    ));
  });
}

function setActive(block, index) {
  const slides = [...block.querySelectorAll('.carousel-hero-slide')];
  if (!slides.length) return;
  const real = ((index % slides.length) + slides.length) % slides.length;
  block.dataset.activeSlide = real;
  slides.forEach((slide, idx) => {
    const active = idx === real;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
    slide.querySelectorAll('a, button').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll('.carousel-hero-indicator button').forEach((btn, idx) => {
    if (idx === real) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });
}

function buildSlide(row, idx, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-hero-slide';
  slide.id = `carousel-hero-${id}-slide-${idx}`;
  slide.dataset.slideIndex = idx;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const cells = [...row.children];
  // Defensive: find the image cell wherever the author put it.
  let imageCell = cells.find((c) => c.querySelector('picture, img') && !c.textContent.trim());
  if (!imageCell) imageCell = cells.find((c) => c.querySelector('picture, img'));
  const contentCells = cells.filter(
    (c) => c !== imageCell && (c.textContent.trim() || c.children.length),
  );

  const media = document.createElement('div');
  media.className = 'carousel-hero-slide-image';
  if (imageCell) {
    const pic = imageCell.querySelector('picture') || imageCell.querySelector('img');
    if (pic) media.append(pic);
  }
  slide.append(media);

  if (contentCells.length) {
    const content = document.createElement('div');
    content.className = 'carousel-hero-slide-content';
    contentCells.forEach((c) => content.append(...c.childNodes));
    // pictures accidentally left in the text cell go to the media slot
    if (!media.children.length) {
      const stray = content.querySelector('picture');
      if (stray) media.append(stray);
    }
    const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      if (!heading.id) heading.id = `${slide.id}-title`;
      slide.setAttribute('aria-labelledby', heading.id);
    }
    slide.append(content);
  }
  return slide;
}

export default function decorate(block) {
  instanceCount += 1;
  const id = instanceCount;
  const rows = [...block.children].filter((r) => r.textContent.trim() || r.querySelector('picture, img'));

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured stories');

  const container = document.createElement('div');
  container.className = 'carousel-hero-slides-container';
  const track = document.createElement('ul');
  track.className = 'carousel-hero-slides';

  rows.forEach((row, idx) => track.append(buildSlide(row, idx, id)));
  container.append(track);
  block.replaceChildren(container);
  optimizeImages(track, true);

  // Decorative scroll-down chevron (source #next): jumps to the next section.
  const jump = document.createElement('button');
  jump.type = 'button';
  jump.className = 'carousel-hero-jump';
  jump.setAttribute('aria-label', 'Scroll to next section');
  jump.addEventListener('click', () => {
    const section = block.closest('.section');
    const next = section && section.nextElementSibling;
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  });
  container.append(jump);

  if (rows.length > 1) {
    const nav = document.createElement('nav');
    nav.className = 'carousel-hero-indicators-nav';
    nav.setAttribute('aria-label', 'Carousel slide controls');
    const list = document.createElement('ol');
    list.className = 'carousel-hero-indicators';
    rows.forEach((_, idx) => {
      const li = document.createElement('li');
      li.className = 'carousel-hero-indicator';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.slideTo = idx;
      btn.setAttribute('aria-label', `Show slide ${idx + 1} of ${rows.length}`);
      li.append(btn);
      list.append(li);
    });
    nav.append(list);
    container.append(nav);

    const buttons = document.createElement('div');
    buttons.className = 'carousel-hero-navigation';
    buttons.innerHTML = `
      <button type="button" class="carousel-hero-prev" data-step="-1" aria-label="Previous slide"></button>
      <button type="button" class="carousel-hero-next" data-step="1" aria-label="Next slide"></button>`;
    container.append(buttons);

    // one delegated handler for bar indicators and arrows
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-slide-to], button[data-step]');
      if (!btn) return;
      const current = Number(block.dataset.activeSlide);
      if (btn.dataset.slideTo !== undefined) setActive(block, Number(btn.dataset.slideTo));
      else setActive(block, current + Number(btn.dataset.step));
    });

    // autoplay (source: 12s per slide). The active bar's fill animation is the
    // timer, so hover/focus pausing and reduced motion are handled in CSS.
    list.addEventListener('animationend', (e) => {
      if (e.animationName !== 'carousel-hero-progress') return;
      setActive(block, Number(block.dataset.activeSlide) + 1);
    });

    // basic swipe support
    let startX = null;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const current = Number(block.dataset.activeSlide);
      if (Math.abs(dx) > 40) setActive(block, current + (dx < 0 ? 1 : -1));
      startX = null;
    });
  } else {
    block.classList.add('is-single');
  }

  setActive(block, 0);
}
