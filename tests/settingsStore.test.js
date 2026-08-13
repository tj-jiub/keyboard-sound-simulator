const test = require('node:test');
const assert = require('node:assert/strict');
const { createSettingsStore, resolveInitialPackId } = require('../src/settingsStore');

function createMockStore() {
  const data = new Map();
  return {
    get(key, defaultValue) {
      return data.has(key) ? data.get(key) : defaultValue;
    },
    set(key, value) {
      data.set(key, value);
    },
  };
}

test('getCurrentPackId returns null by default', () => {
  const settings = createSettingsStore(createMockStore());
  assert.equal(settings.getCurrentPackId(), null);
});

test('setCurrentPackId/getCurrentPackId round-trip', () => {
  const settings = createSettingsStore(createMockStore());
  settings.setCurrentPackId('청축');
  assert.equal(settings.getCurrentPackId(), '청축');
});

test('isMuted defaults to false', () => {
  const settings = createSettingsStore(createMockStore());
  assert.equal(settings.isMuted(), false);
});

test('setMuted/isMuted round-trip', () => {
  const settings = createSettingsStore(createMockStore());
  settings.setMuted(true);
  assert.equal(settings.isMuted(), true);
});

test('toggleMuted flips and returns the new state', () => {
  const settings = createSettingsStore(createMockStore());
  assert.equal(settings.toggleMuted(), true);
  assert.equal(settings.isMuted(), true);
  assert.equal(settings.toggleMuted(), false);
  assert.equal(settings.isMuted(), false);
});

test('resolveInitialPackId keeps the stored id if it is still available', () => {
  assert.equal(resolveInitialPackId(['청축', '갈축'], '갈축'), '갈축');
});

test('resolveInitialPackId falls back to the first available pack if stored id is missing/stale', () => {
  assert.equal(resolveInitialPackId(['청축', '갈축'], null), '청축');
  assert.equal(resolveInitialPackId(['청축', '갈축'], 'deleted-pack'), '청축');
});

test('resolveInitialPackId returns null when no packs are available', () => {
  assert.equal(resolveInitialPackId([], 'anything'), null);
  assert.equal(resolveInitialPackId([], null), null);
});

test('getVolume defaults to 0.8', () => {
  const settings = createSettingsStore(createMockStore());
  assert.equal(settings.getVolume(), 0.8);
});

test('setVolume/getVolume round-trip', () => {
  const settings = createSettingsStore(createMockStore());
  settings.setVolume(0.3);
  assert.equal(settings.getVolume(), 0.3);
});

test('getTone defaults to 0.5', () => {
  const settings = createSettingsStore(createMockStore());
  assert.equal(settings.getTone(), 0.5);
});

test('setTone/getTone round-trip', () => {
  const settings = createSettingsStore(createMockStore());
  settings.setTone(0.2);
  assert.equal(settings.getTone(), 0.2);
});

test('getPlaybackMode defaults to press-release', () => {
  const settings = createSettingsStore(createMockStore());
  assert.equal(settings.getPlaybackMode(), 'press-release');
});

test('setPlaybackMode/getPlaybackMode round-trip', () => {
  const settings = createSettingsStore(createMockStore());
  settings.setPlaybackMode('press-only');
  assert.equal(settings.getPlaybackMode(), 'press-only');
});
