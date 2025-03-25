import { defineConfig } from 'vite';

export default defineConfig({
  base: '/whitewatervibes/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'three-examples': ['three/examples/jsm/objects/Water.js', 'three/examples/jsm/objects/Sky.js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three']
  },
  server: {
    port: 3000,
    open: true
  }
}); 