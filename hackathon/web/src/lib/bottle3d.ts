import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Perfume } from '../types';
import { hash, paletteFor } from './coverStyle';

/*
 * 코드로 만든 범용 향수병 6종. 실제 브랜드 병을 본뜨지 않는다.
 * 유리(투과) + 향 계열 색 액체 + 캡 + 이름 라벨.
 */

export const BOTTLE_SHAPES = ['flat', 'column', 'orb', 'flask', 'hex', 'apothecary'] as const;
export type BottleShape = typeof BOTTLE_SHAPES[number];

export function shapeFor(id: string): BottleShape {
  return BOTTLE_SHAPES[hash(`${id}:bottle`) % BOTTLE_SHAPES.length];
}

const CAP_COLORS = [
  { color: '#c9a96e', metalness: 1, roughness: 0.28 }, // 골드
  { color: '#d9d9d9', metalness: 1, roughness: 0.22 }, // 실버
  { color: '#151515', metalness: 0.2, roughness: 0.5 }, // 블랙
];

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined' || /jsdom/i.test(navigator.userAgent)) return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function labelTexture(p: Perfume): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f7f3ec';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(0,0,0,.18)';
  g.lineWidth = 3;
  g.strokeRect(14, 14, c.width - 28, c.height - 28);
  g.fillStyle = '#141414';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // 이름이 길면 글자 크기를 줄여 한 줄 또는 두 줄로
  const words = p.name.split(' ');
  const lines: string[] = [];
  let cur = '';
  let size = 64;
  g.font = `600 ${size}px Inter Tight, Helvetica, Arial, sans-serif`;
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (g.measureText(next).width > 420 && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  lines.push(cur);
  if (lines.length > 2) { size = 44; }
  g.font = `600 ${size}px Inter Tight, Helvetica, Arial, sans-serif`;
  const shown = lines.slice(0, 3);
  const top = 140 - ((shown.length - 1) * size * 0.55);
  shown.forEach((l, i) => g.fillText(l, c.width / 2, top + i * size * 1.1, 460));
  g.font = '500 30px Inter Tight, Helvetica, Arial, sans-serif';
  g.fillStyle = 'rgba(0,0,0,.6)';
  g.fillText(p.brand.toUpperCase(), c.width / 2, 262, 460);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function lathe(points: [number, number][], segments = 64): THREE.LatheGeometry {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments);
}

/** 병 하나를 만든다. 높이는 대략 -1.1 ~ 1.3 */
export function buildBottle(p: Perfume): THREE.Group {
  const pal = paletteFor(p.family);
  const shape = shapeFor(p.id);
  const capStyle = CAP_COLORS[hash(`${p.id}:cap`) % CAP_COLORS.length];
  const liquidColor = new THREE.Color(pal.accent).lerp(new THREE.Color(pal.bg), 0.5);

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.6, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: 0.05, transparent: true,
  });
  const liquid = new THREE.MeshPhysicalMaterial({
    color: liquidColor, roughness: 0.15, transmission: 0.55, thickness: 1.2, ior: 1.33, transparent: true,
  });
  const cap = new THREE.MeshStandardMaterial(capStyle);
  const label = new THREE.MeshStandardMaterial({ map: labelTexture(p), roughness: 0.7 });

  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, y = 0, z = 0, scale?: [number, number, number]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, y, z);
    if (scale) m.scale.set(...scale);
    g.add(m);
    return m;
  };

  let labelZ = 0.5;
  let labelW = 0.95;
  let labelY = -0.15;

  switch (shape) {
    case 'flat':
      add(new RoundedBoxGeometry(1.5, 1.7, 0.7, 4, 0.14), glass, -0.25);
      add(new RoundedBoxGeometry(1.32, 1.3, 0.54, 3, 0.1), liquid, -0.42);
      add(new THREE.CylinderGeometry(0.16, 0.16, 0.25, 24), glass, 0.68);
      add(new RoundedBoxGeometry(0.62, 0.55, 0.62, 3, 0.04), cap, 1.02);
      labelZ = 0.355; labelW = 1.05;
      break;
    case 'column':
      add(new THREE.CylinderGeometry(0.58, 0.58, 1.9, 64), glass, -0.2);
      add(new THREE.CylinderGeometry(0.5, 0.5, 1.45, 64), liquid, -0.4);
      add(new THREE.CylinderGeometry(0.42, 0.42, 0.55, 48), cap, 1.03);
      labelZ = 0.59; labelW = 0.82;
      break;
    case 'orb':
      add(new THREE.SphereGeometry(0.88, 64, 48), glass, -0.25);
      add(new THREE.SphereGeometry(0.76, 64, 48), liquid, -0.3, 0, [1, 0.92, 1]);
      add(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 24), glass, 0.68);
      add(new THREE.SphereGeometry(0.34, 48, 32), cap, 0.98);
      labelZ = 0.9; labelW = 0.82; labelY = -0.25;
      break;
    case 'flask':
      add(new THREE.CylinderGeometry(0.78, 0.78, 1.55, 64), glass, -0.3, 0, [1, 1, 0.42]);
      add(new THREE.CylinderGeometry(0.68, 0.68, 1.2, 64), liquid, -0.45, 0, [1, 1, 0.34]);
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 24), glass, 0.55);
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.85, 32), cap, 1.05);
      labelZ = 0.335; labelW = 0.95;
      break;
    case 'hex':
      add(new THREE.CylinderGeometry(0.78, 0.78, 1.65, 6), glass, -0.25).rotation.y = Math.PI / 6;
      add(new THREE.CylinderGeometry(0.66, 0.66, 1.25, 6), liquid, -0.42).rotation.y = Math.PI / 6;
      add(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 24), glass, 0.68);
      add(new THREE.CylinderGeometry(0.42, 0.46, 0.55, 8), cap, 1.02);
      labelZ = 0.68; labelW = 0.72;
      break;
    case 'apothecary': {
      const body: [number, number][] = [[0, -1.1], [0.72, -1.1], [0.78, -1.0], [0.78, 0.25], [0.6, 0.48], [0.2, 0.62], [0.18, 0.8], [0, 0.8]];
      add(lathe(body), glass);
      const inner: [number, number][] = [[0, -1.02], [0.68, -1.02], [0.7, -0.95], [0.7, 0.1], [0, 0.1]];
      add(lathe(inner), liquid);
      add(new THREE.SphereGeometry(0.3, 48, 32), cap, 1.05);
      add(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 24), cap, 0.82);
      labelZ = 0.79; labelW = 0.86; labelY = -0.4;
      break;
    }
  }

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(labelW, labelW * 0.625), label);
  plane.position.set(0, labelY, labelZ + 0.004);
  g.add(plane);
  return g;
}

export function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    mats.forEach((mat) => {
      const map = (mat as THREE.MeshStandardMaterial).map;
      if (map) map.dispose();
      mat.dispose();
    });
  });
}

export function createStage(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2.5, 3, 4);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35));
  const camera = new THREE.PerspectiveCamera(28, 4 / 5, 0.1, 50);
  camera.position.set(0, 0.25, 6.4);
  camera.lookAt(0, 0.05, 0);
  return { scene, camera };
}

export function configureRenderer(renderer: THREE.WebGLRenderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
}
