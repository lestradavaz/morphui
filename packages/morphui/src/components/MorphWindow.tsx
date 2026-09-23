'use client';

import type { ReactElement } from 'react';

import { MorphDialog, type MorphDialogProps } from './MorphDialog.js';

export type MorphWindowProps = Omit<MorphDialogProps, 'variant'>;

/**
 * A window growing from its trigger, with the window's blur and closing curve.
 * Mark a heading with `data-morph-words` to share its label in both directions.
 * Set `shareWords={false}` for the original unshared, persistent-trigger variant.
 */
export function MorphWindow({ shareWords = true, ...props }: MorphWindowProps): ReactElement {
  return <MorphDialog {...props} shareWords={shareWords} variant="window" />;
}
