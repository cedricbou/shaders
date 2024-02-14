/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    coverage: {
      reporter: ['lcov', 'html', 'text'],
      provider: 'v8',
    },
    // environment: 'jsdom',
  },
});
