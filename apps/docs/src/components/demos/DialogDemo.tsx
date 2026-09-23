import { useState } from 'react';
import { MorphDialog, MorphClose } from 'morphui';
import './demo.css';

export default function DialogDemo() {
  const [created, setCreated] = useState(false);
  return (
    <MorphDialog
      shareWords
      aria-label="Create account"
      panelClassName="demo-dialog-panel"
      trigger={<button className="demo-primary" type="button">Create account</button>}
      /* Chrome, not content: it rides above the panel rather than inside the
         layer that fades, blurs and settles during the transition. */
      chrome={<MorphClose><button className="demo-close" type="button" aria-label="Close dialog">×</button></MorphClose>}
      onOpenChange={open => { if (open) setCreated(false); }}
    >
      <div className="demo-sheet">
        <span className="demo-emblem" aria-hidden="true">m</span>
        <h2 data-morph-words>Create account</h2>
        {created ? (
          <div role="status" className="demo-success">
            <h3>You're all set.</h3><p>This is a local preview. No account was created or data sent.</p>
            <MorphClose><button className="demo-primary" type="button">Back to the preview</button></MorphClose>
          </div>
        ) : (
          <form onSubmit={event => { event.preventDefault(); setCreated(true); }}>
            <p>A small beginning. Make a little space for your next idea.</p>
            <label>Email<input type="email" required placeholder="you@example.com" autoComplete="email" /></label>
            <label>Password<input type="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" /></label>
            <button className="demo-primary" type="submit">Continue</button>
            <span className="demo-note">Interactive demo. Nothing is submitted.</span>
          </form>
        )}
      </div>
    </MorphDialog>
  );
}
