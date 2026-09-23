import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { AnchoredSurface } from './AnchoredSurface';
import './combobox.css';

const workspaces = [
  { value: 'studio', label: 'Design studio', detail: '12 projects', group: 'Recent' },
  { value: 'product', label: 'Product team', detail: '8 projects', group: 'Recent' },
  { value: 'sandbox', label: 'Sandbox', detail: '24 experiments', group: 'All workspaces' },
  { value: 'archive', label: 'Component archive', detail: '41 components', group: 'All workspaces' },
] as const;

export function ComboboxDemo() {
  const [value, setValue] = useState('studio');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const filtered = workspaces.filter((item) => `${item.label} ${item.detail} ${item.group}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
  const current = workspaces.find((item) => item.value === value)!;
  const close = () => { setOpen(false); setQuery(''); setActive(0); };
  const choose = (next: string) => { setValue(next); close(); inputRef.current?.focus({ preventScroll: true }); };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { setOpen(true); setActive(0); return; }
      setActive((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + filtered.length) % Math.max(filtered.length, 1));
    } else if (event.key === 'Enter' && open && filtered[active]) {
      event.preventDefault();
      choose(filtered[active].value);
    }
  };

  return (
    <section className="stage" aria-label="Combobox example">
      <div className="morph-combobox-field">
        <label htmlFor="morph-combobox-input">Workspace</label>
        <div ref={triggerRef} className="morph-combobox-trigger">
          <span className="morph-combobox-mark" data-morph-item="mark" aria-hidden="true">{current.label.charAt(0)}</span>
          <input ref={inputRef} id="morph-combobox-input" role="combobox" aria-label="Search workspaces" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={open && filtered[active] ? `${listId}-${filtered[active].value}` : undefined} value={open ? query : current.label} placeholder="Search workspaces…" onFocus={() => { if (!open) { setOpen(true); setQuery(''); } }} onClick={() => { if (!open) { setOpen(true); setQuery(''); } }} onChange={(event) => { setOpen(true); setQuery(event.target.value); setActive(0); }} onKeyDown={onKeyDown} />
          <button ref={chevronRef} type="button" className="morph-combobox-chevron" data-open={open} aria-label={open ? 'Hide workspaces' : 'Show workspaces'} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} tabIndex={-1} onClick={() => { if (open) { close(); chevronRef.current?.blur(); } else { setOpen(true); setQuery(''); setActive(0); inputRef.current?.focus({ preventScroll: true }); } }} />
        </div>
      </div>
      <AnchoredSurface open={open} anchorRef={triggerRef} onClose={close} width={280} height={278} className="morph-combobox-panel">
        <div id={listId} role="listbox" aria-label="Workspaces" className="morph-combobox-list">
          {filtered.length === 0 ? <div className="morph-combobox-empty">No workspaces found.</div> : (['Recent', 'All workspaces'] as const).map((group) => {
            const items = filtered.filter((item) => item.group === group);
            if (!items.length) return null;
            return <div key={group} role="group" aria-label={group}>
              <div className="morph-combobox-group-label">{group}</div>
              {items.map((item) => <button id={`${listId}-${item.value}`} role="option" aria-selected={item.value === value} type="button" key={item.value} className="morph-combobox-option" data-active={filtered[active]?.value === item.value} onPointerMove={() => setActive(filtered.indexOf(item))} onClick={() => choose(item.value)}>
                <span className="morph-combobox-option-mark" {...(item.value === value ? { 'data-morph-item': 'mark' } : {})} aria-hidden="true">{item.label.charAt(0)}</span>
                <span className="morph-combobox-option-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                {item.value === value && <span className="morph-combobox-check" aria-hidden="true">✓</span>}
              </button>)}
            </div>;
          })}
        </div>
      </AnchoredSurface>
    </section>
  );
}
