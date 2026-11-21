import { useMemo, useState } from 'react';
import { ITEMS, ROOTS, type Word, rootSense, statusOf } from '../data';
import { AyahContext, Btn, Card, Meaning, Ornament, PlayButton, cx } from '../ui';
import { RootDetective } from './Session';

/*
 * Flow 3, "Root families": the root is the unit you learn. Each lesson opens one root
 * (its letters and core sense from the Quranic Arabic Corpus), meets its words in the ayahs
 * you recite, then has you guess a relative you haven't seen. The home screen is your map of roots,
 * ordered by how often each root appears in the Quran.
 */

type Fam = { key: string; letters: string; sense: string | null; count: number; forms: number; words: Word[]; known: number };

const families = (): Fam[] =>
  Object.entries(ROOTS)
    .map(([key, r]) => {
      const words = ITEMS.filter((i) => i.word.root === key).map((i) => i.word);
      const top = [...r.lemmas].sort((a, b) => b.count - a.count)[0];
      return { key, letters: r.letters, sense: rootSense(key) ?? (top?.example?.gloss ? `“${top.example.gloss}”` : null), count: r.count, forms: r.lemmas.length, words, known: words.filter((w) => statusOf(w) === 'known').length };
    })
    .sort((a, b) => b.count - a.count);

