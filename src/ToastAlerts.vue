<script setup lang="ts">
import { computed, inject, onMounted, onBeforeUnmount, ref } from 'vue';
import ToastIcon from './ToastIcon.vue';
import { autoOverlayKey } from './keys';
import { registerHost, unregisterHost } from './overlay';
import { resolveStore } from './useToast';
import type { Toast } from './types';

defineOptions({ name: 'ToastAlerts', inheritAttrs: false });

const { teleport = true, to = 'body' } = defineProps<{
  /** Move the overlay to `to`. Turn it off to render in place. */
  teleport?: boolean;
  /** Teleport target. Defaults to `body`. */
  to?: string | HTMLElement;
}>();

defineSlots<{
  /** Replaces a toast's contents. The animated shell and its behaviour stay. */
  toast?: (props: {
    toast: Toast;
    close: () => void;
    pause: () => void;
    resume: () => void;
  }) => unknown;
}>();

const store = resolveStore();
const { toasts, toastsByPosition, hasBackdrop } = store;

// Nothing can exist during SSR, so render nothing until we are in the browser.
const mounted = ref(false);

const isAutoOverlay = inject(autoOverlayKey, false);

onMounted(() => {
  mounted.value = true;
  if (!isAutoOverlay) {
    registerHost(store);
  }
});

onBeforeUnmount(() => {
  if (!isAutoOverlay) {
    unregisterHost(store);
  }
});

const groups = computed(() =>
  [...toastsByPosition.value].map(([position, list]) => ({
    position,
    toasts: list,
  })),
);

function latestAnnouncement(politeness: 'polite' | 'assertive'): string {
  const toast = toasts.value.find(
    (candidate) =>
      !candidate.leaving && candidate.config.ariaLive === politeness,
  );
  return toast ? `${toast.title}. ${toast.message}` : '';
}

const politeAnnouncement = computed(() => latestAnnouncement('polite'));
const assertiveAnnouncement = computed(() => latestAnnouncement('assertive'));

function showProgress(toast: Toast): boolean {
  return (
    toast.config.showProgress &&
    !toast.config.disableTimeout &&
    toast.config.timeout > 0
  );
}

function onToastClick(toast: Toast): void {
  if (store.isCloseableOnClick(toast.id)) {
    store.closeToast(toast.id, 'click');
  }
}

function onClose(event: Event, toast: Toast): void {
  event.stopPropagation();
  store.closeToast(toast.id, 'close-button');
}

function onPointerEnter(toast: Toast): void {
  if (toast.config.pauseOnHover) {
    store.pauseToast(toast.id);
  }
}

function onPointerLeave(toast: Toast): void {
  if (toast.config.pauseOnHover) {
    store.resumeToast(toast.id);
  }
}

function onBackdropClick(): void {
  for (const toast of toasts.value) {
    if (
      toast.config.position === 'center' &&
      toast.config.clickToClose &&
      !toast.leaving
    ) {
      store.closeToast(toast.id, 'backdrop');
    }
  }
}
</script>

<template>
  <Teleport v-if="mounted" :to="to" :disabled="!teleport">
    <div class="vue-toast-root" v-bind="$attrs">
      <!-- Must exist before content lands in them to be announced. -->
      <div class="vue-toast-live" aria-live="polite" aria-atomic="true">
        {{ politeAnnouncement }}
      </div>
      <div class="vue-toast-live" aria-live="assertive" aria-atomic="true">
        {{ assertiveAnnouncement }}
      </div>

      <div
        v-if="hasBackdrop"
        class="vue-toast-backdrop"
        @click="onBackdropClick"
      ></div>

      <div
        v-for="group in groups"
        :key="group.position"
        class="vue-toast-container"
        :data-position="group.position"
      >
        <div
          v-for="toast in group.toasts"
          :key="toast.id"
          class="vue-toast"
          :data-type="toast.type"
          :data-position="group.position"
          :data-radius="toast.config.radius"
          :class="{
            'is-leaving': toast.leaving,
            'is-clickable': toast.config.clickToClose,
          }"
          @click="onToastClick(toast)"
          @mouseenter="onPointerEnter(toast)"
          @mouseleave="onPointerLeave(toast)"
        >
          <slot
            name="toast"
            :toast="toast"
            :close="() => store.closeToast(toast.id)"
            :pause="() => store.pauseToast(toast.id)"
            :resume="() => store.resumeToast(toast.id)"
          >
            <span class="vue-toast__icon" aria-hidden="true">
              <ToastIcon :type="toast.type" />
            </span>

            <div class="vue-toast__body">
              <h3 class="vue-toast__title">{{ toast.title }}</h3>
              <p class="vue-toast__message">{{ toast.message }}</p>
            </div>

            <button
              v-if="toast.config.showCloseButton"
              type="button"
              class="vue-toast__close"
              aria-label="Dismiss notification"
              @click="onClose($event, toast)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <span
              v-if="showProgress(toast)"
              class="vue-toast__progress"
              :style="{ animationDuration: `${toast.config.timeout}ms` }"
            ></span>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>
