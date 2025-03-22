/**
 * @description This file contains the controls for generating a random number identifier.
 * @author MinjaBaraka (https://github.com/MinjaBaraka)
 * @version 1.0.0
 * @since 1.0.0
 */

// import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import apiDocs from "./api-docs";

/**
 * Checks if a given JWT token has expired.
 *
 * @param {string} token - The JWT token to check.
 * @returns {boolean} - Returns `true` if the token has expired, otherwise `false`.
 */
// check if token is going to expire in the next 5 minutes
const isTokenExpiringSoon = (token, thresholdInSeconds) => {
  if (!token) {
    return true;
  }
  try {
    const { exp } = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    return exp - now <= thresholdInSeconds;
  } catch (e) {
    // console.error("Invalid JWT", e);
    return true;
  }
};

// console.error("Invalid JWT", e);
const refreshToken = async () => {
  // Call backend to refresh token
  // console.log('Refresh token');
  await $fetch(apiDocs.auth.refreshToken, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
    },
    body: {
      "refresh_token": `${useCookie("signInRefreshToken").value}`,
    },
  })
    .then((res) => {
      if (res.ok) {
        // console.log('Token refreshed');
        return res.json();
      } else {
        // console.error('Failed to refresh token');
        return null;
      }
    })
    .catch((error) => {
      // console.error('Failed to refresh token', error);
      return null;
    });
};

export { isTokenExpiringSoon, refreshToken };