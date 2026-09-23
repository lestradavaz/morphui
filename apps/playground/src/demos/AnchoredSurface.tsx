import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { closeAnchoredSurface, openAnchoredSurface } from '../../../../packages/morphui/src/lib/anchored-morph';
import type { Box } from '../../../../packages/morphui/src/lib/measure';
import './anchored.css';

interface AnchoredSurfaceProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  width: number;
  height: number;
  /** Where a pointer opened this, when that is not the anchor's own box. */
  point?: { x: number; y: number } | null;
  className?: string;
  role?: 'dialog' | 'menu' | 'presentation';
  label?: string;
  /** Fly the anchor's words into the element marked `data-morph-words`. */
  shareWords?: boolean;
}

interface Target {
  /** Where the surface rests, in viewport coordinates. */
  place: { left: number; top: number; width: number; height: number };
  /** The box it grows out of, and shrinks back onto. */
  origin: Box;
}

/**
 * A surface that grows out of its trigger and shrinks back onto it.
 *
 * The morph itself belongs to `openAnchoredSurface` - the same Flip geometry,
 * corner compensation, borrowed fill and shared flight the dialog uses, on a
 * shorter clock. What is left here is the part that is React's: where the box
 * lands, keeping one transition at a time, and the layers the flight is drawn
 * in sitting outside the surface so they are not carried by its transform.
 */
export function AnchoredSurface({ open, anchorRef, onClose, children, width, height, point, className, role = 'presentation', label, shareWords }: AnchoredSurfaceProps) {
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  /** The surface is up: opened, and not yet told to leave. */
  const live = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  /** The state the last render asked for, which is the one that wins. */
  const desired = useRef(open);
  desired.current = open;

  const measure = useCallback((): Target | null => {
    const anchor = anchorRef.current?.getBoundingClientRect() ?? null;
    if (!anchor && !point) return null;
    const x = point ? point.x : anchor!.left;
    const y = point ? point.y : anchor!.top;
    const bottom = point ? point.y : anchor!.bottom;

    const panelWidth = Math.min(width, window.innerWidth - 24);
    const panelHeight = Math.min(height, window.innerHeight - 24);
    const below = bottom + (point ? 2 : 8);
    const above = y - panelHeight - 8;

    /*
     * A menu opened at a point still grows out of the element it was opened on:
     * that is what makes it read as the row unfolding rather than as a panel
     * pasted near the pointer. Only a pointer outside anything measurable falls
     * back to the point itself, and then the surface opens out of a dot.
     */
    const inside = !!point && !!anchor
      && point.x >= anchor.left && point.x <= anchor.right
      && point.y >= anchor.top && point.y <= anchor.bottom;
    const origin: Box = anchor && (!point || inside)
      ? { x: anchor.left, y: anchor.top, width: anchor.width, height: anchor.height }
      : { x: (point?.x ?? 0) - 1, y: (point?.y ?? 0) - 1, width: 2, height: 2 };

    return {
      place: {
        left: Math.min(Math.max(x, 12), window.innerWidth - panelWidth - 12),
        // Below the trigger unless that runs off the bottom, and then above it -
        // or pinned to the top when neither fits.
        top: below + panelHeight <= window.innerHeight - 12 || below <= 12 ? below : Math.max(12, above),
        width: panelWidth,
        height: panelHeight,
      },
      origin,
    };
  }, [anchorRef, point, width, height]);

  const parts = useCallback(() => {
    const trigger = anchorRef.current;
    const surface = surfaceRef.current;
    const content = contentRef.current;
    const host = hostRef.current;
    return trigger && surface && content && host ? { trigger, surface, content, host } : null;
  }, [anchorRef]);

  /*
   * Brings the surface to whatever the last render asked for, and keeps asking
   * until it is there.
   *
   * A transition is not a lock on the state: a click that lands while the
   * opposite one is still running is the user changing their mind, and the
   * answer is the state they asked for last, not the one already in flight.
   * Neither direction may be swallowed - dropping an open leaves a trigger that
   * does nothing, and dropping a close leaves a panel the user cannot get rid of
   * - so each pass waits out whatever is running and looks again.
   */
  const reconcile = useCallback(async () => {
    const p = parts();
    if (!p) return;
    // Bounded: the loop only continues while there is a real direction to take,
    // and every pass either finishes a transition or returns.
    for (let pass = 0; pass < 4; pass++) {
      const target = measure();
      if (!target) return;
      const want = desired.current;

      // The box, every time. Only the first open morphs, but a surface that is
      // already up still has to move when the point it was opened at moves.
      gsap.set(p.surface, {
        left: target.place.left,
        top: target.place.top,
        width: target.place.width,
        height: target.place.height,
        visibility: 'visible',
        pointerEvents: want ? 'auto' : 'none',
      });

      if (want === live.current && !inFlight.current) return;
      if (inFlight.current) {
        await inFlight.current.catch(() => {});
        continue;
      }

      live.current = want;
      const run = want
        ? openAnchoredSurface(p, { origin: target.origin, shareWords })
        : closeAnchoredSurface(p, { origin: target.origin, shareWords });
      inFlight.current = run;
      try {
        await run;
      } finally {
        inFlight.current = null;
      }

      if (want === desired.current) {
        if (want) {
          // The box is this component's, not the engine's: whatever the
          // transition cleared on its way out, the surface is still where it
          // was put.
          gsap.set(p.surface, { left: target.place.left, top: target.place.top, width: target.place.width, height: target.place.height });
        } else {
          setMounted(false);
        }
        return;
      }
      // They changed their mind while it ran. Go round again.
    }
  }, [parts, measure, shareWords]);

  // Before the first paint of the surface, so it is never seen at its resting
  // box without the transform that belongs there.
  useLayoutEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    if (!mounted) return;
    void reconcile();
  }, [open, mounted, reconcile]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (surfaceRef.current?.contains(event.target as Node) || anchorRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
      anchorRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const target = measure();
      const surface = surfaceRef.current;
      if (target && surface) {
        gsap.set(surface, { left: target.place.left, top: target.place.top, width: target.place.width, height: target.place.height });
      }
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, measure]);

  if (!mounted) return null;

  /*
   * The host is deliberately bare: a fixed child only resolves against the
   * viewport while nothing between it and the root establishes a containing
   * block, and the flying layers are placed in viewport coordinates.
   */
  return createPortal(
    <div ref={hostRef}>
      <div
        ref={surfaceRef}
        role={role}
        aria-label={label}
        aria-hidden={!open}
        inert={!open}
        className={['morph-anchored', className].filter(Boolean).join(' ')}
        style={{ visibility: 'hidden' }}
      >
        <div ref={contentRef} className="morph-anchored__content">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
