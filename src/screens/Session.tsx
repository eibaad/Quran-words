import { useEffect, useMemo, useRef, useState } from 'react';
import { createEmptyCard, fsrs, generatorParameters, Rating, type Grade } from 'ts-fsrs';
import { AYAHS, ROOTS, WORDS, type Word, playWord, shuffle } from '../data';
import { AyahContext, Btn, Meaning, PlayButton, RootBadge, cx, useSettings } from '../ui';

const W = (loc: string) => WORDS.find((w) => w.loc === loc)!;

type Step =
  | { kind: 'flip'; w: Word; isNew: boolean }
  | { kind: 'cloze'; w: Word }
  | { kind: 'listen'; w: Word }
  | { kind: 'match'; words: Word[] }
  | { kind: 'builder'; ayah: number }
  | { kind: 'root'; known: Word; rootKey: string; lemmaIdx: number };

// Interleaved: reviews and new words, mixed exercise types.
const STEPS: Step[] = [
  { kind: 'cloze', w: W('1:4:3') },
  { kind: 'flip', w: W('1:7:3'), isNew: true },
  { kind: 'listen', w: W('1:6:3') },
  { kind: 'flip', w: W('1:5:2'), isNew: false },
  { kind: 'match', words: ['1:2:3', '1:4:2', '1:2:1', '1:6:1', '1:6:2'].map(W) },
  { kind: 'root', known: W('1:1:3'), rootKey: 'rHm', lemmaIdx: 5 },
  { kind: 'builder', ayah: 6 },
  { kind: 'flip', w: W('1:7:9'), isNew: true },
];

const KIND_LABEL: Record<Step['kind'], string> = {
  flip: 'Recall',
  cloze: 'Ayah cloze',
  listen: 'Listen',
  match: 'Match',
  builder: 'Ayah builder',
  root: 'Root detective',
};

export type SessionResult = { correct: number; total: number; learned: string[] };

