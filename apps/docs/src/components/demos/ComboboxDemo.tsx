import { useState } from 'react';
import { MorphCombobox, type MorphComboboxOption } from '@lestradavaz/morph-ui';
import './demo.css';

const workspaces: MorphComboboxOption[] = [
  { value: 'studio', label: 'Design studio', detail: '12 projects', group: 'Recent' },
  { value: 'product', label: 'Product team', detail: '8 projects', group: 'Recent' },
  { value: 'sandbox', label: 'Sandbox', detail: '24 experiments', group: 'All workspaces' },
  { value: 'archive', label: 'Component archive', detail: '41 components', group: 'All workspaces' },
];

export default function ComboboxDemo() {
  const [value, setValue] = useState('studio');
  return (
    <MorphCombobox
      options={workspaces}
      value={value}
      onChange={setValue}
      label="Workspace"
      aria-label="Search workspaces"
      placeholder="Search workspaces…"
    />
  );
}
