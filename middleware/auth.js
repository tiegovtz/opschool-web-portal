import { refreshToken, isTokenExpiringSoon } from "~/utilities/jwToken";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useCookie("signInUserToken"); // JWT stored in cookies
  const userAccessToken = useCookie('signInAccessToken')
  const path = useState("topicToView");

  // If user is not logged in and trying to access a protected route
  if (!user.value && to.path !== "/auth") {
    if (!path.value) {
      return navigateTo("/home");
    }
    return navigateTo("/auth");
  }

  // Check if token is expiring soon
  if (isTokenExpiringSoon(userAccessToken.value, 60)) {
    const newToken = await refreshToken();
    if (newToken?.access_token) {
      userAccessToken.value = newToken.access_token;
    } else {
      return navigateTo("/auth"); // Redirect if refresh fails
    }
  }
});

