import type { App, Plugin } from 'vue';
import ToastAlerts from './ToastAlerts.vue';
import { toastStoreKey } from './keys';
import {
  destroyOverlay,
  ensureOverlay,
  setAutoMount,
  setStyleInjection,
} from './overlay';
import { createToastStore, type ToastStore } from './store';
import type { Toaster } from './useToast';
import type { ToastAlertsConfig } from './types';

export interface ToastAlertsOptions extends ToastAlertsConfig {
  /**
   * Mount the overlay into `<body>` on the first toast. Defaults to true.
   * Turn it off to place `<ToastAlerts />` in your own template instead.
   */
  autoMount?: boolean;

  /**
   * Add the stylesheet to `<head>` at runtime. Defaults to true.
   * Turn it off and `import 'vue-toast-alerts/style.css'` instead.
   */
  injectStyles?: boolean;

  /** Register `<ToastAlerts />` globally. Defaults to true. */
  registerComponent?: boolean;

  /** Expose the API on `this.$toast`. Defaults to true. */
  globalProperty?: boolean;
}

/**
 * Optional — `useToast()` works without it — but it is how you set defaults,
 * and the right way to do SSR, since each app gets its own queue.
 *
 * ```ts
 * app.use(createToastAlerts({ position: 'top-right', timeout: 5000 }));
 * ```
 */
export function createToastAlerts(options: ToastAlertsOptions = {}): Plugin {
  const {
    autoMount = true,
    injectStyles = true,
    registerComponent = true,
    globalProperty = true,
    ...config
  } = options;

  return {
    install(app: App) {
      const store: ToastStore = createToastStore(config);

      setAutoMount(store, autoMount);
      setStyleInjection(store, injectStyles);
      store.setShowHook(() => ensureOverlay(store));

      app.provide(toastStoreKey, store);

      if (registerComponent) {
        app.component('ToastAlerts', ToastAlerts);
      }

      if (globalProperty) {
        app.config.globalProperties.$toast = store as Toaster;
      }

      app.onUnmount(() => {
        destroyOverlay(store);
        store.dispose();
      });
    },
  };
}

declare module 'vue' {
  export interface ComponentCustomProperties {
    /** Available when `createToastAlerts()` is installed. */
    $toast: Toaster;
  }
}
