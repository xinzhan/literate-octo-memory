import { loadScript } from '../../scripts/aem.js';

/*
 * Newsletter (Campaign Monitor) configuration — not author copy.
 * Field labels, list names and button text are authored in footer.plain.html.
 */
const SUBSCRIBE_CONFIG = {
  action: 'https://www.createsend.com/t/subscribeerror?description=',
  formId: '92D4C54F0FEC16E5ADC2B1904DE9ED1A833008E19A94F60EDF99873EAAFA43C141E192F39F6A9683981CF20754A3F77045FE23EAAE7091CCF456C59F5B55AC36',
  script: 'https://js.createsend1.com/javascript/copypastesubscribeformlogic.js',
  lists: {
    'asian civilisations museum': 'gldkrt',
    'bras basah.bugis': 'gldkrh',
    'changi chapel and museum': 'jtosj',
    'indian heritage centre': 'gldkru',
    'malay heritage centre': 'gldkyl',
    'national museum of singapore': 'gldkri',
    'nhb festivals': 'gldkyj',
    'reflections at bukit chandu': 'jtost',
    "children's museum singapore": 'gldurt',
    'sun yat sen nanyang memorial hall': 'gldkyr',
    'the peranakan museum': 'gldkrd',
  },
};

/**
 * Creates an element with optional class names and children.
 * @param {string} tag tag name
 * @param {string} [className] space separated classes
 * @param {...(Node|string)} children child nodes
 * @returns {HTMLElement}
 */
function createElement(tag, className, ...children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  children.filter((c) => c !== null && c !== undefined).forEach((c) => el.append(c));
  return el;
}

/**
 * Fetches the footer fragment (metadata-independent: local /content first, then site root).
 * @returns {Promise<Document|null>}
 */
async function fetchFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  // relative media paths are relative to the fragment, not to the current page
  doc.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', new URL(img.getAttribute('src'), resp.url).href);
  });
  return doc;
}

/**
 * Opens external links in a new tab (matches source behaviour).
 * @param {Element} root
 */
function decorateLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!/^https?:\/\//i.test(href)) return;
    if (new URL(href).host === window.location.host) return;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
}

/**
 * Sets lazy loading and intrinsic sizes on images.
 * @param {Element} root
 */
function decorateImages(root) {
  root.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
    img.decoding = 'async';
  });
}

/**
 * Moves the text nodes preceding the first element into a label span.
 * @param {Element} item
 * @param {string} className
 * @returns {HTMLElement}
 */
function extractLabel(item, className) {
  const label = createElement('span', className);
  [...item.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      label.append(node.textContent.trim());
      node.remove();
    }
  });
  return label;
}

/**
 * Builds the brand title row.
 * @param {Element} section
 * @returns {HTMLElement|null}
 */
function buildTitle(section) {
  if (!section) return null;
  const titleP = [...section.querySelectorAll('p')].find((p) => p.querySelector('a') && !p.querySelector('img'));
  if (!titleP) return null;
  const title = createElement('div', 'footer-title');
  const link = titleP.querySelector('a');
  link.classList.add('footer-title-link');
  title.append(link);
  titleP.remove();
  return title;
}

/**
 * Builds the address and social icons column.
 * @param {Element} section
 * @returns {HTMLElement|null}
 */
function buildInfo(section) {
  if (!section) return null;
  const info = createElement('div', 'footer-info');
  section.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('img')) {
      const social = createElement('div', 'footer-social');
      p.querySelectorAll('a').forEach((a) => social.append(a));
      info.append(social);
    } else {
      const address = createElement('p', 'footer-address');
      address.append(...p.childNodes);
      info.append(address);
    }
  });
  return info;
}

/**
 * Builds one column per partner logo.
 * @param {Element} section
 * @returns {HTMLElement[]}
 */
