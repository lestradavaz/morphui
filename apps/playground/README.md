# Playground

A Vite harness for developing the components. Not published.

```bash
pnpm --filter @morphui/playground dev   # http://localhost:5180
```

`vite.config.ts` aliases `morphui` to the package **source**, not its build
output. Without that alias the playground serves a stale `dist/` and every source
change looks like it did nothing.

In dev the app puts GSAP on `window.__gsap`, so a transition can be scrubbed and
measured from the console:

```js
__gsap.globalTimeline.pause();
document.querySelector('button').click();
__gsap.globalTimeline.time(__gsap.globalTimeline.time() + 0.2, true);
```

Seeking to exactly the timeline's start rewinds the `gsap.set()` calls that stage
the panel, so the frame at offset 0 reports pre-staging values. Read the transform
matrix rather than `getBoundingClientRect()` when checking whether position and
size stay on the same curve.
