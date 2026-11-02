import type { Perfume } from '../types';

interface Props {
  perfume: Perfume;
  onClear: () => void;
}

export function SelectedPerfume({ perfume, onClear }: Props) {
  return (
    <section className="selected" aria-label="기준 향수">
      <div>
        <p className="eyebrow">이 향과 비슷한 것</p>
        <p className="selected-name">
          {perfume.name} <span className="selected-brand">{perfume.brand}</span>
        </p>
        <p className="selected-notes">{perfume.allNotes.slice(0, 6).join(' · ')}</p>
      </div>
      <button type="button" className="ghost-button" onClick={onClear}>
        다시 검색
      </button>
    </section>
  );
}
