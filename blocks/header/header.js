// desktop layout (horizontal menu, search toggle) from this width up
const isDesktop = window.matchMedia('(min-width: 1200px)');

/**
 * Creates an element with optional class name and attributes.
 * @param {string} tag Tag name
 * @param {string} [className] Class name(s)
 * @param {Object} [attrs] Attributes to set
 * @returns {HTMLElement}
 */
function createEl(tag, className, attrs = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

/**
 * Normalizes a path for comparison (drops local /content prefix, trailing slash, .html).
 * @param {string} path Pathname
 * @returns {string}
 */
function normalizePath(path) {
  return (path || '/')
    .replace(/^\/content(?=\/)/, '')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '') || '/';
}

/**
 * Returns the normalized pathname of a link, or null for other origins.
 * @param {HTMLAnchorElement} link Link element
 * @returns {string|null}
 */
function linkPath(link) {
  try {
    const url = new URL(link.getAttribute('href'), window.location.href);
    return url.origin === window.location.origin ? normalizePath(url.pathname) : null;
  } catch {
    return null;
  }
}

/**
 * Opens links to other origins in a new tab (as on the source site).
 * @param {Element} root Container element
 */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((link) => {
    if (link.getAttribute('href').startsWith('http') && linkPath(link) === null) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
}

/**
 * Fetches the nav fragment (local content first, site root fallback) and returns its sections.
 * Relative image paths are resolved against the fragment URL.
 * @returns {Promise<Element[]>}
 */
async function fetchNavSections() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return [];
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.body.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', new URL(img.getAttribute('src'), resp.url).href);
    img.setAttribute('loading', 'eager');
  });
  return [...doc.body.children].filter((el) => el.tagName === 'DIV');
}

/**
 * Returns the direct paragraph children of an element.
 * @param {Element} el Element
 * @returns {Element[]}
 */
function childParagraphs(el) {
  return el ? [...el.children].filter((c) => c.tagName === 'P') : [];
}

/**
 * Sets the open state of a disclosure toggle and its controlled region.
 * @param {Element} toggle Toggle button
 * @param {Element} region Controlled region
 * @param {boolean} open Desired state
 */
function setDisclosure(toggle, region, open) {
  if (!toggle || !region) return;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  region.classList.toggle('is-open', open);
  region.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) region.removeAttribute('inert');
  else region.setAttribute('inert', '');
}

/**
 * Builds the government masthead bar with its expandable panel and language switcher.
 * @param {Element} section Masthead section from the nav fragment
 * @param {Element} [langSection] Language section from the nav fragment
 * @returns {Element|null}
 */
