'use client';

import type { ReactElement } from 'react';

import { MorphDialog, type MorphDialogProps } from './MorphDialog.js';

export type MorphWindowProps = Omit<MorphDialogProps, 'variant' | 'shareWords'>;

/**
 * A window that grows out of its trigger, which stays where it is.
 *
 * Where MorphDialog hands its surface over - the trigger fades, its fill becomes
 * the panel - a window borrows nothing. It arrives out of focus and sharpens, its
 * corners round in over a longer beat, and on the way out it blurs and shrinks
 * back into a trigger that never left. Use it when the trigger is a persistent
 * control rather than something the panel replaces.
 */
export function MorphWindow(props: MorphWindowProps): ReactElement {
  return <MorphDialog {...props} variant="window" />;
}
