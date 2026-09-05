import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  // Served from https://babatundelmd.github.io/vue-toast-alerts/
  base: process.env.DOCS_BASE ?? '/vue-toast-alerts/',
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-toast-alerts': fileURLToPath(
        new URL('../src/index.ts', import.meta.url),
      ),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('../docs-dist', import.meta.url)),
    emptyOutDir: true,
  },
});
