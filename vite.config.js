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
      // Service worker écrit à la main (src/sw.js) plutôt que généré : nécessaire pour gérer
      // les évènements push/notificationclick (notifications), impossibles à personnaliser
      // avec le mode généré automatiquement.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
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
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}']
      }
    })
  ]
});
