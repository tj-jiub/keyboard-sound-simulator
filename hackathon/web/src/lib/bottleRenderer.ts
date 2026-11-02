import * as THREE from 'three';
import type { Perfume } from '../types';
import { buildBottle, configureRenderer, createStage, disposeObject, isWebGLAvailable } from './bottle3d';

/*
 * 진열대용: WebGL 컨텍스트 하나로 병을 한 개씩 그려 이미지로 바꾼다.
 * (향수마다 캔버스를 만들면 브라우저 WebGL 컨텍스트 한도를 넘는다.)
 */

const W = 320;
const H = 400;

let renderer: THREE.WebGLRenderer | null = null;
let stage: ReturnType<typeof createStage> | null = null;
const cache = new Map<string, Promise<string | null>>();
let chain: Promise<unknown> = Promise.resolve();

export const bottleImagesSupported = isWebGLAvailable();

function ensure() {
  if (renderer && stage) return { renderer, stage };
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(W, H, false);
  configureRenderer(renderer);
  stage = createStage(renderer);
  return { renderer, stage };
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function renderBottleImage(p: Perfume): Promise<string | null> {
  if (!bottleImagesSupported) return Promise.resolve(null);
  const hit = cache.get(p.id);
  if (hit) return hit;
  const job = chain.then(async () => {
    await nextFrame(); // 한 프레임씩 나눠서 화면이 멈추지 않게
    try {
      const { renderer: r, stage: s } = ensure();
      const bottle = buildBottle(p);
      bottle.rotation.y = -0.38;
      s.scene.add(bottle);
      r.render(s.scene, s.camera);
      const url = r.domElement.toDataURL('image/png');
      s.scene.remove(bottle);
      disposeObject(bottle);
      return url;
    } catch {
      return null;
    }
  });
  chain = job;
  cache.set(p.id, job);
  return job;
}