export function RootHome({ onStart }: { onStart: (rootKey: string) => void }) {
  const fams = useMemo(families, []);
  const next = fams.find((f) => f.known < f.words.length)!;
  const mastered = fams.filter((f) => f.known === f.words.length).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="pt-2">
        <p className="text-sm text-ink-soft dark:text-ink-darksoft">Learn a root once, recognise its whole family</p>
        <h1 className="text-2xl font-bold tracking-tight">Roots</h1>
        <Ornament />
        <p className="mt-1 text-sm text-ink-soft">
          {mastered} of {fams.length} roots from {`Al-Fatiha`} known · most frequent in the Quran first
        </p>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-teal-900 text-white">
        <div className="text-xs uppercase tracking-widest text-teal-100">Next root</div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{next.sense ?? 'Root family'}</div>
            <div className="text-sm text-teal-100">
              {next.count.toLocaleString()}× in the Quran · {next.forms} forms
            </div>
          </div>
          <span className="ar text-5xl" style={{ lineHeight: 1.4 }}>
            {next.letters}
          </span>
        </div>
        <button onClick={() => onStart(next.key)} className="tap mt-4 w-full rounded-2xl bg-white py-3.5 text-lg font-bold text-teal-700">
          Open this root
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {fams.map((f) => {
          const pct = f.words.length ? f.known / f.words.length : 0;
          return (
            <button key={f.key} onClick={() => onStart(f.key)} className="tap rounded-2xl bg-card p-3 text-left shadow-card">
              <div className="flex items-start justify-between gap-2">
                <Ring pct={pct} />
                <span className="ar text-3xl" style={{ lineHeight: 1.3 }}>
                  {f.letters}
                </span>
              </div>
              <div className="mt-1 line-clamp-2 min-h-[2.5em] text-sm font-medium leading-tight">{f.sense ?? '—'}</div>
              <div className="mt-1 text-[11px] text-ink-soft">
                {f.count.toLocaleString()}× · {f.known}/{f.words.length} in Fatiha known
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-[11px] text-ink-soft">Core senses: Quranic Arabic Corpus dictionary. Words with no root (particles, pronouns) are taught in the daily deck.</p>
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 28 28" className="h-7 w-7 -rotate-90">
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgb(var(--ink-soft) / .2)" strokeWidth="3" />
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgb(var(--st-known))" strokeWidth="3" strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

type Stage = 'intro' | 'meet' | 'guess' | 'family';

export function RootLesson({ rootKey, onExit }: { rootKey: string; onExit: () => void }) {
  const r = ROOTS[rootKey];
  const sense = rootSense(rootKey);
  const words = ITEMS.filter((i) => i.word.root === rootKey).map((i) => i.word);
  const fatihaLemmas = new Set(words.map((w) => w.lemma?.ar));
  // a relative you haven't met: the most frequent other form that has a real example
  const guessIdx = r.lemmas
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => !fatihaLemmas.has(l.ar) && l.example?.ar)
    .sort((a, b) => b.l.count - a.l.count)[0]?.i;
  const [stage, setStage] = useState<Stage>('intro');
  const [wi, setWi] = useState(0);
  const [shown, setShown] = useState(false);
  const maxCount = Math.max(...r.lemmas.map((l) => l.count));

  const stages: Stage[] = ['intro', 'meet', ...(guessIdx !== undefined ? (['guess'] as Stage[]) : []), 'family'];
  const idx = stages.indexOf(stage);
  const nextStage = () => setStage(stages[idx + 1]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper dark:bg-paper-dark">
      <div className="mx-auto w-full max-w-md px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center gap-3">
          <button onClick={onExit} aria-label="Close" className="tap grid h-9 w-9 place-items-center rounded-full text-2xl text-ink-soft">
            ×
          </button>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${(idx / stages.length) * 100}%` }} />
          </div>
          <span className="ar text-xl" style={{ lineHeight: 1.4 }}>
            {r.letters}
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-4 pb-6">
        {stage === 'intro' && (
          <div className="flex flex-1 animate-pop flex-col gap-4 pt-4">
            <Card className="flex flex-col items-center gap-2 text-center">
              <div className="text-xs uppercase tracking-widest text-ink-soft">Root</div>
              <div className="ar mb-2 text-7xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 2 }}>
                {r.letters}
              </div>
              {sense && <div className="text-xl font-semibold">{sense}</div>}
              <div className="text-sm text-ink-soft">
                {r.count.toLocaleString()} times in the Quran, in {r.lemmas.length} forms
              </div>
            </Card>
            <p className="text-center text-sm text-ink-soft">
              Every word built on these letters carries this idea. You'll meet {words.length === 1 ? 'its word' : `its ${words.length} words`} in Al-Fatiha
              {guessIdx !== undefined ? ', then guess one you have never seen.' : '.'}
            </p>
            <Btn className="w-full" onClick={nextStage}>
              Meet the words
            </Btn>
          </div>
        )}

        {stage === 'meet' && (
          <div key={wi} className="flex flex-1 animate-pop flex-col gap-4 pt-4">
            <div className="text-center text-xs font-semibold uppercase tracking-widest text-teal-600">
              In Al-Fatiha · {wi + 1} of {words.length}
            </div>
            <Card className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <PlayButton w={words[wi]} />
                <span className="ar text-5xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 1.8 }}>
                  {words[wi].ar}
                </span>
              </div>
              <AyahContext w={words[wi]} scale={0.85} />
              {shown ? (
                <Meaning w={words[wi]} size="lg" className="animate-pop items-center text-center" />
              ) : (
                <p className="text-sm text-ink-soft">{sense ? `Using “${sense}”, what does it mean here?` : 'What does it mean here?'}</p>
              )}
            </Card>
            {shown ? (
              <div className="grid grid-cols-2 gap-2">
                <Btn
                  variant="soft"
                  className="!bg-rose-50 !text-rose-700"
                  onClick={() => {
                    setShown(false);
                    wi + 1 < words.length ? setWi(wi + 1) : nextStage();
                  }}
                >
                  Not yet
                </Btn>
                <Btn
                  onClick={() => {
                    setShown(false);
                    wi + 1 < words.length ? setWi(wi + 1) : nextStage();
                  }}
                >
                  Got it
                </Btn>
              </div>
            ) : (
              <Btn className="w-full py-4" onClick={() => setShown(true)}>
                Show meaning
              </Btn>
            )}
          </div>
        )}

        {stage === 'guess' && guessIdx !== undefined && (
          <div className="flex flex-1 flex-col pt-4">
            <RootDetective known={words[0]} rootKey={rootKey} lemmaIdx={guessIdx} onDone={nextStage} />
          </div>
        )}

        {stage === 'family' && (
          <div className="flex flex-1 animate-pop flex-col gap-4 pt-4">
            <div className="text-center">
              <div className="ar text-4xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 1.6 }}>
                {r.letters}
              </div>
              <div className="font-semibold">The family {sense && `of “${sense}”`}</div>
              <div className="text-xs text-ink-soft">How often each form appears in the Quran</div>
            </div>
            <Card className="flex flex-col gap-2.5 !p-4">
              {r.lemmas.map((l, i) => {
                const met = fatihaLemmas.has(l.ar) || i === guessIdx;
                return (
                  <div key={l.ar + i} className="flex items-center gap-3">
                    <span className={cx('ar w-20 shrink-0 text-right text-xl', met ? 'text-teal-700 dark:text-teal-200' : 'opacity-50')} style={{ lineHeight: 1.6 }}>
                      {l.ar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                        <div className={cx('h-full rounded-full', met ? 'bg-teal-500' : 'bg-gold-300')} style={{ width: `${Math.max(3, (l.count / maxCount) * 100)}%` }} />
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-ink-soft">
                        {l.count}× · {l.example?.gloss ? `“${l.example.gloss}”` : l.kind}
                      </div>
                    </div>
                    {met && <span className="text-xs font-semibold text-teal-600">met</span>}
                  </div>
                );
              })}
            </Card>
            <p className="text-center text-xs text-ink-soft">Forms you haven't met will be unlocked as they appear in the surahs you learn.</p>
            <Btn className="w-full" onClick={onExit}>
              Done
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
