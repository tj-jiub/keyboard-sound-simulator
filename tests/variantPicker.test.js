const test = require('node:test');
const assert = require('node:assert/strict');
const { pickVariantIndex } = require('../src/variantPicker');

test('pickVariantIndex always returns 0 when there is only one variant', () => {
  assert.equal(pickVariantIndex(1, null), 0);
  assert.equal(pickVariantIndex(1, 0), 0);
});

test('pickVariantIndex never returns the same index twice in a row', () => {
  let last = 0;
  for (let i = 0; i < 200; i++) {
    const next = pickVariantIndex(4, last);
    assert.notEqual(next, last);
    assert.ok(next >= 0 && next < 4);
    last = next;
  }
});

test('pickVariantIndex eventually returns every index (no permanent bias)', () => {
  const seen = new Set();
  let last = null;
  for (let i = 0; i < 500; i++) {
    const next = pickVariantIndex(5, last);
    seen.add(next);
    last = next;
  }
  assert.equal(seen.size, 5);
});

test('pickVariantIndex accepts null lastIndex (first call)', () => {
  const next = pickVariantIndex(3, null);
  assert.ok(next >= 0 && next < 3);
});
