const CACHE_NAME = 'cnts-portal-v2';
const CACHE_PREFIX = 'cnts-portal-';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

/*
 * Aucun intercepteur fetch volontairement : les fichiers Next.js portent un
 * hash et doivent toujours suivre le déploiement courant. Le navigateur garde
 * son cache HTTP normal sans qu'un worker puisse servir une ancienne page.
 */
