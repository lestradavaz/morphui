'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import gsap from 'gsap';

import { EASE_FLOW, EASE_FLOW_CLOSE, registerMorphEases } from '../lib/easing.js';
import { prefersReducedMotion, slowFactor } from '../lib/measure.js';

registerMorphEases();

/** How long the control takes to become its other width, in each direction. */
const OPEN = 0.48;
const CLOSE = 0.38;
/** The icon column and the padding around it, which the open actions start after. */
const ICON_COLUMN = 60;
/** The gap the actions keep from the control's right edge. */
const EDGE = 8;

export interface MorphExpandProps {
  /** The actions, in the order they are offered. */
  actions: string[];
  /** The words on the closed control, and what they become after a choice. */
  label?: string;
  /** Called with the action that was chosen. */
  onSelect?: (action: string) => void;
  className?: string;
}

/**
 * One control that unfolds into its own actions, in place.
 *
 * It becomes wider rather than taller, and it grows out of the label it is
 * already showing: the words are what the reader pressed, so the words are what
 * the actions come from. A row that appeared below the button would be a second
 * thing on the page; this is the same thing, opened.
 *
 * The width is measured from the actions themselves, so a control with two
 * short actions does not open to the width of one with four long ones.
 */
export function MorphExpand({ actions, label = 'Share', onSelect, className }: MorphExpandProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(label);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  /** A keyboard move and the first paint place the width; a press animates it. */
  const travel = useRef(false);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const words = labelRef.current;
    const row = actionsRef.current;
    if (!root || !words || !row) return;

    // The actions are laid out whether or not they are showing, opacity being
    // none of layout's business, so their width is here to be read on the frame
    // the control opens and before the frame is painted.
    const target = open
      ? Math.ceil(ICON_COLUMN + row.getBoundingClientRect().width + EDGE)
      : Math.ceil(words.getBoundingClientRect().width + ICON_COLUMN);

    const first = !placed.current;
    const glide = travel.current;
    placed.current = true;
    travel.current = false;
    gsap.killTweensOf(root);
    if (first || !glide || prefersReducedMotion()) {
      gsap.set(root, { width: target });
      return;
    }
    gsap.to(root, { width: target, duration: (open ? OPEN : CLOSE) * slowFactor(root), ease: open ? EASE_FLOW : EASE_FLOW_CLOSE, overwrite: true });
  }, [open, choice]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const set = (next: boolean, animate: boolean) => {
    travel.current = animate;
    setOpen(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !open) return;
    event.stopPropagation();
    set(false, false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={['morph-expand', className].filter(Boolean).join(' ')} data-open={open} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className="morph-expand__trigger"
        aria-label={open ? 'Close actions' : choice}
        aria-expanded={open}
        aria-controls={uid}
        onClick={(event) => set(!open, event.detail !== 0)}
      >
        <span className="morph-expand__icon" aria-hidden="true">{open ? '×' : '+'}</span>
        <span ref={labelRef} className="morph-expand__label" aria-hidden="true">{choice}</span>
      </button>
      <div ref={actionsRef} id={uid} className="morph-expand__actions" aria-hidden={!open}>
        {actions.map((action) => (
          <button
            type="button"
            key={action}
            tabIndex={open ? 0 : -1}
            onClick={(event) => {
              setChoice(action);
              onSelect?.(action);
              set(false, event.detail !== 0);
              triggerRef.current?.focus();
            }}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
