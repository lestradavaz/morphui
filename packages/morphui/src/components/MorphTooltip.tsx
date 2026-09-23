'use client';

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';

import type { MorphTriggerProps } from '../lib/trigger.js';

export interface MorphTooltipProps {
  /** The hint itself. A word, or a short sentence. */
  tip: ReactNode;
  /** Your own element, rendered exactly as you wrote it. */
  children: ReactElement<MorphTriggerProps>;
  side?: 'top' | 'bottom';
  /** How long the pointer must rest before the hint appears, in milliseconds. */
  delay?: number;
}

/**
 * A short hint for a control, on hover and on keyboard focus.
 *
 * Deliberately not a morph. A tooltip is read tens of times a day and answered
 * in a glance; the dialog's clock over a hint this small would be an eternity,
 * and the surface is a caption for the button rather than a thing the button
 * becomes. It fades and lifts into place on the library's own slide duration
 * and its own softening curve, so it still belongs to the same family.
 *
 * The hint is a description, not a name: it is attached with `aria-describedby`
 * while it is open, which means a screen reader announces the control first and
 * the hint after it, and never announces a hidden one.
 */
export function MorphTooltip({ tip, children, side = 'top', delay = 180 }: MorphTooltipProps): ReactElement {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const id = useId();

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const show = (wait = 0) => {
    clear();
    if (!wait) {
      setOpen(true);
      return;
    }
    timer.current = window.setTimeout(() => setOpen(true), wait);
  };

  const hide = () => {
    clear();
    setOpen(false);
  };

  useEffect(() => () => clear(), []);

  if (!isValidElement(children)) {
    throw new Error('MorphTooltip: `children` must be a single React element.');
  }

  const trigger = cloneElement(children, {
    onPointerEnter: (event: PointerEvent) => {
      children.props.onPointerEnter?.(event);
      // Touch fires a pointerenter before every tap, and a hint that appears on
      // the way to the tap is a hint nobody asked for.
      if (event.pointerType !== 'touch') show(delay);
    },
    onPointerLeave: () => hide(),
    onFocus: () => show(),
    onBlur: () => hide(),
    onKeyDown: (event: KeyboardEvent) => {
      children.props.onKeyDown?.(event);
      if (event.key === 'Escape') hide();
    },
    'aria-describedby': open ? id : undefined,
  });

  return (
    <span
      className="morph-tooltip"
      data-side={side}
      // Escape belongs to whichever hint is open, not to a panel behind it.
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        hide();
      }}
    >
      {trigger}
      <span id={id} role="tooltip" className="morph-tooltip__bubble" data-open={open} aria-hidden={!open}>
        {tip}
      </span>
    </span>
  );
}
