import { jwtDecode } from "jwt-decode";
import apiDocs from "./api-docs";

/**
 * Checks if a given JWT token is expiring soon.
 *
 * @param {string} token - The JWT token to check.
 * @param {number} thresholdInSeconds - Time in seconds before expiry to trigger refresh.
 * @returns {boolean} - Returns `true` if the token is expiring soon, otherwise `false`.
 */
const isTokenExpiringSoon = (token, thresholdInSeconds = 300) => {
  if (!token) return true; // Treat missing token as expired

  try {
    const { exp } = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    return exp - now <= thresholdInSeconds;
  } catch (e) {
    console.error("Invalid JWT", e);
    return true; // Assume expired if token is invalid
  }
};

/**
 * Refreshes the JWT token using the stored refresh token.
 * @returns {Promise<Object|null>} - New token object or null if refresh fails.
 */
const refreshToken = async () => {
  try {
    const accessToken = useCookie("signInAccessToken");
    const refreshToken = useCookie("signInRefreshToken");

    if (!refreshToken.value) {
      console.warn("No refresh token available.");
      return null;
    }

    const response = await $fetch(apiDocs.auth.refreshToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.value}`,
      },
      body: { refresh_token: refreshToken.value },
    });

    return response || null; // Return refreshed token or null on failure
  } catch (error) {
    console.error("Failed to refresh token", error);
    return null;
  }
};

export { isTokenExpiringSoon, refreshToken };
