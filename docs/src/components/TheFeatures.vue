<script setup lang="ts">
const features = [
  {
    title: 'Zero setup',
    body: 'No component to place, no provider to register, no stylesheet to import. Call the composable and the overlay mounts itself.',
  },
  {
    title: 'Seven positions',
    body: 'Four corners, two edges and a centred toast with a dimmed, blurred backdrop. Set one globally or per toast; they mix freely.',
  },
  {
    title: 'Themed with CSS variables',
    body: 'Every colour, radius, duration and offset is a custom property the library only reads. A :root rule in your app always wins.',
  },
  {
    title: 'Composition-first',
    body: 'useToast() works inside setup() and outside it — in a Pinia store, a router guard or a plain module.',
  },
  {
    title: 'Analytics hooks',
    body: 'onEvent reports every show and dismissal with a reason and time on screen. The library itself collects and transmits nothing.',
  },
  {
    title: 'Accessible by default',
    body: 'Live-region announcements, a labelled close button, visible focus rings, and a reduced-motion path that drops every transform.',
  },
  {
    title: 'Small and dependency-free',
    body: 'About 6.5 kB gzipped with the stylesheet inside it, and nothing in node_modules but Vue itself.',
  },
];
</script>

<template>
  <section class="section">
    <div class="wrap">
      <p class="eyebrow">Features</p>
      <h2>Everything the Angular original does</h2>
      <p class="lede">
        A port of
        <a href="https://github.com/babatundelmd/ngx-toast-alerts">ngx-toast-alerts</a>,
        matched option for option — rebuilt on the Composition API rather than
        wrapped.
      </p>

      <ul class="grid">
        <li v-for="feature in features" :key="feature.title" class="card">
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.body }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.card {
  padding: 22px;
}

h3 {
  margin: 0 0 8px;
  font-size: 16.5px;
}

p {
  margin: 0;
  color: var(--muted);
  font-size: 14.5px;
}
</style>
