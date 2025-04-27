import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// vite.config.ts
export default defineConfig({
  base: './',       // invece del default '/'
  plugins: [react()]
});

