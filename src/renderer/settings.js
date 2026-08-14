const { ipcRenderer } = require('electron');

const spacebarEl = document.getElementById('spacebar');
const nowPlayingTitleEl = document.getElementById('now-playing-title');
const dropdownTriggerEl = document.getElementById('dropdown-trigger');
const dropdownTriggerLabelEl = document.getElementById('dropdown-trigger-label');
const dropdownPanelEl = document.getElementById('dropdown-panel');
const dropdownListEl = document.getElementById('dropdown-list');
const errorEl = document.getElementById('error-message');
const randomBtnEl = document.getElementById('random-btn');
const favBtnEl = document.getElementById('fav-btn');
const favBtnLabelEl = document.getElementById('fav-btn-label');
const favBtnIconEl = document.getElementById('fav-btn-icon');
const volumeSliderEl = document.getElementById('volume-slider');
const volumeValEl = document.getElementById('volume-val');
const toneSliderEl = document.getElementById('tone-slider');
const toneValEl = document.getElementById('tone-val');
const darkToggleEl = document.getElementById('dark-toggle');
const startupToggleEl = document.getElementById('startup-toggle');
const prefsHeaderEl = document.getElementById('prefs-header');
const prefsContentEl = document.getElementById('prefs-content');
const appPrefsHeaderEl = document.getElementById('app-prefs-header');
const appPrefsContentEl = document.getElementById('app-prefs-content');
const shortcutTriggerEl = document.getElementById('shortcut-trigger');
const shortcutLabelEl = document.getElementById('shortcut-label');
const shortcutHintEl = document.getElementById('shortcut-hint');
const bgSwatchesEl = document.getElementById('bg-swatches');
const fontPillsEl = document.getElementById('font-pills');
const textSwatchesEl = document.getElementById('text-swatches');

const CATEGORIES = [
  { key: 'brand', label: '브랜드별' },
  { key: 'switch', label: '스위치 계열' },
];

const BG_SWATCHES = {
  dark: ['#1c1c1e', '#12182b', '#10201a', '#201225'],
  light: ['#eceef1', '#f7f3ea', '#eaf2ef', '#efeaf5'],
};
const TEXT_SWATCHES = {
  dark: ['#f5f5f7', '#cfe3ff', '#d8f5df', '#f3d9ff'],
  light: ['#1d1d1f', '#3a3a3c', '#5b4636', '#2c3e58'],
};
const FONT_OPTIONS = [
  { key: 'system', label: '시스템', value: "'Noto Sans KR','Noto Sans','Segoe UI',sans-serif" },
  { key: 'serif', label: '세리프', value: "Georgia,'Times New Roman',serif" },
  { key: 'rounded', label: '라운드', value: "'Arial Rounded MT Bold','SF Pro Rounded',sans-serif" },
];

const THEME_STORAGE_KEY = 'kss-theme';
const FONT_STORAGE_KEY = 'kss-font';
const FAV_STORAGE_KEY = 'kss-favorites';

function bgStorageKey(theme) {
  return `kss-bg-${theme}`;
}

function textStorageKey(theme) {
  return `kss-text-${theme}`;
}

let currentState = { packs: [], currentPackId: null };
let dropdownOpen = false;
let prefsOpen = false;
let appPrefsOpen = false;

function getFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function setFavorites(set) {
  localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...set]));
}

function renderNowPlaying() {
  const { packs, currentPackId } = currentState;
  const pack = packs.find((p) => p.id === currentPackId);
  if (!pack) {
    nowPlayingTitleEl.textContent = '사운드팩을 골라주세요';
    dropdownTriggerLabelEl.textContent = '사운드팩 선택';
    return;
  }
  const isFav = getFavorites().has(pack.id);
  nowPlayingTitleEl.textContent = `${isFav ? '★ ' : ''}지금 재생 중이에요 — ${pack.id}`;
  dropdownTriggerLabelEl.textContent = pack.id;
}

function renderFavButton() {
  const favorites = getFavorites();
  const isFav = currentState.currentPackId && favorites.has(currentState.currentPackId);
  favBtnLabelEl.textContent = isFav ? '즐겨찾기 됨' : '즐겨찾기에 추가';
  favBtnIconEl.setAttribute('fill', isFav ? 'currentColor' : 'none');
  favBtnEl.classList.toggle('active', Boolean(isFav));
}

