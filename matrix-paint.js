/* Pointer and keyboard painting shared by the image and stencil lessons. */
(() => {
  'use strict';
  function bind(board, { size, paint, canPaint = () => true }) {
    let dragging = false, last = null;
    function apply(index) {
      const cell = board.querySelector(`[data-pixel="${index}"]`);
      if (cell && !cell.disabled && canPaint(index)) paint(index);
    }
    function stroke(index) {
      if (last === null) apply(index);
      else {
        const r = Math.floor(last / size), c = last % size;
        const dr = Math.floor(index / size) - r, dc = index % size - c;
        const count = Math.max(Math.abs(dr), Math.abs(dc));
        for (let n = 1; n <= count; n++) {
          apply(Math.round(r + dr * n / count) * size + Math.round(c + dc * n / count));
        }
      }
      last = index;
    }
    board.querySelectorAll('[data-pixel]').forEach(cell => {
      cell.onclick = event => { if (event.detail === 0) apply(Number(cell.dataset.pixel)); };
    });
    board.onpointerdown = event => {
      const cell = event.target.closest('[data-pixel]');
      if (!cell || cell.disabled || !canPaint(Number(cell.dataset.pixel))) return;
      event.preventDefault();
      dragging = true;
      last = null;
      board.setPointerCapture(event.pointerId);
      stroke(Number(cell.dataset.pixel));
    };
    board.onpointermove = event => {
      if (!dragging) return;
      const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-pixel]');
      if (cell && board.contains(cell)) stroke(Number(cell.dataset.pixel));
    };
    board.onpointerup = board.onpointercancel = board.onlostpointercapture = () => {
      dragging = false;
      last = null;
    };
  }
  window.MatrixPaint = { bind };
})();
