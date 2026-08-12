function createKeyRepeatFilter() {
  const heldKeycodes = new Set();
  const heldTimeouts = new Map();
  const MAX_HOLD_MS = 5000;

  return {
    shouldTrigger(keycode) {
      if (heldKeycodes.has(keycode)) return false;
      heldKeycodes.add(keycode);
      if (heldTimeouts.has(keycode)) {
        clearTimeout(heldTimeouts.get(keycode));
      }
      heldTimeouts.set(keycode, setTimeout(() => {
        heldKeycodes.delete(keycode);
        heldTimeouts.delete(keycode);
      }, MAX_HOLD_MS));
      return true;
    },
    release(keycode) {
      heldKeycodes.delete(keycode);
      if (heldTimeouts.has(keycode)) {
        clearTimeout(heldTimeouts.get(keycode));
        heldTimeouts.delete(keycode);
      }
    },
    reset() {
      heldKeycodes.clear();
      Array.from(heldTimeouts.values()).forEach((timeout) => clearTimeout(timeout));
      heldTimeouts.clear();
    },
  };
}

module.exports = { createKeyRepeatFilter };
