import type { StockItem, Store } from '../types';

/*
 * 가상 데모 매장. 실제 Kinfolk 재고가 아니다 (명세 12장: 발표에서 가상 재고임을 밝힌다).
 * 향수 데이터 자체는 scento 데이터셋의 실데이터다.
 */

export const DEMO_STORE: Store = { id: 'demo', name: '성수 데모 매장', slug: 'demo' };

/** "어제 마감 기준" 표시용. */
export const DEMO_STOCK_UPDATED_AT = new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString();

const rows: [string, string, boolean][] = [
  ['le-labo-santal-33', 'A-1', true],
  ['le-labo-another-13', 'A-2', true],
  ['le-labo-the-noir-29', 'A-3', true],
  ['byredo-gypsy-water', 'B-1', true],
  ['byredo-blanche', 'B-2', true],
  ['byredo-mojave-ghost', 'B-3', true],
  ['byredo-bal-dafrique', 'B-4', true],
  ['byredo-super-cedar', 'B-5', true],
  ['byredo-rose-of-no-mans-land', 'B-6', true],
  ['diptyque-tam-dao', 'C-1', true],
  ['diptyque-orpheon', 'C-2', true],
  ['jo-malone-wood-sage-and-sea-salt', 'D-1', true],
  ['jo-malone-english-pear-and-freesia', 'D-2', true],
  ['jo-malone-peony-and-blush-suede', 'D-3', true],
  ['maison-margiela-replica-by-the-fireplace', 'E-1', true],
  ['maison-margiela-replica-lazy-sunday-morning', 'E-2', true],
  ['maison-margiela-replica-beach-walk', 'E-3', false],
  ['tom-ford-neroli-portofino', 'F-1', true],
  ['tom-ford-soleil-blanc', 'F-2', true],
  ['mfk-aqua-universalis', 'F-3', true],
  ['hermes-un-jardin-sur-le-nil', 'F-4', true],
];

export const DEMO_STOCK: StockItem[] = rows.map(([perfumeId, shelf, inStock]) => ({ perfumeId, shelf, inStock }));

/** 데모에서 "맡아본 N명 중 M명" 표시를 보여주기 위한 가상 시드. */
export const DEMO_FEEDBACK_SEED = {
  'le-labo-santal-33>diptyque-tam-dao': { total: 5, similar: 4 },
  'le-labo-santal-33>byredo-super-cedar': { total: 3, similar: 1 },
};
