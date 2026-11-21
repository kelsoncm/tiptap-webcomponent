import { defineConfig } from 'vite';

// `vite build`: ESM library with dependencies external (for bundlers).
// `vite build --mode bundle`: single self-contained file for <script type="module">.
export default defineConfig(({ mode }) => {
  const bundle = mode === 'bundle';
  return {
    // The core may be linked from a sibling folder during development.
    server: { fs: { strict: false } },
    build: {
      emptyOutDir: !bundle,
      sourcemap: true,
      lib: {
        entry: 'src/index.ts',
        formats: ['es'],
        fileName: () => (bundle ? 'kelsoncm-tiptap.bundle.js' : 'index.js'),
      },
      rollupOptions: bundle ? {} : { external: [/^@tiptap\//, /^@kelsoncm\/tiptap-core/] },
    },
  };
});
