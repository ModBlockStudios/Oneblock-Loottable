import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Site projet GitHub Pages : servi sous /Oneblock-Loottable/.
// On peut surcharger via la variable d'env BASE_PATH (ex. '/' en local).
export default defineConfig({
  base: process.env.BASE_PATH || '/Oneblock-Loottable/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
