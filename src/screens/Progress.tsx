import { DATA, ITEMS, quranCoverage, statusOf, surahUnderstanding } from '../data';
import { Card, ScreenTitle } from '../ui';

// SAMPLE history for the prototype (real history will come from your review log)
const HISTORY = [0, 0, 2, 3, 3, 5, 6, 6, 7, 8, 8, 9, 10, 10];
const HEAT = Array.from({ length: 12 * 7 }, (_, i) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  const r = x - Math.floor(x);
  return i > 70 ? (r > 0.25 ? Math.ceil(r * 4) : 0) : i > 40 ? (r > 0.6 ? Math.ceil(r * 3) : 0) : 0;
});

export default function Progress() {
  const known = ITEMS.filter((i) => statusOf(i.word) === 'known').length;
  const max = Math.max(...HISTORY, 1);
  const pts = HISTORY.map((v, i) => `${(i / (HISTORY.length - 1)) * 300},${100 - (v / max) * 90}`).join(' ');
  const cov = quranCoverage();
  return (
    <div className="flex flex-col gap-4">
      <ScreenTitle title="Progress" sub="Sample numbers in this prototype" />

      <Card>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm text-ink-soft dark:text-ink-darksoft">Words known</div>
            <div className="text-3xl font-bold text-teal-600">{known}</div>
          </div>
          <div className="text-xs text-ink-soft">last 14 days</div>
        </div>
        <svg viewBox="0 0 300 104" className="mt-3 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2a8a79" stopOpacity=".35" />
              <stop offset="1" stopColor="#2a8a79" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${pts} 300,100`} fill="url(#g)" />
          <polyline points={pts} fill="none" stroke="#2a8a79" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">Daily activity</div>
          <div className="flex items-center gap-1 text-[10px] text-ink-soft">
            less
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className="h-2.5 w-2.5 rounded-sm" style={{ background: l ? `rgba(42,138,121,${l / 4})` : 'rgba(127,127,127,.15)' }} />
            ))}
            more
          </div>
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {HEAT.map((l, i) => (
            <span key={i} className="aspect-square rounded-[3px]" style={{ background: l ? `rgba(42,138,121,${l / 4})` : 'rgba(127,127,127,.15)' }} />
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">No streak counter to break. Every day you show up counts.</p>
      </Card>

      <Card>
        <div className="font-semibold">Coverage of the whole Quran</div>
        <p className="mb-3 text-xs text-ink-soft">Share of all {DATA.totalWords.toLocaleString()} words whose dictionary form you know</p>
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600" style={{ width: `${Math.max(cov, 1)}%` }} />
          </div>
          <b className="tabular-nums text-teal-600">{cov.toFixed(1)}%</b>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Knowing just <span className="ar">ٱللَّه</span> and <span className="ar">رَبّ</span> already covers{' '}
          {(((ITEMS.find((i) => i.word.loc === '1:1:2')!.freq + ITEMS.find((i) => i.word.loc === '1:2:3')!.freq) / DATA.totalWords) * 100).toFixed(1)}% of the words you recite. That's
          why the most frequent words come first.
        </p>
      </Card>

      <Card>
        <div className="mb-2 font-semibold">By surah</div>
        <div className="flex flex-col gap-2.5">
          {DATA.surahs
            .filter((x) => x.n === 1 || x.juzAmma)
            .slice(0, 8)
            .map((x) => {
              const p = x.n === 1 ? surahUnderstanding() : 0;
              return (
                <div key={x.n} className="flex items-center gap-3">
                  <span className="ar w-20 shrink-0 text-right text-lg" style={{ lineHeight: 1.5 }}>
                    {x.ar}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${p}%` }} />
                  </div>
                  <span className="w-9 text-right text-xs tabular-nums text-ink-soft">{p}%</span>
                </div>
              );
            })}
          <div className="text-center text-xs text-ink-soft">+ the rest of Juz ʿAmma in Phase 1</div>
        </div>
      </Card>
    </div>
  );
}
