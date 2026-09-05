<script setup lang="ts">
import TheHero from './components/TheHero.vue';
import ThePlayground from './components/ThePlayground.vue';
import TheFeatures from './components/TheFeatures.vue';
import TheQuickStart from './components/TheQuickStart.vue';
import TheEvents from './components/TheEvents.vue';
import TheApi from './components/TheApi.vue';

const repo = 'https://github.com/babatundelmd/vue-toast-alerts';
</script>

<template>
  <a class="skip" href="#playground">Skip to the playground</a>

  <nav class="nav">
    <div class="wrap inner">
      <a class="brand" href="#top">
        <span class="mark"></span>
        vue-toast-alerts
      </a>
      <div class="links">
        <a href="#playground">Playground</a>
        <a href="#quick-start">Quick start</a>
        <a href="#events">Events</a>
        <a href="#api">API</a>
        <a :href="repo">GitHub</a>
      </div>
    </div>
  </nav>

  <main id="top">
    <TheHero />
    <ThePlayground />
    <TheFeatures />
    <TheQuickStart />
    <TheEvents />
    <TheApi />
  </main>

  <footer class="footer">
    <div class="wrap inner">
      <p>
        Built by
        <a href="https://github.com/babatundelmd">Babatunde Lamidi</a>. The Vue
        counterpart of
        <a href="https://github.com/babatundelmd/ngx-toast-alerts">ngx-toast-alerts</a>.
      </p>
      <div class="links">
        <a :href="`${repo}/blob/main/CHANGELOG.md`">Changelog</a>
        <a :href="`${repo}/issues`">Issues</a>
        <a href="https://www.npmjs.com/package/vue-toast-alerts">npm</a>
        <a :href="`${repo}/blob/main/LICENSE`">MIT</a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.nav .inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 62px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 650;
  letter-spacing: -0.015em;
  text-decoration: none;
}

.mark {
  width: 22px;
  height: 22px;
  background: linear-gradient(160deg, #a8b6f8, #34c88a);
  border-radius: 7px;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  font-size: 14.5px;
  color: var(--muted);
}

.links a {
  text-decoration: none;
}

.links a:hover {
  color: var(--ink);
}

@media (max-width: 640px) {
  .nav .links a:not(:last-child) {
    display: none;
  }
}

.footer {
  padding: 40px 0 56px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 14.5px;
}

.footer .inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.footer p {
  margin: 0;
}
</style>
