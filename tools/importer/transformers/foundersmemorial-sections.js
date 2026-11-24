/* eslint-disable */
/* global WebImporter */

/**
 * Section transformer for foundersmemorial.gov.sg.
 * beforeTransform: insert <hr> section breaks (styled ones marked) while the
 *   section elements still exist (parsers run between hooks and replace nodes).
 * afterTransform: add Section Metadata blocks after the marked breaks.
 */

const MARKER = 'data-excat-section-id';

/** querySelector with a manual fallback for "A:has(B)" if :has is unsupported. */
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

export default function transform(hookName, element, payload) {
  const document = element.ownerDocument || payload.document;
  const sections = payload && payload.template && payload.template.sections;
  if (!sections || sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(document, section);
      if (!el) continue;
      if (i > 0 || section.style) {
        const hr = document.createElement('hr');
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.before(hr);
      }
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const meta = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
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
    // Safety: no stray markers left behind
    document.querySelectorAll(`[${MARKER}]`).forEach((n) => n.removeAttribute(MARKER));
  }
}
