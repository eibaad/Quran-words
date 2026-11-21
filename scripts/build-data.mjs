// Data pipeline (prototype scope: Al-Fatiha).
// Every Quranic string, meaning and root in the app comes from here, pulled from:
//   - Tanzil Uthmani text            https://tanzil.net
//   - Quran.com word-by-word (en/ur) https://api.quran.com  (+ word audio from audio.qurancdn.com)
//   - Quranic Arabic Corpus          https://corpus.quran.com (roots, lemmas, occurrence counts)
// Nothing is typed by hand. Raw downloads are cached in data-raw/.
import fs from 'node:fs';
import path from 'node:path';

const RAW = 'data-raw';
const OUT = 'src/data/fatiha.json';
fs.mkdirSync(RAW, { recursive: true });

async function cached(name, url, binary = false) {
  const p = path.join(RAW, name);
  if (!fs.existsSync(p)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    fs.writeFileSync(p, binary ? Buffer.from(await res.arrayBuffer()) : await res.text());
    await new Promise((r) => setTimeout(r, 300)); // be polite
  }
  return binary ? fs.readFileSync(p) : fs.readFileSync(p, 'utf8');
}

const decode = (s) =>
  s.replace(/&ndash;/g, '–').replace(/&rarr;/g, '→').replace(/&amp;/g, '&').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&#39;/g, "'");
const strip = (s) => decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

// ---------- 1. Tanzil ----------
const tanzil = await cached(
  'quran-uthmani.txt',
  'https://tanzil.net/pub/download/index.php?marks=true&sajdah=true&tatweel=true&quranType=uthmani&outType=txt-2&agree=true',
);
const ayahText = {};
for (const line of tanzil.split('\n')) {
  const m = line.match(/^(\d+)\|(\d+)\|(.*)$/);
  if (m) ayahText[`${m[1]}:${m[2]}`] = m[3].trim();
}
const totalAyahs = Object.keys(ayahText).length;
// Tanzil puts pause marks (e.g. ۖ ۚ) and some symbols as separate tokens; corpus word numbers skip them
const isWord = (t) => /[\u0621-\u063A\u0641-\u064A\u0671-\u06D3]/.test(t);
const ayahWords = (key) => ayahText[key].split(' ').filter(isWord);
if (totalAyahs !== 6236) throw new Error(`Tanzil: expected 6236 ayahs, got ${totalAyahs}`);

// ---------- 2. Quran.com word by word ----------
const wbw = {};
for (const lang of ['en', 'ur']) {
  const j = JSON.parse(
    await cached(
      `wbw1-${lang}.json`,
      `https://api.quran.com/api/v4/verses/by_chapter/1?words=true&per_page=10&language=${lang}&word_fields=text_uthmani,location&translations=`,
    ),
  );
  for (const v of j.verses) for (const w of v.words) if (w.char_type_name === 'word') {
    wbw[w.location] ??= { audio: w.audio_url };
    wbw[w.location][lang] = w.translation.text;
  }
}

