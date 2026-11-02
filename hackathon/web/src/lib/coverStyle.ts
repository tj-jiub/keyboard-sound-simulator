/*
 * 향수 커버 아트. 제품 이미지가 없으므로 향 계열(family)로 색을, id 해시로 레이아웃을 정한다.
 * 같은 향수는 항상 같은 커버가 나온다.
 */

export interface Palette { bg: string; fg: string; accent: string; deep: string }

const FAMILY: Record<string, Palette> = {
  'Wood & Root':     { bg: '#3b2a1e', fg: '#f3e6d4', accent: '#c98a4b', deep: '#1f150e' },
  'White Bloom':     { bg: '#f4efe6', fg: '#1d1d1b', accent: '#e2b93b', deep: '#2b2a26' },
  'Petal Garden':    { bg: '#e7a6b8', fg: '#3a0f22', accent: '#ffffff', deep: '#4a1430' },
  'Green Leaf':      { bg: '#1f4d3a', fg: '#e6f2c8', accent: '#9ccc4a', deep: '#0f2a1f' },
  'Velvet Sweet':    { bg: '#6a1640', fg: '#ffd9e8', accent: '#ff7aa8', deep: '#3a0a22' },
  'Sunlit Citrus':   { bg: '#ffb627', fg: '#2a1a00', accent: '#ff5d1f', deep: '#4a2a00' },
  'Spice Route':     { bg: '#a3341f', fg: '#ffe7c7', accent: '#ffb347', deep: '#4a140a' },
  'Orchard Fruit':   { bg: '#ff6f59', fg: '#2b0b05', accent: '#ffe066', deep: '#5a1a10' },
  'Amber & Resin':   { bg: '#c46a17', fg: '#2a1100', accent: '#ffd28a', deep: '#4a2408' },
  'Powder Veil':     { bg: '#d9d3f2', fg: '#2a2550', accent: '#8f7ff0', deep: '#2a2550' },
  'Skin Musk':       { bg: '#e8d8c8', fg: '#3a2e25', accent: '#b89478', deep: '#3a2e25' },
  'Smoke & Leather': { bg: '#161616', fg: '#e9e4dc', accent: '#8a8178', deep: '#000000' },
  'Salt & Mineral':  { bg: '#b9cfd6', fg: '#14313b', accent: '#ffffff', deep: '#14313b' },
};

const FALLBACK: Palette = { bg: '#2f3a8f', fg: '#ffffff', accent: '#9fb3ff', deep: '#141a45' };

export function paletteFor(family: string): Palette {
  return FAMILY[family] ?? FALLBACK;
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export type CoverVariant = 'vertical' | 'stack' | 'serif' | 'stripe';
const VARIANTS: CoverVariant[] = ['vertical', 'stack', 'serif', 'stripe'];

export function variantFor(id: string): CoverVariant {
  return VARIANTS[hash(id) % VARIANTS.length];
}
