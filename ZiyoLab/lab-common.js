// =====================================================================
// lab-common.js — small helpers shared by the lab pages (and mini-labs).
// Load AFTER script.js and BEFORE the page's own script.
// Only plain functions here, no top-level variables, so nothing can
// clash with the `const`s declared in the page scripts.
// =====================================================================

// Keep a number between min and max.
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Blend two [r, g, b] colours. t = 0 gives c1, t = 1 gives c2.
function mixColor(c1, c2, t) {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Tell the CSS how much of a range slider's track to paint green (--fill).
function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--fill', pct + '%');
}
