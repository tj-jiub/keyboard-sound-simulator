import type { Perfume } from '../types';
import raw from './perfumes.json';

/** scento/perfume-database (CC-BY-4.0) 인기 상위 150개 + 한글 별칭 초안. */
export const PERFUMES = raw as Perfume[];
export const PERFUMES_BY_ID = new Map(PERFUMES.map((p) => [p.id, p]));

export const ATTRIBUTION = {
  label: 'Scento',
  url: 'https://www.scento.com/perfume-database',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
};
