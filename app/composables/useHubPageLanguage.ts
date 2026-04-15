import { computed, watch } from "vue";
import type { LanguageSupport } from "~/types/language.interface";
import {
  normalizeEducationLevel,
  normalizeLanguageSupport,
  resolveEducationLevelFromRoute,
} from "~/utilities/educationRoute";

export function useHubPageLanguage() {
  const route = useRoute();
  const hubHeaderLang = useHubHeaderLanguage();
  const hubEducationLevel = useHubEducationLevel();
  const primaryContentLanguage = usePrimaryContentLanguage();

  const pageEducationLevel = computed(() =>
    resolveEducationLevelFromRoute(
      route,
      normalizeEducationLevel(hubEducationLevel.value),
    ),
  );

  const pageLanguage = computed<LanguageSupport>(() =>
    pageEducationLevel.value === "primary"
      ? normalizeLanguageSupport(primaryContentLanguage.value, "kiswahili")
      : "english",
  );

  watch(
    [pageLanguage, pageEducationLevel],
    ([language, educationLevel]) => {
      hubEducationLevel.value =
        educationLevel === "primary" ? "primary" : "secondary";
      hubHeaderLang.value = language;
      if (educationLevel === "primary") {
        primaryContentLanguage.value = language;
      }
    },
    { immediate: true },
  );

  return pageLanguage;
}
