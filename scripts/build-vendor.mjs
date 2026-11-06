import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist/vendor', { recursive: true });
await Promise.all([
  ['node_modules/lenis/dist/lenis.mjs', 'dist/vendor/lenis.mjs'],
  ['node_modules/lenis/dist/lenis.css', 'dist/vendor/lenis.css'],
  ['node_modules/lenis/LICENSE', 'dist/vendor/Lenis-LICENSE.txt'],
].map(([from, to]) => copyFile(from, to)));
console.log('Copied the local Lenis runtime and license.');
