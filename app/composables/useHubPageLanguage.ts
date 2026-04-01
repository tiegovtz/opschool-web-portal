import { computed, watch } from "vue";
import type { LanguageSupport } from "~/types/language.interface";
import { normalizeLanguageSupport } from "~/utilities/educationRoute";

export function useHubPageLanguage() {
  const hubHeaderLang = useHubHeaderLanguage();
  const hubEducationLevel = useHubEducationLevel();
  const primaryContentLanguage = usePrimaryContentLanguage();

  const pageLanguage = computed<LanguageSupport>(() =>
    hubEducationLevel.value === "primary"
      ? normalizeLanguageSupport(primaryContentLanguage.value, "kiswahili")
      : "english",
  );

  watch(
    pageLanguage,
    (language) => {
      hubHeaderLang.value = language;
    },
    { immediate: true },
  );

  return pageLanguage;
}
