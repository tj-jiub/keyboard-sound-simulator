import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

describe('App 흐름: 검색 → 후보 → 피드백', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  afterEach(cleanup);

  it('한글로 검색해 후보 카드를 보고 피드백을 남긴다', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '상탈33' } });
    fireEvent.mouseDown(screen.getAllByRole('option')[0]);

    expect(screen.getByText(/이 \d개만 맡아보세요/)).toBeTruthy();
    const cards = screen.getAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText('맡아봤어요')[0]);
    fireEvent.click(screen.getByText('비슷했어요'));
    expect(screen.getByText(/고마워요/)).toBeTruthy();
  });

  it('없는 이름은 안내 문구를 보여준다', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzqqq' } });
    expect(screen.getByText(/찾지 못했어요/)).toBeTruthy();
  });
});
