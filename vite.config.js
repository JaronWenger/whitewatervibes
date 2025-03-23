import { defineConfig } from 'vite';

export default defineConfig({
  base: '/whitewatervibes/',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
}); 