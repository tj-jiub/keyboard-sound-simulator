import type { Candidate, Perfume, StockItem } from '../types';

/*
 * 느낌 검색: 한국어 표현 사전 → 향수 특성(character 태그·계절·노트) 가중치.
 * 사전에 없는 표현은 알아듣지 못한다. 필요하면 TERMS에 추가한다.
 */

/** scento 데이터의 character 태그 21종 → 화면 표시용 한국어 */
export const TAG_KO: Record<string, string> = {
  floral: '꽃향', warm: '따뜻함', citrusy: '시트러스', fresh: '산뜻함', sweet: '달콤함',
  spicy: '스파이시', woody: '우디', fruity: '과일향', earthy: '흙내음', creamy: '크리미',
  herbal: '허브', powdery: '파우더리', resinous: '레진', musky: '머스크', green: '그린',
  amber: '앰버', smoky: '스모키', clean: '깨끗함', salty: '짭짤함', leathery: '가죽', rich: '풍성함',
};

const SEASON_KO: Record<string, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };

/** 차원 키: 태그는 그대로, 계절은 `season:x`, 노트는 `note:x`(영문 노트 이름 부분 일치) */
type Weights = Record<string, number>;

interface Term {
  label: string;
  words: string[];
  weights: Weights;
}

const TERMS: Term[] = [
  { label: '포근함', words: ['포근', '따뜻', '아늑', '담요', '니트', '스웨터', '안기'], weights: { warm: 1, musky: 0.8, creamy: 0.6, powdery: 0.5, amber: 0.4 } },
  { label: '상큼함', words: ['상큼', '산뜻', '상쾌', '발랄', '톡톡', '생기'], weights: { citrusy: 1, fresh: 0.8, fruity: 0.4 } },
  { label: '시원함', words: ['시원', '청량', '쿨한', '여름바람'], weights: { fresh: 1, citrusy: 0.4, clean: 0.4, salty: 0.3 } },
  { label: '바다', words: ['바다', '바닷', '파도', '해변', '마린', '아쿠아'], weights: { salty: 1, fresh: 0.8, 'note:sea': 0.8, 'note:marine': 0.8, 'note:salt': 0.6 } },
  { label: '비누향', words: ['비누', '깨끗', '세탁', '빨래', '섬유유연제', '샤워', '살균', '코튼', '면 '], weights: { clean: 1, musky: 0.8, powdery: 0.6, fresh: 0.5, 'note:aldehyde': 0.8, 'note:cotton': 0.6 } },
  { label: '숲·나무', words: ['숲', '나무', '우디', '산림', '삼나무', '편백', '피톤치드', '연필'], weights: { woody: 1, earthy: 0.5, green: 0.4, 'note:cedar': 0.6, 'note:sandalwood': 0.4 } },
  { label: '풀·초록', words: ['풀', '초록', '잔디', '싱그', '잎', '정원'], weights: { green: 1, herbal: 0.6, fresh: 0.5 } },
  { label: '비 오는 날', words: ['비오는', '비 오는', '비온', '비 온', '빗', '젖은', '장마', '흙'], weights: { earthy: 1, green: 0.6, fresh: 0.4, woody: 0.3, 'note:vetiver': 0.6, 'note:moss': 0.6 } },
  { label: '꽃', words: ['꽃', '플로럴', '부케', '꽃다발'], weights: { floral: 1 } },
  { label: '장미', words: ['장미', '로즈'], weights: { floral: 0.6, 'note:rose': 1 } },
  { label: '달콤함', words: ['달달', '달콤', '디저트', '사탕', '캔디', '꿀', '구르망', '달게', '달지', '단 향', '단향'], weights: { sweet: 1, creamy: 0.3, 'note:vanilla': 0.5 } },
  { label: '바닐라', words: ['바닐라'], weights: { sweet: 0.5, creamy: 0.4, 'note:vanilla': 1 } },
  { label: '과일', words: ['과일', '복숭아', '체리', '사과', '베리', '과즙'], weights: { fruity: 1, sweet: 0.3 } },
  { label: '시트러스', words: ['시트러스', '레몬', '오렌지', '자몽', '귤', '베르가못', '라임'], weights: { citrusy: 1, fresh: 0.5 } },
  { label: '스파이시', words: ['스파이시', '매콤', '후추', '시나몬', '계피', '향신료'], weights: { spicy: 1, warm: 0.4 } },
  { label: '파우더리', words: ['파우더', '분내', '화장품', '아기', '베이비', '보송'], weights: { powdery: 1, musky: 0.4, clean: 0.3, 'note:iris': 0.5 } },
  { label: '스모키', words: ['스모키', '연기', '모닥불', '벽난로', '캠프', '장작', '향초', '인센스'], weights: { smoky: 1, woody: 0.5, resinous: 0.4, leathery: 0.3, 'note:cade': 0.8, 'note:guaiac': 0.6, 'note:birch': 0.8, 'note:incense': 0.6, 'note:smok': 0.8 } },
  { label: '가죽', words: ['가죽', '레더'], weights: { leathery: 1, smoky: 0.4 } },
  { label: '살냄새', words: ['살냄새', '살결', '스킨', '머스크', '체취'], weights: { musky: 1, clean: 0.3, creamy: 0.3 } },
  { label: '허브', words: ['허브', '라벤더', '민트', '로즈마리', '세이지'], weights: { herbal: 1, fresh: 0.4, green: 0.3 } },
  { label: '차', words: ['홍차', '녹차', '찻잎', '티 ', '차 향', '차향'], weights: { herbal: 0.5, fresh: 0.4, 'note:tea': 1 } },
  { label: '크리미', words: ['크리미', '부드러', '우유', '밀크', '코코넛'], weights: { creamy: 1, sweet: 0.3 } },
  { label: '묵직함', words: ['묵직', '무거', '진한', '중후', '고급', '깊은', '관능', '섹시'], weights: { resinous: 0.8, amber: 0.8, rich: 0.6, woody: 0.4, warm: 0.4 } },
  { label: '가벼움', words: ['가벼', '은은', '데일리', '부담없', '잔잔', '산들'], weights: { fresh: 0.6, clean: 0.6, citrusy: 0.3, resinous: -0.5, smoky: -0.5, amber: -0.4 } },
  { label: '봄', words: ['봄'], weights: { 'season:spring': 0.8 } },
  { label: '여름', words: ['여름'], weights: { 'season:summer': 0.8 } },
  { label: '가을', words: ['가을'], weights: { 'season:autumn': 0.8 } },
  { label: '겨울', words: ['겨울', '크리스마스', '연말'], weights: { 'season:winter': 0.8 } },
];

