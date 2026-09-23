---
title: MorphSwitch
description: One position or the other, and the thumb travels between them.
kind: switch
order: 13
---

## Usage

```jsx
<MorphSwitch label="Notifications" checked={on} onChange={setOn} />
```

`label` is the accessible name, and it is required. A switch is announced as a
switch and then as nothing else, so a nameless one is a control the person using
it cannot ask for. The visible text beside it is yours: give the switch an `id`,
as in the example below, and point a `<label htmlFor>` at it.

```jsx
<MorphSwitch id="notifications" label="Notifications" checked={on} onChange={setOn} />
<label htmlFor="notifications">Notifications</label>
```

## Why it is CSS and not GSAP

A switch is pressed tens of times a day, and a press is not a morph. Both the
track's color and the thumb's travel are transitions, which is what lets the
second tap of a double tap retarget from wherever the thumb already is — a
keyframe would start again from zero and the switch would visibly stutter.

It also means the switch works on a page that never imports a transition, and
keeps working while the main thread is busy opening whatever the switch turned
on.

## A button, not a checkbox

`role="switch"` on a real `<button>`, with `aria-checked` reporting the state.
The markup stays reachable and pressable the way every other control on the page
is, and the label association above keeps the text clickable.

## Press

The thumb stretches under the press instead of jumping to its new place: the
travel is what the eye is following, and a squash keeps that legible while the
finger is still down. Hover is gated behind a fine pointer, because touch fires a
false hover on the way to the tap, which here would read as the switch reacting
before it is pressed.

## Reduced motion

The thumb does not travel. Everything that carries meaning — the track changing
color, the focus ring, the press — stays.
