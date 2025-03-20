import apiDocs from "~/utilities/api-docs";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hook("app:rendered", async (context) => {
    const token = useCookie("signInAccessToken"); // Pata token kutoka kwenye cookie

    if (!token.value) {
      return;
    }

    // Cheki kama token ime-expire
    if (isTokenExpired(token.value)) {
      const newToken = await refreshAuthToken(nuxtApp); // Refresh token
      if (newToken) {
        token.value = newToken; // Weka token mpya kwenye cookie
        if (typeof window !== "undefined") {
          const headers = {
            Authorization: `Bearer ${newToken}`,
          };
        }
    }
  }
});

// Funguo ya kuangalia kama token ime-expire
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true; // Ikiwa token ni batili, ichukulie kama ime-expire
  }
}


// Funguo ya ku-refresh token
async function refreshAuthToken(nuxtApp: any): Promise<string | null> {
  try {
    const response = await nuxtApp.$fetch(apiDocs.auth.refreshToken, { 
        method: "POST",
        body: JSON.stringify({ token: useCookie("signInRefreshToken").value }),
        headers: { "Content-Type": "application/json" },
     });
    return response?.accessToken || null;
  } catch (error) {
    // console.error("Failed to refresh token:", error);
    return null;
  }
}
});