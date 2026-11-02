import { useState } from 'react';
import type { StockItem } from '../types';
import { parseStockCsv } from '../lib/stockCsv';

interface Props {
  knownIds: Set<string>;
  onApply: (items: StockItem[]) => void;
}

export function StockUploader({ knownIds, onApply }: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const [applied, setApplied] = useState<number | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { items, errors: errs } = parseStockCsv(await file.text(), knownIds);
    setErrors(errs);
    if (items.length) {
      onApply(items);
      setApplied(items.length);
    } else {
      setApplied(null);
    }
    e.target.value = '';
  };

  return (
    <details className="staff">
      <summary>직원용 · 마감 재고 업로드</summary>
      <p className="muted">
        CSV 헤더: <code>perfume_id,shelf,in_stock</code> (in_stock: 1/0)
      </p>
      <input type="file" accept=".csv,text/csv" onChange={onFile} aria-label="재고 CSV 파일" />
      {applied !== null && <p role="status">{applied}개 재고를 반영했어요</p>}
      {errors.length > 0 && (
        <ul className="errors">
          {errors.slice(0, 5).map((er) => <li key={er}>{er}</li>)}
          {errors.length > 5 && <li>외 {errors.length - 5}건</li>}
        </ul>
      )}
    </details>
  );
}
