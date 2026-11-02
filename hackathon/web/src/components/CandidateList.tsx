import type { Candidate, Perfume, Verdict } from '../types';
import type { FeedbackStore } from '../lib/feedbackStore';
import { CandidateCard } from './CandidateCard';

interface Props {
  base: Perfume;
  candidates: Candidate[];
  feedback: FeedbackStore;
  onVote: (toId: string, v: Verdict) => void;
}

export function CandidateList({ base, candidates, feedback, onVote }: Props) {
  if (!candidates.length) {
    return (
      <p className="empty" role="status">
        지금 이 매장 재고에는 비교할 향수가 없어요. 직원에게 문의해 주세요.
      </p>
    );
  }
  return (
    <section aria-label="시향 후보">
      <h2 className="list-title">
        이 {candidates.length}개만 맡아보세요
      </h2>
      <div className="cards">
        {candidates.map((c, i) => (
          <CandidateCard
            key={c.perfume.id}
            rank={i + 1}
            base={base}
            candidate={c}
            feedback={feedback.summary(base.id, c.perfume.id)}
            voted={feedback.hasVoted(base.id, c.perfume.id)}
            onVote={(v) => onVote(c.perfume.id, v)}
          />
        ))}
      </div>
    </section>
  );
}
