import { isTokenExpiringSoon } from "~/utilities/jwToken";
import { useNavigationStore } from "~/stores/navigationStore";

export default defineNuxtRouteMiddleware((to) => {
  const userAccessToken = useCookie("signInAccessToken");
  const navigationStore = useNavigationStore();
  const { ['auth-token']: _queryToken, ...safeQuery } = to.query;
  const redirectTarget = useRouter().resolve({ path: to.path, query: safeQuery, hash: to.hash }).fullPath;
  const authenticated = import.meta.client
    ? useNuxtApp().$authSession.check()
    : userAccessToken.value && !isTokenExpiringSoon(userAccessToken.value, 0);

  if (!authenticated) {
    const hadSession = Boolean(userAccessToken.value || useCookie("signInUserToken").value || useCookie("signInRefreshToken").value);
    userAccessToken.value = null;
    useCookie("signInUserToken").value = null;
    useCookie("signInRefreshToken").value = null;
    navigationStore.resetRememberedRoutes();
    return navigateTo({
      path: "/auth",
      query: { redirect: redirectTarget, ...(hadSession ? { reason: 'session-expired' } : {}) },
    });
  }
});
