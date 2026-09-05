<script setup lang="ts">
import CodeBlock from './CodeBlock.vue';

const install = 'npm install vue-toast-alerts';

const use = `<script setup lang="ts">
import { useToast } from 'vue-toast-alerts';

const toast = useToast();

function save() {
  toast.success('Your changes have been saved');
}
<\/script>

<template>
  <button @click="save">Save</button>
</template>`;

const configure = `import { createApp } from 'vue';
import { createToastAlerts } from 'vue-toast-alerts';
import App from './App.vue';

createApp(App)
  .use(
    createToastAlerts({
      timeout: 5000,
      position: 'top-right',
      radius: 'round',
    }),
  )
  .mount('#app');`;

const centre = `toast.center('Read the full tutorial to enhance your skills', 'pending', {
  title: 'Notifications UI design',
});`;
</script>

<template>
  <section id="quick-start" class="section">
    <div class="wrap">
      <p class="eyebrow">Quick start</p>
      <h2>Two steps, and the second is optional</h2>
      <p class="lede">
        The service mounts its own overlay and injects its own stylesheet, so a
        working integration is an install and a function call.
      </p>

      <ol class="steps">
        <li>
          <h3><span>1</span> Install</h3>
          <CodeBlock lang="bash" :code="install" />
        </li>
        <li>
          <h3><span>2</span> Show a toast</h3>
          <CodeBlock lang="vue" :code="use" />
        </li>
      </ol>

      <div class="extras">
        <div>
          <h3 class="minor">Changing the defaults</h3>
          <p>
            Register the plugin to set defaults once. It also gives each app its
            own queue, which is what you want for server rendering.
          </p>
          <CodeBlock :code="configure" />
        </div>
        <div>
          <h3 class="minor">The centred toast</h3>
          <p>
            It dims and blurs the page behind it and animates in with a spring.
            Clicking the backdrop dismisses it.
          </p>
          <CodeBlock :code="centre" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.steps {
  display: grid;
  gap: 22px;
  margin: 0 0 44px;
  padding: 0;
  list-style: none;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: 17px;
}

h3 span {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  font-size: 13px;
  color: #0d1117;
  background: linear-gradient(180deg, #a8b6f8, #8fa2f5);
  border-radius: 999px;
}

.extras {
  display: grid;
  gap: 26px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.minor {
  margin-bottom: 8px;
}

.extras p {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 14.5px;
}
</style>
