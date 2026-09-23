import { useState, type CSSProperties } from 'react';
import DialogDemo from './DialogDemo';
import WindowDemo from './WindowDemo';
import CardDemo from './CardDemo';
import { themes, components, type DemoKind } from '@/core/data/catalog';

export default function Preview({ kind = 'dialog', showcase = false }: { kind?: DemoKind; showcase?: boolean }) {
  const [active, setActive] = useState(kind);
  const [theme, setTheme] = useState('ink');
  const [mode, setMode] = useState('light');
  const [slow, setSlow] = useState(false);
  const Demo = active === 'dialog' ? DialogDemo : active === 'window' ? WindowDemo : CardDemo;
  return <div className={`preview ${showcase ? 'preview-showcase' : ''}`}>
    <div className="preview-top">
      {showcase ? <div className="segmented" aria-label="Component">
        {components.map(c => <button type="button" key={c.kind} onClick={() => setActive(c.kind)} aria-pressed={active === c.kind}>{c.label}</button>)}
      </div> : <span>Live preview</span>}
      <button type="button" className="slow-control" aria-pressed={slow} onClick={() => setSlow(!slow)}>{slow ? 'Slow ×5' : 'Slow motion'}</button>
    </div>
    <div className="preview-stage" data-morph-theme={theme} data-morph-mode={mode} style={{ '--morph-slow': slow ? 5 : 1 } as CSSProperties}>
      <Demo key={active} />
      <span className="preview-hint">{active === 'card' ? 'Open the card. Follow the image.' : 'Press the button. Follow the motion.'}</span>
    </div>
    <div className="preview-controls">
      <label className="theme-select-label">Theme<select aria-label="Preview color theme" value={theme} onChange={event => setTheme(event.target.value)}>{themes.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
      <div className="segmented" aria-label="Preview appearance">
        <button type="button" aria-pressed={mode === 'light'} onClick={() => setMode('light')}>Light</button>
        <button type="button" aria-pressed={mode === 'dark'} onClick={() => setMode('dark')}>Dark</button>
      </div>
    </div>
  </div>;
}
