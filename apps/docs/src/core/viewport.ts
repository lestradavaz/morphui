/**
 * Reports when an element is on screen, using scroll and resize rather than an
 * IntersectionObserver.
 *
 * Observing the hero's decorative background — absolutely positioned, full
 * bleed, behind the page — made Chrome land 26px above its restored scroll on
 * every reload, so the homepage crept upward and flashed the hero past the
 * reader each time. Scroll events fire at most once a frame and the rect read
 * happens when layout is already clean, so this costs less than it looks.
 */
export function watchViewport(element: Element, onChange: (visible: boolean) => void): () => void {
  let visible: boolean | null = null;
  const check = () => {
    const rect = element.getBoundingClientRect();
    const next = rect.bottom > 0 && rect.top < innerHeight;
    if (next !== visible) { visible = next; onChange(next); }
  };
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check, { passive: true });
  check();
  return () => { removeEventListener('scroll', check); removeEventListener('resize', check); };
}
