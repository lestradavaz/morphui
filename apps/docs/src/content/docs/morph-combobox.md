---
title: MorphCombobox
description: The field opens into the list it is choosing from.
kind: combobox
order: 11
---

## Usage

The list is the dialog's morph at one trigger's scale: it grows out of the field, wears the field's fill and corners for the first beat, and carries its rows on a transform rather than reflowing them, so they travel with the box instead of appearing inside it.

```jsx
<MorphCombobox
  options={[
    { value: 'studio', label: 'Design studio', detail: '12 projects', group: 'Recent' },
    { value: 'sandbox', label: 'Sandbox', detail: '24 experiments', group: 'All workspaces' },
  ]}
  value={value}
  onChange={setValue}
  label="Workspace"
  aria-label="Search workspaces"
/>
```

It is a controlled field: it reports the choice and never picks one for you.

## Options and groups

Each option needs a `value` and a `label`. `detail` is a second line under the label and is searched along with it. `group` files options under a shared heading, rendered in the order the groups first appear — so the same list can be sorted by recency without the markup saying anything about it.

## The travelling mark

The first letter of the current choice is drawn in the field and again on the row it belongs to, both marked `data-morph-item="mark"`. On open, a copy of it flies from the field to the row; on close it flies home. The field keeps showing its own letter for the whole trip, because the field is still on screen next to the list.

## Typing, keys and the arrow

Typing filters the list. The arrow keys move the active row and Enter chooses it. Opening with the arrow keys, or by clicking the field, clears the query and starts again from the top.

Escape closes the list and leaves the field focused. The arrow at the right of the field is a button, not decoration: it opens and closes the list for anyone using a pointer.

## Sizing

Left out, the size is measured from the options the list was opened with, so three options open a short panel. Pass `width` and `height` when the list is long enough to need its own scroll, or when it changes size while it is open: a surface that is being scaled cannot also be reflowed, so its size is fixed for as long as it is up.
