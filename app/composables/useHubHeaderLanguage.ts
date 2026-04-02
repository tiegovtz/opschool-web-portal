import type { LanguageSupport } from "~/types/language.interface";

const COOKIE_NAME = "tie-hub-header-lang";

/**
 * Persists which hub UI the user is in (Primary / Nyumbani vs Secondary / Home)
 * so pages like profile can reuse the same header language as that hub.
 */
export function useHubHeaderLanguage() {
  return useCookie<LanguageSupport>(COOKIE_NAME, {
    default: () => "english",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
    sameSite: "strict",
    secure: import.meta.env.PROD,
  });
}
