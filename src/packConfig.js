const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Howler loads sources via XMLHttpRequest, which requires a valid URL —
// a raw Windows path like "C:\Users\...\sound.wav" is not one (backslashes
// aren't valid URL separators), so XHR silently fails to load the audio
// and nothing plays. Convert to a proper file:// URL before sending it
// to the renderer.
function toFileUrl(absolutePath) {
  return pathToFileURL(absolutePath).href;
}

function loadPackConfig(packDir) {
  const configPath = path.join(packDir, 'config.json');
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (!Array.isArray(raw.variants) || raw.variants.length === 0) {
    throw new Error(`Pack config at ${configPath} must have a non-empty "variants" array`);
  }

  return {
    id: raw.id,
    name: raw.name,
    soundFilePath: path.join(packDir, raw.sound),
    variants: raw.variants,
  };
}

function normalizePackCategory(rawCategory) {
  return rawCategory === 'brand' ? 'brand' : 'switch';
}

module.exports = { loadPackConfig, toFileUrl, normalizePackCategory };
