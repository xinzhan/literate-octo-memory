/* eslint-disable */
/* global WebImporter */

import carouselHeroParser from './parsers/carousel-hero.js';
import cardsIconParser from './parsers/cards-icon.js';
import carouselVideoParser from './parsers/carousel-video.js';
import quotePortraitParser from './parsers/quote-portrait.js';
import cardsOverlayParser from './parsers/cards-overlay.js';
import embedVideoParser from './parsers/embed-video.js';
import cardsLogoParser from './parsers/cards-logo.js';
import cleanupTransformer from './transformers/foundersmemorial-cleanup.js';
import sectionsTransformer from './transformers/foundersmemorial-sections.js';

const PAGE_TEMPLATE = {
  "name": "shapeourmemorial",
  "urls": [
    "https://www.foundersmemorial.gov.sg/shapeourmemorial/en"
  ],
  "representativeUrl": "https://www.foundersmemorial.gov.sg/shapeourmemorial/en",
  "description": "Founders' Memorial 'Shape Our Memorial' subsite landing page: hero carousel, entry-point icon cards, video carousel, quote, exhibition tiles, CTA band, about video, partner logos",
  "blocks": [
    {
      "name": "carousel-hero",
      "instances": [
        ".banner__wrap--homepage"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        "#section2 .row",
        "section.section__wrap:has(.icon__wrap) .row"
      ]
    },
    {
      "name": "carousel-video",
      "instances": [
        ".slider--basic"
      ]
    },
    {
      "name": "quote-portrait",
      "instances": [
        ".quote.quote--with-image",
        ".quote"
      ]
    },
    {
      "name": "cards-overlay",
      "instances": [
        ".card__wrap--2col",
        ".card__wrap"
      ]
    },
    {
      "name": "embed-video",
      "instances": [
        ".about__video"
      ]
    },
    {
      "name": "cards-logo",
      "instances": [
        ".section--partners .section__content"
      ]
    }
  ],
  "urlPattern": "/shapeourmemorial/*",
  "sections": [
    {
      "id": "rc2",
      "name": "Hero carousel",
      "selector": [
        "main > .main-side-padding:has(.banner__wrap--homepage)"
      ],
      "style": null,
      "blocks": [
        "carousel-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "rc3",
      "name": "Explore / Contribute entry points",
      "selector": [
        "main > .main-side-padding:has(#section2)",
        "main > .main-side-padding:has(.icon__wrap)"
      ],
      "style": null,
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": []
    },
    {
      "id": "rc4",
      "name": "Ordinary Items, Extraordinary Stories",
      "selector": [
        "main > .main-side-padding:has(.slider--basic)"
      ],
      "style": "cream, centered",
      "blocks": [
        "carousel-video"
      ],
      "defaultContent": [
        ".section__title p.section__title",
        ".section__title h3.section__subtitle"
      ]
    },
    {
      "id": "rc5",
      "name": "Mdm Zainab quote",
      "selector": [
        "main > .main-side-padding:has(.quote--with-image)",
        "main > .main-side-padding:has(.quote)"
      ],
      "style": "blue-grey",
      "blocks": [
        "quote-portrait"
      ],
      "defaultContent": []
    },
    {
      "id": "rc6",
      "name": "Explore Our Online Exhibition",
      "selector": [
        "main > .main-side-padding:has(.section--artefact)"
      ],
      "style": "centered",
      "blocks": [
        "cards-overlay"
      ],
      "defaultContent": [
        ".section--artefact p.section__title",
        ".section--artefact .section__content > a.btn"
      ]
    },
    {
      "id": "rc7",
      "name": "Enrich Our Memorial CTA",
      "selector": [
        "main > .main-side-padding:has(.section--text)"
      ],
      "style": "light-grey, centered",
      "blocks": [],
      "defaultContent": [
        ".section--text p.section__title",
        ".section--text h3.section__subtitle",
        ".section--text a.section__button"
      ]
    },
    {
      "id": "rc8",
      "name": "About The Founders' Memorial",
      "selector": [
        "main > .main-side-padding:has(.section--about)"
      ],
      "style": "cream, centered",
      "blocks": [
        "embed-video"
      ],
      "defaultContent": [
        ".section--about p.section__title",
        ".section--about h3.section__subtitle",
        ".section--about .mx-auto p",
        ".section--about a.about__button"
      ]
    },
    {
      "id": "rc9",
      "name": "Our Partners",
      "selector": [
        "main > .main-side-padding:has(.section--partners)"
      ],
      "style": "centered",
      "blocks": [
        "cards-logo"
      ],
      "defaultContent": [
        ".section--partners p.section__title"
      ]
    }
  ]
};

const parsers = {
  'carousel-hero': carouselHeroParser,
  'cards-icon': cardsIconParser,
  'carousel-video': carouselVideoParser,
  'quote-portrait': quotePortraitParser,
  'cards-overlay': cardsOverlayParser,
  'embed-video': embedVideoParser,
  'cards-logo': cardsLogoParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// Page corrections ({sitename}-page-corrections.js, when it exists) run last.
const correctionTransformers = [];
const transformers = [cleanupTransformer, ...lateTransformers, ...correctionTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    // Inline markup fixes that must happen before html2md unwraps spans.
    executeTransformers('preprocess', payload.document.body, payload, earlyTransformers);
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
