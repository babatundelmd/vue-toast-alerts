import { getCurrentInstance, inject } from 'vue';
import { toastStoreKey } from './keys';
import { createToastStore, type ToastStore } from './store';
import { ensureOverlay } from './overlay';
import type { ToastAlertsConfig } from './types';

let globalStore: ToastStore | null = null;

/**
 * The store used when no app has provided one, so `useToast()` works without
 * the plugin. Install the plugin for SSR — this one is shared between requests.
 */
export function getGlobalToastStore(): ToastStore {
  if (!globalStore) {
    globalStore = createToastStore();
    globalStore.setShowHook(() => ensureOverlay(globalStore!));
  }
  return globalStore;
}

/** Forget the fallback store. For tests. */
export function resetGlobalToastStore(): void {
  globalStore?.dispose();
  globalStore = null;
}

/** The store for the current app, falling back to the global one. Safe outside `setup()`. */
export function resolveStore(): ToastStore {
  if (getCurrentInstance()) {
    const provided = inject(toastStoreKey, null);
    if (provided) {
      return provided;
    }
  }
  return getGlobalToastStore();
}

/** Everything you can do with toasts, minus the internals. */
export type Toaster = Omit<ToastStore, 'dispose' | 'setShowHook'>;

/**
 * The toast API for the current app.
 *
 * ```ts
 * const toast = useToast();
 * toast.success('Your changes have been saved');
 * ```
 */
export function useToast(): Toaster {
  return resolveStore();
}

/** Merge new defaults into the current app's store. */
export function setToastConfig(config: ToastAlertsConfig): void {
  resolveStore().setConfig(config);
}
