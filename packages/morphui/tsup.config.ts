import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
  // Next.js App Router needs the directive preserved on the client entry.
  banner: { js: "'use client';" },
  // Peer dependencies stay external so the host app supplies a single instance.
  // Two copies of GSAP means plugins registered on one are invisible to the other.
  external: ['react', 'react-dom', 'gsap'],
});
