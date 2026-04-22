export default defineNuxtRouteMiddleware((to) => {
  const queryToken = Array.isArray(to.query["auth-token"]) ? to.query["auth-token"][0] : to.query["auth-token"];
  const normalizedQueryToken = String(queryToken || "").trim();

  if (!normalizedQueryToken) return;

  const accessToken = useCookie("signInAccessToken", {
    httpOnly: false,
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 2,
    sameSite: "strict",
    path: "/",
  });

  if (accessToken.value === normalizedQueryToken) return;

  accessToken.value = normalizedQueryToken;
});
