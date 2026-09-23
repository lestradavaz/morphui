---
title: Installation
description: One package from npm. Your components, your styles, your project.
order: 1
---

## Before you start

MorphUI works in React projects using JavaScript or TypeScript. Install React and React DOM 18 or newer in your app. GSAP is a peer dependency, shared with the rest of your project.

Install it with the command above, in whichever package manager you use. One package, one registry — the line differs, what arrives does not.

## Add the styles

Import the package styles once, in your application entry or root layout. Ink is the default theme and follows the system appearance.

```js
import '@lestradavaz/morph-ui/styles.css';
```

For access to all seven themes, use this import instead:

```js
import '@lestradavaz/morph-ui/themes/all.css';
```

## With Tailwind CSS 4

MorphUI ships its structural CSS. Tailwind is optional for consuming the components; it gives you a convenient way to style your own triggers and content. Add the token bridge after Tailwind in your global stylesheet.

```css
@import 'tailwindcss';
@import '@lestradavaz/morph-ui/themes/all.css';
@import '@lestradavaz/morph-ui/tailwind.css';
```

You can now use utilities such as `bg-morph-accent`, `text-morph-on-accent`, and `rounded-morph-md`. The utilities read the active theme's variables at runtime.

## Your first component

Supply a button and the content it opens. Mark the heading with `data-morph-words` to connect it to the button label.

```jsx
import { MorphDialog, MorphClose } from '@lestradavaz/morph-ui';

export default function Example() {
  return (
    <MorphDialog
      shareWords
      aria-label="Create account"
      trigger={
        <button className="rounded-full bg-morph-accent px-6 py-3 text-morph-on-accent">
          Create account
        </button>
      }
    >
      <div className="p-8">
        <h2 data-morph-words className="text-3xl">Create account</h2>
        <p className="my-6">Your form goes here.</p>
        <MorphClose><button>Close</button></MorphClose>
      </div>
    </MorphDialog>
  );
}
```

This example uses Tailwind. Without Tailwind, pass your own class names and style them with CSS. The same JSX works in a `.jsx` or `.tsx` file. Types are included in the package.

## In Next.js

For the App Router, put the interactive example in a client component. Import the global CSS from your root layout. The library's packaged entry also preserves its client boundary.

```tsx
'use client';

import { MorphDialog, MorphClose } from '@lestradavaz/morph-ui';
```

Keep callbacks, state and event handlers inside the client component. You do not need to disable server rendering for the entire page.

## What is included

The package contains MorphDialog, MorphWindow, MorphCard, MorphClose, the `useMorphClose` hook, theme helpers, compiled JavaScript, TypeScript declarations, and CSS themes.

There is no installation CLI. Choose your theme with a CSS import or a data attribute, as shown in [Themes](/docs/themes).
