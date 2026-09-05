<script setup lang="ts">
const methods = [
  ['success(message, config?)', 'Green toast. Returns the toast id.'],
  ['error(message, config?)', 'Red toast.'],
  ['warning(message, config?)', 'Orange toast.'],
  ['info(message, config?)', 'Neutral toast.'],
  ['pending(message, config?)', 'Indigo toast with a spinner.'],
  ['center(message, type?, config?)', 'Any type, pinned to the centre.'],
  ['show(type, message, config?)', 'General entry point.'],
  ['closeToast(id, reason?)', 'Animate one toast out and remove it.'],
  ['dismissAll()', 'Dismiss every live toast.'],
  ['pauseToast(id) / resumeToast(id)', 'Freeze and resume a dismiss timer.'],
  ['setConfig(config)', 'Merge new defaults, for toasts shown afterwards.'],
  ['toasts', 'Computed ref of the live toasts, newest first.'],
  ['toastsByPosition', 'Computed ref of the live toasts grouped by position.'],
  ['hasBackdrop', 'Computed ref — true while a centred toast wants a backdrop.'],
];

const options = [
  ['timeout', 'number', '5000', 'Milliseconds before auto-dismiss.'],
  ['disableTimeout', 'boolean', 'false', 'Keep the toast until dismissed explicitly.'],
  ['clickToClose', 'boolean', 'true', 'Dismiss when the toast body is clicked.'],
  ['position', 'ToastPosition', "'top-right'", 'Where the toast is anchored.'],
  ['radius', "'soft' | 'round' | 'pill'", "'round'", 'Corner rounding preset.'],
  ['showCloseButton', 'boolean', 'true', 'Render the × button.'],
  ['pauseOnHover', 'boolean', 'true', 'Freeze the timer while hovered.'],
  ['showProgress', 'boolean', 'false', 'Draw a countdown bar.'],
  ['backdrop', 'boolean', 'true', 'Dim the page behind a center toast.'],
  ['maxToasts', 'number', '5', 'Cap per position; oldest are dropped.'],
  ['title', 'string', 'per type', 'Override the heading.'],
  ['ariaLive', "'polite' | 'assertive'", "'polite'", 'Announcement politeness.'],
  ['onEvent', '(e: ToastEvent) => void', '—', 'Called when a toast is shown or dismissed.'],
];

const tokens = [
  ['--vue-toast-surface', '#ffffff', 'Card background'],
  ['--vue-toast-title-color', '#0d1117', 'Title text'],
  ['--vue-toast-message-color', '#6b7280', 'Message text'],
  ['--vue-toast-radius', '20px', 'Corner rounding'],
  ['--vue-toast-icon-size', '44px', 'Icon tile size'],
  ['--vue-toast-width', '400px', 'Toast width'],
  ['--vue-toast-offset', '24px', 'Distance from the viewport edge'],
  ['--vue-toast-success', '#34c88a', 'Success accent'],
  ['--vue-toast-error', '#e0796d', 'Error accent'],
  ['--vue-toast-warning', '#efb265', 'Warning accent'],
  ['--vue-toast-info', '#9aa2ae', 'Info accent'],
  ['--vue-toast-pending', '#8fa2f5', 'Pending accent'],
  ['--vue-toast-enter-duration', '460ms', 'Entrance duration'],
  ['--vue-toast-exit-duration', '260ms', 'Exit duration'],
  ['--vue-toast-font', 'system stack', 'Font family'],
  ['--vue-toast-z-index', '9999', 'Stacking order'],
];
</script>

<template>
  <section id="api" class="section">
    <div class="wrap">
      <p class="eyebrow">API</p>
      <h2>Reference</h2>
      <p class="lede">
        Everything <code>useToast()</code> returns, every option it accepts, and
        every custom property you can set.
      </p>

      <h3>useToast()</h3>
      <div class="card scroller">
        <table>
          <thead><tr><th>Member</th><th>Description</th></tr></thead>
          <tbody>
            <tr v-for="[name, description] in methods" :key="name">
              <td><code>{{ name }}</code></td>
              <td>{{ description }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Configuration</h3>
      <div class="card scroller">
        <table>
          <thead>
            <tr><th>Option</th><th>Type</th><th>Default</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr v-for="[name, type, value, description] in options" :key="name">
              <td><code>{{ name }}</code></td>
              <td><code>{{ type }}</code></td>
              <td><code>{{ value }}</code></td>
              <td>{{ description }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>CSS custom properties</h3>
      <div class="card scroller">
        <table>
          <thead><tr><th>Property</th><th>Default</th><th>Controls</th></tr></thead>
          <tbody>
            <tr v-for="[name, value, controls] in tokens" :key="name">
              <td><code>{{ name }}</code></td>
              <td><code>{{ value }}</code></td>
              <td>{{ controls }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
h3 {
  margin: 34px 0 14px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
}

.card {
  padding: 4px 6px;
}
</style>
