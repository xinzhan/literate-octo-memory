/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup transformer for foundersmemorial.gov.sg (Shape Our Memorial subsite).
 * Selectors taken from migration-work/cleaned.html.
 */

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

/**
 * Section titles: p.section__title -> h2, the highlighted <span> part -> <em>.
 * Section subtitles: h3.section__subtitle -> p (authoring analysis: plain subtitle paragraph).
 * Only targets titles outside parser-owned block elements (block instances do not contain them).
 */
function normalizeSectionHeadings(document, root) {
  root.querySelectorAll('p.section__title').forEach((p) => {
    const h2 = document.createElement('h2');
    while (p.firstChild) h2.append(p.firstChild);
    h2.querySelectorAll('span').forEach((span) => {
      // move leading <br> out of the highlight so the emphasis wraps text only
      while (span.firstElementChild && span.firstElementChild.tagName === 'BR'
        && !(span.firstChild.nodeType === 3 && span.firstChild.textContent.trim())) {
        const lead = span.firstChild;
        if (lead.nodeType === 3) { lead.remove(); continue; }
        span.before(lead);
      }
      const em = document.createElement('em');
      while (span.firstChild) em.append(span.firstChild);
      em.textContent.trim() ? span.replaceWith(em) : span.remove();
    });
    p.replaceWith(h2);
  });

  root.querySelectorAll('h3.section__subtitle').forEach((h3) => {
    const p = document.createElement('p');
    while (h3.firstChild) p.append(h3.firstChild);
    h3.replaceWith(p);
  });

  // empty wrapper left behind by the invalid <p class="fm-text-style"><p ...> nesting
  root.querySelectorAll('p.fm-text-style, .section__title > p, .fm-text-style > p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, picture, a, iframe, video, br')) p.remove();
  });
}

/**
 * Coloured highlights (span[data-color]) -> semantic inline tags, before html2md runs: the
 * importer unwraps plain spans before transform, which would drop the highlight.
 * Titles: purple -> em, teal -> strong, red -> u (styled in styles.css / carousel-hero.css).
 * Quote: the highlight becomes strong (the quote-portrait parser keeps strong).
 */
const HIGHLIGHT_TAGS = { purple: 'EM', teal: 'STRONG', red: 'U' };
function convertHighlights(document, root) {
  root.querySelectorAll('span[data-color]').forEach((span) => {
    const inQuote = span.closest('.quote__content');
    const tag = inQuote ? 'STRONG' : (HIGHLIGHT_TAGS[span.dataset.color] || 'EM');
    if (!span.textContent.trim()) {
      span.replaceWith(...span.childNodes);
      return;
    }
    const el = document.createElement(tag);
    // keep a leading <br> outside the highlight so the emphasis wraps text only
    while (span.firstChild && span.firstChild.nodeType === 1 && span.firstChild.tagName === 'BR') {
      span.before(span.firstChild);
    }
    while (span.firstChild) el.append(span.firstChild);
    span.replaceWith(el);
  });
}

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || payload.document;

  if (hookName === 'preprocess') {
    convertHighlights(document, element);
  }

  if (hookName === 'beforeTransform') {
    // Non-authorable chrome and widgets that would otherwise be picked up by block matching
    removeAll(element, [
      '.new-masthead-wrapper', // SG gov masthead
      'header',
      'footer',
      'nav',
      '.fm-back-top', // back-to-top
      '.subscribe-form', // newsletter popup wrapper
      '#newsletter', // newsletter lightbox
      '.lightbox--subscribe',
      '.skeleton-pulse', // loading skeletons
      '.slick-cloned', // slick infinite-loop clones
      'button.slick-arrow', // slick prev/next
      '.slick-prev',
      '.slick-next',
      'ul.slick-dots', // slick dots
      '.optical-attributions-container',
      '.optical-attributions',
      'optical-attributions',
      'wog-sentiments',
      'next-route-announcer',
      'a.button--jump', // decorative scroll-down chevron
      'script',
      'style',
      'noscript',
      'link',
    ]);

    normalizeSectionHeadings(document, element);
  }

  if (hookName === 'afterTransform') {
    // Final cleanup. Do not remove HTML comments here (field hints).
    removeAll(element, [
      'header',
      'footer',
      'nav',
      '.new-masthead-wrapper',
      'wog-sentiments',
      'next-route-announcer',
      'optical-attributions',
      'script',
      'style',
      'noscript',
      'link',
      'iframe:not([src])',
    ]);

    // Tracking / framework attributes
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (n.startsWith('data-') && n !== 'data-excat-section-id') el.removeAttribute(n);
        else if (n.startsWith('on') || n === 'tabindex' || n === 'aria-hidden') el.removeAttribute(n);
      });
    });
  }
}