export default function Session({ onExit }: { onExit: () => void }) {
  const [i, setI] = useState(0);
  const [res, setRes] = useState<SessionResult>({ correct: 0, total: 0, learned: [] });
  const step = STEPS[i];
  const next = (ok: boolean, learned?: Word) => {
    setRes((r) => ({ correct: r.correct + (ok ? 1 : 0), total: r.total + 1, learned: learned ? [...r.learned, learned.loc] : r.learned }));
    setI((x) => x + 1);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper dark:bg-paper-dark">
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
        <button onClick={onExit} aria-label="Close" className="tap grid h-9 w-9 place-items-center rounded-full text-2xl text-ink-soft hover:bg-black/5">
          ×
        </button>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${(i / STEPS.length) * 100}%` }} />
        </div>
        <span className="w-10 text-right text-xs tabular-nums text-ink-soft">
          {Math.min(i + 1, STEPS.length)}/{STEPS.length}
        </span>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-4 pb-4">
        {step ? (
          <div key={i} className="flex flex-1 animate-pop flex-col">
            <div className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-teal-600">{KIND_LABEL[step.kind]}</div>
            {step.kind === 'flip' && <Flip w={step.w} isNew={step.isNew} onDone={(ok) => next(ok, step.isNew ? step.w : undefined)} />}
            {step.kind === 'cloze' && <Cloze w={step.w} onDone={next} />}
            {step.kind === 'listen' && <Listen w={step.w} onDone={next} />}
            {step.kind === 'match' && <Match words={step.words} onDone={next} />}
            {step.kind === 'builder' && <Builder ayah={step.ayah} onDone={next} />}
            {step.kind === 'root' && <RootDetective known={step.known} rootKey={step.rootKey} lemmaIdx={step.lemmaIdx} onDone={next} />}
          </div>
        ) : (
          <Summary res={res} onExit={onExit} />
        )}
      </div>
    </div>
  );
}

/* ---------------- FSRS grade buttons ---------------- */
function fmt(ms: number) {
  const m = ms / 60000;
  if (m < 60) return `${Math.max(1, Math.round(m))}m`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)}h`;
  const d = h / 24;
  if (d < 30) return `${Math.round(d)}d`;
  return `${Math.round(d / 30)}mo`;
}

function GradeBar({ onGrade, isNew }: { onGrade: (g: Grade) => void; isNew: boolean }) {
  const { s } = useSettings();
  const preview = useMemo(() => {
    const f = fsrs(generatorParameters({ request_retention: s.retention / 100 }));
    const now = new Date();
    let card = createEmptyCard(now);
    if (!isNew) {
      // sample review card: seen a few days ago
      card = f.next(f.next(card, new Date(now.getTime() - 6 * 864e5), Rating.Good).card, new Date(now.getTime() - 3 * 864e5), Rating.Good).card;
    }
    return f.repeat(card, now);
  }, [s.retention, isNew]);
  const now = Date.now();
  const btns: { g: Grade; label: string; cls: string }[] = [
    { g: Rating.Again, label: 'Again', cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' },
    { g: Rating.Hard, label: 'Hard', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' },
    { g: Rating.Good, label: 'Good', cls: 'bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-100' },
    { g: Rating.Easy, label: 'Easy', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200' },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {btns.map((b) => (
        <button key={b.g} onClick={() => onGrade(b.g)} className={cx('tap flex flex-col items-center rounded-2xl py-3 font-semibold', b.cls)}>
          <span>{b.label}</span>
          <span className="text-xs font-normal opacity-70">{fmt(preview[b.g].card.due.getTime() - now)}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Flip card (active recall, swipe to grade) ---------------- */
function Flip({ w, isNew, onDone }: { w: Word; isNew: boolean; onDone: (ok: boolean) => void }) {
  const [shown, setShown] = useState(false);
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const grade = (g: Grade) => onDone(g !== Rating.Again);
  useEffect(() => {
    const t = setTimeout(() => playWord(w), 350);
    return () => clearTimeout(t);
  }, [w]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {isNew && <div className="mx-auto rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700 dark:bg-gold-700/30 dark:text-gold-300">New word</div>}
      <div
        className="flip flex-1 select-none"
        onPointerDown={(e) => shown && (start.current = e.clientX)}
        onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
        onPointerUp={() => {
          if (start.current !== null) {
            if (dx > 90) grade(Rating.Good);
            else if (dx < -90) grade(Rating.Again);
          }
          start.current = null;
          setDx(0);
        }}
        style={{ transform: `translateX(${dx}px) rotate(${dx / 25}deg)`, transition: start.current === null ? 'transform .25s' : 'none' }}
      >
        <div className={cx('flip-inner relative h-full min-h-[340px]', shown && 'flipped')}>
          <div className="face absolute inset-0 flex flex-col items-center justify-center gap-6 rounded-3xl bg-card p-6 shadow-card">
            <span className="ar text-6xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 1.8 }}>
              {w.ar}
            </span>
            <AyahContext w={w} scale={0.8} />
            <p className="text-sm text-ink-soft dark:text-ink-darksoft">What does the highlighted word mean? Say it to yourself first.</p>
          </div>
          <div className="face back absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl bg-card p-6 text-center shadow-card">
            <div className="flex items-center gap-3">
              <PlayButton w={w} />
              <span className="ar text-5xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 1.8 }}>
                {w.ar}
              </span>
            </div>
            <Meaning w={w} size="lg" className="items-center" />
            <RootBadge w={w} />
            <AyahContext w={w} scale={0.7} />
            {w.lemma && <p className="text-xs text-ink-soft dark:text-ink-darksoft">This word's dictionary form appears {w.lemma.count}× in the Quran</p>}
          </div>
        </div>
      </div>
      {!shown ? (
        <Btn onClick={() => setShown(true)} className="w-full py-4 text-lg">
          Show meaning
        </Btn>
      ) : (
        <div className="flex flex-col gap-2">
          <GradeBar onGrade={grade} isNew={isNew} />
          <p className="text-center text-[11px] text-ink-soft">Swipe right = Good · swipe left = Again</p>
        </div>
      )}
    </div>
  );
}

/* ---------------- Feedback banner ---------------- */
function Feedback({ ok, answer, onNext }: { ok: boolean; answer: Word | string; onNext: () => void }) {
  return (
    <div
      className={cx(
        'animate-up rounded-3xl p-4',
        ok ? 'bg-teal-50 text-teal-900 dark:bg-teal-900 dark:text-teal-50' : 'bg-rose-50 text-rose-900 dark:bg-rose-900/40 dark:text-rose-50',
      )}
    >
      <div className="mb-1 font-bold">{ok ? 'Correct ✓' : 'Not quite'}</div>
      <div className="mb-3 text-sm">{typeof answer === 'string' ? answer : <Meaning w={answer} />}</div>
      <Btn onClick={onNext} className={cx('w-full', !ok && '!bg-rose-600')}>
        Continue
      </Btn>
    </div>
  );
}

function Choices({ options, correct, onDone, render }: { options: Word[]; correct: Word; onDone: (ok: boolean) => void; render?: (w: Word) => React.ReactNode }) {
  const [picked, setPicked] = useState<string | null>(null);
  const ok = picked === correct.loc;
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o) => {
        const isAns = o.loc === correct.loc;
        const isPick = o.loc === picked;
        return (
          <button
            key={o.loc}
            disabled={!!picked}
            onClick={() => setPicked(o.loc)}
            className={cx(
              'tap rounded-2xl border-2 bg-card px-4 py-3.5 text-left shadow-sm',
              !picked && 'border-transparent hover:border-teal-200',
              picked && isAns && 'border-teal-500 bg-teal-50 dark:bg-teal-900',
              picked && isPick && !isAns && 'animate-shake border-rose-400 bg-rose-50 dark:bg-rose-900/30',
              picked && !isPick && !isAns && 'border-transparent opacity-50',
            )}
          >
            {render ? render(o) : <Meaning w={o} />}
          </button>
        );
      })}
      {picked && <Feedback ok={ok} answer={correct} onNext={() => onDone(ok)} />}
    </div>
  );
}

// distractors: other real meanings from the surah, never the same meaning twice
const distractors = (w: Word, n = 3, seed = 3) => {
  const seen = new Set([w.en]);
  return shuffle(WORDS, seed).filter((x) => !seen.has(x.en) && seen.add(x.en)).slice(0, n);
};

/* ---------------- Ayah cloze (recall for a known word) ---------------- */
function Cloze({ w, onDone }: { w: Word; onDone: (ok: boolean) => void }) {
  const [shown, setShown] = useState(false);
  const [mode, setMode] = useState<'recall' | 'pick'>('recall');
  const options = useMemo(() => shuffle([w, ...distractors(w, 3, 7)], 5), [w]);
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-3xl bg-card p-5 shadow-card">
        <AyahContext w={w} hide={!shown} />
        <p className="mt-2 text-center text-sm text-ink-soft dark:text-ink-darksoft">Which word is hidden, and what does it mean?</p>
      </div>
      {mode === 'recall' ? (
        !shown ? (
          <div className="flex flex-col gap-2">
            <Btn onClick={() => setShown(true)} className="w-full py-4">
              Reveal
            </Btn>
            <Btn variant="ghost" className="text-sm" onClick={() => setMode('pick')}>
              I need options (counts as Hard)
            </Btn>
          </div>
        ) : (
          <div className="flex animate-pop flex-col gap-3">
            <div className="rounded-3xl bg-teal-50 p-4 text-center dark:bg-teal-900">
              <Meaning w={w} size="lg" className="items-center" />
            </div>
            <p className="text-center text-sm text-ink-soft">Did you get it right?</p>
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="soft" className="!bg-rose-50 !text-rose-700" onClick={() => onDone(false)}>
                No
              </Btn>
              <Btn onClick={() => onDone(true)}>Yes</Btn>
            </div>
          </div>
        )
      ) : (
        <Choices options={options} correct={w} onDone={onDone} />
      )}
    </div>
  );
}

/* ---------------- Listen ---------------- */
function Listen({ w, onDone }: { w: Word; onDone: (ok: boolean) => void }) {
  const options = useMemo(() => shuffle([w, ...distractors(w, 3, 11)], 2), [w]);
  useEffect(() => {
    const t = setTimeout(() => playWord(w), 400);
    return () => clearTimeout(t);
  }, [w]);
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-card p-6 shadow-card">
        <PlayButton w={w} big />
        <p className="text-sm text-ink-soft dark:text-ink-darksoft">Listen, then pick the meaning</p>
      </div>
      <Choices options={options} correct={w} onDone={onDone} />
    </div>
  );
}

/* ---------------- Match 5 ---------------- */
function Match({ words, onDone }: { words: Word[]; onDone: (ok: boolean) => void }) {
  const { s } = useSettings();
  const right = useMemo(() => shuffle(words, 9), [words]);
  const [selL, setSelL] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [t, setT] = useState(0);
  const finished = done.length === words.length;
  useEffect(() => {
    if (!s.matchTimer || finished) return;
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [s.matchTimer, finished]);

  const tapR = (loc: string) => {
    if (!selL) return;
    if (selL === loc) {
      setDone((d) => [...d, loc]);
      setSelL(null);
    } else {
      setWrong(loc);
      setMistakes((m) => m + 1);
      setTimeout(() => setWrong(null), 350);
    }
  };
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>Tap an Arabic word, then its meaning</span>
        {s.matchTimer && <span className="tabular-nums">⏱ {t}s</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2.5">
          {words.map((w) => (
            <button
              key={w.loc}
              disabled={done.includes(w.loc)}
              onClick={() => {
                setSelL(w.loc);
                playWord(w);
              }}
              className={cx(
                'tap ar h-16 rounded-2xl border-2 bg-card text-2xl shadow-sm',
                done.includes(w.loc) ? 'border-transparent opacity-30' : selL === w.loc ? 'border-teal-500 bg-teal-50 dark:bg-teal-900' : 'border-transparent',
              )}
              style={{ lineHeight: 1.4 }}
            >
              {w.ar}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          {right.map((w) => (
            <button
              key={w.loc}
              disabled={done.includes(w.loc)}
              onClick={() => tapR(w.loc)}
              className={cx(
                'tap h-16 rounded-2xl border-2 bg-card px-2 text-sm shadow-sm',
                done.includes(w.loc) ? 'border-teal-500 bg-teal-50 opacity-40 dark:bg-teal-900' : wrong === w.loc ? 'animate-shake border-rose-400' : 'border-transparent',
              )}
            >
              <Meaning w={w} size="sm" className="items-center" />
            </button>
          ))}
        </div>
      </div>
      {finished && (
        <Feedback
          ok={mistakes === 0}
          answer={mistakes === 0 ? `All 5 matched${s.matchTimer ? ` in ${t}s` : ''}.` : `All matched, with ${mistakes} mistake${mistakes > 1 ? 's' : ''}. Those words come back sooner.`}
          onNext={() => onDone(mistakes === 0)}
        />
      )}
    </div>
  );
}

/* ---------------- Ayah builder ---------------- */
function Builder({ ayah, onDone }: { ayah: number; onDone: (ok: boolean) => void }) {
  const a = AYAHS[ayah - 1];
  const pool = useMemo(() => shuffle(a.words, 4), [a]);
  const [order, setOrder] = useState<Word[]>([]);
  const complete = order.length === a.words.length;
  const ok = complete && order.every((w, i) => w.loc === a.words[i].loc);
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-3xl bg-card p-5 shadow-card">
        <p className="ar text-center ar-size">
          {a.text} <span className="text-[0.6em] text-gold-500">﴿{a.ayah.toLocaleString('ar-EG')}﴾</span>
        </p>
        <p className="mt-1 text-center text-sm text-ink-soft dark:text-ink-darksoft">Put the meanings in the order of the words (right to left)</p>
      </div>
      <div dir="rtl" className="flex min-h-[64px] flex-wrap gap-2 rounded-2xl border-2 border-dashed border-teal-200 p-2 dark:border-teal-700">
        {order.map((w, i) => (
          <button
            key={w.loc}
            disabled={complete}
            onClick={() => setOrder((o) => o.filter((x) => x.loc !== w.loc))}
            className={cx(
              'tap animate-pop rounded-xl px-3 py-2 text-sm',
              complete ? (w.loc === a.words[i].loc ? 'bg-teal-500 text-white' : 'bg-rose-400 text-white') : 'bg-teal-600 text-white',
            )}
            dir="ltr"
          >
            <Meaning w={w} size="sm" />
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pool
          .filter((w) => !order.some((o) => o.loc === w.loc))
          .map((w) => (
            <button key={w.loc} onClick={() => setOrder((o) => [...o, w])} className="tap rounded-xl bg-card px-3 py-2 text-sm shadow-sm dark:bg-white/10">
              <Meaning w={w} size="sm" />
            </button>
          ))}
      </div>
      {complete && (
        <Feedback
          ok={ok}
          answer={ok ? 'Word by word, in order.' : 'Correct order: ' + a.words.map((w) => w.en).join(' · ')}
          onNext={() => onDone(ok)}
        />
      )}
    </div>
  );
}

/* ---------------- Root detective ---------------- */
function RootDetective({ known, rootKey, lemmaIdx, onDone }: { known: Word; rootKey: string; lemmaIdx: number; onDone: (ok: boolean) => void }) {
  const r = ROOTS[rootKey];
  const target = r.lemmas[lemmaIdx];
  const ex = target.example!;
  // distractors: real glosses of words from other roots (Quranic Arabic Corpus)
  const others = useMemo(
    () =>
      shuffle(
        Object.entries(ROOTS)
          .filter(([k]) => k !== rootKey)
          .flatMap(([, x]) => x.lemmas.slice(0, 2))
          .filter((l) => l.example),
        13,
      ).slice(0, 3),
    [rootKey],
  );
  const opts = useMemo(() => shuffle([target, ...others], 8), [target, others]);
  const [picked, setPicked] = useState<string | null>(null);
  const ok = picked === target.ar;
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-3xl bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <RootBadge w={known} />
          <span className="text-xs text-ink-soft">You know</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-teal-50 px-4 py-2 dark:bg-teal-900">
          <Meaning w={known} size="sm" />
          <span className="ar text-2xl" style={{ lineHeight: 1.6 }}>
            {known.ar}
          </span>
        </div>
        <div className="my-4 text-center text-sm text-ink-soft">Same root. Can you guess this new word?</div>
        <div className="text-center">
          <span className="ar text-5xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 1.8 }}>
            {ex.ar}
          </span>
          <div className="text-xs text-ink-soft">
            {ex.loc} · {target.kind}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {opts.map((o) => {
          const isAns = o.ar === target.ar;
          const isPick = o.ar === picked;
          return (
            <button
              key={o.ar}
              disabled={!!picked}
              onClick={() => setPicked(o.ar)}
              className={cx(
                'tap rounded-2xl border-2 bg-card px-4 py-3.5 text-left shadow-sm',
                !picked && 'border-transparent',
                picked && isAns && 'border-teal-500 bg-teal-50 dark:bg-teal-900',
                picked && isPick && !isAns && 'animate-shake border-rose-400',
                picked && !isPick && !isAns && 'border-transparent opacity-50',
              )}
            >
              {o.example!.gloss}
            </button>
          );
        })}
      </div>
      {picked && (
        <Feedback
          ok={ok}
          answer={`${ex.ar} = “${ex.gloss}” (${ex.loc}). Root ${r.letters} carries the idea you already know from ${known.ar}.`}
          onNext={() => onDone(ok)}
        />
      )}
      <p className="text-center text-[11px] text-ink-soft">English glosses in this exercise: Quranic Arabic Corpus</p>
    </div>
  );
}

/* ---------------- Summary ---------------- */
function Summary({ res, onExit }: { res: SessionResult; onExit: () => void }) {
  const acc = res.total ? Math.round((res.correct / res.total) * 100) : 0;
  return (
    <div className="flex flex-1 animate-pop flex-col items-center justify-center gap-6 py-6 text-center">
      <div className="text-6xl">🌿</div>
      <div>
        <h2 className="text-2xl font-bold">Session complete</h2>
        <p className="text-ink-soft dark:text-ink-darksoft">Barakallahu feek. See you tomorrow.</p>
      </div>
      <div className="grid w-full grid-cols-3 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="text-3xl font-bold text-teal-600">{res.learned.length}</div>
          <div className="text-xs text-ink-soft">new words</div>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="text-3xl font-bold text-teal-600">{acc}%</div>
          <div className="text-xs text-ink-soft">accuracy</div>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="text-3xl font-bold text-teal-600">{res.total}</div>
          <div className="text-xs text-ink-soft">exercises</div>
        </div>
      </div>
      {res.learned.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {res.learned.map((loc) => {
            const w = WORDS.find((x) => x.loc === loc)!;
            return (
              <span key={loc} className="ar rounded-full bg-gold-100 px-3 text-xl dark:bg-gold-700/30" style={{ lineHeight: 1.8 }}>
                {w.ar}
              </span>
            );
          })}
        </div>
      )}
      <div className="w-full rounded-2xl bg-teal-50 p-4 text-left text-sm dark:bg-teal-900">
        <div className="font-semibold">Next reviews</div>
        <div className="mt-1 flex justify-between">
          <span>Later today</span>
          <b>2 words</b>
        </div>
        <div className="flex justify-between">
          <span>Tomorrow</span>
          <b>5 words</b>
        </div>
        <div className="flex justify-between">
          <span>In 3 days</span>
          <b>4 words</b>
        </div>
      </div>
      <Btn onClick={onExit} className="w-full">
        Done
      </Btn>
    </div>
  );
}

