import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import ToastAlerts from '../src/ToastAlerts.vue';
import { toastStoreKey } from '../src/keys';
import { createToastStore, type ToastStore } from '../src/store';
import { TOAST_EXIT_DURATION, type Toast } from '../src/types';

let store: ToastStore;

beforeEach(() => {
  vi.useFakeTimers();
  store = createToastStore();
});

afterEach(() => {
  store.dispose();
  vi.useRealTimers();
});

// Teleport off so assertions run against the wrapper; a tick because the
// overlay renders nothing until mounted.
async function render(options: Record<string, unknown> = {}) {
  const wrapper = mount(ToastAlerts, {
    props: { teleport: false },
    global: { provide: { [toastStoreKey as symbol]: store } },
    ...options,
  });
  await nextTick();
  return wrapper;
}

async function settle(wrapper: VueWrapper) {
  await nextTick();
  return wrapper;
}

describe('rendering', () => {
  it('renders nothing until there is something to say', async () => {
    const wrapper = await render();
    expect(wrapper.find('.vue-toast').exists()).toBe(false);
    expect(wrapper.find('.vue-toast-root').exists()).toBe(true);
  });

  it('renders the title, message and icon of a toast', async () => {
    const wrapper = await render();
    store.success('Your changes have been saved', { disableTimeout: true });
    await settle(wrapper);

    expect(wrapper.find('.vue-toast__title').text()).toBe('Success');
    expect(wrapper.find('.vue-toast__message').text()).toBe(
      'Your changes have been saved',
    );
    expect(wrapper.find('.vue-toast__icon svg').exists()).toBe(true);
  });

  it('describes the toast with data attributes the stylesheet keys off', async () => {
    const wrapper = await render();
    store.warning('careful', {
      disableTimeout: true,
      radius: 'pill',
      position: 'bottom-left',
    });
    await settle(wrapper);

    const toast = wrapper.find('.vue-toast');
    expect(toast.attributes('data-type')).toBe('warning');
    expect(toast.attributes('data-radius')).toBe('pill');
    expect(toast.attributes('data-position')).toBe('bottom-left');
    expect(wrapper.find('.vue-toast-container').attributes('data-position')).toBe(
      'bottom-left',
    );
  });

  it('gives each position its own container', async () => {
    const wrapper = await render();
    store.success('a', { position: 'top-left', disableTimeout: true });
    store.success('b', { position: 'bottom-right', disableTimeout: true });
    await settle(wrapper);

    expect(wrapper.findAll('.vue-toast-container')).toHaveLength(2);
  });

  it('marks a leaving toast so the exit animation runs', async () => {
    const wrapper = await render();
    const id = store.success('a', { disableTimeout: true });
    await settle(wrapper);

    store.closeToast(id);
    await settle(wrapper);
    expect(wrapper.find('.vue-toast').classes()).toContain('is-leaving');

    vi.advanceTimersByTime(TOAST_EXIT_DURATION);
    await settle(wrapper);
    expect(wrapper.find('.vue-toast').exists()).toBe(false);
  });

  it('shows a spinner for a pending toast', async () => {
    const wrapper = await render();
    store.pending('uploading', { disableTimeout: true });
    await settle(wrapper);

    expect(wrapper.find('.vue-toast__spinner').exists()).toBe(true);
  });

  it('draws the progress bar only when it can track a real timeout', async () => {
    const wrapper = await render();
    store.success('with', { showProgress: true, timeout: 3000 });
    store.success('without', { showProgress: true, disableTimeout: true });
    await settle(wrapper);

    const bars = wrapper.findAll('.vue-toast__progress');
    expect(bars).toHaveLength(1);
    expect(bars[0]!.attributes('style')).toContain('3000ms');
  });

  it('hides the close button when asked', async () => {
    const wrapper = await render();
    store.info('a', { showCloseButton: false, disableTimeout: true });
    await settle(wrapper);

    expect(wrapper.find('.vue-toast__close').exists()).toBe(false);
  });
});

