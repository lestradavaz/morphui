import { useState } from 'react';
import { MorphMultiSelect } from '@lestradavaz/morph-ui';
import './demo.css';

const topics = ['Animation', 'Accessibility', 'Design systems', 'React', 'TypeScript', 'Performance'];

export default function MultiSelectDemo() {
  const [value, setValue] = useState<string[]>(['Animation']);
  return (
    <MorphMultiSelect
      options={topics}
      value={value}
      onChange={setValue}
      label="Topics"
      aria-label="Search topics"
      placeholder="Choose topics"
    />
  );
}
