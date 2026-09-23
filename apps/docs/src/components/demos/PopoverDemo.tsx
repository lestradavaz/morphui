import { useState } from 'react';
import { MorphButton, MorphClose, MorphPopover } from '@lestradavaz/morph-ui';
import './demo.css';

export default function PopoverDemo() {
  const [updates, setUpdates] = useState(true);
  const [sounds, setSounds] = useState(false);
  return (
    <MorphPopover
      label="Notification settings"
      width={292}
      /* The trigger keeps its label for the whole transition and the heading
         arrives as a copy of it: a control that emptied itself while the panel
         opened beside it would read as broken rather than as one word travelling. */
      shareWords
      trigger={
        <MorphButton variant="ghost" className="demo-popover-trigger">
          <span data-morph-words>Notification settings</span>
          <span aria-hidden="true">↗</span>
        </MorphButton>
      }
    >
      <h3 data-morph-words>Notification settings</h3>
      <p>Choose how this workspace keeps you informed.</p>
      <label className="morph-popover__row">
        <span><strong>Project updates</strong><small>Changes and comments</small></span>
        <input type="checkbox" checked={updates} onChange={event => setUpdates(event.target.checked)} />
      </label>
      <label className="morph-popover__row">
        <span><strong>Sounds</strong><small>Play a subtle alert</small></span>
        <input type="checkbox" checked={sounds} onChange={event => setSounds(event.target.checked)} />
      </label>
      <div className="morph-popover__footer">
        <MorphClose><button className="demo-small" type="button">Done</button></MorphClose>
      </div>
    </MorphPopover>
  );
}
