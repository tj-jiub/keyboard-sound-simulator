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

// A lowpass tone knob removes energy as it darkens, which reads as the sound
// getting quieter, not just duller. This gives the makeup gain (in dB) needed
// to offset that: 0dB at tone=1 (nothing removed), maxDb at tone=0 (darkest).
function sliderToToneCompensationDb(value, maxDb) {
  const clamped = clamp01(value);
  return (1 - clamped) * maxDb;
}

function dbToGain(db) {
  return 10 ** (db / 20);
}

// Human hearing perceives loudness roughly logarithmically, but the volume
// slider feeds Howler.volume() a raw linear amplitude (0-1). Linear 0.5 is
// only about -6dB, which reads as much quieter than "half as loud" — this
// ease-out curve pushes the middle of the slider louder (0.5 -> 0.75 gain)
// so mid-range positions are actually usable, while 0 stays silent and 1
// stays unchanged.
function sliderToVolumeGain(value) {
  const clamped = clamp01(value);
  return 1 - (1 - clamped) ** 2;
}

module.exports = {
  sliderToDb,
  sliderToLowpassFreq,
  sliderToToneCompensationDb,
  dbToGain,
  sliderToVolumeGain,
};
