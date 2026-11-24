/* eslint-disable */
/* global WebImporter */

/**
 * Parser: embed-video
 * Source: .about__video (single YouTube iframe)
 * One-column block: single cell with optional poster image above the YouTube URL.
 */

function toWatchUrl(src) {
  if (!src) return null;
  try {
    const url = new URL(src, 'https://www.youtube.com');
    const host = url.hostname.replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    else if (/youtube(-nocookie)?\.com$/.test(host)) {
      const m = url.pathname.match(/\/(?:embed|shorts|v)\/([^/?#]+)/);
      id = m ? m[1] : url.searchParams.get('v');
    }
    return id ? `https://www.youtube.com/watch?v=${id}` : url.href;
  } catch (e) {
    return src;
  }
}

export default function parse(element, { document }) {
  const cells = [];
  const content = [];

  const poster = element.querySelector('img');
  if (poster) content.push(poster);

  const iframe = element.querySelector('iframe[src]');
  const href = iframe ? toWatchUrl(iframe.getAttribute('src')) : null;
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = href;
    content.push(link);
  }

  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-video', cells });
  element.replaceWith(block);
}
