const { ipcRenderer } = require('electron');
// The .js extension below is required, not stylistic — see the explanation further
// down: this specific build file (not the package's default export) must be targeted.
// eslint-disable-next-line import/extensions
const { Howl, Howler } = require('howler/dist/howler.core.min.js');
const { pickVariantIndex } = require('../variantPicker');
const { sliderToLowpassFreq, sliderToDelayMs } = require('../audioTone');
// howler's default entry (dist/howler.js) bundles the spatial-audio plugin as a
// second top-level IIFE that references Howl/HowlerGlobal as bare identifiers,
// expecting them to resolve off the page's real global object. Electron's
// nodeIntegration renderer exposes a separate Node-compat `global` object that
// is NOT the same as that real global, so howler's UMD footer writes Howl/Howler
// onto the wrong one and the bare references throw "Howl is not defined". The
// core build has no spatial plugin (unused here anyway) and no such dependency.
Howler.autoSuspend = false;

let currentHowl = null;
let variantCount = 0;
let lastPlayedIndex = null;

const TONE_MIN_FREQ = 80;
const TONE_MAX_FREQ = 20000;
const MAX_RESPONSE_DELAY_MS = 400;

let toneFilter = null;
let pendingTone = 0.5;
let pendingResponseSpeed = 1;

function ensureAudioGraph() {
  if (toneFilter || !Howler.ctx) return;
  toneFilter = Howler.ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = sliderToLowpassFreq(pendingTone, TONE_MIN_FREQ, TONE_MAX_FREQ);

  const limiter = Howler.ctx.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;

  Howler.masterGain.disconnect();
  Howler.masterGain.connect(toneFilter);
  toneFilter.connect(limiter);
  limiter.connect(Howler.ctx.destination);
}

ipcRenderer.on('load-pack', (event, { soundFilePath, variants }) => {
  if (currentHowl) {
    currentHowl.unload();
  }
  variantCount = variants.length;
  lastPlayedIndex = null;
  const sprite = {};
  variants.forEach((offset, index) => {
    sprite[`v${index}`] = offset;
  });
  currentHowl = new Howl({
    src: [soundFilePath],
    sprite,
  });
  currentHowl.on('loaderror', (id, err) => console.error('[player] loaderror', soundFilePath, err));
  currentHowl.on('playerror', (id, err) => console.error('[player] playerror', err));
  ensureAudioGraph();
});

ipcRenderer.on('trigger-key', () => {
  if (!currentHowl || variantCount === 0) return;
  const index = pickVariantIndex(variantCount, lastPlayedIndex);
  lastPlayedIndex = index;
  const howl = currentHowl;
  const delayMs = sliderToDelayMs(pendingResponseSpeed, MAX_RESPONSE_DELAY_MS);
  if (delayMs <= 0) {
    howl.play(`v${index}`);
  } else {
    setTimeout(() => howl.play(`v${index}`), delayMs);
  }
});

ipcRenderer.on('set-volume', (event, volume) => {
  Howler.volume(volume);
});

ipcRenderer.on('set-tone', (event, tone) => {
  pendingTone = tone;
  if (toneFilter) {
    toneFilter.frequency.value = sliderToLowpassFreq(tone, TONE_MIN_FREQ, TONE_MAX_FREQ);
  }
});

ipcRenderer.on('set-response-speed', (event, speed) => {
  pendingResponseSpeed = speed;
});
