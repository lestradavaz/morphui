import { useState } from 'react';
import { themes } from '@/core/data/catalog';
import { useSiteMode, useModeAttribute, type Mode } from '@/core/site-mode';
import Preview from '@/components/demos/Preview';
export default function ThemeGallery() {
  // Follows the site until the reader picks a side here. See Preview.
  const site = useSiteMode();
  const [picked, setPicked] = useState<Mode | null>(null);
  const mode = picked ?? site;
  const modeAttribute = useModeAttribute(picked);
  return <div className="theme-gallery">
    <div className="section-heading"><h2 id="presets">Seven starting points</h2><div className="segmented" aria-label="Palette appearance"><button type="button" aria-pressed={mode === 'light'} onClick={()=>setPicked('light')}>Light</button><button type="button" aria-pressed={mode === 'dark'} onClick={()=>setPicked('dark')}>Dark</button></div></div>
    <div className="palette-list">{themes.map(theme => <div className="palette-row" key={theme.id} data-morph-theme={theme.id} data-morph-mode={modeAttribute}><span>{theme.name}</span><div aria-label={`${theme.name} palette`} className="palette-swatches">{['bg','surface','raised','accent','text'].map(token => <span key={token} title={token} style={{background:`var(--morph-${token})`}} />)}</div><span className="palette-button">Aa</span></div>)}</div>
    <h2 id="try-themes">Try a theme in motion</h2><Preview />
  </div>;
}
