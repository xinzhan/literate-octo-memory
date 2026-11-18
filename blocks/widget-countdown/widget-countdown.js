const UNITS = ['hours', 'minutes', 'seconds'];

/**
 * Parses a date string, returning null when it is not a valid date.
 * @param {string} value Candidate date text
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) return null;
  const text = value.trim();
  if (!/\d{4}-\d{2}-\d{2}/.test(text)) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Reads the end date from a link `end` query param (if a link was authored).
 * @param {string} href Link URL
 * @returns {Date|null}
 */
function endFromHref(href) {
  try {
    return toDate(new URL(href, window.location.href).searchParams.get('end'));
  } catch {
    return null;
  }
}

/**
 * Reads config from the authored rows. Supports:
 * - a single cell holding the ISO end datetime (e.g. 2026-12-31T23:59:59+08:00)
 * - key/value rows: `End | <datetime>`, `Labels | hours, minutes, seconds`
 * - a link carrying `?end=<datetime>` (fallback)
 * @param {Element} block The block element
 * @returns {{ end: Date|null, labels: string[] }}
 */
function readConfig(block) {
  let end = null;
  let labels = [...UNITS];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const key = cells.length > 1 ? cells[0].textContent.trim().toLowerCase() : '';
    const valueCell = cells.length > 1 ? cells[1] : cells[0];
    const value = valueCell.textContent.trim();

    if (key.startsWith('label')) {
      const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length === UNITS.length) labels = parts;
      return;
    }

    if (!end) {
      const link = valueCell.querySelector('a[href]');
      end = toDate(value) || (link && endFromHref(link.href));
    }
    if (!end) {
      // nested auto-blocked widget keeps its href in data-source
      const nested = row.querySelector('[data-source]');
      if (nested) end = endFromHref(nested.dataset.source);
    }
  });

  if (!end && block.dataset.end) end = toDate(block.dataset.end);
  return { end, labels };
}

/**
 * Splits remaining milliseconds into total hours, minutes and seconds.
 * @param {number} ms Remaining milliseconds
 * @returns {number[]}
 */
function split(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
}

/**
 * Countdown to an authored end datetime, rendered as hours/minutes/seconds tiles.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const { end, labels } = readConfig(block);

  const timer = document.createElement('div');
  timer.className = 'widget-countdown-timer';
  timer.setAttribute('role', 'timer');

  const values = UNITS.map((unit, i) => {
    const tile = document.createElement('div');
    tile.className = `widget-countdown-unit widget-countdown-${unit}`;
    const value = document.createElement('span');
    value.className = 'widget-countdown-value';
    value.textContent = '00';
    const label = document.createElement('span');
    label.className = 'widget-countdown-label';
    label.textContent = labels[i];
    tile.append(value, label);
    timer.append(tile);
    return value;
  });

  block.replaceChildren(timer);

  if (!end) {
    block.classList.add('no-end-date');
    return;
  }
  block.dataset.end = end.toISOString();
  timer.setAttribute('aria-label', `Ends ${end.toLocaleString()}`);

  let intervalId;
  const render = () => {
    const remaining = end.getTime() - Date.now();
    split(remaining).forEach((n, i) => {
      values[i].textContent = String(n).padStart(2, '0');
    });
    if (remaining <= 0) {
      block.classList.add('expired');
      if (intervalId) clearInterval(intervalId);
      return false;
    }
    return true;
  };

  if (render()) intervalId = setInterval(render, 1000);
}
