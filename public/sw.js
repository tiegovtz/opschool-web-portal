// Retirement worker: existing browsers update this URL even when a cached page
// still tries to load the old app. New pages never register a service worker.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.registration.unregister();
    try {
      const names = await caches.keys();
      await Promise.all(names
        .filter(name => name.startsWith('opschool-') ||
          (name.startsWith('workbox-') && name.endsWith(self.registration.scope)))
        .map(name => caches.delete(name)));
    } finally {
      // Reload only this worker's clients so cached pages pick up the new app.
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map(client => client.navigate(client.url)));
    }
  })());
});
