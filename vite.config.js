import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    open: '/index.html',
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});