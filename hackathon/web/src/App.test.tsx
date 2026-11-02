import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

describe('App 흐름: 검색 → 진열대 강조 → 꺼내 보기 → 피드백', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  afterEach(cleanup);

  it('처음엔 매장 진열대 전체가 보인다', () => {
    render(<App />);
    expect(screen.getByText('지금 이 매장 진열대')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /위치 [A-F]-\d/ }).length).toBeGreaterThan(10);
  });

  it('한글로 검색하면 후보에 시향 순위가 붙고, 꺼내서 뒤집어 피드백을 남긴다', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '상탈33' } });
    fireEvent.mouseDown(screen.getAllByRole('option')[0]);

    expect(screen.getByText(/와 비슷한 후보 \d개/)).toBeTruthy();
    const first = screen.getByRole('button', { name: /시향 1순위/ });
    fireEvent.click(first);

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('뒤집어 보기'));
    fireEvent.click(within(dialog).getByText('맡아봤어요'));
    fireEvent.click(within(dialog).getByText('비슷했어요'));
    expect(within(dialog).getByText(/고마워요/)).toBeTruthy();

    fireEvent.click(within(dialog).getByText('닫기'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('품절 향수는 순위가 붙지 않는다', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '상탈33' } });
    fireEvent.mouseDown(screen.getAllByRole('option')[0]);
    const soldout = screen.getByRole('button', { name: /Beach Walk.*품절/ });
    expect(soldout.getAttribute('aria-label')).not.toMatch(/순위/);
  });

  it('느낌으로 검색하면 느낌 후보를 보여준다', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '비 오는 날 포근한' } });
    const opt = screen.getByText(/느낌으로 찾기/);
    fireEvent.mouseDown(opt.closest('[role=option]')!);
    expect(screen.getByText(/느낌에 가까운 후보 \d개/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /시향 1순위/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/느낌 일치도/)).toBeTruthy();
  });

  it('알아듣지 못한 말은 안내 문구를 보여준다', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzqqq' } });
    expect(screen.getByText(/알아듣지 못했어요/)).toBeTruthy();
  });
});
