const {
  app, BrowserWindow, Tray, Menu, nativeImage, ipcMain,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const Store = require('electron-store').default;
const { autoUpdater } = require('electron-updater');
const { loadPackConfig, toFileUrl, normalizePackCategory } = require('./packConfig');
const { createSettingsStore, resolveInitialPackId } = require('./settingsStore');
const { startKeyHook, stopKeyHook } = require('./keyHook');

const singleInstanceLockAcquired = app.requestSingleInstanceLock();
if (!singleInstanceLockAcquired) {
  app.quit();
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const PACKS_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'packs')
  : path.join(__dirname, '..', 'packs');

const APP_ICON_PATH = path.join(__dirname, 'assets', 'cat-icon.png');

let playerWindow;
let tray;
const settings = createSettingsStore(new Store());

function listAvailablePacks() {
  if (!fs.existsSync(PACKS_DIR)) return [];
  return fs
    .readdirSync(PACKS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function readPackCategory(packId) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, packId, 'config.json'), 'utf8'));
    return normalizePackCategory(raw.category);
  } catch {
    return 'switch';
  }
}

function createPlayerWindow() {
  playerWindow = new BrowserWindow({
    show: false,
    icon: APP_ICON_PATH,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  playerWindow.loadFile(path.join(__dirname, 'renderer', 'player.html'));
}

let settingsWindow = null;

function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 400,
    height: 760,
    minWidth: 380,
    minHeight: 560,
    resizable: true,
    title: '키보드 소리 시뮬레이터 - 설정',
    icon: APP_ICON_PATH,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

if (singleInstanceLockAcquired) {
  app.on('second-instance', () => openSettingsWindow());
}

function loadPack(packId) {
  try {
    const pack = loadPackConfig(path.join(PACKS_DIR, packId));
    if (!playerWindow || playerWindow.isDestroyed()) return false;
    playerWindow.webContents.send('load-pack', {
      soundFilePath: toFileUrl(pack.soundFilePath),
      variants: pack.variants,
      releaseVariants: pack.releaseVariants,
      thocky: pack.thocky,
    });
    return true;
  } catch (err) {
    console.error(`Failed to load pack "${packId}":`, err.message);
    if (tray) {
      tray.setToolTip(`키보드 소리 시뮬레이터 — 사운드팩 로드 실패: ${packId}`);
    }
    return false;
  }
}

ipcMain.handle('get-packs-state', () => {
  const packs = listAvailablePacks().map((id) => ({ id, category: readPackCategory(id) }));
  return { packs, currentPackId: settings.getCurrentPackId() };
});

ipcMain.handle('select-pack', (event, packId) => {
  if (!listAvailablePacks().includes(packId)) {
    return { success: false, currentPackId: settings.getCurrentPackId() };
  }
  const success = loadPack(packId);
  if (success) {
    settings.setCurrentPackId(packId);
    tray.setToolTip(`키보드 소리 시뮬레이터 (${packId})`);
  }
  return { success, currentPackId: settings.getCurrentPackId() };
});

ipcMain.handle('get-volume', () => settings.getVolume());

ipcMain.handle('set-volume', (event, volume) => {
  settings.setVolume(volume);
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.webContents.send('set-volume', volume);
  }
  return volume;
});

ipcMain.handle('get-tone', () => settings.getTone());

ipcMain.handle('set-tone', (event, tone) => {
  settings.setTone(tone);
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.webContents.send('set-tone', tone);
  }
  return tone;
});

// Windows 시작 시 자동 실행 — Electron의 네이티브 로그인 항목 API를 그대로 사용.
// (Mechvibes의 startup_handler.js와 동일한 setLoginItemSettings 기반 접근)
ipcMain.handle('get-startup-enabled', () => app.getLoginItemSettings().openAtLogin);

ipcMain.handle('set-startup-enabled', (event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: enabled });
  return app.getLoginItemSettings().openAtLogin;
});

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: '음소거',
      type: 'checkbox',
      checked: settings.isMuted(),
      click: (menuItem) => {
        settings.setMuted(menuItem.checked);
      },
    },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ]);
}

app.whenReady().then(() => {
  createPlayerWindow();

  tray = new Tray(nativeImage.createFromPath(APP_ICON_PATH));
  tray.setToolTip('키보드 소리 시뮬레이터');
  tray.setContextMenu(buildTrayMenu());
  tray.on('double-click', openSettingsWindow);

  // 트레이 아이콘을 찾아 더블클릭해야만 창이 뜨면 사용자가 발견하기 어렵다 —
  // Mechvibes처럼 앱을 켜면 바로 사운드팩 선택 창이 뜨도록 한다. 창을 닫아도
  // 트레이 더블클릭으로 다시 열 수 있다.
  openSettingsWindow();

  const packs = listAvailablePacks();
  const currentPackId = resolveInitialPackId(packs, settings.getCurrentPackId());
  if (currentPackId !== settings.getCurrentPackId()) {
    settings.setCurrentPackId(currentPackId);
  }

  if (currentPackId) {
    playerWindow.webContents.once('did-finish-load', () => {
      // Try packs in order, starting from whatever pack is CURRENTLY selected
      // (read fresh here, not the pre-computed value above) — the user may
      // have picked a different pack via the settings window while this
      // load was in flight, and we must not silently revert that choice.
      // Guards against a corrupt/broken pack leaving the app silently mute.
      const startPackId = settings.getCurrentPackId() ?? currentPackId;
      const startIndex = packs.indexOf(startPackId);
      const orderedPacks = [...packs.slice(startIndex), ...packs.slice(0, startIndex)];
      orderedPacks.some((packId) => {
        if (!loadPack(packId)) return false;
        if (packId !== settings.getCurrentPackId()) {
          settings.setCurrentPackId(packId);
        }
        return true;
      });
      playerWindow.webContents.send('set-volume', settings.getVolume());
      playerWindow.webContents.send('set-tone', settings.getTone());
    });
  }

  startKeyHook(
    (event) => {
      if (settings.isMuted()) return;
      if (!playerWindow || playerWindow.isDestroyed()) return;
      playerWindow.webContents.send('trigger-key', { keycode: event.keycode, sentAt: Date.now() });
    },
    () => {
      if (settings.isMuted()) return;
      if (!playerWindow || playerWindow.isDestroyed()) return;
      playerWindow.webContents.send('trigger-key-release');
    },
  );

  ipcMain.on('key-latency-debug', (event, latencyMs) => {
    console.log(`[latency] key -> playback: ${latencyMs}ms`);
  });

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  // 트레이 상주 앱이므로 창이 없어도(원래 숨김 창뿐이라 항상 없음) 종료하지 않는다.
});

app.on('before-quit', () => {
  stopKeyHook();
});
