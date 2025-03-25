import { defineConfig } from 'vite';

export default defineConfig({
  base: '/whitewatervibes/',
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', 'three/examples/jsm/objects/Water.js', 'three/examples/jsm/objects/Sky.js']
        }
      }
    }
  },
  resolve: {
    alias: {
      'three': 'three'
    }
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/objects/Water.js', 'three/examples/jsm/objects/Sky.js']
  },
  publicDir: 'public'
}); 