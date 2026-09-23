'use client';

import { forwardRef, useLayoutEffect, useRef, type ReactElement } from 'react';
import gsap from 'gsap';

import { EASE_FLOW, EASE_FLOW_CLOSE, EASE_OUT_SOFT, registerMorphEases } from '../lib/easing.js';
import { prefersReducedMotion, slowFactor } from '../lib/measure.js';

registerMorphEases();

/** How long the display takes to change width, and the digit to swap. */
const RESIZE = 0.36;
const RESIZE_AT_END = 0.42;
const DIGIT = 0.24;

export interface MorphStepperProps {
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** An accessible name for the group of controls. */
  label?: string;
}

/**
 * A number, with a minus and a plus that come and go as the ends are reached.
 *
 * Three things move and they are one movement: the display resizes, the buttons
 * slide out of its way, and the button that ran out of room fades. A stepper
 * that grew a gap where a disabled button used to be reads as broken, and one
 * where the buttons stay put reads as if the press failed.
 *
 * The digit is swapped rather than counted: the outgoing number leaves the way
 * the new one arrives, which is what says the change was up or down without
 * anyone having to read it.
 */
export const MorphStepper = forwardRef<HTMLDivElement, MorphStepperProps>(function MorphStepper(
  { value, onChange, min = 0, max = 99, step = 1, disabled = false, label = 'Quantity' },
  ref,
): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const decreaseRef = useRef<HTMLButtonElement>(null);
  const increaseRef = useRef<HTMLButtonElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const digitRef = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const placed = useRef(false);

  const atMin = value <= min;
  const atMax = value >= max;
  /** All three controls overlap the same track, so the geometry is read off the ends, not the middle. */
  const width = atMin && atMax ? 216 : atMin || atMax ? 152 : 88;
  const displayX = atMin ? 0 : 64;
  const decreaseX = atMin ? 32 : 0;
  const increaseX = atMax ? 136 : 168;

  useLayoutEffect(() => {
    const display = displayRef.current;
    const decrease = decreaseRef.current;
    const increase = increaseRef.current;
    if (!display || !decrease || !increase) return;

    // The buttons travel, the display resizes. A width on a button would
    // stretch a 48px circle into the display's shape on its way past.
    const geometry = { x: decreaseX, opacity: atMin ? 0 : 1 };
    const travel = { x: increaseX, opacity: atMax ? 0 : 1 };
    const box = { x: displayX, width };

    if (!placed.current || prefersReducedMotion()) {
      gsap.set(display, box);
      gsap.set(decrease, geometry);
      gsap.set(increase, travel);
      placed.current = true;
      return;
    }

    // The closing curve when a button is leaving: it is the end of the range
    // arriving, not a new place being travelled to.
    const duration = (atMin || atMax ? RESIZE_AT_END : RESIZE) * slowFactor(display);
    const ease = atMin || atMax ? EASE_FLOW_CLOSE : EASE_FLOW;
    gsap.to(display, { ...box, duration, ease, overwrite: true });
    gsap.to(decrease, { ...geometry, duration, ease, overwrite: true });
    gsap.to(increase, { ...travel, duration, ease, overwrite: true });
  }, [atMin, atMax, displayX, width, decreaseX, increaseX]);

  useLayoutEffect(() => {
    if (previous.current === value) return;
    const digit = digitRef.current;
    const display = displayRef.current;
    const was = previous.current;
    previous.current = value;
    if (!digit || !display) return;

    if (prefersReducedMotion()) return;

    // The number on its way out is a copy, made and removed here, so the
    // component's own state never holds a digit that is no longer true.
    const outgoing = document.createElement('span');
    outgoing.className = 'morph-stepper__digit morph-stepper__digit--outgoing';
    outgoing.textContent = String(was);
    outgoing.setAttribute('aria-hidden', 'true');
    display.appendChild(outgoing);

    const up = value > was;
    const duration = DIGIT * slowFactor(display);
    gsap.fromTo(digit, { yPercent: up ? 100 : -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration, ease: EASE_OUT_SOFT, overwrite: true });
    gsap.to(outgoing, { yPercent: up ? -100 : 100, opacity: 0, duration, ease: EASE_OUT_SOFT, onComplete: () => outgoing.remove() });
  }, [value]);

  const change = (next: number, direction: 'up' | 'down') => {
    if (disabled || next === value) return;
    onChange?.(next);
    // The button that is about to disappear is usually the one with focus, so
    // focus is handed to the one that is left rather than dropped on the body.
    if (direction === 'up' && next >= max) requestAnimationFrame(() => decreaseRef.current?.focus());
    if (direction === 'down' && next <= min) requestAnimationFrame(() => increaseRef.current?.focus());
  };

  return (
    <div
      ref={rootRef}
      className="morph-stepper"
      role="group"
      aria-label={label}
      data-disabled={disabled || undefined}
    >
      <button
        ref={decreaseRef}
        type="button"
        className="morph-stepper__button"
        aria-label="Decrease"
        disabled={atMin || disabled}
        aria-hidden={atMin}
        tabIndex={atMin ? -1 : 0}
        onClick={() => change(Math.max(min, value - step), 'down')}
      >
        −
      </button>
      <div ref={displayRef} className="morph-stepper__display" aria-live="polite" aria-atomic="true">
        <span ref={digitRef} className="morph-stepper__digit">{value}</span>
      </div>
      <button
        ref={increaseRef}
        type="button"
        className="morph-stepper__button"
        aria-label="Increase"
        disabled={atMax || disabled}
        aria-hidden={atMax}
        tabIndex={atMax ? -1 : 0}
        onClick={() => change(Math.min(max, value + step), 'up')}
      >
        +
      </button>
    </div>
  );
});
