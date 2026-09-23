# morphui

Three morphing React primitives. A trigger is measured, the panel is inverted onto
it and played back - the FLIP technique, animated with GSAP.

```bash
npm install @lestradavaz/morph-ui gsap
pnpm add @lestradavaz/morph-ui gsap
yarn add @lestradavaz/morph-ui gsap
bun add @lestradavaz/morph-ui gsap
```

One package, published once — every manager reads the same registry.

GSAP is a peer dependency on purpose. Two copies of GSAP in one app means plugins
registered on one instance are invisible to the other, so MorphUI uses yours.

## Quick start

Import the styles once, then render a component. Each one wraps your own element
and changes nothing about it, so your classes and styles survive.

```css
@import "@lestradavaz/morph-ui/styles.css";
```

```jsx
import { MorphDialog, MorphClose } from "@lestradavaz/morph-ui";

<MorphDialog trigger={<button type="button">Create account</button>}>
  <MorphClose>
    <button type="button" aria-label="Close">
      Close
    </button>
  </MorphClose>
  <h2>Create account</h2>
  <p>Anything you like.</p>
</MorphDialog>;
```

`MorphWindow` grows out of a trigger that stays where it is. `MorphCard` opens a
card into a full-screen view around a shared image.

```jsx
<MorphWindow trigger={<button type="button">A little context</button>}>
  …
</MorphWindow>

<MorphCard card={<button type="button"><img data-morph-item="art" src="…" alt=""/></button>}>
  <img data-morph-item="art" src="…" alt=""/>
  …
</MorphCard>
```

## Closing a panel

MorphUI does not add a close button, because it does not know what your close
button should look like. Wrap yours in `MorphClose` and it closes the panel,
after calling whatever `onClick` you already had:

```jsx
<MorphClose>
  <button type="button">Done</button>
</MorphClose>
```

Anywhere deeper in the tree, use the hook:

```jsx
const close = useMorphClose();

<button type="button" onClick={close}>
  Done
</button>;
```

Escape and, unless `dismissOnTintClick={false}`, clicking the tint close it too.

A close requested while the panel is still opening is queued rather than
dropped, so a button pressed early still does something.

Put the button in `chrome` rather than in the children. Children fade in, blur
and are transformed with the panel, so a button among them arrives late,
stretches with the box and shifts as the panel settles — and on a card it is
painted under the image still in flight. `chrome` is a layer of its own, held
over the panel and above everything in it, at the button's own size:

```jsx
<MorphDialog
  chrome={<MorphClose><button type="button" className="close">×</button></MorphClose>}
  trigger={…}
>
  …
</MorphDialog>
```

Position it against the panel — `position: absolute` with your own insets, read
from the corner the viewer sees. The layer spans the panel and takes no clicks of
its own, so only the button is interactive.

It follows the panel's own beat in both directions, so it reads as arriving in
its place instead of flying there from the trigger's corner, and it is gone again
before the panel lands. It also waits for the panel to be large enough to hold
it, which is a different moment for each trigger rather than a fixed delay, so it
is never drawn crisply on top of the thing it grew out of.

## Shared elements

Mark the same name on both sides and the piece travels between them.

```jsx
<MorphDialog
  shareWords
  trigger={
    <button type="button">
      <Clock data-morph-item="icon" />
      Create account
    </button>
  }
>
  <Clock data-morph-item="icon" />
  <h2 data-morph-words>Create account</h2>
</MorphDialog>
```

`data-morph-item` takes a name that must match at both ends. It works on
anything measurable, including images. The real nodes are hidden for the length
of the flight while visual copies travel in a layer inside the dialog, so the
pair is unaffected by the panel content's blur, fade or closing lag. Both are
restored when the transition ends.

`shareWords` pairs the trigger label and a `data-morph-words` heading word by
word instead of cross-fading them whole. Use the same label at both ends, at
least the same number of words. For a trigger that also has an icon, mark its
label `data-morph-words` too so only that text is measured.

`MorphWindow` turns `shareWords` on when its heading is marked. Pass
`shareWords={false}` for the unshared window, where the trigger stays visible
and takes nothing back.

## Props

`MorphDialog` and `MorphWindow` take a `trigger`; `MorphCard` takes `card`. Both
are your own element.

