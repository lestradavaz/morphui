import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

/*
 * The site imports the library from its build output, so the build has to have
 * happened before Astro reads it. It used to pack a tarball for the site to
 * hand out as well; the package is on npm now, and the installation page points
 * there instead.
 */
const packageDir = fileURLToPath(new URL('../../../packages/morphui/', import.meta.url));
execFileSync('pnpm', ['build'], { cwd: packageDir, stdio: 'inherit' });
copyFileSync(new URL('../../../LICENSE', import.meta.url), new URL('../public/license.txt', import.meta.url));
