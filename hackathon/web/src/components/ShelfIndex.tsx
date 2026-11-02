import type { ShelfEntry } from './ShelfWall';

interface Props {
  entries: ShelfEntry[];
  ranks: Map<string, number>;
  onOpen: (perfumeId: string, rect: DOMRect) => void;
}

/** 하단 인덱스: 진열 위치와 이름. 후보는 진하게. */
export function ShelfIndex({ entries, ranks, onOpen }: Props) {
  const focusing = ranks.size > 0;
  return (
    <nav className="index" aria-label="진열 위치 목록">
      <ol>
        {entries.map(({ perfume, stock }) => {
          const rank = ranks.get(perfume.id);
          return (
            <li key={perfume.id} data-muted={(focusing && !rank) || !stock.inStock || undefined}>
              <button type="button" onClick={(e) => onOpen(perfume.id, e.currentTarget.getBoundingClientRect())}>
                <span className="index-shelf">{stock.shelf}{rank ? ` · ${rank}` : ''}</span>
                <span className="index-name">{perfume.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
