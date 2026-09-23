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
};
