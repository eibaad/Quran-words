import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { type Lang, type Word, type Status, ROOTS, ayahOf, playWord, rootSiblings, statusOf } from './data';

export type Settings = { lang: Lang; arSize: number; newPerDay: number; retention: number; matchTimer: boolean };
export const SettingsCtx = createContext<{ s: Settings; set: (p: Partial<Settings>) => void }>(null!);
export const useSettings = () => useContext(SettingsCtx);

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Meaning({ w, className, size = 'md' }: { w: Word; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const { s } = useSettings();
  const enCls = size === 'lg' ? 'text-2xl font-semibold' : size === 'sm' ? 'text-sm' : 'text-base font-medium';
  const urCls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';
  return (
    <div className={cx('flex flex-col gap-0.5', className)}>
      {s.lang !== 'ur' && <span className={enCls}>{w.en}</span>}
      {s.lang !== 'en' && (
        <span dir="rtl" className={cx('ur', urCls, s.lang === 'both' && 'text-ink-soft dark:text-ink-darksoft')}>
          {w.ur}
        </span>
      )}
    </div>
  );
}

export const STATUS_STYLE: Record<Status, string> = {
  new: 'text-st-new',
  learning: 'text-st-learning',
  known: 'text-st-known',
};
export const STATUS_LABEL: Record<Status, string> = { new: 'New', learning: 'Learning', known: 'Known' };

export function StatusDot({ s }: { s: Status }) {
  return <span className={cx('inline-block h-2 w-2 rounded-full', s === 'new' ? 'bg-st-new' : s === 'learning' ? 'bg-st-learning' : 'bg-st-known')} />;
}

/** The real ayah with one word highlighted. Tapping the highlighted word plays it. */
export function AyahContext({ w, hide = false, scale = 1 }: { w: Word; hide?: boolean; scale?: number }) {
  const { s } = useSettings();
  const a = ayahOf(w);
  return (
    <p className="ar text-center" style={{ fontSize: s.arSize * scale }}>
      {a.words.map((x) => {
        const on = x.loc === w.loc;
        return (
          <span key={x.loc}>
            {on ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playWord(x);
                }}
                className={cx(
                  'tap rounded-lg px-1',
                  hide ? 'bg-teal-100 text-transparent dark:bg-teal-900' : 'bg-gold-100 text-teal-700 dark:bg-gold-700/40 dark:text-gold-300',
                )}
              >
                {hide ? x.ar.replace(/./g, 'ـ') : x.ar}
              </button>
            ) : (
              <span className="opacity-60">{x.ar}</span>
            )}{' '}
          </span>
        );
      })}
      <span className="mx-1 text-[0.6em] text-gold-500">﴿{a.ayah.toLocaleString('ar-EG')}﴾</span>
    </p>
  );
}

export function PlayButton({ w, big }: { w: Word; big?: boolean }) {
  return (
    <button
      aria-label="Play recitation"
      onClick={(e) => {
        e.stopPropagation();
        playWord(w);
      }}
      className={cx(
        'tap grid place-items-center rounded-full bg-teal-600 text-white shadow-card',
        big ? 'h-20 w-20' : 'h-9 w-9',
      )}
    >
      <svg viewBox="0 0 24 24" className={big ? 'h-9 w-9' : 'h-4 w-4'} fill="currentColor">
        <path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
      </svg>
    </button>
  );
}

export function RootBadge({ w }: { w: Word }) {
  if (!w.root) return <span className="text-xs text-ink-soft dark:text-ink-darksoft">No root (particle / pronoun)</span>;
  const r = ROOTS[w.root];
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-teal-700 dark:bg-teal-900 dark:text-teal-200">
      <span className="text-xs uppercase tracking-wide">Root</span>
      <span className="ar text-lg leading-none" style={{ lineHeight: 1.4 }}>
        {r.letters}
      </span>
    </span>
  );
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 animate-fade bg-black/40" onClick={onClose} />
      <div className="safe-b relative max-h-[85vh] w-full max-w-md animate-up overflow-y-auto rounded-t-3xl bg-paper p-5 shadow-2xl dark:bg-paper-dark">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/10 dark:bg-white/20" />
        {children}
      </div>
    </div>
  );
}

