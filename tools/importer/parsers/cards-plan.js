/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-plan
 * Source: div.sc-44916527-68 (plan carousel). Cards are div.sc-44916527-73;
 * the prev/next arrow buttons (div.sc-44916527-70) are ignored.
 * Table (one row per plan):
 *   | plan image | badge, H3 title, **promo**, contract, price, ~~old price~~,
 *   |            | **Select**, recontract link, "Comes with" + list
 *   | "EXCLUSIVE for new sign ups" + list + logo images + overflow text |
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

function makeImg(src, document) {
  const s = src.getAttribute('src') || src.src || '';
  if (!s || s.startsWith('data:')) return null;
  const img = document.createElement('img');
  img.src = absUrl(s, document);
  img.alt = src.getAttribute('alt') || '';
  return img;
}

function para(document, text, wrapTag) {
  const p = document.createElement('p');
  if (wrapTag) {
    const w = document.createElement(wrapTag);
    w.textContent = text;
    p.append(w);
  } else {
    p.textContent = text;
  }
  return p;
}

/** Label paragraph + bullet list from a list group (div.sc-44916527-45 / -46). */
function listGroup(group, document) {
  const out = [];
  if (!group) return out;
  const label = group.querySelector(':scope > p');
  if (label && clean(label.textContent)) out.push(para(document, clean(label.textContent)));
  const items = [...group.querySelectorAll('span.sc-jxOSlx, div.sc-44916527-10')]
    .filter((el) => !el.parentElement.closest('span.sc-jxOSlx, div.sc-44916527-10'))
    .map((el) => clean(el.textContent))
    .filter(Boolean);
  if (items.length) {
    const ul = document.createElement('ul');
    items.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.append(li);
    });
    out.push(ul);
  }
  return out;
}

function parseCard(card, document) {
  // Cell 1: plan image
  const imgSrc = card.querySelector('div.sc-44916527-76 img');
  const image = imgSrc ? makeImg(imgSrc, document) : null;

  // Cell 2: plan details
  const body = [];
  const badge = card.querySelector('div.sc-44916527-75 > span');
  if (badge && clean(badge.textContent)) body.push(para(document, clean(badge.textContent)));

  const h = card.querySelector('div.sc-44916527-77 h3, div.sc-44916527-77 h2, div.sc-44916527-77 h4');
  if (h) {
    const spans = [...h.querySelectorAll(':scope > span')].filter((s) => clean(s.textContent));
    const titleText = spans.length ? clean(spans[0].textContent) : clean(h.textContent);
    const h3 = document.createElement('h3');
    h3.textContent = titleText;
    body.push(h3);
    const promo = spans.slice(1).map((s) => clean(s.textContent)).join(' ');
    if (promo) body.push(para(document, promo, 'strong'));
  }

  const desc = card.querySelector('div.sc-44916527-78');
  if (desc && clean(desc.textContent)) {
    desc.querySelectorAll('p').forEach((p) => {
      if (clean(p.textContent)) body.push(para(document, clean(p.textContent)));
    });
  }

  const priceLines = [...card.querySelectorAll('div.sc-44916527-50 > p')]
    .map((p) => clean(p.textContent)).filter(Boolean);
  const priceIdx = priceLines.findIndex((t) => /\$/.test(t));
  priceLines.forEach((t, i) => {
    if (priceIdx === -1 || i <= priceIdx) body.push(para(document, t));
    else body.push(para(document, t, 'del'));
  });

  const ctaWrap = card.querySelector('div.sc-44916527-51');
  if (ctaWrap) {
    ctaWrap.querySelectorAll('a[href]').forEach((a, i) => {
      const label = clean(a.textContent);
      if (!label) return;
      const link = document.createElement('a');
      link.href = absUrl(a.getAttribute('href'), document);
      link.textContent = label;
      const p = document.createElement('p');
      if (i === 0) {
        const strong = document.createElement('strong');
        strong.append(link);
        p.append(strong);
      } else {
        p.append(link);
      }
      body.push(p);
    });
  }

  body.push(...listGroup(card.querySelector('div.sc-44916527-80 div.sc-44916527-45'), document));

  // Cell 3: exclusives panel (optional)
  const exclusive = [];
  const exGroup = card.querySelector('div.sc-44916527-81 div.sc-44916527-46');
  if (exGroup && clean(exGroup.textContent)) {
    exclusive.push(...listGroup(exGroup, document));
    const logos = [...exGroup.querySelectorAll('div.sc-44916527-52 img')]
      .map((i) => makeImg(i, document)).filter(Boolean);
    if (logos.length) {
      const p = document.createElement('p');
      logos.forEach((l) => p.append(l));
      exclusive.push(p);
    }
    const overflow = exGroup.querySelector('div.sc-cb1d8bc9-15');
    if (overflow && clean(overflow.textContent)) exclusive.push(para(document, clean(overflow.textContent)));
  }

  return [image || '', body, exclusive.length ? exclusive : ''];
}

export default function parse(element, { document }) {
  const cells = [];
  const cards = [...element.querySelectorAll('div.sc-44916527-73')];
  cards.forEach((card) => {
    if (!clean(card.textContent) && !card.querySelector('img')) return;
    cells.push(parseCard(card, document));
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-plan', cells });
  element.replaceWith(block);
}
