import type { Candidate, FeedbackSummary, Perfume, Verdict } from '../types';
import { SimilarityMeter } from './SimilarityMeter';
import { NotePyramid } from './NotePyramid';
import { SourceBadge } from './SourceBadge';
import { FeedbackControl } from './FeedbackControl';

interface Props {
  rank: number;
  base: Perfume;
  candidate: Candidate;
  feedback: FeedbackSummary;
  voted: boolean;
  onVote: (v: Verdict) => void;
}

export function CandidateCard({ rank, base, candidate, feedback, voted, onVote }: Props) {
  const { perfume, stock, similarity, sharedNotes, difference } = candidate;
  return (
    <article className="card" aria-labelledby={`cand-${perfume.id}`}>
      <div className="card-top">
        <span className="rank" aria-label={`${rank}번째 후보`}>{rank}</span>
        <div className="card-title">
          <p className="card-brand">{perfume.brand}</p>
          <h3 id={`cand-${perfume.id}`}>{perfume.name}</h3>
        </div>
        <span className="shelf" aria-label={`진열 위치 ${stock.shelf}`}>
          <span className="shelf-label">위치</span>
          {stock.shelf}
        </span>
      </div>

      <SimilarityMeter value={similarity} />
      <p className="difference">{difference}</p>
      {sharedNotes.length > 0 && (
        <p className="shared">
          <span className="muted">겹치는 노트</span> {sharedNotes.join(' · ')}
        </p>
      )}

      <details className="card-details">
        <summary>노트 자세히 보기</summary>
        <NotePyramid notes={perfume.notes} highlight={sharedNotes} />
        <p className="muted desc">{perfume.description}</p>
      </details>

      <div className="card-bottom">
        <SourceBadge source={perfume.source} />
      </div>

      <FeedbackControl baseName={base.name} summary={feedback} voted={voted} onVote={onVote} />
    </article>
  );
}
