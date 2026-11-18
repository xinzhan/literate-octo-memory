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

  // tools/importer/import-products-services.js
  var import_products_services_exports = {};
  __export(import_products_services_exports, {
    default: () => import_products_services_default
  });

  // tools/importer/parsers/hero-promo-banner.js
  function absUrl(url, document) {
    if (!url) return "";
    try {
      return new URL(url, document.baseURI || document.location.href).href;
    } catch (e) {
      return url;
    }
  }
  function minWidthOf(media) {
    if (!media) return 0;
    const m = media.match(/min-width:\s*([\d.]+)\s*(em|rem|px)?/i);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    return m[2] && m[2].toLowerCase() !== "px" ? n * 16 : n;
  }
  function bestImageSrc(picture, img) {
    let best = null;
    let bestWidth = -1;
    if (picture) {
      picture.querySelectorAll("source").forEach((source) => {
        const srcset = source.getAttribute("srcset") || source.getAttribute("srcSet") || "";
        const first = srcset.split(",")[0].trim().split(/\s+/)[0];
        if (!first) return;
        const w = minWidthOf(source.getAttribute("media"));
        if (w > bestWidth) {
          bestWidth = w;
          best = first;
        }
      });
    }
    if (best) return best;
    return img ? img.getAttribute("src") || img.src || "" : "";
  }
  function parse(element, { document }) {
    const cells = [];
    const picture = element.querySelector("picture");
    const srcImg = element.querySelector("picture img, img");
    const src = bestImageSrc(picture, srcImg);
    if (src) {
      const img = document.createElement("img");
      img.src = absUrl(src, document);
      img.alt = srcImg ? srcImg.getAttribute("alt") || "" : "";
      cells.push([img]);
    } else {
      cells.push([""]);
    }
    const content = [];
    const heading = element.querySelector("h1, h2, h3");
    if (heading) {
      const h1 = document.createElement("h1");
      h1.textContent = heading.textContent.trim();
      content.push(h1);
    }
    element.querySelectorAll("p").forEach((p) => {
      if (p.closest("a, button")) return;
      const text = p.textContent.replace(/​/g, "").trim();
      if (!text) return;
      const para2 = document.createElement("p");
      para2.textContent = text;
      content.push(para2);
    });
    element.querySelectorAll("a[href]").forEach((a) => {
      const label = a.textContent.replace(/\s+/g, " ").trim();
      if (!label) return;
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const link = document.createElement("a");
      link.href = absUrl(a.getAttribute("href"), document);
      link.textContent = label;
      strong.append(link);
      p.append(strong);
      content.push(p);
    });
    cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-promo-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/widget-countdown.js
  var END_DATE_PLACEHOLDER = "2026-12-31T23:59:59+08:00";
  function parse2(element, { document }) {
    const p = document.createElement("p");
    p.textContent = END_DATE_PLACEHOLDER;
    const cells = [[p]];
    const block = WebImporter.Blocks.createBlock(document, { name: "widget-countdown", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-plan.js
  function clean(text) {
    return (text || "").replace(/[​ ]/g, " ").replace(/\s+/g, " ").trim();
  }
  function absUrl2(url, document) {
    if (!url) return "";
    try {
      return new URL(url, document.baseURI || document.location.href).href;
    } catch (e) {
      return url;
    }
  }
  function makeImg(src, document) {
    const s = src.getAttribute("src") || src.src || "";
    if (!s || s.startsWith("data:")) return null;
    const img = document.createElement("img");
    img.src = absUrl2(s, document);
    img.alt = src.getAttribute("alt") || "";
    return img;
  }
  function para(document, text, wrapTag) {
    const p = document.createElement("p");
    if (wrapTag) {
      const w = document.createElement(wrapTag);
      w.textContent = text;
      p.append(w);
    } else {
      p.textContent = text;
    }
    return p;
  }
  function listGroup(group, document) {
    const out = [];
    if (!group) return out;
    const label = group.querySelector(":scope > p");
    if (label && clean(label.textContent)) out.push(para(document, clean(label.textContent)));
    const items = [...group.querySelectorAll("span.sc-jxOSlx, div.sc-44916527-10")].filter((el) => !el.parentElement.closest("span.sc-jxOSlx, div.sc-44916527-10")).map((el) => clean(el.textContent)).filter(Boolean);
    if (items.length) {
      const ul = document.createElement("ul");
      items.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        ul.append(li);
      });
      out.push(ul);
    }
    return out;
  }
  function parseCard(card, document) {
    const imgSrc = card.querySelector("div.sc-44916527-76 img");
    const image = imgSrc ? makeImg(imgSrc, document) : null;
    const body = [];
    const badge = card.querySelector("div.sc-44916527-75 > span");
    if (badge && clean(badge.textContent)) body.push(para(document, clean(badge.textContent)));
    const h = card.querySelector("div.sc-44916527-77 h3, div.sc-44916527-77 h2, div.sc-44916527-77 h4");
    if (h) {
      const spans = [...h.querySelectorAll(":scope > span")].filter((s) => clean(s.textContent));
      const titleText = spans.length ? clean(spans[0].textContent) : clean(h.textContent);
      const h3 = document.createElement("h3");
      h3.textContent = titleText;
      body.push(h3);
      const promo = spans.slice(1).map((s) => clean(s.textContent)).join(" ");
      if (promo) body.push(para(document, promo, "strong"));
    }
    const desc = card.querySelector("div.sc-44916527-78");
    if (desc && clean(desc.textContent)) {
      desc.querySelectorAll("p").forEach((p) => {
        if (clean(p.textContent)) body.push(para(document, clean(p.textContent)));
      });
    }
    const priceLines = [...card.querySelectorAll("div.sc-44916527-50 > p")].map((p) => clean(p.textContent)).filter(Boolean);
    const priceIdx = priceLines.findIndex((t) => /\$/.test(t));
    priceLines.forEach((t, i) => {
      if (priceIdx === -1 || i <= priceIdx) body.push(para(document, t));
      else body.push(para(document, t, "del"));
    });
    const ctaWrap = card.querySelector("div.sc-44916527-51");
    if (ctaWrap) {
      ctaWrap.querySelectorAll("a[href]").forEach((a, i) => {
        const label = clean(a.textContent);
        if (!label) return;
        const link = document.createElement("a");
        link.href = absUrl2(a.getAttribute("href"), document);
        link.textContent = label;
        const p = document.createElement("p");
        if (i === 0) {
          const strong = document.createElement("strong");
          strong.append(link);
          p.append(strong);
        } else {
          p.append(link);
        }
        body.push(p);
      });
    }
    body.push(...listGroup(card.querySelector("div.sc-44916527-80 div.sc-44916527-45"), document));
    const exclusive = [];
    const exGroup = card.querySelector("div.sc-44916527-81 div.sc-44916527-46");
    if (exGroup && clean(exGroup.textContent)) {
      exclusive.push(...listGroup(exGroup, document));
      const logos = [...exGroup.querySelectorAll("div.sc-44916527-52 img")].map((i) => makeImg(i, document)).filter(Boolean);
      if (logos.length) {
        const p = document.createElement("p");
        logos.forEach((l) => p.append(l));
        exclusive.push(p);
      }
      const overflow = exGroup.querySelector("div.sc-cb1d8bc9-15");
      if (overflow && clean(overflow.textContent)) exclusive.push(para(document, clean(overflow.textContent)));
    }
    return [image || "", body, exclusive.length ? exclusive : ""];
  }
  function parse3(element, { document }) {
    const cells = [];
    const cards = [...element.querySelectorAll("div.sc-44916527-73")];
    cards.forEach((card) => {
      if (!clean(card.textContent) && !card.querySelector("img")) return;
      cells.push(parseCard(card, document));
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-plan", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-bundle.js
  function clean2(text) {
    return (text || "").replace(/[​ ]/g, " ").replace(/\s+/g, " ").trim();
  }
  function absUrl3(url, document) {
    if (!url) return "";
    try {
      return new URL(url, document.baseURI || document.location.href).href;
    } catch (e) {
      return url;
    }
  }
  function parseCard2(card, document) {
    let image = "";
    const srcImg = card.querySelector("div.sc-44916527-76 img");
    const s = srcImg ? srcImg.getAttribute("src") || srcImg.src || "" : "";
    if (s && !s.startsWith("data:")) {
      image = document.createElement("img");
      image.src = absUrl3(s, document);
      image.alt = srcImg.getAttribute("alt") || "";
    }
    const body = [];
    const h = card.querySelector("div.sc-44916527-77 h3, div.sc-44916527-77 h2, div.sc-44916527-77 h4");
    if (h && clean2(h.textContent)) {
      const h3 = document.createElement("h3");
      h3.textContent = clean2(h.textContent);
      body.push(h3);
    }
    const desc = card.querySelector("div.sc-44916527-78");
    if (desc) {
      desc.querySelectorAll("p").forEach((p) => {
        const t = clean2(p.textContent);
        if (!t) return;
        const para2 = document.createElement("p");
        para2.textContent = t;
        body.push(para2);
      });
    }
    const ctaWrap = card.querySelector("div.sc-44916527-51");
    if (ctaWrap) {
      ctaWrap.querySelectorAll("a[href]").forEach((a, i) => {
        const label = clean2(a.textContent);
        if (!label) return;
        const link = document.createElement("a");
        link.href = absUrl3(a.getAttribute("href"), document);
        link.textContent = label;
        const p = document.createElement("p");
        if (i === 0) {
          const strong = document.createElement("strong");
          strong.append(link);
          p.append(strong);
        } else {
          p.append(link);
        }
        body.push(p);
      });
    }
    return [image, body];
  }
  function parse4(element, { document }) {
    const cells = [];
    element.querySelectorAll("div.sc-44916527-73").forEach((card) => {
      if (!clean2(card.textContent) && !card.querySelector("img")) return;
      cells.push(parseCard2(card, document));
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-bundle", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function clean3(text) {
    return (text || "").replace(/[​ ]/g, " ").replace(/\s+/g, " ").trim();
  }
  function absUrl4(url, document) {
    if (!url) return "";
    try {
      return new URL(url, document.baseURI || document.location.href).href;
    } catch (e) {
      return url;
    }
  }
  function copyParagraph(p, document) {
    const out = document.createElement("p");
    out.innerHTML = p.innerHTML;
    out.querySelectorAll("[class]").forEach((n) => n.removeAttribute("class"));
    out.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", absUrl4(a.getAttribute("href"), document)));
    return out;
  }
  function parse5(element, { document }) {
    const cells = [];
    element.querySelectorAll("div.sc-736da13b-0").forEach((item) => {
      let image = "";
      const srcImg = item.querySelector("div.sc-736da13b-4 img");
      const s = srcImg ? srcImg.getAttribute("src") || srcImg.src || "" : "";
      if (s && !s.startsWith("data:")) {
        image = document.createElement("img");
        image.src = absUrl4(s, document);
        image.alt = srcImg.getAttribute("alt") || "";
      }
      const body = [];
      const textWrap = item.querySelector("div.sc-736da13b-7") || item;
      const h = textWrap.querySelector("h1, h2, h3, h4, h5, h6");
      if (h && clean3(h.textContent)) {
        const h3 = document.createElement("h3");
        h3.textContent = clean3(h.textContent);
        body.push(h3);
      }
      textWrap.querySelectorAll("p").forEach((p) => {
        if (!clean3(p.textContent)) return;
        if (p.querySelector("p")) return;
        body.push(copyParagraph(p, document));
      });
      if (!image && !body.length) return;
      cells.push([image, body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-link-tile.js
  function clean4(text) {
    return (text || "").replace(/[​ ]/g, " ").replace(/\s+/g, " ").trim();
  }
  function absUrl5(url, document) {
    if (!url) return "";
    try {
      return new URL(url, document.baseURI || document.location.href).href;
    } catch (e) {
      return url;
    }
  }
  function parse6(element, { document }) {
    const cells = [];
    element.querySelectorAll("div.sc-cb1d8bc9-0").forEach((tile) => {
      const anchor = tile.closest("a[href]");
      const href = anchor ? absUrl5(anchor.getAttribute("href"), document) : "";
      let image = "";
      const srcImg = tile.querySelector("div.sc-cb1d8bc9-6 img, img");
      const s = srcImg ? srcImg.getAttribute("src") || srcImg.src || "" : "";
      if (s && !s.startsWith("data:")) {
        image = document.createElement("img");
        image.src = absUrl5(s, document);
        image.alt = srcImg.getAttribute("alt") || "";
      }
      const body = [];
      const title = tile.querySelector("div.sc-cb1d8bc9-19");
      if (title && clean4(title.textContent)) {
        const p = document.createElement("p");
        p.textContent = clean4(title.textContent);
        body.push(p);
      }
      const cta = tile.querySelector("div.sc-cb1d8bc9-20");
      const ctaText = cta ? clean4(cta.textContent) : "";
      if (ctaText || href) {
        const p = document.createElement("p");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = ctaText || "Learn more";
          p.append(a);
        } else {
          p.textContent = ctaText;
        }
        body.push(p);
      }
      if (!image && !body.length) return;
      cells.push([image, body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-link-tile", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function clean5(text) {
    return (text || "").replace(/[​ ]/g, " ").replace(/\s+/g, " ").trim();
  }
  function absUrl6(url, document) {
    if (!url) return "";
    try {
      return new URL(url, document.baseURI || document.location.href).href;
    } catch (e) {
      return url;
    }
  }
  function copyInline(src, target, document) {
    target.innerHTML = src.innerHTML;
    target.querySelectorAll("*").forEach((n) => {
      [...n.attributes].forEach((attr) => {
        if (!(n.tagName === "A" && attr.name === "href")) n.removeAttribute(attr.name);
      });
    });
    target.querySelectorAll("a").forEach((a) => {
      if (!clean5(a.textContent)) {
        a.remove();
        return;
      }
      a.setAttribute("href", absUrl6(a.getAttribute("href"), document));
    });
    target.querySelectorAll("span, div").forEach((n) => n.replaceWith(...n.childNodes));
    const trimEdge = (pick) => {
      let n = pick();
      while (n && (n.nodeType === 3 && !clean5(n.textContent) || n.nodeName === "BR")) {
        n.remove();
        n = pick();
      }
    };
    trimEdge(() => target.lastChild);
    trimEdge(() => target.firstChild);
    return target;
  }
  function isBulletList(el) {
    const kids = [...el.children];
    return kids.length > 0 && kids.every((k) => k.tagName === "SPAN" && k.querySelector(":scope > div:last-child") && clean5(k.textContent));
  }
  function splitParagraph(p, document) {
    const parts = [];
    let current = document.createElement("p");
    const nodes = [...p.childNodes];
    for (let i = 0; i < nodes.length; i += 1) {
      const n = nodes[i];
      if (n.nodeName === "BR") {
        let j = i + 1;
        while (j < nodes.length && nodes[j].nodeType === 3 && !clean5(nodes[j].textContent)) j += 1;
        if (j < nodes.length && nodes[j].nodeName === "BR") {
          parts.push(current);
          current = document.createElement("p");
          i = j;
          continue;
        }
      }
      current.append(n);
    }
    parts.push(current);
    return parts.filter((part) => clean5(part.textContent) || part.querySelector("img"));
  }
  function convertAnswer(root, document, out) {
    [...root.children].forEach((child) => {
      if (child.tagName === "P") {
        if (!clean5(child.textContent) && !child.querySelector("img")) return;
        const copy = copyInline(child, document.createElement("p"), document);
        out.push(...splitParagraph(copy, document));
      } else if (child.tagName === "UL" || child.tagName === "OL") {
        const list = document.createElement(child.tagName.toLowerCase());
        child.querySelectorAll(":scope > li").forEach((li) => {
          list.append(copyInline(li, document.createElement("li"), document));
        });
        out.push(list);
      } else if (isBulletList(child)) {
        const ul = document.createElement("ul");
        [...child.children].forEach((span) => {
          const textDiv = span.querySelector(":scope > div:last-child");
          ul.append(copyInline(textDiv, document.createElement("li"), document));
        });
        out.push(ul);
      } else if (child.children.length) {
        convertAnswer(child, document, out);
      } else if (clean5(child.textContent)) {
        out.push(copyInline(child, document.createElement("p"), document));
      }
    });
    return out;
  }
  function trailingContent(element, document) {
    const out = [];
    const chat = element.querySelector('a[href*="whatsapp.com"]');
    if (chat) {
      const icon = chat.querySelector("img");
      const iconSrc = icon ? icon.getAttribute("src") || icon.src || "" : "";
      if (iconSrc && !iconSrc.startsWith("data:")) {
        const p2 = document.createElement("p");
        const img = document.createElement("img");
        img.src = absUrl6(iconSrc, document);
        img.alt = icon.getAttribute("alt") || "";
        p2.append(img);
        out.push(p2);
      }
      const texts = [...chat.querySelectorAll("span, p")].filter((n) => !n.querySelector("span, p")).map((n) => clean5(n.textContent)).filter(Boolean);
      const label = texts[0] || "Chat with us";
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = absUrl6(chat.getAttribute("href"), document);
      a.textContent = label;
      p.append(a);
      out.push(p);
      texts.slice(1).forEach((t) => {
        const tp = document.createElement("p");
        tp.textContent = t;
        out.push(tp);
      });
    }
    element.querySelectorAll("p").forEach((p) => {
      if (p.closest("section.sc-14ac8863-0") || p.closest("a")) return;
      const links = [...p.querySelectorAll("a[href]")].filter((a) => clean5(a.textContent));
      if (!links.length) return;
      links.forEach((src) => {
        const lp = document.createElement("p");
        const a = document.createElement("a");
        a.href = absUrl6(src.getAttribute("href"), document);
        a.textContent = clean5(src.textContent);
        lp.append(a);
        out.push(lp);
      });
    });
    return out;
  }
  function parse7(element, { document }) {
    const items = [...element.querySelectorAll("section.sc-14ac8863-0")];
    let heading = null;
    const firstItem = items[0];
    const srcHeading = [...element.querySelectorAll("h1, h2, h3, h4, h5, h6")].find((h) => !h.closest("section.sc-14ac8863-0") && (!firstItem || h.compareDocumentPosition(firstItem) & 4));
    if (srcHeading && clean5(srcHeading.textContent)) {
      heading = document.createElement(srcHeading.tagName.toLowerCase());
      heading.textContent = clean5(srcHeading.textContent);
    }
    const trailing = trailingContent(element, document);
    const cells = [];
    items.forEach((item) => {
      const q = item.querySelector("button h3, button h2, button h4, button");
      const question = q ? clean5(q.textContent) : "";
      const answerRoot = item.querySelector("div.sc-14ac8863-3") || item.querySelector("div.sc-5585cff4-0");
      const answer = answerRoot ? convertAnswer(answerRoot, document, []) : [];
      if (!question && !answer.length) return;
      cells.push([question, answer]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
    if (heading) element.before(heading);
    if (trailing.length) element.after(...trailing);
    element.replaceWith(block);
  }

  // tools/importer/transformers/singtel-cleanup.js
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
    if (el.tagName !== "DIV") return false;
    if (el.textContent.replace(/ /g, " ").trim() !== "") return false;
    return !el.querySelector("img, picture, video, iframe, table, hr, a, button, svg");
  }
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      removeAll(element, [
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        "next-route-announcer"
      ]);
      removeAll(element, [
        // Breadcrumb (rc13): Home / Fibre
        "div.sc-41182dc4-1",
        "nav.sc-b36a696e-0",
        // Global footer (rc14)
        "div.sc-44916527-217",
        // Floating "Ruby" chat avatar (LivePerson)
        "div.LPMcontainer",
        '[id^="LPMcontainer"]',
        // Bing UET / tracking pixels
        '[id^="batBeacon"]',
        'img[src*="bat.bing.com"]',
        'img[src*="doubleclick.net"]',
        'img[src*="facebook.com/tr"]'
      ]);
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        // Global header / nav (rc header)
        "div.sc-44916527-89",
        // Popup search widget / empty spacer (rc1)
        "div.sc-hZDyAQ.xSFED",
        "#popupsearch",
        // Cookie consent banner
        "div.sc-44916527-0",
        // Safety net in case any survived
        "div.sc-41182dc4-1",
        "div.sc-44916527-217",
        "div.LPMcontainer",
        '[id^="batBeacon"]',
        "iframe",
        "script",
        "style",
        "noscript",
        "link"
      ]);
      const contentList = element.querySelector(
        "div.sc-ed0da946-0.kazAet > div > div.sc-44916527-20.hbORfv"
      );
      if (contentList) {
        [...contentList.children].forEach((row) => {
          if (isEmptyRow(row)) row.remove();
        });
      }
      element.querySelectorAll('[style*="black-bg."]').forEach((el) => {
        el.style.removeProperty("background-image");
        el.style.removeProperty("background");
      });
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("on") || n.startsWith("data-gtm") || n.startsWith("data-track") || n.startsWith("data-analytics") || n === "data-testid") {
            el.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/singtel-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!sections || sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      const resolved = sections.map((s) => findSectionElement(element, s));
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = resolved[i];
        if (!el || !el.parentNode) continue;
        const isFirst = i === 0;
        if (isFirst && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const meta = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (marker) {
          let next = marker.nextElementSibling;
          while (next && next.tagName !== "HR") next = next.nextElementSibling;
          if (next) {
            next.parentNode.insertBefore(meta, next);
          } else {
            marker.parentNode.appendChild(meta);
          }
          marker.removeAttribute(MARKER);
          if (i === 0) marker.remove();
        } else {
          const el = findSectionElement(element, section);
          if (el && el.parentNode) el.after(meta);
        }
      }
      element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => hr.removeAttribute(MARKER));
    }
  }

  // tools/importer/import-products-services.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-promo-banner": parse,
    "widget-countdown": parse2,
    "cards-plan": parse3,
    "cards-bundle": parse4,
    "cards-feature": parse5,
    "cards-link-tile": parse6,
    "accordion-faq": parse7
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var transformers = [transform, ...lateTransformers];
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
  var import_products_services_default = {
    preprocess: (payload) => {
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
  return __toCommonJS(import_products_services_exports);
})();