function buildPartners(section) {
  if (!section) return [];
  const items = [...section.querySelectorAll('li')];
  const sources = items.length ? items : [...section.querySelectorAll('p')];
  return sources.map((item) => {
    const col = createElement('div', 'footer-partner');
    col.append(extractLabel(item, 'footer-partner-label'));
    const link = item.querySelector('a') || item.querySelector('img');
    if (link) {
      link.classList.add('footer-partner-logo');
      col.append(link);
    }
    return col;
  });
}

/**
 * Builds the newsletter column (text + CTA).
 * @param {Element} section
 * @returns {{ col: HTMLElement|null, cta: HTMLAnchorElement|null }}
 */
function buildNewsletter(section) {
  if (!section) return { col: null, cta: null };
  const col = createElement('div', 'footer-newsletter');
  let cta = null;
  section.querySelectorAll('p').forEach((p) => {
    const link = p.querySelector('a');
    if (link && !cta) {
      cta = link;
      cta.classList.add('footer-cta');
      col.append(cta);
    } else {
      const text = createElement('p', 'footer-newsletter-text');
      text.textContent = p.textContent.trim();
      col.append(text);
    }
  });
  return { col, cta };
}

/**
 * Wraps the children of a section into a div with the given class.
 * @param {Element} section
 * @param {string} className
 * @returns {HTMLElement|null}
 */
function buildRow(section, className) {
  if (!section) return null;
  const row = createElement('div', className);
  row.append(...section.childNodes);
  return row;
}

/**
 * Builds the attribution row (logos + copyright meta).
 * @param {Element} section
 * @returns {HTMLElement|null}
 */
function buildAttributions(section) {
  if (!section) return null;
  const row = createElement('div', 'footer-attributions');
  const list = section.querySelector('ul');
  if (list) {
    list.classList.add('footer-attribution-list');
    list.querySelectorAll('li').forEach((li) => {
      const link = li.querySelector('a') || li;
      link.classList.add('footer-attribution');
      link.prepend(extractLabel(link, 'footer-attribution-label'));
    });
    row.append(list);
  }
  const meta = createElement('div', 'footer-meta');
  section.querySelectorAll(':scope > p').forEach((p) => {
    if (/©|copyright/i.test(p.textContent)) p.classList.add('footer-copyright');
    else p.classList.add('footer-updated');
    meta.append(p);
  });
  if (meta.children.length) row.append(meta);
  return row;
}

/**
 * Builds the newsletter subscribe dialog from authored copy.
 * @param {Element} section
 * @returns {HTMLDialogElement|null}
 */
