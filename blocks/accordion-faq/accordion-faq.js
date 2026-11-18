/**
 * FAQ accordion built on native details/summary.
 * Row: [question] [answer]. A single-cell row uses its first element as the
 * question and the rest as the answer; empty rows are dropped.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const items = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture'));
    if (!cells.length) return;

    let label;
    let body;
    if (cells.length > 1) {
      [label, ...body] = cells;
    } else {
      const [only] = cells;
      const first = only.firstElementChild;
      if (first && only.children.length > 1) {
        label = document.createElement('div');
        label.append(first);
        body = [only];
      } else {
        label = only;
        body = [];
      }
    }

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    // unwrap a lone heading/paragraph so the summary holds inline text
    const lone = label.children.length === 1 ? label.firstElementChild : null;
    if (lone && /^(P|H[1-6])$/.test(lone.tagName)) summary.append(...lone.childNodes);
    else summary.append(...label.childNodes);

    const content = document.createElement('div');
    content.className = 'accordion-faq-item-body';
    body.forEach((cell) => content.append(...cell.childNodes));

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, content);
    if (!content.textContent.trim() && !content.querySelector('picture')) details.classList.add('empty');
    items.push(details);
  });
  block.replaceChildren(...items);
}
