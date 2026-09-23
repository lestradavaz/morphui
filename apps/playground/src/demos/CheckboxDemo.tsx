import { forwardRef, useId, useState, type ChangeEvent } from 'react';
import './checkbox.css';

/* ── MorphCheckbox ─────────────────────────────── */

interface MorphCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  id?: string;
}

export const MorphCheckbox = forwardRef<HTMLInputElement, MorphCheckboxProps>(
  ({ checked, onChange, disabled = false, label, id }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <label className="morph-checkbox-label" data-disabled={disabled} htmlFor={inputId}>
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
        />
        <span className="morph-checkbox" data-checked={!!checked} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <polyline className="morph-checkbox__check" points="4 11 8 15 16 6" />
          </svg>
        </span>
        {label}
      </label>
    );
  },
);

MorphCheckbox.displayName = 'MorphCheckbox';

/* ── CheckboxDemo ──────────────────────────────── */

export function CheckboxDemo() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);
  const [c, setC] = useState(false);

  return (
    <section className="stage" aria-label="Checkbox examples">
      <div className="row" style={{ gap: 24, flexWrap: 'wrap' }}>
        <MorphCheckbox label="Unchecked" checked={a} onChange={setA} />
        <MorphCheckbox label="Checked" checked={b} onChange={setB} />
        <MorphCheckbox label="Toggle me" checked={c} onChange={setC} />
        <MorphCheckbox label="Disabled" checked={false} disabled />
      </div>
    </section>
  );
}
