import { useState, forwardRef, type ButtonHTMLAttributes } from 'react';
import './switch.css';

/* ── MorphSwitch ─────────────────────────────── */

interface MorphSwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Visually hidden but accessible label */
  label?: string;
}

export const MorphSwitch = forwardRef<HTMLButtonElement, MorphSwitchProps>(
  ({ checked = false, onChange, disabled = false, label, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="morph-switch"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      {...rest}
    >
      <span className="morph-switch-thumb" />
    </button>
  ),
);

MorphSwitch.displayName = 'MorphSwitch';

/* ── SwitchDemo ──────────────────────────────── */

export function SwitchDemo() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);

  return (
    <section className="stage" aria-label="Switch examples">
      <div className="switch-row">
        <MorphSwitch id="notifications-switch" checked={a} onChange={setA} label="Notifications" />
        <label htmlFor="notifications-switch" className="switch-label">Notifications</label>
      </div>
      <div className="switch-row">
        <MorphSwitch id="dark-mode-switch" checked={b} onChange={setB} label="Dark mode" />
        <label htmlFor="dark-mode-switch" className="switch-label">Dark mode</label>
      </div>
      <div className="switch-row">
        <MorphSwitch id="locked-switch" checked={false} disabled label="Locked" />
        <label htmlFor="locked-switch" className="switch-label switch-label-disabled">Locked</label>
      </div>
    </section>
  );
}
