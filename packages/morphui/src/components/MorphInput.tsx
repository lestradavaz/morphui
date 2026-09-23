'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactElement } from 'react';

export type MorphInputStatus = 'idle' | 'error' | 'success';

export interface MorphInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** The field's visible label. Required: a placeholder is not a label. */
  label: string;
  /** The line under the field. It keeps its height when empty, so nothing below moves. */
  message?: string;
  status?: MorphInputStatus;
}

/**
 * A labelled text field that reports what it thinks of what was typed.
 *
 * The check mark is drawn in the field's own right-hand padding, which is why
 * the input reserves it whether or not it is showing: a mark that pushed the
 * text across when it appeared would move the thing the reader is looking at,
 * mid-keystroke.
 *
 * The message line is always in the layout at its full height. A hint that
 * appears takes the reader's attention at exactly the moment they are reading
 * what they typed, so it may not also move the page under them.
 *
 * `status` is the caller's call, not the field's: validating an email is a
 * policy, and the policy belongs to the application, not to the input.
 */
export const MorphInput = forwardRef<HTMLInputElement, MorphInputProps>(function MorphInput(
  { label, message, status = 'idle', id, className, ...rest },
  ref,
): ReactElement {
  const generated = useId();
  const inputId = id ?? generated;
  const messageId = `${inputId}-message`;

  return (
    <div className={['morph-input', className].filter(Boolean).join(' ')} data-status={status}>
      <label htmlFor={inputId}>{label}</label>
      <div className="morph-input__frame">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
        <svg className="morph-input__check" aria-hidden="true" width="19" height="19" viewBox="0 0 20 20" fill="none">
          <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {/* `aria-live` so the line is announced when it changes, and never when it
          is empty and merely holding the field's height. */}
      <span className="morph-input__message" id={messageId} aria-live="polite">{message ?? ' '}</span>
    </div>
  );
});
