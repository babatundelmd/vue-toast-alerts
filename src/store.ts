import { computed, shallowRef, type ComputedRef } from 'vue';
import {
  DEFAULT_TITLES,
  TOAST_ALERTS_DEFAULTS,
  TOAST_EXIT_DURATION,
  type ResolvedToastConfig,
  type Toast,
  type ToastAlertsConfig,
  type ToastDismissReason,
  type ToastEvent,
  type ToastPosition,
  type ToastType,
} from './types';

interface TimerState {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
  paused: boolean;
}

/** The reactive toast queue and everything that mutates it. Never touches the DOM. */
export interface ToastStore {
  /** All live toasts, newest first. */
  readonly toasts: ComputedRef<readonly Toast[]>;

  /** Live toasts grouped by the position they should render at. */
  readonly toastsByPosition: ComputedRef<Map<ToastPosition, Toast[]>>;

  /** True while at least one `center` toast wants a backdrop. */
  readonly hasBackdrop: ComputedRef<boolean>;

  /** Merge new defaults. Applies to toasts shown afterwards. */
  setConfig(config: ToastAlertsConfig): void;

  /** The currently configured defaults. */
  getConfig(): ResolvedToastConfig;

  /** The globally configured position. */
  getPosition(): ToastPosition;

  success(message: string, config?: ToastAlertsConfig): number;
  error(message: string, config?: ToastAlertsConfig): number;
  warning(message: string, config?: ToastAlertsConfig): number;
  info(message: string, config?: ToastAlertsConfig): number;
  pending(message: string, config?: ToastAlertsConfig): number;

  /** Show a toast pinned to the middle of the viewport. */
  center(message: string, type?: ToastType, config?: ToastAlertsConfig): number;

  /** Show a toast of any type. Returns the toast id. */
  show(type: ToastType, message: string, config?: ToastAlertsConfig): number;

  /** Animates the toast out, then removes it once the animation finishes. */
  closeToast(id: number, reason?: ToastDismissReason): void;

  /** Dismiss every live toast. */
  dismissAll(): void;

  /** Freeze the dismiss timer for a toast — used on pointer enter. */
  pauseToast(id: number): void;

  /** Resume a frozen dismiss timer — used on pointer leave. */
  resumeToast(id: number): void;

  /** Whether clicking the toast body dismisses it. */
  isCloseableOnClick(id: number): boolean;

  /** Drop every pending timer. */
  dispose(): void;

  /** @internal Runs before each toast is queued, so the overlay can mount lazily. */
  setShowHook(hook: (() => void) | null): void;
}

