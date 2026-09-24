import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/*
 * Smoothed wheel scrolling for a mouse or trackpad, and nothing else. A touch
 * screen already has momentum of its own and a reader who asked for reduced
 * motion gets the page moving exactly as far as they scrolled, so on either of
 * those Lenis is never constructed: no listeners, no classes, no frame loop.
 */
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let lenis: Lenis | undefined;

const wanted = () => pointer.matches && !reduced.matches;

const start = () => {
  if (lenis || !wanted()) return;
  lenis = new Lenis({
    autoRaf: true,
    // Lists, code blocks and the sidebar keep scrolling themselves.
    allowNestedScroll: true,
    // A modal dialog owns the wheel while it is open, as it did before.
    prevent: node => node.localName === 'dialog',
  });
};

const stop = () => {
  lenis?.destroy();
  lenis = undefined;
};

const sync = () => (wanted() ? start() : stop());
pointer.addEventListener('change', sync);
reduced.addEventListener('change', sync);

/* The router replaces the root's attributes on every swap, which takes Lenis's
   classes with it, and an inertia still running would carry on into the next
   page. Tear down before the swap, build again once the page is ready. */
document.addEventListener('astro:before-swap', stop);
document.addEventListener('astro:page-load', start);

/*
 * Same-page anchors glide with Lenis rather than jump. Only pointer clicks:
 * a keyboard activation (detail 0), the skip link above all, keeps the native
 * jump that also moves the focus starting point. Capture phase, so the router
 * sees the click as handled and leaves it alone.
 */
document.addEventListener('click', event => {
  if (!lenis || event.defaultPrevented || event.detail === 0 || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest?.('a[href]');
  if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== '_self')) return;
  const url = new URL(link.href);
  if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!target) return;
  event.preventDefault();
  // Same entry shape the router writes for a hash change, so Back still works.
  if (url.hash !== location.hash) history.pushState(history.state, '', url.hash);
  lenis.scrollTo(target);
}, { capture: true });
