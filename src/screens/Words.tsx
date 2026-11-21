import { useMemo, useState } from 'react';
import { ITEMS, ROOTS, type Status, type Word, statusOf } from '../data';
import { Meaning, STATUS_LABEL, ScreenTitle, Sheet, StatusDot, WordDetails, cx } from '../ui';

const strip = (s: string) => s.replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/ٱ/g, 'ا');

export default function Words() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status | 'all'>('all');
  const [root, setRoot] = useState<string | 'all'>('all');
  const [sel, setSel] = useState<Word | null>(null);
  const list = useMemo(
    () =>
      ITEMS.filter((i) => {
        const w = i.word;
        if (status !== 'all' && statusOf(w) !== status) return false;
        if (root !== 'all' && w.root !== root) return false;
        if (!q) return true;
        const n = q.toLowerCase();
        return strip(w.ar).includes(strip(q)) || w.en.toLowerCase().includes(n) || w.ur.includes(q) || (w.root && ROOTS[w.root].letters.replace(/ /g, '').includes(strip(q).replace(/ /g, '')));
      }),
    [q, status, root],
  );
  const rootsInSet = [...new Set(ITEMS.map((i) => i.word.root).filter(Boolean))] as string[];

  return (
    <div>
      <ScreenTitle title="Words" sub={`${ITEMS.length} words in Al-Fatiha, most frequent in the Quran first`} />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Arabic, English, Urdu or root…"
        className="mb-3 w-full rounded-2xl border-0 bg-card px-4 py-3 shadow-card outline-none ring-teal-400 focus:ring-2 dark:bg-white/10"
      />
      <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {(['all', 'new', 'learning', 'known'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setStatus(st)}
            className={cx('tap shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium', status === st ? 'bg-teal-600 text-white' : 'bg-card shadow-sm dark:bg-white/10')}
          >
            {st === 'all' ? 'All' : STATUS_LABEL[st]}
          </button>
        ))}
        <select
          value={root}
          onChange={(e) => setRoot(e.target.value)}
          className="shrink-0 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm dark:bg-white/10"
        >
          <option value="all">Any root</option>
          {rootsInSet.map((r) => (
            <option key={r} value={r}>
              {ROOTS[r].letters}
            </option>
          ))}
        </select>
        <select className="shrink-0 rounded-full bg-card px-3 py-1.5 text-sm shadow-sm dark:bg-white/10">
          <option>Al-Fatiha</option>
        </select>
      </div>
      <div className="flex flex-col divide-y divide-black/5 overflow-hidden rounded-3xl bg-card shadow-card dark:divide-white/10">
        {list.map((i) => {
          const st = statusOf(i.word);
          return (
            <button key={i.id} onClick={() => setSel(i.word)} className="tap flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[.02]">
              <StatusDot s={st} />
              <div className="min-w-0 flex-1">
                <Meaning w={i.word} size="sm" />
                <div className="text-[11px] text-ink-soft dark:text-ink-darksoft">
                  {i.freq ? `${i.freq.toLocaleString()}× in Quran` : 'particle'}
                  {i.word.root && <> · root <span className="ar">{ROOTS[i.word.root].letters}</span></>}
                </div>
              </div>
              <span className="ar text-2xl" style={{ lineHeight: 1.7 }}>
                {i.word.ar}
              </span>
            </button>
          );
        })}
        {list.length === 0 && <div className="p-6 text-center text-sm text-ink-soft">No words match.</div>}
      </div>
      <Sheet open={!!sel} onClose={() => setSel(null)}>
        {sel && <WordDetails w={sel} />}
      </Sheet>
    </div>
  );
}
