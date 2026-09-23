import { useState, type ComponentType, type CSSProperties } from 'react';
import DialogDemo from './DialogDemo';
import WindowDemo from './WindowDemo';
import CardDemo from './CardDemo';
import ButtonDemo from './ButtonDemo';
import PopoverDemo from './PopoverDemo';
import TooltipDemo from './TooltipDemo';
import ContextMenuDemo from './ContextMenuDemo';
import ComboboxDemo from './ComboboxDemo';
import MultiSelectDemo from './MultiSelectDemo';
import { themes, components, type DemoKind } from '@/core/data/catalog';
import { useSiteMode, useModeAttribute, type Mode } from '@/core/site-mode';

/** Every component, by the kind its page declares. */
const DEMOS: Record<DemoKind, ComponentType> = {
  dialog: DialogDemo,
  window: WindowDemo,
  card: CardDemo,
  button: ButtonDemo,
  popover: PopoverDemo,
  tooltip: TooltipDemo,
  'context-menu': ContextMenuDemo,
  combobox: ComboboxDemo,
  'multi-select': MultiSelectDemo,
};

/** What to do with this one, said in the same voice as the preview. */
const HINTS: Record<DemoKind, string> = {
  dialog: 'Press the button. Follow the motion.',
  window: 'Open the window. The button stays where it is.',
  card: 'Open the card. Follow the image.',
  button: 'Press anywhere on a button. The ripple starts there.',
  popover: 'Open it. The heading travels out of the button.',
  tooltip: 'Rest on a button, or tab to one.',
  'context-menu': 'Right-click the row, or press Shift+F10.',
  combobox: 'Open the list. The mark travels with the choice.',
  'multi-select': 'Pick a topic. The field makes room for it.',
};

/* The hero cycles the three that show the language at its largest; the other
   components have their own rows further down the page and their own previews
   on their own pages. */
const SHOWCASE: DemoKind[] = ['dialog', 'window', 'card'];

export default function Preview({ kind = 'dialog', showcase = false }: { kind?: DemoKind; showcase?: boolean }) {
  const [active, setActive] = useState(kind);
  const [theme, setTheme] = useState('ink');
  /*
   * Null means the preview has not been told otherwise and goes with the site.
   * It keeps following while it stays null - including a system preference that
   * changes with the page open - and stops the moment the reader picks a side
   * here, which is theirs to keep.
   */
  const site = useSiteMode();
  const [picked, setPicked] = useState<Mode | null>(null);
  const mode = picked ?? site;
  const modeAttribute = useModeAttribute(picked);
  const [slow, setSlow] = useState(false);
  const Demo = DEMOS[active];
  return <div className={`preview ${showcase ? 'preview-showcase' : ''}`}>
    <div className="preview-top">
      {showcase ? <div className="segmented" aria-label="Component">
        {components.filter(c => SHOWCASE.includes(c.kind)).map(c => <button type="button" key={c.kind} onClick={() => setActive(c.kind)} aria-pressed={active === c.kind}>{c.label}</button>)}
      </div> : <span>Live preview</span>}
      <button type="button" className="slow-control" aria-pressed={slow} onClick={() => setSlow(!slow)}>{slow ? 'Slow ×5' : 'Slow motion'}</button>
    </div>
    <div className="preview-stage" data-morph-theme={theme} data-morph-mode={modeAttribute} style={{ '--morph-slow': slow ? 5 : 1 } as CSSProperties}>
      <Demo key={active} />
      <span className="preview-hint">{HINTS[active]}</span>
    </div>
    <div className="preview-controls">
      <label className="theme-select-label">Theme<select aria-label="Preview color theme" value={theme} onChange={event => setTheme(event.target.value)}>{themes.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
      <div className="segmented" aria-label="Preview appearance">
        <button type="button" aria-pressed={mode === 'light'} onClick={() => setPicked('light')}>Light</button>
        <button type="button" aria-pressed={mode === 'dark'} onClick={() => setPicked('dark')}>Dark</button>
      </div>
    </div>
  </div>;
}
