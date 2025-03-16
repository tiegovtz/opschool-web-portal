import jwt from 'jsonwebtoken';

/**
 * Checks if a given JWT token has expired.
 * 
 * @param {string} token - The JWT token to check.
 * @returns {boolean} - Returns `true` if the token has expired, otherwise `false`.
 */
function isTokenExpired(token) {
    if (!token) {
        return true; // Consider it expired if no token is provided
    }

    try {
        const decoded = jwt.decode(token); // Decode the token without verifying signature

        if (decoded && decoded.exp) {
            const expirationDate = decoded.exp * 1000; // Convert expiration time from seconds to milliseconds
            return Date.now() > expirationDate; // Check if the current time is past the expiration time
        } else {
            return true; // If there is no expiration info, consider the token expired
        }
    } catch (e) {
        return true; // Consider expired if decoding fails
    }
}
