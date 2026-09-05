<script setup lang="ts">
import { useToast } from 'vue-toast-alerts';
import CodeBlock from './CodeBlock.vue';

const toast = useToast();

const preview = [
  { type: 'success' as const, title: 'Success', message: 'Your changes have been saved' },
  { type: 'pending' as const, title: 'Notifications UI design', message: 'Read the full tutorial' },
  { type: 'warning' as const, title: 'Warning', message: 'Your session expires in two minutes' },
];

function demo() {
  toast.success('Your changes have been saved');
  setTimeout(() => toast.pending('Uploading three files…'), 260);
}
</script>

<template>
  <header class="hero">
    <div class="wrap inner">
      <div class="copy">
        <p class="eyebrow">v1.0.0 · Vue 3.5</p>
        <h1>Toasts that feel <em>designed</em>, not bolted on.</h1>
        <p class="sub">
          Rounded, animated notifications for Vue. Composition-first, SSR-safe
          and themeable through CSS custom properties — with a centred toast
          that springs out of a blur.
        </p>

        <CodeBlock class="install" lang="bash" code="npm install vue-toast-alerts" />

        <div class="actions">
          <button class="btn btn--primary" @click="demo">Try it live</button>
          <a class="btn" href="https://github.com/babatundelmd/vue-toast-alerts">
            Star on GitHub
          </a>
          <a class="btn" href="https://www.npmjs.com/package/vue-toast-alerts">npm</a>
        </div>
      </div>

      <div class="preview" aria-hidden="true">
        <div v-for="card in preview" :key="card.type" class="fake" :data-type="card.type">
          <span class="fake__icon"></span>
          <div class="fake__body">
            <strong>{{ card.title }}</strong>
            <span>{{ card.message }}</span>
          </div>
          <span class="fake__close">×</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  position: relative;
  padding: 84px 0 92px;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -320px;
  right: -160px;
  width: 720px;
  height: 720px;
  background: radial-gradient(circle, rgba(143, 162, 245, 0.22), transparent 62%);
  pointer-events: none;
}

.inner {
  position: relative;
  display: grid;
  gap: 56px;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr);
  align-items: center;
}

@media (max-width: 900px) {
  .inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }
}

h1 {
  margin: 0 0 18px;
  font-size: clamp(36px, 5.6vw, 58px);
  font-weight: 700;
}

h1 em {
  font-style: italic;
  background: linear-gradient(96deg, #8fa2f5, #34c88a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.sub {
  max-width: 52ch;
  margin: 0 0 26px;
  color: var(--muted);
  font-size: 18px;
}

.install {
  max-width: 360px;
  margin-bottom: 24px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.fake {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: var(--shadow);
}

.fake:nth-child(1) { transform: translateX(14px) rotate(-0.6deg); }
.fake:nth-child(2) { transform: scale(1.03); z-index: 1; }
.fake:nth-child(3) { transform: translateX(20px) rotate(0.5deg); }

.fake__icon {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 14px;
}

.fake[data-type='success'] .fake__icon { background: var(--success); }
.fake[data-type='pending'] .fake__icon { background: var(--pending); }
.fake[data-type='warning'] .fake__icon { background: var(--warning); }

.fake__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fake__body strong {
  font-size: 15px;
  letter-spacing: -0.01em;
}

.fake__body span {
  color: var(--muted);
  font-size: 14px;
}

.fake__close {
  margin-left: auto;
  color: var(--faint);
  font-size: 18px;
}
</style>
