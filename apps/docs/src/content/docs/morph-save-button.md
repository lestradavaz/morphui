---
title: MorphSaveButton
description: The button becomes the receipt for the press.
kind: save-button
order: 19
---

## Usage

```jsx
<MorphSaveButton saved={saved} onClick={() => setSaved(true)} />
```

`saved` is yours to hold: the button reports the press through `onClick` like any
other button and waits to be told that the save happened. A button that flipped
its own state would be claiming the work was done the moment it was asked for.

`label`, `savedLabel`, `icon` and `savedIcon` are the two faces. Everything else
goes to the button underneath, which is a `MorphButton` on the pill variant: the
same press, the same ripple, the same focus ring.

## The words do not set the size

The two faces are never the same width, so one of them has to give. Here it is
the box: it changes width between them while the words cross-fade inside it, and
the faces cross in the direction of what happened, so a save and an undo do not
look like the same event.

The width comes from the face that is arriving, measured on the frame it is
committed to the document and before that frame is painted. Nothing has to be
passed in and nothing has to be kept in step with a font change.

## Why the width is animated rather than the words

A button that resized instantly and moved its own letters at the same time would
be two claims about one change. The box is the thing that changed; the words are
along for it. The opening curve goes with the promise and the closing curve with
the receipt, which is the same pair every other component in this library is
built on.

## Accessibility

The two faces are `aria-hidden`, so the button's name is not read twice, and the
press reports through `onClick` as it would on any other button. Nothing here
announces the save on its own: whether that is worth saying out loud is the
application's call, and a `role="status"` line next to it is the usual way.
