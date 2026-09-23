---
title: MorphWindow
description: A focused window that remembers where it came from.
kind: window
order: 5
---

## Usage

MorphWindow shares the trigger's label with a heading marked `data-morph-words`. Word sharing is enabled by default. The window preserves its own blur treatment and closing curve.

Use `panelClassName` to size the window. Its position remains centered in the viewport while its animation begins at the trigger.

## A persistent trigger

To use the original unshared variant, pass `shareWords={false}`. The trigger stays visible as the window expands from its position. With no shared elements, the window keeps its own surface.

```jsx
<MorphWindow
  shareWords={false}
  aria-label="More information"
  trigger={<button>What is this?</button>}
>
  <h2>More information</h2>
  <MorphClose><button>Got it</button></MorphClose>
</MorphWindow>
```

## Closing and focus

Use MorphClose, Escape, or the backdrop. The label follows its return path while the surrounding content softens and closes. Always provide a visible close action and an accessible dialog name.

A close button pinned to a corner goes in `chrome` instead of the children, so it keeps its own size and its corner rather than stretching with the panel and drifting as it settles. See [MorphDialog](/docs/morph-dialog).
