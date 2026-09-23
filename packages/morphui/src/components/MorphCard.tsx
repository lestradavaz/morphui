'use client';

import type { ReactElement, ReactNode } from 'react';

import { MorphDialog, type MorphDialogProps } from './MorphDialog.js';

export interface MorphCardProps extends Omit<MorphDialogProps, 'variant' | 'shareWords' | 'trigger'> {
  /**
   * The card itself. Mark the image inside it `data-morph-item="<name>"` and mark
   * its counterpart in the panel with the same name, and the image travels rather
   * than cross-fading.
   */
  card: MorphDialogProps['trigger'];
  children: ReactNode;
}

/**
 * A card that opens into a full-screen view around a shared image.
 *
 * The panel fills the viewport, so its corners have nothing to land on and take
 * the long beat to square off, opening out of whatever radius the card had.
 */
export function MorphCard({ card, children, ...rest }: MorphCardProps): ReactElement {
  return (
    <MorphDialog {...rest} trigger={card} variant="fullscreen">
      {children}
    </MorphDialog>
  );
}
