---
title: MorphRadio
description: The choice is a panel that slides to the row you picked.
kind: radio
order: 15
---

## Usage

```jsx
<MorphRadio
  name="density"
  label="Density"
  options={[
    { value: 'comfortable', label: 'Comfortable' },
    { value: 'cosy', label: 'Cosy' },
    { value: 'compact', label: 'Compact' },
  ]}
  value={value}
  onChange={setValue}
/>
```

`name` is the group's name, so the browser keeps its own arrow-key behaviour and
a form that contains the group still reads it. `label` is the group's accessible
name; `value` is the chosen option.

## The panel

The rows sit on a raised track and the chosen one is marked by a panel behind it.
The panel is placed and sized in pixels from the row it belongs to, because the
rows are whatever your text makes them — a group whose rows are told apart by a
fixed height breaks on the first two-line option, and the panel is the only thing
saying which row is chosen.

It moves on `ease-in-out` rather than `ease-out`. This is something travelling to
a new place, not something arriving, and the difference is visible at this size:
the panel leaves and lands at the same speed instead of sprinting out of the row
it came from.

The panel is set, not animated, on the first pass and whenever the reader
prefers reduced motion. Nothing travels in from nowhere.

## Real inputs

Every option is a real radio input, visually hidden, inside its own label. Arrow
keys move the selection and change it, which is the behaviour a radio group is
expected to have and which a row of buttons with `aria-checked` would have to
reimplement.

## Disabled

A disabled group reports itself to assistive technology and takes no pointers.
The panel stays where it is: a group with no choice still shows which one is
carried, if any.
