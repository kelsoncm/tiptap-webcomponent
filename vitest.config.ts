import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The core may be linked from a sibling folder during development.
  server: { fs: { strict: false } },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    // Needed for `?inline` CSS imports.
    css: { include: [/.+/] },
  },
});
