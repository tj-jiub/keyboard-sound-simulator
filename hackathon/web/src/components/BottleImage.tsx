import { useEffect, useState } from 'react';
import type { Perfume } from '../types';
import { bottleImagesSupported, renderBottleImage } from '../lib/bottleRenderer';
import { PerfumeCover } from './PerfumeCover';

/** 진열대 위 병 이미지. WebGL이 없으면 기존 커버 아트로 대체한다. */
export function BottleImage({ perfume }: { perfume: Perfume }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(!bottleImagesSupported);

  useEffect(() => {
    if (!bottleImagesSupported) return undefined;
    let alive = true;
    renderBottleImage(perfume).then((url) => {
      if (!alive) return;
      if (url) setSrc(url); else setFailed(true);
    });
    return () => { alive = false; };
  }, [perfume]);

  if (failed) return <div className="bottle-fallback"><PerfumeCover perfume={perfume} /></div>;
  return src
    ? <img className="bottle-img" src={src} alt="" draggable={false} />
    : <span className="bottle-placeholder" aria-hidden="true" />;
}
