import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import gsap from 'gsap';
import { EASE_IN_OUT_SOFT, motionSeconds, prefersReducedMotion } from './motion';
import './tabs.css';

/* ── MorphTabs ─────────────────────────────────────── */

interface Tab {
  label: string;
  content: ReactNode;
}

interface MorphTabsProps {
  tabs: Tab[];
  defaultIndex?: number;
}

export function MorphTabs({ tabs, defaultIndex = 0 }: MorphTabsProps) {
  const [active, setActive] = useState(defaultIndex);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const animateNext = useRef(false);
  const uid = useId();

  const moveIndicator = useCallback(
    (index: number, animate: boolean) => {
      const el = tabRefs.current[index];
      const indicator = indicatorRef.current;
      if (!el || !indicator) return;

      const bar = el.parentElement!;
      const barRect = bar.getBoundingClientRect();
      const tabRect = el.getBoundingClientRect();

      const x = tabRect.left - barRect.left;
      const w = tabRect.width;

      gsap.killTweensOf(indicator);
      if (!animate || prefersReducedMotion()) {
        gsap.set(indicator, { x, width: w });
      } else {
        gsap.to(indicator, { x, width: w, duration: motionSeconds(indicator, 0.2), ease: EASE_IN_OUT_SOFT });
      }
    },
    [],
  );

  useLayoutEffect(() => {
    moveIndicator(active, animateNext.current);
    animateNext.current = false;
  }, [active, moveIndicator]);

  useLayoutEffect(() => {
    const onResize = () => moveIndicator(active, false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, moveIndicator]);

  const switchTab = useCallback(
    (index: number, animate = true) => {
      if (index === active) return;
      animateNext.current = animate;
      setActive(index);
    },
    [active],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let next = active;
      if (e.key === 'ArrowRight') next = (active + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (active - 1 + tabs.length) % tabs.length;
      else return;

      e.preventDefault();
      tabRefs.current[next]?.focus();
      switchTab(next, false);
    },
    [active, tabs.length, switchTab],
  );

  const tabId = (i: number) => `${uid}-tab-${i}`;
  const panelId = (i: number) => `${uid}-panel-${i}`;

  return (
    <div className="morph-tabs">
      <div className="morph-tabs-bar" role="tablist" aria-label="Component details" onKeyDown={onKeyDown}>
        <span ref={indicatorRef} className="morph-tabs-indicator" aria-hidden="true" />
        {tabs.map((tab, i) => (
          <button
            key={i}
            ref={(el) => { tabRefs.current[i] = el; }}
            id={tabId(i)}
            role="tab"
            type="button"
            className="morph-tabs-tab"
            aria-selected={i === active}
            aria-controls={panelId(i)}
            tabIndex={i === active ? 0 : -1}
            onClick={(event) => switchTab(i, event.detail !== 0)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={panelId(active)}
        role="tabpanel"
        className="morph-tabs-panel"
        aria-labelledby={tabId(active)}
      >
        <div className="morph-tabs-panel-inner">
          {tabs[active]?.content}
        </div>
      </div>
    </div>
  );
}

/* ── Demo ─────────────────────────────────────────── */

const TABS: Tab[] = [
  {
    label: 'Overview',
    content: (
      <p style={{ margin: 0, color: 'var(--morph-muted)' }}>
        Explore controls in context. The selected pill moves to the next tab while the panel
        updates immediately, so keyboard navigation stays direct.
      </p>
    ),
  },
  {
    label: 'Features',
    content: (
      <p style={{ margin: 0, color: 'var(--morph-muted)' }}>
        Themes use semantic color tokens. Existing panels use GSAP Flip for geometry and preserve
        shared words or images as the surface changes shape.
      </p>
    ),
  },
  {
    label: 'Try it',
    content: (
      <p style={{ margin: 0, color: 'var(--morph-muted)' }}>
        Use the arrow keys to change tabs. Switch theme or mode above to see the same component
        in a different palette.
      </p>
    ),
  },
];

export function TabsDemo() {
  return (
    <section className="stage" aria-label="Tabs example">
      <MorphTabs tabs={TABS} />
    </section>
  );
}
