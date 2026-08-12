// Loaded inside try/catch (not at top level) to handle environments where
// the native module fails to load.
let uIOhook = null;
try {
  // eslint-disable-next-line global-require
  ({ uIOhook } = require('uiohook-napi'));
} catch (err) {
  console.error('Failed to load uiohook-napi:', err.message);
}
const { createKeyRepeatFilter } = require('./keyRepeatFilter');

// uiohook-napi's keydown fires on every OS auto-repeat while a key stays
// held, with no field to tell a real press apart from a repeat — so we
// track held keycodes ourselves and only forward the first keydown per
// press, clearing it on keyup.
const repeatFilter = createKeyRepeatFilter();

function startKeyHook(onKeyDown, onKeyUp) {
  if (!uIOhook) {
    console.error('Keyboard hook unavailable: uiohook-napi failed to load.');
    return;
  }

  uIOhook.on('keydown', (event) => {
    if (repeatFilter.shouldTrigger(event.keycode)) {
      onKeyDown(event);
    }
  });
  uIOhook.on('keyup', (event) => {
    repeatFilter.release(event.keycode);
    if (onKeyUp) onKeyUp(event);
  });
  try {
    uIOhook.start();
  } catch (err) {
    console.error('uIOhook start failed:', err.message);
  }
}

function stopKeyHook() {
  if (!uIOhook) return;
  try {
    uIOhook.stop();
  } catch (err) {
    console.error('uIOhook stop failed:', err.message);
  }
  repeatFilter.reset();
}

module.exports = { startKeyHook, stopKeyHook };