/** Build an independent toast store. One per app keeps SSR requests from sharing a queue. */
export function createToastStore(config: ToastAlertsConfig = {}): ToastStore {
  const queue = shallowRef<readonly Toast[]>([]);
  const timers = new Map<number, TimerState>();
  const exitTimers = new Set<ReturnType<typeof setTimeout>>();
  let nextId = 0;

  const isBrowser = typeof document !== 'undefined';

  let showHook: (() => void) | null = null;

  let defaultConfig: ResolvedToastConfig = {
    ...TOAST_ALERTS_DEFAULTS,
    ...config,
  };

  const toasts = computed(() => queue.value);

  const toastsByPosition = computed(() => {
    const groups = new Map<ToastPosition, Toast[]>();
    for (const toast of queue.value) {
      const bucket = groups.get(toast.config.position);
      if (bucket) {
        bucket.push(toast);
      } else {
        groups.set(toast.config.position, [toast]);
      }
    }
    return groups;
  });

  const hasBackdrop = computed(() =>
    queue.value.some(
      (toast) =>
        toast.config.position === 'center' &&
        toast.config.backdrop &&
        !toast.leaving,
    ),
  );

  // Browser only, so hydration cannot double-count a toast.
  function emit(
    toast: Toast,
    event: ToastEvent['event'],
    reason?: ToastDismissReason,
  ): void {
    const handler = toast.config.onEvent;
    if (!handler || !isBrowser) {
      return;
    }

    const payload: ToastEvent = {
      event,
      id: toast.id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      position: toast.config.position,
      at: Date.now(),
      ...(event === 'dismissed'
        ? { reason, visibleFor: Date.now() - toast.createdAt }
        : {}),
    };

    try {
      handler(payload);
    } catch (error) {
      console.error('[vue-toast-alerts] onEvent handler threw:', error);
    }
  }

  function stopTimer(id: number): void {
    const timer = timers.get(id);
    if (timer) {
      if (timer.handle !== null) {
        clearTimeout(timer.handle);
      }
      timers.delete(id);
    }
  }

  function startTimer(id: number, duration: number): void {
    stopTimer(id);
    const handle = setTimeout(() => {
      timers.delete(id);
      closeToast(id, 'timeout');
    }, duration);
    timers.set(id, {
      handle,
      remaining: duration,
      startedAt: Date.now(),
      paused: false,
    });
  }

  function shouldAutoClose(resolved: ResolvedToastConfig): boolean {
    return isBrowser && !resolved.disableTimeout && resolved.timeout > 0;
  }

  function remove(id: number): void {
    queue.value = queue.value.filter((toast) => toast.id !== id);
  }

  function enforceLimit(
    pending: readonly Toast[],
    resolved: ResolvedToastConfig,
  ): Toast[] {
    if (resolved.maxToasts <= 0) {
      return [...pending];
    }

    const seen = new Map<ToastPosition, number>();
    const kept: Toast[] = [];
    for (const toast of pending) {
      const count = seen.get(toast.config.position) ?? 0;
      if (count >= resolved.maxToasts) {
        stopTimer(toast.id);
        emit(toast, 'dismissed', 'limit');
        continue;
      }
      seen.set(toast.config.position, count + 1);
      kept.push(toast);
    }
    return kept;
  }

  function show(
    type: ToastType,
    message: string,
    overrides?: ToastAlertsConfig,
  ): number {
    showHook?.();

    const resolved: ResolvedToastConfig = { ...defaultConfig, ...overrides };
    const toast: Toast = {
      id: nextId++,
      type,
      title: resolved.title ?? DEFAULT_TITLES[type],
      message,
      config: resolved,
      leaving: false,
      createdAt: Date.now(),
    };

    queue.value = enforceLimit([toast, ...queue.value], resolved);

    if (shouldAutoClose(resolved)) {
      startTimer(toast.id, resolved.timeout);
    }

    emit(toast, 'shown');

    return toast.id;
  }

  function closeToast(
    id: number,
    reason: ToastDismissReason = 'programmatic',
  ): void {
    const closing = queue.value.find(
      (toast) => toast.id === id && !toast.leaving,
    );
    if (!closing) {
      return;
    }

    stopTimer(id);
    emit(closing, 'dismissed', reason);
    queue.value = queue.value.map((toast) =>
      toast.id === id ? { ...toast, leaving: true } : toast,
    );

    if (!isBrowser) {
      remove(id);
      return;
    }

    const handle = setTimeout(() => {
      exitTimers.delete(handle);
      remove(id);
    }, TOAST_EXIT_DURATION);
    exitTimers.add(handle);
  }

  return {
    toasts,
    toastsByPosition,
    hasBackdrop,

    setConfig(next: ToastAlertsConfig): void {
      defaultConfig = { ...defaultConfig, ...next };
    },

    getConfig: () => ({ ...defaultConfig }),

    getPosition: () => defaultConfig.position,

    success: (message, overrides) => show('success', message, overrides),
    error: (message, overrides) => show('error', message, overrides),
    warning: (message, overrides) => show('warning', message, overrides),
    info: (message, overrides) => show('info', message, overrides),
    pending: (message, overrides) => show('pending', message, overrides),

    center: (message, type = 'info', overrides) =>
      show(type, message, { ...overrides, position: 'center' }),

    show,
    closeToast,

    dismissAll(): void {
      for (const toast of queue.value) {
        closeToast(toast.id);
      }
    },

    pauseToast(id: number): void {
      const timer = timers.get(id);
      if (!timer || timer.paused) {
        return;
      }
      if (timer.handle !== null) {
        clearTimeout(timer.handle);
      }
      const elapsed = Date.now() - timer.startedAt;
      timers.set(id, {
        handle: null,
        remaining: Math.max(0, timer.remaining - elapsed),
        startedAt: timer.startedAt,
        paused: true,
      });
    },

    resumeToast(id: number): void {
      const timer = timers.get(id);
      if (!timer || !timer.paused) {
        return;
      }
      startTimer(id, timer.remaining);
    },

    isCloseableOnClick(id: number): boolean {
      const toast = queue.value.find((candidate) => candidate.id === id);
      return toast?.config.clickToClose !== false;
    },

    dispose(): void {
      for (const timer of timers.values()) {
        if (timer.handle !== null) {
          clearTimeout(timer.handle);
        }
      }
      timers.clear();
      for (const handle of exitTimers) {
        clearTimeout(handle);
      }
      exitTimers.clear();
    },

    setShowHook(hook: (() => void) | null): void {
      showHook = hook;
    },
  };
}
