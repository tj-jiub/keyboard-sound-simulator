const test = require('node:test');
const assert = require('node:assert/strict');
const { computeVariantOffsets, DEFAULT_GAP_MS } = require('../scripts/buildPackAudio');

test('computeVariantOffsets lays out clips sequentially with a fixed gap between them', () => {
  const offsets = computeVariantOffsets([60, 80, 55], 50);
  assert.deepEqual(offsets, [[0, 60], [110, 80], [240, 55]]);
});

test('computeVariantOffsets with a single clip starts at 0', () => {
  assert.deepEqual(computeVariantOffsets([100], 50), [[0, 100]]);
});

test('computeVariantOffsets throws on an empty clip list', () => {
  assert.throws(() => computeVariantOffsets([], 50), /at least one clip/);
});

test('DEFAULT_GAP_MS is 50', () => {
  assert.equal(DEFAULT_GAP_MS, 50);
});
