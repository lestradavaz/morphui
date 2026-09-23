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
  { id: 'morph-button', name: 'MorphButton', label: 'Button', description: 'A press that starts where your finger landed.', detail: 'Four variants, two sizes, a loading state, and the same curves as everything else.', kind: 'button' },
  { id: 'morph-switch', name: 'MorphSwitch', label: 'Switch', description: 'One position or the other, and the thumb travels between them.', detail: 'A button with role="switch", a track that changes color and a thumb that squashes under the press.', kind: 'switch' },
  { id: 'morph-checkbox', name: 'MorphCheckbox', label: 'Checkbox', description: 'A box that fills, and a tick that draws itself.', detail: 'A real input, visually hidden, with the box drawn beside it and the tick on stroke-dashoffset.', kind: 'checkbox' },
  { id: 'morph-radio', name: 'MorphRadio', label: 'Radio', description: 'The choice slides to the row you picked.', detail: 'A radio group on a raised track, where a panel moves between the rows instead of a highlight blinking.', kind: 'radio' },
  { id: 'morph-input', name: 'MorphInput', label: 'Input', description: 'A field that answers without moving what you are reading.', detail: 'A labelled text field whose status changes the border, the mark and the message line, and nothing else.', kind: 'input' },
  { id: 'morph-stepper', name: 'MorphStepper', label: 'Stepper', description: 'A number, and two buttons that make room for each other.', detail: 'At the ends of its range one button leaves and the number takes the space, on the library’s closing curve.', kind: 'stepper' },
  { id: 'morph-tabs', name: 'MorphTabs', label: 'Tabs', description: 'The panel changes at once, and the pill takes its own time.', detail: 'A tab list where the content is immediate and the pill is measured, slides under a pointer and is placed under a keyboard.', kind: 'tabs' },
  { id: 'morph-popover', name: 'MorphPopover', label: 'Popover', description: 'The control unfolds into what it controls.', detail: 'A surface that grows out of its trigger and leaves the page behind it alone.', kind: 'popover' },
  { id: 'morph-tooltip', name: 'MorphTooltip', label: 'Tooltip', description: 'A quiet hint, for the pointer and for the keyboard.', detail: 'A short description on hover and on focus, on the library’s own slide duration.', kind: 'tooltip' },
  { id: 'morph-context-menu', name: 'MorphContextMenu', label: 'Context menu', description: 'Actions that come out of the row they act on.', detail: 'Right-click, long press or Shift+F10, and the menu unfolds from where you were.', kind: 'context-menu' },
  { id: 'morph-combobox', name: 'MorphCombobox', label: 'Combobox', description: 'The field opens into the list it is choosing from.', detail: 'Type to filter, with the choice’s own mark travelling between field and row.', kind: 'combobox' },
  { id: 'morph-multi-select', name: 'MorphMultiSelect', label: 'Multi select', description: 'Chosen values stay in the field, and the field keeps its shape.', detail: 'A chip fades in where it belongs while its neighbours slide to make room.', kind: 'multi-select' },
  { id: 'morph-save-button', name: 'MorphSaveButton', label: 'Save button', description: 'The button becomes the receipt for the press.', detail: 'Two faces and a width that travels between them, measured from the words that are arriving.', kind: 'save-button' },
  { id: 'morph-hold-button', name: 'MorphHoldButton', label: 'Hold button', description: 'The press is the animation, and it lasts as long as the confirm.', detail: 'A fill that crosses the button on the same clock the confirm runs on, and retargets when the press is released.', kind: 'hold-button' },
  { id: 'morph-select', name: 'MorphSelect', label: 'Select', description: 'The field’s own words become the title of the list it opens.', detail: 'A short dialog whose heading is shared with the trigger, with a row that marks itself.', kind: 'select' },
  { id: 'morph-expand', name: 'MorphExpand', label: 'Expand', description: 'One control that unfolds into its own actions, in place.', detail: 'A pill that widens from the label it is already showing, measured from the actions it holds.', kind: 'expand' },
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
