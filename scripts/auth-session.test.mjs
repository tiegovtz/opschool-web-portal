import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { transpileModule } from 'typescript';
import * as educationRoutes from '../app/utilities/educationRoute.ts';
import {
  createSessionLifecycle,
  createSessionFetch,
  readSessionCookies,
  tokenExpiresAt,
} from '../shared/auth/session.ts';

const require = createRequire(import.meta.url);
const { createRouter, createMemoryHistory } = createRequire(require.resolve('nuxt/package.json'))('vue-router');
const pluginSource = await readFile(new URL('../app/plugins/auth-session.client.ts', import.meta.url), 'utf8');
const { outputText: sessionPlugin } = transpileModule(pluginSource.replaceAll('import.meta.hot', 'false'), {
  compilerOptions: { module: 1, target: 9 },
});

async function sessionRedirect(base, currentPath, reason) {
  const router = createRouter({
    history: createMemoryHistory(base),
    routes: [{ path: '/:pathMatch(.*)*', component: {} }],
  });
  await router.push(currentPath);
  let lifecycle;
  let destination;
  const exports = {};
  vm.runInNewContext(sessionPlugin, {
    exports, URL, URLSearchParams,
    require(name) {
      if (name === '~/stores/auth') return { useAuthStore: () => ({}) };
      if (name === '~/stores/navigationStore') return { useNavigationStore: () => ({}) };
      if (name === '~/utilities/educationRoute') return educationRoutes;
      if (name === '~~/shared/auth/session') return {
        createSessionLifecycle(options) { lifecycle = options; return { check() {} }; },
        createSessionFetch: () => () => {},
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    defineNuxtPlugin: plugin => plugin,
    useRouter: () => router,
    useHubEducationLevel: () => ({ value: 'secondary' }),
    useCookie: () => ({ value: null }),
    nextTick: () => Promise.resolve(),
    setInterval: () => 1,
    window: {
      location: { origin: 'https://opschool.tie.go.tz', replace: value => { destination = value; } },
      addEventListener() {}, fetch() {},
    },
    document: { addEventListener() {} },
  });
  exports.default.setup({ hook() {} });
  lifecycle.redirect(reason);
  await Promise.resolve();
  return new URL(destination, 'https://opschool.tie.go.tz');
}

test('expiry redirects through the app base and keeps a safe return route', async () => {
  for (const base of ['/', '/portal/']) {
    const destination = await sessionRedirect(base, '/secondary/topic?lang=en&auth-token=secret#question-2', 'expired');
    assert.equal(destination.pathname, `${base}auth`);
    assert.equal(destination.searchParams.get('reason'), 'session-expired');
    assert.equal(destination.searchParams.get('redirect'), '/secondary/topic?lang=en#question-2');
    assert.ok(!destination.href.includes('secret'));
  }
});

test('expiry on an auth page stays under the app base without a return loop', async () => {
  for (const base of ['/', '/portal/']) {
    const destination = await sessionRedirect(base, '/auth/SignUp', 'expired');
    assert.equal(destination.pathname, `${base}auth`);
    assert.equal(destination.searchParams.get('reason'), 'session-expired');
    assert.equal(destination.searchParams.has('redirect'), false);
  }
});

test('logout retains the app base when returning to either education hub', async () => {
  for (const base of ['/', '/portal/']) {
    for (const hub of ['primary', 'secondary']) {
      const destination = await sessionRedirect(base, `/${hub}/topic`, 'logout');
      assert.equal(destination.pathname, `${base}${hub}`);
      assert.equal(destination.search, '');
    }
  }
});

const jwt = (exp, extra = {}) => `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ exp, ...extra })).toString('base64url')}.signature`;

function browser() {
  const shared = {
    now: 1_000_000,
    cookies: { accessToken: jwt(1100), refreshToken: 'refresh', user: { name: 'Learner' } },
    marker: null,
    publications: [],
  };
  const tab = () => {
    const timers = new Map();
    const redirects = [];
    let memoryToken = shared.cookies.accessToken;
    let cleared = 0;
    const lifecycle = createSessionLifecycle({
      readCookies: () => shared.cookies,
      readEndMarker: () => shared.marker,
      clear() {
        shared.cookies = { accessToken: null, refreshToken: null, user: null };
        memoryToken = null;
        cleared++;
      },
      publish(reason) {
        shared.publications.push(reason);
        shared.marker = JSON.stringify({ reason, id: shared.publications.length });
      },
      redirect: (reason) => redirects.push(reason),
      syncToken: (token) => { memoryToken = token; },
      now: () => shared.now,
      schedule(callback, delay) {
        const id = {};
        timers.set(id, { callback, at: shared.now + delay });
        return id;
      },
      cancel: (id) => timers.delete(id),
    });
    return {
      ...lifecycle, redirects, timers,
      get memoryToken() { return memoryToken; },
      get cleared() { return cleared; },
      wake() {
        for (const [id, timer] of timers) {
          if (timer.at <= shared.now) {
            timers.delete(id);
            timer.callback();
          }
        }
      },
    };
  };
  return { shared, tab };
}

test('logout clears every tab, including a suspended tab, without rebroadcast loops', () => {
  const { shared, tab } = browser();
  const tabs = [tab(), tab(), tab()];
  tabs.forEach((current) => assert.equal(current.check(), true));
  tabs[0].end('logout');
  tabs[1].end('logout', false); // Live cross-tab event.
  shared.now += 60_000;
  tabs[2].check(); // Suspended tab resumes after missing the event.
  for (const current of tabs) {
    current.end('logout');
    current.check();
    assert.equal(current.memoryToken, null);
    assert.equal(current.cleared, 1);
    assert.equal(current.timers.size, 0);
    assert.deepEqual(current.redirects, ['logout']);
  }
  assert.deepEqual(shared.publications, ['logout']);
});

test('expiry ends an idle page at the token deadline and expires its other tabs', () => {
  const { shared, tab } = browser();
  const first = tab();
  const second = tab();
  first.check();
  second.check();
  shared.now = 1_100_000;
  first.wake();
  second.check();
  assert.deepEqual(first.redirects, ['expired']);
  assert.deepEqual(second.redirects, ['expired']);
  assert.deepEqual(shared.cookies, { accessToken: null, refreshToken: null, user: null });
  assert.deepEqual(shared.publications, ['expired']);
});

test('browser cookie expiry ends the session even when all user information disappeared', () => {
  const { shared, tab } = browser();
  const current = tab();
  current.check();
  shared.cookies = { accessToken: null, refreshToken: null, user: null };
  assert.equal(current.check(), false);
  assert.deepEqual(current.redirects, ['expired']);
});

test('losing the signed-in user cookie cannot leave a half-authenticated page open', () => {
  const { shared, tab } = browser();
  const current = tab();
  current.check();
  shared.cookies.user = null;
  assert.equal(current.check(), false);
  assert.deepEqual(current.redirects, ['expired']);
});

test('an old expiry timer rechecks a token replaced by a later login or renewal', () => {
  const { shared, tab } = browser();
  const current = tab();
  current.check();
  const replacement = jwt(1300);
  shared.cookies.accessToken = replacement;
  shared.now = 1_100_000;
  current.wake();
  assert.deepEqual(current.redirects, []);
  assert.equal(current.memoryToken, replacement);
  assert.equal([...current.timers.values()][0].at, 1_300_000);
});

test('anonymous visitors stay on public pages; a new login after an old logout is accepted', () => {
  const { shared, tab } = browser();
  shared.cookies = { accessToken: null, refreshToken: null, user: null };
  const guest = tab();
  assert.equal(guest.check(), false);
  assert.deepEqual(guest.redirects, []);
  shared.cookies = { accessToken: jwt(1200), refreshToken: null, user: { name: 'New learner' } };
  assert.equal(guest.check(), true);
  guest.dispose();
  assert.equal(guest.timers.size, 0);
  shared.marker = JSON.stringify({ reason: 'logout', id: 'old-session' });
  assert.equal(tab().check(), true);
});

test('malformed, expired and non-expiring tokens cannot keep a session open', () => {
  for (const token of ['bad-token', jwt(undefined), jwt('1200'), jwt(null), jwt(900), jwt(1e308)]) {
    const { shared, tab } = browser();
    shared.cookies.accessToken = token;
    const current = tab();
    assert.equal(current.check(), false);
    assert.deepEqual(current.redirects, ['expired']);
  }
  assert.equal(tokenExpiresAt(jwt(1234)), 1_234_000);
});

test('reads current Nuxt cookies in both plain and JSON-encoded formats', () => {
  const token = jwt(1200);
  for (const encoded of [encodeURIComponent(token), encodeURIComponent(JSON.stringify(token))]) {
    assert.deepEqual(readSessionCookies(`other=value; signInAccessToken=${encoded}; signInRefreshToken=refresh; signInUserToken=%7B%22name%22%3A%22Learner%22%7D`), {
      accessToken: token, refreshToken: 'refresh', user: { name: 'Learner' },
    });
  }
  assert.deepEqual(readSessionCookies('signInAccessToken=null; signInRefreshToken=%bad'), {
    accessToken: null, refreshToken: null, user: null,
  });
});

test('an authenticated API 401 ends the session for fetch and Request inputs', async () => {
  for (const input of ['/api/backend/v1/auth/profile', new Request('https://portal.test/api/ai/chat')]) {
    let logouts = 0;
    const response = new Response('unauthorized', { status: 401 });
    const fetcher = createSessionFetch(async () => response, {
      origin: 'https://portal.test', readToken: () => 'token', onUnauthorized: () => logouts++,
    });
    assert.equal(await fetcher(input), response);
    assert.equal(logouts, 1);
    assert.equal(await response.text(), 'unauthorized');
  }
});

test('sign-in errors, third-party APIs, permission errors and unrelated bearer tokens do not log out the user', async () => {
  for (const [url, status, token, headers] of [
    ['/api/backend/v1/auth/login', 401, 'token'],
    ['/api/backend/v1/auth/sign-up', 401, 'token'],
    ['/api/backend/v1/auth/refresh-token', 401, 'token'],
    ['/api/backend/v1/auth/verify-code', 401, 'token'],
    ['https://other.test/api/private', 401, 'token'],
    ['/api/backend/v1/auth/profile', 403, 'token'],
    ['/api/backend/v1/auth/profile', 500, 'token'],
    ['/api/backend/v1/auth/profile', 401, null],
    ['/api/backend/v1/auth/profile', 401, 'token', { Authorization: 'Bearer old-token' }],
  ]) {
    let logouts = 0;
    const fetcher = createSessionFetch(async () => new Response(null, { status }), {
      origin: 'https://portal.test', readToken: () => token, onUnauthorized: () => logouts++,
    });
    await fetcher(url, { headers });
    assert.equal(logouts, 0, url);
  }
});

test('a late unauthorized response from an older token cannot end a newer session', async () => {
  let token = 'old-token';
  let complete;
  let logouts = 0;
  const fetcher = createSessionFetch(() => new Promise((resolve) => { complete = resolve; }), {
    origin: 'https://portal.test', readToken: () => token, onUnauthorized: () => logouts++,
  });
  const pending = fetcher('/api/backend/v1/auth/profile');
  token = 'new-token';
  complete(new Response(null, { status: 401 }));
  await pending;
  assert.equal(logouts, 0);
});

test('network failures remain retryable errors without ending a session', async () => {
  let logouts = 0;
  const error = new TypeError('Failed to fetch');
  const fetcher = createSessionFetch(async () => { throw error; }, {
    origin: 'https://portal.test', readToken: () => 'token', onUnauthorized: () => logouts++,
  });
  await assert.rejects(fetcher('/api/backend/v1/auth/profile'), error);
  assert.equal(logouts, 0);
});
