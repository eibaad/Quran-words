import { useEffect, useState } from 'react';
import { AYAHS, DATA, type Word, playWord, statusOf } from '../data';
import { AyahContext, Btn, Card, Meaning, Ornament, PlayButton, cx, useSettings } from '../ui';
import { Builder } from './Session';

/*
 * Flow 2, "Ayah path": the surah is the curriculum. You move through it one ayah at a time:
 * warm up on earlier ayahs, hear the whole ayah, recall each word in place, rebuild the meaning,
 * then read it whole with understanding. Reviews are "revisits" of ayahs you've finished.
 */

// SAMPLE progress: ayahs 1–3 done, 4 is next
const DONE = 3;
const ayahPct = (n: number) => {
  const ws = AYAHS[n - 1].words;
  return Math.round((ws.filter((w) => statusOf(w) === 'known').length / ws.length) * 100);
};

export function AyahPathHome({ onStart, onSalah }: { onStart: (ayah: number) => void; onSalah: () => void }) {
  const { s } = useSettings();
  return (
    <div className="flex flex-col gap-4">
      <div className="pt-2">
        <p className="text-sm text-ink-soft dark:text-ink-darksoft">Your path through</p>
        <h1 className="text-2xl font-bold tracking-tight">{DATA.surahs[0].en}</h1>
        <Ornament />
        <p className="mt-1 text-sm text-ink-soft dark:text-ink-darksoft">
          {DONE} of {AYAHS.length} ayahs understood · one ayah a day, with a short warm-up
        </p>
      </div>

      <Card className="!p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Revisit ayah 2</div>
            <div className="text-xs text-ink-soft">Due today · keeps ayahs 1–3 fresh</div>
          </div>
          <Btn variant="soft" className="!px-4 !py-2 text-sm" onClick={() => onStart(2)}>
            Revisit
          </Btn>
        </div>
      </Card>

      <div className="relative flex flex-col gap-3 pl-8">
        <div className="absolute bottom-6 left-[13px] top-6 w-0.5 bg-gold-300/70" />
        {AYAHS.map((a) => {
          const done = a.ayah <= DONE;
          const current = a.ayah === DONE + 1;
          return (
            <div key={a.key} className="relative">
              <div
                className={cx(
                  'absolute -left-8 top-5 grid h-7 w-7 place-items-center rounded-full text-xs font-bold',
                  done ? 'bg-teal-600 text-white' : current ? 'bg-gold-500 text-white ring-4 ring-gold-100' : 'bg-paper text-ink-soft ring-1 ring-gold-300 dark:bg-paper-dark',
                )}
              >
                {done ? '✓' : a.ayah}
              </div>
              <Card className={cx('!p-4', !done && !current && 'opacity-55', current && 'ring-2 ring-gold-500')}>
                <p className="ar text-right" style={{ fontSize: s.arSize * (current ? 0.95 : 0.8), lineHeight: 1.9 }}>
                  {a.text}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-ink-soft">
                  <span>Ayah {a.ayah} · {a.words.length} words</span>
                  {done && <span className="font-semibold text-teal-600">{ayahPct(a.ayah)}% of words known</span>}
                </div>
                {current && (
                  <Btn className="mt-3 w-full" onClick={() => onStart(a.ayah)}>
                    Learn ayah {a.ayah}
                  </Btn>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      <Card onClick={onSalah} className="tap flex cursor-pointer items-center justify-between !p-4">
        <div>
          <div className="font-semibold">Before you pray</div>
          <div className="text-sm text-ink-soft">Read the ayahs you've finished, with meanings</div>
        </div>
        <span className="text-xl text-ink-soft">›</span>
      </Card>
    </div>
  );
}

type Stage = 'warmup' | 'listen' | 'words' | 'build' | 'whole';
const STAGES: { id: Stage; label: string }[] = [
  { id: 'warmup', label: 'Warm-up' },
  { id: 'listen', label: 'Listen' },
  { id: 'words', label: 'Word by word' },
  { id: 'build', label: 'Put it together' },
  { id: 'whole', label: 'Understand it' },
];

export function AyahLesson({ ayah, onExit }: { ayah: number; onExit: () => void }) {
  const a = AYAHS[ayah - 1];
  const revisit = ayah <= DONE;
  const [stage, setStage] = useState<Stage>(revisit ? 'words' : 'warmup');
  const [wi, setWi] = useState(0);
  const [shown, setShown] = useState(false);
  const [missed, setMissed] = useState<string[]>([]);
  const warm = AYAHS.slice(0, Math.min(DONE, ayah - 1)).flatMap((x) => x.words).filter((w) => statusOf(w) !== 'new').slice(0, 3);
  const [warmI, setWarmI] = useState(0);
  const idx = STAGES.findIndex((x) => x.id === stage);

  const answer = (ok: boolean, w: Word, next: () => void) => {
    if (!ok) setMissed((m) => [...m, w.loc]);
    setShown(false);
    next();
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-paper dark:bg-paper-dark">
      <div className="mx-auto w-full max-w-md px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center gap-3">
          <button onClick={onExit} aria-label="Close" className="tap grid h-9 w-9 place-items-center rounded-full text-2xl text-ink-soft">
            ×
          </button>
          <div className="flex-1 text-center text-sm font-semibold">
            {revisit ? 'Revisit' : 'Learn'} · {DATA.surahs[0].en} {ayah}
          </div>
          <div className="w-9" />
        </div>
        <div className="mt-2 flex gap-1">
          {STAGES.map((st, i) => (
            <div key={st.id} className="flex-1">
              <div className={cx('h-1.5 rounded-full', i < idx ? 'bg-teal-500' : i === idx ? 'bg-gold-500' : 'bg-black/10 dark:bg-white/10')} />
              <div className={cx('mt-1 truncate text-center text-[10px]', i === idx ? 'font-semibold text-teal-700 dark:text-teal-200' : 'text-ink-soft')}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-4 pb-6">
        {stage === 'warmup' &&
          (warm.length === 0 ? (
            <Skip onNext={() => setStage('listen')} text="Nothing to warm up yet." />
          ) : (
            <RecallCard
              key={'w' + warmI}
              w={warm[warmI]}
              title={`Warm-up ${warmI + 1} of ${warm.length}: from earlier ayahs`}
              shown={shown}
              setShown={setShown}
              onAnswer={(ok) => answer(ok, warm[warmI], () => (warmI + 1 < warm.length ? setWarmI(warmI + 1) : setStage('listen')))}
            />
          ))}

        {stage === 'listen' && <ListenWhole ayah={ayah} onNext={() => setStage('words')} />}

        {stage === 'words' && (
          <WordStep
            key={wi}
            w={a.words[wi]}
            i={wi}
            n={a.words.length}
            shown={shown}
            setShown={setShown}
            onAnswer={(ok) => answer(ok, a.words[wi], () => (wi + 1 < a.words.length ? setWi(wi + 1) : setStage('build')))}
          />
        )}

        {stage === 'build' && (
          <div className="flex flex-1 animate-pop flex-col pt-3">
            <Builder ayah={ayah} onDone={() => setStage('whole')} />
          </div>
        )}

        {stage === 'whole' && <Whole ayah={ayah} missed={missed} onExit={onExit} />}
      </div>
    </div>
  );
}

function Skip({ text, onNext }: { text: string; onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-ink-soft">{text}</p>
      <Btn onClick={onNext}>Continue</Btn>
    </div>
  );
}

function RecallCard({ w, title, shown, setShown, onAnswer }: { w: Word; title: string; shown: boolean; setShown: (b: boolean) => void; onAnswer: (ok: boolean) => void }) {
  return (
    <div className="flex flex-1 animate-pop flex-col gap-4 pt-3">
      <div className="text-center text-xs font-semibold uppercase tracking-widest text-teal-600">{title}</div>
      <Card className="flex flex-col items-center gap-3">
        <AyahContext w={w} />
        {shown ? <Meaning w={w} size="lg" className="animate-pop items-center text-center" /> : <p className="text-sm text-ink-soft">What does the highlighted word mean here?</p>}
      </Card>
      <RecallButtons shown={shown} setShown={setShown} onAnswer={onAnswer} />
    </div>
  );
}

function RecallButtons({ shown, setShown, onAnswer }: { shown: boolean; setShown: (b: boolean) => void; onAnswer: (ok: boolean) => void }) {
  return shown ? (
    <div className="grid grid-cols-2 gap-2">
      <Btn variant="soft" className="!bg-rose-50 !text-rose-700 dark:!bg-rose-900/40 dark:!text-rose-200" onClick={() => onAnswer(false)}>
        Not yet
      </Btn>
      <Btn onClick={() => onAnswer(true)}>Got it</Btn>
    </div>
  ) : (
    <Btn className="w-full py-4" onClick={() => setShown(true)}>
      Show meaning
    </Btn>
  );
}

function ListenWhole({ ayah, onNext }: { ayah: number; onNext: () => void }) {
  const { s } = useSettings();
  const a = AYAHS[ayah - 1];
  const [playing, setPlaying] = useState<number | null>(null);
  useEffect(() => {
    if (playing === null) return;
    if (playing >= a.words.length) {
      setPlaying(null);
      return;
    }
    playWord(a.words[playing]);
    const t = setTimeout(() => setPlaying(playing + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, a]);
  return (
    <div className="flex flex-1 animate-pop flex-col gap-4 pt-3">
      <Card className="flex flex-col items-center gap-4 text-center">
        <p className="ar" style={{ fontSize: s.arSize * 1.15, lineHeight: 2.1 }}>
          {a.words.map((w, i) => (
            <span key={w.loc} className={cx('transition-colors', playing === i && 'rounded-lg bg-gold-100 text-teal-700 dark:bg-gold-700/40')}>
              {w.ar}{' '}
            </span>
          ))}
        </p>
        <button onClick={() => setPlaying(0)} className="tap flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 font-semibold text-white">
          ▶ Play word by word
        </button>
      </Card>
      <p className="text-center text-sm text-ink-soft">Read it and listen. Before we break it down, try to say what it means in your own words.</p>
      <Btn className="w-full" onClick={onNext}>
        I've tried. Break it down
      </Btn>
    </div>
  );
}

function WordStep({ w, i, n, shown, setShown, onAnswer }: { w: Word; i: number; n: number; shown: boolean; setShown: (b: boolean) => void; onAnswer: (ok: boolean) => void }) {
  const known = statusOf(w) === 'known';
  return (
    <div className="flex flex-1 animate-pop flex-col gap-4 pt-3">
      <div className="text-center text-xs font-semibold uppercase tracking-widest text-teal-600">
        Word {i + 1} of {n}
      </div>
      <Card className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <PlayButton w={w} />
          <span className="ar text-5xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 1.8 }}>
            {w.ar}
          </span>
        </div>
        <AyahContext w={w} scale={0.85} />
        {(shown || known) && <Meaning w={w} size="lg" className="animate-pop items-center text-center" />}
        {known && <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-100">You already know this one</span>}
      </Card>
      {known ? (
        <Btn className="w-full" onClick={() => onAnswer(true)}>
          Next word
        </Btn>
      ) : (
        <RecallButtons shown={shown} setShown={setShown} onAnswer={onAnswer} />
      )}
    </div>
  );
}

function Whole({ ayah, missed, onExit }: { ayah: number; missed: string[]; onExit: () => void }) {
  const { s } = useSettings();
  const a = AYAHS[ayah - 1];
  return (
    <div className="flex flex-1 animate-pop flex-col gap-4 pt-3">
      <Card>
        <div dir="rtl" className="flex flex-wrap justify-center gap-x-4 gap-y-3">
          {a.words.map((w) => (
            <div key={w.loc} className="flex flex-col items-center">
              <span className={cx('ar', missed.includes(w.loc) ? 'text-st-learning' : 'text-teal-700 dark:text-teal-200')} style={{ fontSize: s.arSize, lineHeight: 1.9 }}>
                {w.ar}
              </span>
              <span dir="ltr" className="max-w-[110px] text-center text-xs">
                <Meaning w={w} size="sm" className="items-center" />
              </span>
            </div>
          ))}
        </div>
      </Card>
      <p className="text-center text-sm text-ink-soft">
        Read it once more, slowly, holding the meaning. {missed.length > 0 && `The ${missed.length} word${missed.length > 1 ? 's' : ''} in amber will come back tomorrow.`}
      </p>
      <Btn className="w-full" onClick={onExit}>
        I understand ayah {ayah}
      </Btn>
    </div>
  );
}
