<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{ code: string; lang?: 'ts' | 'bash' | 'css' | 'vue' }>(),
  { lang: 'ts' },
);

const copied = ref(false);

const KEYWORDS =
  /\b(import|from|export|const|let|function|return|await|async|new|type|interface|if|else|for|of|void)\b/g;

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The snippets are authored here, not user input, and are escaped first.
const highlighted = computed(() => {
  let html = escape(props.code);

  if (props.lang === 'bash') {
    return html.replace(/^(#.*)$/gm, '<i>$1</i>');
  }

  html = html
    .replace(/(&#39;|&quot;|'|")([^'"\n]*?)\1/g, '<s>$1$2$1</s>')
    .replace(/`([^`\n]*)`/g, '<s>`$1`</s>')
    .replace(KEYWORDS, '<b>$1</b>')
    .replace(/(\/\/[^\n]*)/g, '<i>$1</i>');

  return html;
});

async function copy() {
  await navigator.clipboard.writeText(props.code);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
}
</script>

<template>
  <div class="code">
    <button class="copy" type="button" :aria-label="copied ? 'Copied' : 'Copy code'" @click="copy">
      {{ copied ? 'Copied' : 'Copy' }}
    </button>
    <pre><code v-html="highlighted"></code></pre>
  </div>
</template>

<style scoped>
.code {
  position: relative;
  background: var(--code-bg);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
}

pre {
  margin: 0;
  padding: 18px 20px;
  overflow-x: auto;
  color: var(--code-ink);
  font-family: var(--mono);
  font-size: 13.5px;
  line-height: 1.65;
  tab-size: 2;
}

.copy {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 600;
  color: #aeb8c7;
  background: rgba(255, 255, 255, 0.07);
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.code:hover .copy,
.copy:focus-visible {
  opacity: 1;
}

.copy:hover {
  color: #fff;
}

:deep(b) {
  color: #c4a2f5;
  font-weight: 400;
}

:deep(s) {
  color: #9fd8a8;
  text-decoration: none;
}

:deep(i) {
  color: #6f7b8c;
  font-style: normal;
}
</style>
