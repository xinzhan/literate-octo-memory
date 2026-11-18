/* eslint-disable */
/* global WebImporter */

/**
 * Singtel cleanup transformer.
 *
 * Timing note: section and parser selectors in page-templates.json rely on
 * `body > div:nth-of-type(4)` (the main content wrapper) and on
 * `div.sc-44916527-20.hbORfv > div:nth-of-type(N)` (top-level content rows).
 * Chrome that sits BEFORE the content wrapper at body level (header, search
 * popup, cookie banner) and the empty spacer rows inside the content list
 * are therefore removed in afterTransform, so nth-of-type indexes stay
 * stable while parsers run. Chrome AFTER the content wrapper is removed in
 * beforeTransform.
 */

function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    let nodes = [];
    try {
      nodes = root.querySelectorAll(sel);
    } catch (e) {
      nodes = [];
    }
    nodes.forEach((n) => n.remove());
  });
}

function isEmptyRow(el) {
  if (el.tagName !== 'DIV') return false;
  if (el.textContent.replace(/ /g, ' ').trim() !== '') return false;
  return !el.querySelector('img, picture, video, iframe, table, hr, a, button, svg');
}

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Non-authorable nodes that never contain block content.
    removeAll(element, [
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'next-route-announcer',
    ]);

    // Chrome located after the main content wrapper (does not shift
    // body > div:nth-of-type(4)).
    removeAll(element, [
      // Breadcrumb (rc13): Home / Fibre
      'div.sc-41182dc4-1',
      'nav.sc-b36a696e-0',
      // Global footer (rc14)
      'div.sc-44916527-217',
      // Floating "Ruby" chat avatar (LivePerson)
      'div.LPMcontainer',
      '[id^="LPMcontainer"]',
      // Bing UET / tracking pixels
      '[id^="batBeacon"]',
      'img[src*="bat.bing.com"]',
      'img[src*="doubleclick.net"]',
      'img[src*="facebook.com/tr"]',
    ]);
  }

  if (hookName === 'afterTransform') {
    // Body-level chrome preceding the content wrapper.
    removeAll(element, [
      // Global header / nav (rc header)
      'div.sc-44916527-89',
      // Popup search widget / empty spacer (rc1)
      'div.sc-hZDyAQ.xSFED',
      '#popupsearch',
      // Cookie consent banner
      'div.sc-44916527-0',
      // Safety net in case any survived
      'div.sc-41182dc4-1',
      'div.sc-44916527-217',
      'div.LPMcontainer',
      '[id^="batBeacon"]',
      'iframe',
      'script',
      'style',
      'noscript',
      'link',
    ]);

    // Empty spacer rows (rc7, rc9) among the top-level content rows.
    const contentList = element.querySelector(
      'div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv',
    );
    if (contentList) {
      [...contentList.children].forEach((row) => {
        if (isEmptyRow(row)) row.remove();
      });
    }

    // Solid-colour placeholder backgrounds (e.g. the bundles band's black-bg.png)
    // are represented by the section style ("dark"), not as an image. Remove them
    // before WebImporter.rules.transformBackgroundImages turns them into <img>.
    element.querySelectorAll('[style*="black-bg."]').forEach((el) => {
      el.style.removeProperty('background-image');
      el.style.removeProperty('background');
    });

    // Strip tracking / inline-behaviour attributes.
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (
          n.startsWith('on')
          || n.startsWith('data-gtm')
          || n.startsWith('data-track')
          || n.startsWith('data-analytics')
          || n === 'data-testid'
        ) {
          el.removeAttribute(n);
        }
      });
    });
  }
}
