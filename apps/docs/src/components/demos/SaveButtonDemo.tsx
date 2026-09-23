import { useState } from 'react';
import { MorphSaveButton } from '@lestradavaz/morph-ui';
import './demo.css';

export default function SaveButtonDemo() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="demo-stack">
      <MorphSaveButton saved={saved} onClick={() => setSaved(!saved)} />
      <p className="demo-note" role="status">{saved ? 'Saved. Press it again to take it back.' : 'Nothing saved yet.'}</p>
    </div>
  );
}
