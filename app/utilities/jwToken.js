import { jwtDecode } from "jwt-decode";
import apiDocs from "./apiDocs";

const authCookieOptions = {
  httpOnly: false,
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 2,
  sameSite: "strict",
  path: "/",
};

const userCookieOptions = {
  ...authCookieOptions,
  default: () => ({}),
  encode: (value) => JSON.stringify(value),
  decode: (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  },
};

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
    const accessToken = useCookie("signInAccessToken", authCookieOptions);
    const refreshTokenCookie = useCookie("signInRefreshToken", authCookieOptions);
    const userToken = useCookie("signInUserToken", userCookieOptions);

    if (!refreshTokenCookie.value) {
      console.warn("No refresh token available.");
      return null;
    }

    if (isTokenExpiringSoon(refreshTokenCookie.value, 0)) {
      return null;
    }

    const response = await fetch(apiDocs.auth.refreshToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.value}`,
      },
      body: JSON.stringify({ refresh_token: refreshTokenCookie.value }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();

    if (payload?.access_token) {
      accessToken.value = payload.access_token;
    }

    if (payload?.refresh_token) {
      refreshTokenCookie.value = payload.refresh_token;
    } else if (refreshTokenCookie.value) {
      // Re-set the existing refresh token to extend cookie expiry.
      refreshTokenCookie.value = refreshTokenCookie.value;
    }

    if (userToken.value) {
      // Preserve the signed-in user cookie lifetime while the session is refreshed.
      userToken.value = { ...userToken.value };
    }

    return payload;
  } catch (error) {
    console.error("Failed to refresh token", error);
    return null;
  }
};

export { isTokenExpiringSoon, refreshToken };
