import type { LanguageSupport } from "~/types/language.interface";

const COOKIE_NAME = "tie-primary-content-lang";

/**
 * Persists the selected content language for the primary flow.
 * Secondary remains fixed to English and does not use this cookie.
 */
export function usePrimaryContentLanguage() {
  return useCookie<LanguageSupport>(COOKIE_NAME, {
    default: () => "kiswahili",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
    sameSite: "strict",
    secure: import.meta.env.PROD,
  });
}
