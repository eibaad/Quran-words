import { WORDS } from '../data';
import { Card, Meaning, ScreenTitle, cx, useSettings } from '../ui';

const SOURCES = [
  {
    name: 'Tanzil Quran Text (Uthmani)',
    url: 'https://tanzil.net',
    use: 'The Arabic text of every ayah.',
    license: 'Copyright © Tanzil Project. Verbatim copies may be distributed and used in any app, provided the source is clearly indicated with a link to tanzil.net. Changing the text is not allowed.',
  },
  {
    name: 'Quranic Arabic Corpus (v0.4)',
    url: 'https://corpus.quran.com',
    use: 'Roots, lemmas (dictionary forms), how often each appears, and the glosses in Root detective.',
    license: 'Copyright © 2011 Kais Dukes, University of Leeds. GNU General Public License. May be used in any app if the source is clearly indicated with a link to corpus.quran.com.',
  },
  {
    name: 'Quran.com / Quran Foundation: word by word',
    url: 'https://quran.com',
    use: 'English and Urdu word-by-word meanings, surah names, and word-by-word recitation audio.',
    license: 'Used through the public Quran.com API for personal, non-commercial study, with attribution. The audio and translations remain the property of their owners.',
  },
  {
    name: 'Amiri Quran font',
    url: 'https://github.com/aliftype/amiri',
    use: 'Arabic Quran script.',
    license: 'SIL Open Font License 1.1 (Khaled Hosny).',
  },
  {
    name: 'Noto Nastaliq Urdu font',
    url: 'https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu',
    use: 'Urdu meanings.',
    license: 'SIL Open Font License 1.1 (Google).',
  },
  {
    name: 'ts-fsrs',
    url: 'https://github.com/open-spaced-repetition/ts-fsrs',
    use: 'FSRS spaced-repetition scheduling.',
    license: 'MIT License.',
  },
];

function Row({ label, children, sub }: { label: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="font-medium">{label}</div>
        {sub && <div className="text-xs text-ink-soft dark:text-ink-darksoft">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { s, set } = useSettings();
  const sample = WORDS[4];
  return (
    <div className="flex flex-col gap-4">
      <ScreenTitle title="Settings" />
      <Card className="!py-2">
        <Row label="Meanings in">
          <div className="flex rounded-xl bg-teal-50 p-1 text-sm font-semibold dark:bg-teal-900">
            {(['en', 'ur', 'both'] as const).map((l) => (
              <button key={l} onClick={() => set({ lang: l })} className={cx('tap rounded-lg px-3 py-1.5', s.lang === l && 'bg-card shadow dark:bg-teal-700')}>
                {l === 'en' ? 'English' : l === 'ur' ? 'اردو' : 'Both'}
              </button>
            ))}
          </div>
        </Row>
        <div className="border-t border-black/5 py-3 dark:border-white/10">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium">Arabic size</div>
            <span className="text-sm tabular-nums text-ink-soft">{s.arSize}px</span>
          </div>
          <input type="range" min={20} max={48} value={s.arSize} onChange={(e) => set({ arSize: +e.target.value })} className="w-full accent-teal-600" />
          <div className="mt-2 flex items-center justify-between rounded-2xl bg-paper p-3 dark:bg-black/20">
            <Meaning w={sample} size="sm" />
            <span className="ar" style={{ fontSize: s.arSize }}>
              {sample.ar}
            </span>
          </div>
        </div>
      </Card>

      <Card className="!py-2">
        <Row label="New words per day" sub="Reviews always come first">
          <div className="flex items-center gap-2">
            <button onClick={() => set({ newPerDay: Math.max(0, s.newPerDay - 5) })} className="tap h-9 w-9 rounded-full bg-teal-50 text-lg font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-100">
              −
            </button>
            <span className="w-8 text-center text-lg font-semibold tabular-nums">{s.newPerDay}</span>
            <button onClick={() => set({ newPerDay: Math.min(50, s.newPerDay + 5) })} className="tap h-9 w-9 rounded-full bg-teal-50 text-lg font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-100">
              +
            </button>
          </div>
        </Row>
        <div className="border-t border-black/5 py-3 dark:border-white/10">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="font-medium">Target retention</div>
              <div className="text-xs text-ink-soft">Higher means more reviews (FSRS)</div>
            </div>
            <span className="text-sm font-semibold tabular-nums text-teal-600">{s.retention}%</span>
          </div>
          <input type="range" min={80} max={97} value={s.retention} onChange={(e) => set({ retention: +e.target.value })} className="w-full accent-teal-600" />
        </div>
        <Row label="Timer in Match">
          <button
            onClick={() => set({ matchTimer: !s.matchTimer })}
            className={cx('relative h-7 w-12 rounded-full transition-colors', s.matchTimer ? 'bg-teal-600' : 'bg-black/15 dark:bg-white/20')}
          >
            <span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-all', s.matchTimer ? 'left-[22px]' : 'left-0.5')} />
          </button>
        </Row>
      </Card>

      <Card className="!py-2">
        <Row label="Back up progress" sub="Saves a JSON file you can keep anywhere">
          <button className="tap rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Export</button>
        </Row>
        <Row label="Restore from backup" sub="Replaces progress on this device">
          <button className="tap rounded-xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-100">Import</button>
        </Row>
        <p className="pb-2 text-xs text-ink-soft">Progress stays on this phone. No account, nothing sent anywhere.</p>
      </Card>

      <div>
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-ink-soft">Sources and licenses</h2>
        <Card className="!py-1">
          {SOURCES.map((x, i) => (
            <div key={x.name} className={cx('py-3', i > 0 && 'border-t border-black/5 dark:border-white/10')}>
              <a href={x.url} target="_blank" rel="noreferrer" className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-200">
                {x.name}
              </a>
              <div className="text-sm">{x.use}</div>
              <div className="mt-1 text-xs text-ink-soft dark:text-ink-darksoft">{x.license}</div>
            </div>
          ))}
        </Card>
        <p className="mt-3 px-1 text-xs text-ink-soft">
          No Quranic text, meaning or root in this app was typed or generated by hand. All of it is pulled from the sources above when the app is built.
        </p>
      </div>
    </div>
  );
}
