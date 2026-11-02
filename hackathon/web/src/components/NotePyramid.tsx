import type { Perfume } from '../types';

interface Props {
  notes: Perfume['notes'];
  /** 기준 향수와 겹치는 노트는 강조한다. */
  highlight?: string[];
  /** 피라미드가 없을 때 대신 보여줄 전체 노트 */
  allNotes?: string[];
}

const LEVELS: { key: keyof Perfume['notes']; label: string }[] = [
  { key: 'top', label: '탑' },
  { key: 'heart', label: '미들' },
  { key: 'base', label: '베이스' },
];

export function NotePyramid({ notes, highlight = [], allNotes }: Props) {
  const hl = new Set(highlight.map((n) => n.toLowerCase()));
  const hasPyramid = LEVELS.some((l) => notes[l.key].length > 0);
  if (!hasPyramid) {
    if (!allNotes?.length) return <p className="muted">노트 정보가 없어요</p>;
    return (
      <dl className="pyramid">
        <div className="pyramid-row">
          <dt>노트</dt>
          <dd>
            {allNotes.map((n) => (
              <span key={n} className={hl.has(n.toLowerCase()) ? 'note note-shared' : 'note'}>{n}</span>
            ))}
          </dd>
        </div>
      </dl>
    );
  }
  return (
    <dl className="pyramid">
      {LEVELS.map(({ key, label }) => (
        <div key={key} className="pyramid-row">
          <dt>{label}</dt>
          <dd>
            {notes[key].map((n) => (
              <span key={n} className={hl.has(n.toLowerCase()) ? 'note note-shared' : 'note'}>
                {n}
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
