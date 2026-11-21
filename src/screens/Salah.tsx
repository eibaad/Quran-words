import { useMemo, useState } from 'react';
import { AYAHS, DATA, WORDS, type Word, playWord, shuffle } from '../data';
import { Btn, Meaning, cx, useSettings } from '../ui';

type Q = { w: Word; options: Word[] };
const uniq = (ws: Word[]) => ws.filter((x, i) => ws.findIndex((y) => y.en.toLowerCase() === x.en.toLowerCase()) === i);

export default function Salah({ onExit }: { onExit: () => void }) {
  const { s } = useSettings();
  const [stage, setStage] = useState<'pick' | 'read' | 'quiz' | 'done'>('pick');
  const [ai, setAi] = useState(0);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // 3 questions on content words from the surah (ones that carry meaning: have a lemma)
  const quiz: Q[] = useMemo(() => {
    const pool = uniq(shuffle(WORDS.filter((w) => w.lemma && w.lemma.count < 1000), 21)).slice(0, 3);
    return pool.map((w, i) => ({
      w,
      options: shuffle([w, ...uniq(shuffle(WORDS.filter((x) => x.en.toLowerCase() !== w.en.toLowerCase() && x.lemma), 30 + i)).slice(0, 3)], 40 + i),
    }));
  }, []);

  const a = AYAHS[ai];
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper dark:bg-paper-dark">
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
        <button onClick={onExit} aria-label="Close" className="tap grid h-9 w-9 place-items-center rounded-full text-2xl text-ink-soft hover:bg-black/5">
          ×
        </button>
        <div className="flex-1 text-center font-semibold">Salah mode</div>
        <div className="w-9" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-4 pb-6">
        {stage === 'pick' && (
          <div className="flex animate-pop flex-col gap-3">
            <p className="text-sm text-ink-soft dark:text-ink-darksoft">Pick a surah you recite in prayer. Go through it word by word, then answer 3 quick questions.</p>
            {[DATA.surahs[0], ...DATA.surahs.filter((x) => x.juzAmma).reverse().slice(0, 7)]
              .map((x) => (
                <button
                  key={x.n}
                  disabled={x.n !== 1}
                  onClick={() => setStage('read')}
                  className={cx('tap flex items-center justify-between rounded-2xl bg-card p-4 text-left shadow-card', x.n !== 1 && 'opacity-40')}
                >
                  <div>
                    <div className="font-semibold">{x.en}</div>
                    <div className="text-xs text-ink-soft">
                      {x.n === 1 ? `${x.ayahs} ayahs · every rakʿah` : 'Phase 3'}
                    </div>
                  </div>
                  <span className="ar text-2xl" style={{ lineHeight: 1.6 }}>
                    {x.ar}
                  </span>
                </button>
              ))}
          </div>
        )}

        {stage === 'read' && (
          <div key={ai} className="flex flex-1 animate-pop flex-col gap-4">
            <div className="flex justify-center gap-1.5">
              {AYAHS.map((_, i) => (
                <span key={i} className={cx('h-1.5 rounded-full transition-all', i === ai ? 'w-6 bg-teal-600' : i < ai ? 'w-1.5 bg-teal-300' : 'w-1.5 bg-black/10 dark:bg-white/15')} />
              ))}
            </div>
            <div className="flex-1 rounded-3xl bg-card p-5 shadow-card">
              <div dir="rtl" className="flex flex-wrap justify-center gap-x-4 gap-y-4">
                {a.words.map((w) => (
                  <button key={w.loc} onClick={() => playWord(w)} className="tap flex flex-col items-center rounded-xl px-1">
                    <span className="ar text-teal-800 dark:text-teal-100" style={{ fontSize: s.arSize * 1.15, lineHeight: 1.9 }}>
                      {w.ar}
                    </span>
                    <span dir="ltr" className="max-w-[120px] text-center text-xs leading-tight">
                      <Meaning w={w} size="sm" className="items-center" />
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center text-sm text-gold-500">
                {DATA.surahs[0].en} · ayah {a.ayah}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="soft" disabled={ai === 0} onClick={() => setAi(ai - 1)}>
                Back
              </Btn>
              {ai < AYAHS.length - 1 ? (
                <Btn onClick={() => setAi(ai + 1)}>Next ayah</Btn>
              ) : (
                <Btn onClick={() => setStage('quiz')}>Quick check</Btn>
              )}
            </div>
          </div>
        )}

        {stage === 'quiz' && (
          <div key={qi} className="flex animate-pop flex-col gap-4">
            <div className="text-center text-xs font-semibold uppercase tracking-widest text-teal-600">Question {qi + 1} of 3</div>
            <div className="rounded-3xl bg-card p-5 text-center shadow-card">
              <p className="text-sm text-ink-soft">When you recite this in salah, what are you saying?</p>
              <span className="ar block text-5xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 2 }}>
                {quiz[qi].w.ar}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {quiz[qi].options.map((o) => {
                const isAns = o.loc === quiz[qi].w.loc;
                const isPick = picked === o.loc;
                return (
                  <button
                    key={o.loc}
                    disabled={!!picked}
                    onClick={() => {
                      setPicked(o.loc);
                      if (isAns) setScore((x) => x + 1);
                    }}
                    className={cx(
                      'tap rounded-2xl border-2 bg-card px-4 py-3.5 text-left shadow-sm',
                      !picked && 'border-transparent',
                      picked && isAns && 'border-teal-500 bg-teal-50 dark:bg-teal-900',
                      picked && isPick && !isAns && 'animate-shake border-rose-400',
                      picked && !isPick && !isAns && 'border-transparent opacity-50',
                    )}
                  >
                    <Meaning w={o} />
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className={cx('animate-up rounded-3xl p-4', picked === quiz[qi].w.loc ? 'bg-teal-50 dark:bg-teal-900' : 'bg-rose-50 dark:bg-rose-900/40')}>
                <div className="font-bold">{picked === quiz[qi].w.loc ? 'Correct ✓' : 'Not quite'}</div>
                <Meaning w={quiz[qi].w} className="mb-3 text-sm" />
                <Btn
                  className="w-full"
                  onClick={() => {
                    setPicked(null);
                    if (qi < 2) setQi(qi + 1);
                    else setStage('done');
                  }}
                >
                  Continue
                </Btn>
              </div>
            )}
          </div>
        )}

        {stage === 'done' && (
          <div className="flex flex-1 animate-pop flex-col items-center justify-center gap-4 text-center">
            <div className="text-6xl">🤲</div>
            <h2 className="text-2xl font-bold">{score}/3</h2>
            <p className="text-ink-soft">Recite it slowly in your next prayer, with its meaning in mind.</p>
            <Btn className="w-full" onClick={onExit}>
              Done
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