describe('interaction', () => {
  it('dismisses on a body click', async () => {
    const wrapper = await render();
    store.success('a', { disableTimeout: true });
    await settle(wrapper);

    await wrapper.find('.vue-toast').trigger('click');
    expect(store.toasts.value[0]!.leaving).toBe(true);
  });

  it('leaves the toast alone when clickToClose is off', async () => {
    const wrapper = await render();
    store.success('a', { disableTimeout: true, clickToClose: false });
    await settle(wrapper);

    await wrapper.find('.vue-toast').trigger('click');
    expect(store.toasts.value[0]!.leaving).toBe(false);
  });

  it('dismisses from the close button without double-firing the body click', async () => {
    const wrapper = await render();
    const onEvent = vi.fn();
    store.success('a', { disableTimeout: true, onEvent });
    await settle(wrapper);

    await wrapper.find('.vue-toast__close').trigger('click');

    const dismissals = onEvent.mock.calls
      .map(([e]) => e)
      .filter((e) => e.event === 'dismissed');
    expect(dismissals).toHaveLength(1);
    expect(dismissals[0]!.reason).toBe('close-button');
  });

  it('freezes the timer while hovered', async () => {
    const wrapper = await render();
    store.success('a', { timeout: 1000 });
    await settle(wrapper);

    const toast = wrapper.find('.vue-toast');
    await toast.trigger('mouseenter');
    vi.advanceTimersByTime(5000);
    expect(store.toasts.value[0]!.leaving).toBe(false);

    await toast.trigger('mouseleave');
    vi.advanceTimersByTime(1000);
    expect(store.toasts.value[0]!.leaving).toBe(true);
  });

  it('does not freeze when pauseOnHover is off', async () => {
    const wrapper = await render();
    store.success('a', { timeout: 1000, pauseOnHover: false });
    await settle(wrapper);

    await wrapper.find('.vue-toast').trigger('mouseenter');
    vi.advanceTimersByTime(1000);
    expect(store.toasts.value[0]!.leaving).toBe(true);
  });
});

describe('the centred toast', () => {
  it('dims the page behind it', async () => {
    const wrapper = await render();
    store.center('read this', 'info', { disableTimeout: true });
    await settle(wrapper);

    expect(wrapper.find('.vue-toast-backdrop').exists()).toBe(true);
  });

  it('skips the backdrop when told to', async () => {
    const wrapper = await render();
    store.center('a', 'info', { backdrop: false, disableTimeout: true });
    await settle(wrapper);

    expect(wrapper.find('.vue-toast-backdrop').exists()).toBe(false);
  });

  it('dismisses on a backdrop click, attributing the reason', async () => {
    const wrapper = await render();
    const onEvent = vi.fn();
    store.center('a', 'info', { disableTimeout: true, onEvent });
    await settle(wrapper);

    await wrapper.find('.vue-toast-backdrop').trigger('click');

    expect(onEvent.mock.calls.at(-1)![0]).toMatchObject({
      event: 'dismissed',
      reason: 'backdrop',
    });
  });

  it('leaves a centred toast that opted out of click-to-close', async () => {
    const wrapper = await render();
    store.center('a', 'info', {
      disableTimeout: true,
      clickToClose: false,
    });
    await settle(wrapper);

    await wrapper.find('.vue-toast-backdrop').trigger('click');
    expect(store.toasts.value[0]!.leaving).toBe(false);
  });
});

describe('accessibility', () => {
  it('announces politely by default', async () => {
    const wrapper = await render();
    store.success('saved', { disableTimeout: true });
    await settle(wrapper);

    const polite = wrapper.find('[aria-live="polite"]');
    expect(polite.text()).toBe('Success. saved');
    expect(wrapper.find('[aria-live="assertive"]').text()).toBe('');
  });

  it('routes an assertive toast to the assertive region', async () => {
    const wrapper = await render();
    store.error('it broke', { disableTimeout: true, ariaLive: 'assertive' });
    await settle(wrapper);

    expect(wrapper.find('[aria-live="assertive"]').text()).toBe(
      'Error. it broke',
    );
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('');
  });

  it('stops announcing a toast on its way out', async () => {
    const wrapper = await render();
    const id = store.success('saved', { disableTimeout: true });
    await settle(wrapper);

    store.closeToast(id);
    await settle(wrapper);
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('');
  });

  it('labels the close button', async () => {
    const wrapper = await render();
    store.info('a', { disableTimeout: true });
    await settle(wrapper);

    expect(wrapper.find('.vue-toast__close').attributes('aria-label')).toBe(
      'Dismiss notification',
    );
  });
});

describe('the toast slot', () => {
  it('replaces the contents but keeps the shell and its behaviour', async () => {
    const wrapper = await render({
      slots: {
        toast: (props: { toast: Toast; close: () => void }) =>
          h('button', { class: 'custom', onClick: props.close }, [
            props.toast.message,
          ]),
      },
    });
    store.success('bespoke', { disableTimeout: true, clickToClose: false });
    await settle(wrapper);

    expect(wrapper.find('.vue-toast__title').exists()).toBe(false);
    expect(wrapper.find('.custom').text()).toBe('bespoke');
    expect(wrapper.find('.vue-toast').attributes('data-position')).toBe(
      'top-right',
    );

    await wrapper.find('.custom').trigger('click');
    expect(store.toasts.value[0]!.leaving).toBe(true);
  });
});
