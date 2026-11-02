import type { Candidate, Perfume, StockItem } from '../types';
import { TAG_KO } from './mood';

/*
 * 목업 유사도: 노트 자카드만 사용한다.
 * TODO(명세 9장): material_family 계열 벡터 코사인 + 노트 자카드 + family/character 태그로 교체.
 */

const lower = (xs: string[]) => new Set(xs.map((x) => x.toLowerCase()));

export function jaccard(a: string[], b: string[]): number {
  const A = lower(a);
  const B = lower(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  A.forEach((x) => { if (B.has(x)) inter += 1; });
  return inter / (A.size + B.size - inter);
}

export function describeDifference(base: Perfume, other: Perfume): string {
  const baseNotes = lower(base.allNotes);
  const extra = other.allNotes.filter((n) => !baseNotes.has(n.toLowerCase())).slice(0, 2);
  const baseChar = lower(base.character);
  const extraChar = other.character.filter((c) => !baseChar.has(c.toLowerCase())).slice(0, 1);
  const parts: string[] = [];
  if (extraChar.length) parts.push(`${TAG_KO[extraChar[0]] ?? extraChar[0]} 느낌이 더 있고`);
  if (extra.length) parts.push(`${extra.join('·')} 노트가 더해져요`);
  if (!parts.length) return `${base.name}와 노트 구성이 거의 같아요`;
  return `${base.name}보다 ${parts.join(' ')}`;
}

export function findCandidates(
  base: Perfume,
  stock: StockItem[],
  perfumesById: Map<string, Perfume>,
  limit = 5,
): Candidate[] {
  const baseNotes = lower(base.allNotes);
  return stock
    .filter((s) => s.inStock && s.perfumeId !== base.id)
    .map((s) => perfumesById.get(s.perfumeId) && { stock: s, perfume: perfumesById.get(s.perfumeId)! })
    .filter((x): x is { stock: StockItem; perfume: Perfume } => Boolean(x))
    .map(({ stock: s, perfume }) => ({
      perfume,
      stock: s,
      similarity: jaccard(base.allNotes, perfume.allNotes),
      sharedNotes: perfume.allNotes.filter((n) => baseNotes.has(n.toLowerCase())),
      difference: describeDifference(base, perfume),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
