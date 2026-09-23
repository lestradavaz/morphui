import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { EASE_FLOW, EASE_FLOW_CLOSE, EASE_OUT_SOFT, motionSeconds, prefersReducedMotion } from './motion';
import './stepper.css';

interface MorphStepperProps {
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const MorphStepper = forwardRef<HTMLDivElement, MorphStepperProps>(
  ({ value, onChange, min = 0, max = 99, step = 1, disabled = false }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const decreaseRef = useRef<HTMLButtonElement>(null);
    const increaseRef = useRef<HTMLButtonElement>(null);
    const displayRef = useRef<HTMLDivElement>(null);
    const digitRef = useRef<HTMLSpanElement>(null);
    const previous = useRef(value);
    const initialized = useRef(false);
    const atMin = value <= min;
    const atMax = value >= max;
    const geometry = atMin && atMax ? { x: 0, width: 216 } : atMin ? { x: 0, width: 152 } : atMax ? { x: 64, width: 152 } : { x: 64, width: 88 };
    const initialGeometry = useRef({ x: geometry.x, width: geometry.width, decrementX: atMin ? 32 : 0, incrementX: atMax ? 136 : 168, atMin, atMax });

    useLayoutEffect(() => {
      const display = displayRef.current;
      const decrement = decreaseRef.current;
      const increment = increaseRef.current;
      if (!display || !decrement || !increment) return;
      const now = { x: atMin ? 32 : 0, rightX: atMax ? 136 : 168, width: geometry.width, displayX: geometry.x };
      if (!initialized.current || prefersReducedMotion()) {
        gsap.set(display, { x: now.displayX, width: now.width });
        gsap.set(decrement, { x: now.x, opacity: atMin ? 0 : 1 });
        gsap.set(increment, { x: now.rightX, opacity: atMax ? 0 : 1 });
        initialized.current = true;
      } else {
        const duration = motionSeconds(display, atMin || atMax ? 0.42 : 0.36);
        const ease = atMin || atMax ? EASE_FLOW_CLOSE : EASE_FLOW;
        gsap.to(display, { x: now.displayX, width: now.width, duration, ease, overwrite: true });
        gsap.to(decrement, { x: now.x, opacity: atMin ? 0 : 1, duration, ease, overwrite: true });
        gsap.to(increment, { x: now.rightX, opacity: atMax ? 0 : 1, duration, ease, overwrite: true });
      }
    }, [atMin, atMax, geometry.x, geometry.width]);

    useLayoutEffect(() => {
      if (previous.current === value) return;
      const digit = digitRef.current;
      const display = displayRef.current;
      if (!digit || !display) return;
      const old = document.createElement('span');
      old.className = 'morph-stepper-digit morph-stepper-digit--old';
      old.textContent = String(previous.current);
      display.appendChild(old);
      const upward = value > previous.current;
      if (prefersReducedMotion()) old.remove();
      else {
        gsap.fromTo(digit, { yPercent: upward ? 100 : -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: motionSeconds(display, 0.24), ease: EASE_OUT_SOFT, overwrite: true });
        gsap.to(old, { yPercent: upward ? -100 : 100, opacity: 0, duration: motionSeconds(display, 0.24), ease: EASE_OUT_SOFT, onComplete: () => old.remove() });
      }
      previous.current = value;
    }, [value]);

    const change = (next: number, direction: 'up' | 'down') => {
      if (disabled || next === value) return;
      onChange?.(next);
      if (direction === 'up' && next >= max) requestAnimationFrame(() => decreaseRef.current?.focus());
      if (direction === 'down' && next <= min) requestAnimationFrame(() => increaseRef.current?.focus());
    };

    return (
      <div ref={(node) => { rootRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }} className="morph-stepper" aria-label="Quantity" data-disabled={disabled}>
        <button ref={decreaseRef} type="button" className="morph-stepper-btn" aria-label="Decrease" disabled={atMin || disabled} aria-hidden={atMin} tabIndex={atMin ? -1 : 0} style={{ left: 0, opacity: initialGeometry.current.atMin ? 0 : 1, transform: `translateX(${initialGeometry.current.decrementX}px)` }} onClick={() => change(Math.max(min, value - step), 'down')}>−</button>
        <div ref={displayRef} className="morph-stepper-display" aria-live="polite" aria-atomic="true" style={{ left: 0, width: initialGeometry.current.width, transform: `translateX(${initialGeometry.current.x}px)` }}><span ref={digitRef} className="morph-stepper-digit">{value}</span></div>
        <button ref={increaseRef} type="button" className="morph-stepper-btn" aria-label="Increase" disabled={atMax || disabled} aria-hidden={atMax} tabIndex={atMax ? -1 : 0} style={{ left: 0, opacity: initialGeometry.current.atMax ? 0 : 1, transform: `translateX(${initialGeometry.current.incrementX}px)` }} onClick={() => change(Math.min(max, value + step), 'up')}>+</button>
      </div>
    );
  },
);

MorphStepper.displayName = 'MorphStepper';

export function StepperDemo() {
  const [count, setCount] = useState(1);
  return <section className="stage" aria-label="Stepper example"><MorphStepper value={count} onChange={setCount} min={0} max={3} /></section>;
}
