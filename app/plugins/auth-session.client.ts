import { useAuthStore } from '~/stores/auth';
import { useNavigationStore } from '~/stores/navigationStore';
import { getHubPath, normalizeEducationLevel, resolveEducationLevelFromRoute } from '~/utilities/educationRoute';
import {
  AUTH_COOKIE_NAMES,
  SESSION_END_KEY,
  createSessionFetch,
  createSessionLifecycle,
  readSessionCookies,
  sessionEndReason,
} from '~~/shared/auth/session';

export default defineNuxtPlugin({
  name: 'auth-session',
  dependsOn: ['pinia'],
  setup(nuxtApp) {
    const router = useRouter();
    const authStore = useAuthStore();
    const navigationStore = useNavigationStore();
    const hubEducationLevel = useHubEducationLevel();
    const accessToken = useCookie<string | null>('signInAccessToken');
    const refreshToken = useCookie<string | null>('signInRefreshToken');
    const user = useCookie('signInUserToken');
    const readCookies = () => readSessionCookies(document.cookie);
    const readEndMarker = () => {
      try { return localStorage.getItem(SESSION_END_KEY); } catch { return null; }
    };
    // BroadcastChannel also covers browsers where storage access is disabled.
    let channel: BroadcastChannel | undefined;
    try {
      if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(SESSION_END_KEY);
    } catch { /* Cookie checks still detect a logout when this tab becomes active. */ }

    const session = createSessionLifecycle({
      readCookies,
      readEndMarker,
      clear() {
        accessToken.value = null;
        refreshToken.value = null;
        user.value = null;
        // Delete synchronously so an in-flight refresh cannot restore the session.
        for (const name of AUTH_COOKIE_NAMES) {
          document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict`;
          refreshCookie(name);
        }
        authStore.clearToken();
        try { localStorage.removeItem('auth_token'); } catch { /* Storage may be disabled. */ }
        navigationStore.resetRememberedRoutes();
      },
      publish(reason) {
        const marker = JSON.stringify({ reason, id: `${Date.now()}:${Math.random()}` });
        try { localStorage.setItem(SESSION_END_KEY, marker); } catch { /* Use the channel below. */ }
        channel?.postMessage(marker);
      },
      redirect(reason) {
        const current = router.currentRoute.value;
        const hub = getHubPath(resolveEducationLevelFromRoute(current, normalizeEducationLevel(hubEducationLevel.value)));
        let destination = router.resolve(hub).href;
        if (reason === 'expired') {
          const query = new URLSearchParams({ reason: 'session-expired' });
          // Never preserve a token supplied in a URL after the session has ended.
          const path = new URL(current.fullPath, window.location.origin);
          path.searchParams.delete('auth-token');
          if (current.path !== '/auth' && !current.path.startsWith('/auth/')) {
            query.set('redirect', `${path.pathname}${path.search}${path.hash}`);
          }
          destination = `/auth?${query}`;
        }
        // Reload to discard user data, captured bearer tokens, media and pending work.
        void nextTick().then(() => window.location.replace(destination));
      },
      syncToken: (token) => authStore.setToken(token),
      now: Date.now,
      schedule: (callback, delay) => setTimeout(callback, delay),
      cancel: (timer) => clearTimeout(timer),
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_END_KEY && event.newValue && event.newValue === readEndMarker()) {
        const reason = sessionEndReason(event.newValue);
        if (reason) session.end(reason, false);
      }
    };
    if (channel) channel.onmessage = (event: MessageEvent) => {
      const reason = sessionEndReason(typeof event.data === 'string' ? event.data : null);
      if (reason) session.end(reason, false);
    };
    const check = () => { session.check(); };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    document.addEventListener('visibilitychange', onVisible);
    // Also catches cookie expiry/deletion without a navigation or a browser cookie event.
    const interval = setInterval(check, 15_000);
    const removeRouteHook = router.afterEach(check);
    const originalFetch = window.fetch;
    const sessionFetch = createSessionFetch(originalFetch.bind(window), {
      origin: window.location.origin,
      readToken: () => readCookies().accessToken,
      onUnauthorized: () => session.end('expired'),
    });
    window.fetch = sessionFetch;
    nuxtApp.hook('app:mounted', check);

    if (import.meta.hot) import.meta.hot.dispose(() => {
      session.dispose();
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
      document.removeEventListener('visibilitychange', onVisible);
      removeRouteHook();
      channel?.close();
      if (window.fetch === sessionFetch) window.fetch = originalFetch;
    });

    return { provide: { authSession: session } };
  },
});
