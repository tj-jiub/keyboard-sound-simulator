import type { CSSProperties } from 'react';
import type { Perfume } from '../types';
import { hash, paletteFor, variantFor } from '../lib/coverStyle';

interface Props {
  perfume: Perfume;
  /** 시향 순서 스티커 (1부터) */
  rank?: number;
}

/** 진열대 위 향수 한 개의 "앞면" 아트. 크기는 부모가 정한다(컨테이너 단위 사용). */
export function PerfumeCover({ perfume, rank }: Props) {
  const pal = paletteFor(perfume.family);
  const variant = variantFor(perfume.id);
  const seed = hash(perfume.name);
  const style = {
    '--c-bg': pal.bg,
    '--c-fg': pal.fg,
    '--c-accent': pal.accent,
    '--c-rot': `${(seed % 40) - 20}deg`,
    '--c-x': `${20 + (seed % 60)}%`,
    '--c-y': `${15 + ((seed >> 8) % 60)}%`,
  } as CSSProperties;

  return (
    <div className={`cover cover-${variant}`} style={style}>
      <div className="cover-art" aria-hidden="true" />
      <span className="cover-name">{perfume.name}</span>
      <span className="cover-brand">{perfume.brand}</span>
      <span className="cover-family">{perfume.family}</span>
      {rank !== undefined && (
        <span className="sticker" aria-hidden="true">
          <span className="sticker-small">시향</span>
          <span className="sticker-num">{rank}</span>
        </span>
      )}
    </div>
  );
}
