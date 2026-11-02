import type { StockItem } from '../types';

export interface StockParseResult {
  items: StockItem[];
  errors: string[];
}

const TRUE = new Set(['1', 'true', 'y', 'yes', 'o', '있음']);
const FALSE = new Set(['0', 'false', 'n', 'no', 'x', '없음', '품절']);

/** 명세 F5: `perfume_id,shelf,in_stock` 헤더의 CSV를 파싱한다. */
export function parseStockCsv(text: string, knownIds: Set<string>): StockParseResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const errors: string[] = [];
  if (!lines.length) return { items: [], errors: ['빈 파일입니다'] };
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const iId = header.indexOf('perfume_id');
  const iShelf = header.indexOf('shelf');
  const iStock = header.indexOf('in_stock');
  if (iId < 0 || iShelf < 0 || iStock < 0) {
    return { items: [], errors: ['헤더는 perfume_id,shelf,in_stock 이어야 합니다'] };
  }
  const items: StockItem[] = [];
  lines.slice(1).forEach((line, idx) => {
    const row = idx + 2;
    const cols = line.split(',').map((c) => c.trim());
    const id = cols[iId];
    const flag = (cols[iStock] ?? '').toLowerCase();
    if (!id) { errors.push(`${row}행: perfume_id가 비어 있습니다`); return; }
    if (!knownIds.has(id)) { errors.push(`${row}행: 알 수 없는 향수 id "${id}"`); return; }
    if (!TRUE.has(flag) && !FALSE.has(flag)) { errors.push(`${row}행: in_stock 값 "${cols[iStock] ?? ''}"을 읽을 수 없습니다`); return; }
    items.push({ perfumeId: id, shelf: cols[iShelf] ?? '', inStock: TRUE.has(flag) });
  });
  return { items, errors };
}
