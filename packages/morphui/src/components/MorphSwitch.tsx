'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactElement } from 'react';

export interface MorphSwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'type'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  /**
   * The accessible name, and it is not optional: a switch is announced as a
   * switch and then as nothing else, so a nameless one is a control the person
   * using it cannot ask for.
   */
  label: string;
}

/**
 * A switch. The track changes color, the thumb travels, and both are CSS.
 *
 * Nothing here needs a clock of its own: it is one transform and one background
 * over the library's own hover and slide durations, so it retargets mid-flight
 * when a finger taps it twice — which a keyframe would not, and which is exactly
 * what happens to a switch.
 *
 * A button, not a checkbox with a role: `aria-checked` is a state a button can
 * carry, and a real button can be reached and pressed the way every other
 * control on the page is.
 */
export const MorphSwitch = forwardRef<HTMLButtonElement, MorphSwitchProps>(function MorphSwitch(
  { checked = false, onChange, disabled = false, label, className, ...rest },
  ref,
): ReactElement {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={['morph-switch', className].filter(Boolean).join(' ')}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      {...rest}
    >
      <span className="morph-switch__thumb" />
    </button>
  );
});
