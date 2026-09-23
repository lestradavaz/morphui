'use client';

import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import gsap from 'gsap';

import { EASE_IN_OUT_SOFT, registerMorphEases } from '../lib/easing.js';
import { prefersReducedMotion, slowFactor } from '../lib/measure.js';

registerMorphEases();

/** How long the panel takes to reach the next row, before `--morph-slow` has its say. */
const SLIDE = 0.2;

export interface MorphRadioOption {
  value: string;
  label: string;
}

export interface MorphRadioProps {
  /** One name per group, so the browser keeps the group's own arrow-key behaviour. */
  name: string;
  /** The group's accessible name. */
  label: string;
  options: MorphRadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

/**
 * A radio group on a raised track, with the choice marked by a panel that
 * slides between the rows.
 *
 * The real inputs are in the tree and the panel is decoration, so the group
 * still behaves like a radio group: arrow keys move the selection, the label
 * toggles it, and a form that contains it still reads it. What moves is only
 * the panel behind the chosen row, and it moves on the library's own on-screen
 * curve — `ease-in-out`, not `ease-out`, because this is something travelling
 * to a new place rather than something arriving.
 */
export const MorphRadio = forwardRef<HTMLDivElement, MorphRadioProps>(function MorphRadio(
  { name, label, options, value, onChange, disabled = false },
  ref,
): ReactElement {
  const groupId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const optionRefs = useRef(new Map<string, HTMLLabelElement>());
  /** The panel is placed, not animated, on the first pass: nothing travels from nowhere. */
  const placed = useRef(false);

  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement, []);

  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    const root = rootRef.current;
    if (!indicator || !root) return;

    const chosen = value ? optionRefs.current.get(value) : undefined;
    if (!chosen) {
      gsap.set(indicator, { opacity: 0 });
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const chosenRect = chosen.getBoundingClientRect();
    const geometry = { y: chosenRect.top - rootRect.top, height: chosenRect.height, opacity: 1 };

    if (!placed.current || prefersReducedMotion()) {
      gsap.set(indicator, geometry);
      placed.current = true;
    } else {
      gsap.to(indicator, { ...geometry, duration: SLIDE * slowFactor(indicator), ease: EASE_IN_OUT_SOFT, overwrite: true });
    }
  }, [value, options]);

  // A group that was moved, reflowed or re-wrapped by the page's own layout has
  // its panel at the wrong offset otherwise, and the panel is what says which
  // row is chosen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const place = () => {
      const indicator = indicatorRef.current;
      const chosen = value ? optionRefs.current.get(value) : undefined;
      if (!indicator || !chosen) return;
      const rootRect = root.getBoundingClientRect();
      const chosenRect = chosen.getBoundingClientRect();
      gsap.set(indicator, { y: chosenRect.top - rootRect.top, height: chosenRect.height });
    };
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [value]);

  const keep = useCallback(
    (option: string) => (element: HTMLLabelElement | null) => {
      if (element) optionRefs.current.set(option, element);
      else optionRefs.current.delete(option);
    },
    [],
  );

  return (
    <div
      ref={rootRef}
      className="morph-radio"
      role="radiogroup"
      aria-label={label}
      data-disabled={disabled || undefined}
    >
      <span ref={indicatorRef} className="morph-radio__indicator" aria-hidden="true" />

      {options.map((option) => {
        const checked = option.value === value;
        const inputId = `${groupId}-${option.value}`;

        return (
          <label key={option.value} ref={keep(option.value)} className="morph-radio__option" htmlFor={inputId}>
            <input
              type="radio"
              id={inputId}
              name={name}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange?.(option.value)}
            />
            <span className="morph-radio__circle" data-checked={checked} aria-hidden="true">
              <span className="morph-radio__dot" />
            </span>
            {option.label}
          </label>
        );
      })}
    </div>
  );
});
