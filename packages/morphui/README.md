# morphui

Morphing React components. A trigger is measured, the panel is inverted onto it
and played back - the FLIP technique, animated with GSAP.

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

`MorphWindow` leaves it off. Sharing hands the trigger's surface to the panel
and hides it, which is what a dialog does - so a window that shares is a dialog
with a softer blur. Turn it on when the label matters more than the trigger
staying where it is.

## Surfaces that open on a control

A dialog takes the page. These do not: they grow out of the control that opened
them, wear its fill and corners for the first beat, and leave the rest of the
page alone. They run the same Flip geometry and the same curves on a shorter
clock, and they are what `AnchoredSurface` is for.

```jsx
<MorphPopover
  label="Notification settings"
  shareWords
  trigger={
    <MorphButton variant="ghost">
      <span data-morph-words>Notification settings</span>
    </MorphButton>
  }
>
  <h3 data-morph-words>Notification settings</h3>
  <p>Choose how this workspace keeps you informed.</p>
</MorphPopover>

<MorphContextMenu
  label="File actions"
  items={[{ id: 'rename', label: 'Rename', icon: '✎', onSelect: rename }]}
  trigger={<div className="file-row" tabIndex={0}>Project brief</div>}
/>

<MorphCombobox options={workspaces} value={value} onChange={setValue} label="Workspace" />
<MorphMultiSelect options={topics} value={topics} onChange={setTopics} label="Topics" />

<MorphTooltip tip="The same curve, at every scale">
  <MorphButton variant="ghost" size="sm">Inspect motion</MorphButton>
</MorphTooltip>
```

| Component | Props that matter |
| --- | --- |
| `MorphButton` | `variant` (`pill` `ghost` `chip` `icon`), `size` (`sm` `md`), `loading`, `disabled`. |
| `MorphPopover` | `trigger`, `children`, `label`, `width`, `height`, `shareWords`. |
| `MorphContextMenu` | `trigger`, `items` (`id`, `label`, `icon`, `checked`, `disabled`, `onSelect`), `label`. |
| `MorphCombobox` | `options` (`value`, `label`, `detail`, `group`), `value`, `onChange`, `label`, `placeholder`. |
| `MorphMultiSelect` | `options` (strings), `value`, `onChange`, `label`, `placeholder`. |
| `MorphTooltip` | `tip`, `children`, `side`, `delay`. |

Each of them takes your own element as its trigger and reads it, rather than
wrapping it in one of its own: the context menu's long press is read off the
trigger itself, so nothing is added around your markup and your layout is left
where you put it.

`AnchoredSurface` is exported for the same reason. Pass it `open`, an `anchorRef`,
an `onClose` and the content, and you get the anchored morph without any of the
opinions above.

Sizing is measured once, as the surface lays itself out, and then held: a surface
that is being scaled cannot also be reflowed, so its size is fixed for as long as
it is up. Pass `width` and `height` when the content can change while the panel
is open — a filtered list, a menu whose items come and go.

## Controls

Form controls are CSS rather than GSAP, on purpose: a press is not a morph, and a
transition retargets from where the control already is while a keyframe would
start again from zero. They also work on a page that never imports a transition.

```jsx
<MorphSwitch label="Email notifications" checked={on} onChange={setOn} />
<MorphCheckbox label="Remember this device" checked={remember} onChange={setRemember} />
<MorphRadio name="plan" label="Plan" options={plans} value={plan} onChange={setPlan} />
<MorphInput label="Email address" status={status} message="Enter a valid address." />
<MorphStepper value={seats} onChange={setSeats} min={1} max={4} />
<MorphTabs label="Details" tabs={[{ label: 'Overview', content: … }]} />
```

| Component | Props that matter |
| --- | --- |
| `MorphSwitch` | `label` (the accessible name), `checked`, `onChange`, `disabled`. |
| `MorphCheckbox` | `label` (`ReactNode`), `checked`, `onChange`, `disabled`. |
| `MorphRadio` | `name`, `label`, `options` (`value`, `label`), `value`, `onChange`. |
| `MorphInput` | `label`, `status` (`idle` `error` `success`), `message`, and every input prop. |
| `MorphStepper` | `value`, `onChange`, `min`, `max`, `step`. |
| `MorphTabs` | `tabs` (`label`, `content`), `defaultIndex`, `label`. |

`MorphInput`'s status is the caller's call and never the field's: whether an
address is good enough is a policy, and the policy belongs to the application.

## Buttons that change their own size

| Component | Props that matter |
| --- | --- |
| `MorphSaveButton` | `saved`, `label`, `savedLabel`, `icon`, `savedIcon`; the press is reported through `onClick`. |
| `MorphHoldButton` | `hold`, `label`, `confirmedLabel`, `onConfirm`, `onReset`. |
| `MorphExpand` | `actions`, `label`, `onSelect`. |
| `MorphSelect` | `options` (`value`, `label`, `swatch`), `value`, `onChange`, `label`, `description`. |

Three of them grow or shrink while they are on screen, and none of them makes the
page pay for it: the save button measures the face that is arriving to know how
wide to be, the expand control measures the actions it is holding, and the
stepper hands its own room to the number when a button runs out of range.

## Props

`MorphDialog` and `MorphWindow` take a `trigger`; `MorphCard` takes `card`. Both
are your own element.

| Prop                           | Type                                   | Default    |                                                                                                                   |
| ------------------------------ | -------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `trigger` / `card`             | `ReactElement`                         | —          | Required. MorphUI adds a ref and an `onClick` and nothing else.                                                   |
| `variant`                      | `'dialog' \| 'fullscreen' \| 'window'` | `'dialog'` | `MorphWindow` and `MorphCard` set this for you.                                                                   |
| `shareWords`                   | `boolean`                              | `false`    | Sharing hands the trigger's surface over, in any component.                                                       |
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

Published on npm. The dialog, window, card, anchored, control and resize
families are all in the package, and the documentation site renders the
package's own build.

MIT © Luis Estrada
