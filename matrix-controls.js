/* Shared pixel zoom and one-hot column machines. No lesson or storage state. */
(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  function lamps(values, { editable = false, rows, columns, showLabels = false } = {}) {
    const n = values.length;
    const rowNames = rows || Array.from({ length: n }, (_, i) => `${i + 1}행`);
    const colNames = columns || Array.from({ length: n }, (_, i) => `${i + 1}열`);
    let content = '';
    if (showLabels) content += '<span class="mc-axis"></span>' + colNames.map(name => `<b class="mc-axis">${escape(name)}</b>`).join('');
    values.forEach((row, r) => {
      if (showLabels) content += `<b class="mc-axis">${escape(rowNames[r])}</b>`;
      row.forEach((value, c) => {
        const attributes = `class="${value ? 'is-on' : ''}" data-cell="${r * n + c}"`;
        content += editable
          ? `<button type="button" ${attributes} aria-label="기계 ${escape(rowNames[r])} ${escape(colNames[c])}" aria-pressed="${!!value}">${value}</button>`
          : `<span ${attributes}>${value}</span>`;
      });
    });
    return `<div class="flip-lamps${showLabels ? ' mc-labelled' : ''}" style="--machine-size:${n}" aria-label="0과 1로 된 기계">${content}</div>`;
  }
  function machineCard(values, { id = '', title = '기계', ...options } = {}) {
    return `<section class="flip-card" ${id ? `id="${escape(id)}"` : ''}><h4>${escape(title)}</h4>${lamps(values, options)}</section>`;
  }
  function bindMachine(host, values, onChange) {
    const cells = host.querySelectorAll('button[data-cell]');
    function refresh() {
      cells.forEach(button => {
        const i = Number(button.dataset.cell), n = values.length;
        const value = values[Math.floor(i / n)][i % n];
        button.textContent = value;
        button.classList.toggle('is-on', !!value);
        button.setAttribute('aria-pressed', String(!!value));
      });
    }
    cells.forEach(button => {
      button.onclick = () => {
        const n = values.length, index = Number(button.dataset.cell);
        const r = Math.floor(index / n), c = index % n;
        values.forEach((row, i) => { row[c] = Number(i === r); });
        refresh();
        onChange(values);
      };
    });
    refresh();
    return { refresh };
  }
  function bindZoom({ image, button, complete, controller, onComplete }) {
    image.classList.add('matrix-zoom');
    image.classList.toggle('expanded', complete);
    button.disabled = complete;
    button.onclick = () => {
      button.disabled = true;
      image.classList.add('expanded');
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) onComplete();
      else controller.schedule(onComplete, 1200);
    };
  }
  window.MatrixControls = { lamps, machineCard, bindMachine, bindZoom };
})();
