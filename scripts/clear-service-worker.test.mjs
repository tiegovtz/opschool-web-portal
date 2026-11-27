import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { clearServiceWorker } from './clear-service-worker.mjs';
import { loadNuxt } from 'nuxt';

// Run the serialized head script without the application or any imported code:
// stale cached modules must not prevent recovery.
const run = globals => vm.runInNewContext(`(${clearServiceWorker.toString()})()`, { URL, ...globals });

test('a controlled page unregisters the PWA and clears its caches before reloading', async () => {
  const events = [];
  const scope = 'http://localhost:3010/';
  const registration = {
    scope,
    active: { scriptURL: `${scope}sw.js` },
    unregister: async () => { events.push('unregister'); return true; },
  };
  const cacheStorage = {
    keys: async () => ['opschool-static-resources', 'opschool-pages', `workbox-precache-v2-${scope}`, 'other-app', 'workbox-precache-v2-http://localhost:3010/another-app/'],
    delete: async name => { events.push(name); return true; },
  };
  await run({
    navigator: { serviceWorker: { controller: {}, getRegistration: async () => registration } },
    window: { caches: cacheStorage }, caches: cacheStorage,
    location: { reload: () => events.push('reload') },
  });
  assert.deepEqual(events, ['unregister', 'opschool-static-resources', 'opschool-pages', `workbox-precache-v2-${scope}`, 'reload']);
});

test('a fresh page and an unrelated service worker need no cleanup', async () => {
  await run({ navigator: {} });
  await run({ navigator: { serviceWorker: { getRegistration: async () => undefined } } });
  await run({ navigator: { serviceWorker: {
    getRegistration: async () => ({ active: { scriptURL: 'http://localhost:3010/another-worker.js' } }),
  } } });
});

test('cache storage failure still detaches the old controller by reloading', async () => {
  let reloaded = false;
  const cacheStorage = { keys: async () => { throw new Error('Cache storage unavailable'); } };
  await assert.rejects(run({
    navigator: { serviceWorker: { controller: {}, getRegistration: async () => ({
      scope: 'http://localhost:3010/', active: { scriptURL: 'http://localhost:3010/sw.js' },
      unregister: async () => true,
    }) } },
    window: { caches: cacheStorage }, caches: cacheStorage,
    location: { reload: () => { reloaded = true; } },
  }), /Cache storage unavailable/);
  assert.equal(reloaded, true);
});

test('Nuxt disables PWA and enables browser recovery in development and production', async () => {
  for (const dev of [true, false]) {
    const app = await loadNuxt({
      cwd: new URL('..', import.meta.url).pathname,
      envName: dev ? 'development' : 'production',
      overrides: { dev }, ready: false,
    });
    try {
      const recovery = app.options.app.head.script.find(script => script.key === 'clear-service-worker');
      assert.ok(recovery?.innerHTML.includes(clearServiceWorker.toString()));
      assert.equal(app.options.pwa.disable, true);
      assert.equal(app.options.pwa.manifest, false);
      assert.equal(app.options.pwa.client.registerPlugin, false);
      assert.equal(app.options.routeRules['/sw.js'].headers['cache-control'], 'no-store');
      assert.equal(app.options.routeRules['/_nuxt/**'].headers['cache-control'],
        dev ? 'no-store' : 'public, max-age=31536000, immutable');
    } finally {
      await app.close();
    }
  }
});
