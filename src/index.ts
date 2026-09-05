export { default as ToastAlerts } from './ToastAlerts.vue';
export { default as ToastIcon } from './ToastIcon.vue';

export { createToastAlerts, type ToastAlertsOptions } from './plugin';
export {
  useToast,
  setToastConfig,
  getGlobalToastStore,
  resetGlobalToastStore,
  resolveStore,
  type Toaster,
} from './useToast';
export { createToastStore, type ToastStore } from './store';
export { toastStoreKey } from './keys';
export {
  ensureOverlay,
  destroyOverlay,
  injectStyles,
  setAutoMount,
  setStyleInjection,
} from './overlay';

export {
  TOAST_ALERTS_DEFAULTS,
  TOAST_EXIT_DURATION,
  DEFAULT_TITLES,
  type Toast,
  type ToastAlertsConfig,
  type ToastDismissReason,
  type ToastEvent,
  type ToastEventHandler,
  type ToastPosition,
  type ToastRadius,
  type ToastType,
  type ResolvedToastConfig,
} from './types';