function buildMasthead(section, langSection) {
  if (!section) return null;
  const paragraphs = childParagraphs(section);
  const identityP = paragraphs.find((p) => p.querySelector('img')) || paragraphs[0];
  const toggleP = paragraphs.find((p) => p !== identityP && p.textContent.trim());

  const masthead = createEl('div', 'nav-masthead');
  const inner = createEl('div', 'nav-masthead-inner');
  const bar = createEl('div', 'nav-masthead-bar');
  const identity = createEl('div', 'nav-masthead-identity');

  if (identityP) {
    const logo = identityP.querySelector('img');
    if (logo) {
      logo.className = 'nav-masthead-logo';
      logo.width = 24;
      logo.height = 21;
      identity.append(logo);
    }
    const text = createEl('span', 'nav-masthead-text');
    text.textContent = identityP.textContent.trim();
    identity.append(text);
  }

  const panel = createEl('div', 'nav-masthead-panel', { id: 'nav-masthead-panel', 'aria-hidden': 'true' });
  panel.setAttribute('inert', '');
  section.querySelectorAll(':scope > ul > li').forEach((li) => {
    let icon = null;
    let title = '';
    const body = [];
    const parts = childParagraphs(li);
    if (!parts.length) parts.push(li);
    parts.forEach((p) => {
      const onlyImg = p.querySelector('img') && !p.textContent.trim();
      const strong = p.firstElementChild;
      const onlyStrong = p.children.length === 1 && strong.tagName === 'STRONG'
        && p.textContent.trim() === strong.textContent.trim();
      if (onlyImg && !icon) icon = p.querySelector('img');
      else if (onlyStrong && !title) title = strong.textContent.trim();
      else body.push(p);
    });

    const item = createEl('div', 'nav-masthead-item');
    const iconWrap = createEl('div', 'nav-masthead-item-icon');
    if (icon) iconWrap.append(icon);
    const textWrap = createEl('div', 'nav-masthead-item-text');
    if (title) {
      const titleEl = createEl('strong', 'nav-masthead-item-title');
      titleEl.textContent = title;
      textWrap.append(titleEl);
    }
    body.forEach((p) => {
      const para = p === li ? createEl('p') : p;
      if (p === li) para.append(...[...li.childNodes]);
      para.querySelectorAll('img').forEach((img) => img.classList.add('nav-inline-icon'));
      para.querySelectorAll('a').forEach((a) => a.append(createEl('span', 'nav-external-icon', { 'aria-hidden': 'true' })));
      textWrap.append(para);
    });
    item.append(iconWrap, textWrap);
    panel.append(item);
  });

  if (toggleP) {
    const toggle = createEl('button', 'nav-masthead-toggle', {
      type: 'button', 'aria-expanded': 'false', 'aria-controls': panel.id,
    });
    const label = createEl('span', 'nav-masthead-toggle-label');
    label.textContent = toggleP.textContent.trim();
    toggle.append(label, createEl('span', 'nav-chevron', { 'aria-hidden': 'true' }));
    toggle.addEventListener('click', () => {
      setDisclosure(toggle, panel, toggle.getAttribute('aria-expanded') !== 'true');
    });
    identity.append(toggle);
  }
  bar.append(identity);

  const langLinks = langSection ? [...langSection.querySelectorAll('a[href]')] : [];
  if (langLinks.length) {
    const current = normalizePath(window.location.pathname);
    const active = langLinks.find((a) => {
      const p = linkPath(a);
      return p && (current === p || current.startsWith(`${p}/`));
    }) || langLinks[0];
    const lang = createEl('div', 'nav-language');
    const button = createEl('button', 'nav-language-button', {
      type: 'button', 'aria-expanded': 'false', 'aria-haspopup': 'true', 'aria-controls': 'nav-language-menu',
    });
    button.append(active.textContent.trim(), createEl('span', 'nav-chevron', { 'aria-hidden': 'true' }));
    const menu = createEl('ul', 'nav-language-menu', { id: 'nav-language-menu', 'aria-hidden': 'true' });
    menu.setAttribute('inert', '');
    langLinks.forEach((a) => {
      const li = createEl('li');
      a.className = 'nav-language-option';
      a.setAttribute('lang', (linkPath(a) || '').split('/').pop() || '');
      if (a === active) {
        a.setAttribute('aria-current', 'true');
        a.append(createEl('span', 'nav-chevron', { 'aria-hidden': 'true' }));
        a.addEventListener('click', (e) => {
          e.preventDefault();
          setDisclosure(button, menu, false);
          button.focus();
        });
      }
      li.append(a);
      menu.append(li);
    });
    button.addEventListener('click', () => setDisclosure(button, menu, true));
    document.addEventListener('click', (e) => {
      if (!lang.contains(e.target)) setDisclosure(button, menu, false);
    });
    lang.append(button, menu);
    bar.append(lang);
  }

  inner.append(bar, panel);
  masthead.append(inner);
  decorateExternalLinks(masthead);
  return masthead;
}

/**
 * Builds the brand (logo) area.
 * @param {Element} section Brand section from the nav fragment
 * @returns {Element}
 */
function buildBrand(section) {
  const brand = createEl('div', 'nav-brand');
  if (!section) return brand;
  let link = section.querySelector('a[href]');
  const img = section.querySelector('img');
  if (!link) {
    link = createEl('a', '', { href: '/' });
    link.textContent = img ? '' : section.textContent.trim();
  }
  if (img) {
    link.textContent = '';
    link.append(img);
    link.setAttribute('aria-label', img.alt || 'Home');
  }
  brand.append(link);
  decorateExternalLinks(brand);
  return brand;
}

/**
 * Builds the primary navigation list and marks the current page.
 * @param {Element} section Navigation section from the nav fragment
 * @returns {Element}
 */
function buildSections(section) {
  const sections = createEl('div', 'nav-sections', { id: 'nav-sections' });
  const list = section ? section.querySelector('ul') : null;
  if (!list) return sections;
  const current = normalizePath(window.location.pathname);
  list.querySelectorAll('a[href]').forEach((a) => {
    if (linkPath(a) === current) a.setAttribute('aria-current', 'page');
  });
  sections.append(list);
  decorateExternalLinks(sections);
  return sections;
}

