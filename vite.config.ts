import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// PROTOTYPE=1 builds one self-contained HTML file (fonts, data and audio inlined) for preview.
const single = process.env.PROTOTYPE === '1';

export default defineConfig({
  base: './',
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
  build: single ? { assetsInlineLimit: 100_000_000, cssCodeSplit: false } : {},
});
