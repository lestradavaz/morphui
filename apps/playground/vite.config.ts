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
      { find: /^morphui\/themes\/(.*)$/, replacement: src('src/themes/$1') },
      { find: /^morphui\/styles\/(.*)$/, replacement: src('src/styles/$1') },
      { find: 'morphui/styles.css', replacement: src('src/styles.css') },
      { find: 'morphui/tailwind.css', replacement: src('src/tailwind.css') },
      { find: 'morphui', replacement: src('src/index.ts') },
    ],
  },
  server: { port: 5180 },
});
