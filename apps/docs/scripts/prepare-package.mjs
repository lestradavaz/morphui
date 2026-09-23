import { mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const destination = fileURLToPath(new URL('../public/downloads/', import.meta.url));
const packageDir = fileURLToPath(new URL('../../../packages/morphui/', import.meta.url));
mkdirSync(destination, { recursive: true });
execFileSync('pnpm', ['build'], { cwd: packageDir, stdio: 'inherit' });
execFileSync('pnpm', ['pack', '--pack-destination', destination], { cwd: packageDir, stdio: 'inherit' });
copyFileSync(new URL('../../../LICENSE', import.meta.url), new URL('../public/license.txt', import.meta.url));
