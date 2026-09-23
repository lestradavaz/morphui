# MorphUI

Morphing React components. Interfaces that transform instead of appearing.

| Component | What it does |
| --- | --- |
| `MorphDialog` | A trigger becomes a native `<dialog>`. The trigger label can fly into the heading, and the trigger fill becomes the panel surface. |
| `MorphWindow` | The window shares its label with a marked heading and returns it on close. An unshared variant keeps the trigger visible. |
| `MorphCard` | The image is the shared element between a card and its full-screen view. Corner radius interpolates across the transition. |
| `MorphButton` | Pill, ghost, chip and icon shapes, with a ripple that starts where the press landed. |
| `MorphPopover` | The control unfolds into what it controls. The page behind it stays put. |
| `MorphTooltip` | A hint on hover and on keyboard focus. Deliberately not a morph: it fades and lifts on the slide duration. |
| `MorphContextMenu` | Actions that come out of the row they act on, on right-click, click, long press or the menu key. |
| `MorphCombobox` | The field opens into the list it is choosing from, grouped, with the current choice's letter travelling between them. |
| `MorphMultiSelect` | Chosen values stay in the field as chips and the field makes room for them. |

Every surface that opens on a trigger is built on `AnchoredSurface`, which is
exported too: the dialog's morph, corner compensation and borrowed fill on a
shorter clock, for anything else that wants to be anchored.

MIT licensed. Works in JavaScript and TypeScript, in React and Next.js.

## Repository layout

```
packages/morphui     the published npm package
apps/docs            the Astro documentation site
deploy/              nginx config and start script for the container
legacy/              the original vanilla HTML/CSS/JS the components came from
```

`legacy/` is kept deliberately. It is the reference implementation the motion was
tuned against, using the View Transitions API. The package reproduces that motion
with GSAP Flip so it behaves the same across browsers.

## Development

```bash
pnpm install
pnpm build          # package, playground and documentation
pnpm typecheck
pnpm --filter @morphui/docs dev    # http://localhost:4321
pnpm test:motion
pnpm test:docs
```

To look at the themes without any build step:

```bash
cd packages/morphui && python3 -m http.server 4173
# then open http://127.0.0.1:4173/preview/
```

## Deploying

The site is static and deploys through Nixpacks. Dokploy builds it with the
phases in `nixpacks.toml` and serves the result with nginx.

```bash
pnpm build
PORT=8080 sh deploy/start.sh    # the same thing outside a container
```

Set `SITE_URL` to the absolute URL at build time, or the site ships `noindex`
and a `Disallow: /` robots file. See [deploy/README.md](deploy/README.md).

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
