import type { Perfume } from '../types';

/** 소문자, 공백·특수문자 제거. 한글·영문·숫자만 남긴다. */
export function normalize(s: string): string {
  return s
    // NFD로 악센트를 떼어낸 뒤 NFC로 다시 합친다 (한글 음절이 자모로 남지 않게).
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/g, '');
}

function keysOf(p: Perfume): string[] {
  return [
    p.name,
    `${p.brand} ${p.name}`,
    ...p.aliasesKo,
    ...p.brandAliasesKo.map((b) => `${b} ${p.name}`),
    ...p.brandAliasesKo.flatMap((b) => p.aliasesKo.map((a) => `${b} ${a}`)),
  ].map(normalize);
}

/**
 * 검색 순서(명세 8장): 별칭·이름 정확 일치 → 앞부분 일치 → 부분 일치.
 * 같은 단계에서는 인기 순.
 */
export function searchPerfumes(perfumes: Perfume[], query: string, limit = 8): Perfume[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const scored: { p: Perfume; score: number }[] = [];
  for (const p of perfumes) {
    const keys = keysOf(p);
    let score = 0;
    if (keys.some((k) => k === q)) score = 3;
    else if (keys.some((k) => k.startsWith(q))) score = 2;
    else if (keys.some((k) => k.includes(q))) score = 1;
    if (score > 0) scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score || a.p.popularityRank - b.p.popularityRank);
  return scored.slice(0, limit).map((s) => s.p);
}
