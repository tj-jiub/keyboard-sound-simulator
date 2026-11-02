import type { Store } from '../types';

interface Props {
  store: Store;
  stockUpdatedAt: string;
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 마감`;
}

export function StoreHeader({ store, stockUpdatedAt }: Props) {
  return (
    <header className="store-header">
      <p className="eyebrow">지금 이 매장에서</p>
      <h1>{store.name}</h1>
      <p className="stock-notice">
        재고 기준: {formatUpdatedAt(stockUpdatedAt)} · 당일 품절은 직원에게 확인해 주세요
      </p>
    </header>
  );
}
