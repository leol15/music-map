import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE_PATH should match your GitHub Pages repo path, e.g. /music-map/
// Set it in .env or the GitHub Actions workflow environment.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
});
