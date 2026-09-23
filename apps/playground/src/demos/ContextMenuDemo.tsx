import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { AnchoredSurface } from './AnchoredSurface';
import './context-menu.css';

const menuLabels = ['Rename', 'Duplicate', 'Favorite', 'Show details'];

export function ContextMenuDemo() {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [name, setName] = useState('Project brief');
  const [copies, setCopies] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [notice, setNotice] = useState('Click, right-click, long-press, or press Shift+F10.');
  const targetRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const holdRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const close = () => setOpen(false);
  const clearHold = () => { if (holdRef.current !== null) window.clearTimeout(holdRef.current); holdRef.current = null; };
  const show = (x: number, y: number) => { clearHold(); setPoint({ x, y }); setActive(0); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => itemRefs.current[0]?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => () => clearHold(), []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    startPoint.current = { x: event.clientX, y: event.clientY };
    holdRef.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      show(event.clientX, event.clientY);
      window.setTimeout(() => { suppressClickRef.current = false; }, 800);
    }, 500);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!startPoint.current || Math.hypot(event.clientX - startPoint.current.x, event.clientY - startPoint.current.y) < 10) return;
    clearHold();
  };
  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + menuLabels.length) % menuLabels.length;
      setActive(next);
      itemRefs.current[next]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : menuLabels.length - 1;
      setActive(next);
      itemRefs.current[next]?.focus();
    } else if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
      const next = menuLabels.findIndex((label) => label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
      if (next !== -1) { setActive(next); itemRefs.current[next]?.focus(); }
    }
  };

  const act = (index: number) => {
    if (index === 0) { const next = name === 'Project brief' ? 'Project brief (edited)' : 'Project brief'; setName(next); setNotice(`Renamed to ${next}.`); close(); }
    if (index === 1) { setCopies((value) => value + 1); setNotice('A copy was created.'); close(); }
    if (index === 2) { setFavorite((value) => !value); setNotice(favorite ? 'Removed from favorites.' : 'Added to favorites.'); }
    if (index === 3) { setNotice('Last edited today · Shared with 3 people.'); close(); }
  };

  return <section className="stage" aria-label="Context menu example">
    <div className="morph-context-demo">
      <div ref={targetRef} className="morph-context-target" tabIndex={0} role="button" aria-label={`Actions for ${name}`} aria-haspopup="menu" aria-expanded={open} onContextMenu={(event) => { event.preventDefault(); show(event.clientX, event.clientY); }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={clearHold} onPointerCancel={clearHold} onClick={(event) => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } const rect = event.currentTarget.getBoundingClientRect(); show(rect.left + 34, rect.top + 34); }} onKeyDown={(event) => {
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10') || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          show(rect.left + 34, rect.top + 34);
        }
      }}>
        <span className="morph-context-file-icon" aria-hidden="true">▤</span>
        <span><strong>{name}</strong><small>Document · {copies ? `${copies} ${copies === 1 ? 'copy' : 'copies'}` : 'No copies'}</small></span>
        <span className="morph-context-favorite" aria-hidden="true">{favorite ? '★' : '⋯'}</span>
      </div>
      <p aria-live="polite">{notice}</p>
    </div>
    <AnchoredSurface open={open} anchorRef={targetRef} point={point} onClose={close} width={218} height={208} className="morph-context-menu" role="menu" label="File actions">
      <div className="morph-context-items" onKeyDown={onMenuKeyDown}>
        {menuLabels.map((label, index) => <button ref={(node) => { itemRefs.current[index] = node; }} type="button" key={label} role={index === 2 ? 'menuitemcheckbox' : 'menuitem'} aria-checked={index === 2 ? favorite : undefined} className="morph-context-item" data-active={active === index} onPointerMove={() => setActive(index)} onClick={() => act(index)}><span className="morph-context-item-icon" aria-hidden="true">{['✎', '▣', favorite ? '★' : '☆', 'ⓘ'][index]}</span>{label}{index === 2 && favorite && <span className="morph-context-item-end" aria-hidden="true">✓</span>}</button>)}
      </div>
    </AnchoredSurface>
  </section>;
}
