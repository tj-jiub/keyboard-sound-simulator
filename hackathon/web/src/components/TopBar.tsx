import type { Perfume, Store } from '../types';
import { SearchBox } from './SearchBox';

interface Props {
  store: Store;
  perfumes: Perfume[];
  onSelect: (p: Perfume) => void;
  onStaff: () => void;
}

export function TopBar({ store, perfumes, onSelect, onStaff }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="wordmark">Scent Shelf</span>
        <span className="topbar-store">{store.name}</span>
      </div>
      <SearchBox perfumes={perfumes} onSelect={onSelect} />
      <button type="button" className="pill pill-dark topbar-cta" onClick={onStaff}>
        재고 업로드
      </button>
    </header>
  );
}
