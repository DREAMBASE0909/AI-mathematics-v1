/* Shared image data and markup for matrix image lessons. */
(() => {
  'use strict';
  const face = [
    [255,170,170,170,170,170,255],
    [170,0,0,0,0,0,170],
    [170,0,255,0,255,0,170],
    [170,0,255,0,255,0,170],
    [170,0,0,0,0,0,170],
    [170,0,85,85,85,0,170],
    [255,170,170,170,170,170,255]
  ].flat();
  const clip = value => Math.max(0, Math.min(255, value));
  function grid(values, size, numbers = false) {
    return `<div class="px-grid ${numbers ? 'px-numbers' : ''}" style="--n:${size}">`
      + values.map(v => `<span style="background:rgb(${v},${v},${v});color:${v < 140 ? '#fff' : '#182730'}">${numbers ? v : ''}</span>`).join('') + '</div>';
  }
  // Precomputed integer brightness mapping for A = 0.4 O.
  const darkValues = { 0: 0, 85: 34, 170: 68, 255: 102 };
  const patterns = Object.freeze({
    left: Object.freeze([1, 0, 1, 0]),
    right: Object.freeze([0, 1, 0, 1]),
    top: Object.freeze([1, 1, 0, 0]),
    white: Object.freeze([1, 1, 1, 1])
  });
  const order = Object.freeze(['1행 1열', '1행 2열', '2행 1열', '2행 2열']);
  const format = value => String(value).replace('-', '−');
  const dot = (row, column) => row.reduce((sum, value, i) => sum + value * column[i], 0);
  function weightMap(values) {
    return '<div class="mi-weights">' + values.map((value, i) => {
      const alpha = Math.abs(value) / 3 * 0.65 + 0.2;
      const color = value > 0 ? `rgba(40,105,200,${alpha})`
        : value < 0 ? `rgba(193,48,53,${alpha})` : '#858c90';
      return `<span style="background:${color}" aria-label="${order[i]} 가중치 ${format(value)}">${format(value)}</span>`;
    }).join('') + '</div>';
  }
  window.MatrixImage = Object.freeze({
    face: Object.freeze(face),
    dark: Object.freeze(face.map(value => darkValues[value])),
    clip, grid, patterns, order, format, dot, weightMap
  });
})();
