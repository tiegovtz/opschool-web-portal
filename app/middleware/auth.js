import { refreshToken, isTokenExpiringSoon } from "~/utilities/jwToken";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useCookie("signInUserToken");
  const userAccessToken = useCookie("signInAccessToken");

  if (!user.value) {
    return navigateTo("/auth"); // Redirect to login page
  }

  // 🔹 Check if access token is expiring soon (within 60 seconds)
  if (userAccessToken.value && isTokenExpiringSoon(userAccessToken.value, 60)) {
    const newToken = await refreshToken();
    if (newToken?.access_token) {
      userAccessToken.value = newToken.access_token;
    } else {
      return navigateTo("/auth"); // Redirect to login if refresh fails
    }
  }
});
