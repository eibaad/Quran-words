import { useEffect, useState } from 'react';
import Today from './screens/Today';
import Session from './screens/Session';
import Read from './screens/Read';
import Words from './screens/Words';
import Progress from './screens/Progress';
import Settings from './screens/Settings';
import Salah from './screens/Salah';
import { SettingsCtx, cx, type Settings as S } from './ui';

type Tab = 'today' | 'read' | 'words' | 'progress' | 'settings';

const ICONS: Record<Tab, string> = {
  today: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  read: 'M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2zm0 0v13',
  words: 'M4 6h16M4 12h10M4 18h7m9-2.5-2 2-1-1',
  progress: 'M4 19V9m6 10V5m6 14v-7m4 7H3',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
};
const DESIGNS = [
  { id: 'a', label: 'Garden' },
  { id: 'b', label: 'Mushaf' },
  { id: 'c', label: 'Clear' },
];
const LABEL: Record<Tab, string> = { today: 'Today', read: 'Read', words: 'Words', progress: 'Progress', settings: 'Settings' };

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [overlay, setOverlay] = useState<'session' | 'salah' | null>(null);
  const [s, setS] = useState<S>({ lang: 'both', arSize: 30, newPerDay: 10, retention: 90, matchTimer: false });
  const set = (p: Partial<S>) => setS((x) => ({ ...x, ...p }));
  const [design, setDesign] = useState<string>(() => {
    try {
      return new URLSearchParams(location.search).get('design') ?? 'b';
    } catch {
      return 'a';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.design = design;
  }, [design]);
  useEffect(() => {
    document.documentElement.style.setProperty('--ar-size', `${s.arSize}px`);
  }, [s.arSize]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <SettingsCtx.Provider value={{ s, set }}>
      <div className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="mb-1 flex items-center justify-between gap-2 rounded-full bg-gold-100 py-1 pl-3 pr-1 text-[11px] text-gold-700 dark:bg-gold-700/30 dark:text-gold-300">
          <span className="shrink-0">Prototype</span>
          <div className="flex gap-1" role="radiogroup" aria-label="Design">
            {DESIGNS.map((d) => (
              <button
                key={d.id}
                role="radio"
                aria-checked={design === d.id}
                onClick={() => setDesign(d.id)}
                className={cx('tap rounded-full px-2.5 py-1 font-semibold', design === d.id ? 'bg-gold-700 text-white dark:bg-gold-300 dark:text-black' : 'hover:bg-black/5')}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        {tab === 'today' && <Today onStart={() => setOverlay('session')} onSalah={() => setOverlay('salah')} onRead={() => setTab('read')} />}
        {tab === 'read' && <Read />}
        {tab === 'words' && <Words />}
        {tab === 'progress' && <Progress />}
        {tab === 'settings' && <Settings />}
      </div>

      <nav className="app-nav safe-b fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-paper-dark/90">
        <div className="app-nav-inner mx-auto flex max-w-md justify-around px-2 pt-1.5">
          {(Object.keys(LABEL) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx('tap flex w-16 flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium', tab === t ? 'text-teal-600 dark:text-teal-200' : 'text-ink-soft dark:text-ink-darksoft')}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={tab === t ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONS[t]} />
              </svg>
              {LABEL[t]}
            </button>
          ))}
        </div>
      </nav>

      {overlay === 'session' && <Session onExit={() => setOverlay(null)} />}
      {overlay === 'salah' && <Salah onExit={() => setOverlay(null)} />}
    </SettingsCtx.Provider>
  );
}
