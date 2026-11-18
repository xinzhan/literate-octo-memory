/* eslint-disable */
/* global WebImporter */

/**
 * Singtel sections transformer.
 *
 * beforeTransform: resolve each template section element (selectors tried in
 * order), then walking in reverse insert an <hr> before every non-first
 * section. Styled sections get a temporary data-excat-section-id marker on
 * their <hr>. A styled first section gets a temporary marked <hr> too.
 *
 * afterTransform: walking in reverse, add a Section Metadata block (style) at
 * the end of each styled section (just before the next <hr>), drop the
 * marker attribute, and remove the first section's temporary <hr>.
 */

const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // unsupported selector in this runtime; try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!sections || sections.length < 2) return;
  const document = element.ownerDocument || payload.document;

  if (hookName === 'beforeTransform') {
    const resolved = sections.map((s) => findSectionElement(element, s));
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = resolved[i];
      if (!el || !el.parentNode) continue;
      const isFirst = i === 0;
      if (isFirst && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const meta = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });

      if (marker) {
        // Place metadata at the end of the section: before the next <hr>
        // sibling, or at the end of the parent.
        let next = marker.nextElementSibling;
        while (next && next.tagName !== 'HR') next = next.nextElementSibling;
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
    // Clean up any stray markers.
    element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => hr.removeAttribute(MARKER));
  }
}
