---
title: Themes
description: One system. Seven palettes. Light and dark, all the way through.
order: 2
---

## Choose a preset

For a single theme, import the base styles and your chosen palette. This sets the application's default colors.

```css
@import 'morphui/styles/base.css';
@import 'morphui/themes/plum.css';
```

To switch between all presets, import `morphui/themes/all.css` and set a theme attribute on the document or a specific preview container.

```html
<div data-morph-theme="plum" data-morph-mode="dark">
  <!-- Place your components here. -->
</div>
```

The theme names are `ink`, `green`, `cobalt`, `terracotta`, `teal`, `crimson` and `plum`. A theme sets the accent and its surrounding neutrals together.

## Light, dark and system

Set `data-morph-mode="light"` or `data-morph-mode="dark"` on the same element as the theme attribute. Omit the mode to follow `prefers-color-scheme`.

Within a nested theme scope, set its mode explicitly if it should differ from the system. A local theme preview can then stay dark while the documentation stays light.

## Change themes in React

The helpers update attributes on the document by default. Pass an element as the second argument to target a specific container.

```tsx
import { setMorphTheme, setMorphMode } from 'morphui';

// Call from an event handler or effect.
setMorphTheme('terracotta');
setMorphMode('dark');

// Follow the system again.
setMorphMode('system');
```

## Bring your own colors

Start from a preset and override semantic tokens. Keep an explicit value for the foreground on an accent so buttons remain readable.

```css
[data-morph-theme='ink'].my-brand {
  --morph-accent: #244c8b;
  --morph-on-accent: #f8faff;
  --morph-accent-soft: #e2eafa;
  --morph-on-accent-soft: #20375d;
}

[data-morph-theme='ink'].my-brand[data-morph-mode='dark'] {
  --morph-accent: #a9c8fa;
  --morph-on-accent: #152138;
  --morph-accent-soft: #23334c;
  --morph-on-accent-soft: #d7e6fc;
}
```

Use `--morph-bg`, `--morph-surface`, `--morph-panel`, `--morph-border`, `--morph-text` and `--morph-muted` to adapt the rest of the interface. Color changes do not require editing the animation engine.
