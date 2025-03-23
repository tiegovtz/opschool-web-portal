import { refreshToken ,isTokenExpiringSoon } from "~/utilities/jwToken";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useCookie("signInUserToken"); // Example: Checking login token in cookies
  const path = useState("topicToView");

  if (!user.value && to.path !== "/auth") {
    if (!path.value) {
      return navigateTo("/home");
    }
    return navigateTo("/auth");
  } else if (isTokenExpiringSoon(token.value, 60)) {
    newToken = await refreshToken();
    user.value = newToken?.access_token;
  }

  else{
    return navigateTo("/auth");
  }
});
