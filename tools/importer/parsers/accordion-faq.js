/* eslint-disable */
/* global WebImporter */

/**
 * Parser: accordion-faq
 * Source: div.sc-9bb60893-0.edCgpH. Items are section.sc-14ac8863-0
 * (question: button h3, answer: div.sc-14ac8863-3). All items are kept,
 * including the duplicated "stronger WiFi coverage" question.
 * Table (one row per item):
 *   | question | answer (rich text) |
 *
 * The wrapper also holds the "FAQs" heading (kept as default content before
 * the block) and the WhatsApp "Chat with us" card plus the Read FAQ / T&C /
 * Typical Speed links (kept as default content after the block).
 */

function clean(text) {
  return (text || '').replace(/[​ ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function absUrl(url, document) {
  if (!url) return '';
  try {
    return new URL(url, document.baseURI || document.location.href).href;
  } catch (e) {
    return url;
  }
}

/** Copy inline rich text (links, emphasis, line breaks) into target. */
function copyInline(src, target, document) {
  target.innerHTML = src.innerHTML;
  target.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((attr) => {
      if (!(n.tagName === 'A' && attr.name === 'href')) n.removeAttribute(attr.name);
    });
  });
  target.querySelectorAll('a').forEach((a) => {
    if (!clean(a.textContent)) {
      a.remove();
      return;
    }
    a.setAttribute('href', absUrl(a.getAttribute('href'), document));
  });
  // unwrap presentational wrappers
  target.querySelectorAll('span, div').forEach((n) => n.replaceWith(...n.childNodes));
  // trim trailing / leading line breaks
  const trimEdge = (pick) => {
    let n = pick();
    while (n && ((n.nodeType === 3 && !clean(n.textContent)) || n.nodeName === 'BR')) {
      n.remove();
      n = pick();
    }
  };
  trimEdge(() => target.lastChild);
  trimEdge(() => target.firstChild);
  return target;
}

/** A container whose children are bullet rows: span > (div bullet marker, div text). */
function isBulletList(el) {
  const kids = [...el.children];
  return kids.length > 0 && kids.every((k) => k.tagName === 'SPAN'
    && k.querySelector(':scope > div:last-child') && clean(k.textContent));
}

/** Split a paragraph into several at double line breaks (<br><br>). */
function splitParagraph(p, document) {
  const parts = [];
  let current = document.createElement('p');
  const nodes = [...p.childNodes];
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i];
    if (n.nodeName === 'BR') {
      let j = i + 1;
      while (j < nodes.length && nodes[j].nodeType === 3 && !clean(nodes[j].textContent)) j += 1;
      if (j < nodes.length && nodes[j].nodeName === 'BR') {
        parts.push(current);
        current = document.createElement('p');
        i = j;
        continue;
      }
    }
    current.append(n);
  }
  parts.push(current);
  return parts.filter((part) => clean(part.textContent) || part.querySelector('img'));
}

function convertAnswer(root, document, out) {
  [...root.children].forEach((child) => {
    if (child.tagName === 'P') {
      if (!clean(child.textContent) && !child.querySelector('img')) return;
      const copy = copyInline(child, document.createElement('p'), document);
      out.push(...splitParagraph(copy, document));
    } else if (child.tagName === 'UL' || child.tagName === 'OL') {
      const list = document.createElement(child.tagName.toLowerCase());
      child.querySelectorAll(':scope > li').forEach((li) => {
        list.append(copyInline(li, document.createElement('li'), document));
      });
      out.push(list);
    } else if (isBulletList(child)) {
      const ul = document.createElement('ul');
      [...child.children].forEach((span) => {
        const textDiv = span.querySelector(':scope > div:last-child');
        ul.append(copyInline(textDiv, document.createElement('li'), document));
      });
      out.push(ul);
    } else if (child.children.length) {
      convertAnswer(child, document, out);
    } else if (clean(child.textContent)) {
      out.push(copyInline(child, document.createElement('p'), document));
    }
  });
  return out;
}

/** Default content placed after the block: chat card and footer links. */
function trailingContent(element, document) {
  const out = [];

  const chat = element.querySelector('a[href*="whatsapp.com"]');
  if (chat) {
    const icon = chat.querySelector('img');
    const iconSrc = icon ? (icon.getAttribute('src') || icon.src || '') : '';
    if (iconSrc && !iconSrc.startsWith('data:')) {
      const p = document.createElement('p');
      const img = document.createElement('img');
      img.src = absUrl(iconSrc, document);
      img.alt = icon.getAttribute('alt') || '';
      p.append(img);
      out.push(p);
    }
    const texts = [...chat.querySelectorAll('span, p')]
      .filter((n) => !n.querySelector('span, p'))
      .map((n) => clean(n.textContent))
      .filter(Boolean);
    const label = texts[0] || 'Chat with us';
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = absUrl(chat.getAttribute('href'), document);
    a.textContent = label;
    p.append(a);
    out.push(p);
    texts.slice(1).forEach((t) => {
      const tp = document.createElement('p');
      tp.textContent = t;
      out.push(tp);
    });
  }

  // Footer links: paragraphs with real links outside the FAQ items and chat card.
  element.querySelectorAll('p').forEach((p) => {
    if (p.closest('section.sc-14ac8863-0') || p.closest('a')) return;
    const links = [...p.querySelectorAll('a[href]')].filter((a) => clean(a.textContent));
    if (!links.length) return;
    links.forEach((src) => {
      const lp = document.createElement('p');
      const a = document.createElement('a');
      a.href = absUrl(src.getAttribute('href'), document);
      a.textContent = clean(src.textContent);
      lp.append(a);
      out.push(lp);
    });
  });

  return out;
}

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('section.sc-14ac8863-0')];

  // Leading default content: the "FAQs" heading that precedes the items.
  let heading = null;
  const firstItem = items[0];
  const srcHeading = [...element.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .find((h) => !h.closest('section.sc-14ac8863-0')
      && (!firstItem || (h.compareDocumentPosition(firstItem) & 4)));
  if (srcHeading && clean(srcHeading.textContent)) {
    heading = document.createElement(srcHeading.tagName.toLowerCase());
    heading.textContent = clean(srcHeading.textContent);
  }

  const trailing = trailingContent(element, document);

  const cells = [];
  items.forEach((item) => {
    const q = item.querySelector('button h3, button h2, button h4, button');
    const question = q ? clean(q.textContent) : '';
    const answerRoot = item.querySelector('div.sc-14ac8863-3') || item.querySelector('div.sc-5585cff4-0');
    const answer = answerRoot ? convertAnswer(answerRoot, document, []) : [];
    if (!question && !answer.length) return;
    cells.push([question, answer]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  if (heading) element.before(heading);
  if (trailing.length) element.after(...trailing);
  element.replaceWith(block);
}
