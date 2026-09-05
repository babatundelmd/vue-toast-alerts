import type { InjectionKey } from 'vue';
import type { ToastStore } from './store';

/** Provided by {@link createToastAlerts}; consumed by `useToast()`. */
export const toastStoreKey: InjectionKey<ToastStore> = Symbol.for(
  'vue-toast-alerts:store',
);

/** @internal True inside the overlay the library mounts for itself. */
export const autoOverlayKey: InjectionKey<boolean> = Symbol.for(
  'vue-toast-alerts:auto-overlay',
);
