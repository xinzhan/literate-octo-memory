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

function buildIframe(videoId, title, autoplay) {
  const iframe = document.createElement('iframe');
  const params = new URLSearchParams({ rel: '0', controls: '1', enablejsapi: '1' });
  if (autoplay) params.set('autoplay', '1');
  iframe.src = `https://www.youtube.com/embed/${videoId}?${params}`;
  iframe.title = title || 'YouTube video';
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');
  return iframe;
}

export default function decorate(block) {
  const link = [...block.querySelectorAll('a[href]')].find((a) => getYouTubeId(a.href));
  let href = link ? link.href : null;
  if (!href) {
    const match = block.textContent.match(/https?:\/\/\S+/);
    if (match && getYouTubeId(match[0])) [href] = match;
  }

  const videoId = getYouTubeId(href);
  const poster = block.querySelector('picture');
  const rawTitle = link ? (link.title || link.textContent.trim()) : '';
  const title = rawTitle && !/^https?:/.test(rawTitle) ? rawTitle : 'YouTube video';

  const wrapper = document.createElement('div');
  wrapper.className = 'embed-video-player';

  if (!videoId) {
    // nothing embeddable: leave authored content untouched, flag for authors
    block.classList.add('is-empty');
    return;
  }

  if (poster) {
    // click-to-play: poster first, iframe on demand
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'embed-video-play';
    button.setAttribute('aria-label', `Play ${title}`);
    wrapper.append(poster, button);
    button.addEventListener('click', () => {
      wrapper.replaceChildren(buildIframe(videoId, title, true));
      wrapper.classList.add('is-loaded');
    }, { once: true });
  }

  block.replaceChildren(wrapper);

  if (!poster) {
    // lazy: create the iframe only when the block nears the viewport
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        wrapper.append(buildIframe(videoId, title, false));
        wrapper.classList.add('is-loaded');
      }
    }, { rootMargin: '200px 0px' });
    observer.observe(block);
  }
}
