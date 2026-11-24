let instanceCount = 0;

/**
 * Extracts a YouTube video id from common URL shapes.
 * @param {string} href
 * @returns {string|null}
 */
function getYouTubeId(href) {
  if (!href) return null;
  let url;
  try {
    url = new URL(href.trim(), window.location.href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') return url.pathname.split('/')[1] || null;
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
    if (match) return match[1];
  }
  return null;
}

function findVideoUrl(cell) {
  const link = [...cell.querySelectorAll('a[href]')].find((a) => getYouTubeId(a.href));
  if (link) return { href: link.href, title: link.title || link.textContent.trim(), link };
  const text = cell.textContent.trim();
  const match = text.match(/https?:\/\/\S+/);
  if (match && getYouTubeId(match[0])) return { href: match[0], title: '', link: null };
  return null;
}

function loadIframe(slot) {
  if (slot.dataset.loaded === 'true' || !slot.dataset.videoId) return;
  slot.dataset.loaded = 'true';
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${slot.dataset.videoId}?enablejsapi=1&rel=0&controls=1`;
  iframe.title = slot.dataset.videoTitle || 'YouTube video';
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');
  slot.replaceChildren(iframe);
}

function pauseVideo(slide) {
  const iframe = slide.querySelector('iframe');
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
}

function setActive(block, index) {
  const slides = [...block.querySelectorAll('.carousel-video-slide')];
  if (!slides.length) return;
  const real = ((index % slides.length) + slides.length) % slides.length;
  const previous = Number(block.dataset.activeSlide);
  if (!Number.isNaN(previous) && previous !== real && slides[previous]) {
    pauseVideo(slides[previous]);
  }
  block.dataset.activeSlide = real;
  slides.forEach((slide, idx) => {
    const active = idx === real;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
    slide.querySelectorAll('a, button, iframe').forEach((el) => {
      if (active) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });
  block.querySelectorAll('.carousel-video-indicator button').forEach((btn, idx) => {
    if (idx === real) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });
  // once the block is in view, make sure the active slide has its player
  if (block.dataset.inView === 'true') {
    const slot = slides[real].querySelector('.carousel-video-player');
    if (slot) loadIframe(slot);
  }
}

function buildSlide(row, idx, id) {
  const slide = document.createElement('li');
  slide.className = 'carousel-video-slide';
  slide.id = `carousel-video-${id}-slide-${idx}`;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `Slide ${idx + 1}`);

  const cells = [...row.children];
  let video = null;
  let videoCell = null;
  cells.some((cell) => {
    video = findVideoUrl(cell);
    if (video) videoCell = cell;
    return video;
  });

  const media = document.createElement('div');
  media.className = 'carousel-video-media';
  const slot = document.createElement('div');
  slot.className = 'carousel-video-player';
  const poster = videoCell ? videoCell.querySelector('picture') : null;
  if (video) {
    slot.dataset.videoId = getYouTubeId(video.href);
    slot.dataset.videoTitle = video.title && !/^https?:/.test(video.title) ? video.title : `Video ${idx + 1}`;
    if (poster) slot.append(poster);
    if (video.link) {
      const p = video.link.closest('p');
      if (p && p.textContent.trim() === video.link.textContent.trim()) p.remove();
      else video.link.remove();
    }
  } else {
    // no video: fall back to any picture the author supplied
    const pic = row.querySelector('picture');
    if (pic) slot.append(pic);
    slot.classList.add('is-empty');
  }
  media.append(slot);
  slide.append(media);

  // remaining text from any cell becomes the caption
  const caption = document.createElement('div');
  caption.className = 'carousel-video-caption';
  cells.forEach((cell) => {
    if (cell.textContent.trim()) caption.append(...cell.childNodes);
  });
  // drop bare YouTube URLs authored as plain text
  caption.querySelectorAll('p, div').forEach((el) => {
    const t = el.textContent.trim();
    if (/^https?:\/\/\S+$/.test(t) && getYouTubeId(t)) el.remove();
  });
  [...caption.childNodes].forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE && getYouTubeId(n.textContent.trim())) n.remove();
  });
  if (caption.textContent.trim()) slide.append(caption);
  return slide;
}

export default function decorate(block) {
  instanceCount += 1;
  const id = instanceCount;
  const rows = [...block.children].filter((r) => r.textContent.trim() || r.querySelector('picture, a'));

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Video carousel');

  const container = document.createElement('div');
  container.className = 'carousel-video-slides-container';
  const track = document.createElement('ul');
  track.className = 'carousel-video-slides';
  rows.forEach((row, idx) => track.append(buildSlide(row, idx, id)));
  container.append(track);
  block.replaceChildren(container);

  if (rows.length > 1) {
    const buttons = document.createElement('div');
    buttons.className = 'carousel-video-navigation';
    buttons.innerHTML = `
      <button type="button" class="carousel-video-prev" aria-label="Previous slide"></button>
      <button type="button" class="carousel-video-next" aria-label="Next slide"></button>`;
    buttons.querySelector('.carousel-video-prev').addEventListener('click', () => {
      setActive(block, Number(block.dataset.activeSlide) - 1);
    });
    buttons.querySelector('.carousel-video-next').addEventListener('click', () => {
      setActive(block, Number(block.dataset.activeSlide) + 1);
    });
    container.append(buttons);

    const nav = document.createElement('nav');
    nav.className = 'carousel-video-indicators-nav';
    nav.setAttribute('aria-label', 'Carousel slide controls');
    const list = document.createElement('ol');
    list.className = 'carousel-video-indicators';
    rows.forEach((_, idx) => {
      const li = document.createElement('li');
      li.className = 'carousel-video-indicator';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Show slide ${idx + 1} of ${rows.length}`);
      btn.addEventListener('click', () => setActive(block, idx));
      li.append(btn);
      list.append(li);
    });
    nav.append(list);
    block.append(nav);
  } else {
    block.classList.add('is-single');
  }

  setActive(block, 0);

  // Lazy: only create YouTube iframes when the block nears the viewport.
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      block.dataset.inView = 'true';
      const active = block.querySelector('.carousel-video-slide.is-active .carousel-video-player');
      if (active) loadIframe(active);
      // other slides get their iframe when they become active (see setActive)
    }
  }, { rootMargin: '200px 0px' });
  observer.observe(block);
}
