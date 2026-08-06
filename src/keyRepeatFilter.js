function createKeyRepeatFilter() {
  const heldKeycodes = new Set();

  return {
    shouldTrigger(keycode) {
      if (heldKeycodes.has(keycode)) return false;
      heldKeycodes.add(keycode);
      return true;
    },
    release(keycode) {
      heldKeycodes.delete(keycode);
    },
    reset() {
      heldKeycodes.clear();
    },
  };
}

module.exports = { createKeyRepeatFilter };
