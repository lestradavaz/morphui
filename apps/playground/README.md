# Playground

A Vite harness for developing the components. Not published.

```bash
pnpm --filter @morphui/playground dev   # http://localhost:5180
```

`vite.config.ts` aliases `morphui` to the package **source**, not its build
output. Without that alias the playground serves a stale `dist/` and every source
change looks like it did nothing.

## Motion regression checks

From the repository root:

```bash
pnpm exec playwright install chromium
pnpm test:motion
```

The checks run opening and closing on the browser's live clock, including CSS
animations. They cover shared image visibility and return, word alignment,
repeated card cycles, close-button placement and reduced motion in desktop/light
and mobile-sized/dark viewports. The server starts automatically when needed.

In development, `window.__gsap` is also available for inspection. Timeline seeking
is useful for debugging, but cannot verify the combined animation: it may skip
callbacks, rewind staging sets or leave CSS animations on a different clock.
