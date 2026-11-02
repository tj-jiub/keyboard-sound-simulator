import { describe, expect, it } from 'vitest';
import { PERFUMES_BY_ID } from '../data/perfumes';
import { DEMO_STOCK } from '../data/mockStore';
import { findMoodCandidates, parseMood } from './mood';

describe('parseMood', () => {
  it('여러 표현을 알아듣는다', () => {
    const m = parseMood('비 오는 날 포근한 느낌');
    expect(m.matches.map((x) => x.label)).toEqual(expect.arrayContaining(['비 오는 날', '포근함']));
    expect(m.weights.earthy).toBeGreaterThan(0);
    expect(m.weights.warm).toBeGreaterThan(0);
  });
  it('"달지 않은"은 달콤함을 빼는 쪽으로', () => {
    const m = parseMood('달지 않은 우디');
    expect(m.matches.find((x) => x.label === '달콤함')?.negated).toBe(true);
    expect(m.weights.sweet).toBeLessThan(0);
    expect(m.weights.woody).toBeGreaterThan(0);
  });
  it('"편안한"의 "안"을 부정으로 오해하지 않는다', () => {
    const m = parseMood('편안 따뜻');
    expect(m.matches.find((x) => x.label === '포근함')?.negated).toBe(false);
  });
  it('모르는 말은 매칭 없음', () => {
    expect(parseMood('아무말대잔치').matches).toEqual([]);
  });
});

describe('findMoodCandidates', () => {
  const inStock = new Set(DEMO_STOCK.filter((s) => s.inStock).map((s) => s.perfumeId));

  it('재고 안에서만, 점수 순, 최대 5개', () => {
    const r = findMoodCandidates(parseMood('깨끗한 비누향'), DEMO_STOCK, PERFUMES_BY_ID);
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(5);
    r.forEach((c) => expect(inStock.has(c.perfume.id)).toBe(true));
    const s = r.map((c) => c.similarity);
    expect([...s].sort((a, b) => b - a)).toEqual(s);
  });
  it('스모키를 원하면 By the Fireplace가 상위에 온다', () => {
    const r = findMoodCandidates(parseMood('모닥불 같은 스모키'), DEMO_STOCK, PERFUMES_BY_ID);
    expect(r.slice(0, 3).map((c) => c.perfume.id)).toContain('maison-margiela-replica-by-the-fireplace');
  });
  it('이유 문장은 한국어 태그로', () => {
    const r = findMoodCandidates(parseMood('상큼한'), DEMO_STOCK, PERFUMES_BY_ID);
    expect(r[0].difference).toMatch(/시트러스|산뜻함|과일향/);
  });
});

describe('부정 표현 경계', () => {
  it.each(['안 달게', '덜 달게', '덜달게'])('"%s"는 달콤함을 뺀다', (q) => {
    expect(parseMood(q).matches.find((x) => x.label === '달콤함')?.negated).toBe(true);
  });
});
