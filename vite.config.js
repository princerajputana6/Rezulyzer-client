import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Emit Cloudflare Pages SPA redirects file into build output
    {
      name: 'emit-cloudflare-redirects',
      generateBundle() {
        const redirects = '/*\n/index.html 200\n';
        this.emitFile({ type: 'asset', fileName: '_redirects', source: redirects });
      }
    }
  ],
  server: {
    port: 3000,
    open: false
  },
  preview: {
    port: 3000,
    open: false
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/setupTests.js']
  }
});
