<script setup lang="ts">
import CodeBlock from './CodeBlock.vue';

const wiring = `createToastAlerts({
  onEvent: (event) => {
    analytics.track('toast', {
      type: event.type,             // the toast type
      reason: event.reason,         // why it went away
      visibleFor: event.visibleFor, // milliseconds on screen
    });
  },
});`;

const attribute = `toast.closeToast(id, 'programmatic');`;

const fields = [
  ["'shown' | 'dismissed'", 'event', 'Which end of the lifecycle'],
  ['number', 'id', 'Matches the id returned by success() and friends'],
  ['ToastType', 'type', 'The toast type'],
  ['string', 'title / message', 'As rendered'],
  ['ToastPosition', 'position', 'Where it was anchored'],
  ['number', 'at', 'Date.now() when it happened'],
  ['ToastDismissReason', 'reason', 'dismissed only'],
  ['number', 'visibleFor', 'Milliseconds on screen, dismissed only'],
];

const reasons = [
  ['timeout', 'Expired on its own — nobody interacted'],
  ['click', 'The toast body was clicked'],
  ['close-button', 'The × was pressed'],
  ['backdrop', 'The backdrop behind a centred toast was clicked'],
  ['programmatic', 'closeToast() or dismissAll() was called'],
  ['limit', 'Evicted because maxToasts was reached'],
];
</script>

<template>
  <section id="events" class="section">
    <div class="wrap">
      <p class="eyebrow">Events and analytics</p>
      <h2>Know how your notifications are doing</h2>
      <p class="lede">
        <code>onEvent</code> tells you when a toast is shown or dismissed, and
        why. <strong>The library collects nothing and transmits nothing</strong>
        — no device data, no location, no network calls. It hands you the event;
        where it goes is entirely your choice.
      </p>

      <div class="split">
        <div>
          <CodeBlock :code="wiring" />
          <p class="after">
            <code>reason</code> plus <code>visibleFor</code> is the useful pair:
            a short <code>visibleFor</code> next to <code>click</code> means
            people are swatting toasts away, while <code>timeout</code> on an
            error toast means nobody is reading it.
          </p>
          <p class="after">You can attribute your own dismissals too:</p>
          <CodeBlock :code="attribute" />
        </div>

        <ul class="notes">
          <li>
            <strong>Browser only.</strong> Nothing is emitted during server
            rendering, so a toast is not double-counted when the page hydrates.
          </li>
          <li>
            <strong>A throwing handler cannot break rendering.</strong>
            Exceptions are caught and logged with <code>console.error</code>.
          </li>
          <li>
            <strong>Usually set once</strong>, in
            <code>createToastAlerts()</code>. A per-toast <code>onEvent</code>
            overrides it for that toast, which is occasionally handy for one-off
            tracking.
          </li>
          <li>
            The <a href="#playground">event log in the playground</a> is this
            hook, running live on this page.
          </li>
        </ul>
      </div>

      <h3>The event</h3>
      <div class="card scroller">
        <table>
          <thead><tr><th>Field</th><th>Type</th><th>Notes</th></tr></thead>
          <tbody>
            <tr v-for="[type, field, notes] in fields" :key="field">
              <td><code>{{ field }}</code></td>
              <td><code>{{ type }}</code></td>
              <td>{{ notes }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Dismissal reasons</h3>
      <div class="card scroller">
        <table>
          <thead><tr><th>Reason</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr v-for="[name, meaning] in reasons" :key="name">
              <td><code>{{ name }}</code></td>
              <td>{{ meaning }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.split {
  display: grid;
  gap: 32px;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: start;
}

@media (max-width: 900px) {
  .split {
    grid-template-columns: 1fr;
  }
}

.after {
  margin: 16px 0;
  color: var(--muted);
  font-size: 14.5px;
}

.notes {
  margin: 0;
  padding: 0;
  list-style: none;
}

.notes li {
  padding: 14px 0;
  color: var(--muted);
  font-size: 14.5px;
  border-bottom: 1px solid var(--line);
}

.notes li:first-child {
  padding-top: 0;
}

.notes li:last-child {
  border-bottom: 0;
}

.notes strong {
  color: var(--ink);
}

h3 {
  margin: 40px 0 14px;
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
