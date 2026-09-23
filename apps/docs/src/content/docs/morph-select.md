---
title: MorphSelect
description: The field's own words become the title of the list it opens.
kind: select
order: 21
---

## Usage

```jsx
<MorphSelect
  label="Choose a finish"
  description="Pick a color for your workspace."
  options={[{ value: 'ink', label: 'Ink', swatch: '#2f2c28' }]}
  value={value}
  onChange={setValue}
/>
```

`label` is used twice on purpose: it is the field's own words and the panel's
heading, and they are connected, so the words travel rather than a panel
appearing over a button.

`swatch` takes any CSS colour and draws a dot beside the label, in the list and
in the field. It is optional, and a select of plain names is a select.

## A list, not a menu

This is `MorphDialog` with a short panel, so the choice is made in a panel that
grew out of the field and the page behind it is dimmed and held still. A menu is
for actions that happen to the thing you right-clicked; a list of values belongs
in the surface that asked for the value.

The mark belongs to the row, not to the field: a list is read from the inside,
and the tick is where the finger is about to land. The field states the choice
again as the value it currently holds.

## Accessibility

A real button with `aria-haspopup="dialog"` and `aria-expanded`, and a panel with
a name. Focus goes into the panel when it opens, stays there while it is open,
and comes back to the field when it closes, because the panel covers the page and
a covered page has no business holding the keyboard.
