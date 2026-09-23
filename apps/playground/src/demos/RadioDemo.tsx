import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import gsap from 'gsap';
import { EASE_IN_OUT_SOFT, motionSeconds, prefersReducedMotion } from './motion';
import './radio.css';

/* ── MorphRadio ────────────────────────────────── */

interface RadioOption {
  value: string;
  label: string;
}

interface MorphRadioProps {
  name: string;
  label: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export const MorphRadio = forwardRef<HTMLDivElement, MorphRadioProps>(
  ({ name, label, options, value, onChange, disabled = false }, ref) => {
    const groupId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLSpanElement>(null);
    const optionRefs = useRef<Map<string, HTMLLabelElement>>(new Map());

    const setOptionRef = useCallback(
      (val: string) => (el: HTMLLabelElement | null) => {
        if (el) optionRefs.current.set(val, el);
        else optionRefs.current.delete(val);
      },
      [],
    );

    // Slide indicator to selected option
    const positionedRef = useRef(false);
    useLayoutEffect(() => {
      const indicator = indicatorRef.current;
      const container = containerRef.current;
      if (!indicator || !container || !value) {
        if (indicator) gsap.set(indicator, { opacity: 0 });
        return;
      }

      const optionEl = optionRefs.current.get(value);
      if (!optionEl) return;

      const containerRect = container.getBoundingClientRect();
      const optionRect = optionEl.getBoundingClientRect();
      const y = optionRect.top - containerRect.top;
      const height = optionRect.height;

      if (prefersReducedMotion() || !positionedRef.current) {
        gsap.set(indicator, { y, height, opacity: 1 });
        positionedRef.current = true;
      } else {
        gsap.to(indicator, {
          y,
          height,
          opacity: 1,
          duration: motionSeconds(indicator, 0.2),
          ease: EASE_IN_OUT_SOFT,
        });
      }
    }, [value, options]);

    return (
      <div
        ref={(el) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="morph-radio"
        role="radiogroup"
        aria-label={label}
        data-disabled={disabled}
      >
        <span ref={indicatorRef} className="morph-radio-indicator" style={{ opacity: 0 }} />

        {options.map((opt) => {
          const checked = opt.value === value;
          const inputId = `${groupId}-${opt.value}`;

          return (
            <label
              key={opt.value}
              ref={setOptionRef(opt.value)}
              className="morph-radio-option"
              htmlFor={inputId}
            >
              <input
                type="radio"
                id={inputId}
                name={name}
                value={opt.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange?.(opt.value)}
              />
              <span className="morph-radio-circle" data-checked={checked} aria-hidden="true">
                <span className="morph-radio-dot" />
              </span>
              {opt.label}
            </label>
          );
        })}
      </div>
    );
  },
);

MorphRadio.displayName = 'MorphRadio';

/* ── RadioDemo ─────────────────────────────────── */

const sizeOptions: RadioOption[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

export function RadioDemo() {
  const [size, setSize] = useState('md');

  return (
    <section className="stage" aria-label="Radio examples">
      <div className="row" style={{ gap: 24, flexWrap: 'wrap' }}>
        <MorphRadio name="size" label="Size" options={sizeOptions} value={size} onChange={setSize} />
        <MorphRadio name="size-disabled" label="Disabled size" options={sizeOptions} value="sm" disabled />
      </div>
    </section>
  );
}
