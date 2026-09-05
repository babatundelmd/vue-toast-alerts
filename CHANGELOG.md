# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-05

The first release: the Vue 3 counterpart of
[ngx-toast-alerts](https://github.com/babatundelmd/ngx-toast-alerts) 3.1.0,
matched option for option and rebuilt on the Composition API rather than
wrapped.

### Added

- **`useToast()`**, the whole API in one composable. It works inside `setup()`
  and outside it, so a Pinia store, a router guard or a plain API client can
  show a toast without being handed one.
- **`createToastAlerts()`**, an optional plugin for defaults. It also gives
  each app its own queue — which is what makes server rendering safe, where a
  module-level store would be shared between concurrent requests — registers
  `<ToastAlerts />` globally, and exposes `this.$toast` for the Options API.
- **Zero setup.** The overlay mounts itself into `<body>` on the first toast
  and the stylesheet is injected with it, so there is no component to place
  and no CSS file to import. Both are opt-out (`autoMount`, `injectStyles`),
  and `vue-toast-alerts/style.css` is shipped for anyone who would rather
  bundle it themselves.
- **Seven positions** — four corners, two edges, and a centred toast with a
  dimmed, blurred backdrop and a spring entrance. Set one globally or per
  toast; each position gets its own stack and its own entrance and exit.
- **Five types** — success, error, warning, info and pending — and three
  corner presets: `soft`, `round` and `pill`.
- **`onEvent`** reporting every show and dismissal with the type, title,
  message, position, a timestamp, a `reason` and how long the toast was on
  screen. **The library collects nothing and transmits nothing** — no network
  call, no fingerprinting, no location lookup.
- **`ToastDismissReason`** distinguishing `timeout`, `click`, `close-button`,
  `backdrop`, `programmatic` and `limit`, and `closeToast(id, reason?)` so an
  application can attribute its own dismissals.
- **`<ToastAlerts />` with a scoped `toast` slot**, for rendering toast
  contents yourself while keeping the positioned, animated shell and its
  click, hover and dismiss behaviour. Placing it stands the self-mounted
  overlay down, so toasts are never rendered twice.
- **Pause on hover**, an optional progress bar that pauses with the timer,
  a close button, `maxToasts` per position, and `title` overrides.
- **Dark mode** from `prefers-color-scheme`, and a reduced-motion path where
  `prefers-reduced-motion: reduce` replaces every entrance and exit with a
  plain opacity fade.
- **Live-region announcements** through regions that exist before any toast is
  inserted, with `ariaLive` picking the politeness per toast.
- A Vitest suite of 73 unit tests across the store, the component, the plugin
  and the self-mounting overlay, including the server-rendering paths.
- A Playwright end-to-end suite of 88 tests covering what happy-dom cannot
  see: real entrance and exit animations, settled layout geometry for all
  seven positions, the centred toast's spring and backdrop, hover pausing a
  live dismiss timer, the CSS cascade for consumer theme overrides, dark mode,
  reduced motion, keyboard dismissal and title contrast.
- `npm run verify:package`, which packs the tarball, installs it into a
  throwaway consumer outside the workspace, imports it as both ESM and CJS and
  type-checks a real consumer under `bundler` and `node16` module resolution.
- `npm run lint:tokens`, guarding the CSS theming contract: the library may
  only *read* a `--vue-toast-*` token, always with a fallback, and may never
  declare one.

### Notes

- Requires Vue 3.5 or later. Ships ESM and CJS with a single bundled `.d.ts`,
  and has no runtime dependencies.
- Events fire in the browser only, so a toast is not counted twice when a
  server-rendered page hydrates. A handler that throws is caught and logged
  rather than allowed to break rendering.
- The hover lift declared in the stylesheet does not render: the entrance
  animation is `fill: both`, so its final `transform: none` outranks
  `.vue-toast:hover`. This is inherited from ngx-toast-alerts and is kept for
  visual parity; the hover shadow still applies.

[Unreleased]: https://github.com/babatundelmd/vue-toast-alerts/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/babatundelmd/vue-toast-alerts/releases/tag/v1.0.0
