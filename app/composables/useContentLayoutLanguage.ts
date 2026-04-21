import { computed, watch, toValue, type MaybeRefOrGetter } from "vue";
import type { LanguageSupport } from "~/types/language.interface";
import { inferHubLanguageFromContentRoute } from "~/utilities/contentHubLanguage";
import { resolveEducationLevelFromRoute } from "~/utilities/educationRoute";

/**
 * Header/footer language for `home-layout` on content routes: Primary → kiswahili, Secondary → english.
 * Syncs `useHubHeaderLanguage` when the route implies a hub; otherwise keeps the existing cookie.
 */
export function useContentLayoutLanguage(levelSource?: MaybeRefOrGetter<unknown>) {
  const route = useRoute();
  const hub = useHubHeaderLanguage();
  const primaryContentLanguage = usePrimaryContentLanguage();
  const hubEducationLevel = useHubEducationLevel();

  const resolveLevel = () => {
    if (levelSource !== undefined) return toValue(levelSource);
    return route.params.level;
  };

  const isPrimaryContentRoute = computed(() => {
    return resolveEducationLevelFromRoute(route) === "primary";
  });

  const layoutLanguage = computed<LanguageSupport>(() => {
    const inferred = inferHubLanguageFromContentRoute(
      route,
      resolveLevel(),
      primaryContentLanguage.value,
    );
    if (inferred !== null) return inferred;
    return hub.value ?? "english";
  });

  watch(
    () => [route.fullPath, levelSource !== undefined ? toValue(levelSource) : null] as const,
    () => {
      const inferred = inferHubLanguageFromContentRoute(
        route,
        resolveLevel(),
        primaryContentLanguage.value,
      );
      if (inferred !== null) {
        const nextEducationLevel = isPrimaryContentRoute.value ? "primary" : "secondary";
        if (hub.value !== inferred) {
          hub.value = inferred;
        }
        if (hubEducationLevel.value !== nextEducationLevel) {
          hubEducationLevel.value = nextEducationLevel;
        }
        if (isPrimaryContentRoute.value && primaryContentLanguage.value !== inferred) {
          primaryContentLanguage.value = inferred;
        }
      }
    },
    { immediate: true },
  );

  return layoutLanguage;
}
