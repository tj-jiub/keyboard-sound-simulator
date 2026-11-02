import { useEffect, useState } from 'react';

/** 선반 한 칸에 놓을 개수: 휴대폰 3, 태블릿 4, 데스크톱 5. */
function compute(width: number): number {
  if (width < 640) return 3;
  if (width < 1024) return 4;
  return 5;
}

export function usePerRow(): number {
  const [n, setN] = useState(() => (typeof window === 'undefined' ? 5 : compute(window.innerWidth)));
  useEffect(() => {
    const on = () => setN(compute(window.innerWidth));
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return n;
}
