import { forwardRef, useRef, useState, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from 'react';
import { prefersReducedMotion } from './motion';
import './button.css';

/* ── MorphButton ─────────────────────────────────── */

type Variant = 'pill' | 'ghost' | 'chip' | 'icon';
type Size = 'sm' | 'md';

interface MorphButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  size?: Size;
  children?: ReactNode;
}

export const MorphButton = forwardRef<HTMLButtonElement, MorphButtonProps>(
  ({ variant = 'pill', loading = false, size = 'md', className, children, disabled, onPointerDown, ...rest }, ref) => {
    const rippleRef = useRef<HTMLSpanElement>(null);
    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event);
      if (event.defaultPrevented || disabled || loading || prefersReducedMotion() || !rippleRef.current) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const radius = Math.max(Math.hypot(x, y), Math.hypot(bounds.width - x, y), Math.hypot(x, bounds.height - y), Math.hypot(bounds.width - x, bounds.height - y));
      const wave = document.createElement('span');
      wave.className = 'morph-button__ripple-wave';
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      wave.style.width = `${radius * 2}px`;
      wave.style.height = `${radius * 2}px`;
      rippleRef.current.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove(), { once: true });
    };
    const cls = [
      'morph-button',
      `morph-button--${variant}`,
      size !== 'md' && `morph-button--${size}`,
      loading && 'morph-button--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={cls} disabled={disabled || loading} onPointerDown={handlePointerDown} {...rest}>
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

/* ── Demo ────────────────────────────────────────── */

export function ButtonDemo() {
  const [loading, setLoading] = useState(false);

  return (
    <section className="stage" aria-label="Button examples">
      {/* Variants */}
      <div className="row" style={{ justifyContent: 'center' }}>
        <MorphButton variant="pill">Pill</MorphButton>
        <MorphButton variant="ghost">Ghost</MorphButton>
        <MorphButton variant="chip">Chip</MorphButton>
        <MorphButton variant="icon" aria-label="Star">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </MorphButton>
      </div>

      {/* Small variants */}
      <div className="row" style={{ justifyContent: 'center' }}>
        <MorphButton variant="pill" size="sm">Small pill</MorphButton>
        <MorphButton variant="ghost" size="sm">Small ghost</MorphButton>
        <MorphButton variant="chip" size="sm">Small chip</MorphButton>
      </div>

      {/* Loading */}
      <div className="row" style={{ justifyContent: 'center' }}>
        <MorphButton variant="pill" loading={loading} onClick={() => setLoading((v) => !v)}>
          {loading ? 'Saving…' : 'Click to load'}
        </MorphButton>
        {loading && (
          <MorphButton variant="ghost" size="sm" onClick={() => setLoading(false)}>
            Cancel
          </MorphButton>
        )}
      </div>

      {/* Disabled */}
      <div className="row" style={{ justifyContent: 'center' }}>
        <MorphButton variant="pill" disabled>Disabled pill</MorphButton>
        <MorphButton variant="ghost" disabled>Disabled ghost</MorphButton>
      </div>
    </section>
  );
}
