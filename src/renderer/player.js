const { ipcRenderer } = require('electron');
const { pickVariantIndex } = require('../variantPicker');
const {
  sliderToLowpassFreq, sliderToToneCompensationDb, dbToGain, sliderToVolumeGain,
} = require('../audioTone');

const ctx = new AudioContext({
  latencyHint: 'interactive',
  sampleRate: 44100,
});

let currentBuffer = null;
let variants = [];
let releaseVariants = [];
let lastPlayedIndex = null;
let lastPlayedReleaseIndex = null;

// 80Hz floor made the bottom ~25% of the slider effectively silent — a
// keyboard click's audible character lives mostly in 1-8kHz, so a lowpass
// cutoff that low removes nearly all of it instead of just "muffling" it.
// 600Hz keeps a soft thud audible at tone=0 while still reading as clearly
// darker than the fully-open end.
const TONE_MIN_FREQ = 600;
const TONE_MAX_FREQ = 20000;
// A lowpass cuts real energy as it darkens, which reads as quieter, not just
// duller. This is the makeup gain applied at tone=0 to cancel that out, so
// the tone slider only changes character, not overall loudness. A single
// biquad lowpass rolls off at ~12dB/octave, so cutting at 600Hz attenuates
// content around 4-8kHz (where most of a click's energy sits) by 30dB+ —
// 10dB of makeup gain wasn't nearly enough to bring that back to audible.
const TONE_COMPENSATION_MAX_DB = 24;

let pendingTone = 0.5;

// Neutral fallback for packs shipped without a computed `profile` block —
// behaves exactly like today's "skip the EQ chain" pass-through.
const NEUTRAL_PROFILE = {
  preGainDb: 0,
  eq: { cutMudDb: 0, boostBodyDb: 0, smoothHighsDb: 0 },
};

// Per-pack calibrated tonal shaping, replacing the old binary `thocky`
// flag. Every pack now always routes through preGain -> cutMud -> boostBody
// -> smoothHighs -> toneFilter, but each pack's gains are computed (see
// scripts/calibratePack.js docs / packs/*/config.json's `profile` block)
// from that pack's own measured brightness/loudness relative to a reference
// pack, instead of one hand-tuned EQ forced onto every pack alike. A pack
// whose recording is already close to the reference gets near-zero gains
// here (audibly a pass-through); a duller/quieter pack gets more cut/boost.
const preGain = ctx.createGain();
preGain.gain.value = dbToGain(NEUTRAL_PROFILE.preGainDb);

const cutMud = ctx.createBiquadFilter();
cutMud.type = 'peaking';
cutMud.frequency.value = 325;
cutMud.Q.value = 1.2;
cutMud.gain.value = NEUTRAL_PROFILE.eq.cutMudDb;

const boostBody = ctx.createBiquadFilter();
boostBody.type = 'peaking';
boostBody.frequency.value = 600;
boostBody.Q.value = 1.0;
boostBody.gain.value = NEUTRAL_PROFILE.eq.boostBodyDb;

const smoothHighs = ctx.createBiquadFilter();
smoothHighs.type = 'highshelf';
smoothHighs.frequency.value = 6000;
smoothHighs.gain.value = NEUTRAL_PROFILE.eq.smoothHighsDb;

const toneFilter = ctx.createBiquadFilter();
toneFilter.type = 'lowpass';
toneFilter.frequency.value = sliderToLowpassFreq(pendingTone, TONE_MIN_FREQ, TONE_MAX_FREQ);

const toneCompensationGain = ctx.createGain();
toneCompensationGain.gain.value = dbToGain(
  sliderToToneCompensationDb(pendingTone, TONE_COMPENSATION_MAX_DB),
);

// Was threshold=-1dB, ratio=20:1 — a near-brickwall limiter that clamped
// almost the entire transient peak of a click (the peak IS the perceived
// "punch"/loudness for percussive content), making full volume still feel
// quiet. Softened to still guard against clipping without eating the
// transient.
const limiter = ctx.createDynamicsCompressor();
limiter.threshold.value = -6;
limiter.ratio.value = 4;
limiter.attack.value = 0.001;
limiter.release.value = 0.05;