/** Word details: meaning, root, related words, frequency, audio. */
export function WordDetails({ w }: { w: Word }) {
  const sibs = rootSiblings(w);
  const r = w.root ? ROOTS[w.root] : null;
  const st = statusOf(w);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <PlayButton w={w} />
        <span className="ar text-4xl text-teal-700 dark:text-teal-200" style={{ lineHeight: 1.6 }}>
          {w.ar}
        </span>
      </div>
      <Meaning w={w} size="lg" />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cx('inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10', STATUS_STYLE[st])}>
          <StatusDot s={st} /> {STATUS_LABEL[st]}
        </span>
        {w.lemma && (
          <span className="rounded-full bg-black/5 px-2.5 py-1 dark:bg-white/10">
            Appears <b>{w.lemma.count.toLocaleString()}×</b> in the Quran
          </span>
        )}
        <span className="rounded-full bg-black/5 px-2.5 py-1 text-ink-soft dark:bg-white/10 dark:text-ink-darksoft">{w.loc}</span>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card dark:bg-white/5">
        <div className="flex items-center justify-between">
          <RootBadge w={w} />
          {r && <span className="text-xs text-ink-soft dark:text-ink-darksoft">{r.count.toLocaleString()}× · {r.lemmas.length} forms</span>}
        </div>
        {w.lemma && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft dark:text-ink-darksoft">Dictionary form · {w.lemma.kind}</span>
            <span className="ar text-xl" style={{ lineHeight: 1.6 }}>
              {w.lemma.ar}
            </span>
          </div>
        )}
        {sibs.length > 0 && (
          <div className="border-t border-black/5 pt-2 dark:border-white/10">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-600">You've met from this root</div>
            {sibs.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-1">
                <Meaning w={i.word} size="sm" />
                <span className="ar text-xl" style={{ lineHeight: 1.6 }}>
                  {i.word.ar}
                </span>
              </div>
            ))}
          </div>
        )}
        {r && (
          <details className="border-t border-black/5 pt-2 text-sm dark:border-white/10">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-soft dark:text-ink-darksoft">
              All forms of this root in the Quran
            </summary>
            <div className="mt-2 flex flex-col">
              {r.lemmas.map((l) => (
                <div key={l.ar + l.kind} className="flex items-center justify-between gap-3 py-1">
                  <div className="min-w-0">
                    <div className="truncate text-xs text-ink-soft dark:text-ink-darksoft">
                      {l.kind} · {l.count}×
                    </div>
                    {l.example && <div className="truncate">“{l.example.gloss}” <span className="text-xs opacity-60">{l.example.loc}</span></div>}
                  </div>
                  <span className="ar shrink-0 text-xl" style={{ lineHeight: 1.6 }}>
                    {l.ar}
                  </span>
                </div>
              ))}
              <div className="pt-1 text-[11px] text-ink-soft dark:text-ink-darksoft">Glosses: Quranic Arabic Corpus</div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'soft';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'tap rounded-2xl px-5 py-3.5 font-semibold disabled:opacity-40',
        variant === 'primary' && 'bg-teal-600 text-white shadow-card hover:bg-teal-700',
        variant === 'soft' && 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900 dark:text-teal-100',
        variant === 'ghost' && 'text-teal-700 hover:bg-black/5 dark:text-teal-200 dark:hover:bg-white/5',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cx('rounded-3xl bg-white p-5 shadow-card dark:bg-white/5', className)}>
      {children}
    </div>
  );
}

export function ScreenTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 pt-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-ink-soft dark:text-ink-darksoft">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
