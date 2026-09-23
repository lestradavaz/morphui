'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';

import { AnchoredSurface } from './AnchoredSurface.js';

export interface MorphComboboxOption {
  value: string;
  label: string;
  /** A second line under the label. Also searched. */
  detail?: string;
  /** Groups options under a shared heading, in the order the groups appear. */
  group?: string;
}

export interface MorphComboboxProps {
  options: readonly MorphComboboxOption[];
  /** The chosen value. The combobox is controlled: it never picks for you. */
  value: string;
  onChange: (value: string) => void;
  /** The field's visible label. */
  label?: string;
  placeholder?: string;
  /** An accessible name for the field. Set this when there is no visible label. */
  'aria-label'?: string;
  /**
   * The resting size of the list. Left out, the panel takes its height from the
   * options it was opened with, so a short list opens a short panel.
   */
  width?: number;
  height?: number;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A field that opens into the list it is choosing from.
 *
 * The list is the dialog's morph at one trigger's scale: it grows out of the
 * field, wears the field's fill and corners for the first beat, and carries its
 * options on a transform rather than reflowing them, so the rows travel with
 * the box instead of appearing inside it. The panel is anchored and non-modal,
 * so the page behind it stays where the reader left it.
 *
 * The initial of the current choice is marked on both sides, so it flies from
 * the field to the row it belongs to and back. It is the same shared-item
 * mechanism a card uses for its image, at the size of a letter.
 *
 * Typing filters. Arrow keys move, Enter chooses, Escape closes and leaves the
 * field focused, and the arrow at the end of the field opens and closes the
 * list for anyone using a pointer.
 */
export function MorphCombobox({
  options,
  value,
  onChange,
  label,
  placeholder = 'Search…',
  width,
  height,
  onOpenChange,
  ...rest
}: MorphComboboxProps): ReactElement {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const inputId = useId();

  const needle = query.trim().toLocaleLowerCase();
  const filtered = options.filter((option) =>
    `${option.label} ${option.detail ?? ''} ${option.group ?? ''}`.toLocaleLowerCase().includes(needle),
  );
  const current = options.find((option) => option.value === value);
  // Groups in the order they first appear, not the order they were declared.
  const groups = [...new Set(filtered.map((option) => option.group ?? ''))];

  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
    onOpenChange?.(false);
  };

  const openList = () => {
    setOpen(true);
    setQuery('');
    setActive(0);
    onOpenChange?.(true);
  };

  const choose = (next: string) => {
    onChange(next);
    close();
    inputRef.current?.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActive((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) % Math.max(filtered.length, 1));
    } else if (event.key === 'Enter' && open) {
      const option = filtered[active];
      if (!option) return;
      event.preventDefault();
      choose(option.value);
    }
  };

  return (
    <div className="morph-combobox">
      {label ? (
        <label className="morph-combobox__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div
        ref={triggerRef}
        className="morph-combobox__field"
        data-open={open}
      >
        <span className="morph-combobox__mark" data-morph-item="mark" aria-hidden="true">
          {(current?.label ?? '').charAt(0)}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && filtered[active] ? `${listId}-${filtered[active].value}` : undefined}
          className="morph-combobox__input"
          value={open ? query : (current?.label ?? '')}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => {
            if (!open) openList();
          }}
          onClick={() => {
            if (!open) openList();
          }}
          onChange={(event) => {
            if (!open) setOpen(true);
            setQuery(event.target.value);
            setActive(0);
          }}
          {...rest}
          onKeyDown={onKeyDown}
        />
        <button
          ref={chevronRef}
          type="button"
          className="morph-combobox__chevron"
          data-open={open}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={open ? 'Hide the list' : 'Show the list'}
          tabIndex={-1}
          onClick={() => {
            if (open) {
              close();
              chevronRef.current?.blur();
            } else {
              openList();
              inputRef.current?.focus({ preventScroll: true });
            }
          }}
        />
      </div>
      <AnchoredSurface
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        width={width}
        height={height}
        className="morph-combobox__panel"
      >
        <div id={listId} role="listbox" className="morph-combobox__list" aria-label={rest['aria-label'] ?? label ?? 'Options'}>
          {filtered.length === 0 ? (
            <div className="morph-combobox__empty">No matches.</div>
          ) : (
            groups.map((group) => {
              const items = filtered.filter((option) => (option.group ?? '') === group);
              const rows = items.map((option) => (
                <button
                  id={`${listId}-${option.value}`}
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className="morph-combobox__option"
                  data-active={filtered[active]?.value === option.value}
                  onPointerMove={() => setActive(filtered.indexOf(option))}
                  onClick={() => choose(option.value)}
                >
                  <span
                    className="morph-combobox__option-mark"
                    {...(option.value === value ? { 'data-morph-item': 'mark' } : {})}
                    aria-hidden="true"
                  >
                    {option.label.charAt(0)}
                  </span>
                  <span className="morph-combobox__option-copy">
                    <strong>{option.label}</strong>
                    {option.detail ? <small>{option.detail}</small> : null}
                  </span>
                  {option.value === value ? (
                    <span className="morph-combobox__check" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </button>
              ));
              return group ? (
                <div key={group} role="group" aria-label={group}>
                  <div className="morph-combobox__group">{group}</div>
                  {rows}
                </div>
              ) : (
                <div key="ungrouped">{rows}</div>
              );
            })
          )}
        </div>
      </AnchoredSurface>
    </div>
  );
}
