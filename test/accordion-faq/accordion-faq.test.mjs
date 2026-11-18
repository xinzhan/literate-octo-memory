/* eslint-disable no-await-in-loop, no-restricted-syntax -- WebDriver steps must run in sequence */
/**
 * Selenium test suite for the accordion-faq block.
 * Test case IDs match test/accordion-faq/TEST-PLAN.md.
 *
 * Run: npm run test:faq   (local preview must be running)
 */
import {
  describe, it, before, after, beforeEach,
} from 'node:test';
import assert from 'node:assert/strict';
import {
  Builder, Browser, By, Key, until, logging,
} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_PATH = process.env.FAQ_PAGE_PATH || '/content/personal/products-services/fibre';
const EXPECTED_ITEMS = Number(process.env.FAQ_EXPECTED_ITEMS || 13);
const HEADLESS = process.env.HEADLESS !== 'false';
const PAGE_URL = `${BASE_URL}${PAGE_PATH}`;

const FIRST_QUESTION = 'What Singtel fibre broadband plans can I choose from?';
const LAST_QUESTION = 'What if I need stronger WiFi coverage for a bigger home?';

const BLOCK = '.accordion-faq';
const ITEM = `${BLOCK} > details.accordion-faq-item`;
const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 375, height: 812 };

let driver;

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

async function openPage() {
  await driver.get(PAGE_URL);
  const block = await driver.wait(
    until.elementLocated(By.css(`${BLOCK}[data-block-status="loaded"]`)),
    10000,
    'accordion-faq block did not reach data-block-status="loaded"',
  );
  await driver.executeScript('arguments[0].scrollIntoView({block: "center"})', block);
  return block;
}

const items = () => driver.findElements(By.css(ITEM));
const summaryOf = (item) => item.findElement(By.css(':scope > summary.accordion-faq-item-label'));
const bodyOf = (item) => item.findElement(By.css(':scope > div.accordion-faq-item-body'));
const isOpen = async (item) => (await item.getAttribute('open')) !== null;

async function click(el) {
  await driver.executeScript('arguments[0].scrollIntoView({block: "center"})', el);
  await el.click();
}

/** Builds a block from row markup in the page and decorates it with the real module. */
async function decorateFixture(rowsHtml) {
  return driver.executeAsyncScript(`
    const [rowsHtml, done] = arguments;
    const base = (window.hlx && window.hlx.codeBasePath) || '';
    import(base + '/blocks/accordion-faq/accordion-faq.js').then(({ default: decorate }) => {
      const block = document.createElement('div');
      block.className = 'accordion-faq test-fixture';
      block.innerHTML = rowsHtml;
      document.querySelector('main').append(block);
      decorate(block);
      const result = [...block.children].map((d) => ({
        tag: d.tagName,
        empty: d.classList.contains('empty'),
        summary: d.querySelector(':scope > summary')?.textContent.trim(),
        summaryHtml: d.querySelector(':scope > summary')?.innerHTML,
        body: d.querySelector(':scope > .accordion-faq-item-body')?.textContent.replace(/\\s+/g, ' ').trim(),
        bodyHtml: d.querySelector(':scope > .accordion-faq-item-body')?.innerHTML,
        chevron: getComputedStyle(d.querySelector(':scope > summary'), '::after').display,
      }));
      block.remove();
      done(result);
    }).catch((e) => done({ error: String(e) }));
  `, rowsHtml);
}

