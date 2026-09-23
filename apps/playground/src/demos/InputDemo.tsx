import { useId, useState, type InputHTMLAttributes } from 'react';
import './input.css';

type InputStatus = 'idle' | 'error' | 'success';

interface MorphInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  message?: string;
  status?: InputStatus;
}

export function MorphInput({ label, message, status = 'idle', id, ...props }: MorphInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className="morph-input-field" data-status={status}>
      <label htmlFor={inputId}>{label}</label>
      <div className="morph-input-frame">
        <input
          id={inputId}
          aria-invalid={status === 'error'}
          aria-describedby={message ? messageId : undefined}
          {...props}
        />
        <svg className="morph-input-check" aria-hidden="true" width="19" height="19" viewBox="0 0 20 20" fill="none">
          <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="morph-input-message" id={messageId} aria-live="polite">{message ?? '\u00a0'}</span>
    </div>
  );
}

export function InputDemo() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const status: InputStatus = !touched || !email ? 'idle' : valid ? 'success' : 'error';

  return (
    <section className="stage" aria-label="Input example">
      <div className="input-demo-grid">
        <MorphInput
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => { setEmail(event.target.value); setTouched(true); }}
          onBlur={() => setTouched(true)}
          status={status}
          message={status === 'error' ? 'Enter a valid email address.' : status === 'success' ? 'Address looks good.' : undefined}
        />
        <MorphInput label="Disabled" placeholder="Unavailable right now" disabled />
      </div>
    </section>
  );
}
