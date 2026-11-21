import raw from './fatiha.json';

export type Lemma = { ar: string; kind: string; count: number };
export type Word = {
  loc: string;
  ar: string;
  en: string;
  ur: string;
  translit: string;
  morph: string;
  audio: string | null;
  root: string | null;
  lemma: Lemma | null;
};
export type Ayah = { key: string; ayah: number; text: string; words: Word[] };
export type RootInfo = {
  letters: string;
  count: number;
  lemmas: { ar: string; kind: string; count: number; heading?: string; example: { loc: string; ar: string | null; gloss: string; translit: string } | null }[];
};
export type Surah = { n: number; ar: string; en: string; meaningEn: string; meaningUr: string; ayahs: number; words: number; juzAmma: boolean };

export const DATA = raw as unknown as {
  totalWords: number;
  surahs: Surah[];
  surah: { number: number; nameAr: string; nameEn: string };
  ayahs: Ayah[];
  roots: Record<string, RootInfo>;
};

export const AYAHS = DATA.ayahs;
export const WORDS: Word[] = AYAHS.flatMap((a) => a.words);
// The Corpus lists root letters spaced out (ع ل م); show them joined, as Arabic dictionaries do (علم).
for (const r of Object.values(DATA.roots)) r.letters = r.letters.replace(/\s+/g, '');
export const ROOTS = DATA.roots;

// Word-by-word recitation streams from the Quran.com CDN (not stored in the repo);
// the PWA will cache each clip on the device the first time it plays.
export const audioUrl = (w: Word) => (w.audio ? `https://audio.qurancdn.com/wbw/${w.audio}` : undefined);

let current: HTMLAudioElement | null = null;
export function playWord(w: Word) {
  const url = audioUrl(w);
  if (!url) return;
  current?.pause();
  current = new Audio(url);
  current.play().catch(() => {});
}

// A "vocab item" is what you learn: the corpus lemma when there is one, otherwise the surface word.
export const itemId = (w: Word) => (w.lemma ? `L:${w.lemma.ar}` : `W:${w.ar}`);
export const ayahOf = (w: Word) => AYAHS.find((a) => w.loc.startsWith(a.key + ':'))!;

export type Status = 'new' | 'learning' | 'known';

// ---- SAMPLE progress (prototype only; real progress will live in IndexedDB) ----
const SAMPLE_KNOWN = ['1:1:2', '1:2:3', '1:1:3', '1:1:4', '1:2:1', '1:4:2'];
const SAMPLE_LEARNING = ['1:4:3', '1:5:2', '1:6:1', '1:6:2'];
const statusById = new Map<string, Status>();
for (const loc of SAMPLE_KNOWN) statusById.set(itemId(WORDS.find((w) => w.loc === loc)!), 'known');
for (const loc of SAMPLE_LEARNING) statusById.set(itemId(WORDS.find((w) => w.loc === loc)!), 'learning');
export const statusOf = (w: Word): Status => statusById.get(itemId(w)) ?? 'new';

// unique vocab items in Al-Fatiha, most frequent across the Quran first
export const ITEMS = (() => {
  const seen = new Map<string, { id: string; word: Word; freq: number; occurrences: Word[] }>();
  for (const w of WORDS) {
    const id = itemId(w);
    const e = seen.get(id);
    if (e) e.occurrences.push(w);
    else seen.set(id, { id, word: w, freq: w.lemma?.count ?? 0, occurrences: [w] });
  }
  return [...seen.values()].sort((a, b) => b.freq - a.freq);
})();

export const surahUnderstanding = () => {
  const known = WORDS.filter((w) => statusOf(w) === 'known').length;
  return Math.round((known / WORDS.length) * 100);
};

// share of all words in the Quran covered by the lemmas you know (counts from the Quranic Arabic Corpus)
export const quranCoverage = () => {
  const known = ITEMS.filter((i) => statusOf(i.word) === 'known').reduce((n, i) => n + i.freq, 0);
  return (known / DATA.totalWords) * 100;
};

export const meaning = (w: Word, lang: Lang) => (lang === 'ur' ? w.ur : w.en);
export type Lang = 'en' | 'ur' | 'both';

// other words from the same root that appear in the sample set (so "words you've learned" is real)
export const rootSiblings = (w: Word) => (w.root ? ITEMS.filter((i) => i.word.root === w.root && i.id !== itemId(w)) : []);

export const shuffle = <T,>(a: T[], seed = 1) => {
  const r = [...a];
  let s = seed;
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

/** The root's core sense, taken from the Quranic Arabic Corpus dictionary heading of its first verb form (e.g. "to have mercy"). */
export const rootSense = (key: string) => {
  const h = ROOTS[key]?.lemmas.find((l) => l.heading?.includes(' -'))?.heading;
  return h ? h.slice(h.indexOf(' -') + 2).trim() : null;
};
