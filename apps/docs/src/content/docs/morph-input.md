---
title: MorphInput
description: A field that says what it thinks, without moving what you are reading.
kind: input
order: 16
---

## Usage

```jsx
<MorphInput
  label="Email address"
  type="email"
  value={email}
  onChange={event => setEmail(event.target.value)}
  status={valid ? 'success' : 'error'}
  message={valid ? 'Address looks good.' : 'Enter a valid email address.'}
/>
```

`label` is required and always visible. A placeholder is not a label: it
disappears the moment there is something to read, which is the moment the reader
is least sure what the field wanted.

Every other prop goes to the underlying `input`, so `type`, `name`,
`autoComplete`, `defaultValue` and the aria attributes all work as you would
write them by hand.

## The status is yours

`status` is `'idle'`, `'error'` or `'success'`, and the component never decides
it. Whether an address is good enough is a policy, and the policy belongs to the
application — a component that validated your email field would be wrong about
somebody's address eventually, and would be wrong silently.

Error and success change the border, the check mark and the colour of the
message line. `aria-invalid` is set for an error, and the message is wired to
the field with `aria-describedby`.

## Nothing moves

The check mark is drawn inside the field's own right-hand padding, which is
reserved whether or not a mark is showing, and the message line is always in the
layout at its full height. So a hint appearing mid-keystroke does not push the
text the reader is looking at sideways or the page underneath them downwards.

The message is polite: `aria-live="polite"` announces it when it changes, and
never announces an empty line that is only holding the space.

## Disabled

`disabled` goes to the input, which is where the browser expects it: the field
stops taking input, stops being submitted, and reports itself as unavailable.
