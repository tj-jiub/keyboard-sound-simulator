function clamp01(value) {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function sliderToDb(value, maxDb) {
  if (!Number.isFinite(value)) return 0;
  const clamped = Math.min(1, Math.max(0, value));
  return (clamped - 0.5) * 2 * maxDb;
}

// Guitar-style tone knob: 1 = fully open/bright, 0 = dark/muffled.
// Exponential mapping so the sweep feels even across the whole slider range.
function sliderToLowpassFreq(value, minFreq, maxFreq) {
  const clamped = clamp01(value);
  return minFreq * (maxFreq / minFreq) ** clamped;
}

// Response speed knob: 1 = instant, 0 = maximally delayed.
function sliderToDelayMs(value, maxDelayMs) {
  const clamped = clamp01(value);
  return (1 - clamped) * maxDelayMs;
}

module.exports = { sliderToDb, sliderToLowpassFreq, sliderToDelayMs };
