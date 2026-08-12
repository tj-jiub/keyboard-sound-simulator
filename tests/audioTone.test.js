const test = require('node:test');
const assert = require('node:assert/strict');
const {
  sliderToDb, sliderToLowpassFreq, sliderToToneCompensationDb, dbToGain,
  sliderToVolumeGain,
} = require('../src/audioTone');

test('sliderToDb maps 0.5 to 0dB regardless of maxDb', () => {
  assert.equal(sliderToDb(0.5, 12), 0);
  assert.equal(sliderToDb(0.5, 6), 0);
});

test('sliderToDb maps 0 to -maxDb and 1 to +maxDb', () => {
  assert.equal(sliderToDb(0, 12), -12);
  assert.equal(sliderToDb(1, 12), 12);
});

test('sliderToDb clamps out-of-range values', () => {
  assert.equal(sliderToDb(-0.5, 12), -12);
  assert.equal(sliderToDb(1.5, 12), 12);
});

test('sliderToDb scales linearly between the endpoints', () => {
  assert.equal(sliderToDb(0.75, 12), 6);
  assert.equal(sliderToDb(0.25, 12), -6);
});

test('sliderToDb returns 0 for non-finite input instead of NaN', () => {
  assert.equal(sliderToDb(NaN, 12), 0);
  assert.equal(sliderToDb(Infinity, 12), 0);
});

test('sliderToLowpassFreq maps 0 to minFreq and 1 to maxFreq', () => {
  assert.equal(sliderToLowpassFreq(0, 300, 20000), 300);
  assert.equal(sliderToLowpassFreq(1, 300, 20000), 20000);
});

test('sliderToLowpassFreq clamps out-of-range values', () => {
  assert.equal(sliderToLowpassFreq(-1, 300, 20000), 300);
  assert.equal(sliderToLowpassFreq(2, 300, 20000), 20000);
});

test('sliderToLowpassFreq is monotonically increasing', () => {
  const low = sliderToLowpassFreq(0.25, 300, 20000);
  const mid = sliderToLowpassFreq(0.5, 300, 20000);
  const high = sliderToLowpassFreq(0.75, 300, 20000);
  assert.ok(low < mid);
  assert.ok(mid < high);
});

test('sliderToToneCompensationDb is 0 at tone=1 and maxDb at tone=0', () => {
  assert.equal(sliderToToneCompensationDb(1, 10), 0);
  assert.equal(sliderToToneCompensationDb(0, 10), 10);
});

test('sliderToToneCompensationDb clamps out-of-range values', () => {
  assert.equal(sliderToToneCompensationDb(-1, 10), 10);
  assert.equal(sliderToToneCompensationDb(2, 10), 0);
});

test('dbToGain maps 0dB to unity gain', () => {
  assert.equal(dbToGain(0), 1);
});

test('dbToGain doubles amplitude roughly every +6dB', () => {
  assert.ok(Math.abs(dbToGain(6) - 2) < 0.01);
});

test('sliderToVolumeGain preserves silence at 0 and unity at 1', () => {
  assert.equal(sliderToVolumeGain(0), 0);
  assert.equal(sliderToVolumeGain(1), 1);
});

test('sliderToVolumeGain boosts the midpoint above raw linear', () => {
  assert.equal(sliderToVolumeGain(0.5), 0.75);
});

test('sliderToVolumeGain clamps out-of-range values', () => {
  assert.equal(sliderToVolumeGain(-1), 0);
  assert.equal(sliderToVolumeGain(2), 1);
});

test('sliderToVolumeGain is monotonically increasing', () => {
  const low = sliderToVolumeGain(0.25);
  const mid = sliderToVolumeGain(0.5);
  const high = sliderToVolumeGain(0.75);
  assert.ok(low < mid);
  assert.ok(mid < high);
});