function buildSubscribeDialog(section) {
  if (!section) return null;
  const heading = section.querySelector('h1, h2, h3');
  const list = section.querySelector('ul');
  const paragraphs = [...section.querySelectorAll(':scope > p')];
  const before = paragraphs.filter((p) => !list
    // eslint-disable-next-line no-bitwise
    || (p.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING));
  const after = paragraphs.filter((p) => !before.includes(p));
  const text = (i, fallback) => (before[i] ? before[i].textContent.trim() : fallback);

  const dialog = createElement('dialog', 'footer-subscribe');
  dialog.setAttribute('aria-labelledby', 'footer-subscribe-title');

  const close = createElement('button', 'footer-subscribe-close');
  close.type = 'button';
  close.setAttribute('aria-label', 'close');
  close.innerHTML = '<span aria-hidden="true">&times;</span>';
  close.addEventListener('click', () => dialog.close());

  const title = createElement('h2', 'footer-subscribe-title', heading ? heading.textContent.trim() : '');
  title.id = 'footer-subscribe-title';

  const form = createElement('form', 'footer-subscribe-form js-cm-form');
  form.id = 'subForm';
  form.action = SUBSCRIBE_CONFIG.action;
  form.method = 'post';
  form.autocomplete = 'off';
  form.dataset.id = SUBSCRIBE_CONFIG.formId;

  const field = (labelText, id, type, name, required) => {
    const wrap = createElement('div', 'footer-subscribe-field');
    const label = createElement('label', '', labelText);
    label.htmlFor = id;
    if (required) label.append(createElement('span', 'footer-subscribe-required', '*'));
    const input = createElement('input');
    Object.assign(input, {
      id, type, name, maxLength: 200, required, autocomplete: 'off',
    });
    if (type === 'email') input.className = 'js-cm-email-input';
    wrap.append(label, input);
    return wrap;
  };

  const checkbox = (labelText, id, name, value, checked) => {
    const wrap = createElement('div', 'footer-subscribe-check');
    const input = createElement('input');
    Object.assign(input, {
      id, type: 'checkbox', name, value, checked,
    });
    const label = createElement('label', '', labelText);
    label.htmlFor = id;
    wrap.append(input, label);
    return wrap;
  };

  form.append(
    field(text(0, 'Name'), 'fieldName', 'text', 'cm-name', false),
    field(text(1, 'Email'), 'fieldEmail', 'email', 'email', true),
    checkbox(text(2, ''), 'cm-privacy-consent', 'cm-privacy-consent', '1', true),
  );

  if (list) {
    const group = createElement('fieldset', 'footer-subscribe-lists');
    const legend = createElement('legend', 'footer-subscribe-legend', text(3, ''));
    const selectAll = createElement('button', 'footer-subscribe-select-all', text(4, 'Select All'));
    selectAll.type = 'button';
    const header = createElement('div', 'footer-subscribe-lists-header', legend, selectAll);
    const options = createElement('div', 'footer-subscribe-options');
    list.querySelectorAll('li').forEach((li, i) => {
      const name = li.textContent.trim();
      const code = SUBSCRIBE_CONFIG.lists[name.toLowerCase()] || `list-${i + 1}`;
      options.append(checkbox(name, `cm-list-${code}`, `cm-ol-${code}`, code, false));
    });
    selectAll.addEventListener('click', () => {
      const boxes = [...options.querySelectorAll('input')];
      const all = boxes.every((b) => b.checked);
      boxes.forEach((b) => { b.checked = !all; });
    });
    group.append(header, options);
    form.append(group);
  }

  const submit = createElement('button', 'footer-subscribe-submit', after[0] ? after[0].textContent.trim() : 'Submit');
  submit.type = 'submit';
  form.append(createElement('div', 'footer-subscribe-actions', submit));

  const panel = createElement('div', 'footer-subscribe-panel', close, title, form);
  dialog.append(panel);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  return dialog;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const doc = await fetchFragment();
  if (!doc) return;
  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');
  const [
    brandSection,
    partnersSection,
    newsletterSection,
    contactSection,
    legalSection,
    attributionSection,
    subscribeSection,
  ] = sections;

  decorateLinks(doc.body);
  decorateImages(doc.body);

  const title = buildTitle(brandSection);
  const info = buildInfo(brandSection);
  const partners = buildPartners(partnersSection);
  const { col: newsletter, cta } = buildNewsletter(newsletterSection);
  const middle = createElement('div', 'footer-middle', info, ...partners, newsletter);
  const contact = buildRow(contactSection, 'footer-contact');

  const top = createElement('div', 'footer-top', title, middle, contact);
  const legal = buildRow(legalSection, 'footer-legal');
  const attributions = buildAttributions(attributionSection);

  block.textContent = '';
  block.append(top);
  if (legal) block.append(legal);
  if (attributions) block.append(attributions);

  const dialog = buildSubscribeDialog(subscribeSection);
  if (dialog && cta) {
    block.append(dialog);
    cta.setAttribute('role', 'button');
    cta.setAttribute('aria-haspopup', 'dialog');
    let scriptLoaded = false;
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      dialog.showModal();
      if (!scriptLoaded) {
        scriptLoaded = true;
        loadScript(SUBSCRIBE_CONFIG.script, { async: '', crossorigin: 'anonymous' }).catch(() => {});
      }
    });
  }
}