function setDropdownOpen(open) {
  dropdownOpen = open;
  dropdownTriggerEl.classList.toggle('open', open);
  dropdownPanelEl.classList.toggle('open', open);
  if (open) {
    const rect = dropdownTriggerEl.getBoundingClientRect();
    dropdownPanelEl.style.left = `${rect.left}px`;
    dropdownPanelEl.style.width = `${rect.width}px`;
    dropdownPanelEl.style.top = `${rect.bottom + 6}px`;
    const available = window.innerHeight - rect.bottom - 22;
    dropdownPanelEl.style.maxHeight = `${Math.max(120, Math.min(280, available))}px`;
  } else {
    dropdownPanelEl.style.maxHeight = '0px';
  }
}

function renderDropdownList() {
  const { packs, currentPackId } = currentState;
  const favorites = getFavorites();
  dropdownListEl.innerHTML = '';
  if (packs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dropdown-empty';
    empty.textContent = '사운드팩이 없습니다. packs/ 폴더를 확인하세요.';
    dropdownListEl.appendChild(empty);
    return;
  }
  const groups = CATEGORIES.map((category) => ({
    category,
    items: packs.filter((pack) => pack.category === category.key),
  })).filter((group) => group.items.length > 0);
  groups.forEach((group) => {
    const header = document.createElement('div');
    header.className = 'dropdown-group-header';
    header.textContent = group.category.label;
    dropdownListEl.appendChild(header);
    group.items.forEach((pack) => {
      const option = document.createElement('div');
      option.className = `dropdown-option${pack.id === currentPackId ? ' selected' : ''}`;
      option.dataset.packId = pack.id;
      if (favorites.has(pack.id)) {
        const star = document.createElement('span');
        star.className = 'fav-star';
        star.textContent = '★';
        option.appendChild(star);
      }
      option.appendChild(document.createTextNode(pack.id));
      dropdownListEl.appendChild(option);
    });
  });
}

async function selectPack(packId) {
  const result = await ipcRenderer.invoke('select-pack', packId);
  currentState = { packs: currentState.packs, currentPackId: result.currentPackId };
  errorEl.textContent = result.success ? '' : `"${packId}" 팩을 불러오지 못했습니다.`;
  renderNowPlaying();
  renderFavButton();
  renderDropdownList();
}

// dropdown-panel is position:fixed but still a DOM descendant of the trigger's
// card, so clicks inside it (including its own padding, not just an option)
// would otherwise bubble to the document-level "click outside closes it"
// listener below and immediately close what was just clicked.
dropdownPanelEl.addEventListener('click', (event) => event.stopPropagation());

dropdownListEl.addEventListener('click', (event) => {
  const option = event.target.closest('.dropdown-option');
  if (!option) return;
  setDropdownOpen(false);
  selectPack(option.dataset.packId);
});

dropdownTriggerEl.addEventListener('click', (event) => {
  event.stopPropagation();
  setDropdownOpen(!dropdownOpen);
});

// Clicking anywhere outside the open dropdown (empty space, another card,
// whatever) closes it — the trigger's own click is stopped from reaching
// here above, so this can't immediately re-close what it just opened.
document.addEventListener('click', () => {
  if (dropdownOpen) setDropdownOpen(false);
});

randomBtnEl.addEventListener('click', () => {
  if (currentState.packs.length === 0) return;
  const pick = currentState.packs[Math.floor(Math.random() * currentState.packs.length)];
  selectPack(pick.id);
});

favBtnEl.addEventListener('click', () => {
  if (!currentState.currentPackId) return;
  const favorites = getFavorites();
  if (favorites.has(currentState.currentPackId)) {
    favorites.delete(currentState.currentPackId);
  } else {
    favorites.add(currentState.currentPackId);
  }
  setFavorites(favorites);
  renderFavButton();
  renderNowPlaying();
  renderDropdownList();
});

prefsHeaderEl.addEventListener('click', () => {
  prefsOpen = !prefsOpen;
  prefsHeaderEl.classList.toggle('open', prefsOpen);
  prefsContentEl.classList.toggle('open', prefsOpen);
});

appPrefsHeaderEl.addEventListener('click', () => {
  appPrefsOpen = !appPrefsOpen;
  appPrefsHeaderEl.classList.toggle('open', appPrefsOpen);
  appPrefsContentEl.classList.toggle('open', appPrefsOpen);
});

let capturingShortcut = false;

function formatAccelerator(accelerator) {
  return accelerator.replace('CommandOrControl', 'Ctrl');
}

