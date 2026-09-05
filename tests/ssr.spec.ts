// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import ToastAlerts from '../src/ToastAlerts.vue';
import { createToastAlerts } from '../src/plugin';
import { createToastStore } from '../src/store';
import { useToast } from '../src/useToast';

it('has no document to render into', () => {
  expect(typeof document).toBe('undefined');
});

describe('server rendering', () => {
  it('renders the overlay as an empty placeholder', async () => {
    const app = createSSRApp(defineComponent({ render: () => h(ToastAlerts) }));
    app.use(createToastAlerts());

    await expect(renderToString(app)).resolves.toBe('<!---->');
  });

  it('renders nothing for a toast shown during setup', async () => {
    const app = createSSRApp(
      defineComponent({
        setup() {
          useToast().success('never seen');
          return () => h(ToastAlerts);
        },
      }),
    );
    app.use(createToastAlerts());

    const html = await renderToString(app);
    expect(html).not.toContain('never seen');
  });

  it('starts no timers and stays out of the event stream', () => {
    const onEvent = vi.fn();
    const store = createToastStore({ onEvent });

    const id = store.success('a', { timeout: 1 });
    expect(onEvent).not.toHaveBeenCalled();

    store.closeToast(id);
    expect(store.toasts.value).toHaveLength(0);

    store.dispose();
  });
});
