---
title: Motion
description: A clear origin, a connected journey, and a way back.
order: 3
---

## Keep the connection

A morph should explain where content came from. MorphUI measures the trigger and destination, then uses GSAP Flip for the panel's geometry. CSS handles the content's blur and fade. Shared words and images travel in a separate visual layer inside the native dialog.

That separation matters on close: the panel's content can blur and trail behind its container without making the shared image disappear.

## Timing

| Part | Base duration |
| --- | --- |
| Panel opening | 700 ms |
| Panel closing | 500 ms |
| Dialog surface transition | 300 ms |
| Full-screen opening corners | 1200 ms |
| Window opening corners | 1000 ms |

Opening and closing are different compositions. The dialog and card content trails behind the closing container. The window uses its own closing curve. Shared words and images stay on a continuous path.

## Inspect the movement

Use the preview's Slow motion control to inspect an opening and its return. In your project, set the multiplier on the document or on a theme container.

```css
.preview {
  --morph-slow: 5;
}
```

Apply `data-morph-theme="ink"` to that container so its CSS timing tokens resolve locally too. This is a review control, not a replacement for custom choreography. The underlying timings are currently defined by the engine.

## Shared words

Use `shareWords` on MorphDialog and mark the heading with `data-morph-words`. MorphWindow enables word sharing by default when it finds a marked heading.

Use the same words at both ends. If the trigger includes an icon or extra content, wrap only its label in a marked span. Word pairs are positional, so matching labels produce the intended transition.

```jsx
<button>
  <span data-morph-words>Create account</span>
</button>

<h2 data-morph-words>Create account</h2>
```

## Shared images and icons

Give matching elements the same `data-morph-item` value. Their visual copies travel between the measured positions while the original nodes stay in their React tree.

```jsx
// Inside the trigger
<img data-morph-item="cover" src="/cover.jpg" alt="Mountain landscape" />

// Inside the panel
<img data-morph-item="cover" src="/cover.jpg" alt="Mountain landscape" />
```

Set dimensions on both images and load the image before opening so its layout is stable. Mark the image or icon itself, rather than a container with unrelated text.

## Reduced motion

When the system requests reduced motion, the geometry transition becomes a short opacity change. Shared flights and blur animations are skipped. Keyboard Escape and backdrop dismissal still work.

During a transition, repeated open or close requests are currently ignored. Wait until the transition finishes before closing again; interruption and reversal are not part of this release.
