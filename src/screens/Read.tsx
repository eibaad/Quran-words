import { useState } from 'react';
import { AYAHS, DATA, WORDS, type Word, statusOf, surahUnderstanding } from '../data';
import { Meaning, STATUS_STYLE, ScreenTitle, Sheet, StatusDot, WordDetails, cx, useSettings } from '../ui';

export default function Read() {
  const { s } = useSettings();
  const [testMe, setTestMe] = useState(true);
  const [sel, setSel] = useState<Word | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [picker, setPicker] = useState(false);
  const pct = surahUnderstanding();
  const sur = DATA.surahs[0];

  const tapWord = (w: Word) => {
    if (testMe && !revealed.has(w.loc)) {
      setRevealed((r) => new Set(r).add(w.loc));
      return;
    }
    setSel(w);
  };

  return (
    <div>
      <ScreenTitle
        title="Read"
        right={
          <button onClick={() => setPicker(true)} className="tap rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-card dark:bg-white/10">
            {sur.n}. {sur.en} ▾
          </button>
        }
      />
      <div className="mb-4 rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-ink-soft dark:text-ink-darksoft">You understand</div>
            <div className="text-3xl font-bold text-teal-600">{pct}%</div>
            <div className="text-xs text-ink-soft dark:text-ink-darksoft">of this surah's words</div>
          </div>
          <span className="ar text-4xl text-teal-700 dark:text-teal-200">سُورَةُ {sur.ar}</span>
        </div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          {(['known', 'learning', 'new'] as const).map((st) => (
            <div
              key={st}
              className={st === 'known' ? 'bg-st-known' : st === 'learning' ? 'bg-st-learning' : 'bg-st-new/40'}
              style={{ width: `${(WORDS.filter((w) => statusOf(w) === st).length / WORDS.length) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-xs">
          {(['known', 'learning', 'new'] as const).map((st) => (
            <span key={st} className="flex items-center gap-1.5">
              <StatusDot s={st} /> {st[0].toUpperCase() + st.slice(1)}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-2xl bg-teal-50 p-1 text-sm font-semibold dark:bg-teal-900">
        <button onClick={() => setTestMe(true)} className={cx('tap flex-1 rounded-xl py-2', testMe && 'bg-card shadow dark:bg-teal-700')}>
          Test me
        </button>
        <button
          onClick={() => {
            setTestMe(false);
          }}
          className={cx('tap flex-1 rounded-xl py-2', !testMe && 'bg-card shadow dark:bg-teal-700')}
        >
          Show meanings
        </button>
      </div>
      <p className="mb-4 text-center text-xs text-ink-soft dark:text-ink-darksoft">
        {testMe ? 'Recall each meaning, then tap the word to check. Tap again for details.' : 'Meanings shown. Switch to Test me to practise recall.'}
      </p>

      <div className="flex flex-col gap-3">
        {AYAHS.map((a) => (
          <div key={a.key} className="rounded-3xl bg-card p-4 shadow-card">
            <div dir="rtl" className="flex flex-wrap gap-x-3 gap-y-2">
              {a.words.map((w) => {
                const st = statusOf(w);
                const show = !testMe || revealed.has(w.loc);
                return (
                  <button key={w.loc} onClick={() => tapWord(w)} className="tap flex flex-col items-center rounded-xl px-1 py-0.5 hover:bg-black/5 dark:hover:bg-white/5">
                    <span className={cx('ar', STATUS_STYLE[st])} style={{ fontSize: s.arSize, lineHeight: 1.9 }}>
                      {w.ar}
                    </span>
                    <span dir="ltr" className={cx('max-w-[110px] text-center text-[11px] leading-tight', show ? 'animate-fade' : 'text-transparent')}>
                      {show ? <Meaning w={w} size="sm" className="items-center !text-[11px]" /> : <span className="inline-block h-3 w-12 rounded bg-black/10 dark:bg-white/10" />}
                    </span>
                  </button>
                );
              })}
              <span className="ar self-center text-gold-500" style={{ fontSize: s.arSize * 0.7 }}>
                ﴿{a.ayah.toLocaleString('ar-EG')}﴾
              </span>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!sel} onClose={() => setSel(null)}>
        {sel && <WordDetails w={sel} />}
      </Sheet>

      <Sheet open={picker} onClose={() => setPicker(false)}>
        <h3 className="mb-1 text-lg font-bold">Surahs</h3>
        <p className="mb-3 text-xs text-ink-soft">The prototype has Al-Fatiha only. Juz ʿAmma arrives in Phase 1.</p>
        <div className="flex flex-col">
          {DATA.surahs
            .filter((x) => x.n === 1 || x.juzAmma)
            .map((x) => (
              <div key={x.n} className={cx('flex items-center justify-between border-b border-black/5 py-2.5 dark:border-white/10', x.n !== 1 && 'opacity-40')}>
                <div className="flex items-center gap-3">
                  <span className="w-7 text-right text-xs tabular-nums text-ink-soft">{x.n}</span>
                  <div>
                    <div className="font-medium">{x.en}</div>
                    <div className="text-xs text-ink-soft">
                      {x.meaningEn} · {x.ayahs} ayahs · {x.words} words
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-soft">{x.n === 1 ? `${pct}%` : '—'}</span>
                  <span className="ar text-xl" style={{ lineHeight: 1.6 }}>
                    {x.ar}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </Sheet>
    </div>
  );
}
