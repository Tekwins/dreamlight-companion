// Service worker : mise en cache (Workbox) + notifications push.
// Écrit à la main (mode injectManifest) car le mode généré automatiquement ne permet pas
// d'ajouter les écouteurs push/notificationclick ci-dessous.
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

// Service worker écrit à la main : contrairement au mode généré automatiquement, rien n'active
// une mise à jour toute seule par défaut. Sans ça, une appli déjà installée (surtout sur mobile,
// où elle reste souvent ouverte en arrière-plan plutôt que vraiment fermée) peut continuer à
// servir une ancienne version pendant longtemps après un déploiement.
self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// Images du wiki : mises en cache pour l'usage hors ligne (reprend l'ancienne config runtimeCaching).
registerRoute(
  ({ url }) => url.hostname.endsWith('dreamlightvalleywiki.com'),
  new CacheFirst({
    cacheName: 'wiki-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

self.addEventListener('push', (event) => {
  let data = { title: 'Dreamlight Compagnon', body: '' };
  try { data = { ...data, ...event.data.json() }; } catch { /* payload non-JSON ignoré */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: { url: data.url || '/' }
    })
  );
});

// Ouvre l'appli (ou la ramène au premier plan si déjà ouverte) au clic sur la notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
