import { describe, expect, it, beforeEach } from 'vitest';
import { PERFUMES, PERFUMES_BY_ID } from '../data/perfumes';
import { DEMO_STOCK } from '../data/mockStore';
import { normalize, searchPerfumes } from './search';
import { findCandidates } from './mockSimilarity';
import { parseStockCsv } from './stockCsv';
import { createFeedbackStore } from './feedbackStore';

describe('search (F1)', () => {
  it.each(['상탈33', '상탈 33', 'santal33', 'Santal 33', '르라보 상탈'])('"%s" → Le Labo Santal 33', (q) => {
    expect(searchPerfumes(PERFUMES, q)[0]?.id).toBe('le-labo-santal-33');
  });
  it('한글 별칭 블랑쉬', () => {
    expect(searchPerfumes(PERFUMES, '블랑쉬')[0]?.id).toBe('byredo-blanche');
  });
  it('1글자는 검색하지 않는다', () => {
    expect(searchPerfumes(PERFUMES, '상')).toEqual([]);
  });
  it('없는 이름은 빈 결과', () => {
    expect(searchPerfumes(PERFUMES, 'zzzqqq')).toEqual([]);
  });
  it('normalize는 악센트·공백·기호를 제거한다', () => {
    expect(normalize("Thé Noir 29")).toBe('thenoir29');
  });
});

describe('candidates (F2)', () => {
  const base = PERFUMES_BY_ID.get('le-labo-santal-33')!;
  const stockIds = new Set(DEMO_STOCK.filter((s) => s.inStock).map((s) => s.perfumeId));
  const result = findCandidates(base, DEMO_STOCK, PERFUMES_BY_ID);

  it('재고에 있는 향수만, 기준 향수 제외, 최대 5개', () => {
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);
    result.forEach((c) => {
      expect(stockIds.has(c.perfume.id)).toBe(true);
      expect(c.perfume.id).not.toBe(base.id);
    });
  });
  it('품절 향수는 노출되지 않는다', () => {
    const all = findCandidates(base, DEMO_STOCK, PERFUMES_BY_ID, 100);
    expect(all.some((c) => c.perfume.id === 'maison-margiela-replica-beach-walk')).toBe(false);
  });
  it('유사도 내림차순', () => {
    const sims = result.map((c) => c.similarity);
    expect([...sims].sort((a, b) => b - a)).toEqual(sims);
  });
});

describe('stock CSV (F5)', () => {
  const ids = new Set(PERFUMES.map((p) => p.id));
  it('정상 파싱', () => {
    const r = parseStockCsv('perfume_id,shelf,in_stock\nbyredo-blanche,B-2,1\nle-labo-santal-33,A-1,0', ids);
    expect(r.errors).toEqual([]);
    expect(r.items).toEqual([
      { perfumeId: 'byredo-blanche', shelf: 'B-2', inStock: true },
      { perfumeId: 'le-labo-santal-33', shelf: 'A-1', inStock: false },
    ]);
  });
  it('헤더·id·값 오류를 보고한다', () => {
    expect(parseStockCsv('a,b\n', ids).errors).toHaveLength(1);
    const r = parseStockCsv('perfume_id,shelf,in_stock\nnope,A,1\nbyredo-blanche,B,maybe', ids);
    expect(r.items).toEqual([]);
    expect(r.errors).toHaveLength(2);
  });
});

describe('feedback store (F4)', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  it('같은 세션·같은 쌍은 1회만 집계', () => {
    const s = createFeedbackStore('t');
    expect(s.vote('a', 'b', 'similar')).toBe(true);
    expect(s.vote('a', 'b', 'different')).toBe(false);
    expect(s.summary('a', 'b')).toEqual({ total: 1, similar: 1 });
  });
  it('새로 만들어도 저장된 집계가 유지된다', () => {
    createFeedbackStore('t').vote('a', 'b', 'different');
    expect(createFeedbackStore('t').summary('a', 'b')).toEqual({ total: 1, similar: 0 });
  });
});
