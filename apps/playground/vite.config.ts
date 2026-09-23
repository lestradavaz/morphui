import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const src = (p: string) => fileURLToPath(new URL(`../../packages/morphui/${p}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Resolve the package to its SOURCE, not its build output. Without this the
      // playground silently serves a stale dist and every change looks like a no-op.
      { find: /^@lestradavaz\/morph-ui\/themes\/(.*)$/, replacement: src('src/themes/$1') },
      { find: /^@lestradavaz\/morph-ui\/styles\/(.*)$/, replacement: src('src/styles/$1') },
      { find: '@lestradavaz/morph-ui/styles.css', replacement: src('src/styles.css') },
      { find: '@lestradavaz/morph-ui/tailwind.css', replacement: src('src/tailwind.css') },
      { find: '@lestradavaz/morph-ui', replacement: src('src/index.ts') },
    ],
  },
  server: { port: 5180 },
});
