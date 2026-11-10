import { computed, watch } from "vue";
import type { LanguageSupport } from "~/types/language.interface";
import {
  getEducationHubBucket,
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
    getEducationHubBucket(pageEducationLevel.value) === "primary"
      ? normalizeLanguageSupport(primaryContentLanguage.value, "kiswahili")
      : "english",
  );

  watch(
    [pageLanguage, pageEducationLevel],
    ([language, educationLevel]) => {
      const hub = getEducationHubBucket(educationLevel) ?? "secondary";
      if (hubEducationLevel.value !== hub) hubEducationLevel.value = hub;
      hubHeaderLang.value = language;
      if (hub === "primary") {
        primaryContentLanguage.value = language;
      }
    },
    { immediate: true },
  );

  return pageLanguage;
}
