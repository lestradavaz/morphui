import { useRef, useState } from 'react';
import gsap from 'gsap';
import { MorphButton } from './ButtonDemo';
import { EASE_FLOW, EASE_FLOW_CLOSE, motionSeconds, prefersReducedMotion } from './motion';
import './cta.css';

export function CtaDemo() {
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const saveRef = useRef<HTMLButtonElement>(null);
  const holdTimer = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const morphSave = () => {
    const next = !saved;
    setSaved(next);
    if (!saveRef.current || prefersReducedMotion()) return;
    gsap.to(saveRef.current, { width: next ? 118 : 169, duration: motionSeconds(saveRef.current, 0.48), ease: next ? EASE_FLOW : EASE_FLOW_CLOSE, overwrite: true });
  };

  const cancelHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const startHold = () => {
    if (confirmed) return;
    cancelHold();
    holdTimer.current = window.setTimeout(() => {
      suppressClick.current = true;
      setConfirmed(true);
      holdTimer.current = null;
    }, 700);
  };

  return (
    <section className="stage" aria-label="Animated CTA buttons example">
      <div className="row cta-demo-row">
        <MorphButton ref={saveRef} variant="pill" className="cta-arrow" data-saved={saved} aria-label={saved ? 'Saved' : 'Save changes'} onClick={morphSave}>
          <span className="cta-arrow-face cta-arrow-face--save" aria-hidden="true">Save changes <span className="cta-arrow-icon">↗</span></span>
          <span className="cta-arrow-face cta-arrow-face--saved" aria-hidden="true">Saved <span className="cta-arrow-icon">✓</span></span>
        </MorphButton>
        <button
          type="button"
          className="cta-hold"
          data-confirmed={confirmed}
          aria-label={confirmed ? 'Confirmed' : 'Hold to confirm'}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          onClick={(event) => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            if (event.detail === 0) setConfirmed((value) => !value);
            else if (confirmed) setConfirmed(false);
          }}
        >
          <span className="cta-hold-progress" aria-hidden="true" />
          <span className="cta-hold-face cta-hold-face--ready" aria-hidden="true">Hold to confirm</span>
          <span className="cta-hold-face cta-hold-face--done" aria-hidden="true">Confirmed · reset</span>
        </button>
      </div>
    </section>
  );
}
