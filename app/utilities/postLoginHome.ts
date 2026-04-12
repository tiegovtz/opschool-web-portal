const STORAGE_KEY = "tie-post-login-home";

export const setPostLoginHome = (path: string) => {
  if (!import.meta.client) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Returns stored path once, then clears it. */
export const consumePostLoginHome = (): string | null => {
  if (!import.meta.client) return null;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v) sessionStorage.removeItem(STORAGE_KEY);
    return v;
  } catch {
    return null;
  }
}
