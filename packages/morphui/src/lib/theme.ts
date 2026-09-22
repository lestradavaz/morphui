/**
 * Theme and mode are two independent axes, both driven by attributes on an
 * element (normally `<html>`):
 *
 *   data-morph-theme="ink | green | cobalt | terracotta | teal | crimson | plum"
 *   data-morph-mode="light | dark"        omit to follow prefers-color-scheme
 *
 * Nothing here is required to use MorphUI - you can set the attributes yourself,
 * or never set them at all and get Ink following the system. These helpers exist
 * so a theme switcher is a couple of lines instead of a pile of string literals.
 */

export const MORPH_THEMES = [
  'ink',
  'green',
  'cobalt',
  'terracotta',
  'teal',
  'crimson',
  'plum',
] as const;

export type MorphTheme = (typeof MORPH_THEMES)[number];

/** `'system'` removes the attribute and lets `prefers-color-scheme` decide. */
export type MorphMode = 'light' | 'dark' | 'system';

export const THEME_ATTRIBUTE = 'data-morph-theme';
export const MODE_ATTRIBUTE = 'data-morph-mode';

const isTheme = (value: string): value is MorphTheme =>
  (MORPH_THEMES as readonly string[]).includes(value);

function target(el?: Element | null): HTMLElement | null {
  if (el instanceof HTMLElement) return el;
  return typeof document === 'undefined' ? null : document.documentElement;
}

/** Ink is the default, so setting it clears the attribute rather than writing it. */
export function setMorphTheme(theme: MorphTheme, el?: Element | null): void {
  const node = target(el);
  if (!node) return;
  if (theme === 'ink') node.removeAttribute(THEME_ATTRIBUTE);
  else node.setAttribute(THEME_ATTRIBUTE, theme);
}

export function getMorphTheme(el?: Element | null): MorphTheme {
  const value = target(el)?.getAttribute(THEME_ATTRIBUTE);
  return value && isTheme(value) ? value : 'ink';
}

export function setMorphMode(mode: MorphMode, el?: Element | null): void {
  const node = target(el);
  if (!node) return;
  if (mode === 'system') node.removeAttribute(MODE_ATTRIBUTE);
  else node.setAttribute(MODE_ATTRIBUTE, mode);
}

export function getMorphMode(el?: Element | null): MorphMode {
  const value = target(el)?.getAttribute(MODE_ATTRIBUTE);
  return value === 'light' || value === 'dark' ? value : 'system';
}

/** What the user actually sees right now, with `'system'` already resolved. */
export function resolveMorphMode(el?: Element | null): 'light' | 'dark' {
  const mode = getMorphMode(el);
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
