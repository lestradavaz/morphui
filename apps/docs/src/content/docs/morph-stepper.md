---
title: MorphStepper
description: A number, and two buttons that make room for each other.
kind: stepper
order: 17
---

## Usage

```jsx
<MorphStepper label="Seats" value={seats} onChange={setSeats} min={0} max={3} />
```

`value` is controlled, `onChange` reports the next number, and `min`, `max` and
`step` are the range. `label` names the group for anyone who cannot see the
number.

## What moves, and why

Three things move and they are one movement: the display changes width, the
buttons slide out of its way, and the button that ran out of room fades out.

The alternative — leaving the buttons where they are and disabling one — reads
as a press that failed rather than as a range that has been reached, and it
leaves a gap where a control used to be. So the minus is gone at the minimum and
the plus is gone at the maximum, and the number takes the space.

At the ends the pair ride the closing curve rather than the opening one: this is
the end of a range arriving, not a new place being travelled to, and that is what
the two curves in this library are for.

## The digit

The number is swapped, not counted. The old one leaves in the direction of the
travel and the new one arrives from the other side, so a step up and a step down
look different at a glance — which is what the motion is there to say.

The outgoing number is a copy, made and removed inside the transition, so the
component never holds a digit that is no longer true. The display is
`aria-live="polite"`, so the value is announced when it changes and not before.

## Focus

At the ends, focus moves to the button that is left. The button that is about to
disappear is usually the one that was just pressed, and a keyboard user who is
dropped back onto the page body has to find their way back to the control.

## Reduced motion

Both the resize and the digit swap are skipped. The number changes and the
buttons are where they belong, which is everything the control has to say.
