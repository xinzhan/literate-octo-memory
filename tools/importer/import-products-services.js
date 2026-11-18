/* eslint-disable */
/* global WebImporter */

import heroPromoBannerParser from './parsers/hero-promo-banner.js';
import widgetCountdownParser from './parsers/widget-countdown.js';
import cardsPlanParser from './parsers/cards-plan.js';
import cardsBundleParser from './parsers/cards-bundle.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import cardsLinkTileParser from './parsers/cards-link-tile.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import cleanupTransformer from './transformers/singtel-cleanup.js';
import sectionsTransformer from './transformers/singtel-sections.js';

const PAGE_TEMPLATE = {
  "name": "products-services",
  "urls": [
    "https://www.singtel.com/personal/products-services/fibre"
  ],
  "representativeUrl": "https://www.singtel.com/personal/products-services/fibre",
  "description": "Singtel personal product/service landing pages (e.g. Fibre broadband): promo hero, deal countdown, plan and bundle card rows, feature grid, link tiles and FAQs.",
  "blocks": [
    {
      "name": "hero-promo-banner",
      "instances": [
        "div.sc-94066a71-1",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(1) > div"
      ]
    },
    {
      "name": "widget-countdown",
      "instances": [
        "div.sc-d670ebe-0"
      ]
    },
    {
      "name": "cards-plan",
      "instances": [
        "div.sc-44916527-20.hbORfv > div:has(div.sc-44916527-72.kzkMhk) div.sc-44916527-68",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(3) div.sc-44916527-68"
      ]
    },
    {
      "name": "cards-bundle",
      "instances": [
        "div.sc-44916527-20.hbORfv > div:has(div.sc-44916527-72.bDXNer) div.sc-44916527-68",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(4) div.sc-44916527-68"
      ]
    },
    {
      "name": "cards-feature",
      "instances": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(9) div.sc-44916527-20.hbORfv"
      ]
    },
    {
      "name": "cards-link-tile",
      "instances": [
        "div.sc-44916527-8"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        "div.sc-9bb60893-0.edCgpH"
      ]
    }
  ],
  "urlPattern": "/personal/products-services/*",
  "sections": [
    {
      "id": "rc2",
      "name": "Hero banner",
      "selector": [
        "div.sc-44916527-20.hbORfv > div:has(div.sc-94066a71-1)",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(1)"
      ],
      "style": null,
      "blocks": [
        "hero-promo-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "rc3",
      "name": "Deal countdown",
      "selector": [
        "div.sc-44916527-20.hbORfv > div:has(div.sc-d670ebe-0)",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(2)"
      ],
      "style": "light-grey, centered",
      "blocks": [
        "widget-countdown"
      ],
      "defaultContent": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(2) div.sc-44916527-10 p"
      ]
    },
    {
      "id": "rc4",
      "name": "Fibre plan cards",
      "selector": [
        "div.sc-44916527-20.hbORfv > div:has(div.sc-44916527-72.kzkMhk)",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(3)"
      ],
      "style": "centered",
      "blocks": [
        "cards-plan"
      ],
      "defaultContent": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(3) div.sc-31d9b5d6-1 h6",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(3) div.sc-9bb60893-0.eDDcdr > div > div.sc-ed0da946-0 div.sc-44916527-10 > p"
      ]
    },
    {
      "id": "rc5",
      "name": "Broadband bundles",
      "selector": [
        "div.sc-44916527-20.hbORfv > div:has(div.sc-44916527-72.bDXNer)",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(4)"
      ],
      "style": "dark, centered",
      "blocks": [
        "cards-bundle"
      ],
      "defaultContent": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(4) div.sc-31d9b5d6-1 h6"
      ]
    },
    {
      "id": "rc6",
      "name": "Shop smarter with AI",
      "selector": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(5)"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(5) h3",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(5) h4",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(5) button"
      ]
    },
    {
      "id": "rc8",
      "name": "Why Singtel Broadband heading",
      "selector": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(7)"
      ],
      "style": "centered",
      "blocks": [],
      "defaultContent": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(7) h3"
      ]
    },
    {
      "id": "rc10",
      "name": "Why Singtel Broadband features",
      "selector": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(9)"
      ],
      "style": null,
      "blocks": [
        "cards-feature"
      ],
      "defaultContent": []
    },
    {
      "id": "rc11",
      "name": "Explore custom plans",
      "selector": [
        "div.sc-44916527-20.hbORfv > div:has(div.sc-44916527-8)",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(10)"
      ],
      "style": "light-grey, centered",
      "blocks": [
        "cards-link-tile"
      ],
      "defaultContent": [
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(10) h3"
      ]
    },
    {
      "id": "rc12",
      "name": "FAQs and help links",
      "selector": [
        "div.sc-44916527-20.hbORfv > div:has(div.sc-9bb60893-0.edCgpH)",
        "body > div:nth-of-type(4) > div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv > div:nth-of-type(11)"
      ],
      "style": null,
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": [
        "div.sc-9bb60893-0.edCgpH > div:nth-child(2) h3",
        "div.sc-9bb60893-0.edCgpH > div:nth-child(30)",
        "div.sc-9bb60893-0.edCgpH > div:nth-child(32)"
      ]
    }
  ]
};

const parsers = {
  'hero-promo-banner': heroPromoBannerParser,
  'widget-countdown': widgetCountdownParser,
  'cards-plan': cardsPlanParser,
  'cards-bundle': cardsBundleParser,
  'cards-feature': cardsFeatureParser,
  'cards-link-tile': cardsLinkTileParser,
  'accordion-faq': accordionFaqParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
const transformers = [cleanupTransformer, ...lateTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
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

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
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

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
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
