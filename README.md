# MorphUI

Three morphing React primitives built on GSAP Flip. Components that transform instead of appearing.

| Component | What it does |
| --- | --- |
| `MorphDialog` | A trigger becomes a native `<dialog>`. The trigger label can fly into the heading, and the trigger fill becomes the panel surface. |
| `MorphWindow` | No shared element. The window scales out of its origin, which stays visible, and blurs back down into it on close. |
| `MorphCard` | The image is the shared element between a card and its full-screen view. Corner radius interpolates across the transition. |

MIT licensed. Works in JavaScript and TypeScript, in React and Next.js.

## Repository layout

```
packages/morphui     the published npm package
apps/docs            the documentation site            (not built yet)
legacy/              the original vanilla HTML/CSS/JS the components came from
```

`legacy/` is kept deliberately. It is the reference implementation the motion was
tuned against, using the View Transitions API. The package reproduces that motion
with GSAP Flip so it behaves the same across browsers.

## Development

```bash
pnpm install
pnpm build          # turbo -> packages/morphui
pnpm typecheck
```

To look at the themes without any build step:

```bash
cd packages/morphui && python3 -m http.server 4173
# then open http://127.0.0.1:4173/preview/
```

## Design system

The visual language is **Atrium**, and the default theme is **Ink** — achromatic,
so the package carries no colour opinion into your app. Six other themes ship
alongside it: green, cobalt, terracotta, teal, crimson, plum.

Themes and light/dark are two independent axes, both plain CSS attributes:

```html
<html data-morph-theme="terracotta" data-morph-mode="dark">
```

Leave either one off and it falls back: no theme attribute means Ink, no mode
attribute means `prefers-color-scheme`.
