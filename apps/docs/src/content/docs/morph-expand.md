---
title: MorphExpand
description: One control that unfolds into its own actions, in place.
kind: expand
order: 22
---

## Usage

```jsx
<MorphExpand actions={['Copy link', 'Send email', 'Save']} label="Share" onSelect={run} />
```

`actions` is the row that appears, `label` is what the closed control says, and
the chosen action becomes the new label. `onSelect` reports the choice when the
caller needs to act on it.

## It lengthens rather than unfolds

The control becomes wider, not taller, and it grows out of the words that were
pressed: the same pill, opened. A row that appeared under the button would be a
second thing on the page, and the reader would have to re-find the thing they
were using before they could use it.

The open width is measured from the actions that are actually there, so a control
with two short actions does not open to the width of one with four long ones, and
nothing has to be kept in a constant in step with the labels.

## The actions follow the box

The row fades and slides in after a short delay, because the box is still growing
when it opens: actions that arrived at full opacity would be sitting in space the
control has not made yet. The icon turns a quarter and the label leaves, so the
control says which state it is in even before the actions have been read.

## Closing

Escape closes it and returns focus to the button, a press anywhere else on the
page closes it, and choosing an action closes it and puts focus back on the
button, which is where the reader's attention already is.

## Accessibility

The trigger carries `aria-expanded` and `aria-controls`, and the actions are out
of the tab order while the control is closed, so a keyboard never lands in a row
that is not on screen.
