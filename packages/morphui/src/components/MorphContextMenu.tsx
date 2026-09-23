'use client';

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';

import type { MorphTriggerProps } from '../lib/trigger.js';
import { AnchoredSurface } from './AnchoredSurface.js';

export interface MorphMenuItem {
  id: string;
  label: string;
  /** A glyph or a small icon, rendered before the label. */
  icon?: ReactNode;
  /** Renders the item as a checkbox, ticked or not. */
  checked?: boolean;
  disabled?: boolean;
  onSelect?: (item: MorphMenuItem) => void;
}

export interface MorphContextMenuProps {
  /** The element the menu belongs to. Right-click, click, long-press or Shift+F10. */
  trigger: ReactElement<MorphTriggerProps>;
  items: MorphMenuItem[];
  /** An accessible name for the menu. `File actions`, `Message actions`. */
  label: string;
  /** The resting size. Left out, the menu is measured as it lays itself out. */
  width?: number;
  height?: number;
  onOpenChange?: (open: boolean) => void;
}

/** A long press, in milliseconds, before a touch opens the menu. */
const HOLD = 500;
/** How far a finger may drift before the press counts as a scroll instead. */
const DRIFT = 10;

/**
 * A menu that comes out of the row it acts on.
 *
 * Opened from a pointer, it grows out of the element it was opened on rather
 * than out of a dot beside the cursor: the row unfolding is what makes the menu
 * legible as belonging to that row, and it is the same morph the rest of the
 * library uses, on the clock a surface one row tall deserves.
 *
 * Touch is served as well as the mouse: a long press opens it, and drift
 * cancels the press so a scroll is never mistaken for a hold. Keyboard reaches
 * it through Shift+F10 or the context-menu key, and once open the arrow keys,
 * Home, End and first-letter movement all work, because a menu that can only be
 * driven by a pointer is a menu half the people using it cannot operate.
 */
export function MorphContextMenu({ trigger, items, label, width, height, onOpenChange }: MorphContextMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const holdRef = useRef<number | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  /** A long press fires a click on release; that one click is not a second open. */
  const suppressClick = useRef(false);

  const change = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const clearHold = useCallback(() => {
    if (holdRef.current !== null) window.clearTimeout(holdRef.current);
    holdRef.current = null;
  }, []);

  const show = useCallback(
    (x: number, y: number) => {
      clearHold();
      setPoint({ x, y });
      setActive(0);
      change(true);
    },
    [change, clearHold],
  );

  const close = useCallback(() => change(false), [change]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => itemRefs.current[0]?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => () => clearHold(), [clearHold]);

  const select = useCallback(
    (item: MorphMenuItem) => {
      if (item.disabled) return;
      item.onSelect?.(item);
      close();
    },
    [close],
  );

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const count = items.length;
    if (!count) return;
    const move = (next: number) => {
      event.preventDefault();
      setActive(next);
      itemRefs.current[next]?.focus();
    };
    if (event.key === 'ArrowDown') move((active + 1) % count);
    else if (event.key === 'ArrowUp') move((active - 1 + count) % count);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(count - 1);
    else if (event.key === 'Enter' || event.key === ' ') {
      const item = items[active];
      if (item) {
        event.preventDefault();
        select(item);
      }
    } else if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
      const key = event.key.toLocaleLowerCase();
      const next = items.findIndex((item) => item.label.toLocaleLowerCase().startsWith(key));
      if (next !== -1) move(next);
    }
  };

  if (!isValidElement(trigger)) {
    throw new Error('MorphContextMenu: `trigger` must be a single React element.');
  }

  /** A point inside the trigger, which is where a click-opened menu belongs. */
  const fromTrigger = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    show(rect.left + 34, rect.top + 34);
  };

  const triggerNode = cloneElement(trigger, {
    ref: (node: HTMLElement | null) => {
      anchorRef.current = node;
      const original = (trigger as { ref?: Ref<HTMLElement> }).ref;
      if (typeof original === 'function') original(node);
      else if (original && typeof original === 'object') {
        (original as { current: HTMLElement | null }).current = node;
      }
    },
    onContextMenu: (event: MouseEvent) => {
      trigger.props.onContextMenu?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      show(event.clientX, event.clientY);
    },
    onClick: (event: MouseEvent) => {
      trigger.props.onClick?.(event);
      if (event.defaultPrevented) return;
      // A long press has already opened the menu; the click it ends with is the
      // same gesture, not a second one.
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      fromTrigger(event.currentTarget as HTMLElement);
    },
    onKeyDown: (event: KeyboardEvent) => {
      trigger.props.onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const asked = event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10') || event.key === 'Enter' || event.key === ' ';
      if (!asked) return;
      event.preventDefault();
      fromTrigger(event.currentTarget as HTMLElement);
    },
    // The hold is read off the trigger itself rather than off a wrapper, which
    // would change the caller's layout to add a gesture.
    onPointerDown: (event: PointerEvent) => {
      trigger.props.onPointerDown?.(event);
      if (event.defaultPrevented || event.pointerType !== 'touch') return;
      startPoint.current = { x: event.clientX, y: event.clientY };
      holdRef.current = window.setTimeout(() => {
        suppressClick.current = true;
        show(event.clientX, event.clientY);
        // The click that ends the press arrives within a frame or two of it.
        window.setTimeout(() => {
          suppressClick.current = false;
        }, 800);
      }, HOLD);
    },
    onPointerMove: (event: PointerEvent) => {
      trigger.props.onPointerMove?.(event);
      const from = startPoint.current;
      if (!from || Math.hypot(event.clientX - from.x, event.clientY - from.y) < DRIFT) return;
      clearHold();
    },
    onPointerUp: (event: PointerEvent) => {
      trigger.props.onPointerUp?.(event);
      clearHold();
    },
    onPointerCancel: (event: PointerEvent) => {
      trigger.props.onPointerCancel?.(event);
      clearHold();
    },
    'aria-haspopup': 'menu',
    'aria-expanded': open,
  });

  return (
    <>
      {triggerNode}
      <AnchoredSurface
        open={open}
        anchorRef={anchorRef}
        point={point}
        onClose={close}
        width={width}
        height={height}
        className="morph-context-menu"
        role="menu"
        label={label}
      >
        <div className="morph-context-menu__items" onKeyDown={onMenuKeyDown}>
          {items.map((item, index) => (
            <button
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              key={item.id}
              type="button"
              role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
              aria-checked={item.checked === undefined ? undefined : item.checked}
              aria-disabled={item.disabled || undefined}
              className="morph-context-menu__item"
              data-active={active === index}
              disabled={item.disabled}
              onPointerMove={() => setActive(index)}
              onClick={() => select(item)}
            >
              {item.icon !== undefined && (
                <span className="morph-context-menu__icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
              {item.checked && (
                <span className="morph-context-menu__end" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </AnchoredSurface>
    </>
  );
}
