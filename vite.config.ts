import { defineConfig } from 'vite';

export default defineConfig(() => {
    return {
      base: './', // Important for Electron
      server: {
        host: true,
        open: true,
        port: 5173,
        strictPort: false
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks: undefined
          }
        }
      }
    };
});
