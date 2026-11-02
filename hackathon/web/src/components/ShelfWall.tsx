import type { Perfume, StockItem } from '../types';
import { PerfumeCover } from './PerfumeCover';
import { usePerRow } from '../hooks/usePerRow';

export interface ShelfEntry {
  perfume: Perfume;
  stock: StockItem;
}

interface Props {
  entries: ShelfEntry[];
  /** perfumeId → 시향 순서. 비어 있으면 모두 기본 상태. */
  ranks: Map<string, number>;
  onOpen: (perfumeId: string, rect: DOMRect) => void;
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

export function ShelfWall({ entries, ranks, onOpen }: Props) {
  const perRow = usePerRow();
  const focusing = ranks.size > 0;

  return (
    <div className="wall" data-focusing={focusing || undefined}>
      {chunk(entries, perRow).map((row, r) => (
        <div className="shelf" key={r} style={{ ['--per-row' as string]: perRow }}>
          <div className="shelf-items">
            {row.map(({ perfume, stock }) => {
              const rank = ranks.get(perfume.id);
              const state = !stock.inStock ? 'soldout' : focusing ? (rank ? 'pick' : 'dim') : 'idle';
              const label = `${perfume.brand} ${perfume.name}, 위치 ${stock.shelf}`
                + (rank ? `, 시향 ${rank}순위` : '')
                + (!stock.inStock ? ', 품절' : '');
              return (
                <button
                  key={perfume.id}
                  type="button"
                  className="shelf-item"
                  data-state={state}
                  aria-label={label}
                  onClick={(e) => onOpen(perfume.id, e.currentTarget.getBoundingClientRect())}
                >
                  <PerfumeCover perfume={perfume} rank={rank} />
                  {!stock.inStock && <span className="soldout-tag">품절</span>}
                </button>
              );
            })}
          </div>
          <div className="shelf-plank" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
