import type { Ref } from 'react';

/**
 * The props a component attaches to the element you hand it as a trigger.
 *
 * Declared once, and wide enough for every overlay in the library, because
 * `cloneElement` takes a `Partial` of whatever the element's props are said to
 * be: a trigger typed to the two props one component happens to write cannot
 * also be given the aria wiring another one owes its panel.
 *
 * Every field is optional. Callers write their own element with their own class
 * and their own handler and keep it: MorphUI adds to it rather than replacing it.
 */
export interface MorphTriggerProps {
  ref?: Ref<HTMLElement>;
  onClick?: (event: MouseEvent) => void;
  onContextMenu?: (event: MouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  /* A context menu reads a long press off its trigger, so it needs the pointer
     sequence as well - and needs it on the trigger rather than on a wrapper it
     puts around it, which would change the caller's layout to add a gesture. */
  onPointerDown?: (event: PointerEvent) => void;
  onPointerMove?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  onPointerCancel?: (event: PointerEvent) => void;
  onPointerEnter?: (event: PointerEvent) => void;
  onPointerLeave?: (event: PointerEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  'aria-haspopup'?: boolean | 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid';
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-describedby'?: string;
}
