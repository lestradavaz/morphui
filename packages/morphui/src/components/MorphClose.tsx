'use client';

import { cloneElement, createContext, useContext, type ReactElement } from 'react';

/*
 * Closing goes through context rather than through a callback prop so that the
 * same button works wherever it is put: inside a panel's children, inside its
 * chrome, or in a footer the page renders for an anchored surface. The panel
 * supplies the value, everything below it consumes it.
 */
export const MorphCloseContext = createContext<(() => void) | null>(null);

const noop = (): void => {};

/** Closes the panel it is called from. Returns a no-op outside a MorphUI panel. */
export function useMorphClose(): () => void {
  return useContext(MorphCloseContext) ?? noop;
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
