import { createHash } from "node:crypto";
import type { H3Event } from "h3";
import { backendProxyBaseUrl } from "../../shared/backend/proxy";

/**
 * Validate a student's session token against the main API
 * (`GET /auth/profile` with the token as Bearer) and cache the answer briefly,
 * so AI routes can require a real session without one profile call per request.
 */

export type SessionUser = {
  userId: string;
  profile: Record<string, any>;
};

export type SessionCheck =
  | { status: "valid"; user: SessionUser }
  | { status: "invalid" }
  | { status: "unavailable"; message: string };

const VALID_TTL_MS = 60 * 1000;
const INVALID_TTL_MS = 10 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const PROFILE_TIMEOUT_MS = 8000;

const sessionCache = new Map<string, { expiresAt: number; check: SessionCheck }>();
const inflight = new Map<string, Promise<SessionCheck>>();

function tokenKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Session token from the `signInAccessToken` cookie, else an Authorization Bearer header. */
export function readSessionToken(event: H3Event): string | undefined {
  const cookie = getCookie(event, "signInAccessToken")?.trim();
  if (cookie) return cookie;
  const header = getHeader(event, "authorization")?.trim() || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const bearer = match?.[1]?.trim();
  return bearer && bearer !== "undefined" && bearer !== "null" ? bearer : undefined;
}

function profileUrl(): string {
  const configured = useRuntimeConfig().backendApiBaseUrl;
  const base = backendProxyBaseUrl(
    process.env.NUXT_BACKEND_API_BASE_URL,
    process.env.VITE_API_BASE_URL,
    typeof configured === "string" ? configured : undefined,
  );
  return `${base.replace(/\/+$/, "")}/auth/profile`;
}

function extractUserId(profile: any, fallback: string): string {
  const candidates = [
    profile?._id,
    profile?.id,
    profile?.userId,
    profile?.data?._id,
    profile?.data?.id,
    profile?.user?._id,
    profile?.user?.id,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number") return String(candidate);
  }
  return `token:${fallback.slice(0, 32)}`;
}

async function fetchSessionCheck(token: string, key: string): Promise<SessionCheck> {
  let response: Response;
  try {
    response = await fetch(profileUrl(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(PROFILE_TIMEOUT_MS),
    });
  } catch (error: any) {
    return {
      status: "unavailable",
      message: `Profile check failed: ${error?.name || ""} ${error?.message || String(error)}`.trim(),
    };
  }

  if (response.status === 401 || response.status === 403) {
    await response.body?.cancel().catch(() => {});
    return { status: "invalid" };
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    return { status: "unavailable", message: `Profile check returned HTTP ${response.status}` };
  }

  let profile: any = {};
  try {
    profile = await response.json();
  } catch {
    profile = {};
  }
  return { status: "valid", user: { userId: extractUserId(profile, key), profile: profile || {} } };
}

export async function validateSessionToken(token: string | undefined): Promise<SessionCheck> {
  if (!token) return { status: "invalid" };
  const key = tokenKey(token);
  const now = Date.now();

  const cached = sessionCache.get(key);
  if (cached && cached.expiresAt > now) return cached.check;
  if (cached) sessionCache.delete(key);

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = fetchSessionCheck(token, key)
    .then((check) => {
      // Outages are not cached, so recovery is immediate.
      if (check.status !== "unavailable") {
        sessionCache.set(key, {
          expiresAt: Date.now() + (check.status === "valid" ? VALID_TTL_MS : INVALID_TTL_MS),
          check,
        });
        while (sessionCache.size > MAX_CACHE_ENTRIES) {
          const oldest = sessionCache.keys().next().value;
          if (oldest === undefined) break;
          sessionCache.delete(oldest);
        }
      }
      return check;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/**
 * Require a valid session for this request. Throws 401 (code auth) when the
 * token is missing or rejected, 503 when the main API cannot be reached.
 */
export async function requireSessionUser(event: H3Event): Promise<SessionUser> {
  const existing = event.context.sessionUser as SessionUser | undefined;
  if (existing) return existing;

  const token = readSessionToken(event);
  const check = await validateSessionToken(token);
  if (check.status === "valid") {
    event.context.sessionUser = check.user;
    return check.user;
  }
  if (check.status === "unavailable") {
    console.error("[session-auth] could not verify session", { message: check.message });
    throw createError({
      statusCode: 503,
      message: "Your session could not be verified right now. Please try again shortly.",
      data: { code: "provider" },
    });
  }
  throw createError({
    statusCode: 401,
    message: "Please sign in to use this feature.",
    data: { code: "auth" },
  });
}
