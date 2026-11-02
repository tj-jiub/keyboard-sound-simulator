import { useId, useMemo, useState } from 'react';
import type { Perfume } from '../types';
import { normalize, searchPerfumes } from '../lib/search';

interface Props {
  perfumes: Perfume[];
  onSelect: (p: Perfume) => void;
}

export function SearchBox({ perfumes, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = useMemo(() => searchPerfumes(perfumes, query), [perfumes, query]);
  const showNotFound = normalize(query).length >= 2 && results.length === 0;

  const choose = (p: Perfume) => {
    onSelect(p);
    setQuery('');
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
  };

  return (
    <div className="search">
      <label htmlFor={`${listId}-input`} className="search-label">
        좋아하는 향수를 알려주세요
      </label>
      <input
        id={`${listId}-input`}
        className="search-input"
        type="search"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="예: 상탈 33, 블랑쉬, Gypsy Water"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
        onKeyDown={onKeyDown}
      />
      {results.length > 0 && (
        <ul id={listId} role="listbox" className="search-results">
          {results.map((p, i) => (
            <li
              key={p.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : undefined}
              onMouseDown={(e) => { e.preventDefault(); choose(p); }}
              onMouseEnter={() => setActive(i)}
            >
              <span className="result-name">{p.name}</span>
              <span className="result-brand">{p.brand}</span>
            </li>
          ))}
        </ul>
      )}
      {showNotFound && (
        <p className="search-empty" role="status">
          찾지 못했어요. 영문 이름으로도 검색해 보세요.
        </p>
      )}
    </div>
  );
}
