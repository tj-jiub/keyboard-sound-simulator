const { uIOhook } = require('uiohook-napi');
const { createKeyRepeatFilter } = require('./keyRepeatFilter');

// uiohook-napi's keydown fires on every OS auto-repeat while a key stays
// held, with no field to tell a real press apart from a repeat — so we
// track held keycodes ourselves and only forward the first keydown per
// press, clearing it on keyup.
const repeatFilter = createKeyRepeatFilter();

function startKeyHook(onKeyDown) {
  uIOhook.on('keydown', (event) => {
    if (repeatFilter.shouldTrigger(event.keycode)) {
      onKeyDown(event);
    }
  });
  uIOhook.on('keyup', (event) => {
    repeatFilter.release(event.keycode);
  });
  uIOhook.start();
}

function stopKeyHook() {
  uIOhook.stop();
  repeatFilter.reset();
}

module.exports = { startKeyHook, stopKeyHook };
