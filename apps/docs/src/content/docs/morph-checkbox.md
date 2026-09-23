---
title: MorphCheckbox
description: A box that fills, and a tick that draws itself.
kind: checkbox
order: 14
---

## Usage

```jsx
<MorphCheckbox label="Project updates" checked={updates} onChange={setUpdates} />
```

`label` is the text of the control, and clicking it ticks the box — it is a real
`<label>`, so it toggles the input the way a label is supposed to rather than
being clickable-looking text beside it.

The input is a real checkbox, in the tree and visually hidden. It carries the
state, the keyboard behaviour, the form participation and the label association;
the box you see is decoration drawn beside it. A `div` with `role="checkbox"`
gets none of that for free.

## The tick

An SVG polyline on `stroke-dashoffset`, which is the one CSS property that draws
a line the way a pen would. It runs on the library's own draw duration, so a tick
and a chip arriving take the beat they should relative to each other.

The box fills and its outline follows the fill in the same transition, and both
step one shade lighter on hover — gated behind a fine pointer, because touch
fires a false hover on the way to the tap.

## Keyboard and screen readers

Space toggles it, Tab reaches it, and the focus ring is drawn on the box rather
than on the input, which is out of sight. The ring follows the library: the same
2px accent outline, at the same offset as every other control.

## Disabled

`disabled` both blocks the input and takes the whole label out of the pointer's
reach, so a disabled checkbox cannot be ticked through its own text.

## Reduced motion

The tick arrives without drawing itself, and the press scale is dropped. Both
stay visible: the tick is what says the box was ticked.
