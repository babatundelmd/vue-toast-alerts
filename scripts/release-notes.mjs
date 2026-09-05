/**
 * Extracts one version's section from CHANGELOG.md, and fails if it is
 * missing — so a release stops before publishing rather than shipping with
 * notes generated from commit titles.
 *
 * Usage: node scripts/release-notes.mjs [version] [--out FILE]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const out = outIndex === -1 ? null : args[outIndex + 1];
const requested = args.find((arg) => !arg.startsWith('--') && arg !== out);

const root = new URL('..', import.meta.url);
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('package.json', root)), 'utf8'));
const version = (requested ?? pkg.version).replace(/^v/, '');

if (version !== pkg.version) {
  console.error(
    `Version mismatch: asked for ${version} but package.json says ${pkg.version}.`,
  );
  process.exit(1);
}

const changelog = readFileSync(fileURLToPath(new URL('CHANGELOG.md', root)), 'utf8');
const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\][^\\n]*$`, 'm');
const start = changelog.search(heading);

if (start === -1) {
  console.error(
    `CHANGELOG.md has no entry for ${version}.\n` +
      `Add a "## [${version}] - YYYY-MM-DD" section before releasing.`,
  );
  process.exit(1);
}

const body = changelog.slice(start);
const nextHeading = body.slice(1).search(/^## \[/m);
const section = (nextHeading === -1 ? body : body.slice(0, nextHeading + 1))
  .split('\n')
  .slice(1)
  .join('\n')
  .trim();

if (!section) {
  console.error(`The CHANGELOG.md entry for ${version} is empty.`);
  process.exit(1);
}

if (out) {
  writeFileSync(out, section + '\n');
  console.error(`Release notes for ${version} written to ${out}`);
} else {
  process.stdout.write(section + '\n');
}
