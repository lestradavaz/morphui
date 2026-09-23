import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { AnchoredSurface } from './AnchoredSurface';
import { MorphButton } from './ButtonDemo';
import { EASE_FLOW, motionSeconds, prefersReducedMotion } from './motion';
import './multi.css';

gsap.registerPlugin(Flip);

const topics = ['Animation', 'Accessibility', 'Design systems', 'React', 'TypeScript', 'Performance'];

export function MultiSelectDemo() {
  const [selected, setSelected] = useState<string[]>(['Animation']);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const chips = useRef(new Map<string, HTMLElement>());
  const listId = useId();
  const filtered = topics.filter((topic) => topic.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));

  /*
   * In the order the list keeps them, not the order they were clicked.
   *
   * Rendering the selection array meant a chip placed itself wherever it was
   * picked, so every add or remove reshuffled the field and every chip after the
   * change moved whether or not anything about it had changed. Read from the
   * source list instead and a chip only ever moves because a neighbour left.
   */
  const shown = topics.filter((topic) => selected.includes(topic));
  const close = () => { setOpen(false); setQuery(''); setActive(0); };
  const duration = () => motionSeconds(triggerRef.current ?? document.documentElement, 0.26);
  const chipNodes = () => Array.from(triggerRef.current?.querySelectorAll<HTMLElement>('.morph-multi-chip') ?? []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
  }, [open]);

  /*
   * Flip only, and never in `absolute` mode. Absolutely positioning the row to
   * animate it takes the chips out of the flow for a frame, which flashes the
   * whole field; in flow they are translated and never stop being laid out.
   *
   * A chip does not fly in from its row. It was tried: a copy of the row lifted
   * off the list, crossed the panel and dissolved where the chip was waiting.
   * The trip is longer than the panel it crosses, so what the eye reads is a
   * second label loose on the page rather than a selection being made - and a
   * copy of a row is not a chip, so it never quite matched the thing it became.
   * The field owns this change: a chip fades in where it belongs, and its
   * neighbours slide to make room.
   *
   * Nothing here is marked `data-morph-item` either. Marking it hands the same
   * pairing to the engine's own flight on open and close, which holds both ends
   * back for the trip: a field of chips would empty every one of its labels and
   * bring them back whenever the panel moved.
   */
  const commit = (next: string[]) => {
    const nodes = chipNodes();
    const state = nodes.length && !prefersReducedMotion() ? Flip.getState(nodes) : null;
    flushSync(() => setSelected(next));
    if (!state) return;
    Flip.from(state, {
      targets: chipNodes(),
      duration: duration(),
      ease: EASE_FLOW,
      onEnter: (entered) => gsap.fromTo(entered, { opacity: 0 }, { opacity: 1, duration: duration(), ease: EASE_FLOW }),
    });
  };

  const add = (topic: string) => commit([...selected, topic]);

  const drop = (topic: string) => commit(selected.filter((item) => item !== topic));

  const toggle = (topic: string) => {
    if (selected.includes(topic)) drop(topic);
    else add(topic);
    searchRef.current?.focus({ preventScroll: true });
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) % Math.max(filtered.length, 1));
    } else if (event.key === 'Enter' && filtered[active]) {
      event.preventDefault();
      toggle(filtered[active]);
    } else if (event.key === 'Backspace' && !query && shown.length) {
      // The last chip on screen, which is what Backspace is reaching for.
      drop(shown[shown.length - 1]!);
    }
  };

  return (
    <section className="stage" aria-label="Multi select example">
      <div className="morph-multi-field">
        <span className="morph-multi-field-label">Topics</span>
        <div ref={triggerRef} className="morph-multi-trigger">
          <div className="morph-multi-chips">
            {shown.length === 0 && <span className="morph-multi-placeholder">Choose topics</span>}
            {shown.map((topic) => (
              <MorphButton
                key={topic}
                variant="chip"
                size="sm"
                className="morph-multi-chip"
                ref={(node) => { if (node) chips.current.set(topic, node); else chips.current.delete(topic); }}
                aria-label={`Remove ${topic}`}
                onClick={() => { drop(topic); openRef.current?.focus({ preventScroll: true }); }}
              >
                <span>{topic}</span>
                <span className="morph-multi-chip-x" aria-hidden="true">×</span>
              </MorphButton>
            ))}
          </div>
          <button ref={openRef} type="button" className="morph-multi-open" aria-label="Choose topics" aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '−' : '+'}</span></button>
        </div>
      </div>
      <AnchoredSurface open={open} anchorRef={triggerRef} onClose={close} width={320} height={277} className="morph-multi-panel">
        <div className="morph-multi-search"><span aria-hidden="true">⌕</span><input ref={searchRef} role="combobox" aria-label="Search topics" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={filtered[active] ? `${listId}-${filtered[active]}` : undefined} value={query} placeholder="Search topics…" onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={onSearchKeyDown} /></div>
        <div id={listId} role="listbox" aria-label="Topics" aria-multiselectable="true" className="morph-multi-options">
          {filtered.length ? filtered.map((topic, index) => <button id={`${listId}-${topic}`} key={topic} type="button" role="option" aria-selected={selected.includes(topic)} className="morph-multi-option" data-active={index === active} onPointerMove={() => setActive(index)} onClick={() => toggle(topic)}><span className="morph-multi-option-check" data-selected={selected.includes(topic)} aria-hidden="true">{selected.includes(topic) ? '✓' : ''}</span><span className="morph-multi-option-label">{topic}</span></button>) : <div className="morph-multi-empty">No matching topics.</div>}
        </div>
        <div className="morph-multi-footer"><span>{selected.length} selected</span><button type="button" onClick={close}>Done</button></div>
      </AnchoredSurface>
    </section>
  );
}
