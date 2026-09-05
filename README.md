# vue-toast-alerts

Rounded, animated toast notifications for Vue 3 — including a centred toast
that springs out of a blur.

[![npm](https://img.shields.io/npm/v/vue-toast-alerts.svg)](https://www.npmjs.com/package/vue-toast-alerts)
[![downloads](https://img.shields.io/npm/dm/vue-toast-alerts.svg)](https://www.npmjs.com/package/vue-toast-alerts)
[![license](https://img.shields.io/npm/l/vue-toast-alerts.svg)](https://github.com/babatundelmd/vue-toast-alerts/blob/main/LICENSE)
[![CI](https://github.com/babatundelmd/vue-toast-alerts/actions/workflows/ci.yml/badge.svg)](https://github.com/babatundelmd/vue-toast-alerts/actions/workflows/ci.yml)

**[Live playground and docs →](https://babatundelmd.github.io/vue-toast-alerts/)**

The Vue counterpart of
[ngx-toast-alerts](https://github.com/babatundelmd/ngx-toast-alerts) — same
design, same options, same behaviour, rebuilt on the Composition API.

No template wiring, no stylesheet import, no web fonts. Call the composable
and show a toast — the library mounts its own overlay the first time you use
it.

## Features

- **Seven positions**, including a centred toast with a dimmed, blurred backdrop.
- **Rounded by design** — `soft`, `round` and `pill` corner presets.
- **Five types**: success, error, warning, info and pending.
- **Zero setup.** No component to place, no CSS file to import.
- **SSR-safe.** Nothing is rendered or timed on the server.
- **Themeable** through CSS custom properties, with dark mode out of the box.
- **Accessible** — live-region announcements, a labelled close button, keyboard
  focus styles, and a `prefers-reduced-motion` path.
- **Fully typed**, with a scoped slot when you want to render toasts yourself.
- **Zero runtime dependencies.**

## Installation

```bash
npm install vue-toast-alerts
```

Requires Vue 3.5 or later.

## Setup

**There is none.** Call `useToast()` anywhere and the overlay mounts itself
into `<body>` on the first toast, stylesheet included. After installing, this
is a complete integration:

```vue
<script setup lang="ts">
import { useToast } from 'vue-toast-alerts';

const toast = useToast();

function save() {
  toast.success('Your changes have been saved');
}
</script>

<template>
  <button @click="save">Save</button>
</template>
```

### Changing the defaults

Register the plugin at bootstrap:

```ts
import { createApp } from 'vue';
import { createToastAlerts } from 'vue-toast-alerts';
import App from './App.vue';

createApp(App)
  .use(
    createToastAlerts({
      timeout: 5000,
      position: 'top-right',
      radius: 'round',
    }),
  )
  .mount('#app');
```

The plugin also gives each app its own queue, registers `<ToastAlerts />`
globally, and exposes `this.$toast` for the Options API.

## Usage

```ts
const toast = useToast();

toast.success('Your changes have been saved');

const id = toast.pending('Uploading three files…', { disableTimeout: true });
await upload();
toast.closeToast(id);
toast.success('Upload complete');
```

`useToast()` works outside `setup()` too — in a Pinia store, a router guard or
a plain module — so an API client can toast its own errors.

### The centred toast

```ts
toast.center('Read the full tutorial to enhance your skills', 'pending', {
  title: 'Notifications UI design',
});
```

It dims and blurs the page behind it and animates in with a spring. Clicking
the backdrop dismisses it; pass `backdrop: false` to skip the dimming.

## API

`useToast()` returns:

| Member | Description |
| --- | --- |
| `success(message, config?)` | Green toast. Returns the toast id. |
| `error(message, config?)` | Red toast. |
| `warning(message, config?)` | Orange toast. |
| `info(message, config?)` | Neutral toast. |
| `pending(message, config?)` | Indigo toast with a spinner. |
| `center(message, type?, config?)` | Any type, pinned to the centre. |
| `show(type, message, config?)` | General entry point. |
| `closeToast(id, reason?)` | Animate one toast out and remove it. |
| `dismissAll()` | Dismiss every live toast. |
| `pauseToast(id)` / `resumeToast(id)` | Freeze and resume a dismiss timer. |
| `setConfig(config)` | Merge new defaults, for toasts shown afterwards. |
| `toasts` | Computed ref of the live toasts, newest first. |
| `toastsByPosition` | Computed ref of the live toasts grouped by position. |
| `hasBackdrop` | Computed ref — true while a centred toast wants a backdrop. |

## Events and analytics

`onEvent` tells you when a toast is shown or dismissed, and why. **The library
collects nothing and transmits nothing** — no device data, no location, no
network calls. It hands you the event; where it goes is entirely your choice.

```ts
createToastAlerts({
  onEvent: (event) => {
    analytics.track('toast', {
      type: event.type,        // 'success' | 'error' | 'warning' | 'info' | 'pending'
      reason: event.reason,    // why it went away
      visibleFor: event.visibleFor,
    });
  },
});
```

### The event

| Field | Type | Notes |
| --- | --- | --- |
| `event` | `'shown' \| 'dismissed'` | Which end of the lifecycle |
| `id` | `number` | Matches the id returned by `success()` and friends |
| `type` | `ToastType` | The toast type |
| `title` / `message` | `string` | As rendered |
| `position` | `ToastPosition` | Where it was anchored |
| `at` | `number` | `Date.now()` when it happened |
| `reason` | `ToastDismissReason` | `dismissed` only |
| `visibleFor` | `number` | Milliseconds on screen, `dismissed` only |

### Dismissal reasons

| Reason | Meaning |
| --- | --- |
| `timeout` | Expired on its own — nobody interacted |
| `click` | The toast body was clicked |
| `close-button` | The × was pressed |
| `backdrop` | The backdrop behind a centred toast was clicked |
| `programmatic` | `closeToast()` or `dismissAll()` was called |
| `limit` | Evicted because `maxToasts` was reached |

`reason` plus `visibleFor` is the useful pair: a short `visibleFor` next to
`click` means people are swatting toasts away, while `timeout` on an error
toast means nobody is reading it.

You can attribute your own dismissals too:

```ts
toast.closeToast(id, 'programmatic');
```

### Notes

- **Browser only.** Nothing is emitted during server rendering, so a toast is
  not double-counted when the page hydrates.
- **A throwing handler cannot break rendering.** Exceptions are caught and
  logged with `console.error`.
- **Usually set once**, in `createToastAlerts()`. A per-toast `onEvent`
  overrides it for that toast, which is occasionally handy for one-off tracking.

## Positions

`top-left` · `top-center` · `top-right` · `bottom-left` · `bottom-center` ·
`bottom-right` · `center`

Position can be set globally or per toast — the two mix freely, and each gets
its own stack with matching entrance and exit animations.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `timeout` | `number` | `5000` | Milliseconds before auto-dismiss. |
| `disableTimeout` | `boolean` | `false` | Keep the toast until dismissed explicitly. |
| `clickToClose` | `boolean` | `true` | Dismiss when the toast body is clicked. |
| `position` | `ToastPosition` | `'top-right'` | Where the toast is anchored. |
| `radius` | `'soft' \| 'round' \| 'pill'` | `'round'` | Corner rounding preset. |
| `showCloseButton` | `boolean` | `true` | Render the × button. |
| `pauseOnHover` | `boolean` | `true` | Freeze the timer while hovered. |
| `showProgress` | `boolean` | `false` | Draw a countdown bar. |
| `backdrop` | `boolean` | `true` | Dim the page behind a `center` toast. |
| `maxToasts` | `number` | `5` | Cap per position; oldest are dropped. |
| `title` | `string` | per type | Override the heading. |
| `ariaLive` | `'polite' \| 'assertive'` | `'polite'` | Announcement politeness. |
| `onEvent` | `(e: ToastEvent) => void` | — | Called when a toast is shown or dismissed. |

`createToastAlerts()` takes four more, which apply to the app rather than to a
toast:

| Option | Default | Description |
| --- | --- | --- |
| `autoMount` | `true` | Mount the overlay on the first toast. |
| `injectStyles` | `true` | Add the stylesheet to `<head>` at runtime. |
| `registerComponent` | `true` | Register `<ToastAlerts />` globally. |
| `globalProperty` | `true` | Expose `this.$toast`. |

## Styling

Set any custom property anywhere above the toast in the tree — `:root` is the
usual place — and it wins.

```css
:root {
  --vue-toast-surface: #ffffff;
  --vue-toast-title-color: #0d1117;
  --vue-toast-message-color: #6b7280;

  --vue-toast-radius: 20px;
  --vue-toast-icon-radius: 14px;
  --vue-toast-icon-size: 44px;
  --vue-toast-width: 400px;
  --vue-toast-offset: 24px;

  --vue-toast-success: #34c88a;
  --vue-toast-error: #e0796d;
  --vue-toast-warning: #efb265;
  --vue-toast-info: #9aa2ae;
  --vue-toast-pending: #8fa2f5;

  --vue-toast-enter-duration: 460ms;
  --vue-toast-exit-duration: 260ms;

  --vue-toast-font: 'Inter', system-ui, sans-serif;
  --vue-toast-z-index: 9999;
}
```

Every value above is a *default*, not a declaration: internally the library
reads `var(--vue-toast-radius, 20px)` and never declares `--vue-toast-radius`
itself. That is what lets a `:root` rule beat it.

Dark mode is applied automatically from `prefers-color-scheme`. Setting a
surface token pins that value in both themes; wrap overrides in your own
`@media (prefers-color-scheme: dark)` to theme each mode separately.

## Rendering toasts yourself

Place `<ToastAlerts />` in your own template and the library stands its own
overlay down. The scoped slot replaces a toast's contents; the positioned,
animated shell and its click, hover and dismiss behaviour stay.

```vue
<template>
  <ToastAlerts>
    <template #toast="{ toast, close }">
      <strong>{{ toast.title }}</strong>
      <p>{{ toast.message }}</p>
      <button @click.stop="close">Dismiss</button>
    </template>
  </ToastAlerts>
</template>
```

`<ToastAlerts />` teleports to `<body>` by default. Pass `:teleport="false"`
to render it in place, or `to="#somewhere"` to send it elsewhere.

## Server-side rendering

Toasts are a client concern: the overlay renders nothing on the server and no
timers start there, so there is nothing to hydrate and nothing to mismatch.

Install the plugin for SSR rather than relying on the zero-setup path — it
gives every request its own queue, where the fallback store is a module-level
singleton shared between them.

If you would rather the CSS came from your own bundle than a runtime `<style>`
tag, turn injection off and import the stylesheet:

```ts
import 'vue-toast-alerts/style.css';

app.use(createToastAlerts({ injectStyles: false }));
```

## Links

- [Live playground and docs](https://babatundelmd.github.io/vue-toast-alerts/)
- [ngx-toast-alerts](https://github.com/babatundelmd/ngx-toast-alerts) — the Angular original
- [Changelog](https://github.com/babatundelmd/vue-toast-alerts/blob/main/CHANGELOG.md)
- [Contributing](https://github.com/babatundelmd/vue-toast-alerts/blob/main/CONTRIBUTING.md)
- [Report an issue](https://github.com/babatundelmd/vue-toast-alerts/issues)

## License

[MIT](LICENSE) © Babatunde Lamidi
