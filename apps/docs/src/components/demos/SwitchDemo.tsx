import { useState } from 'react';
import { MorphSwitch } from '@lestradavaz/morph-ui';
import './demo.css';

export default function SwitchDemo() {
  const [notifications, setNotifications] = useState(true);
  const [quiet, setQuiet] = useState(false);

  return (
    <div className="demo-stack">
      <div className="demo-row">
        <MorphSwitch id="demo-notifications" checked={notifications} onChange={setNotifications} label="Notifications" />
        <label className="demo-label" htmlFor="demo-notifications">Notifications</label>
      </div>
      <div className="demo-row">
        <MorphSwitch id="demo-quiet" checked={quiet} onChange={setQuiet} label="Quiet hours" />
        <label className="demo-label" htmlFor="demo-quiet">Quiet hours</label>
      </div>
      <div className="demo-row">
        <MorphSwitch id="demo-locked" checked={false} disabled label="Locked by your workspace" />
        <label className="demo-label" data-disabled htmlFor="demo-locked">Locked by your workspace</label>
      </div>
    </div>
  );
}
