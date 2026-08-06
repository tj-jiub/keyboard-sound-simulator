const test = require('node:test');
const assert = require('node:assert/strict');
const { startKeyHook, stopKeyHook } = require('../src/keyHook');

test('startKeyHook/stopKeyHook do not throw', () => {
  assert.doesNotThrow(() => {
    startKeyHook(() => {});
  });
  assert.doesNotThrow(() => {
    stopKeyHook();
  });
});
