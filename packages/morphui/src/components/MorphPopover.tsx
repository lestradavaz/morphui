'use client';

import { cloneElement, isValidElement, useCallback, useId, useRef, useState, type ReactElement, type ReactNode, type Ref } from 'react';

import type { MorphTriggerProps } from '../lib/trigger.js';
import { AnchoredSurface } from './AnchoredSurface.js';
import { MorphCloseContext } from './MorphClose.js';

export interface MorphPopoverProps {
  /**
   * Your own element, rendered exactly as you wrote it. MorphUI attaches a ref,
   * an onClick and the aria wiring, and changes nothing else.
   */
  trigger: ReactElement<MorphTriggerProps>;
  children: ReactNode;
  /** An accessible name for the panel. Set this for every popover. */
  label: string;
  /** The resting size. Left out, the surface is measured as it lays itself out. */
  width?: number;
  height?: number;
  /** Fly the trigger's words into the panel heading. Mark it `data-morph-words`. */
  shareWords?: boolean;
  /** Classes on the surface. Use this to set its appearance. */
  panelClassName?: string;
  /** Opens on mount. For a popover that is part of a guided first run. */
  defaultOpen?: boolean;
  /** Notification when the surface is asked to open, and when it has closed. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * A small surface that grows out of the control it belongs to, and shrinks back
 * onto it when it is dismissed.
 *
 * This is the dialog's morph without the dialog's modality: the panel opens out
 * of the trigger's own box, borrows its fill and its shadow for the first beat,
 * and carries its contents on a transform rather than reflowing them - but the
 * page behind it stays live, there is no tint, and nothing is made inert. That
 * is the whole of the difference, and it is why a popover is a sibling of
 * MorphDialog rather than a variant of it.
 *
 * Dismissal is an outside press, Escape, or anything wrapped in `MorphClose`.
 * Focus is not trapped: a surface that does not cover the page has no business
 * holding the keyboard.
 */
export function MorphPopover({
  trigger,
  children,
  label,
  width,
  height,
  shareWords = false,
  panelClassName,
  defaultOpen = false,
  onOpenChange,
}: MorphPopoverProps): ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  const anchorRef = useRef<HTMLElement | null>(null);
  const panelId = useId();

  const change = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );
  const close = useCallback(() => change(false), [change]);

  if (!isValidElement(trigger)) {
    throw new Error('MorphPopover: `trigger` must be a single React element.');
  }

  const triggerNode = cloneElement(trigger, {
    ref: (node: HTMLElement | null) => {
      anchorRef.current = node;
      const original = (trigger as { ref?: Ref<HTMLElement> }).ref;
      if (typeof original === 'function') original(node);
      else if (original && typeof original === 'object') {
        (original as { current: HTMLElement | null }).current = node;
      }
    },
    onClick: (event: MouseEvent) => {
      trigger.props.onClick?.(event);
      if (!event.defaultPrevented) change(!open);
    },
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': open ? panelId : undefined,
  });

  return (
    <MorphCloseContext.Provider value={close}>
      {triggerNode}
      <AnchoredSurface
        open={open}
        anchorRef={anchorRef}
        onClose={close}
        width={width}
        height={height}
        className={['morph-popover', panelClassName].filter(Boolean).join(' ')}
        role="dialog"
        label={label}
        shareWords={shareWords}
      >
        <div id={panelId} className="morph-popover__body">
          {children}
        </div>
      </AnchoredSurface>
    </MorphCloseContext.Provider>
  );
}
