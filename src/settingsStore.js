function createSettingsStore(store) {
  const api = {
    getCurrentPackId() {
      return store.get('currentPackId', null);
    },
    setCurrentPackId(packId) {
      store.set('currentPackId', packId);
    },
    isMuted() {
      return store.get('muted', false);
    },
    setMuted(muted) {
      store.set('muted', muted);
    },
    toggleMuted() {
      const next = !api.isMuted();
      api.setMuted(next);
      return next;
    },
    getVolume() {
      return store.get('volume', 0.8);
    },
    setVolume(volume) {
      store.set('volume', volume);
    },
    getTone() {
      return store.get('tone', 0.5);
    },
    setTone(tone) {
      store.set('tone', tone);
    },
    getResponseSpeed() {
      return store.get('responseSpeed', 1);
    },
    setResponseSpeed(speed) {
      store.set('responseSpeed', speed);
    },
  };
  return api;
}

function resolveInitialPackId(availablePacks, storedPackId) {
  if (storedPackId && availablePacks.includes(storedPackId)) {
    return storedPackId;
  }
  return availablePacks.length > 0 ? availablePacks[0] : null;
}

module.exports = { createSettingsStore, resolveInitialPackId };
