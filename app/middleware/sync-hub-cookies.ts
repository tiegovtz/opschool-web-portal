import {
  getEducationHubBucket,
  getHubLanguage,
  resolveEducationLevelFromRoute,
  resolveRouteLanguage,
} from "~/utilities/educationRoute";

// Streaming commits response headers before the page renders. Persist the hub
// selection here so the page's immediate watcher has no cookie changes to send.
export default defineNuxtRouteMiddleware((to) => {
  const hub = to.path === "/"
    ? "secondary"
    : getEducationHubBucket(to.params.educationLevel);
  if (!hub) return;

  const headerLanguage = useHubHeaderLanguage();
  const educationLevel = useHubEducationLevel();
  const primaryLanguage = usePrimaryContentLanguage();
  const resolvedLevel = resolveEducationLevelFromRoute(to);
  const language = getHubLanguage(
    resolvedLevel,
    resolveRouteLanguage(to, resolvedLevel, primaryLanguage.value),
  );

  if (headerLanguage.value !== language) headerLanguage.value = language;
  if (educationLevel.value !== hub) educationLevel.value = hub;
  if (hub === "primary" && primaryLanguage.value !== language) {
    primaryLanguage.value = language;
  }
});
