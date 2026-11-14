import { resolve } from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

const sharedAlias = { '@shared': resolve(__dirname, 'src/shared') };

export default defineConfig({
  main: {
    resolve: { alias: sharedAlias },
  },
  preload: {
    resolve: { alias: sharedAlias },
    build: {
      // Sandboxed preload scripts cannot `require` npm packages at runtime,
      // so every dependency must be bundled into the preload output.
      externalizeDeps: false,
    },
  },
  renderer: {
    resolve: {
      alias: {
        ...sharedAlias,
        '@': resolve(__dirname, 'src/renderer/src'),
      },
    },
    plugins: [react(), tailwindcss()],
    build: {
      // Los subtítulos (.vtt) se copian siempre como archivo: si Vite los
      // incrustara como `data:`, la CSP (`default-src 'self'`) los bloquearía.
      assetsInlineLimit: (filePath) => (filePath.endsWith('.vtt') ? false : undefined),
    },
  },
});
