---
title: MorphDialog
description: The button becomes the dialog. The words stay with you.
kind: dialog
order: 4
---

## Usage

Pass your trigger as a single React element. Set `shareWords` and mark the panel heading with `data-morph-words` to carry the label into the dialog.

The preview below the title is the packaged component. Its example and stylesheet are shown above, ready to copy into your project.

## Closing the dialog

Wrap a button in MorphClose or use `useMorphClose()`. Escape and clicking the backdrop use the same closing transition.

```jsx
import { useMorphClose } from 'morphui';

function DoneButton() {
  const close = useMorphClose();
  return <button onClick={close}>Done</button>;
}
```

A close button in the corner belongs in `chrome`, not in the children. Children fade in, blur and are transformed with the panel, so a button among them arrives late, stretches with the box and drifts as the panel settles. `chrome` is a layer of its own, held over the panel and above everything in it — including a shared image still in flight — at the button's own size and in its corner for the whole trip.

```jsx
<MorphDialog
  chrome={<MorphClose><button className="close">×</button></MorphClose>}
  trigger={<button>Create account</button>}
>
  <h2>Create account</h2>
</MorphDialog>
```

Position it against the panel — `position: absolute` with your own insets, read from the corner the viewer sees. The layer takes no clicks of its own; only the button does. It follows the panel's own beat in both directions, so it reads as arriving in its place rather than flying there, and is gone again before the panel lands — and it waits for the panel to be large enough to hold it, so it is never drawn crisply on top of the trigger it grew out of.

## Full-screen variant

Set `variant="fullscreen"` to fill the viewport. The shared-word behavior is the same; the corners take longer to settle into the full-screen shape.

```jsx
<MorphDialog
  variant="fullscreen"
  aria-label="Details"
  chrome={<MorphClose><button>Close</button></MorphClose>}
  trigger={<button>Details</button>}
>
  <h2>Details</h2>
</MorphDialog>
```

## Accessibility

Supply a descriptive `aria-label`. The native dialog handles focus containment and Escape. Use a visible close button and explicit labels for form fields. Keep trigger and heading text identical when sharing words.
