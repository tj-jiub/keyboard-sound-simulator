function pickVariantIndex(variantCount, lastIndex) {
  if (variantCount <= 1) return 0;
  let next;
  do {
    next = Math.floor(Math.random() * variantCount);
  } while (next === lastIndex);
  return next;
}

module.exports = { pickVariantIndex };
