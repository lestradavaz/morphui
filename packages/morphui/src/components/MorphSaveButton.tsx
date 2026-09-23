'use client';

import { forwardRef, useLayoutEffect, useRef, type ReactElement, type ReactNode } from 'react';
import gsap from 'gsap';

import { EASE_FLOW, EASE_FLOW_CLOSE, registerMorphEases } from '../lib/easing.js';
import { prefersReducedMotion, slowFactor } from '../lib/measure.js';
import { MorphButton, type MorphButtonProps } from './MorphButton.js';

registerMorphEases();

/** How long the button takes to become its other size, in each direction. */
const WIDEN = 0.48;
const NARROW = 0.38;

export interface MorphSaveButtonProps extends Omit<MorphButtonProps, 'children' | 'variant'> {
  /** Whether the thing has been saved. Controlled: the button reports the press and waits. */
  saved: boolean;
  /** The two faces. */
  label?: string;
  savedLabel?: string;
  icon?: ReactNode;
  savedIcon?: ReactNode;
}

/**
 * A save button that becomes the receipt for the save.
 *
 * The two faces are never the same width, so the button changes width between
 * them rather than letting its own edges jump while the words are still
 * arriving. One thing moves here and it is the box; the words cross-fade inside
 * it.
 *
 * The width belongs to the face on its way in, measured on the frame it is
 * committed and before it paints, so nothing has to tell the component how wide
 * its own words are. Each face is in the flow while it is showing and out of it
 * while it is not, which also means the first paint - before any script has
 * run - is already the right size.
 */
export const MorphSaveButton = forwardRef<HTMLButtonElement, MorphSaveButtonProps>(function MorphSaveButton(
  { saved, label = 'Save changes', savedLabel = 'Saved', icon = '↗', savedIcon = '✓', className, ...rest },
  ref,
): ReactElement {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const saveWords = useRef<HTMLSpanElement>(null);
  const savedWords = useRef<HTMLSpanElement>(null);
  /** The width this component last wrote, which is the one to travel from. */
  const resting = useRef(0);

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const words = (saved ? savedWords : saveWords).current;
    if (!button || !words) return;

    // The face on its way in is the one in the flow, so its words still have
    // their own width, and the padding around them is the button's.
    const styles = getComputedStyle(button);
    const target = Math.ceil(words.getBoundingClientRect().width + parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight));
    if (!target) return;

    const from = resting.current;
    resting.current = target;
    gsap.killTweensOf(button);
    // The arriving face has already claimed the box's width in layout, so it is
    // pinned back to the old one first: without it there is no distance to
    // travel and the button snaps.
    if (!from || prefersReducedMotion()) {
      gsap.set(button, { width: target });
      return;
    }
    gsap.fromTo(button, { width: from }, { width: target, duration: (saved ? NARROW : WIDEN) * slowFactor(button), ease: saved ? EASE_FLOW : EASE_FLOW_CLOSE, overwrite: true });
  }, [saved]);

  return (
    <MorphButton
      ref={(node) => { buttonRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }}
      className={['morph-save-button', className].filter(Boolean).join(' ')}
      data-saved={saved}
      {...rest}
    >
      <span className="morph-save-button__face morph-save-button__face--save" aria-hidden="true">
        <span ref={saveWords} className="morph-save-button__words">{label} <span className="morph-save-button__icon">{icon}</span></span>
      </span>
      <span className="morph-save-button__face morph-save-button__face--saved" aria-hidden="true">
        <span ref={savedWords} className="morph-save-button__words">{savedLabel} <span className="morph-save-button__icon">{savedIcon}</span></span>
      </span>
    </MorphButton>
  );
});

MorphSaveButton.displayName = 'MorphSaveButton';
