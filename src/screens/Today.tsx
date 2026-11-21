import { DATA, ITEMS, quranCoverage, statusOf } from '../data';
import { Btn, Card, Ornament, useSettings } from '../ui';

export default function Today({ onStart, onSalah, onRead }: { onStart: () => void; onSalah: () => void; onRead: () => void }) {
  const { s } = useSettings();
  const known = ITEMS.filter((i) => statusOf(i.word) === 'known').length;
  const learning = ITEMS.filter((i) => statusOf(i.word) === 'learning').length;
  const fresh = ITEMS.filter((i) => statusOf(i.word) === 'new').length;
  const reviewsDue = learning + 2;
  const newToday = Math.min(s.newPerDay, fresh);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const done = [true, true, false, true, true, true, false];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-ink-soft dark:text-ink-darksoft">Assalamu alaykum</p>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <Ornament />
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1.5 text-sm font-semibold text-gold-700 dark:bg-gold-700/30 dark:text-gold-300">
          <span>🌱</span> 4 of the last 7 days
        </div>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-teal-600 to-teal-900 text-white dark:from-teal-700 dark:to-teal-900">
        <div className="pointer-events-none absolute -left-6 -top-10 select-none text-[160px] leading-none text-white/5 ar">ق</div>
        <div className="relative grid grid-cols-2 gap-4">
          <div>
            <div className="text-4xl font-bold">{reviewsDue}</div>
            <div className="text-sm text-teal-100">reviews due</div>
          </div>
          <div>
            <div className="text-4xl font-bold">{newToday}</div>
            <div className="text-sm text-teal-100">new words</div>
          </div>
        </div>
        <p className="relative mt-3 text-sm text-teal-100">Reviews first, then new words from Al-Fatiha. About 10 minutes.</p>
        <button onClick={onStart} className="tap relative mt-4 w-full rounded-2xl bg-white py-4 text-lg font-bold text-teal-700 shadow-lg">
          Start session
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <div className="text-3xl font-bold text-teal-600">{known}</div>
          <div className="text-sm text-ink-soft dark:text-ink-darksoft">words known</div>
          <div className="mt-2 text-xs text-ink-soft dark:text-ink-darksoft">
            ≈ <b className="text-teal-600">{quranCoverage().toFixed(1)}%</b> of all words in the Quran
          </div>
        </Card>
        <Card className="!p-4">
          <div className="text-sm font-semibold">This week</div>
          <div className="mt-2 flex justify-between">
            {days.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`h-4 w-4 rounded-full ${done[i] ? 'bg-teal-500' : 'bg-black/10 dark:bg-white/10'}`} />
                <span className="text-[10px] text-ink-soft dark:text-ink-darksoft">{d}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-ink-soft dark:text-ink-darksoft">Missed days are fine. Just continue.</div>
        </Card>
      </div>

      <Card onClick={onSalah} className="tap flex cursor-pointer items-center gap-4 !p-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-100 text-2xl dark:bg-gold-700/30">🕌</div>
        <div className="flex-1">
          <div className="font-semibold">Salah mode</div>
          <div className="text-sm text-ink-soft dark:text-ink-darksoft">Understand what you'll recite in your next prayer</div>
        </div>
        <span className="text-xl text-ink-soft">›</span>
      </Card>

      <Card onClick={onRead} className="tap flex cursor-pointer items-center gap-4 !p-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-50 dark:bg-teal-900">
          <span className="ar text-xl" style={{ lineHeight: 1 }}>
            {DATA.surah.nameAr}
          </span>
        </div>
        <div className="flex-1">
          <div className="font-semibold">Continue reading {DATA.surahs[0].en}</div>
          <div className="text-sm text-ink-soft dark:text-ink-darksoft">Tap any word to test yourself</div>
        </div>
        <span className="text-xl text-ink-soft">›</span>
      </Card>

      <Btn variant="ghost" className="text-sm" onClick={onStart}>
        Just review (no new words)
      </Btn>
    </div>
  );
}
