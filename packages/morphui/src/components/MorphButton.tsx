'use client';

import { forwardRef, useRef, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from 'react';

import { prefersReducedMotion } from '../lib/measure.js';

export type MorphButtonVariant = 'pill' | 'ghost' | 'chip' | 'icon';
export type MorphButtonSize = 'sm' | 'md';

export interface MorphButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `pill` is the primary action, `ghost` the quiet one, `chip` a tag, `icon` a square. */
  variant?: MorphButtonVariant;
  /** Shows a spinner and blocks the press without changing the button's size. */
  loading?: boolean;
  size?: MorphButtonSize;
  children?: ReactNode;
}

/**
 * A button with the press, the hover and the focus ring the rest of the library
 * already speaks: the same softening curve, the same durations, and a ripple
 * that starts where the pointer landed rather than in the middle.
 *
 * The ripple is one absolutely positioned span per press, removed on the
 * animation's own `animationend`. It is a real element and not a pseudo-element
 * because a press can land anywhere in the button and the wave has to start
 * there, which is a style a rule cannot hold without a class per position.
 *
 * Motion is CSS, not GSAP: a press is not a morph, it should survive the
 * library never being imported on a page, and it has to run while the main
 * thread is busy opening the panel the button is about to open.
 */
export const MorphButton = forwardRef<HTMLButtonElement, MorphButtonProps>(
  ({ variant = 'pill', loading = false, size = 'md', className, children, disabled, onPointerDown, ...rest }, ref) => {
    const rippleRef = useRef<HTMLSpanElement>(null);

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      if (event.defaultPrevented || disabled || loading || prefersReducedMotion() || !rippleRef.current) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      // Far enough to reach the furthest corner from where the press landed.
      const radius = Math.max(
        Math.hypot(x, y),
        Math.hypot(bounds.width - x, y),
        Math.hypot(x, bounds.height - y),
        Math.hypot(bounds.width - x, bounds.height - y),
      );
      const wave = document.createElement('span');
      wave.className = 'morph-button__ripple-wave';
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      wave.style.width = `${radius * 2}px`;
      wave.style.height = `${radius * 2}px`;
      rippleRef.current.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove(), { once: true });
    };

    const classes = [
      'morph-button',
      `morph-button--${variant}`,
      size !== 'md' && `morph-button--${size}`,
      loading && 'morph-button--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} onPointerDown={handlePointerDown} {...rest}>
        <span ref={rippleRef} className="morph-button__ripple" aria-hidden="true" />
        <span className="morph-button__content">{children}</span>
        <span className="morph-button__spinner" aria-hidden="true">
          <span className="morph-button__ring" />
        </span>
      </button>
    );
  },
);

MorphButton.displayName = 'MorphButton';
