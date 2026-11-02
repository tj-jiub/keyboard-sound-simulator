import type { FeedbackSummary, Verdict } from '../types';

/*
 * 목업 피드백 저장소: 브라우저 localStorage.
 * TODO: 서버(KV/D1)로 교체해야 매장 방문객 전체의 집계가 된다.
 */

export const MIN_FEEDBACK_TO_SHOW = 3;

type Counts = Record<string, FeedbackSummary>;

const pairKey = (fromId: string, toId: string) => `${fromId}>${toId}`;

function safeGet(storage: () => Storage, key: string): string | null {
  try { return storage().getItem(key); } catch { return null; }
}
function safeSet(storage: () => Storage, key: string, value: string) {
  try { storage().setItem(key, value); } catch { /* 저장 불가 환경은 무시 */ }
}

export function createFeedbackStore(storeId: string, seed: Counts = {}) {
  const countsKey = `feedback:${storeId}`;
  const votedKey = `feedback-voted:${storeId}`;
  const local = () => window.localStorage;
  const session = () => window.sessionStorage;

  const memory: { counts: Counts; voted: Set<string> } = {
    counts: { ...seed, ...JSON.parse(safeGet(local, countsKey) ?? '{}') },
    voted: new Set(JSON.parse(safeGet(session, votedKey) ?? '[]')),
  };

  return {
    summary(fromId: string, toId: string): FeedbackSummary {
      return memory.counts[pairKey(fromId, toId)] ?? { total: 0, similar: 0 };
    },
    hasVoted(fromId: string, toId: string): boolean {
      return memory.voted.has(pairKey(fromId, toId));
    },
    /** 같은 세션·같은 쌍은 1회만. 이미 투표했으면 false. */
    vote(fromId: string, toId: string, verdict: Verdict): boolean {
      const k = pairKey(fromId, toId);
      if (memory.voted.has(k)) return false;
      const cur = memory.counts[k] ?? { total: 0, similar: 0 };
      memory.counts[k] = { total: cur.total + 1, similar: cur.similar + (verdict === 'similar' ? 1 : 0) };
      memory.voted.add(k);
      safeSet(local, countsKey, JSON.stringify(memory.counts));
      safeSet(session, votedKey, JSON.stringify([...memory.voted]));
      return true;
    },
  };
}

export type FeedbackStore = ReturnType<typeof createFeedbackStore>;
