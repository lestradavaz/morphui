import { useState } from 'react';
import { MorphClose, MorphDialog, useMorphClose } from '@lestradavaz/morph-ui';
import './select.css';

const finishes = ['Ink', 'Cobalt', 'Terracotta', 'Teal'];

function SelectOptions({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const close = useMorphClose();
  return (
    <div className="morph-select-options">
      {finishes.map((finish) => (
        <button
          type="button"
          key={finish}
          className="morph-select-option"
          aria-pressed={value === finish}
          onClick={() => { onChange(finish); close(); }}
        >
          <span className="morph-select-swatch" data-finish={finish.toLowerCase()} aria-hidden="true" />
          {finish}
          <span className="morph-select-option-check" aria-hidden="true">{value === finish ? '✓' : ''}</span>
        </button>
      ))}
    </div>
  );
}

export function SelectDemo() {
  const [value, setValue] = useState('Ink');
  const [open, setOpen] = useState(false);

  return (
    <section className="stage" aria-label="Select example">
      <MorphDialog
        shareWords
        aria-label="Choose a finish"
        panelClassName="morph-select-panel"
        onOpenChange={setOpen}
        trigger={
          <button type="button" className="morph-select-trigger" aria-haspopup="dialog" aria-expanded={open}>
            <span data-morph-words>Choose a finish</span>
            <span className="morph-select-trigger-current"><span className="morph-select-swatch" data-finish={value.toLowerCase()} aria-hidden="true" /><span className="morph-select-trigger-value">{value}</span></span>
            <span className="morph-select-chevron" aria-hidden="true" />
          </button>
        }
        chrome={
          <MorphClose><button type="button" className="morph-select-close" aria-label="Close finish selector">×</button></MorphClose>
        }
      >
        <div className="morph-select-content">
          <h2 data-morph-words>Choose a finish</h2>
          <p>Pick a color for your workspace.</p>
          <SelectOptions value={value} onChange={setValue} />
        </div>
      </MorphDialog>
    </section>
  );
}
