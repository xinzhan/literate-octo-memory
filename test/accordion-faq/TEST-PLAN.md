# Test Plan: `accordion-faq` block (Selenium)

## 1. Purpose

Verify that the `accordion-faq` block renders, behaves and degrades correctly on
the migrated Singtel Fibre page, and that its decoration logic handles the cell
shapes authors may produce in Document Authoring.

## 2. Scope

**In scope**
- `blocks/accordion-faq/accordion-faq.js` (decoration) and `accordion-faq.css`
  (layout, chevron, collapsed/expanded states).
- The block instance on `/personal/products-services/fibre` (13 FAQ items).
- The default content directly around the block: the "FAQs" heading before it,
  and the WhatsApp "Chat with us" card and help links after it.

**Out of scope**
- Other blocks on the page, header/footer, and site-wide design tokens.
- Singtel brand styling (colours/typography). This comes in the design migration
  step, so tests check structure and behaviour, not pixel values.
- Cross-browser runs other than Chrome (Firefox/Safari can be added later by
  changing the Selenium browser, see §6).

## 3. Block behaviour under test (from the code)

| Behaviour | Source |
| --- | --- |
| Each authored row becomes `<details class="accordion-faq-item">` with `<summary class="accordion-faq-item-label">` and `<div class="accordion-faq-item-body">` | `decorate()` |
| Row with 2+ cells: cell 1 = question, remaining cells = answer | `decorate()` |
| Row with 1 cell and several elements: first element = question, rest = answer | `decorate()` |
| Row with 1 cell and one element: question only, item gets `.empty` and no chevron | `decorate()` + CSS |
| Empty rows are dropped | `decorate()` |
| A lone `<p>`/`<h1-6>` in the question cell is unwrapped into the summary | `decorate()` |
| Native `<details>`: all items start closed, items open independently (several can be open at once), keyboard support comes from the browser | HTML semantics |
| Block width capped at 800px and centred; chevron rotates when open; native marker hidden | CSS |

## 4. Test environment

| Item | Value |
| --- | --- |
| Tool | Selenium WebDriver 4 (`selenium-webdriver`, Node.js) with the built-in `node:test` runner |
| Browser | Chrome / Chrome for Testing, headless (`--headless=new`) |
| Driver | Resolved automatically by Selenium Manager |
| Target | Local preview (`aem up`, default `http://localhost:3000`) or a branch preview on `*.aem.page` |
| Page under test | `/content/personal/products-services/fibre` locally, `/personal/products-services/fibre` on aem.page |
| Viewports | Desktop 1280×900, mobile 375×812 |

Configuration (environment variables):

| Variable | Default | Purpose |
| --- | --- | --- |
| `BASE_URL` | `http://localhost:3000` | Site origin |
| `FAQ_PAGE_PATH` | `/content/personal/products-services/fibre` | Page that contains the block |
| `FAQ_EXPECTED_ITEMS` | `13` | Expected number of FAQ items on that page |
| `CHROME_BIN` | *(unset)* | Optional path to a Chrome binary |
| `HEADLESS` | `true` | Set to `false` to watch the run |

## 5. Test cases

Priority: **P1** = must pass before release, **P2** = should pass, **P3** = nice to have.
Every case is automated in `accordion-faq.test.mjs` under the same ID.

### A. Rendering and structure

| ID | Title | Steps | Expected result | Pri |
| --- | --- | --- | --- | --- |
| TC-01 | Block loads | Open the page and wait for `.accordion-faq[data-block-status="loaded"]` | Block reaches `loaded` within 10 s | P1 |
| TC-02 | Item count | Count `.accordion-faq > details.accordion-faq-item` | Equals `FAQ_EXPECTED_ITEMS` (13) | P1 |
| TC-03 | Item structure | For every item, check it has exactly one `summary.accordion-faq-item-label` and one `div.accordion-faq-item-body` | All items valid | P1 |
| TC-04 | Questions present | Read every summary's text | None empty; first is "What Singtel fibre broadband plans can I choose from?", last is "What if I need stronger WiFi coverage for a bigger home?" | P1 |
| TC-05 | No empty items on the live page | Count `.accordion-faq-item.empty` | 0 (every FAQ has an answer) | P2 |
| TC-06 | Summary holds inline text | Check summaries for `p`/`h1-6` children | None (lone paragraph/heading unwrapped) | P3 |

### B. Interaction (mouse)

| ID | Title | Steps | Expected result | Pri |
| --- | --- | --- | --- | --- |
| TC-07 | Collapsed by default | On load, check `open` on each item and visibility of each body | No item open, no body displayed | P1 |
| TC-08 | Click opens an item | Click the first summary | Item gets `open`; body is displayed and has non-empty text | P1 |
| TC-09 | Click closes an item | Click the same summary again | `open` removed; body hidden | P1 |
| TC-10 | Items are independent | Open items 1 and 2 | Both open at the same time (no exclusive behaviour) | P2 |
| TC-11 | Chevron rotates | Compare the computed `transform` of `summary::after` closed vs open | Values differ | P2 |
| TC-12 | Open/close every item | Open and close each of the 13 items | Each toggles correctly and shows a non-empty answer | P2 |

