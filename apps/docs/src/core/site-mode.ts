import { useSyncExternalStore } from 'react';

export type Mode = 'light' | 'dark';

/*
 * The header writes two things on <html>: `data-site-mode`, which is what the
 * reader picked, and `data-morph-mode`, which is what that resolves to once
 * "System" has been read against the operating system. The second is the one
 * worth following - already resolved, and rewritten both when the reader
 * changes the control and when the system preference changes underneath a page
 * left open on "System".
 */
const watchDocument = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-morph-mode'] });
  return () => observer.disconnect();
};

const readDocument = (): Mode => (document.documentElement.dataset.morphMode === 'dark' ? 'dark' : 'light');

const dark = () => window.matchMedia('(prefers-color-scheme: dark)');

const watchSystem = (onChange: () => void): (() => void) => {
  const media = dark();
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

const readSystem = (): Mode => (dark().matches ? 'dark' : 'light');

// Prerendered HTML has no <html> to read and no reader to have a preference,
// so both come back light and are corrected on the first client render.
const prerendered = (): Mode => 'light';

/** The appearance the site is currently showing, resolved and kept current. */
export function useSiteMode(): Mode {
  return useSyncExternalStore(watchDocument, readDocument, prerendered);
}

/**
 * The mode attribute a themed block needs in order to show `mode`, or nothing
 * when it would already show it unaided.
 *
 * A themed element with no mode of its own follows `prefers-color-scheme`, so
 * for a reader on "System" - and for anyone whose choice happens to match their
 * system - the right thing is to say nothing at all. That matters because this
 * page was rendered ahead of time, by a build that could not know any of it: an
 * attribute written here is one the first paint gets wrong and a moment of
 * React's time to put right. Saying nothing is correct from the first frame.
 */
export function useModeAttribute(mode: Mode | null): Mode | undefined {
  const site = useSiteMode();
  const system = useSyncExternalStore(watchSystem, readSystem, prerendered);
  const wanted = mode ?? site;
  return wanted === system ? undefined : wanted;
}
