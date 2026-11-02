interface Props {
  /** 0~1 */
  value: number;
}

export function SimilarityMeter({ value }: Props) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="노트 유사도">
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="meter-value">노트 유사도 {pct}%</span>
    </div>
  );
}
