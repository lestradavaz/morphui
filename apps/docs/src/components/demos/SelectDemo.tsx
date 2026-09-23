import { useState } from 'react';
import { MorphSelect } from '@lestradavaz/morph-ui';
import './demo.css';

const finishes = [
  { value: 'ink', label: 'Ink', swatch: 'var(--morph-accent)' },
  { value: 'cobalt', label: 'Cobalt', swatch: '#4b64a7' },
  { value: 'terracotta', label: 'Terracotta', swatch: '#b2654e' },
  { value: 'teal', label: 'Teal', swatch: '#397f80' },
];

export default function SelectDemo() {
  const [value, setValue] = useState('ink');
  return (
    <div className="demo-fields">
      <MorphSelect
        label="Choose a finish"
        description="Pick a color for your workspace."
        options={finishes}
        value={value}
        onChange={setValue}
      />
    </div>
  );
}
