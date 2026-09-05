# Contributing

Thanks for looking. This library mirrors
[ngx-toast-alerts](https://github.com/babatundelmd/ngx-toast-alerts), so
changes to behaviour usually belong in both.

## Getting set up

```bash
npm install
npx playwright install chromium
npm run dev
```

`npm run dev` serves the documentation site from `docs/`, which is the same
page published to GitHub Pages and installs the library exactly as a consumer
would.

## The checks

| Command | What it covers |
| --- | --- |
| `npm run lint:tokens` | The CSS theming contract — tokens are read with a fallback, never declared |
| `npm run typecheck` | `vue-tsc` over the library, docs, tests and E2E specs |
| `npm test` | Vitest — store, component, plugin and server rendering |
| `npm run test:e2e` | Playwright — animations, layout, theming and accessibility in a real browser |
| `npm run verify:package` | Packs the tarball and consumes it from outside the workspace |
| `npm run build` | The library bundle and its types |

CI runs all of them. Run at least `npm test` and `npm run typecheck` before
opening a pull request; `npm run test:e2e` too if you touched the stylesheet
or the component.

## Layout

```
src/            the library
  types.ts      public types and defaults
  store.ts      the reactive queue — no DOM
  overlay.ts    the self-mounting overlay and style injection
  useToast.ts   the composable and the fallback store
  plugin.ts     createToastAlerts()
  toast.css     the stylesheet, inlined into the bundle
docs/           the GitHub Pages site
e2e/            Playwright fixture app and specs
tests/          Vitest suites
```

The store never touches the DOM. Anything that does belongs in `overlay.ts` or
the component, which keeps the store testable and safe to construct on the
server.

## Styling

The library only ever *reads* a `--vue-toast-*` custom property, always with a
fallback, and never declares one — that is what lets a consumer's `:root` rule
win. `npm run lint:tokens` enforces it, and an end-to-end test checks it in a
real browser.

## Releasing

Releases are cut from a tag and every version needs a changelog entry:

1. Update `CHANGELOG.md` with a `## [x.y.z] - YYYY-MM-DD` section.
2. Bump `package.json` to the same version.
3. Tag `vx.y.z` and push it.

The release workflow checks that the tag, `package.json` and the changelog
agree, and fails **before** publishing if they do not. GitHub Release notes
come from the changelog section, not from commit titles.
