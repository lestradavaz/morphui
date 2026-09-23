---
title: MorphPopover
description: The control unfolds into what it controls, and the page behind it stays put.
kind: popover
order: 8
---

## Usage

The surface grows out of the trigger's own box, borrows its fill and its shadow for the first beat, and carries its contents on a transform rather than reflowing them. Nothing is tinted and nothing is made inert: a popover is the dialog's motion without the dialog's modality, which is what makes it the right shape for a control that belongs to the page rather than to a task.

```jsx
<MorphPopover label="Notification settings" trigger={<button>Notification settings</button>}>
  <h3>Notification settings</h3>
  <p>Choose how this workspace keeps you informed.</p>
</MorphPopover>
```

The trigger is your element. MorphUI attaches a ref, a click and the aria wiring — `aria-haspopup`, `aria-expanded` and `aria-controls` — and changes nothing else about how you wrote it.

## Sharing the label

Pass `shareWords`, mark the trigger's text and the panel's heading with `data-morph-words`, and the label travels out of the trigger into the heading and back again.

```jsx
<MorphPopover
  label="Notification settings"
  shareWords
  trigger={<button><span data-morph-words>Notification settings</span></button>}
>
  <h3 data-morph-words>Notification settings</h3>
</MorphPopover>
```

The trigger keeps showing its own words for the whole trip. A dialog can blank its trigger because the panel lands on top of it; a popover opens beside the control it came from, and a button whose label emptied itself while a panel opened next to it would read as a broken button rather than as a word being carried.

## Closing and focus

An outside press, Escape, or anything wrapped in `MorphClose` dismisses the surface, and closing returns focus to the trigger. Focus is not trapped while it is open: a surface that covers a corner of the page has no business holding the keyboard.

```jsx
<div className="popover-footer">
  <MorphClose><button>Done</button></MorphClose>
</div>
```

## Sizing

Leave `width` and `height` out and the surface is measured once as it lays itself out, so a short popover opens a short panel. Pass them when the content can change size while the surface is up — a surface that is being scaled cannot also be reflowed, so its size is fixed for as long as it is open.

## Styling the contents

The body carries `.morph-popover__body`, and `.morph-popover__row` and `.morph-popover__footer` are there for the usual shape of a settings panel: a labelled row with its control on the right, and a footer along the bottom edge. They are ordinary classes; use them or ignore them.
