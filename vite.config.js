import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// L'appli est servie depuis https://tekwins.github.io/dreamlight-companion/
const base = '/dreamlight-companion/';

export default defineConfig({
  base,
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Dreamlight Compagnon',
        short_name: 'Dreamlight',
        description: 'Compagnon de jeu pour Disney Dreamlight Valley',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#14123A',
        theme_color: '#14123A',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        runtimeCaching: [
          {
            // Images du wiki : mises en cache pour l'usage hors ligne
            urlPattern: ({ url }) => url.hostname.endsWith('dreamlightvalleywiki.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'wiki-images',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
});
