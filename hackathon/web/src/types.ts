export type DataSource = 'dataset' | 'manual' | 'ai';

export interface Perfume {
  id: string;
  brand: string;
  brandId: string;
  name: string;
  brandAliasesKo: string[];
  aliasesKo: string[];
  notes: { top: string[]; heart: string[]; base: string[] };
  allNotes: string[];
  family: string;
  character: string[];
  seasons: string[];
  description: string;
  popularityRank: number;
  source: DataSource;
  url?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
}

export interface StockItem {
  perfumeId: string;
  shelf: string;
  inStock: boolean;
}

export interface Candidate {
  perfume: Perfume;
  stock: StockItem;
  /** 0~1 */
  similarity: number;
  sharedNotes: string[];
  /** "A와 다른 점" 한 줄 */
  difference: string;
}

export type Verdict = 'similar' | 'different';

export interface FeedbackSummary {
  total: number;
  similar: number;
}
