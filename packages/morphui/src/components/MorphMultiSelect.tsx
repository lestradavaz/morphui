'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { flushSync } from 'react-dom';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

import { EASE_FLOW, registerMorphEases } from '../lib/easing.js';
import { prefersReducedMotion, slowFactor } from '../lib/measure.js';
import { AnchoredSurface } from './AnchoredSurface.js';
import { MorphButton } from './MorphButton.js';
import { MorphCloseContext } from './MorphClose.js';

gsap.registerPlugin(Flip);
registerMorphEases();

/** How long a chip takes to slide, before `--morph-slow` has its say. */
const CHIP = 0.26;

export interface MorphMultiSelectProps {
  options: readonly string[];
  /** The chosen values, in any order: the field renders them in `options` order. */
  value: readonly string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
  /** An accessible name for the search field. */
  'aria-label'?: string;
  width?: number;
  height?: number;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A field of choices that opens into the list they come from.
 *
 * Adding or removing a choice is the field's own change and nothing else's. A
 * chip does not fly in from its row: the trip is longer than the panel it
 * crosses, and a copy of a row is not a chip, so what the eye reads is a second
 * label loose on the page rather than a choice being made. The chip fades in
 * where it belongs and its neighbours slide to make room, which is a change the
 * reader can follow without it costing them the panel they are still using.
 *
 * The chips are rendered in the order `options` declares rather than the order
 * they were picked, so adding one never reshuffles the ones beside it.
 *
 * Backspace in an empty search removes the last chip, which is what the key is
 * reaching for in every field of this kind.
 */
export function MorphMultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Search…',
  width,
  height,
  onOpenChange,
  ...rest
}: MorphMultiSelectProps): ReactElement {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const needle = query.trim().toLocaleLowerCase();
  const filtered = options.filter((option) => option.toLocaleLowerCase().includes(needle));
  // In the order the list keeps them, not the order they were clicked.
  const chosen = options.filter((option) => value.includes(option));

  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
    onOpenChange?.(false);
  };

  /*
   * Flip only, and never in `absolute` mode. Absolutely positioning a chip to
   * animate it takes it out of the flow for a frame, which flashes the whole
   * field; in flow the chips are translated and never stop being laid out.
   */
  const commit = (next: string[]) => {
    const field = triggerRef.current;
    const nodes = Array.from(field?.querySelectorAll<HTMLElement>('.morph-multi-select__chip') ?? []);
    const state = nodes.length && !prefersReducedMotion() ? Flip.getState(nodes) : null;
    flushSync(() => onChange(next));
    if (!state) return;
    const duration = CHIP * slowFactor(field ?? document.documentElement);
    Flip.from(state, {
      targets: Array.from(field?.querySelectorAll<HTMLElement>('.morph-multi-select__chip') ?? []),
      duration,
      ease: EASE_FLOW,
      onEnter: (entered) => gsap.fromTo(entered, { opacity: 0 }, { opacity: 1, duration, ease: EASE_FLOW }),
    });
  };

  const add = (option: string) => commit([...value, option]);
  const drop = (option: string) => commit(value.filter((item) => item !== option));

  const toggle = (option: string) => {
    if (value.includes(option)) drop(option);
    else add(option);
    searchRef.current?.focus({ preventScroll: true });
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) % Math.max(filtered.length, 1));
    } else if (event.key === 'Enter') {
      const option = filtered[active];
      if (!option) return;
      event.preventDefault();
      toggle(option);
    } else if (event.key === 'Backspace' && !query && chosen.length) {
      // The last chip on screen, which is what Backspace is reaching for.
      drop(chosen[chosen.length - 1]!);
    }
  };

  const openList = () => {
    setOpen(true);
    onOpenChange?.(true);
    requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
  };

  return (
    <MorphCloseContext.Provider value={close}>
      <div className="morph-multi-select">
        {label ? <span className="morph-multi-select__label">{label}</span> : null}
        <div
          ref={triggerRef}
          className="morph-multi-select__field"
          /*
           * The field is the biggest target in the control, so it is the one a
           * pointer aims at. A press on a chip belongs to that chip and a press
           * on the button belongs to the button, so both are left alone.
           */
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('.morph-multi-select__chip, .morph-multi-select__open')) return;
            (open ? close : openList)();
          }}
        >
          <div className="morph-multi-select__chips">
            {chosen.length === 0 ? <span className="morph-multi-select__placeholder">{placeholder}</span> : null}
            {chosen.map((option) => (
              <MorphButton
                key={option}
                variant="chip"
                size="sm"
                className="morph-multi-select__chip"
                aria-label={`Remove ${option}`}
                onClick={() => {
                  drop(option);
                  openRef.current?.focus({ preventScroll: true });
                }}
              >
                <span>{option}</span>
                <span className="morph-multi-select__chip-x" aria-hidden="true">
                  ×
                </span>
              </MorphButton>
            ))}
          </div>
          <button
            ref={openRef}
            type="button"
            className="morph-multi-select__open"
            aria-label="Choose"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            onClick={() => (open ? (close(), openRef.current?.blur()) : openList())}
          >
            <span aria-hidden="true">{open ? '−' : '+'}</span>
          </button>
        </div>
        <AnchoredSurface
          open={open}
          anchorRef={triggerRef}
          onClose={close}
          width={width}
          height={height}
          className="morph-multi-select__panel"
        >
          <div className="morph-multi-select__search">
            <span aria-hidden="true">⌕</span>
            <input
              ref={searchRef}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={listId}
              aria-activedescendant={filtered[active] ? `${listId}-${filtered[active]}` : undefined}
              value={query}
              placeholder={placeholder}
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              {...rest}
              onKeyDown={onSearchKeyDown}
            />
          </div>
          <div id={listId} role="listbox" aria-multiselectable="true" className="morph-multi-select__list" aria-label={rest['aria-label'] ?? label ?? 'Options'}>
            {filtered.length === 0 ? (
              <div className="morph-multi-select__empty">No matches.</div>
            ) : (
              filtered.map((option, index) => {
                const isChosen = value.includes(option);
                return (
                  <button
                    id={`${listId}-${option}`}
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={isChosen}
                    className="morph-multi-select__option"
                    data-active={index === active}
                    onPointerMove={() => setActive(index)}
                    onClick={() => toggle(option)}
                  >
                    <span className="morph-multi-select__check" data-selected={isChosen} aria-hidden="true">
                      {isChosen ? '✓' : ''}
                    </span>
                    <span className="morph-multi-select__option-label">{option}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="morph-multi-select__footer">
            <span>
              {value.length} selected
            </span>
            <button type="button" onClick={close}>
              Done
            </button>
          </div>
        </AnchoredSurface>
      </div>
    </MorphCloseContext.Provider>
  );
}