// ---------- 3. Quranic Arabic Corpus: per-word root (Buckwalter) ----------
const corpusWords = {};
// the corpus word-by-word view is paged; keep fetching from the first verse not yet covered
for (let v = 1; v <= 7; ) {
const corpusPage = await cached(`corpus-1-${v}.html`, `https://corpus.quran.com/wordbyword.jsp?chapter=1&verse=${v}`);
for (const row of corpusPage.split('<tr>').slice(1)) {
  const loc = row.match(/<span class="location">\((\d+:\d+:\d+)\)<\/span>/);
  if (!loc) continue;
  const root = row.match(/qurandictionary\.jsp\?q=([^#"]+)#/);
  const translit = row.match(/<br\/>(?:<a[^>]*>|<span class="phonetic">)([^<]+)</);
  const gloss = row.match(/<\/(?:a|span)><br\/>([^<]+)<\/td>/);
  const pos = row.match(/<td class="col3">([\s\S]*?)<div class="arabicGrammar">/);
  corpusWords[loc[1]] = {
    rootBw: root ? decodeURIComponent(root[1]) : null,
    translit: translit ? decode(translit[1]) : '',
    corpusGloss: gloss ? decode(gloss[1]).trim() : '',
    morph: pos ? strip(pos[1]) : '',
  };
}
const covered = Object.keys(corpusWords).map((l) => +l.split(':')[1]);
const next = Math.max(...covered) + 1;
if (next <= v) throw new Error('corpus paging stalled');
v = next;
}

// ---------- 4. Corpus dictionary pages: root letters, lemmas, counts, related words ----------
const NUM = { once: 1, twice: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const toNum = (s) => (/^\d+$/.test(s) ? +s : NUM[s.toLowerCase()]);
const roots = {};
const lemmaOnly = {};
for (const bw of new Set(Object.values(corpusWords).map((w) => w.rootBw).filter(Boolean))) {
  const html = await cached(`dict-${bw}.html`, `https://corpus.quran.com/qurandictionary.jsp?q=${encodeURIComponent(bw)}`);
  const text = strip(html);
  const head = text.match(/root [^(]*\( ([^)]+) \) occurs (\d+) times in the Quran/);
  if (!head) {
    // a word with no root: the corpus links straight to its lemma page
    const lem = text.match(/The (\w+) \S+ \( ([^)]+) \) occurs (\d+) times in the Quran/);
    if (!lem) throw new Error(`no root/lemma header for ${bw}`);
    lemmaOnly[bw] = { ar: lem[2].trim(), kind: lem[1], count: +lem[3] };
    continue;
  }
  const summary = text.slice(text.indexOf(head[0]), text.indexOf('The translations below'));
  const NUMW = { once: 1, twice: 2 };
  let lemmas = [...summary.matchAll(/(\w+) (?:times )?as (?:the |an? )?(.+?) \( ([^)]+) \)/gi)]
    .filter((m) => m[1] !== 'Quran')
    .map((m) => ({ count: NUMW[m[1].toLowerCase()] ?? toNum(m[1]), kind: m[2].trim(), arabic: m[3].trim() }));
  const single = summary.match(/occurs \d+ times in the Quran as (?:the |an? )?(.+?) \( ([^)]+) \)/);
  if (single) lemmas = [{ count: +head[2], kind: single[1].trim(), arabic: single[2].trim() }];
  const sections = html.split('<h4 class="dxe">').slice(1);
  if (sections.length !== lemmas.length) throw new Error(`${bw}: ${sections.length} sections vs ${lemmas.length} lemmas`);
  sections.forEach((sec, i) => {
    const rows = [...sec.matchAll(/<span class="l">\((\d+:\d+:\d+)\)<\/span> <i class="ab">([^<]+)<\/i><\/td><td class="c2"><a[^>]*>([^<]+)<\/a>/g)];
    if (rows.length !== lemmas[i].count) throw new Error(`${bw}/${lemmas[i].arabic}: ${rows.length} rows vs count ${lemmas[i].count}`);
    lemmas[i].heading = strip(sec.slice(0, sec.indexOf('</h4>')));
    lemmas[i].examples = rows.map((m) => ({ loc: m[1], translit: decode(m[2]), gloss: decode(m[3]) }));
  });
  roots[bw] = { letters: head[1].trim(), count: +head[2], lemmas };
}

// ---------- 4b. Surah list + Juz 'Amma (Quran.com API) ----------
const chEn = JSON.parse(await cached('chapters-en.json', 'https://api.quran.com/api/v4/chapters?language=en')).chapters;
const chUr = JSON.parse(await cached('chapters-ur.json', 'https://api.quran.com/api/v4/chapters?language=ur')).chapters;
const juzs = JSON.parse(await cached('juzs.json', 'https://api.quran.com/api/v4/juzs')).juzs;
const juz30 = juzs.find((j) => j.juz_number === 30);
const juzAmma = Object.keys(juz30.verse_mapping).map(Number);
const surahs = chEn.map((c, i) => ({
  n: c.id, ar: c.name_arabic, en: c.name_simple, meaningEn: c.translated_name.name, meaningUr: chUr[i].translated_name.name,
  ayahs: c.verses_count, words: 0, juzAmma: juzAmma.includes(c.id),
}));
let totalWords = 0;
for (const key of Object.keys(ayahText)) {
  const n = ayahWords(key).length;
  totalWords += n;
  surahs[+key.split(':')[0] - 1].words += n;
}

// ---------- 5. Assemble ----------
const ayahs = [];
for (let a = 1; a <= 7; a++) {
  const key = `1:${a}`;
  const tokens = ayahWords(key);
  const words = tokens.map((ar, i) => {
    const loc = `1:${a}:${i + 1}`;
    const q = wbw[loc];
    const c = corpusWords[loc];
    if (!q || !c) throw new Error(`alignment failed at ${loc}`);
    const root = c.rootBw ? roots[c.rootBw] ?? null : null;
    const li = root ? root.lemmas.findIndex((l) => l.examples?.some((e) => e.loc === loc)) : -1;
    const lemma = li >= 0 ? root.lemmas[li] : null;
    let audioFile = null;
    if (q.audio) audioFile = path.basename(q.audio);
    return {
      loc,
      ar,
      en: q.en,
      ur: q.ur,
      translit: c.translit,
      morph: c.morph,
      audio: audioFile,
      root: root ? c.rootBw : null,
      lemma: lemma ? { ar: lemma.arabic, kind: lemma.kind, count: lemma.count } : lemmaOnly[c.rootBw] ?? null,
    };
  });
  ayahs.push({ key, ayah: a, text: ayahText[key], words });
}


// related words per root: other lemmas, with one real example each (text from Tanzil, gloss from Corpus)
const rootOut = {};
for (const [bw, r] of Object.entries(roots)) {
  rootOut[bw] = {
    letters: r.letters,
    count: r.count,
    lemmas: r.lemmas.map((l) => {
      const ex = l.examples?.[0];
      let exWord = null;
      if (ex) {
        const [s, v, w] = ex.loc.split(':').map(Number);
        exWord = { loc: ex.loc, ar: ayahWords(`${s}:${v}`)[w - 1] ?? null, gloss: ex.gloss, translit: ex.translit };
      }
      return { ar: l.arabic, kind: l.kind, count: l.count, example: exWord };
    }),
  };
}

fs.writeFileSync(
  OUT,
  JSON.stringify({ totalWords, surahs, surah: { number: 1, nameAr: 'الفاتحة', nameEn: 'Al-Fatiha' }, ayahs, roots: rootOut, generatedAt: new Date().toISOString() }, null, 1),
);
console.log(`wrote ${OUT}: ${ayahs.reduce((n, a) => n + a.words.length, 0)} words, ${Object.keys(rootOut).length} roots`);
