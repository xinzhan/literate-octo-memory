import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const textRows = [];
  let portrait = null;

  // Classify rows by content, not position: authors may reorder or omit rows.
  [...block.children].forEach((row) => {
    const pic = row.querySelector('picture') || row.querySelector('img');
    const hasText = row.textContent.trim().length > 0;
    if (pic && !portrait) {
      portrait = pic;
      pic.remove();
    }
    if (hasText) textRows.push(row);
  });

  const figure = document.createElement('figure');
  figure.className = 'quote-portrait-figure';

  const content = document.createElement('div');
  content.className = 'quote-portrait-content';

  if (textRows.length) {
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'quote-portrait-quotation';
    const [quoteRow, ...rest] = textRows;
    quoteRow.querySelectorAll(':scope > div').forEach((cell) => blockquote.append(...cell.childNodes));
    if (!blockquote.children.length && quoteRow.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = quoteRow.textContent.trim();
      blockquote.replaceChildren(p);
    }
    content.append(blockquote);

    if (rest.length) {
      const caption = document.createElement('figcaption');
      caption.className = 'quote-portrait-attribution';
      rest.forEach((row) => row.querySelectorAll(':scope > div').forEach((cell) => caption.append(...cell.childNodes)));
      content.append(caption);
    }
  }
  figure.append(content);

  if (portrait) {
    const media = document.createElement('div');
    media.className = 'quote-portrait-image';
    media.append(portrait);
    figure.append(media);
  } else {
    block.classList.add('no-portrait');
  }

  figure.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '880' }]));
  });

  block.replaceChildren(figure);
}