// Flat makeup gain so overall loudness is up across every pack, not just
// the clipped peaks the limiter above already handles.
const boost = ctx.createGain();
boost.gain.value = 1.25;

// Replaces Howler.volume() — driven by the volume slider via sliderToVolumeGain.
const masterVolumeGain = ctx.createGain();
masterVolumeGain.gain.value = sliderToVolumeGain(0.55);

// Final safety net: `boost` + `toneCompensationGain` (up to +24dB at tone=0)
// stack on top of the punchy `limiter` above, and overlapping voices during
// fast typing sum before any of this — measured true peaks over +1dB
// (i.e. actual digital clipping, not just loud) on bright/clicky packs.
// `limiter`'s 1ms attack still lets fast transients punch through before it
// reacts. A tanh soft-clip curve guarantees output never exceeds ±1 (unlike
// the compressor, which only reduces gain, it can't be overshot) and its
// smooth saturation reads as gentle warmth instead of a harsh digital chop.
function makeSoftClipCurve(samples = 1024, drive = 2) {
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = (i / (samples - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}

const softClip = ctx.createWaveShaper();
softClip.curve = makeSoftClipCurve();
softClip.oversample = '4x';

preGain.connect(cutMud);
cutMud.connect(boostBody);
boostBody.connect(smoothHighs);
smoothHighs.connect(toneFilter);
toneFilter.connect(toneCompensationGain);
toneCompensationGain.connect(boost);
boost.connect(limiter);
limiter.connect(masterVolumeGain);
masterVolumeGain.connect(softClip);
softClip.connect(ctx.destination);

ipcRenderer.on('load-pack', (event, payload) => {
  variants = payload.variants;
  lastPlayedIndex = null;
  releaseVariants = payload.releaseVariants || [];
  lastPlayedReleaseIndex = null;
  currentBuffer = null;
  stopAllVoices();

  const profile = payload.profile || NEUTRAL_PROFILE;
  preGain.gain.value = dbToGain(profile.preGainDb || 0);
  cutMud.gain.value = profile.eq?.cutMudDb || 0;
  boostBody.gain.value = profile.eq?.boostBodyDb || 0;
  smoothHighs.gain.value = profile.eq?.smoothHighsDb || 0;

  fetch(payload.soundFilePath)
    .then((res) => res.arrayBuffer())
    .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      currentBuffer = buffer;
    })
    .catch((err) => console.error('[player] failed to load pack', payload.soundFilePath, err));
});

// Subtle per-hit pitch/volume jitter so identical variants don't repeat
// identically back-to-back and start to sound machine-gunned.
const PITCH_JITTER = 0.03;
const VOLUME_JITTER = 0.08;

// Howler's WebAudio sprite playback fades the gain to 0 right before it cuts
// a sprite off, specifically to avoid an audible click/pop — hard-stopping an
// AudioBufferSourceNode mid-waveform (non-zero sample) is a discontinuity
// that reads as a "cut off" glitch. That declick step got lost in the move
// off Howler, and it's most audible on longer clips (Ducky/Leopold/적축) that
// still have real energy at their variant window's end; short percussive
// clips already decay to near-silence before their window ends, so they
// never showed the regression.
const FADE_IN_SEC = 0.001;
const FADE_OUT_SEC = 0.008;
const MAX_FADE_OUT_SEC = 0.03;

// Polyphony cap: fast typing/spam otherwise stacks unlimited overlapping
// voices, which both wastes CPU and builds up perceived loudness. For longer
// clips like 청축/갈축, a hard stop on the oldest voice is the main reason
// the click suddenly feels chopped in the middle of its tail. Instead of
// forcing the source to stop, we reduce its gain over a short fade and keep
// the source alive long enough to decay naturally.
const MAX_VOICES = 32;
const VOICE_STEAL_FADE_SEC = 0.05;
const activeVoices = []; // { source, hitGain }

