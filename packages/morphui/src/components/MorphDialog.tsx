'use client';

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';

import { closeMorph, openMorph, type MorphParts, type MorphVariant } from '../lib/morph-engine.js';

const MorphCloseContext = createContext<(() => void) | null>(null);

/** Closes the panel it is called from. Returns a no-op outside a MorphUI panel. */
export function useMorphClose(): () => void {
  return useContext(MorphCloseContext) ?? noop;
}

const noop = (): void => {};

export interface MorphDialogProps {
  /**
   * Your own element, rendered exactly as you wrote it. MorphUI attaches a ref
   * and an onClick and changes nothing else, so your classes and styles survive.
   */
  trigger: ReactElement<{ ref?: Ref<HTMLElement>; onClick?: (e: MouseEvent) => void }>;
  children: ReactNode;
  /**
   * Fly the trigger's words into the panel heading instead of cross-fading them.
   * Mark the heading with `data-morph-words`.
   */
  shareWords?: boolean;
  /**
   * `dialog` keeps a centred panel and hands the trigger's surface over to it.
   * `fullscreen` fills the viewport. `window` grows out of a trigger that stays
   * put when there is no shared content. Marked words or items connect the
   * trigger to the window in both directions.
   *
   * MorphWindow and MorphCard are this component with a variant already chosen.
   */
  variant?: MorphVariant;
  /** Clicking the tint closes the panel. */
  dismissOnTintClick?: boolean;
  className?: string;
  panelClassName?: string;
  'aria-label'?: string;
  onOpenChange?: (open: boolean) => void;
}

export function MorphDialog({
  trigger,
  children,
  shareWords = false,
  variant = 'dialog',
  dismissOnTintClick = true,
  className,
  panelClassName,
  onOpenChange,
  ...rest
}: MorphDialogProps): ReactElement {
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const tintRef = useRef<HTMLDivElement | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const pendingClose = useRef(false);
  const [mounted, setMounted] = useState(false);
  const labelId = useId();

  useEffect(() => setMounted(true), []);

  const parts = useCallback((): MorphParts | null => {
    const trigger = triggerRef.current;
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const content = contentRef.current;
    const tint = tintRef.current;
    if (!trigger || !dialog || !panel || !content || !tint) return null;
    return { trigger, dialog, panel, content, tint };
  }, []);

  const config = useCallback(() => ({ variant, shareWords }), [shareWords, variant]);

  // An open request that arrives mid-transition is dropped, but a close request
  // is queued instead: the user asked for the panel to go away, and swallowing
  // that click leaves them pressing a button that does nothing.
  const open = useCallback(async () => {
    const p = parts();
    if (!p || inFlight.current || p.dialog.open) return;
    const run = (async () => {
      onOpenChange?.(true);
      await openMorph(p, config());
    })();
    inFlight.current = run;
    try {
      await run;
    } finally {
      inFlight.current = null;
    }
  }, [config, onOpenChange, parts]);

  const close = useCallback(async () => {
    const p = parts();
    if (!p || !p.dialog.open) return;
    if (inFlight.current) {
      if (pendingClose.current) return;
      pendingClose.current = true;
      await inFlight.current.catch(() => {});
      pendingClose.current = false;
    }
    if (!p.dialog.open) return;
    const run = closeMorph(p, config());
    inFlight.current = run;
    try {
      await run;
    } finally {
      inFlight.current = null;
      onOpenChange?.(false);
    }
  }, [config, onOpenChange, parts]);

  // Escape reaches the dialog as `cancel`. The default would close it instantly,
  // skipping the morph, so it is prevented and routed through the same path.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onCancel = (event: Event): void => {
      event.preventDefault();
      void close();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [close]);

  if (!isValidElement(trigger)) {
    throw new Error('MorphDialog: `trigger` must be a single React element.');
  }

  const triggerNode = cloneElement(trigger, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const original = (trigger as { ref?: Ref<HTMLElement> }).ref;
      if (typeof original === 'function') original(node);
      else if (original && typeof original === 'object') {
        (original as { current: HTMLElement | null }).current = node;
      }
    },
    onClick: (event: MouseEvent) => {
      trigger.props.onClick?.(event);
      if (!event.defaultPrevented) void open();
    },
  });

  return (
    <MorphCloseContext.Provider value={close}>
      {triggerNode}
      <dialog
        ref={dialogRef}
        className={['morph-dialog', className].filter(Boolean).join(' ')}
        data-morph-variant={variant}
        aria-labelledby={rest['aria-label'] ? undefined : labelId}
        aria-label={rest['aria-label']}
        onClick={(event) => {
          if (!dismissOnTintClick) return;
          if (event.target === dialogRef.current || event.target === tintRef.current) void close();
        }}
      >
        <div ref={tintRef} className="morph-tint" aria-hidden="true" />
        <div
          ref={panelRef}
          className={['morph-panel', panelClassName].filter(Boolean).join(' ')}
        >
          <div ref={contentRef} className="morph-panel-content">
            {mounted ? children : null}
          </div>
        </div>
      </dialog>
    </MorphCloseContext.Provider>
  );
}

export interface MorphCloseProps {
  children: ReactElement<{ onClick?: (e: MouseEvent) => void }>;
}

/** Wraps your own button and closes the panel when it is pressed. */
export function MorphClose({ children }: MorphCloseProps): ReactElement {
  const close = useMorphClose();
  return cloneElement(children, {
    onClick: (event: MouseEvent) => {
      children.props.onClick?.(event);
      if (!event.defaultPrevented) close();
    },
  });
}
