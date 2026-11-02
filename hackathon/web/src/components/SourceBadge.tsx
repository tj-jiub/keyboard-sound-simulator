import type { DataSource } from '../types';

const LABEL: Record<DataSource, string> = {
  dataset: 'Scento 데이터',
  manual: '매장 직접 입력',
  ai: 'AI 추정',
};

export function SourceBadge({ source }: { source: DataSource }) {
  return <span className={`badge badge-${source}`}>{LABEL[source]}</span>;
}
