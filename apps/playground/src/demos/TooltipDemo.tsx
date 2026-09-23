import { useEffect, useId, useRef, useState } from 'react';
import { MorphButton } from './ButtonDemo';
import './tooltip.css';

function MorphTooltip({ label, tip, side = 'top' }: { label: string; tip: string; side?: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);
  const id = useId();
  const clear = () => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null; };
  const show = (delay = 0) => { clear(); if (delay) timer.current = window.setTimeout(() => setOpen(true), delay); else setOpen(true); };
  const hide = () => { clear(); setOpen(false); };
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  return <span className="morph-tooltip-wrap" data-side={side} onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); hide(); } }}>
    <MorphButton variant="ghost" size="sm" aria-describedby={open ? id : undefined} onPointerEnter={(event) => { if (event.pointerType !== 'touch') show(180); }} onPointerLeave={hide} onFocus={() => show()} onBlur={hide}>{label}</MorphButton>
    <span id={id} role="tooltip" className="morph-tooltip-bubble" data-open={open} aria-hidden={!open}>{tip}</span>
  </span>;
}

export function TooltipDemo() {
  return <section className="stage" aria-label="Tooltip examples"><div className="row morph-tooltip-row"><MorphTooltip label="Inspect motion" tip="The same curve, at every scale" /><MorphTooltip label="Keyboard focus" tip="Focus reveals this hint" side="bottom" /></div></section>;
}
