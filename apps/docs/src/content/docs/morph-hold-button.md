---
title: MorphHoldButton
description: The press is the animation, and it lasts exactly as long as the confirm.
kind: hold-button
order: 20
---

## Usage

```jsx
<MorphHoldButton label="Hold to delete" onConfirm={remove} onReset={restore} />
```

`hold` is how long the press has to last, in milliseconds, and it is the only
number the component needs: the fill and the confirm both run on it.

## The fill is the wait

Holding a button with no answer on screen is a guess. The fill crosses the control
at a constant rate for exactly as long as the confirm takes, so how much is left
is legible at any moment, and the reader can see that letting go was their idea.

It is a CSS transition on the press, not a keyframe and not a script. Releasing
halfway retargets the fill from wherever it had reached: pressing again in the
middle of a hold is the normal case for a control like this, not the exception,
and a keyframe would start again from nothing. The component sets
`--morph-hold-duration` from the same `hold` prop, so the fill cannot arrive at a
different moment than the confirm.

## Keyboard

A keyboard cannot hold a button in any way that means anything, so Enter and
Space confirm in one press, and the press after that takes it back. That is the
same shape as the pointer: press to confirm, press again to undo.

## When not to use it

A hold is a tax on every press, so it is worth paying only when the action is
expensive to take back. For anything reversible, a plain `MorphButton` is the
right control, and for anything that needs a sentence of warning, a dialog is.
