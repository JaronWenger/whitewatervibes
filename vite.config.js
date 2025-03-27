import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/whitewatervibes/',
  publicDir: 'public',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/cesium/Build/Cesium/Workers/*',
          dest: 'Workers'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/ThirdParty/*',
          dest: 'ThirdParty'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Assets/*',
          dest: 'Assets'
        },
        {
          src: 'node_modules/cesium/Build/Cesium/Widgets/*',
          dest: 'Widgets'
        },
        {
          src: 'public/models/*',
          dest: 'models'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1500
  },
  optimizeDeps: {
    exclude: ['cesium'],
    include: ['mersenne-twister', 'urijs']
  },
  resolve: {
    alias: {
      'mersenne-twister': 'mersenne-twister/src/mersenne-twister.js',
      'urijs': 'urijs/src/URI.js'
    }
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      strict: false
    }
  }
}); 