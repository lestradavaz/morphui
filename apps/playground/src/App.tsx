import { useState } from 'react';
import {
  MorphCard,
  MorphClose,
  MorphDialog,
  MorphWindow,
  MORPH_THEMES,
  setMorphMode,
  setMorphTheme,
  type MorphMode,
  type MorphTheme,
} from 'morphui';

export function App() {
  const [theme, setTheme] = useState<MorphTheme>('ink');
  const [mode, setMode] = useState<MorphMode>('system');
  const [slow, setSlow] = useState(false);

  const pickTheme = (next: MorphTheme) => {
    setTheme(next);
    setMorphTheme(next);
  };
  const pickMode = (next: MorphMode) => {
    setMode(next);
    setMorphMode(next);
  };
  const toggleSlow = () => {
    const next = !slow;
    setSlow(next);
    document.documentElement.style.setProperty('--morph-slow', next ? '5' : '1');
  };

  return (
    <div className="wrap">
      <header>
        <h1>MorphUI playground</h1>
        <p className="lede">
          Open a panel and watch where the trigger goes. Turn on slow motion to read the content
          lagging behind the closing container.
        </p>
      </header>

      <div className="row">
        <div className="bar">
          {MORPH_THEMES.map((name) => (
            <button
              key={name}
              type="button"
              className="dot"
              aria-label={name}
              aria-pressed={theme === name}
              onClick={() => pickTheme(name)}
            >
              {/* The attribute makes the var resolve to that theme, not the active one. */}
              <span data-morph-theme={name} style={{ background: 'var(--morph-accent)' }} />
            </button>
          ))}
        </div>

        <div className="bar">
          {(['light', 'dark', 'system'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={mode === value} onClick={() => pickMode(value)}>
              {value}
            </button>
          ))}
        </div>

        <div className="bar">
          <button type="button" aria-pressed={slow} onClick={toggleSlow}>
            Slow motion ×5
          </button>
        </div>
      </div>

      <div className="rule" />

      <section className="stage">
        <div className="row" style={{ justifyContent: 'center' }}>
          <MorphDialog
            shareWords
            trigger={<button type="button" className="pill">Create account</button>}
            panelClassName="panel-auth"
            aria-label="Create account"
          >
            <div className="sheet">
              <MorphClose>
                <button type="button" className="closer" aria-label="Close">×</button>
              </MorphClose>
              <span className="mark" aria-hidden="true">mu</span>
              <h2 data-morph-words>Create account</h2>
              <label className="field">
                <span>Email</span>
                <input type="email" placeholder="name@mail.com" autoComplete="email" />
              </label>
              <label className="field">
                <span>Password</span>
                <input type="password" placeholder="At least 8 characters" autoComplete="new-password" />
              </label>
              <button type="button" className="pill">Continue</button>
            </div>
          </MorphDialog>

          <MorphDialog
            variant="fullscreen"
            trigger={<button type="button" className="ghost">Read the story</button>}
            aria-label="Story"
          >
            <div className="sheet" style={{ maxWidth: 720, margin: '0 auto', paddingTop: 64 }}>
              <MorphClose>
                <button type="button" className="closer" aria-label="Close">×</button>
              </MorphClose>
              <h2>Full screen, same engine</h2>
              <p style={{ margin: 0, color: 'var(--morph-muted)' }}>
                The only difference is where the panel lands and how long its corners take to open
                out. A panel with corners matches the surface timing; a full-screen one takes 1200ms
                so the corners do not snap.
              </p>
            </div>
          </MorphDialog>
        </div>
      </section>

      <section className="stage">
        <div className="row" style={{ justifyContent: 'center' }}>
          <MorphWindow
            trigger={<button type="button" className="chip">What is it?</button>}
            aria-label="About the morph"
          >
            <div className="sheet" style={{ maxWidth: 560 }}>
              <MorphClose>
                <button type="button" className="closer" aria-label="Close">&times;</button>
              </MorphClose>
              <h2 data-morph-words>What is it?</h2>
              <p style={{ margin: 0, color: 'var(--morph-muted)' }}>
                The label travels from the button to this heading and returns on close. The
                surrounding content resolves from blur while the shared words stay in focus.
              </p>
            </div>
          </MorphWindow>

          <MorphCard
            aria-label="Open the card"
            card={
              <button type="button" className="card" aria-label="Open the card">
                <span className="art" data-morph-item="art" />
              </button>
            }
          >
            <div className="feature">
              <span className="art art-full" data-morph-item="art" />
              <div className="sheet" style={{ maxWidth: 680, margin: '0 auto' }}>
                <MorphClose>
                  <button type="button" className="closer" aria-label="Close">&times;</button>
                </MorphClose>
                <h2>The image is the shared element</h2>
                <p style={{ margin: 0, color: 'var(--morph-muted)' }}>
                  Marked <code>data-morph-item</code> on both sides, so the image travels
                  between the card and the full-screen view in both directions.
                </p>
              </div>
            </div>
          </MorphCard>
        </div>
      </section>
    </div>
  );
}