function stopCapturingShortcut() {
  // stopCapturingShortcut, cancelShortcutCapture and captureShortcutKeydown
  // call each other (mutually recursive), so one forward reference is
  // unavoidable no matter the declaration order.
  // eslint-disable-next-line no-use-before-define
  document.removeEventListener('keydown', captureShortcutKeydown, true);
  capturingShortcut = false;
  shortcutTriggerEl.classList.remove('open');
}

function cancelShortcutCapture() {
  stopCapturingShortcut();
  ipcRenderer.invoke('get-shortcut').then((accelerator) => {
    shortcutLabelEl.textContent = formatAccelerator(accelerator);
  });
  shortcutHintEl.textContent = '버튼을 클릭하고 원하는 키 조합을 눌러주세요.';
}

function captureShortcutKeydown(event) {
  event.preventDefault();
  const { key } = event;
  if (key === 'Escape') {
    cancelShortcutCapture();
    return;
  }
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return;

  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push('CommandOrControl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');
  const KEY_NAME_MAP = {
    ' ': 'Space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Escape: 'Esc',
  };
  parts.push(KEY_NAME_MAP[key] || (key.length === 1 ? key.toUpperCase() : key));

  // Require at least one modifier so this can't collide with normal typing —
  // the whole point of this app is that every keystroke plays a sound.
  if (parts.length < 2) {
    shortcutHintEl.textContent = '조합키(Ctrl/Alt/Shift)를 포함해서 눌러주세요.';
    return;
  }

  stopCapturingShortcut();
  const accelerator = parts.join('+');
  shortcutLabelEl.textContent = '적용 중…';
  ipcRenderer.invoke('set-shortcut', accelerator).then((result) => {
    shortcutLabelEl.textContent = formatAccelerator(result.shortcut);
    shortcutHintEl.textContent = result.success
      ? '버튼을 클릭하고 원하는 키 조합을 눌러주세요.'
      : '이미 다른 프로그램이 사용 중인 조합이에요. 이전 단축키로 되돌렸어요.';
  });
}

shortcutTriggerEl.addEventListener('click', () => {
  if (capturingShortcut) return;
  capturingShortcut = true;
  shortcutTriggerEl.classList.add('open');
  shortcutLabelEl.textContent = '키를 눌러주세요…';
  shortcutHintEl.textContent = '취소하려면 Esc를 누르세요.';
  document.addEventListener('keydown', captureShortcutKeydown, true);
});

