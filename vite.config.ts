import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // tutti i riferimenti diventeranno ./assets/… anziché /assets/…
});
