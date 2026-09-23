'use client';

import { useState, type ReactElement } from 'react';

import { MorphClose } from './MorphClose.js';
import { MorphDialog } from './MorphDialog.js';

export interface MorphSelectOption {
  value: string;
  label: string;
  /** Any CSS colour. Draws a swatch beside the label, in the list and in the field. */
  swatch?: string;
}

export interface MorphSelectProps {
  options: MorphSelectOption[];
  /** The chosen value. Controlled, like everything else here that holds a choice. */
  value: string;
  onChange: (value: string) => void;
  /** The heading. It is the trigger's own words, and the panel's, connected by the morph. */
  label: string;
  description?: string;
  panelClassName?: string;
  className?: string;
}

/**
 * A list too long to sit in a menu, so it opens as a panel.
 *
 * The choice is stated twice - in the field and again in the row that made it -
 * and the row marks itself rather than the field highlighting: a list is read
 * from the inside, and the mark belongs where the finger is going.
 *
 * The trigger's words are shared with the panel's heading, which is what makes
 * this a morph rather than a panel appearing over a button: the same three words
 * travel and become the title of the thing that was asked for.
 */
export function MorphSelect({ options, value, onChange, label, description, panelClassName, className }: MorphSelectProps): ReactElement {
  const [open, setOpen] = useState(false);
  const chosen = options.find((option) => option.value === value);

  return (
    <MorphDialog
      shareWords
      aria-label={label}
      panelClassName={['morph-select__panel', panelClassName].filter(Boolean).join(' ')}
      className={className}
      onOpenChange={setOpen}
      trigger={
        <button type="button" className="morph-select__trigger" aria-haspopup="dialog" aria-expanded={open}>
          <span data-morph-words>{label}</span>
          <span className="morph-select__current">
            {chosen?.swatch && <span className="morph-select__swatch" style={{ background: chosen.swatch }} aria-hidden="true" />}
            <span className="morph-select__value">{chosen?.label ?? ''}</span>
          </span>
          <span className="morph-select__chevron" aria-hidden="true" />
        </button>
      }
      chrome={
        <MorphClose>
          <button type="button" className="morph-select__close" aria-label="Close">×</button>
        </MorphClose>
      }
    >
      <div className="morph-select__content">
        <h2 data-morph-words>{label}</h2>
        {description && <p>{description}</p>}
        <div className="morph-select__options">
          {options.map((option) => (
            <MorphClose key={option.value}>
              <button
                type="button"
                className="morph-select__option"
                aria-pressed={option.value === value}
                onClick={() => onChange(option.value)}
              >
                {option.swatch && <span className="morph-select__swatch" style={{ background: option.swatch }} aria-hidden="true" />}
                <span className="morph-select__option-label">{option.label}</span>
                <span className="morph-select__check" aria-hidden="true">{option.value === value ? '✓' : ''}</span>
              </button>
            </MorphClose>
          ))}
        </div>
      </div>
    </MorphDialog>
  );
}
