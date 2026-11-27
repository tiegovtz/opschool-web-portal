export interface LoginLockout {
  username: string;
  expiresAt: number;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : {};
}

export function readLoginLockout(value: unknown, now: number): LoginLockout | null {
  const state = record(value);
  if (
    typeof state.username !== 'string' || !state.username.trim() ||
    typeof state.expiresAt !== 'number' || !Number.isFinite(state.expiresAt) ||
    state.expiresAt <= now || state.expiresAt > 8.64e15
  ) return null;
  return { username: state.username.trim(), expiresAt: state.expiresAt };
}

export function remainingLoginLockoutSeconds(value: unknown, username: unknown, now: number): number {
  const state = readLoginLockout(value, now);
  return state && typeof username === 'string' && state.username === username.trim()
    ? Math.ceil((state.expiresAt - now) / 1000)
    : 0;
}

export function getLoginFailure(error: unknown) {
  const failure = record(error);
  const response = record(failure.response);
  const data = record(failure.data ?? response._data);
  const body = Object.keys(record(data.data)).length ? record(data.data) : data;
  const status = Number(response.status ?? failure.status ?? failure.statusCode ?? data.statusCode ?? body.statusCode);
  const retryAfterSeconds = body.retryAfterSeconds ?? data.retryAfterSeconds;
  return {
    status,
    retryAfterSeconds: status === 429 && typeof retryAfterSeconds === 'number' &&
      Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds
      : null,
  };
}
