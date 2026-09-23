import { useState } from 'react';
import { MorphHoldButton } from '@lestradavaz/morph-ui';
import './demo.css';

export default function HoldButtonDemo() {
  const [done, setDone] = useState(false);
  return (
    <div className="demo-stack">
      <MorphHoldButton
        label="Hold to delete"
        confirmedLabel="Deleted · undo"
        onConfirm={() => setDone(true)}
        onReset={() => setDone(false)}
      />
      <p className="demo-note" role="status">{done ? 'Deleted. Press once to undo.' : 'Hold the button for most of a second.'}</p>
    </div>
  );
}
