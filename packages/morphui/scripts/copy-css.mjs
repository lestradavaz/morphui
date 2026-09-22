// Copies the stylesheets into dist, preserving the folder shape so the relative
// @import in themes/*.css ("../styles/base.css") keeps resolving.
import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await Promise.all([
  cp('src/styles', 'dist/styles', { recursive: true }),
  cp('src/themes', 'dist/themes', { recursive: true }),
  cp('src/styles.css', 'dist/styles.css'),
  cp('src/tailwind.css', 'dist/tailwind.css'),
]);
console.log('css -> dist');
