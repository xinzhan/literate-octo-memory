/*
 * settle.js — wait for client-rendered (SPA/React) pages to finish drawing content.
 * Opt-in via SCOPE_SETTLE=<max ms>: after navigation, polls the rendered text length and
 * returns once it has stopped changing for ~1.5s (or the max is reached). 0/unset = no-op.
 */
const SETTLE = parseInt(process.env.SCOPE_SETTLE || '0', 10);

async function settle(page) {
  if (!SETTLE) return;
  const end = Date.now() + SETTLE;
  let last = -1;
  let stable = 0;
  while (Date.now() < end) {
    const len = await page.evaluate(() => (document.body ? document.body.innerText.length : 0)).catch(() => 0);
    if (len > 0 && len === last) {
      stable += 1;
      if (stable >= 3) return;
    } else stable = 0;
    last = len;
    await page.waitForTimeout(500);
  }
}

module.exports = { settle };