const row = (...cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`;

before(async () => {
  const options = new chrome.Options();
  if (HEADLESS) options.addArguments('--headless=new');
  options.addArguments('--no-sandbox', '--disable-dev-shm-usage', `--window-size=${DESKTOP.width},${DESKTOP.height}`);
  if (process.env.CHROME_BIN) options.setChromeBinaryPath(process.env.CHROME_BIN);
  const prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
  options.setLoggingPrefs(prefs);
  driver = await new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();
  await driver.manage().setTimeouts({ script: 10000 });
});

after(async () => {
  if (driver) await driver.quit();
});

describe('A. Rendering and structure', () => {
  before(openPage);

  it('TC-01 block loads', async () => {
    const status = await driver.findElement(By.css(BLOCK)).getAttribute('data-block-status');
    assert.equal(status, 'loaded');
  });

  it('TC-02 item count', async () => {
    assert.equal((await items()).length, EXPECTED_ITEMS);
  });

  it('TC-03 every item has one summary and one body', async () => {
    const counts = await driver.executeScript(`
      return [...document.querySelectorAll(arguments[0])].map((d) => [
        d.querySelectorAll(':scope > summary.accordion-faq-item-label').length,
        d.querySelectorAll(':scope > div.accordion-faq-item-body').length,
      ]);`, ITEM);
    counts.forEach(([s, b], i) => assert.deepEqual([s, b], [1, 1], `item ${i + 1}`));
  });

  it('TC-04 questions present, first and last as expected', async () => {
    const questions = await driver.executeScript(
      'return [...document.querySelectorAll(arguments[0])].map((s) => s.textContent.replace(/\\s+/g, " ").trim());',
      `${ITEM} > summary`,
    );
    questions.forEach((q, i) => assert.ok(q.length > 0, `question ${i + 1} is empty`));
    assert.equal(questions[0], FIRST_QUESTION);
    assert.equal(questions[questions.length - 1], LAST_QUESTION);
  });

  it('TC-05 no empty items on the live page', async () => {
    assert.equal((await driver.findElements(By.css(`${ITEM}.empty`))).length, 0);
  });

  it('TC-06 summaries hold inline text (lone p/heading unwrapped)', async () => {
    const wrapped = await driver.findElements(By.css(`${ITEM} > summary > :is(p, h1, h2, h3, h4, h5, h6)`));
    assert.equal(wrapped.length, 0);
  });
});

describe('B. Interaction (mouse)', () => {
  beforeEach(openPage);

  it('TC-07 all items collapsed by default', async () => {
    for (const item of await items()) {
      assert.equal(await isOpen(item), false);
      assert.equal(await bodyOf(item).isDisplayed(), false);
    }
  });

  it('TC-08 click opens an item', async () => {
    const [first] = await items();
    await click(await summaryOf(first));
    assert.equal(await isOpen(first), true);
    const body = await bodyOf(first);
    assert.equal(await body.isDisplayed(), true);
    assert.ok((await body.getText()).trim().length > 0, 'answer text is empty');
  });

  it('TC-09 second click closes the item', async () => {
    const [first] = await items();
    const summary = await summaryOf(first);
    await click(summary);
    await click(summary);
    assert.equal(await isOpen(first), false);
    assert.equal(await bodyOf(first).isDisplayed(), false);
  });

  it('TC-10 items open independently', async () => {
    const [first, second] = await items();
    await click(await summaryOf(first));
    await click(await summaryOf(second));
    assert.equal(await isOpen(first), true, 'item 1 closed when item 2 opened');
    assert.equal(await isOpen(second), true);
  });

  it('TC-11 chevron rotates when opened', async () => {
    const [first] = await items();
    const summary = await summaryOf(first);
    const transform = () => driver.executeScript('return getComputedStyle(arguments[0], "::after").transform;', summary);
    const closed = await transform();
    await click(summary);
    await sleep(300); // CSS transition is 0.2s
    const opened = await transform();
    assert.notEqual(opened, closed);
  });

  it('TC-12 every item opens with an answer and closes', async () => {
    const all = await items();
    for (let i = 0; i < all.length; i += 1) {
      const summary = await summaryOf(all[i]);
      await click(summary);
      assert.equal(await isOpen(all[i]), true, `item ${i + 1} did not open`);
      assert.ok((await bodyOf(all[i]).getText()).trim().length > 0, `item ${i + 1} answer is empty`);
      await click(summary);
      assert.equal(await isOpen(all[i]), false, `item ${i + 1} did not close`);
    }
  });
});

describe('C. Keyboard and accessibility', () => {
  beforeEach(openPage);

  const focus = (el) => driver.executeScript('arguments[0].focus()', el);
  const active = () => driver.switchTo().activeElement();

  it('TC-13 summary is focusable', async () => {
    const summary = await summaryOf((await items())[0]);
    await focus(summary);
    assert.equal(await (await active()).getId(), await summary.getId());
  });

  it('TC-14 Enter toggles', async () => {
    const [first] = await items();
    await focus(await summaryOf(first));
    await (await active()).sendKeys(Key.ENTER);
    assert.equal(await isOpen(first), true);
    await (await active()).sendKeys(Key.ENTER);
    assert.equal(await isOpen(first), false);
  });

  it('TC-15 Space toggles', async () => {
    const [first] = await items();
    await focus(await summaryOf(first));
    await (await active()).sendKeys(Key.SPACE);
    assert.equal(await isOpen(first), true);
    await (await active()).sendKeys(Key.SPACE);
    assert.equal(await isOpen(first), false);
  });

  it('TC-16 Tab moves to the next question', async () => {
    const [first, second] = await items();
    await focus(await summaryOf(first));
    await (await active()).sendKeys(Key.TAB);
    assert.equal(await (await active()).getId(), await (await summaryOf(second)).getId());
  });

  it('TC-17 accessible name matches the question', async () => {
    for (const item of await items()) {
      const summary = await summaryOf(item);
      const text = (await summary.getText()).replace(/\s+/g, ' ').trim();
      const name = (await summary.getAccessibleName()).replace(/\s+/g, ' ').trim();
      assert.equal(name, text);
    }
  });
});

describe('D. Answer content', () => {
  before(openPage);

  it('TC-18 links in answers are valid absolute URLs', async () => {
    const hrefs = await driver.executeScript(
      'return [...document.querySelectorAll(arguments[0])].map((a) => a.getAttribute("href"));',
      `${ITEM} > .accordion-faq-item-body a`,
    );
    hrefs.forEach((href) => {
      assert.ok(href && href !== '#', `empty link: ${href}`);
      assert.match(href, /^(https?:|mailto:|tel:)/, `not absolute: ${href}`);
      assert.doesNotThrow(() => new URL(href));
    });
  });

  it('TC-19 rich text kept (paragraphs and lists)', async () => {
    assert.ok((await driver.findElements(By.css(`${ITEM} > .accordion-faq-item-body p`))).length > 0, 'no paragraphs');
    assert.ok((await driver.findElements(By.css(`${ITEM} > .accordion-faq-item-body :is(ul, ol) > li`))).length > 0, 'no lists');
  });
});

describe('E. Layout and responsiveness', () => {
  after(() => driver.manage().window().setRect(DESKTOP));

  it('TC-20 width capped at 800px and centred (desktop)', async () => {
    await driver.manage().window().setRect(DESKTOP);
    await openPage();
    const r = await driver.executeScript(`
      const b = document.querySelector(arguments[0]).getBoundingClientRect();
      const p = document.querySelector(arguments[0]).parentElement.getBoundingClientRect();
      return { width: b.width, left: b.left - p.left, right: p.right - b.right };`, BLOCK);
    assert.ok(r.width <= 800, `width ${r.width}`);
    assert.ok(Math.abs(r.left - r.right) <= 2, `not centred: ${r.left} vs ${r.right}`);
  });

  it('TC-21 summary uses block display and pointer cursor', async () => {
    const s = await driver.executeScript(
      'const c = getComputedStyle(document.querySelector(arguments[0])); return { display: c.display, cursor: c.cursor };',
      `${ITEM} > summary`,
    );
    assert.deepEqual(s, { display: 'block', cursor: 'pointer' });
  });

  it('TC-22 mobile: block fits the viewport and still toggles', async () => {
    await driver.manage().window().setRect(MOBILE);
    await openPage();
    const m = await driver.executeScript(`
      const b = document.querySelector(arguments[0]);
      return { width: b.getBoundingClientRect().width, vw: document.documentElement.clientWidth,
        overflow: b.scrollWidth > b.clientWidth };`, BLOCK);
    assert.ok(m.width <= m.vw, `block ${m.width}px wider than viewport ${m.vw}px`);
    assert.equal(m.overflow, false, 'block content overflows horizontally');
    const [first] = await items();
    await click(await summaryOf(first));
    assert.equal(await isOpen(first), true);
  });
});

describe('F. Surrounding default content', () => {
  before(openPage);

  const order = (text, selector) => driver.executeScript(`
    const block = document.querySelector(arguments[0]);
    const el = [...block.closest('.section').querySelectorAll(arguments[2])]
      .find((e) => e.textContent.trim().includes(arguments[1]) && !block.contains(e));
    if (!el) return null;
    const pos = block.compareDocumentPosition(el);
    return { before: Boolean(pos & Node.DOCUMENT_POSITION_PRECEDING), href: el.getAttribute('href') };`, BLOCK, text, selector);

  it('TC-23 FAQs heading comes before the block', async () => {
    const h = await order('FAQs', 'h1, h2, h3, h4, h5, h6');
    assert.ok(h, 'FAQs heading not found in the section');
    assert.equal(h.before, true);
  });

  it('TC-24 help links come after the block', async () => {
    const chat = await order('Chat with us', 'a');
    assert.ok(chat, '"Chat with us" link not found');
    assert.equal(chat.before, false);
    assert.match(chat.href, /api\.whatsapp\.com/);
    for (const text of ['Read FAQ', 'View Terms & Conditions', 'Typical Speed Information']) {
      const link = await order(text, 'a');
      assert.ok(link, `"${text}" link not found`);
      assert.equal(link.before, false, `"${text}" is before the block`);
    }
  });
});

describe('G. Authoring edge cases (isolated fixture)', () => {
  before(openPage);

  it('TC-25 standard two-cell row', async () => {
    const r = await decorateFixture(row('<p>Q</p>', '<p>A</p>'));
    assert.equal(r.length, 1);
    assert.equal(r[0].tag, 'DETAILS');
    assert.equal(r[0].summary, 'Q');
    assert.equal(r[0].body, 'A');
  });

  it('TC-26 single cell with several elements', async () => {
    const r = await decorateFixture(row('<p>Q</p><p>A</p>'));
    assert.equal(r[0].summary, 'Q');
    assert.equal(r[0].body, 'A');
  });

  it('TC-27 single cell with one element is an empty item without chevron', async () => {
    const r = await decorateFixture(row('<p>Q only</p>'));
    assert.equal(r[0].summary, 'Q only');
    assert.equal(r[0].empty, true);
    assert.equal(r[0].chevron, 'none');
  });

  it('TC-28 empty rows are dropped', async () => {
    const r = await decorateFixture(row('', '') + row('<p>Q</p>', '<p>A</p>'));
    assert.equal(r.length, 1);
    assert.equal(r[0].summary, 'Q');
  });

  it('TC-29 extra cells are appended to the answer', async () => {
    const r = await decorateFixture(row('<p>Q</p>', '<p>A1</p>', '<p>A2</p>'));
    assert.equal(r[0].body, 'A1A2');
    assert.ok(r[0].bodyHtml.indexOf('A1') < r[0].bodyHtml.indexOf('A2'));
  });

  it('TC-30 rich answer keeps links and lists', async () => {
    const r = await decorateFixture(row('<p>Q</p>', '<p>text <a href="https://example.com/">link</a></p><ul><li>x</li></ul>'));
    assert.match(r[0].bodyHtml, /<a href="https:\/\/example\.com\/">link<\/a>/);
    assert.match(r[0].bodyHtml, /<ul><li>x<\/li><\/ul>/);
  });
});

describe('H. Stability', () => {
  it('TC-31 no accordion-faq errors in the browser console', async () => {
    await driver.manage().logs().get(logging.Type.BROWSER); // clear earlier entries
    await openPage();
    const errors = (await driver.manage().logs().get(logging.Type.BROWSER))
      .filter((e) => e.level.value >= logging.Level.SEVERE.value && /accordion-faq/i.test(e.message));
    assert.deepEqual(errors.map((e) => e.message), []);
  });
});
