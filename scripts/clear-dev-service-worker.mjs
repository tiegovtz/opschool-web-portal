// This function is serialized into the dev page's head so it can recover the
// browser even when a stale PWA cache prevents the Nuxt entry module loading.
export async function clearDevServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const worker = registration?.active || registration?.waiting || registration?.installing;
  if (!worker || !/\/(?:sw|dev-sw)\.js$/.test(new URL(worker.scriptURL).pathname)) return;

  const wasControlled = Boolean(navigator.serviceWorker.controller);
  if (!await registration.unregister()) return;

  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names
        .filter(name => name.startsWith('opschool-') ||
          (name.startsWith('workbox-') && name.endsWith(registration.scope)))
        .map(name => caches.delete(name)));
    }
  } finally {
    // A new document is needed to detach the current service worker controller.
    if (wasControlled) location.reload();
  }
}
