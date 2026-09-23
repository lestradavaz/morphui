---
title: MorphButton
description: A press that starts where your finger landed, and a shape for every job.
kind: button
order: 7
---

## Variants

`pill` is the primary action, `ghost` the quiet one beside it, `chip` a tag or a filter, and `icon` a square for a single glyph. All four share the same press, the same hover step and the same focus ring, so a row of mixed variants still reads as one family.

```jsx
<MorphButton>Publish</MorphButton>
<MorphButton variant="ghost">Preview</MorphButton>
<MorphButton variant="chip">Draft</MorphButton>
<MorphButton variant="icon" aria-label="Add to favourites">★</MorphButton>
```

Sizes are `md` and `sm`. `sm` lowers the height and the type one step and keeps the shape, so a small pill is still a pill.

## Loading and disabled

`loading` swaps the label for a spinner in place, which is what keeps the button's width from changing at the moment it is pressed. The label blurs out and the spinner blurs in over the same duration the hover uses, so the change belongs to the same motion as everything else on the button.

```jsx
<MorphButton loading={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</MorphButton>
```

`disabled` is the native attribute and behaves as one: no hover, no press, and no ripple.

## Pressing

The ripple starts where the pointer landed rather than in the centre, because a press that comes from the middle of a wide button animates from somewhere the finger never was. Under `prefers-reduced-motion` the button keeps its colour changes, loses the scale and the ripple, and the spinner stops turning without disappearing.

## Using it as a trigger

A MorphButton is an ordinary button, so it is a perfectly good trigger for a dialog, a window or a popover: pass it as `trigger` and MorphUI attaches the ref and the click it needs.

```jsx
<MorphPopover label="Filters" trigger={<MorphButton variant="ghost">Filters</MorphButton>}>
  …
</MorphPopover>
```

One thing worth knowing: a surface borrows the fill of the control it opens from. A ghost button is transparent, so give it a background if you want the surface to open out of something visible. The demo on this page does exactly that.
