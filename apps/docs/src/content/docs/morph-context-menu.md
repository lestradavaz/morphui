---
title: MorphContextMenu
description: Actions that come out of the row they act on.
kind: context-menu
order: 10
---

## Usage

Pass the element the menu belongs to, and the items it offers. The menu grows out of that element rather than out of the cursor: the row unfolding is what makes the menu legible as belonging to it, and a panel pasted beside a pointer belongs to nothing.

```jsx
<MorphContextMenu
  label="File actions"
  items={[
    { id: 'rename', label: 'Rename', icon: '✎', onSelect: rename },
    { id: 'duplicate', label: 'Duplicate', icon: '▣', onSelect: duplicate },
    { id: 'favourite', label: 'Favourite', icon: '★', checked: favourite, onSelect: toggleFavourite },
  ]}
  trigger={<div className="file-row" tabIndex={0}>Project brief</div>}
/>
```

A click on the trigger opens the menu too, at a point inside it, so the same element works as a menu button.

## Opening it

Right-click, a click, a long press on touch, or Shift+F10 and the context-menu key. A long press is read off the trigger itself, so nothing is wrapped around your element and your layout is left alone. Drift of more than ten pixels cancels the press, which is what stops a scroll from being mistaken for a hold.

The trigger needs to be reachable by keyboard — `tabIndex={0}` on a `div`, or a real `button` — and it gets `aria-haspopup="menu"` and `aria-expanded` from the component.

## Items

`checked` turns an item into a checkbox: it is rendered with `role="menuitemcheckbox"` and a tick, and `aria-checked` reports its state. `disabled` blocks selection and reports it. `icon` is a glyph or a small element, drawn before the label.

```jsx
{ id: 'favourite', label: favourite ? 'Favourite' : 'Add to favourites', checked: favourite, onSelect: toggle }
```

`onSelect` runs before the menu closes, so a handler that changes the page and one that changes the menu's own state work the same way.

## Keyboard

Once open, the arrow keys move through the items, Home and End go to the ends, Enter chooses, and typing a letter moves to the first item that starts with it. Focus moves with the selection, and the item in focus is the item that looks active — a menu where the highlight and the focus disagree is a menu that lies to the person using it.

Escape closes and returns focus to the trigger. A menu that can only be driven by a pointer is a menu half the people using it cannot operate.