### C. Keyboard and accessibility

| ID | Title | Steps | Expected result | Pri |
| --- | --- | --- | --- | --- |
| TC-13 | Summary is focusable | Focus the first summary | It becomes `document.activeElement` | P1 |
| TC-14 | Enter toggles | With the summary focused, press Enter twice | Opens, then closes | P1 |
| TC-15 | Space toggles | With the summary focused, press Space twice | Opens, then closes | P1 |
| TC-16 | Tab order | Focus summary 1, press Tab | Focus moves to summary 2 (closed items' bodies are skipped) | P2 |
| TC-17 | Accessible name | Read the accessible name of each summary | Matches its visible question text | P2 |

### D. Answer content

| ID | Title | Steps | Expected result | Pri |
| --- | --- | --- | --- | --- |
| TC-18 | Links in answers are valid | Collect every `a` inside the item bodies | Each has an `href` that parses as an absolute `http(s)` URL; none empty or `#` | P1 |
| TC-19 | Rich text kept | Check the bodies for `p` and for at least one `ul`/`ol` | Paragraphs present; lists rendered as real lists | P2 |

### E. Layout and responsiveness

| ID | Title | Steps | Expected result | Pri |
| --- | --- | --- | --- | --- |
| TC-20 | Width cap and centring (desktop 1280) | Measure the block rect | Width ≤ 800px; left and right gaps equal (±2px) | P2 |
| TC-21 | Native marker hidden, pointer cursor | Computed style of the summary | `display: block`, `cursor: pointer` | P3 |
| TC-22 | Mobile (375) | Resize, open the first item | Block width ≤ viewport; block content doesn't overflow horizontally; item still toggles | P1 |

### F. Surrounding default content

| ID | Title | Steps | Expected result | Pri |
| --- | --- | --- | --- | --- |
| TC-23 | Heading before the block | Find the "FAQs" heading in the same section | It comes before the block in document order | P2 |
| TC-24 | Help links after the block | Find "Chat with us", "Read FAQ", "View Terms & Conditions", "Typical Speed Information" | All come after the block; "Chat with us" links to `api.whatsapp.com` | P2 |

### G. Authoring edge cases (isolated fixture)

These cases build a block in the page from known markup, decorate it with the
real `accordion-faq.js` module, and inspect the result. No content files are
needed.

| ID | Title | Authored row | Expected result | Pri |
| --- | --- | --- | --- | --- |
| TC-25 | Standard two-cell row | `Q \| A` | 1 item; summary "Q"; body "A" | P1 |
| TC-26 | Single cell, several elements | `[<p>Q</p><p>A</p>]` | Summary "Q"; body "A" | P2 |
| TC-27 | Single cell, one element | `[<p>Q only</p>]` | Summary "Q only"; item has `.empty`; chevron hidden | P2 |
| TC-28 | Empty row dropped | `[ ] [ ]` | No item created for it | P2 |
| TC-29 | Extra cells | `Q \| A1 \| A2` | Body contains A1 then A2 | P3 |
| TC-30 | Rich answer kept | `Q \| <p>text <a>link</a></p><ul><li>x</li></ul>` | Body keeps the link and the list | P2 |

### H. Stability

| ID | Title | Steps | Expected result | Pri |
| --- | --- | --- | --- | --- |
| TC-31 | No block errors in the console | Read the browser log after load | No SEVERE entries that mention `accordion-faq` | P1 |

## 6. Execution

```bash
# 1. Start the local preview in another terminal: npx -y @adobe/aem-cli up
# 2. Run the suite
npm run test:faq

# Against a branch preview
BASE_URL=https://<branch>--literate-octo-memory--xinzhan.aem.page \
FAQ_PAGE_PATH=/personal/products-services/fibre npm run test:faq
```

To run another browser, change `Builder().forBrowser(Browser.CHROME)` in the
test file to `Browser.FIREFOX` or `Browser.EDGE`. Selenium Manager fetches the driver.

## 7. Entry and exit criteria

- **Entry:** the Fibre page is imported, the preview is running, and the block files pass lint.
- **Exit:** all P1 cases pass; any failing P2/P3 case is logged with a reason
  and accepted or fixed.

## 8. Known content observations (not block defects)

- The source page repeats one question ("What if I need stronger WiFi coverage
  for a bigger home?" appears as items 6 and 13). TC-04 expects it as the
  last item; update the test if the duplicate is removed from the content.
- `FAQ_EXPECTED_ITEMS` must change if authors add or remove questions.

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Content edits change the item count or questions | Count and question checks are configurable (`FAQ_EXPECTED_ITEMS`) |
| The design migration changes the CSS (chevron, widths) | Layout checks use relationships (≤ 800, centred, rotated vs not), not exact pixels |
| Lazy section loading delays decoration | Each test waits for `data-block-status="loaded"` before asserting |