function markSelectedChild(container, selectedValue) {
  Array.from(container.children).forEach((child) => {
    child.classList.toggle('selected', child.dataset.value === selectedValue);
  });
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l: l * 100 };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const segments = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ];
  const [rp, gp, bp] = segments[Math.min(5, Math.floor(h / 60))];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(rp)}${toHex(gp)}${toHex(bp)}`;
}

function complementaryColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  if (s < 8) {
    return l > 50 ? '#c9793f' : '#7fb0d9';
  }
  return hslToHex((h + 180) % 360, s, l);
}

function applyBg(color) {
  document.documentElement.style.setProperty('--bg', color);
  markSelectedChild(bgSwatchesEl, color);
}

function applyText(color) {
  document.documentElement.style.setProperty('--text', color);
  markSelectedChild(textSwatchesEl, color);
}

function applyFont(fontValue) {
  document.documentElement.style.setProperty('--font-family', fontValue);
  markSelectedChild(fontPillsEl, fontValue);
}

function buildSwatches(container, colors, onSelect) {
  const target = container;
  target.innerHTML = '';
  colors.forEach((color) => {
    const btn = document.createElement('button');
    btn.className = 'swatch-circle';
    btn.style.background = color;
    btn.dataset.value = color;
    btn.addEventListener('click', () => onSelect(color));
    target.appendChild(btn);
  });
}

function appendCustomSwatch(container, onSelect) {
  const label = document.createElement('label');
  label.className = 'swatch-custom';
  label.title = '직접 선택';
  const input = document.createElement('input');
  input.type = 'color';
  input.addEventListener('input', () => onSelect(input.value));
  label.appendChild(input);
  container.appendChild(label);
}

function buildFontPills() {
  fontPillsEl.innerHTML = '';
  FONT_OPTIONS.forEach((font) => {
    const btn = document.createElement('button');
    btn.className = 'font-pill';
    btn.textContent = font.label;
    btn.dataset.value = font.value;
    btn.addEventListener('click', () => {
      applyFont(font.value);
      localStorage.setItem(FONT_STORAGE_KEY, font.value);
    });
    fontPillsEl.appendChild(btn);
  });
}
buildFontPills();

function refreshBgSwatches(theme) {
  const options = BG_SWATCHES[theme];
  buildSwatches(bgSwatchesEl, options, (color) => {
    applyBg(color);
    localStorage.setItem(bgStorageKey(theme), color);
  });
  appendCustomSwatch(bgSwatchesEl, (color) => {
    applyBg(color);
    localStorage.setItem(bgStorageKey(theme), color);
  });
  const saved = localStorage.getItem(bgStorageKey(theme));
  if (saved) {
    applyBg(saved);
  } else {
    document.documentElement.style.removeProperty('--bg');
    markSelectedChild(bgSwatchesEl, options[0]);
  }
}

function refreshTextSwatches(theme) {
  const options = TEXT_SWATCHES[theme];
  buildSwatches(textSwatchesEl, options, (color) => {
    applyText(color);
    localStorage.setItem(textStorageKey(theme), color);
  });
  appendCustomSwatch(textSwatchesEl, (color) => {
    applyText(color);
    localStorage.setItem(textStorageKey(theme), color);
  });
  const saved = localStorage.getItem(textStorageKey(theme));
  if (saved) {
    applyText(saved);
  } else {
    document.documentElement.style.removeProperty('--text');
    markSelectedChild(textSwatchesEl, options[0]);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  darkToggleEl.checked = theme === 'dark';
  refreshBgSwatches(theme);
  refreshTextSwatches(theme);
}

darkToggleEl.addEventListener('change', () => {
  const next = darkToggleEl.checked ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem(THEME_STORAGE_KEY, next);
});

startupToggleEl.addEventListener('change', () => {
  ipcRenderer.invoke('set-startup-enabled', startupToggleEl.checked);
});

ipcRenderer.invoke('get-startup-enabled').then((enabled) => {
  startupToggleEl.checked = enabled;
});

ipcRenderer.invoke('get-shortcut').then((accelerator) => {
  shortcutLabelEl.textContent = formatAccelerator(accelerator);
});

function formatPercent(value) {
  return String(Math.round(Number(value) * 100));
}

volumeSliderEl.addEventListener('input', () => {
  volumeValEl.textContent = formatPercent(volumeSliderEl.value);
  ipcRenderer.invoke('set-volume', Number(volumeSliderEl.value));
});

toneSliderEl.addEventListener('input', () => {
  toneValEl.textContent = formatPercent(toneSliderEl.value);
  ipcRenderer.invoke('set-tone', Number(toneSliderEl.value));
});

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
applyTheme(savedTheme);

const savedFont = localStorage.getItem(FONT_STORAGE_KEY);
if (savedFont) applyFont(savedFont);
else applyFont(FONT_OPTIONS[0].value);

ipcRenderer.invoke('get-packs-state').then((state) => {
  currentState = state;
  renderNowPlaying();
  renderFavButton();
  renderDropdownList();
});
ipcRenderer.invoke('get-volume').then((volume) => {
  volumeSliderEl.value = volume;
  volumeValEl.textContent = formatPercent(volume);
});
ipcRenderer.invoke('get-tone').then((tone) => {
  toneSliderEl.value = tone;
  toneValEl.textContent = formatPercent(tone);
});

// Buttons/checkboxes in this window keep keyboard focus after a click (normal
// browser behavior), but a global hook plays a sound on every OS keystroke no
// matter which window is focused — so a later Space/Enter typed elsewhere
// re-activates whatever was last clicked here (e.g. silently reopening the
// pack dropdown mid-sentence). Releasing focus right after the click's own
// effect has run avoids that without needing to touch every handler above.
document.addEventListener('click', () => {
  const { activeElement } = document;
  if (activeElement && activeElement !== document.body && activeElement.blur) {
    activeElement.blur();
  }
});

window.addEventListener('keydown', (event) => {
  // Skip while capturing a new shortcut — Escape cancels that capture
  // instead (handled in captureShortcutKeydown), not this window.
  if (event.key === 'Escape' && !capturingShortcut) {
    window.close();
  }
});

// Keeps the keycap "held down" for as long as real keystrokes keep arriving
// (each one just pushes the release back out) rather than a fixed-length
// animation per keystroke — reads as continuously pressed while typing fast
// and springs back the moment typing actually stops.
let spacebarReleaseTimer = null;
ipcRenderer.on('key-pressed-visual', () => {
  spacebarEl.classList.add('pressed');
  clearTimeout(spacebarReleaseTimer);
  spacebarReleaseTimer = setTimeout(() => spacebarEl.classList.remove('pressed'), 90);
});
