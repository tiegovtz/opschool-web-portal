import { isTokenExpiringSoon } from "~/utilities/jwToken";
import { useNavigationStore } from "~/stores/navigationStore";

export default defineNuxtRouteMiddleware((to) => {
  const userAccessToken = useCookie("signInAccessToken");
  const navigationStore = useNavigationStore();
  const redirectTarget = to.fullPath || to.path;

  if (!userAccessToken.value || isTokenExpiringSoon(userAccessToken.value, 60)) {
    navigationStore.resetRememberedRoutes();
    return navigateTo({
      path: "/auth",
      query: { redirect: redirectTarget },
    });
  }
});
