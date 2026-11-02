import { useMemo, useState } from 'react';
import type { Perfume, StockItem, Verdict } from './types';
import { PERFUMES, PERFUMES_BY_ID } from './data/perfumes';
import { DEMO_FEEDBACK_SEED, DEMO_STOCK, DEMO_STOCK_UPDATED_AT, DEMO_STORE } from './data/mockStore';
import { findCandidates } from './lib/mockSimilarity';
import { findMoodCandidates, type MoodProfile } from './lib/mood';
import { createFeedbackStore } from './lib/feedbackStore';
import { TopBar } from './components/TopBar';
import { ShelfWall, type ShelfEntry } from './components/ShelfWall';
import { ShelfIndex } from './components/ShelfIndex';
import { FocusView } from './components/FocusView';
import { StockUploader } from './components/StockUploader';
import { AppFooter } from './components/AppFooter';

const KNOWN_IDS = new Set(PERFUMES.map((p) => p.id));

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 마감 재고`;
}

export default function App() {
  const [base, setBase] = useState<Perfume | null>(null);
  const [mood, setMood] = useState<MoodProfile | null>(null);
  const [stock, setStock] = useState<StockItem[]>(DEMO_STOCK);
  const [stockUpdatedAt, setStockUpdatedAt] = useState(DEMO_STOCK_UPDATED_AT);
  const [focus, setFocus] = useState<{ id: string; rect: DOMRect | null } | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const feedback = useMemo(() => createFeedbackStore(DEMO_STORE.id, DEMO_FEEDBACK_SEED), []);
  const [, setFeedbackVersion] = useState(0);

  const entries: ShelfEntry[] = useMemo(
    () => stock.flatMap((s) => {
      const perfume = PERFUMES_BY_ID.get(s.perfumeId);
      return perfume ? [{ perfume, stock: s }] : [];
    }),
    [stock],
  );

  const candidates = useMemo(() => {
    if (base) return findCandidates(base, stock, PERFUMES_BY_ID);
    if (mood) return findMoodCandidates(mood, stock, PERFUMES_BY_ID);
    return [];
  }, [base, mood, stock]);

  const pickPerfume = (p: Perfume) => { setMood(null); setBase(p); };
  const pickMood = (m: MoodProfile) => { setBase(null); setMood(m); };
  const clearQuery = () => { setBase(null); setMood(null); };
  const ranks = useMemo(() => new Map(candidates.map((c, i) => [c.perfume.id, i + 1])), [candidates]);

  const onVote = (toId: string, v: Verdict) => {
    if (base && feedback.vote(base.id, toId, v)) setFeedbackVersion((n) => n + 1);
  };

  const onStockApply = (items: StockItem[]) => {
    setStock(items);
    setStockUpdatedAt(new Date().toISOString());
  };

  const focused = focus ? entries.find((e) => e.perfume.id === focus.id) : undefined;
  const focusedCandidate = focused ? candidates.find((c) => c.perfume.id === focused.perfume.id) ?? null : null;

  return (
    <div className="app">
      <TopBar store={DEMO_STORE} perfumes={PERFUMES} onSelect={pickPerfume} onMood={pickMood} onStaff={() => setStaffOpen((o) => !o)} />

      {staffOpen && (
        <StockUploader knownIds={KNOWN_IDS} onApply={onStockApply} onClose={() => setStaffOpen(false)} />
      )}

      <div className="caption" aria-live="polite">
        {base || mood ? (
          <>
            <p>
              {base
                ? <><strong>{base.name}</strong>와 비슷한 후보 {candidates.length}개</>
                : <><strong>“{mood!.text}”</strong> 느낌에 가까운 후보 {candidates.length}개</>}
              <span className="caption-sub">번호 순서대로 맡아보세요. 병을 누르면 돌려 보고 뒤집어 볼 수 있어요.</span>
            </p>
            <button type="button" className="pill" onClick={clearQuery}>전체 보기</button>
          </>
        ) : (
          <p>
            지금 이 매장 진열대
            <span className="caption-sub">{formatUpdatedAt(stockUpdatedAt)} · 당일 품절은 직원에게 확인해 주세요</span>
          </p>
        )}
      </div>

      <main>
        {(base || mood) && candidates.length === 0 && (
          <p className="empty" role="status">이 매장 재고에는 비교할 향수가 없어요. 직원에게 문의해 주세요.</p>
        )}
        <ShelfWall entries={entries} ranks={ranks} onOpen={(id, rect) => setFocus({ id, rect })} />
      </main>

      <ShelfIndex entries={entries} ranks={ranks} onOpen={(id, rect) => setFocus({ id, rect })} />
      <AppFooter />

      {focused && (
        <FocusView
          key={focused.perfume.id}
          perfume={focused.perfume}
          stock={focused.stock}
          originRect={focus?.rect ?? null}
          base={base}
          candidate={focusedCandidate}
          moodText={mood?.text}
          rank={ranks.get(focused.perfume.id)}
          feedback={base && focusedCandidate ? feedback.summary(base.id, focused.perfume.id) : null}
          voted={base ? feedback.hasVoted(base.id, focused.perfume.id) : false}
          onVote={(v) => onVote(focused.perfume.id, v)}
          onClose={() => setFocus(null)}
        />
      )}
    </div>
  );
}
