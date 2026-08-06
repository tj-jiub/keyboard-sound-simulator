const test = require('node:test');
const assert = require('node:assert/strict');
const { sliderToDb, sliderToLowpassFreq, sliderToDelayMs } = require('../src/audioTone');

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

test('sliderToDelayMs maps 1 to 0ms and 0 to maxDelayMs', () => {
  assert.equal(sliderToDelayMs(1, 200), 0);
  assert.equal(sliderToDelayMs(0, 200), 200);
});

test('sliderToDelayMs clamps out-of-range values', () => {
  assert.equal(sliderToDelayMs(-1, 200), 200);
  assert.equal(sliderToDelayMs(2, 200), 0);
});
