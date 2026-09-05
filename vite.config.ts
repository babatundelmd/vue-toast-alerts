import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'VueToastAlerts',
      fileName: (format) =>
        format === 'es' ? 'vue-toast-alerts.js' : 'vue-toast-alerts.cjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Vue is the host app's, never ours.
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        exports: 'named',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    // The stylesheet is imported with ?inline and shipped in the bundle;
    // without this Vitest stubs it out and the injection tests see nothing.
    css: true,
    globals: true,
    include: ['tests/**/*.spec.ts'],
    restoreMocks: true,
  },
});