| Prop                           | Type                                   | Default    |                                                                                                                   |
| ------------------------------ | -------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `trigger` / `card`             | `ReactElement`                         | —          | Required. MorphUI adds a ref and an `onClick` and nothing else.                                                   |
| `variant`                      | `'dialog' \| 'fullscreen' \| 'window'` | `'dialog'` | `MorphWindow` and `MorphCard` set this for you.                                                                   |
| `shareWords`                   | `boolean`                              | `false`    | `true` for `MorphWindow`.                                                                                         |
| `dismissOnTintClick`           | `boolean`                              | `true`     | Clicking the tint closes the panel.                                                                               |
| `chrome`                       | `ReactNode`                            | —          | Panel furniture, the close button above all. Its own layer over the panel, at its own size and corner throughout. |
| `onOpenChange`                 | `(open: boolean) => void`              | —          | Fires when the transition settles, not when it starts.                                                            |
| `className` / `panelClassName` | `string`                               | —          | On the dialog element and on the panel inside it.                                                                 |
| `aria-label`                   | `string`                               | —          | Without it, the panel is labelled by its heading.                                                                 |

## Styles

Pick one of three setups.

**One theme, no switching.** Ships the base tokens plus Ink:

```css
@import "@lestradavaz/morph-ui/styles.css";
```

**A different single theme.** Base plus the one you want:

```css
@import "@lestradavaz/morph-ui/styles/base.css";
@import "@lestradavaz/morph-ui/themes/terracotta.css";
```

**Every theme, switchable at runtime.** All seven, about 1.5 KB gzipped:

```css
@import "@lestradavaz/morph-ui/themes/all.css";
```

### Tailwind v4

Add the bridge after the themes to get `bg-morph-surface`, `text-morph-muted`,
`rounded-morph-md`, `ease-morph-flow` and the rest:

```css
@import "tailwindcss";
@import "@lestradavaz/morph-ui/themes/all.css";
@import "@lestradavaz/morph-ui/tailwind.css";
```

The bridge uses `@theme inline`, so Tailwind emits `var()` references instead of
resolving colours at build time. Without `inline`, every utility would freeze to
whichever theme was loaded when you compiled and runtime switching would silently
do nothing.

## Theming

Two independent axes, both attributes on an ancestor — normally `<html>`:

```html
<html data-morph-theme="plum" data-morph-mode="dark"></html>
```

| Attribute          | Values                                                      | Omitted                        |
| ------------------ | ----------------------------------------------------------- | ------------------------------ |
| `data-morph-theme` | `ink` `green` `cobalt` `terracotta` `teal` `crimson` `plum` | Ink                            |
| `data-morph-mode`  | `light` `dark`                                              | Follows `prefers-color-scheme` |

You can set them yourself, or use the helpers:

```ts
import {
  setMorphTheme,
  setMorphMode,
  MORPH_THEMES,
} from "@lestradavaz/morph-ui";

setMorphTheme("terracotta");
setMorphMode("system");
```

Any element with `data-morph-theme` re-resolves the material and timing tokens
for its own subtree, so a component can be themed in isolation rather than only
through the document.

### Your own colours

Override four variables. Move the neutrals to the same hue as the accent, at very
low chroma — an untinted grey next to a saturated accent reads as a mistake.

```css
[data-morph-theme="acme"] {
  --morph-accent: #0f62fe;
  --morph-on-accent: #ffffff;
  --morph-accent-soft: #d0e2ff;
  --morph-muted: #5a6472;
}
```

## Motion

Every duration is `calc(<base> * var(--morph-slow))`. Set `--morph-slow: 5` to
step through a transition while you tune it:

```css
:root {
  --morph-slow: 5;
}
```

The two opening and closing curves are `linear()` functions carried over from the
components these were built from, digit for digit. They are two-segment curves,
which a single `cubic-bezier()` cannot express.

The panel travels on transforms only, so nothing re-lays-out mid-flight, and the
content counter-scales with its corner radius divided per axis to keep the shape
from distorting.

Under `prefers-reduced-motion: reduce` the morph shortens to a 150 ms opacity
change. It never becomes no transition at all — the dialog still has to arrive.

## Status

`0.0.0`. Nothing is published to npm yet, so the install line above is what it
will be rather than what it is. The three components and the theme layer run in
the playground and in the documentation site.

MIT © Luis Estrada
