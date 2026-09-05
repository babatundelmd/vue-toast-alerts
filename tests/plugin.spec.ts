import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
import ToastAlerts from '../src/ToastAlerts.vue';
import { createToastAlerts } from '../src/plugin';
import { getGlobalToastStore, resetGlobalToastStore, useToast } from '../src/useToast';
import { destroyOverlay } from '../src/overlay';
import type { ToastStore } from '../src/store';

function mountApp(component: ReturnType<typeof defineComponent>, plugin?: ReturnType<typeof createToastAlerts>) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = createApp(component);
  if (plugin) {
    app.use(plugin);
  }
  const vm = app.mount(host);
  return { app, host, vm };
}

const blank = defineComponent({ render: () => h('div') });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  destroyOverlay(getGlobalToastStore());
  resetGlobalToastStore();
  document.body.innerHTML = '';
  document.getElementById('vue-toast-alerts-styles')?.remove();
  vi.useRealTimers();
});

describe('createToastAlerts', () => {
  it('provides a store that useToast() picks up in setup', () => {
    let toast: ReturnType<typeof useToast> | null = null;
    const component = defineComponent({
      setup() {
        toast = useToast();
        return () => h('div');
      },
    });

    const { app } = mountApp(component, createToastAlerts({ position: 'center' }));

    expect(toast!.getPosition()).toBe('center');
    expect(toast).not.toBe(getGlobalToastStore());
    app.unmount();
  });

  it('applies its config as the store defaults', () => {
    let toast: ReturnType<typeof useToast> | null = null;
    const component = defineComponent({
      setup() {
        toast = useToast();
        return () => h('div');
      },
    });

    const { app } = mountApp(
      component,
      createToastAlerts({ timeout: 1234, radius: 'pill', maxToasts: 2 }),
    );

    toast!.success('a');
    const config = toast!.toasts.value[0]!.config;
    expect(config).toMatchObject({ timeout: 1234, radius: 'pill', maxToasts: 2 });
    app.unmount();
  });

  it('exposes $toast and registers the component', () => {
    const { app, vm } = mountApp(blank, createToastAlerts());

    expect(typeof vm.$toast.success).toBe('function');
    expect(app._context.components.ToastAlerts).toBeDefined();
    app.unmount();
  });

  it('honours registerComponent and globalProperty being off', () => {
    const { app, vm } = mountApp(
      blank,
      createToastAlerts({ registerComponent: false, globalProperty: false }),
    );

    expect(app._context.components.ToastAlerts).toBeUndefined();
    expect(vm.$toast).toBeUndefined();
    app.unmount();
  });

  it('gives each app its own queue', () => {
    const stores: ToastStore[] = [];
    const component = defineComponent({
      setup() {
        stores.push(useToast() as ToastStore);
        return () => h('div');
      },
    });

    const a = mountApp(component, createToastAlerts());
    const b = mountApp(component, createToastAlerts());

    stores[0]!.success('only mine', { disableTimeout: true });

    expect(stores[0]!.toasts.value).toHaveLength(1);
    expect(stores[1]!.toasts.value).toHaveLength(0);

    a.app.unmount();
    b.app.unmount();
  });

  it('drops timers when the app unmounts', () => {
    let toast: ToastStore | null = null;
    const component = defineComponent({
      setup() {
        toast = useToast() as ToastStore;
        return () => h('div');
      },
    });

    const { app } = mountApp(component, createToastAlerts());
    toast!.success('a', { timeout: 1000 });
    app.unmount();

    vi.advanceTimersByTime(5000);
    expect(toast!.toasts.value[0]!.leaving).toBe(false);
  });
});

describe('useToast without the plugin', () => {
  it('falls back to a shared global store', () => {
    const outside = useToast();
    let inside: ReturnType<typeof useToast> | null = null;

    const component = defineComponent({
      setup() {
        inside = useToast();
        return () => h('div');
      },
    });
    const { app } = mountApp(component);

    expect(inside).toBe(outside);
    expect(inside).toBe(getGlobalToastStore());
    app.unmount();
  });
});

describe('the self-mounting overlay', () => {
  it('does nothing until the first toast', async () => {
    const toast = useToast();
    expect(document.querySelector('[data-vue-toast-alerts]')).toBeNull();

    toast.success('a', { disableTimeout: true });
    await nextTick();

    const overlay = document.querySelector('[data-vue-toast-alerts]');
    expect(overlay).not.toBeNull();
    expect(overlay!.querySelector('.vue-toast__message')?.textContent).toBe('a');
  });

  it('mounts one overlay however many toasts are shown', async () => {
    const toast = useToast();
    toast.success('a', { disableTimeout: true });
    toast.error('b', { disableTimeout: true });
    await nextTick();

    expect(document.querySelectorAll('[data-vue-toast-alerts]')).toHaveLength(1);
    expect(document.querySelectorAll('.vue-toast')).toHaveLength(2);
  });

  it('injects the stylesheet once', () => {
    const toast = useToast();
    toast.success('a', { disableTimeout: true });
    toast.success('b', { disableTimeout: true });

    const tags = document.querySelectorAll('#vue-toast-alerts-styles');
    expect(tags).toHaveLength(1);
    expect(tags[0]!.textContent).toContain('.vue-toast-root');
  });

  it('stands down for a <ToastAlerts /> the app renders itself', async () => {
    let toast: ToastStore | null = null;
    const component = defineComponent({
      setup() {
        toast = useToast() as ToastStore;
        return () => h(ToastAlerts);
      },
    });

    const { app } = mountApp(component, createToastAlerts());
    await nextTick();

    toast!.success('a', { disableTimeout: true });
    await nextTick();

    expect(document.querySelectorAll('[data-vue-toast-alerts]')).toHaveLength(0);
    expect(document.querySelectorAll('.vue-toast')).toHaveLength(1);
    app.unmount();
  });

  it('skips style injection when asked', () => {
    let toast: ToastStore | null = null;
    const component = defineComponent({
      setup() {
        toast = useToast() as ToastStore;
        return () => h('div');
      },
    });

    const { app } = mountApp(component, createToastAlerts({ injectStyles: false }));
    toast!.success('a', { disableTimeout: true });

    expect(document.getElementById('vue-toast-alerts-styles')).toBeNull();
    app.unmount();
  });

  it('skips the overlay when autoMount is off', async () => {
    let toast: ToastStore | null = null;
    const component = defineComponent({
      setup() {
        toast = useToast() as ToastStore;
        return () => h('div');
      },
    });

    const { app } = mountApp(component, createToastAlerts({ autoMount: false }));
    toast!.success('a', { disableTimeout: true });
    await nextTick();

    expect(document.querySelector('[data-vue-toast-alerts]')).toBeNull();
    expect(document.getElementById('vue-toast-alerts-styles')).not.toBeNull();
    app.unmount();
  });
});
