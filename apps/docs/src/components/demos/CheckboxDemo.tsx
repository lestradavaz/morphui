import { useState } from 'react';
import { MorphCheckbox } from '@lestradavaz/morph-ui';
import './demo.css';

export default function CheckboxDemo() {
  const [updates, setUpdates] = useState(true);
  const [digest, setDigest] = useState(false);
  const [mentions, setMentions] = useState(false);

  return (
    <div className="demo-stack">
      <div className="demo-row">
        <MorphCheckbox label="Project updates" checked={updates} onChange={setUpdates} />
        <MorphCheckbox label="Weekly digest" checked={digest} onChange={setDigest} />
        <MorphCheckbox label="Mentions" checked={mentions} onChange={setMentions} />
      </div>
      <div className="demo-row">
        <MorphCheckbox label="Disabled" checked={false} disabled />
        <MorphCheckbox label="Disabled, chosen" checked disabled />
      </div>
    </div>
  );
}