function fadeAndDropVoice(voice, fadeSec) {
  if (!voice) return;
  const now = ctx.currentTime;
  voice.hitGain.gain.cancelScheduledValues(now);
  voice.hitGain.gain.setValueAtTime(voice.hitGain.gain.value || 0, now);
  voice.hitGain.gain.linearRampToValueAtTime(0, now + fadeSec);
}

function stealOldestVoice() {
  const voice = activeVoices.shift();
  if (!voice) return;
  fadeAndDropVoice(voice, VOICE_STEAL_FADE_SEC);
}

function stopAllVoices() {
  activeVoices.slice().forEach((voice) => fadeAndDropVoice(voice, 0.02));
  activeVoices.length = 0;
}

function playSlice(offsetMs, durationMs) {
  if (!currentBuffer) return;
  if (activeVoices.length >= MAX_VOICES) stealOldestVoice();

  const rate = 1 + (Math.random() * 2 - 1) * PITCH_JITTER;
  const overlapPenalty = Math.max(0.5, 1 - activeVoices.length * 0.05);
  const peakGain = ((1 - Math.random() * VOLUME_JITTER) * overlapPenalty) * 0.7;
  const requestedDurationSec = Math.max(durationMs / 1000, 0.05);
  const startOffsetSec = offsetMs / 1000;
  const remainingSec = Math.max(0.01, currentBuffer.duration - startOffsetSec);
  const sliceDurationSec = Math.min(requestedDurationSec, remainingSec);
  const fadeOutSec = Math.min(MAX_FADE_OUT_SEC, Math.max(FADE_OUT_SEC, sliceDurationSec * 0.35));
  const fadeInSec = Math.min(FADE_IN_SEC, sliceDurationSec / 3);
  const startAt = ctx.currentTime;
  const fadeOutStartAt = startAt + Math.max(0.02, sliceDurationSec - fadeOutSec);
  const naturalEndAt = startAt + sliceDurationSec;

  if (ctx.state === 'suspended') {
    ctx.resume().catch((err) => console.error('[player] failed to resume audio context', err));
  }

  const source = ctx.createBufferSource();
  source.buffer = currentBuffer;
  source.playbackRate.value = rate;

  const hitGain = ctx.createGain();
  hitGain.gain.setValueAtTime(0, startAt);
  hitGain.gain.linearRampToValueAtTime(peakGain, startAt + fadeInSec);
  hitGain.gain.setValueAtTime(peakGain, fadeOutStartAt);
  hitGain.gain.linearRampToValueAtTime(0, startAt + sliceDurationSec);

  source.connect(hitGain);
  hitGain.connect(preGain);
  source.start(startAt, startOffsetSec, sliceDurationSec);

  const voice = { source, hitGain };
  activeVoices.push(voice);
  source.onended = () => {
    const idx = activeVoices.indexOf(voice);
    if (idx !== -1) activeVoices.splice(idx, 1);
  };
}

ipcRenderer.on('trigger-key', (event, { sentAt }) => {
  if (!currentBuffer || variants.length === 0) return;
  const index = pickVariantIndex(variants.length, lastPlayedIndex);
  lastPlayedIndex = index;
  const [offsetMs, durationMs] = variants[index];
  playSlice(offsetMs, durationMs);
  if (sentAt) ipcRenderer.send('key-latency-debug', Date.now() - sentAt);
});

ipcRenderer.on('trigger-key-release', () => {
  if (!currentBuffer || releaseVariants.length === 0) return;
  const index = pickVariantIndex(releaseVariants.length, lastPlayedReleaseIndex);
  lastPlayedReleaseIndex = index;
  const [offsetMs, durationMs] = releaseVariants[index];
  playSlice(offsetMs, durationMs);
});

ipcRenderer.on('set-volume', (event, volume) => {
  masterVolumeGain.gain.value = sliderToVolumeGain(volume);
});

ipcRenderer.on('set-tone', (event, tone) => {
  pendingTone = tone;
  toneFilter.frequency.value = sliderToLowpassFreq(tone, TONE_MIN_FREQ, TONE_MAX_FREQ);
  toneCompensationGain.gain.value = dbToGain(
    sliderToToneCompensationDb(tone, TONE_COMPENSATION_MAX_DB),
  );
});
