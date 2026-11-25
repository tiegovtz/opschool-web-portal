import { jwtDecode } from 'jwt-decode';

export const AUTH_COOKIE_NAMES = ['signInAccessToken', 'signInRefreshToken', 'signInUserToken'] as const;
export const SESSION_END_KEY = 'tie:session-ended';
export type SessionEndReason = 'logout' | 'expired';

export interface SessionCookies {
  accessToken: string | null;
  refreshToken: string | null;
  user: unknown;
}

/** Read the browser cookie jar, rather than a possibly stale per-tab cookie ref. */
export function readSessionCookies(cookieHeader: string): SessionCookies {
  const cookies = new Map(cookieHeader.split(';').map((part) => {
    const separator = part.indexOf('=');
    return [part.slice(0, separator).trim(), part.slice(separator + 1)] as const;
  }));
  const read = (name: string): unknown => {
    const raw = cookies.get(name);
    if (!raw) return null;
    try {
      const decoded = decodeURIComponent(raw);
      try { return JSON.parse(decoded); } catch { return decoded; }
    } catch { return null; }
  };
  const token = (name: string) => {
    const value = read(name);
    return typeof value === 'string' && value.trim() ? value : null;
  };
  return {
    accessToken: token('signInAccessToken'),
    refreshToken: token('signInRefreshToken'),
    user: read('signInUserToken'),
  };
}

export function tokenExpiresAt(token: string): number {
  try {
    const { exp } = jwtDecode(token);
    const expiresAt = typeof exp === 'number' ? exp * 1000 : 0;
    return Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : 0;
  } catch { return 0; }
}

export function sessionEndReason(marker: string | null): SessionEndReason | null {
  try {
    const reason = JSON.parse(marker || '').reason;
    return reason === 'logout' || reason === 'expired' ? reason : null;
  } catch { return null; }
}

export interface SessionLifecycleOptions {
  readCookies: () => SessionCookies;
  readEndMarker: () => string | null;
  clear: () => void;
  publish: (reason: SessionEndReason) => void;
  redirect: (reason: SessionEndReason) => void;
  syncToken: (token: string) => void;
  now: () => number;
  schedule: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
}

/** One terminal logout per tab; expiry always re-reads shared cookies before acting. */
export function createSessionLifecycle(options: SessionLifecycleOptions) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ended = false;
  let hadSession = false;
  let hadUser = false;
  let marker = options.readEndMarker();

  const stopTimer = () => {
    if (timer !== undefined) options.cancel(timer);
    timer = undefined;
  };
  const end = (reason: SessionEndReason, broadcast = true) => {
    if (ended) return;
    ended = true;
    stopTimer();
    options.clear();
    if (broadcast) options.publish(reason);
    options.redirect(reason);
  };
  const check = (): boolean => {
    if (ended) return false;
    stopTimer();
    const nextMarker = options.readEndMarker();
    if (nextMarker !== marker) {
      marker = nextMarker;
      const reason = sessionEndReason(marker);
      if (reason) {
        end(reason, false);
        return false;
      }
    }

    const { accessToken, refreshToken, user } = options.readCookies();
    if (!accessToken) {
      if (hadSession || refreshToken || user) end('expired');
      return false;
    }
    hadSession = true;
    if (hadUser && !user) {
      end('expired');
      return false;
    }
    hadUser ||= Boolean(user);
    const remaining = tokenExpiresAt(accessToken) - options.now();
    if (remaining <= 0) {
      end('expired');
      return false;
    }
    options.syncToken(accessToken);
    timer = options.schedule(check, Math.min(remaining, 2_147_483_647));
    return true;
  };

  return { check, end, dispose: stopTimer };
}

const PUBLIC_AUTH_PATH = /\/auth\/(?:login|sign-up|choose-identity|refresh-token|request-code|verify-code|forgot-password(?:-student)?|reset-password|user-exists)(?:\/|$)/;

/** Observe only this portal's authenticated APIs, never third-party or sign-in failures. */
export function createSessionFetch(
  fetcher: typeof fetch,
  options: { origin: string; readToken: () => string | null; onUnauthorized: () => void },
): typeof fetch {
  return async (input, init) => {
    const token = options.readToken();
    const url = new URL(input instanceof Request ? input.url : String(input), options.origin);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const authorization = headers.get('authorization');
    const credentials = init?.credentials ?? (input instanceof Request ? input.credentials : undefined);
    const usesSession = !!token && (authorization === `Bearer ${token}` || (!authorization && credentials !== 'omit'));
    const observe = usesSession && url.origin === options.origin && url.pathname.startsWith('/api/') && !PUBLIC_AUTH_PATH.test(url.pathname);
    const response = await fetcher(input, init);
    // Ignore a late response from an older session or a token replaced during the request.
    if (observe && response.status === 401 && options.readToken() === token) options.onUnauthorized();
    return response;
  };
}
