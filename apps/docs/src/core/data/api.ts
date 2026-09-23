/*
 * One props table per component, kept out of the page that renders it.
 *
 * The page is a template: it lays a preview, an example and a table in the same
 * order for every component. Which rows that table holds is a fact about the
 * component, so it lives here, next to the catalog, rather than in a nest of
 * ternaries inside the template that only grows when a component is added.
 */

export type ApiRow = readonly [name: string, type: string, value: string, description: string];

export interface Api {
  rows: ApiRow[];
  /** A closing line under the table. Authored HTML, for `<code>` in the text. */
  note: string;
}

/** The panel's own dismissal and notification, shared by everything modal. */
const panelTail: ApiRow[] = [
  ['onOpenChange', '(open: boolean) => void', '—', 'Notification when opening starts and closing finishes.'],
];

const anchoredTail: ApiRow[] = [
  ['onOpenChange', '(open: boolean) => void', '—', 'Notification when the surface is asked to open, and when it has closed.'],
];

const sizeRows = (what: string): ApiRow[] => [
  ['width', 'number', 'measured', `The resting width of the ${what}. Left out, it is measured as it lays itself out.`],
  ['height', 'number', 'measured', `The resting height of the ${what}. Pass both when the content can change size.`],
];

export const api: Record<string, Api> = {
  dialog: {
    rows: [
      ['trigger', 'ReactElement', 'Required', 'A single element that forwards its ref to a DOM node.'],
      ['variant', "'dialog' | 'window' | 'fullscreen'", "'dialog'", 'The geometry and appearance of the panel transition.'],
      ['children', 'ReactNode', 'Required', 'Content rendered inside the panel.'],
      ['shareWords', 'boolean', 'false', 'Connect trigger text to a heading marked data-morph-words.'],
      ['dismissOnTintClick', 'boolean', 'true', 'Close when the surrounding backdrop is clicked.'],
      ['chrome', 'ReactNode', '—', 'Panel furniture such as the close button. Its own layer over the panel, held at its own size and corner for the whole transition.'],
      ['panelClassName', 'string', '—', 'Classes on the visible panel. Use this to set its size and appearance.'],
      ['className', 'string', '—', 'Classes on the outer native dialog.'],
      ['aria-label', 'string', '—', 'An accessible name for the dialog. Set this for every instance.'],
      ...panelTail,
    ],
    note: 'MorphClose accepts one button as its child. The optional callback reports changes; this release does not expose a controlled <code>open</code> prop.',
  },
  window: {
    rows: [
      ['trigger', 'ReactElement', 'Required', 'A single element that forwards its ref to a DOM node.'],
      ['children', 'ReactNode', 'Required', 'Content rendered inside the window.'],
      ['shareWords', 'boolean', 'false', 'Connect trigger text to a heading marked data-morph-words. Sharing hands the trigger’s surface to the panel.'],
      ['dismissOnTintClick', 'boolean', 'true', 'Close when the surrounding backdrop is clicked.'],
      ['chrome', 'ReactNode', '—', 'Panel furniture such as the close button. Its own layer over the panel, held at its own size and corner for the whole transition.'],
      ['panelClassName', 'string', '—', 'Classes on the visible panel. Use this to set its size and appearance.'],
      ['className', 'string', '—', 'Classes on the outer native dialog.'],
      ['aria-label', 'string', '—', 'An accessible name for the window. Set this for every instance.'],
      ...panelTail,
    ],
    note: 'MorphClose, Escape and the backdrop all close a window. Whatever you pass as <code>chrome</code> rides above the panel rather than inside it.',
  },
  card: {
    rows: [
      ['card', 'ReactElement', 'Required', 'The card itself. Mark the image inside it with data-morph-item, and its counterpart in the panel with the same name.'],
      ['children', 'ReactNode', 'Required', 'The expanded view.'],
      ['dismissOnTintClick', 'boolean', 'true', 'Close when the surrounding backdrop is clicked.'],
      ['chrome', 'ReactNode', '—', 'Panel furniture such as the close button. Its own layer over the panel, held at its own size and corner for the whole transition.'],
      ['panelClassName', 'string', '—', 'Classes on the visible panel.'],
      ['className', 'string', '—', 'Classes on the outer native dialog.'],
      ['aria-label', 'string', '—', 'An accessible name for the full-screen view. Set this for every instance.'],
      ...panelTail,
    ],
    note: 'A card is a MorphDialog on the full-screen variant, so it takes every prop a dialog takes except the variant itself.',
  },
  button: {
    rows: [
      ['variant', "'pill' | 'ghost' | 'chip' | 'icon'", "'pill'", 'The primary action, the quiet one, a tag, or a square.'],
      ['size', "'sm' | 'md'", "'md'", 'The small size keeps the shape and lowers the height.'],
      ['loading', 'boolean', 'false', 'Shows a spinner in place of the label and blocks the press without changing the button’s size.'],
      ['children', 'ReactNode', '—', 'The label. An icon-only button needs an aria-label instead.'],
      ['disabled', 'boolean', 'false', 'Inherited from the native button.'],
      ['…rest', 'ButtonHTMLAttributes', '—', 'Every other prop goes to the underlying button, including type, name, onClick and aria-*.'],
    ],
    note: 'The ripple, the press and the loading state are CSS, so they work on a page that never imports a transition, and they keep working while the main thread is busy opening the panel the button just asked for.',
  },
  switch: {
    rows: [
      ['label', 'string', 'Required', 'The accessible name. Hidden, and required: a switch is announced as a switch and then as nothing else.'],
      ['checked', 'boolean', 'false', 'Whether the switch is on. Control it, or let the component keep its own state and read it from onChange.'],
      ['onChange', '(checked: boolean) => void', '—', 'Called with the position the reader moved it to.'],
      ['disabled', 'boolean', 'false', 'Blocks the press and reports itself.'],
      ['…rest', 'ButtonHTMLAttributes', '—', 'Every other prop goes to the underlying button, including id, name and aria-*.'],
    ],
    note: 'The visible text beside a switch is yours: give it an <code>id</code> and point a <code>&lt;label htmlFor&gt;</code> at it, which is what makes the text itself press the switch.',
  },
  checkbox: {
    rows: [
      ['label', 'ReactNode', 'Required', 'The text of the control. Clicking it ticks the box, because it is a real label.'],
      ['checked', 'boolean', 'false', 'Whether the box is ticked.'],
      ['onChange', '(checked: boolean) => void', '—', 'Called with the state the reader left it in.'],
      ['disabled', 'boolean', 'false', 'Blocks the input and takes the whole label out of the pointer’s reach.'],
      ['…rest', 'InputHTMLAttributes', '—', 'Every other prop goes to the underlying checkbox input, including id, name and aria-*.'],
    ],
    note: 'A real input stays in the tree, visually hidden, and the box is decoration beside it: that is what keeps the keyboard behaviour, form participation and label association a <code>div</code> with a role would have to reimplement.',
  },
  radio: {
    rows: [
      ['name', 'string', 'Required', 'The group’s name, so the browser keeps its own arrow-key behaviour.'],
      ['label', 'string', 'Required', 'The group’s accessible name.'],
      ['options', 'MorphRadioOption[]', 'Required', 'value and label, for each row.'],
      ['value', 'string', '—', 'The chosen value. With nothing chosen, the panel stays hidden.'],
      ['onChange', '(value: string) => void', '—', 'Called with the value the reader moved to.'],
      ['disabled', 'boolean', 'false', 'Blocks the whole group without hiding which option is carried.'],
    ],
    note: 'The panel behind the chosen row is sized from that row, so rows of any height work. It is placed rather than animated on the first pass and under <code>prefers-reduced-motion</code>.',
  },
  input: {
    rows: [
      ['label', 'string', 'Required', 'The field’s visible label. Always rendered: a placeholder is not a label.'],
      ['status', "'idle' | 'error' | 'success'", "'idle'", 'What the field reports back. The component never decides this.'],
      ['message', 'string', '—', 'The line under the field. Its height is held whether or not there is a message.'],
      ['…rest', 'InputHTMLAttributes', '—', 'Every other prop goes to the underlying input, including type, name, value and aria-*.'],
    ],
    note: 'The check mark is drawn inside the field’s own right-hand padding, which is reserved whether or not a mark is showing, and the message line is always in the layout: a hint appearing mid-keystroke moves neither the text nor the page.',
  },
  stepper: {
    rows: [
      ['value', 'number', 'Required', 'The number. Controlled: the stepper reports the next one and waits to be told.'],
      ['onChange', '(value: number) => void', '—', 'Called with the next number, already clamped to the range.'],
      ['min', 'number', '0', 'The bottom of the range. At it, the minus leaves and the number takes the space.'],
      ['max', 'number', '99', 'The top of the range, where the plus leaves.'],
      ['step', 'number', '1', 'How far one press moves.'],
      ['disabled', 'boolean', 'false', 'Blocks both buttons without changing the geometry.'],
      ['label', 'string', "'Quantity'", 'An accessible name for the group.'],
    ],
    note: 'The display is <code>aria-live="polite"</code>, and at either end focus moves to the button that is left rather than dropping the keyboard back onto the page.',
  },
  tabs: {
    rows: [
      ['tabs', 'MorphTab[]', 'Required', 'label and content for each tab. The label is also its key.'],
      ['defaultIndex', 'number', '0', 'Which tab starts selected. The component keeps the choice itself from there.'],
      ['label', 'string', "'Sections'", 'An accessible name for the tab list. A page with two of them needs two names.'],
      ['onSelect', '(index: number) => void', '—', 'Called when the selection changes, by pointer or by keyboard.'],
    ],
    note: 'The panel changes immediately and the pill takes 200ms: the reader asked for the tab, so the tab is there, and the pill is only the record of where they are. Arrow keys, Home and End move selection and focus together, without the slide.',
  },
  popover: {
    rows: [
      ['trigger', 'ReactElement', 'Required', 'Your own element. MorphUI attaches a ref, an onClick and the aria wiring.'],
      ['children', 'ReactNode', 'Required', 'Content rendered inside the surface.'],
      ['label', 'string', 'Required', 'An accessible name for the panel.'],
      ...sizeRows('surface'),
      ['shareWords', 'boolean', 'false', 'Fly the trigger’s words into a heading marked data-morph-words.'],
      ['panelClassName', 'string', '—', 'Classes on the surface. Use this to set its appearance.'],
      ['defaultOpen', 'boolean', 'false', 'Opens on mount. For a popover that is part of a guided first run.'],
      ...anchoredTail,
    ],
    note: 'Dismissal is an outside press, Escape, or anything wrapped in <code>MorphClose</code>. Focus is not trapped: a surface that does not cover the page has no business holding the keyboard.',
  },
  tooltip: {
    rows: [
      ['children', 'ReactElement', 'Required', 'The control the hint describes. Its own handlers are kept and added to.'],
      ['tip', 'ReactNode', 'Required', 'The hint itself. A word, or a short sentence.'],
      ['side', "'top' | 'bottom'", "'top'", 'Which side of the control the bubble sits on.'],
      ['delay', 'number', '180', 'How long the pointer must rest before the hint appears, in milliseconds. Focus is immediate.'],
    ],
    note: 'The hint is attached with <code>aria-describedby</code> while it is open, so a screen reader announces the control first and the hint after it, and never announces a hidden one.',
  },
  'context-menu': {
    rows: [
      ['trigger', 'ReactElement', 'Required', 'The element the menu belongs to. Right-click, click, long-press or Shift+F10.'],
      ['items', 'MorphMenuItem[]', 'Required', 'id, label, and optionally icon, checked, disabled and onSelect.'],
      ['label', 'string', 'Required', 'An accessible name for the menu, such as “File actions”.'],
      ...sizeRows('menu'),
      ...anchoredTail,
    ],
    note: 'Once open, the arrow keys, Home, End, Enter and first-letter movement all work. A menu that can only be driven by a pointer is a menu half the people using it cannot operate.',
  },
  combobox: {
    rows: [
      ['options', 'MorphComboboxOption[]', 'Required', 'value, label, and optionally detail and group.'],
      ['value', 'string', 'Required', 'The chosen value. The combobox is controlled: it never picks for you.'],
      ['onChange', '(value: string) => void', 'Required', 'Called when a row is chosen.'],
      ['label', 'string', '—', 'The field’s visible label.'],
      ['placeholder', 'string', "'Search…'", 'Shown while the field is empty.'],
      ['aria-label', 'string', '—', 'An accessible name for the field. Set this when there is no visible label.'],
      ...sizeRows('list'),
      ...anchoredTail,
    ],
    note: 'Typing filters. Arrow keys move and Enter chooses, Escape closes and leaves the field focused, and the arrow at the end of the field opens and closes the list for anyone using a pointer.',
  },
  'multi-select': {
    rows: [
      ['options', 'string[]', 'Required', 'Every choice the field offers, in the order they should be listed.'],
      ['value', 'string[]', 'Required', 'The chosen values. The field renders them in options order, not the order they were picked.'],
      ['onChange', '(next: string[]) => void', 'Required', 'Called with the whole selection after every change.'],
      ['label', 'string', '—', 'The field’s visible label.'],
      ['placeholder', 'string', "'Search…'", 'Shown while nothing is chosen and as the search hint.'],
      ['aria-label', 'string', '—', 'An accessible name for the search field.'],
      ...sizeRows('panel'),
      ...anchoredTail,
    ],
    note: 'Adding a chip is the field’s own change: it fades in where it belongs and its neighbours slide, rather than a copy of a row crossing the panel to become it. Backspace in an empty search removes the last chip.',
  },
  'save-button': {
    rows: [
      ['saved', 'boolean', 'Required', 'Whether the thing has been saved. The press is reported through onClick; the state is yours.'],
      ['label', 'string', "'Save changes'", 'The words before the save.'],
      ['savedLabel', 'string', "'Saved'", 'The words after it.'],
      ['icon', 'ReactNode', "'↗'", 'The mark on the face before the save.'],
      ['savedIcon', 'ReactNode', "'✓'", 'The mark on the face after it, where the evidence belongs.'],
      ['…rest', 'MorphButtonProps', '—', 'Everything a MorphButton takes: variant, size, loading, disabled, onClick and the aria attributes.'],
    ],
    note: 'The button changes width between its two faces and the width is measured from the face that is arriving, so no project has to say how wide its own words are.',
  },
  'hold-button': {
    rows: [
      ['hold', 'number', '700', 'How long the press has to be held, in milliseconds. The fill runs on the same number.'],
      ['label', 'string', "'Hold to confirm'", 'The words while the button is waiting.'],
      ['confirmedLabel', 'string', "'Confirmed · reset'", 'The words after it, which also have to say how to undo it.'],
      ['onConfirm', '() => void', '—', 'Called when the hold completes, or on a keyboard press.'],
      ['onReset', '() => void', '—', 'Called when the reader takes it back.'],
      ['…rest', 'ButtonHTMLAttributes', '—', 'Every other prop goes to the underlying button, including disabled, className and aria-*.'],
    ],
    note: 'The fill is a CSS transition on the press and the confirm is a timer on the same number, so the two cannot disagree about when the button was held long enough.',
  },
  select: {
    rows: [
      ['options', 'MorphSelectOption[]', 'Required', 'value, label, and optionally swatch — any CSS colour, drawn in the list and in the field.'],
      ['value', 'string', 'Required', 'The chosen value. Controlled.'],
      ['onChange', '(value: string) => void', 'Required', 'Called when a row is chosen. The panel closes itself.'],
      ['label', 'string', 'Required', 'The field’s words, and the panel’s heading: the two are connected, so these words travel.'],
      ['description', 'string', '—', 'A line under the heading, for what the choice is for.'],
      ['panelClassName', 'string', '—', 'Classes on the panel, for a width of your own.'],
      ['className', 'string', '—', 'Classes on the outer native dialog.'],
    ],
    note: 'This is a MorphDialog on a short panel, so the page behind it is dimmed and held still while the choice is made.',
  },
  expand: {
    rows: [
      ['actions', 'string[]', 'Required', 'The row that appears, in the order it should be offered.'],
      ['label', 'string', "'Share'", 'The words on the closed control. The chosen action replaces them.'],
      ['onSelect', '(action: string) => void', '—', 'Called with the action that was chosen.'],
      ['className', 'string', '—', 'Classes on the control.'],
    ],
    note: 'The open width is measured from the actions themselves, so a control with two short actions does not open to the width of one with four long ones.',
  },
};
