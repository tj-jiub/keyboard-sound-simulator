const test = require('node:test');
const assert = require('node:assert/strict');
const { createKeyRepeatFilter } = require('../src/keyRepeatFilter');

test('shouldTrigger returns true for a fresh keydown', () => {
  const filter = createKeyRepeatFilter();
  assert.equal(filter.shouldTrigger(30), true);
});

test('shouldTrigger returns false for repeated keydown while the key is held (OS auto-repeat)', () => {
  const filter = createKeyRepeatFilter();
  filter.shouldTrigger(30);
  assert.equal(filter.shouldTrigger(30), false);
  assert.equal(filter.shouldTrigger(30), false);
});

test('shouldTrigger returns true again after the key is released', () => {
  const filter = createKeyRepeatFilter();
  filter.shouldTrigger(30);
  filter.release(30);
  assert.equal(filter.shouldTrigger(30), true);
});

test('different keycodes are tracked independently', () => {
  const filter = createKeyRepeatFilter();
  assert.equal(filter.shouldTrigger(30), true);
  assert.equal(filter.shouldTrigger(31), true);
  assert.equal(filter.shouldTrigger(30), false);
});

test('release on a keycode that was never pressed is a no-op', () => {
  const filter = createKeyRepeatFilter();
  assert.doesNotThrow(() => filter.release(99));
  assert.equal(filter.shouldTrigger(99), true);
});

test('reset clears all held keycodes', () => {
  const filter = createKeyRepeatFilter();
  filter.shouldTrigger(30);
  filter.shouldTrigger(31);
  filter.reset();
  assert.equal(filter.shouldTrigger(30), true);
  assert.equal(filter.shouldTrigger(31), true);
});
