import { useId, useMemo, useState } from 'react';
import type { Perfume } from '../types';
import { normalize, searchPerfumes } from '../lib/search';
import { parseMood, type MoodProfile } from '../lib/mood';

interface Props {
  perfumes: Perfume[];
  onSelect: (p: Perfume) => void;
  onMood: (m: MoodProfile) => void;
}

const EXAMPLES = ['비 오는 날 포근한', '깨끗한 비누향', '상큼한 여름', '달지 않은 우디'];

type Option = { kind: 'mood'; mood: MoodProfile } | { kind: 'perfume'; perfume: Perfume };

export function SearchBox({ perfumes, onSelect, onMood }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const options: Option[] = useMemo(() => {
    const mood = parseMood(query);
    const named = searchPerfumes(perfumes, query, 6).map((perfume) => ({ kind: 'perfume' as const, perfume }));
    const moodOpt = mood.matches.length ? [{ kind: 'mood' as const, mood }] : [];
    // 이름이 정확히 맞으면 향수를 먼저, 아니면 느낌을 먼저
    return named.length && !moodOpt.length ? named : [...moodOpt, ...named];
  }, [perfumes, query]);

  const q = normalize(query);
  const showNotFound = q.length >= 2 && options.length === 0;
  const showExamples = focused && q.length === 0;

  const choose = (o: Option) => {
    if (o.kind === 'mood') onMood(o.mood); else onSelect(o.perfume);
    setQuery('');
    setActive(0);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setQuery(''); return; }
    if (!options.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % options.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + options.length) % options.length); }
    if (e.key === 'Enter') { e.preventDefault(); choose(options[active]); }
  };

  return (
    <div className="search">
      <svg className="search-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        className="search-input"
        type="search"
        role="combobox"
        aria-label="느낌이나 향수 이름으로 검색"
        aria-expanded={options.length > 0}
        aria-controls={listId}
        aria-activedescendant={options.length ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="어떤 느낌을 원하세요? 예: 비 오는 날 포근한"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {options.length > 0 && (
        <ul id={listId} role="listbox" className="search-results">
          {options.map((o, i) => (
            <li
              key={o.kind === 'mood' ? 'mood' : o.perfume.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={o.kind === 'mood' ? 'option-mood' : undefined}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
              onMouseEnter={() => setActive(i)}
            >
              {o.kind === 'mood' ? (
                <>
                  <span className="result-name">“{o.mood.text}” 느낌으로 찾기</span>
                  <span className="mood-chips">
                    {o.mood.matches.map((m) => (
                      <span key={m.label} className="chip" data-neg={m.negated || undefined}>
                        {m.negated ? `${m.label} 빼고` : m.label}
                      </span>
                    ))}
                  </span>
                </>
              ) : (
                <>
                  <span className="result-name">{o.perfume.name}</span>
                  <span className="result-brand">{o.perfume.brand}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {showExamples && (
        <div className="search-examples" role="listbox" aria-label="느낌 예시">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="chip chip-button"
              onMouseDown={(e) => { e.preventDefault(); choose({ kind: 'mood', mood: parseMood(ex) }); }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
      {showNotFound && (
        <p className="search-empty" role="status">
          알아듣지 못했어요. “포근한”, “상큼한”, “비누향”처럼 써 보세요.
        </p>
      )}
    </div>
  );
}
