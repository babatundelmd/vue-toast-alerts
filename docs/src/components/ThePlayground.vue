<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import {
  useToast,
  type ToastEvent,
  type ToastPosition,
  type ToastRadius,
  type ToastType,
} from 'vue-toast-alerts';

const toast = useToast();

const positions: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'center',
];
const radii: ToastRadius[] = ['soft', 'round', 'pill'];
const types: ToastType[] = ['success', 'error', 'warning', 'info', 'pending'];

const messages: Record<ToastType, string> = {
  success: 'Your changes have been saved',
  error: 'We could not reach the server',
  warning: 'Your session expires in two minutes',
  info: 'Three new items are waiting for review',
  pending: 'Uploading three files…',
};

const settings = reactive({
  position: 'top-right' as ToastPosition,
  radius: 'round' as ToastRadius,
  timeout: 5000,
  maxToasts: 5,
  showProgress: false,
  showCloseButton: true,
  pauseOnHover: true,
  clickToClose: true,
  backdrop: true,
});

const log = ref<Array<ToastEvent & { key: number }>>([]);
let key = 0;

onMounted(() => {
  toast.setConfig({
    onEvent: (event) => {
      log.value = [{ ...event, key: key++ }, ...log.value].slice(0, 8);
    },
  });
});

watch(settings, () => toast.setConfig({ ...settings }), { immediate: true });

function fire(type: ToastType) {
  toast.show(type, messages[type]);
}

function centred() {
  toast.center('Read the full tutorial to enhance your skills', 'pending', {
    title: 'Notifications UI design',
  });
}

function withProgress() {
  toast.info('This one counts itself down', { showProgress: true, timeout: 8000 });
}

function pendingThenDone() {
  const id = toast.pending('Uploading three files…', { disableTimeout: true });
  setTimeout(() => {
    toast.closeToast(id);
    toast.success('Upload complete');
  }, 2600);
}

function stacked() {
  types.forEach((type, i) => setTimeout(() => fire(type), i * 200));
}

const reasonLabel: Record<string, string> = {
  timeout: 'expired',
  click: 'clicked',
  'close-button': 'close button',
  backdrop: 'backdrop',
  programmatic: 'dismissed in code',
  limit: 'evicted',
};
</script>

<template>
  <section id="playground" class="section">
    <div class="wrap">
      <p class="eyebrow">Playground</p>
      <h2>Try every option, right here</h2>
      <p class="lede">
        Nothing is mocked — this page installs the library the same way your app
        would, and the event log below is the real <code>onEvent</code> hook.
      </p>

      <div class="board">
        <div class="card panel">
          <h3>Types</h3>
          <div class="row">
            <button
              v-for="type in types"
              :key="type"
              class="chip"
              :class="`chip--${type}`"
              @click="fire(type)"
            >
              {{ type }}
            </button>
          </div>

          <h3>Showcase</h3>
          <div class="row">
            <button class="btn" @click="centred">Centred toast</button>
            <button class="btn" @click="withProgress">Progress bar</button>
            <button class="btn" @click="pendingThenDone">Pending → success</button>
            <button class="btn" @click="stacked">Stack five</button>
            <button class="btn" @click="toast.dismissAll()">Dismiss all</button>
          </div>

          <h3>Configuration</h3>
          <div class="grid">
            <label>
              <span>Position</span>
              <select v-model="settings.position">
                <option v-for="p in positions" :key="p" :value="p">{{ p }}</option>
              </select>
            </label>
            <label>
              <span>Radius</span>
              <select v-model="settings.radius">
                <option v-for="r in radii" :key="r" :value="r">{{ r }}</option>
              </select>
            </label>
            <label>
              <span>Timeout — {{ settings.timeout }}ms</span>
              <input v-model.number="settings.timeout" type="range" min="1000" max="12000" step="500" />
            </label>
            <label>
              <span>Max per position — {{ settings.maxToasts }}</span>
              <input v-model.number="settings.maxToasts" type="range" min="1" max="8" />
            </label>
          </div>

          <div class="row checks">
            <label><input v-model="settings.showProgress" type="checkbox" /> Progress bar</label>
            <label><input v-model="settings.showCloseButton" type="checkbox" /> Close button</label>
            <label><input v-model="settings.pauseOnHover" type="checkbox" /> Pause on hover</label>
            <label><input v-model="settings.clickToClose" type="checkbox" /> Click to close</label>
            <label><input v-model="settings.backdrop" type="checkbox" /> Backdrop</label>
          </div>
        </div>

        <div class="card panel log">
          <h3>Event log</h3>
          <p class="note">
            Every entry comes from <code>onEvent</code>. The library reports what
            happened and sends nothing anywhere.
          </p>
          <ul v-if="log.length">
            <li v-for="entry in log" :key="entry.key">
              <span class="dot" :class="`dot--${entry.type}`"></span>
              <span class="verb">{{ entry.event }}</span>
              <span class="detail">
                {{ entry.type }}
                <template v-if="entry.reason">
                  · {{ reasonLabel[entry.reason] ?? entry.reason }}
                </template>
                <template v-if="entry.visibleFor !== undefined">
                  · {{ (entry.visibleFor / 1000).toFixed(1) }}s on screen
                </template>
              </span>
            </li>
          </ul>
          <p v-else class="empty">Show a toast and its lifecycle appears here.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.board {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
}

@media (max-width: 900px) {
  .board {
    grid-template-columns: 1fr;
  }
}

.panel {
  padding: 24px;
}

h3 {
  margin: 0 0 14px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
}

h3:not(:first-child) {
  margin-top: 28px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  padding: 9px 18px;
  font-weight: 600;
  background: var(--bg-soft);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.chip:hover {
  transform: translateY(-1px);
  border-color: currentColor;
}

.chip--success { color: #1e9c67; }
.chip--error { color: #c9584a; }
.chip--warning { color: #b07d29; }
.chip--info { color: #6d7683; }
.chip--pending { color: #5f74d6; }

@media (prefers-color-scheme: dark) {
  .chip--success { color: var(--success); }
  .chip--error { color: var(--error); }
  .chip--warning { color: var(--warning); }
  .chip--info { color: var(--info); }
  .chip--pending { color: var(--pending); }
}

.grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

select {
  padding: 9px 11px;
  color: var(--ink);
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 10px;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--pending);
}

.checks {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--muted);
}

.checks label {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}

.log {
  align-self: start;
}

.log ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.log li {
  display: flex;
  align-items: baseline;
  gap: 9px;
  padding: 9px 0;
  font-size: 13.5px;
  border-bottom: 1px solid var(--line);
}

.log li:last-child {
  border-bottom: 0;
}

.dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  transform: translateY(-1px);
}

.dot--success { background: var(--success); }
.dot--error { background: var(--error); }
.dot--warning { background: var(--warning); }
.dot--info { background: var(--info); }
.dot--pending { background: var(--pending); }

.verb {
  font-weight: 650;
}

.detail {
  color: var(--muted);
}

.note,
.empty {
  margin: -6px 0 16px;
  color: var(--muted);
  font-size: 13.5px;
}

.empty {
  margin: 0;
}
</style>
