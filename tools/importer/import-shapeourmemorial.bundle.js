/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-shapeourmemorial.js
  var import_shapeourmemorial_exports = {};
  __export(import_shapeourmemorial_exports, {
    default: () => import_shapeourmemorial_default
  });

  // tools/importer/parsers/carousel-hero.js
  function largestFromSrcset(srcset) {
    if (!srcset) return null;
    let best = null;
    let bestW = -1;
    srcset.split(/,\s+(?=\S)/).forEach((part) => {
      const [url, descriptor] = part.trim().split(/\s+/);
      if (!url) return;
      const w = descriptor && /w$/.test(descriptor) ? parseInt(descriptor, 10) : 0;
      if (w > bestW) {
        bestW = w;
        best = url;
      }
    });
    return best;
  }
  function buildImage(document, slide) {
    const img = slide.querySelector("img");
    if (!img) return null;
    const base = img.src || img.getAttribute("src") || "";
    let src = null;
    const sources = [...slide.querySelectorAll("picture source")];
    const desktop = sources.find((s) => /desktop/i.test(s.getAttribute("srcset") || "")) || sources.find((s) => /min-width/i.test(s.getAttribute("media") || ""));
    if (desktop) src = largestFromSrcset(desktop.getAttribute("srcset"));
    if (!src) src = base;
    try {
      src = new URL(src, base || void 0).href;
    } catch (e) {
    }
    const out = document.createElement("img");
    out.src = src;
    out.alt = img.getAttribute("alt") || "";
    return out;
  }
  function realSlides(root, sliderSel, itemSel) {
    let slides = [...root.querySelectorAll(`${sliderSel} .slick-slide:not(.slick-cloned)`)];
    if (!slides.length) slides = [...root.querySelectorAll(itemSel)];
    return slides;
  }
  function parse(element, { document }) {
    const cells = [];
    const visuals = realSlides(element, ".slider__home--visual", ".banner__item");
    const texts = realSlides(element, ".slider__home--text", ".banner__text-item");
    const count = Math.max(visuals.length, texts.length);
    for (let i = 0; i < count; i += 1) {
      const visual = visuals[i];
      const text = texts[i];
      const image = visual ? buildImage(document, visual) : null;
      const content = [];
      if (text) {
        const titleEl = text.querySelector(".banner__title");
        if (titleEl && titleEl.textContent.trim()) {
          const h = document.createElement(i === 0 ? "h1" : "h2");
          [...titleEl.childNodes].forEach((n) => {
            if (n.nodeType === 1 && n.tagName === "SPAN") {
              h.append(document.createTextNode(n.textContent));
            } else {
              h.append(n.cloneNode(true));
            }
          });
          content.push(h);
        }
        text.querySelectorAll(".banner__desc").forEach((d) => {
          if (d.textContent.trim()) {
            const p = document.createElement("p");
            p.innerHTML = d.innerHTML;
            content.push(p);
          }
        });
        text.querySelectorAll("a[href]").forEach((a) => {
          if (a.closest(".banner__title, .banner__desc")) return;
          if (!a.textContent.trim()) return;
          const p = document.createElement("p");
          const link = document.createElement("a");
          link.href = a.getAttribute("href");
          link.textContent = a.textContent.trim();
          p.append(link);
          content.push(p);
        });
      }
      if (!image && !content.length) continue;
      cells.push([image || "", content.length ? content : ""]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  function parse2(element, { document }) {
    const cells = [];
    element.querySelectorAll(".icon__wrap").forEach((item) => {
      const img = item.querySelector(".icon__image img, img");
      const content = [];
      const title = item.querySelector(".icon__title");
      if (title && title.textContent.trim()) {
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = title.textContent.trim();
        p.append(strong);
        content.push(p);
      }
      item.querySelectorAll("a[href]").forEach((a) => {
        const label = a.textContent.trim();
        if (!label) return;
        const p = document.createElement("p");
        const link = document.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = label;
        p.append(link);
        content.push(p);
      });
      if (!img && !content.length) return;
      cells.push([img || "", content.length ? content : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-icon", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-video.js
  function toWatchUrl(src) {
    if (!src) return null;
    try {
      const url = new URL(src, "https://www.youtube.com");
      const host = url.hostname.replace(/^www\./, "");
      let id = null;
      if (host === "youtu.be") id = url.pathname.slice(1);
      else if (/youtube(-nocookie)?\.com$/.test(host)) {
        const m = url.pathname.match(/\/(?:embed|shorts|v)\/([^/?#]+)/);
        id = m ? m[1] : url.searchParams.get("v");
      }
      return id ? `https://www.youtube.com/watch?v=${id}` : url.href;
    } catch (e) {
      return src;
    }
  }
  function parse3(element, { document }) {
    const cells = [];
    let slides = [...element.querySelectorAll(".slick-slide:not(.slick-cloned)")];
    if (!slides.length) slides = [...element.querySelectorAll(":scope .slider__content:not(.slider__video)")];
    slides.forEach((slide) => {
      const iframe = slide.querySelector("iframe[src]");
      const href = iframe ? toWatchUrl(iframe.getAttribute("src")) : null;
      if (!href) return;
      const link = document.createElement("a");
      link.href = href;
      link.textContent = href;
      const caption = [];
      const cap = slide.querySelector(".slider__content__caption");
      if (cap && cap.textContent.trim()) {
        const p = document.createElement("p");
        p.innerHTML = cap.innerHTML;
        caption.push(p);
      }
      slide.querySelectorAll(".slider__content > p:not(.slider__content__caption)").forEach((p) => {
        if (p.textContent.trim()) {
          const np = document.createElement("p");
          np.innerHTML = p.innerHTML;
          caption.push(np);
        }
      });
      cells.push([link, caption.length ? caption : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quote-portrait.js
  function copyQuote(document, source, target, depth) {
    [...source.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        target.append(document.createTextNode(n.textContent));
      } else if (n.nodeType === 1) {
        const tag = n.tagName;
        if (tag === "BR") {
          target.append(document.createElement("br"));
        } else if (tag === "SPAN" && depth > 0) {
          const strong = document.createElement("strong");
          copyQuote(document, n, strong, depth + 1);
          target.append(strong);
        } else if (["STRONG", "B", "EM", "I", "A"].includes(tag)) {
          const el = n.cloneNode(false);
          copyQuote(document, n, el, depth + 1);
          target.append(el);
        } else {
          copyQuote(document, n, target, depth + 1);
        }
      }
    });
  }
  function parse4(element, { document }) {
    const cells = [];
    const root = element.querySelector(".quote__content") || element;
    const quote = [];
    const paras = [...root.querySelectorAll(":scope > p")];
    if (paras.length) {
      paras.forEach((src) => {
        if (!src.textContent.trim()) return;
        const p = document.createElement("p");
        copyQuote(document, src, p, 1);
        quote.push(p);
      });
    } else if (root.textContent.trim()) {
      const p = document.createElement("p");
      const kids = [...root.childNodes].filter((n) => n.nodeType === 1 || n.nodeType === 3 && n.textContent.trim());
      const outer = kids.length === 1 && kids[0].nodeType === 1 && kids[0].tagName === "SPAN" ? kids[0] : null;
      copyQuote(document, outer || root, p, 1);
      quote.push(p);
    }
    if (quote.length) cells.push([quote]);
    const img = element.querySelector(".quote__bg img, img");
    if (img) cells.push([img]);
    const block = WebImporter.Blocks.createBlock(document, { name: "quote-portrait", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-overlay.js
  function parse5(element, { document }) {
    const cells = [];
    let cards = [...element.querySelectorAll("a.card")];
    if (!cards.length) cards = [...element.querySelectorAll(".card")];
    cards.forEach((card) => {
      const img = card.querySelector(".card__image img, img");
      const titleEl = card.querySelector(".card__title, .card__desc");
      const href = card.getAttribute("href") || card.querySelector("a[href]") && card.querySelector("a[href]").getAttribute("href");
      const titleText = titleEl ? titleEl.textContent.trim() : (img && img.getAttribute("alt") || "").trim();
      const content = [];
      if (titleText) {
        const p = document.createElement("p");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = titleText;
          p.append(a);
        } else {
          p.textContent = titleText;
        }
        content.push(p);
      }
      if (!img && !content.length) return;
      cells.push([img || "", content.length ? content : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-overlay", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-video.js
  function toWatchUrl2(src) {
    if (!src) return null;
    try {
      const url = new URL(src, "https://www.youtube.com");
      const host = url.hostname.replace(/^www\./, "");
      let id = null;
      if (host === "youtu.be") id = url.pathname.slice(1);
      else if (/youtube(-nocookie)?\.com$/.test(host)) {
        const m = url.pathname.match(/\/(?:embed|shorts|v)\/([^/?#]+)/);
        id = m ? m[1] : url.searchParams.get("v");
      }
      return id ? `https://www.youtube.com/watch?v=${id}` : url.href;
    } catch (e) {
      return src;
    }
  }
  function parse6(element, { document }) {
    const cells = [];
    const content = [];
    const poster = element.querySelector("img");
    if (poster) content.push(poster);
    const iframe = element.querySelector("iframe[src]");
    const href = iframe ? toWatchUrl2(iframe.getAttribute("src")) : null;
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = href;
      content.push(link);
    }
    cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document, { name: "embed-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-logo.js
  function parse7(element, { document }) {
    const cells = [];
    element.querySelectorAll(".partners__logo").forEach((item) => {
      const img = item.querySelector("img");
      if (!img) return;
      const a = item.querySelector("a[href]");
      let second = "";
      if (a) {
        const link = document.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = a.textContent.trim() || img.getAttribute("alt") || a.getAttribute("href");
        second = link;
      }
      cells.push([img, second]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-logo", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/foundersmemorial-cleanup.js
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function normalizeSectionHeadings(document, root) {
    root.querySelectorAll("p.section__title").forEach((p) => {
      const h2 = document.createElement("h2");
      while (p.firstChild) h2.append(p.firstChild);
      h2.querySelectorAll("span").forEach((span) => {
        while (span.firstElementChild && span.firstElementChild.tagName === "BR" && !(span.firstChild.nodeType === 3 && span.firstChild.textContent.trim())) {
          const lead = span.firstChild;
          if (lead.nodeType === 3) {
            lead.remove();
            continue;
          }
          span.before(lead);
        }
        const em = document.createElement("em");
        while (span.firstChild) em.append(span.firstChild);
        em.textContent.trim() ? span.replaceWith(em) : span.remove();
      });
      p.replaceWith(h2);
    });
    root.querySelectorAll("h3.section__subtitle").forEach((h3) => {
      const p = document.createElement("p");
      while (h3.firstChild) p.append(h3.firstChild);
      h3.replaceWith(p);
    });
    root.querySelectorAll("p.fm-text-style, .section__title > p, .fm-text-style > p").forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector("img, picture, a, iframe, video, br")) p.remove();
    });
  }
  var HIGHLIGHT_TAGS = { purple: "EM", teal: "STRONG", red: "U" };
  function convertHighlights(document, root) {
    root.querySelectorAll("span[data-color]").forEach((span) => {
      const inQuote = span.closest(".quote__content");
      const tag = inQuote ? "STRONG" : HIGHLIGHT_TAGS[span.dataset.color] || "EM";
      if (!span.textContent.trim()) {
        span.replaceWith(...span.childNodes);
        return;
      }
      const el = document.createElement(tag);
      while (span.firstChild && span.firstChild.nodeType === 1 && span.firstChild.tagName === "BR") {
        span.before(span.firstChild);
      }
      while (span.firstChild) el.append(span.firstChild);
      span.replaceWith(el);
    });
  }
  function transform(hookName, element, payload) {
    const document = element.ownerDocument || payload.document;
    if (hookName === "preprocess") {
      convertHighlights(document, element);
    }
    if (hookName === "beforeTransform") {
      removeAll(element, [
        ".new-masthead-wrapper",
        // SG gov masthead
        "header",
        "footer",
        "nav",
        ".fm-back-top",
        // back-to-top
        ".subscribe-form",
        // newsletter popup wrapper
        "#newsletter",
        // newsletter lightbox
        ".lightbox--subscribe",
        ".skeleton-pulse",
        // loading skeletons
        ".slick-cloned",
        // slick infinite-loop clones
        "button.slick-arrow",
        // slick prev/next
        ".slick-prev",
        ".slick-next",
        "ul.slick-dots",
        // slick dots
        ".optical-attributions-container",
        ".optical-attributions",
        "optical-attributions",
        "wog-sentiments",
        "next-route-announcer",
        "a.button--jump",
        // decorative scroll-down chevron
        "script",
        "style",
        "noscript",
        "link"
      ]);
      normalizeSectionHeadings(document, element);
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        "header",
        "footer",
        "nav",
        ".new-masthead-wrapper",
        "wog-sentiments",
        "next-route-announcer",
        "optical-attributions",
        "script",
        "style",
        "noscript",
        "link",
        "iframe:not([src])"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-") && n !== "data-excat-section-id") el.removeAttribute(n);
          else if (n.startsWith("on") || n === "tabindex" || n === "aria-hidden") el.removeAttribute(n);
        });
      });
    }
  }

  // tools/importer/transformers/foundersmemorial-sections.js
  var MARKER = "data-excat-section-id";
  function safeQuery(root, selector) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      const m = selector.match(/^(.*):has\((.+)\)$/);
      if (!m) return null;
      try {
        return [...root.querySelectorAll(m[1])].find((el) => el.querySelector(m[2])) || null;
      } catch (e2) {
        return null;
      }
    }
  }
  function findSectionElement(document, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      const el = safeQuery(document, sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const document = element.ownerDocument || payload.document;
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionElement(document, section);
        if (!el) continue;
        if (i > 0 || section.style) {
          const hr = document.createElement("hr");
          if (section.style) hr.setAttribute(MARKER, section.id);
          el.before(hr);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const meta = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        const marker = document.querySelector(`hr[${MARKER}="${section.id}"]`);
        if (marker) {
          marker.after(meta);
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        } else {
          const el = findSectionElement(document, section);
          if (el) el.append(meta);
        }
      }
      document.querySelectorAll(`[${MARKER}]`).forEach((n) => n.removeAttribute(MARKER));
    }
  }

  // tools/importer/import-shapeourmemorial.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "carousel-hero": parse,
    "cards-icon": parse2,
    "carousel-video": parse3,
    "quote-portrait": parse4,
    "cards-overlay": parse5,
    "embed-video": parse6,
    "cards-logo": parse7
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var correctionTransformers = [];
  var transformers = [transform, ...lateTransformers, ...correctionTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
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
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_shapeourmemorial_default = {
    preprocess: (payload) => {
      executeTransformers("preprocess", payload.document.body, payload, earlyTransformers);
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_shapeourmemorial_exports);
})();
