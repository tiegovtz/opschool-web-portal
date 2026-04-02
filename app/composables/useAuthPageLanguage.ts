import { computed } from "vue";
import type { LanguageSupport } from "~/types/language.interface";
import { getHubLanguage, normalizeEducationLevel } from "~/utilities/educationRoute";

export function useAuthPageLanguage() {
  const route = useRoute();
  const primaryContentLanguage = usePrimaryContentLanguage();
  const hubEducationLevel = useHubEducationLevel();

  return computed<LanguageSupport>(() => {
    const redirectTarget =
      typeof route.query.redirect === "string" ? route.query.redirect : "";
    const [redirectPath, redirectQuery = ""] = redirectTarget.split("?");
    const redirectSearchParams = new URLSearchParams(redirectQuery);

    const educationLevel = redirectPath.startsWith("/primary")
      ? "primary"
      : redirectPath.startsWith("/secondary")
        ? "secondary"
        : normalizeEducationLevel(hubEducationLevel.value, "secondary");

    const preferredLanguage =
      redirectSearchParams.get("lang") ??
      (typeof route.query.lang === "string" ? route.query.lang : null) ??
      primaryContentLanguage.value;

    return getHubLanguage(educationLevel, preferredLanguage);
  });
}
