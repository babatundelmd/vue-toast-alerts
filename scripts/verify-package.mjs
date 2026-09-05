/**
 * Packs the tarball, installs it into a throwaway consumer outside the
 * workspace and imports it — catching a broken `exports` map, a missing types
 * entry, an unshipped file or a wrong peer range, none of which the demo app
 * or the unit tests can see.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'vta-verify-'));

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function step(name, fn) {
  process.stdout.write(`  ${name} … `);
  try {
    fn();
    console.log('ok');
  } catch (error) {
    console.log('FAILED');
    console.error(error.stdout || error.message);
    rmSync(dir, { recursive: true, force: true });
    process.exit(1);
  }
}

console.log(`Verifying ${pkg.name}@${pkg.version} in ${dir}`);

let tarball;
step('pack', () => {
  tarball = run('npm', ['pack', root, '--pack-destination', dir]).trim().split('\n').pop();
});

step('install into a clean consumer', () => {
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'consumer', private: true, type: 'module' }, null, 2),
  );
  run('npm', ['install', join(dir, tarball), `vue@${pkg.peerDependencies.vue}`, 'typescript@5.9.3'], dir);
});

step('import as ESM', () => {
  writeFileSync(
    join(dir, 'esm.mjs'),
    `import { createToastAlerts, createToastStore, useToast, ToastAlerts } from '${pkg.name}';
     for (const [name, value] of Object.entries({ createToastAlerts, createToastStore, useToast, ToastAlerts })) {
       if (!value) throw new Error(name + ' is missing from the ESM entry');
     }
     const store = createToastStore({ position: 'center' });
     store.success('hello');
     if (store.toasts.value.length !== 1) throw new Error('store did not queue');
     if (store.getPosition() !== 'center') throw new Error('config was not applied');`,
  );
  run('node', ['esm.mjs'], dir);
});

step('require as CJS', () => {
  writeFileSync(
    join(dir, 'cjs.cjs'),
    `const m = require('${pkg.name}');
     for (const name of ['createToastAlerts', 'createToastStore', 'useToast', 'ToastAlerts']) {
       if (!m[name]) throw new Error(name + ' is missing from the CJS entry');
     }`,
  );
  run('node', ['cjs.cjs'], dir);
});

step('resolve the stylesheet subpath', () => {
  writeFileSync(
    join(dir, 'css.cjs'),
    `require.resolve('${pkg.name}/style.css');`,
  );
  run('node', ['css.cjs'], dir);
});

const consumer = `import { createToastAlerts, useToast } from '${pkg.name}';
import type { ToastEvent, ToastPosition, ToastType } from '${pkg.name}';

const position: ToastPosition = 'bottom-left';
const plugin = createToastAlerts({
  position,
  radius: 'pill',
  onEvent: (event: ToastEvent) => console.log(event.reason, event.visibleFor),
});

const toast = useToast();
const id: number = toast.success('typed');
toast.closeToast(id, 'close-button');
const type: ToastType = toast.toasts.value[0]!.type;
void plugin; void type;
`;

for (const resolution of ['bundler', 'node16']) {
  step(`type-check a consumer under moduleResolution "${resolution}"`, () => {
    writeFileSync(join(dir, 'consumer.ts'), consumer);
    writeFileSync(
      join(dir, `tsconfig.${resolution}.json`),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          target: 'ES2022',
          module: resolution === 'node16' ? 'node16' : 'ESNext',
          moduleResolution: resolution,
        },
        files: ['consumer.ts'],
      }),
    );
    run('node', ['node_modules/typescript/bin/tsc', '-p', `tsconfig.${resolution}.json`], dir);
  });
}

rmSync(dir, { recursive: true, force: true });
console.log(`\n${pkg.name}@${pkg.version} is publishable.`);
