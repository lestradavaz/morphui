'use client';

import type { ReactElement } from 'react';

import { MorphDialog, type MorphDialogProps } from './MorphDialog.js';

export type MorphWindowProps = Omit<MorphDialogProps, 'variant'>;

/**
 * A window growing out beside its trigger, which stays where it is and keeps
 * the way it looks. That is the whole of the difference from a dialog, where
 * the trigger hands its surface to the panel and is gone for the duration.
 *
 * Sharing anything - a marked heading, a marked image - is what hands the
 * surface over, so a window that shares is a dialog with a softer blur and a
 * different closing curve. Worth having when the label matters more than the
 * trigger staying put, which is why `shareWords` is here; not worth being the
 * default, which is what it used to be.
 */
export function MorphWindow({ shareWords = false, ...props }: MorphWindowProps): ReactElement {
  return <MorphDialog {...props} shareWords={shareWords} variant="window" />;
}
