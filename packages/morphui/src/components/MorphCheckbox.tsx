'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactElement, type ReactNode } from 'react';

export interface MorphCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'children'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  /** The text of the control. Clicking it toggles the box, as a label should. */
  label: ReactNode;
}

/**
 * A checkbox with a tick that draws itself.
 *
 * The box is the control and the input is left in the tree, visually hidden:
 * a real input keeps the platform's own keyboard behaviour, form participation
 * and the label association that makes the text clickable, none of which a
 * `div` with `role="checkbox"` gets for free.
 *
 * The tick is an SVG polyline on `stroke-dashoffset` — the one CSS property
 * that draws a line the way a pen would, and it runs on the library's own draw
 * duration so it belongs to the same clock as everything else.
 */
export const MorphCheckbox = forwardRef<HTMLInputElement, MorphCheckboxProps>(function MorphCheckbox(
  { checked = false, onChange, disabled = false, label, id, className, ...rest },
  ref,
): ReactElement {
  const generated = useId();
  const inputId = id ?? generated;

  return (
    <label
      className={['morph-checkbox', className].filter(Boolean).join(' ')}
      htmlFor={inputId}
      data-disabled={disabled || undefined}
    >
      <input
        ref={ref}
        type="checkbox"
        id={inputId}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        {...rest}
      />
      <span className="morph-checkbox__box" data-checked={checked} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <polyline className="morph-checkbox__check" points="4 11 8 15 16 6" />
        </svg>
      </span>
      <span className="morph-checkbox__label">{label}</span>
    </label>
  );
});
