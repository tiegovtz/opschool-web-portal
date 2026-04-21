import { computed } from "vue";
import {
  getEducationHubBucket,
  normalizeEducationLevel,
  resolveEducationLevelFromRoute,
  type EducationHubBucket,
} from "~/utilities/educationRoute";

export type SelectedEducationLevel = {
  id: string;
  name: string;
};

const COOKIE_NAME = "tie-selected-education-level";

export function useSelectedEducationLevel() {
  return useCookie<SelectedEducationLevel | null>(COOKIE_NAME, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
    sameSite: "strict",
    secure: import.meta.env.PROD,
  });
}

export function useResolvedEducationLevelName() {
  const selectedEducationLevel = useSelectedEducationLevel();
  const route = useRoute();

  return computed(() => {
    const selectedName = selectedEducationLevel.value?.name?.trim();
    if (selectedName) return selectedName;
    return resolveEducationLevelFromRoute(route);
  });
}

export function useResolvedEducationHubBucket() {
  const selectedEducationLevel = useSelectedEducationLevel();
  const route = useRoute();

  return computed<EducationHubBucket>(() => {
    const selectedBucket = getEducationHubBucket(selectedEducationLevel.value?.name);
    if (selectedBucket) return selectedBucket;

    const routeBucket = getEducationHubBucket(route.params.educationLevel ?? route.path);
    if (routeBucket) return routeBucket;

    return normalizeEducationLevel(resolveEducationLevelFromRoute(route)) === "primary"
      ? "primary"
      : "secondary";
  });
}
