import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Fallacy Forge: static SPA, hash-routed, deployable at any path (GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['brand/favicon_16.png', 'brand/favicon_32.png', 'brand/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Fallacy Forge',
        short_name: 'Fallacy Forge',
        description: 'Spot weak arguments, make them stronger, and practice deduction.',
        lang: 'en',
        theme_color: '#FAF8F4',
        background_color: '#FAF8F4',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'brand/logomark_light_128.png', sizes: '128x128', type: 'image/png' },
          { src: 'brand/logomark_light_256.png', sizes: '256x256', type: 'image/png' },
          { src: 'brand/logomark_light_512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // Only latin + latin-ext font subsets are needed for US English content.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2', '**/logo-512.png'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    target: 'es2022',
    rolldownOptions: {
      output: {
        // Keep the generated question bank in its own chunk so the app bundle
        // budget (150 KB gzip) can be measured without it.
        codeSplitting: {
          groups: [{ name: 'bank', test: /[\\/]src[\\/]data[\\/]bank\.json$/ }],
        },
      },
    },
  },
});
