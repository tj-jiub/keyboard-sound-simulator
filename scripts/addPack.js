const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { computeVariantOffsets, DEFAULT_GAP_MS } = require('./buildPackAudio');

const RAW_AUDIO_DIR = path.join(__dirname, '..', 'raw-audio');
const PACKS_DIR = path.join(__dirname, '..', 'packs');
const SILENCE_GAP_SECONDS = DEFAULT_GAP_MS / 1000;

function ffprobeDurationMs(filePath) {
  const out = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ]).toString().trim();
  return Math.round(Number(out) * 1000);
}

function ensureSilenceClip(rawDir) {
  const silencePath = path.join(rawDir, 'silence.wav');
  if (!fs.existsSync(silencePath)) {
    execFileSync('ffmpeg', [
      '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
      '-t', String(SILENCE_GAP_SECONDS),
      '-y', silencePath,
    ]);
  }
  return silencePath;
}

function buildPack(packId) {
  const rawDir = path.join(RAW_AUDIO_DIR, packId);
  const clipsDir = path.join(rawDir, 'clips');
  if (!fs.existsSync(clipsDir)) {
    throw new Error(`No clips found — add raw-audio/${packId}/clips/*.wav first`);
  }
  const clipFiles = fs.readdirSync(clipsDir)
    .filter((file) => file.toLowerCase().endsWith('.wav'))
    .sort();
  if (clipFiles.length === 0) {
    throw new Error(`raw-audio/${packId}/clips has no .wav files`);
  }

  ensureSilenceClip(rawDir);
  const concatListPath = path.join(rawDir, 'concat.txt');
  const concatLines = [];
  clipFiles.forEach((file, index) => {
    concatLines.push(`file 'clips/${file}'`);
    if (index < clipFiles.length - 1) concatLines.push("file 'silence.wav'");
  });
  fs.writeFileSync(concatListPath, concatLines.join('\n'));

  const packDir = path.join(PACKS_DIR, packId);
  fs.mkdirSync(packDir, { recursive: true });
  const soundPath = path.join(packDir, 'sound.wav');
  execFileSync('ffmpeg', [
    '-f', 'concat', '-safe', '0', '-i', concatListPath, '-c', 'copy', '-y', soundPath,
  ], { cwd: rawDir });

  const clipDurationsMs = clipFiles.map((file) => ffprobeDurationMs(path.join(clipsDir, file)));
  const variants = computeVariantOffsets(clipDurationsMs, DEFAULT_GAP_MS);

  const configPath = path.join(packDir, 'config.json');
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const config = {
    id: existing.id || packId,
    name: existing.name || packId,
    sound: 'sound.wav',
    variants,
    category: existing.category || 'switch',
    ...(existing.license ? { license: existing.license } : {}),
    ...(existing.attribution ? { attribution: existing.attribution } : {}),
  };
  const variantsInline = `[${variants.map((pair) => `[${pair[0]}, ${pair[1]}]`).join(', ')}]`;
  const body = JSON.stringify({ ...config, variants: '__VARIANTS__' }, null, 2)
    .replace('"__VARIANTS__"', variantsInline);
  fs.writeFileSync(configPath, `${body}\n`);

  console.log(`"${packId}": ${clipFiles.length}개 클립 -> ${path.relative(process.cwd(), configPath)}`);
  if (!existing.name) {
    console.log('  (name/license/attribution 값을 config.json에서 직접 채워주세요)');
  }
}

const packId = process.argv[2];
if (!packId) {
  console.error('사용법: node scripts/addPack.js <packId>');
  console.error('  raw-audio/<packId>/clips/ 안에 개별 타건음 wav 파일들을 넣고 실행하세요.');
  process.exit(1);
}

try {
  buildPack(packId);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
