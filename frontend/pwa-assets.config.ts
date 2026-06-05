import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/**
 * PWA asset generator config.
 *
 * Run once (or whenever the source SVG changes):
 *   npm run generate-pwa-assets
 *
 * This generates into public/:
 *   pwa-64x64.png, pwa-192x192.png, pwa-512x512.png,
 *   maskable-icon-512x512.png, apple-touch-icon-180x180.png
 *
 * Commit the generated PNGs; they are referenced by vite.config.ts and index.html.
 */
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
});
