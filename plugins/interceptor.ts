// import { defineNuxtPlugin } from "#app";
// import apiDocsFile from "~/utilities/api-docs";;
 

// export default defineNuxtPlugin((nuxtApp) => {
//   const customFetch = async (url: string, options: any = {}) => {
//     const accessToken = useCookie("signInAccessToken");
    
//     if (accessToken.value) {
//       options.headers = {
//         ...options.headers,
//         Authorization: `Bearer ${accessToken.value}`,
//       };
//     }

//     try {
//       return await $fetch(url, options);
//     } catch (error: any) {
//       if (error?.response?.status === 401 && accessToken.value) {
//         if (isTokenExpired(accessToken.value)) {
//           const newToken = await refreshAuthToken();
//           if (newToken) {
//             accessToken.value = newToken;
//             options.headers.Authorization = `Bearer ${newToken}`;
//             return await $fetch(url, options);
//           }
//         }
//       }
//       throw error;
//     }
//   };

//   nuxtApp.provide("apiFetch", customFetch);

//   // Ensure token refresh on app startup
//   nuxtApp.hooks.hook("app:created", async () => {
//     const token = useCookie("signInAccessToken");

//     if (token.value && isTokenExpired(token.value)) {
//       const newToken = await refreshAuthToken();
//       if (newToken) {
//         token.value = newToken;
//       } else {
//         logoutUser(); // Logout if token refresh fails
//       }
//     }
//   });

//   function isTokenExpired(token: string): boolean {
//     try {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       return payload.exp * 1000 < Date.now();
//     } catch {
//       return true;
//     }
//   }

//   async function refreshAuthToken() {
//     const refreshToken = useCookie("signInRefreshToken");

//     if (!refreshToken.value) return null;

//     try {
//       interface RefreshTokenResponse {
//         accessToken: string;
//       }

//       const response = await $fetch<RefreshTokenResponse>(apiDocs.auth.refreshToken, {
//         method: "POST",
//         body: { refresh_token: refreshToken.value },
//         headers: { "Content-Type": "application/json" },
//       });

//       return response.accessToken || null;
//     } catch (error) {
//       console.error("Failed to refresh token:", error);
//       return null;
//     }
//   }

//   function logoutUser() {
//     const token = useCookie("signInAccessToken");
//     const refreshToken = useCookie("signInRefreshToken");
//     token.value = null;
//     refreshToken.value = null;

//     if (import.meta.client) {
//       navigateTo("/auth");
//     }
//   }
// });
