import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const retirementWorker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');

async function retire(base, cacheError = false) {
  const handlers = {};
  const events = [];
  const scope = `https://opschool.tie.go.tz${base}`;
  vm.runInNewContext(retirementWorker, {
    self: {
      addEventListener: (name, handler) => { handlers[name] = handler; },
      skipWaiting: async () => { events.push('skipWaiting'); },
      registration: {
        scope,
        unregister: async () => { events.push('unregister'); return true; },
      },
      clients: {
        matchAll: async options => {
          assert.equal(options.type, 'window');
          // ServiceWorkerGlobalScope returns only this worker's controlled clients.
          assert.equal(options.includeUncontrolled, undefined);
          return [{ url: `${scope}secondary/topic`, navigate: async url => { events.push(url); } }];
        },
      },
    },
    caches: {
      keys: async () => {
        if (cacheError) throw new Error('Cache storage unavailable');
        return ['opschool-static-resources', 'opschool-pages', `workbox-precache-v2-${scope}`,
          'another-app', 'workbox-precache-v2-https://opschool.tie.go.tz/another-app/'];
      },
      delete: async name => { events.push(name); return true; },
    },
  });
  let pending;
  const event = { waitUntil: promise => { pending = promise; } };
  handlers.install(event);
  await pending;
  handlers.activate(event);
  if (cacheError) await assert.rejects(pending, /Cache storage unavailable/);
  else await pending;
  return { scope, events };
}

test('the retirement worker clears old PWA caches at root and /portal/ without touching other apps', async () => {
  for (const base of ['/', '/portal/']) {
    const { scope, events } = await retire(base);
    assert.deepEqual(events, ['skipWaiting', 'unregister', 'opschool-static-resources',
      'opschool-pages', `workbox-precache-v2-${scope}`, `${scope}secondary/topic`]);
  }
});

test('the retirement worker reloads its clients even when cache storage fails', async () => {
  const { scope, events } = await retire('/portal/', true);
  assert.deepEqual(events, ['skipWaiting', 'unregister', `${scope}secondary/topic`]);
});
