<script setup lang="ts">
import type { ToastType } from './types';

defineProps<{ type: ToastType }>();
</script>

<template>
  <svg
    v-if="type === 'success'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M2 13.5 6 17.5 13.5 10" />
    <path d="M9 13.5 13 17.5 22 8.5" />
  </svg>

  <svg
    v-else-if="type === 'error'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 18.4 18.4 5.6" />
  </svg>

  <svg
    v-else-if="type === 'warning'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M12 3.5 22 20H2Z" stroke-linejoin="round" />
    <path d="M12 9.5v4.2" />
    <path d="M12 17h.01" />
  </svg>

  <svg
    v-else-if="type === 'pending'"
    class="vue-toast__spinner"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="9" opacity="0.3" />
    <path d="M21 12a9 9 0 0 0-9-9" />
  </svg>

  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6" />
    <path d="M12 7.5h.01" />
  </svg>
</template>
