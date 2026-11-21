# Quran Words

A personal, offline-first PWA for understanding the words of the Quran.

**Status: Step 1, a clickable UI prototype** using real Al-Fatiha data. Progress numbers are sample values until the app logic is built.

## Data, never typed by hand
`scripts/build-data.mjs` pulls everything at build time and writes `src/data/*.json`:
- Quran text: [Tanzil](https://tanzil.net) Uthmani (verbatim, with attribution)
- Word-by-word English and Urdu, surah names, word audio: [Quran.com](https://quran.com) API / CDN
- Roots, lemmas, frequencies: [Quranic Arabic Corpus](https://corpus.quran.com) (GPL, with attribution)

```
NODE_USE_ENV_PROXY=1 node scripts/build-data.mjs   # refresh data (raw downloads cached in data-raw/, not committed)
npm run dev
npm run deploy                                      # build and push dist/ to the gh-pages branch
```
