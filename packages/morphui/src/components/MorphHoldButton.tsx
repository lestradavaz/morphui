'use client';

import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type PointerEvent, type ReactElement } from 'react';

export interface MorphHoldButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /** How long the press has to be held, in milliseconds. */
  hold?: number;
  /** The two faces. */
  label?: string;
  confirmedLabel?: string;
  onConfirm?: () => void;
  onReset?: () => void;
}

/**
 * A button that has to be held, for the action that is expensive to take back.
 *
 * The press is the animation: a fill crosses the button at a constant rate for
 * exactly as long as the confirm takes, so how much is left to hold is legible
 * at any moment rather than being a wait with no answer. Letting go retargets
 * the fill from wherever it got to, which is why this is a transition and not a
 * keyframe - a press released halfway through and started again is the normal
 * case here, not the exception.
 *
 * A keyboard cannot hold a button in any way that means anything, so Enter and
 * Space confirm in one press and take the button back in the next. A press that
 * is not held - a click, a tap that ended early - does nothing at all.
 */
export const MorphHoldButton = forwardRef<HTMLButtonElement, MorphHoldButtonProps>(function MorphHoldButton(
  { hold = 700, label = 'Hold to confirm', confirmedLabel = 'Confirmed · reset', onConfirm, onReset, className, style, disabled, onClick, onPointerDown, onPointerUp, onPointerCancel, onPointerLeave, ...rest },
  ref,
): ReactElement {
  const [confirmed, setConfirmed] = useState(false);
  const timer = useRef<number | null>(null);
  /** Set when a hold completed, so the click that follows it is not a second press. */
  const fromHold = useRef(false);

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => cancel, []);

  const startPress = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || disabled || confirmed) return;
    cancel();
    timer.current = window.setTimeout(() => {
      timer.current = null;
      fromHold.current = true;
      setConfirmed(true);
      onConfirm?.();
    }, hold);
  };

  const endPress = () => cancel();

  return (
    <button
      ref={ref}
      type="button"
      className={['morph-hold-button', className].filter(Boolean).join(' ')}
      data-confirmed={confirmed}
      disabled={disabled}
      // The two faces are both in the DOM, so the name is stated rather than read.
      aria-label={confirmed ? confirmedLabel : label}
      // The fill is the stylesheet's, and it runs on this clock: two timings for
      // one hold would let the button confirm at a moment the fill disagrees with.
      style={{ '--morph-hold-duration': `${hold}ms`, ...style } as CSSProperties}
      onPointerDown={startPress}
      onPointerUp={(event) => { endPress(); onPointerUp?.(event); }}
      onPointerCancel={(event) => { endPress(); onPointerCancel?.(event); }}
      onPointerLeave={(event) => { endPress(); onPointerLeave?.(event); }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (fromHold.current) {
          fromHold.current = false;
          return;
        }
        // A press that arrived after the hold is accounted for, and a press on a
        // button that is already confirmed is the reader taking it back.
        if (confirmed) {
          setConfirmed(false);
          onReset?.();
          return;
        }
        // A keyboard has nothing to hold, so one press confirms.
        if (event.detail !== 0) return;
        setConfirmed(true);
        onConfirm?.();
      }}
      {...rest}
    >
      <span className="morph-hold-button__progress" aria-hidden="true" />
      <span className="morph-hold-button__face morph-hold-button__face--ready" aria-hidden="true">{label}</span>
      <span className="morph-hold-button__face morph-hold-button__face--done" aria-hidden="true">{confirmedLabel}</span>
    </button>
  );
});

MorphHoldButton.displayName = 'MorphHoldButton';