/**
 * Builds the search toggle (desktop) and search bar from the tools section.
 * @param {Element} section Tools section from the nav fragment
 * @returns {{ toggle: Element|null, bar: Element|null }}
 */
function buildSearch(section) {
  if (!section) return { toggle: null, bar: null };
  const link = section.querySelector('a[href]');
  const icon = section.querySelector('img');
  const placeholderP = childParagraphs(section).find((p) => !p.querySelector('a') && p.textContent.trim());
  const placeholder = placeholderP ? placeholderP.textContent.trim() : '';
  const label = (icon && icon.alt) || (link && link.textContent.trim()) || 'Search';
  const action = link ? link.getAttribute('href') : '/search?q=';

  const bar = createEl('div', 'nav-search', { id: 'nav-search' });
  const inner = createEl('div', 'nav-search-inner');
  const form = createEl('form', 'nav-search-form', { role: 'search', action: action.split('?')[0] });
  const input = createEl('input', 'nav-search-input', {
    type: 'search', name: 'q', placeholder, 'aria-label': placeholder || label, autocomplete: 'off',
  });
  const submit = createEl('button', 'nav-search-submit', { type: 'submit', 'aria-label': label });
  if (icon) submit.append(icon.cloneNode());
  form.append(input, submit);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = new URL(action, window.location.href);
    url.searchParams.set('q', input.value.trim());
    window.location.href = url.href;
  });
  inner.append(form);
  bar.append(inner);

  const toggle = createEl('button', 'nav-search-toggle', {
    type: 'button', 'aria-expanded': 'false', 'aria-controls': bar.id, 'aria-label': label,
  });
  if (icon) {
    icon.className = 'nav-search-icon';
    toggle.append(icon);
  }
  toggle.append(createEl('span', 'nav-close-icon', { 'aria-hidden': 'true' }));
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    bar.classList.toggle('is-open', open);
  });
  return { toggle, bar };
}

/**
 * Opens or closes the mobile menu.
 * @param {Element} nav The nav element
 * @param {Element} hamburger The hamburger button
 * @param {boolean} open Desired state
 */
function setMenu(nav, hamburger, open) {
  const expanded = open && !isDesktop.matches;
  nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  hamburger.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  document.body.style.overflowY = expanded ? 'hidden' : '';
}

/**
 * Loads and decorates the header: masthead, logo, navigation, search and mobile menu.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const [
    mastheadSection, langSection, brandSection, navSection, toolsSection,
  ] = await fetchNavSections();

  block.textContent = '';
  const wrapper = createEl('div', 'nav-wrapper');
  const masthead = buildMasthead(mastheadSection, langSection);
  if (masthead) wrapper.append(masthead);

  const nav = createEl('nav', 'nav-main', { id: 'nav', 'aria-expanded': 'false', 'aria-label': 'Main' });
  const navBar = createEl('div', 'nav-bar');
  const search = buildSearch(toolsSection);
  const tools = createEl('div', 'nav-tools');
  if (search.toggle) tools.append(search.toggle);

  const hamburger = createEl('button', 'nav-hamburger', {
    type: 'button', 'aria-controls': 'nav-sections', 'aria-expanded': 'false', 'aria-label': 'Open navigation',
  });
  hamburger.append(createEl('span'), createEl('span'), createEl('span'));
  hamburger.addEventListener('click', () => {
    setMenu(nav, hamburger, nav.getAttribute('aria-expanded') !== 'true');
  });

  navBar.append(buildBrand(brandSection), buildSections(navSection), tools, hamburger);
  nav.append(navBar);
  if (search.bar) nav.append(search.bar);
  wrapper.append(nav);
  block.append(wrapper);

  const closeSearch = () => {
    if (!search.toggle) return;
    search.toggle.setAttribute('aria-expanded', 'false');
    search.bar.classList.remove('is-open');
  };

  // reset mobile state when crossing breakpoints
  isDesktop.addEventListener('change', () => {
    setMenu(nav, hamburger, false);
    closeSearch();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const languageButton = wrapper.querySelector('.nav-language-button[aria-expanded="true"]');
    if (languageButton) {
      setDisclosure(languageButton, wrapper.querySelector('.nav-language-menu'), false);
      languageButton.focus();
    } else if (nav.getAttribute('aria-expanded') === 'true') {
      setMenu(nav, hamburger, false);
      hamburger.focus();
    } else if (search.toggle && search.toggle.getAttribute('aria-expanded') === 'true') {
      closeSearch();
      search.toggle.focus();
    }
  });
}
