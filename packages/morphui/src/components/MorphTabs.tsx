'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import gsap from 'gsap';

import { EASE_IN_OUT_SOFT, registerMorphEases } from '../lib/easing.js';
import { prefersReducedMotion, slowFactor } from '../lib/measure.js';

registerMorphEases();

/** How long the indicator takes to reach the next tab, before `--morph-slow` has its say. */
const MOVE = 0.2;

export interface MorphTab {
  label: string;
  content: ReactNode;
}

export interface MorphTabsProps {
  tabs: MorphTab[];
  /** Which tab starts selected. The component then keeps the choice itself. */
  defaultIndex?: number;
  /** An accessible name for the tab list, so a page with two of them is navigable. */
  label?: string;
  onSelect?: (index: number) => void;
}

/**
 * Tabs on a chip track, with the selected pill sliding between them.
 *
 * The panel changes immediately and the pill takes its time, which is the
 * deliberate split: the reader asked for the tab, so the tab has to be there,
 * and the pill is only the record of where they are. A panel that faded in
 * behind a moving pill would make every press feel slower than it is.
 *
 * Arrow keys move both, and they move without the slide: a keyboard is repeat
 * pressed, and a pill that takes 200ms to catch up with the fifth press is a
 * pill that is somewhere else when the reader stops.
 */
export function MorphTabs({ tabs, defaultIndex = 0, label = 'Sections', onSelect }: MorphTabsProps): ReactElement {
  const [active, setActive] = useState(defaultIndex);
  const barRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** A press animates; a keyboard move does not, and neither is the first pass. */
  const animate = useRef(false);
  const uid = useId();

  const move = useCallback((index: number, glide: boolean) => {
    const indicator = indicatorRef.current;
    const tab = tabRefs.current[index];
    const bar = barRef.current;
    if (!indicator || !tab || !bar) return;

    const barRect = bar.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const geometry = { x: tabRect.left - barRect.left, width: tabRect.width };

    gsap.killTweensOf(indicator);
    if (!glide || prefersReducedMotion()) gsap.set(indicator, geometry);
    else gsap.to(indicator, { ...geometry, duration: MOVE * slowFactor(indicator), ease: EASE_IN_OUT_SOFT });
  }, []);

  useLayoutEffect(() => {
    move(active, animate.current);
    animate.current = false;
  }, [active, move]);

  // A bar whose tabs were re-wrapped by the page's own layout has the pill at
  // the wrong offset otherwise, and the pill is what says which tab is on.
  useEffect(() => {
    const place = () => move(active, false);
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [active, move]);

  const select = (index: number, glide = true) => {
    if (index === active) return;
    animate.current = glide;
    setActive(index);
    onSelect?.(index);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight' ? (active + 1) % tabs.length :
      event.key === 'ArrowLeft' ? (active - 1 + tabs.length) % tabs.length :
      event.key === 'Home' ? 0 :
      event.key === 'End' ? last :
      null;
    if (next === null) return;
    // Prevented even when the arrow goes nowhere, or Home scrolls the page out
    // from under a tab list that is already at its first tab.
    event.preventDefault();
    if (next === active) return;
    tabRefs.current[next]?.focus();
    select(next, false);
  };

  const tabId = (index: number) => `${uid}-tab-${index}`;
  const panelId = (index: number) => `${uid}-panel-${index}`;

  return (
    <div className="morph-tabs">
      <div ref={barRef} className="morph-tabs__bar" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        <span ref={indicatorRef} className="morph-tabs__indicator" aria-hidden="true" />
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            ref={(node) => { tabRefs.current[index] = node; }}
            id={tabId(index)}
            type="button"
            role="tab"
            className="morph-tabs__tab"
            aria-selected={index === active}
            aria-controls={panelId(index)}
            // Only the selected tab is in the tab order; the arrow keys are how
            // the rest are reached, which is what a tab list is expected to do.
            tabIndex={index === active ? 0 : -1}
            onClick={(event) => select(index, event.detail !== 0)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id={panelId(active)} role="tabpanel" className="morph-tabs__panel" aria-labelledby={tabId(active)}>
        <div className="morph-tabs__panel-inner">{tabs[active]?.content}</div>
      </div>
    </div>
  );
}
