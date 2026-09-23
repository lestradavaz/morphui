import { useRef, useState } from 'react';
import { AnchoredSurface } from './AnchoredSurface';
import { MorphButton } from './ButtonDemo';
import { MorphSwitch } from './SwitchDemo';
import './popover.css';

export function PopoverDemo() {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [sounds, setSounds] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  return <section className="stage" aria-label="Popover example">
    <MorphButton ref={triggerRef} variant="ghost" className="morph-popover-trigger" aria-expanded={open} aria-haspopup="dialog" aria-controls="morph-popover-panel" onClick={() => setOpen(!open)}><span data-morph-words>Notification settings</span><span aria-hidden="true">↗</span></MorphButton>
    <AnchoredSurface open={open} anchorRef={triggerRef} onClose={close} width={292} height={249} className="morph-popover-panel" role="dialog" label="Notification settings" shareWords>
      <div id="morph-popover-panel" className="morph-popover-content">
        <h3 data-morph-words>Notification settings</h3>
        <p>Choose how this workspace keeps you informed.</p>
        <div className="morph-popover-row"><div><strong>Project updates</strong><span>Changes and comments</span></div><MorphSwitch checked={updates} onChange={setUpdates} label="Project updates" /></div>
        <div className="morph-popover-row"><div><strong>Sounds</strong><span>Play a subtle alert</span></div><MorphSwitch checked={sounds} onChange={setSounds} label="Sounds" /></div>
        <div className="morph-popover-footer"><button type="button" onClick={close}>Done</button></div>
      </div>
    </AnchoredSurface>
  </section>;
}
