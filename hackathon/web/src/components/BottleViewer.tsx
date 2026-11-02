import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Perfume } from '../types';
import { buildBottle, configureRenderer, createStage, disposeObject, isWebGLAvailable } from '../lib/bottle3d';
import { PerfumeCover } from './PerfumeCover';

/** 꺼내 본 병: 천천히 돌고, 끌어서 돌려 볼 수 있다. */
export function BottleViewer({ perfume, active }: { perfume: Perfume; active: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [supported] = useState(isWebGLAvailable);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const host = hostRef.current;
    if (!supported || !host) return undefined;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    configureRenderer(renderer);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    host.appendChild(renderer.domElement);
    const { scene, camera } = createStage(renderer);
    const bottle = buildBottle(perfume);
    bottle.rotation.y = -0.38;
    scene.add(bottle);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let drag: { x: number; rot: number } | null = null;
    let velocity = reduce ? 0 : 0.004;
    const down = (e: PointerEvent) => { drag = { x: e.clientX, rot: bottle.rotation.y }; host.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (drag) bottle.rotation.y = drag.rot + (e.clientX - drag.x) * 0.012; };
    const up = () => { drag = null; };
    host.addEventListener('pointerdown', down);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', up);

    let raf = 0;
    const tick = () => {
      if (!drag && activeRef.current) bottle.rotation.y += velocity;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      velocity = 0;
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointerdown', down);
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', up);
      host.removeEventListener('pointercancel', up);
      disposeObject(bottle);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [perfume, supported]);

  if (!supported) return <PerfumeCover perfume={perfume} />;
  return <div className="bottle-viewer" ref={hostRef} aria-label={`${perfume.name} 병, 끌어서 돌려보기`} role="img" />;
}
