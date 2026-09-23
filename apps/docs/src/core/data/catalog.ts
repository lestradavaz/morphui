import packageJson from '../../../../../packages/morphui/package.json';

export const release = { name: packageJson.name, version: packageJson.version, npm: `https://www.npmjs.com/package/${packageJson.name}` };
export const themes = [
  { id: 'ink', name: 'Ink' }, { id: 'green', name: 'Green' },
  { id: 'cobalt', name: 'Cobalt' }, { id: 'terracotta', name: 'Terracotta' },
  { id: 'teal', name: 'Teal' }, { id: 'crimson', name: 'Crimson' }, { id: 'plum', name: 'Plum' },
] as const;
export const components = [
  { id: 'morph-dialog', name: 'MorphDialog', label: 'Dialog', description: 'A button becomes a conversation. Its label travels with it.', detail: 'Connect a trigger to a native dialog, carrying its surface and words into the panel.', kind: 'dialog' },
  { id: 'morph-window', name: 'MorphWindow', label: 'Window', description: 'A little more room, without losing your place.', detail: 'A focused window that opens from its trigger, with a softer blur and its own closing curve.', kind: 'window' },
  { id: 'morph-card', name: 'MorphCard', label: 'Card', description: 'From a small detail to the whole story. And back.', detail: 'Expand a card into a full-screen view, keeping the image connected throughout the transition.', kind: 'card' },
] as const;
export type DemoKind = typeof components[number]['kind'];
export const navigation = [
  { label: 'Getting started', links: [ { label: 'Installation', href: '/docs/installation' }, { label: 'Themes', href: '/docs/themes' }, { label: 'Motion', href: '/docs/motion' } ] },
  { label: 'Components', links: components.map(c => ({ label: c.name, href: `/docs/${c.id}` })) },
];
export const sharedProps = [
  ['children', 'ReactNode', 'Required', 'Content rendered inside the panel.'],
  ['shareWords', 'boolean', 'false', 'Connect trigger text to a heading marked data-morph-words.'],
  ['dismissOnTintClick', 'boolean', 'true', 'Close when the surrounding backdrop is clicked.'],
  ['chrome', 'ReactNode', '—', 'Panel furniture such as the close button. Its own layer over the panel, held at its own size and corner for the whole transition.'],
  ['panelClassName', 'string', '—', 'Classes on the visible panel. Use this to set its size and appearance.'],
  ['className', 'string', '—', 'Classes on the outer native dialog.'],
  ['aria-label', 'string', '—', 'An accessible name for the dialog. Set this for every instance.'],
  ['onOpenChange', '(open: boolean) => void', '—', 'Notification when opening starts and closing finishes.'],
];
