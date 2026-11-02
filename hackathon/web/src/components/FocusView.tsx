import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Candidate, FeedbackSummary, Perfume, StockItem, Verdict } from '../types';
import { paletteFor } from '../lib/coverStyle';
import { BottleViewer } from './BottleViewer';
import { NotePyramid } from './NotePyramid';
import { SourceBadge } from './SourceBadge';
import { FeedbackControl } from './FeedbackControl';

interface Props {
  perfume: Perfume;
  stock: StockItem;
  originRect: DOMRect | null;
  base: Perfume | null;
  candidate: Candidate | null;
  /** 느낌 검색일 때 입력 문장 */
  moodText?: string;
  rank?: number;
  feedback: FeedbackSummary | null;
  voted: boolean;
  onVote: (v: Verdict) => void;
  onClose: () => void;
}

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** 선반에서 꺼낸 향수: 확대 → 뒤집으면 상세. */
export function FocusView({
  perfume, stock, originRect, base, candidate, moodText, rank, feedback, voted, onVote, onClose,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pal = paletteFor(perfume.family);

  // 선반 위치에서 가운데로 날아오는 애니메이션 (FLIP)
  const flyFrom = (el: HTMLElement, reverse: boolean) => {
    if (!originRect || reduceMotion() || typeof el.animate !== 'function') return null;
    const to = el.getBoundingClientRect();
    const dx = originRect.left + originRect.width / 2 - (to.left + to.width / 2);
    const dy = originRect.top + originRect.height / 2 - (to.top + to.height / 2);
    const s = originRect.width / to.width;
    const from = { transform: `translate(${dx}px, ${dy}px) scale(${s})` };
    const end = { transform: 'none' };
    return el.animate(reverse ? [end, from] : [from, end], {
      duration: reverse ? 320 : 480, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards',
    });
  };

  useLayoutEffect(() => {
    if (stageRef.current) flyFrom(stageRef.current, false);
  }, []);

  const close = () => {
    const anim = !flipped && stageRef.current ? flyFrom(stageRef.current, true) : null;
    if (anim) anim.onfinish = onClose; else onClose();
  };

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped]);

  return (
    <div className="focus" role="dialog" aria-modal="true" aria-labelledby="focus-title">
      <div className="focus-backdrop" onClick={close} />

      <aside className="focus-info">
        <p className="focus-brand">{perfume.brand}</p>
        <h2 id="focus-title">{perfume.name}</h2>
        <p className="focus-desc">{candidate ? candidate.difference : perfume.description}</p>
        <p className="focus-meta">
          위치 <strong>{stock.shelf}</strong>
          {rank ? <> · 시향 <strong>{rank}</strong>번째</> : null}
          {!stock.inStock ? <> · 품절</> : null}
        </p>
      </aside>

      <div className="focus-stage" ref={stageRef}>
        <div className="flipper" data-flipped={flipped || undefined}>
          <div className="face face-front" aria-hidden={flipped}>
            <BottleViewer perfume={perfume} active={!flipped} />
            {rank !== undefined && (
              <span className="sticker sticker-focus" aria-hidden="true">
                <span className="sticker-small">시향</span>
                <span className="sticker-num">{rank}</span>
              </span>
            )}
          </div>
          <div
            className="face face-back"
            aria-hidden={!flipped}
            style={{ background: pal.deep, color: '#f4efe8' }}
          >
            <div className="back-head">
              <span>{perfume.brand}</span>
              <span className="back-shelf">{stock.shelf}</span>
            </div>
            <p className="back-title">{perfume.name}</p>

            {candidate && (base || moodText) && (
              <div className="back-compare">
                <p className="back-label">{base ? `${base.name}와 비교` : `“${moodText}” 느낌과 비교`}</p>
                <p className="back-sim">
                  {base ? '노트 유사도' : '느낌 일치도'} {Math.round(candidate.similarity * 100)}%
                </p>
                <p>{candidate.difference}</p>
                {candidate.sharedNotes.length > 0 && (
                  <p className="back-shared">겹치는 노트 · {candidate.sharedNotes.join(', ')}</p>
                )}
              </div>
            )}

            <NotePyramid notes={perfume.notes} highlight={candidate?.sharedNotes} allNotes={perfume.allNotes} />

            <div className="back-foot">
              <SourceBadge source={perfume.source} />
              <span>{perfume.seasons.join(' · ')}</span>
            </div>

            {candidate && base && feedback && (
              <FeedbackControl baseName={base.name} summary={feedback} voted={voted} onVote={onVote} />
            )}
          </div>
        </div>
      </div>

      <div className="focus-actions">
        <button type="button" className="pill pill-dark" onClick={() => setFlipped((f) => !f)}>
          {flipped ? '앞면' : '뒤집어 보기'}
        </button>
        <button type="button" className="pill" ref={closeRef} onClick={close}>
          닫기
        </button>
      </div>
    </div>
  );
}
