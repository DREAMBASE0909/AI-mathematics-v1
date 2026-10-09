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
  window.MatrixImage = Object.freeze({
    face: Object.freeze(face),
    dark: Object.freeze(face.map(value => darkValues[value])),
    clip, grid
  });
})();
