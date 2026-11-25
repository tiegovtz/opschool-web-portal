import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { loadNuxt } from 'nuxt';

test('serialized service worker routes protect media and APIs at root and /portal/', async () => {
  const app = await loadNuxt({
    cwd: new URL('..', import.meta.url).pathname,
    envName: 'production', overrides: { dev: false }, ready: false,
  });
  try {
    for (const base of ['/', '/portal/']) {
      const location = new URL(`https://opschool.tie.go.tz${base}sw.js`);
      // Workbox serializes these callbacks; they cannot rely on module closures.
      const routes = app.options.pwa.workbox.runtimeCaching.map(route => ({
        ...route,
        match: vm.runInNewContext(`(${route.urlPattern.toString()})`, { URL, location }),
      }));
      const routeFor = (path, { destination = '', range = false, mode = 'cors' } = {}) => {
        const url = new URL(path, location);
        const request = { method: 'GET', destination, mode, headers: new Headers(range ? { Range: 'bytes=100-199' } : {}) };
        return routes.find(route => route.match({ url, request }));
      };
      assert.equal(routeFor(`${base}api/video/123`).handler, 'NetworkOnly');
      assert.equal(routeFor(`${base}api/video/123`, { destination: 'video' }).handler, 'NetworkOnly');
      assert.equal(routeFor(`${base}api/video/123`, { range: true }).handler, 'NetworkOnly');
      assert.equal(routeFor(`${base}uploads/song.mp3`, { destination: 'audio' }).handler, 'NetworkOnly');
      assert.equal(routeFor('https://media.example/movie.mp4', { destination: 'video' }).handler, 'NetworkOnly');
      assert.equal(routeFor(`${base}api/library/123`, { range: true }).handler, 'NetworkOnly');
      for (const path of ['backend/v1/videos', 'auth/profile', 'profile', 'chat/1', 'progress/1', 'recommendations', 'conversation/engage']) {
        assert.equal(routeFor(`${base}api/${path}`).handler, 'NetworkOnly', `${base}api/${path}`);
      }
      assert.equal(routeFor(`${base}api/library/book`).options.cacheName, 'opschool-adt-publications');
      assert.equal(routeFor(`${base}api/adt/catalogue`).options.cacheName, 'opschool-adt-catalogue');
      assert.equal(routeFor(`${base}images/cover.webp`, { destination: 'image' }).handler, 'StaleWhileRevalidate');
      assert.equal(routeFor(`${base}secondary`, { mode: 'navigate' }).handler, 'NetworkFirst');
    }
  } finally {
    await app.close();
  }
});
