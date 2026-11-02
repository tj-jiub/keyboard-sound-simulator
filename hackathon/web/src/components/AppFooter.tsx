import { ATTRIBUTION } from '../data/perfumes';

export function AppFooter() {
  return (
    <footer className="footer">
      <p>노트가 비슷해도 실제 느낌은 다를 수 있어요. 최종 선택은 시향으로 확인해 주세요.</p>
      <p>
        향수 데이터: <a href={ATTRIBUTION.url} target="_blank" rel="noreferrer">{ATTRIBUTION.label}</a>
        {' · '}
        <a href={ATTRIBUTION.licenseUrl} target="_blank" rel="noreferrer">{ATTRIBUTION.license}</a>
        {' · '}데모 매장 재고는 가상 데이터입니다
      </p>
    </footer>
  );
}
