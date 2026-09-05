import { createApp, h } from 'vue';
import { createToastAlerts, useToast, type Toaster } from 'vue-toast-alerts';

declare global {
  interface Window {
    toast: Toaster;
    toastReady: boolean;
  }
}

const app = createApp({
  setup() {
    window.toast = useToast();
    window.toastReady = true;

    return () =>
      h('main', [
        h('h1', 'vue-toast-alerts e2e fixture'),
        h('button', { id: 'outside' }, 'outside button'),
        h('div', { id: 'filler' }),
      ]);
  },
});

app.use(createToastAlerts());
app.mount('#app');
