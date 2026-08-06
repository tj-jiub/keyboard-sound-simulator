const DEFAULT_GAP_MS = 50;

function computeVariantOffsets(clipDurationsMs, gapMs) {
  if (clipDurationsMs.length === 0) {
    throw new Error('computeVariantOffsets requires at least one clip');
  }
  let cursor = 0;
  const offsets = [];
  for (const durationMs of clipDurationsMs) {
    offsets.push([cursor, durationMs]);
    cursor += durationMs + gapMs;
  }
  return offsets;
}

module.exports = { computeVariantOffsets, DEFAULT_GAP_MS };
