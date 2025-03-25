import { defineConfig } from 'vite';

export default defineConfig({
  base: '/whitewatervibes/',
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
  }
}); 