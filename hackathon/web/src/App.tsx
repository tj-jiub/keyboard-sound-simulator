import { useMemo, useState } from 'react';
import type { Perfume, StockItem, Verdict } from './types';
import { PERFUMES, PERFUMES_BY_ID } from './data/perfumes';
import { DEMO_FEEDBACK_SEED, DEMO_STOCK, DEMO_STOCK_UPDATED_AT, DEMO_STORE } from './data/mockStore';
import { findCandidates } from './lib/mockSimilarity';
import { createFeedbackStore } from './lib/feedbackStore';
import { StoreHeader } from './components/StoreHeader';
import { SearchBox } from './components/SearchBox';
import { SelectedPerfume } from './components/SelectedPerfume';
import { CandidateList } from './components/CandidateList';
import { StockUploader } from './components/StockUploader';
import { AppFooter } from './components/AppFooter';

const KNOWN_IDS = new Set(PERFUMES.map((p) => p.id));

export default function App() {
  const [base, setBase] = useState<Perfume | null>(null);
  const [stock, setStock] = useState<StockItem[]>(DEMO_STOCK);
  const [stockUpdatedAt, setStockUpdatedAt] = useState(DEMO_STOCK_UPDATED_AT);
  const feedback = useMemo(() => createFeedbackStore(DEMO_STORE.id, DEMO_FEEDBACK_SEED), []);
  const [, setFeedbackVersion] = useState(0);

  const candidates = useMemo(
    () => (base ? findCandidates(base, stock, PERFUMES_BY_ID) : []),
    [base, stock],
  );

  const onVote = (toId: string, v: Verdict) => {
    if (base && feedback.vote(base.id, toId, v)) setFeedbackVersion((n) => n + 1);
  };

  const onStockApply = (items: StockItem[]) => {
    setStock(items);
    setStockUpdatedAt(new Date().toISOString());
  };

  return (
    <div className="app">
      <StoreHeader store={DEMO_STORE} stockUpdatedAt={stockUpdatedAt} />
      <main>
        {base ? (
          <>
            <SelectedPerfume perfume={base} onClear={() => setBase(null)} />
            <CandidateList base={base} candidates={candidates} feedback={feedback} onVote={onVote} />
          </>
        ) : (
          <SearchBox perfumes={PERFUMES} onSelect={setBase} />
        )}
        <StockUploader knownIds={KNOWN_IDS} onApply={onStockApply} />
      </main>
      <AppFooter />
    </div>
  );
}
