# morphui

Three morphing React primitives. A trigger is measured, the panel is inverted onto
it and played back - the FLIP technique, animated with GSAP.

```bash
pnpm add morphui gsap
```

GSAP is a peer dependency on purpose. Two copies of GSAP in one app means plugins
registered on one instance are invisible to the other, so MorphUI uses yours.

## Styles

Pick one of three setups.

**One theme, no switching.** Ships the base tokens plus Ink:

```css
@import "morphui/styles.css";
```

**A different single theme.** Base plus the one you want:

```css
@import "morphui/styles/base.css";
@import "morphui/themes/terracotta.css";
```

**Every theme, switchable at runtime.** All seven, about 1.5 KB gzipped:

```css
@import "morphui/themes/all.css";
```

### Tailwind v4

Add the bridge after the themes to get `bg-morph-surface`, `text-morph-muted`,
`rounded-morph-md`, `ease-morph-flow` and the rest:

```css
@import "tailwindcss";
@import "morphui/themes/all.css";
@import "morphui/tailwind.css";
```

The bridge uses `@theme inline`, so Tailwind emits `var()` references instead of
resolving colours at build time. Without `inline`, every utility would freeze to
whichever theme was loaded when you compiled and runtime switching would silently
do nothing.

## Theming

Two independent axes, both attributes on an ancestor — normally `<html>`:

```html
<html data-morph-theme="plum" data-morph-mode="dark">
```

| Attribute | Values | Omitted |
| --- | --- | --- |
| `data-morph-theme` | `ink` `green` `cobalt` `terracotta` `teal` `crimson` `plum` | Ink |
| `data-morph-mode` | `light` `dark` | Follows `prefers-color-scheme` |

You can set them yourself, or use the helpers:

```ts
import { setMorphTheme, setMorphMode, MORPH_THEMES } from 'morphui';

setMorphTheme('terracotta');
setMorphMode('system');
```

### Your own colours

Override four variables. Move the neutrals to the same hue as the accent, at very
low chroma — an untinted grey next to a saturated accent reads as a mistake.

```css
[data-morph-theme="acme"] {
  --morph-accent: #0F62FE;
  --morph-on-accent: #FFFFFF;
  --morph-accent-soft: #D0E2FF;
  --morph-muted: #5A6472;
}
```

## Shared elements

Mark the same name on both sides and the piece travels between them.

```jsx
<MorphDialog
  shareWords
  trigger={
    <button>
      <Clock data-morph-item="icon" />
      Create account
    </button>
  }
>
  <Clock data-morph-item="icon" />
  <h2 data-morph-words>Create account</h2>
</MorphDialog>
```

`data-morph-item` moves the real element, so icons and images work and it lands
on itself with nothing to hand over. `shareWords` flies the trigger's words into
the element marked `data-morph-words`, one stand-in per word, pairing them in
order; extra words on either side stay put.

## Motion

Every duration is `calc(<base> * var(--morph-slow))`. Set `--morph-slow: 5` to
step through a transition while you tune it:

```css
:root { --morph-slow: 5; }
```

The two opening and closing curves are `linear()` functions carried over from the
components these were built from, digit for digit. They are two-segment curves,
which a single `cubic-bezier()` cannot express.

Under `prefers-reduced-motion: reduce` the morph shortens to a 150 ms opacity
change. It never becomes no transition at all — the dialog still has to arrive.

## Status

`0.0.0`. The theme layer is done and verified. The three components are next, and
nothing is published to npm yet.

MIT © Emil Estrada
