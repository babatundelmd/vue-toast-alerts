/**
 * The stylesheet is inlined into the bundle so the library needs no setup.
 * Ship it as a file too, for anyone who would rather import it themselves
 * (`injectStyles: false`) and get it into their own CSS bundle.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const from = fileURLToPath(new URL('../src/toast.css', import.meta.url));
const to = fileURLToPath(new URL('../dist/style.css', import.meta.url));

mkdirSync(fileURLToPath(new URL('../dist', import.meta.url)), {
  recursive: true,
});
copyFileSync(from, to);
console.log('dist/style.css written');
