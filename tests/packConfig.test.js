const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadPackConfig, toFileUrl, normalizePackCategory } = require('../src/packConfig');

function makeTempPack(configObj) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-test-'));
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(configObj));
  return dir;
}

test('loadPackConfig parses variants and resolves an absolute sound path', () => {
  const dir = makeTempPack({
    id: 'test-pack',
    name: 'Test Pack',
    sound: 'sound.wav',
    variants: [[0, 60], [80, 65]],
  });
  const pack = loadPackConfig(dir);
  assert.equal(pack.id, 'test-pack');
  assert.equal(pack.name, 'Test Pack');
  assert.equal(pack.soundFilePath, path.join(dir, 'sound.wav'));
  assert.deepEqual(pack.variants, [[0, 60], [80, 65]]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadPackConfig returns null releaseVariants when the pack has none', () => {
  const dir = makeTempPack({
    id: 'test-pack', name: 'Test Pack', sound: 'sound.wav', variants: [[0, 60]],
  });
  const pack = loadPackConfig(dir);
  assert.equal(pack.releaseVariants, null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadPackConfig returns releaseVariants when the pack has them', () => {
  const dir = makeTempPack({
    id: 'test-pack',
    name: 'Test Pack',
    sound: 'sound.wav',
    variants: [[0, 60]],
    releaseVariants: [[106, 37]],
  });
  const pack = loadPackConfig(dir);
  assert.deepEqual(pack.releaseVariants, [[106, 37]]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadPackConfig returns thocky: true only when the config explicitly sets it', () => {
  const dir = makeTempPack({
    id: 'test-pack', name: 'Test Pack', sound: 'sound.wav', variants: [[0, 60]], thocky: true,
  });
  const pack = loadPackConfig(dir);
  assert.equal(pack.thocky, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadPackConfig defaults thocky to false when missing or not literally true', () => {
  const dirMissing = makeTempPack({
    id: 'test-pack', name: 'Test Pack', sound: 'sound.wav', variants: [[0, 60]],
  });
  assert.equal(loadPackConfig(dirMissing).thocky, false);
  fs.rmSync(dirMissing, { recursive: true, force: true });

  const dirTruthy = makeTempPack({
    id: 'test-pack', name: 'Test Pack', sound: 'sound.wav', variants: [[0, 60]], thocky: 'yes',
  });
  assert.equal(loadPackConfig(dirTruthy).thocky, false);
  fs.rmSync(dirTruthy, { recursive: true, force: true });
});

test('loadPackConfig throws if variants is missing or empty', () => {
  const dir = makeTempPack({ id: 'x', name: 'x', sound: 'x.wav', variants: [] });
  assert.throws(() => loadPackConfig(dir), /non-empty "variants" array/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('loadPackConfig throws if config.json is missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-test-empty-'));
  assert.throws(() => loadPackConfig(dir));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('toFileUrl converts an absolute Windows path into a loadable file:// URL', () => {
  const absolutePath = path.join('C:', 'Users', 'test', 'sound.wav');
  const url = toFileUrl(absolutePath);
  assert.match(url, /^file:\/\//);
  assert.doesNotMatch(url, /\\/);
});

test('normalizePackCategory returns "brand" only for the literal value "brand"', () => {
  assert.equal(normalizePackCategory('brand'), 'brand');
});

test('normalizePackCategory defaults to "switch" for "switch", missing, or unrecognized values', () => {
  assert.equal(normalizePackCategory('switch'), 'switch');
  assert.equal(normalizePackCategory(undefined), 'switch');
  assert.equal(normalizePackCategory(null), 'switch');
  assert.equal(normalizePackCategory('typo'), 'switch');
});
