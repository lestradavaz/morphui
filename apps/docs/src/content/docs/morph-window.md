---
title: MorphWindow
description: A focused window that remembers where it came from.
kind: window
order: 5
---

## Usage

A window grows out beside the button that opened it. The button stays where it is, keeps the way it looks, and is still there when the window closes — which is the difference between this and a dialog, where the trigger becomes the panel and is gone for the duration.

That is what the preview above shows, and it is `shareWords={false}`.

Use `panelClassName` to size the window. Its position remains centered in the viewport while its animation begins at the trigger.

## Sharing the label instead

Word sharing is on by default: mark a heading with `data-morph-words` and the trigger's label flies into it, in both directions. Sharing anything hands the trigger's surface to the window and hides it for the duration, so the window opens the way a dialog does and differs only in its blur and its closing curve. Pick it when the label matters more than the trigger staying put.

```jsx
<MorphWindow
  aria-label="More information"
  trigger={<button>More information</button>}
>
  <h2 data-morph-words>More information</h2>
  <MorphClose><button>Got it</button></MorphClose>
</MorphWindow>
```

## Closing and focus

Use MorphClose, Escape, or the backdrop. The window returns the way it came while its contents soften and close. Always provide a visible close action and an accessible dialog name.

A close button pinned to a corner goes in `chrome` instead of the children, so it keeps its own size and its corner rather than stretching with the panel and drifting as it settles. See [MorphDialog](/docs/morph-dialog).