/** 단어 뒤에 오면 뜻을 뒤집는 표현 (예: "달지 않은", "무겁지 않게") */
const NEG_AFTER = ['않', '말고', '빼고', '없는', '없이', '싫'];
/** 단어 앞에 오면 뜻을 뒤집는 표현 (예: "안 단", "덜 달게") */
const NEG_BEFORE = ['안', '덜']; // 앞이 공백이거나 문장 처음일 때만 ("편안" 제외)

export interface MoodMatch {
  label: string;
  negated: boolean;
}

export interface MoodProfile {
  text: string;
  matches: MoodMatch[];
  weights: Weights;
}

export function parseMood(text: string): MoodProfile {
  const t = text.toLowerCase();
  const matches: MoodMatch[] = [];
  const weights: Weights = {};
  for (const term of TERMS) {
    let found: { at: number; len: number } | null = null;
    for (const w of term.words) {
      const at = t.indexOf(w);
      if (at >= 0) { found = { at, len: w.length }; break; }
    }
    if (!found) continue;
    const after = t.slice(found.at + found.len, found.at + found.len + 6);
    const negBefore = NEG_BEFORE.some((n) => {
      const head = t.slice(0, found!.at).trimEnd();
      if (!head.endsWith(n)) return false;
      const prev = head.slice(0, head.length - n.length);
      return prev === '' || /\s$/.test(prev);
    });
    const negated = negBefore || NEG_AFTER.some((n) => after.includes(n));
    const sign = negated ? -0.7 : 1;
    matches.push({ label: term.label, negated });
    for (const [k, v] of Object.entries(term.weights)) weights[k] = (weights[k] ?? 0) + v * sign;
  }
  return { text: text.trim(), matches, weights };
}

function has(p: Perfume, dim: string): boolean {
  if (dim.startsWith('season:')) return p.seasons.includes(dim.slice(7));
  if (dim.startsWith('note:')) {
    const n = dim.slice(5);
    return p.allNotes.some((x) => x.toLowerCase().includes(n));
  }
  return p.character.includes(dim);
}

export function moodScore(p: Perfume, mood: MoodProfile): { score: number; hits: string[] } {
  let score = 0;
  const hits: string[] = [];
  for (const [dim, w] of Object.entries(mood.weights)) {
    if (!has(p, dim)) continue;
    score += w;
    if (w > 0) hits.push(dim);
  }
  const maxPositive = Object.values(mood.weights).filter((w) => w > 0).reduce((a, b) => a + b, 0);
  return { score: maxPositive > 0 ? Math.max(0, score) / maxPositive : 0, hits };
}

function hitLabel(dim: string): string {
  if (dim.startsWith('season:')) return SEASON_KO[dim.slice(7)] ?? dim;
  if (dim.startsWith('note:')) return dim.slice(5);
  return TAG_KO[dim] ?? dim;
}

export function findMoodCandidates(
  mood: MoodProfile,
  stock: StockItem[],
  perfumesById: Map<string, Perfume>,
  limit = 5,
): Candidate[] {
  return stock
    .filter((s) => s.inStock)
    .flatMap((s) => {
      const perfume = perfumesById.get(s.perfumeId);
      if (!perfume) return [];
      const { score, hits } = moodScore(perfume, mood);
      if (score <= 0) return [];
      const labels = hits.filter((h) => !h.startsWith('note:')).map(hitLabel);
      const notes = perfume.allNotes.filter((n) => hits.some((h) => h.startsWith('note:') && n.toLowerCase().includes(h.slice(5))));
      const reason = labels.length
        ? `${labels.slice(0, 3).join('·')} 느낌이 있어요`
        : '찾는 노트가 들어 있어요';
      return [{ perfume, stock: s, similarity: score, sharedNotes: notes, difference: reason }];
    })
    .sort((a, b) => b.similarity - a.similarity || a.perfume.popularityRank - b.perfume.popularityRank)
    .slice(0, limit);
}
