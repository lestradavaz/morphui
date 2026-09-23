import { useState } from 'react';
import { MorphRadio } from '@lestradavaz/morph-ui';
import './demo.css';

const density = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'cosy', label: 'Cosy' },
  { value: 'compact', label: 'Compact' },
];

export default function RadioDemo() {
  const [value, setValue] = useState('cosy');

  return (
    <div className="demo-stack">
      <MorphRadio name="demo-density" label="Density" options={density} value={value} onChange={setValue} />
      <MorphRadio name="demo-density-locked" label="Density, fixed by the workspace" options={density} value="comfortable" disabled />
    </div>
  );
}
