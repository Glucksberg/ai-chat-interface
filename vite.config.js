import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// Plugin para transformar arquivos HTML em módulos importáveis
function htmlImportPlugin() {
  return {
    name: 'vite-plugin-html-import',
    transform(code, id) {
      if (id.endsWith('.html?raw')) {
        return `export default ${JSON.stringify(code)}`;
      }
    }
  };
}



export default defineConfig({
  root: 'frontend',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    htmlImportPlugin(),
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend'),
      '@components': resolve(__dirname, 'frontend/components'),
      '@js': resolve(__dirname, 'frontend/js'),
      '@css': resolve(__dirname, 'frontend/css'),
    },
  },
});
