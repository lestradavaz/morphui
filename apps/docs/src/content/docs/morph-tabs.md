---
title: MorphTabs
description: The panel changes at once, and the pill takes its own time.
kind: tabs
order: 18
---

## Usage

```jsx
<MorphTabs
  label="Component details"
  tabs={[
    { label: 'Overview', content: <p>…</p> },
    { label: 'Motion', content: <p>…</p> },
  ]}
/>
```

`tabs` is the list, each one needing a `label` — which is also its key — and its
`content`. `defaultIndex` picks where it starts, and `label` names the tab list
for anyone who cannot see it; a page with two tab lists needs two names.

## The panel is immediate, the pill is not

The reader asked for a tab, so the tab has to be there. The pill is only the
record of where they are, and it slides on the library's own on-screen curve
after the content has already changed. A panel that faded in behind a moving
pill would make every press feel slower than it is, and there is nothing to
explain: no content is appearing, it is already on the page.

## A keyboard skips the slide

Arrow keys move the selection and the focus together, and they move without the
animation. A keyboard is held down: five presses in a row would leave a pill
somewhere behind the reader, still travelling while they are reading.

Home and End go to the ends, and the default is prevented even when the arrow
leads nowhere, so Home at the first tab does not scroll the page out from under
the list.

## The pill is measured

Its position and width come from the tab it belongs to, in pixels. A pill sized
as a fraction of the bar breaks on the first two-word label, and it is the only
thing on screen saying which tab is on. A mouse press animates it; a keyboard
move places it; the first paint places it.

## Accessibility

A real `role="tablist"` with `role="tab"` buttons, `aria-selected`, and each tab
pointing at its panel with `aria-controls`. Only the selected tab is in the tab
order — the arrow keys are how the rest are reached, which is what a tab list is
expected to do — and the panel is labelled by its tab.
