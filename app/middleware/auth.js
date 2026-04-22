import { refreshToken, isTokenExpiringSoon } from "~/utilities/jwToken";
import { useNavigationStore } from "~/stores/navigationStore";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useCookie("signInUserToken");
  const userAccessToken = useCookie("signInAccessToken");
  const navigationStore = useNavigationStore();
  const redirectTarget = to.fullPath || to.path;

  if (!user.value && !userAccessToken.value) {
    navigationStore.resetRememberedRoutes();
    return navigateTo({
      path: "/auth",
      query: { redirect: redirectTarget },
    }); // Redirect to login page
  }

  // 🔹 Check if access token is expiring soon (within 60 seconds)
  if (userAccessToken.value && isTokenExpiringSoon(userAccessToken.value, 60)) {
    const newToken = await refreshToken();
    if (newToken?.access_token) {
      userAccessToken.value = newToken.access_token;
    } else {
      navigationStore.resetRememberedRoutes();
      return navigateTo({
        path: "/auth",
        query: { redirect: redirectTarget },
      }); // Redirect to login if refresh fails
    }
  }
});
