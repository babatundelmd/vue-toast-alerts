/**
 * Guards the theming contract: the library must only ever *read* a public
 * `--vue-toast-*` token, with a fallback, and never declare one. Declaring it
 * would outrank a consumer's `:root` rule and silently drop their override.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const path = fileURLToPath(new URL('../src/toast.css', import.meta.url));
const css = readFileSync(path, 'utf8');

const failures = [];

const declaration = /^\s*(--vue-toast-[a-z0-9-]+)\s*:/gm;
for (const match of css.matchAll(declaration)) {
  const line = css.slice(0, match.index).split('\n').length;
  failures.push(`src/toast.css:${line} declares ${match[1]} — read it with var() instead`);
}

const read = /var\(\s*(--vue-toast-[a-z0-9-]+)\s*([,)])/g;
for (const match of css.matchAll(read)) {
  if (match[2] === ')') {
    const line = css.slice(0, match.index).split('\n').length;
    failures.push(`src/toast.css:${line} reads ${match[1]} with no fallback`);
  }
}

const privates = new Set([...css.matchAll(/(--_[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
for (const match of css.matchAll(/var\(\s*(--_[a-z0-9-]+)/g)) {
  if (!privates.has(match[1]) && match[1] !== '--_accent') {
    const line = css.slice(0, match.index).split('\n').length;
    failures.push(`src/toast.css:${line} reads undefined private token ${match[1]}`);
  }
}

if (failures.length) {
  console.error('Token contract violations:\n' + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}

const tokens = new Set([...css.matchAll(read)].map((m) => m[1]));
console.log(`Token contract clean — ${tokens.size} public tokens, all read with fallbacks.`);
