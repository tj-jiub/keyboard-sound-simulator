import { useState } from 'react';
import type { FeedbackSummary, Verdict } from '../types';
import { MIN_FEEDBACK_TO_SHOW } from '../lib/feedbackStore';

interface Props {
  baseName: string;
  summary: FeedbackSummary;
  voted: boolean;
  onVote: (v: Verdict) => void;
}

export function FeedbackControl({ baseName, summary, voted, onVote }: Props) {
  const [open, setOpen] = useState(false);

  const summaryText = summary.total >= MIN_FEEDBACK_TO_SHOW
    ? `맡아본 ${summary.total}명 중 ${summary.similar}명이 비슷하다고 했어요`
    : '아직 시향 데이터가 부족해요';

  return (
    <div className="feedback">
      <p className="feedback-summary">{summaryText}</p>
      {voted ? (
        <p className="feedback-thanks" role="status">고마워요! 다음 분들께 도움이 돼요</p>
      ) : !open ? (
        <button type="button" className="ghost-button" onClick={() => setOpen(true)}>
          맡아봤어요
        </button>
      ) : (
        <div className="feedback-choices" role="group" aria-label={`${baseName}와 비교한 느낌`}>
          <button type="button" className="choice" onClick={() => onVote('similar')}>비슷했어요</button>
          <button type="button" className="choice" onClick={() => onVote('different')}>달랐어요</button>
        </div>
      )}
    </div>
  );
}
