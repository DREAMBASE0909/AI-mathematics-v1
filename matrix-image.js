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
  function colorGrid(pixels, cols, showNumbers = false) {
    return `<div class="color-grid" style="--cols:${cols}">` + pixels.map(pixel => {
      const values = pixel.map(value => Math.round(clip(value)));
      const light = values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
      return `<span style="background:rgb(${values.join(',')});color:${light < 140 ? '#fff' : '#182730'}" aria-label="RGB ${values.join(', ')}">`
        + (showNumbers ? `[${values.join('<br>')}]` : '') + '</span>';
    }).join('') + '</div>';
  }
  const colorFace = face.map((value, i) => Object.freeze(
    [0, 6, 42, 48].includes(i) ? [255, 255, 255]
      : value === 170 ? [180, 200, 220]
      : value === 0 ? [20, 30, 60] : [0, 255, 255]));
  // Precomputed integer brightness mapping for A = 0.4 O.
  const darkValues = { 0: 0, 85: 34, 170: 68, 255: 102 };
  const order = (size = 2) => Array.from({ length: size * size }, (_, i) =>
    `${Math.floor(i / size) + 1}행 ${i % size + 1}열`);
  // Matrix arithmetic uses row arrays; image markup continues to use flat values.
  function identity(n) {
    if (!Number.isInteger(n) || n < 1) throw new RangeError('Invalid matrix size');
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => Number(r === c)));
  }
  function flip(n) {
    return identity(n).map(row => row.reverse());
  }
  function multiply(left, right) {
    const valid = matrix => Array.isArray(matrix) && matrix.length > 0
      && Array.isArray(matrix[0]) && matrix[0].length > 0
      && matrix.every(row => Array.isArray(row) && row.length === matrix[0].length
        && row.every(Number.isFinite));
    if (!valid(left) || !valid(right) || left[0].length !== right.length) {
      throw new RangeError('Incompatible matrix dimensions');
    }
    return left.map(row => right[0].map((_, c) =>
      row.reduce((sum, value, k) => sum + value * right[k][c], 0)));
  }
  const format = value => String(value).replace('-', '−');
  const dot = (row, column) => row.reduce((sum, value, i) => sum + value * column[i], 0);
  function weightMap(values, size = 2) {
    const labels = order(size);
    return `<div class="mi-weights" style="grid-template-columns:repeat(${size},1fr)">` + values.map((value, i) => {
      const alpha = Math.abs(value) / 3 * 0.65 + 0.2;
      const color = value > 0 ? `rgba(40,105,200,${alpha})`
        : value < 0 ? `rgba(193,48,53,${alpha})` : '#858c90';
      return `<span style="background:${color};color:${Math.abs(value) >= 3 || value === 0 ? '#fff' : '#132333'}" aria-label="${labels[i]} 가중치 ${format(value)}">${format(value)}</span>`;
    }).join('') + '</div>';
  }
  window.MatrixImage = Object.freeze({
    face: Object.freeze(face),
    dark: Object.freeze(face.map(value => darkValues[value])),
    colorFace: Object.freeze(colorFace),
    clip, grid, colorGrid, order, format, dot, weightMap, identity, flip, multiply
  });
})();
