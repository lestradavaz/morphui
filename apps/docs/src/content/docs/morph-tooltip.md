---
title: MorphTooltip
description: A quiet hint, for the pointer and for the keyboard.
kind: tooltip
order: 9
---

## Usage

Wrap the control you want to describe. The hint appears when the pointer rests on it and when it takes keyboard focus, and leaves the moment either goes away.

```jsx
<MorphTooltip tip="The same curve, at every scale">
  <MorphButton variant="ghost">Inspect motion</MorphButton>
</MorphTooltip>
```

## Why it does not morph

A tooltip is read tens of times a day and answered in a glance. The dialog's clock over a bubble this small would be an eternity, and the bubble is a caption for the control rather than something the control becomes — there is no box to grow out of and nothing to carry. It fades and lifts on the library's own slide duration and its own softening curve, which is what keeps it in the same family without pretending to be the same motion.

Anything opened a hundred times a day should not animate at all; anything opened a few times a day should be nearly imperceptible. A tooltip is the second case, and the whole transition is 200ms.

## Side and delay

`side` puts the bubble above the control by default, or below it with `side="bottom"` for a control near the top of the page. `delay` is how long the pointer must rest before the hint appears — 180ms by default, and it does not apply to focus, which is immediate because a keyboard user has already made the decision.

```jsx
<MorphTooltip side="bottom" delay={300} tip="Focus reveals this hint too">
  <button>Keyboard focus</button>
</MorphTooltip>
```

## Accessibility

The hint is attached with `aria-describedby` while it is open, so a screen reader announces the control first and the hint after it, and never announces a hidden one. The bubble itself is `role="tooltip"`.

A hint is a description, not a name: never move a control's only label into a tooltip. If the control has no visible text, it needs an `aria-label` of its own.
