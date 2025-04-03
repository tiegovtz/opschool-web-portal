import { refreshToken, isTokenExpiringSoon } from "~/utilities/jwToken";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Get JWT and access token from cookies
  const user = useCookie("signInUserToken");
  const userAccessToken = useCookie("signInAccessToken");

  // Store the last visited topic page
  const path = useState("topicToView");

  // 🔹 If user is not logged in and trying to access a protected route
  if (!user.value && to.path !== "/auth") {
    if (!path.value && from.fullPath.includes("/home")) {
      return navigateTo("/home"); // Redirect to home if no previous topic
    }
    return navigateTo("/auth"); // Redirect to login page
  }

  // 🔹 Check if access token is about to expire (within 60 seconds)
  if (isTokenExpiringSoon(userAccessToken.value, 60)) {
    const newToken = await refreshToken();

    if (newToken?.access_token) {
      // ✅ Update access token
      userAccessToken.value = newToken.access_token;
    } else {
      return navigateTo("/auth"); // 🔴 Redirect to login if refresh fails
    }
  }
});