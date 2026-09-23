---
title: MorphMultiSelect
description: Chosen values stay in the field, and the field keeps its shape.
kind: multi-select
order: 12
---

## Usage

```jsx
<MorphMultiSelect
  options={['Animation', 'Accessibility', 'Design systems', 'React']}
  value={value}
  onChange={setValue}
  label="Topics"
  aria-label="Search topics"
/>
```

`options` is every choice the field offers, and `value` is the ones that are chosen. `onChange` receives the whole selection after every change, so the field is controlled in the same way a combobox is.

The field itself opens the list, and the button at its right opens and closes it. A press that lands on a chip belongs to that chip, so removing a value is never mistaken for opening the list.

## The order of the chips

Chips are rendered in the order `options` declares, not the order they were picked. Rendering the selection array meant a chip placed itself wherever it was clicked, so every add or remove reshuffled the field and every chip after the change moved whether or not anything about it had changed. Read from the source list instead, and a chip only ever moves because a neighbour left.

## How a chip arrives

A chip does not fly in from its row. It fades in where it belongs while its neighbours slide to make room.

A copy of the row lifted off the list, crossing the panel to dissolve where the chip was waiting, was built and rejected: the trip is longer than the panel it crosses, so what the eye reads is a second label loose on the page rather than a choice being made — and a copy of a row is not a chip, so it never quite matched the thing it became. The field owns this change.

The movement itself is GSAP Flip, never in `absolute` mode. Absolutely positioning a chip to animate it takes it out of the flow for a frame, which flashes the whole field; in flow the chips are translated and never stop being laid out.

## The chips are buttons

Each chip is a `MorphButton` on the chip variant, so the ripple, the press scale and the focus ring come from the same place every other button in the library gets them. Removing a chip is a press, and it is announced as one: the button's accessible name is `Remove <value>`, not the value alone.

## Keys

Typing filters the list, the arrow keys move and Enter toggles the active row. Backspace in an empty search removes the last chip, which is what the key is reaching for in every field of this kind.

## Sizing

The panel is measured once as it lays itself out, which is why the search row and the footer stay put while the list scrolls under them. Pass `height` if you want a fixed panel instead.
