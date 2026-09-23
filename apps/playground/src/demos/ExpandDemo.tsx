import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { EASE_FLOW, EASE_FLOW_CLOSE, motionSeconds, prefersReducedMotion } from './motion';
import './expand.css';

const actions = ['Copy link', 'Send email', 'Save'];

export function ExpandDemo() {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState('Share');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const animateNext = useRef(false);
  const initialized = useRef(false);

  const setExpanded = (next: boolean, animate = true) => {
    animateNext.current = animate;
    setOpen(next);
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    const label = labelRef.current;
    if (!root || !label) return;
    const closedWidth = Math.ceil(label.getBoundingClientRect().width + 60);
    const targetWidth = open ? 316 : closedWidth;
    gsap.killTweensOf(root);
    if (!initialized.current || !animateNext.current || prefersReducedMotion()) gsap.set(root, { width: targetWidth });
    else gsap.to(root, { width: targetWidth, duration: motionSeconds(root, open ? 0.48 : 0.38), ease: open ? EASE_FLOW : EASE_FLOW_CLOSE, overwrite: true });
    initialized.current = true;
    animateNext.current = false;
  }, [open, choice]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <section className="stage" aria-label="Expandable control example">
      <div ref={rootRef} className="morph-expand" data-open={open} onKeyDown={(event) => {
        if (event.key === 'Escape' && open) { event.stopPropagation(); setExpanded(false, false); triggerRef.current?.focus(); }
      }}>
        <button ref={triggerRef} type="button" className="morph-expand-trigger" aria-label={open ? 'Close quick actions' : choice} aria-expanded={open} aria-controls="morph-expand-actions" onClick={(event) => setExpanded(!open, event.detail !== 0)}>
          <span className="morph-expand-icon" aria-hidden="true">{open ? '×' : '+'}</span>
          <span ref={labelRef} className="morph-expand-label" aria-hidden="true">{choice}</span>
        </button>
        <div id="morph-expand-actions" className="morph-expand-actions" aria-hidden={!open}>
          {actions.map((action) => <button type="button" key={action} tabIndex={open ? 0 : -1} onClick={(event) => { setChoice(action); setExpanded(false, event.detail !== 0); triggerRef.current?.focus(); }}>{action}</button>)}
        </div>
      </div>
    </section>
  );
}
