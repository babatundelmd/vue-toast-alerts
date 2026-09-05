import { createApp, type App } from 'vue';
import ToastAlerts from './ToastAlerts.vue';
import { autoOverlayKey, toastStoreKey } from './keys';
import type { ToastStore } from './store';
import styles from './toast.css?inline';

const STYLE_ID = 'vue-toast-alerts-styles';

interface HostState {
  auto: App<Element> | null;
  container: HTMLElement | null;
  /** `<ToastAlerts />` elements the host app renders itself. */
  manual: number;
  injectStyles: boolean;
  autoMount: boolean;
}

/** Per-store, so two apps on one page each get their own overlay. */
const hosts = new WeakMap<ToastStore, HostState>();

const isBrowser = typeof document !== 'undefined';

function stateFor(store: ToastStore): HostState {
  let state = hosts.get(store);
  if (!state) {
    state = {
      auto: null,
      container: null,
      manual: 0,
      injectStyles: true,
      autoMount: true,
    };
    hosts.set(store, state);
  }
  return state;
}

/** Put the stylesheet in `<head>` once. */
export function injectStyles(): void {
  if (!isBrowser || document.getElementById(STYLE_ID)) {
    return;
  }
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = styles;
  document.head.appendChild(tag);
}

/** Opt out of runtime style injection for a store. */
export function setStyleInjection(store: ToastStore, enabled: boolean): void {
  stateFor(store).injectStyles = enabled;
}

/** Opt out of the self-mounting overlay. Styles are still injected. */
export function setAutoMount(store: ToastStore, enabled: boolean): void {
  stateFor(store).autoMount = enabled;
}

/** Mount the overlay unless something is already rendering one. No-op on the server. */
export function ensureOverlay(store: ToastStore): void {
  const state = stateFor(store);

  if (state.injectStyles) {
    injectStyles();
  }

  if (!isBrowser || !state.autoMount || state.auto || state.manual > 0) {
    return;
  }

  const container = document.createElement('div');
  container.setAttribute('data-vue-toast-alerts', '');
  document.body.appendChild(container);

  const app = createApp(ToastAlerts, { teleport: false });
  app.provide(toastStoreKey, store);
  app.provide(autoOverlayKey, true);
  app.mount(container);

  state.auto = app;
  state.container = container;
}

export function destroyOverlay(store: ToastStore): void {
  const state = hosts.get(store);
  if (!state?.auto) {
    return;
  }

  state.auto.unmount();
  state.container?.remove();
  state.auto = null;
  state.container = null;
}

/** A `<ToastAlerts />` in the host template took over; stand our own overlay down. */
export function registerHost(store: ToastStore): void {
  const state = stateFor(store);
  state.manual += 1;
  destroyOverlay(store);
}

export function unregisterHost(store: ToastStore): void {
  const state = hosts.get(store);
  if (state) {
    state.manual = Math.max(0, state.manual - 1);
  }
}
