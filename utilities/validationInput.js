/**
 * JavaScript Validation Module
 * 
 * This module provides utility functions for validating email addresses, Tanzanian phone numbers, 
 * and passwords based on predefined regular expressions.
 * 
 * @author Minja Baraka (https://github.com/MinjaBaraka)
 * @version 1.0.0
 * @since 1.0.0
 */

// Validation patterns
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const tanzaniaPhoneRegex = /^(?:\+255|0)(6[1-9]|7[1-9]|9[1-9])\d{7}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Authentication Utility
 * Provides validation functions for email, phone numbers, and passwords.
 */
const auth = {
    /**
     * Validates an email address format.
     * 
     * @param {string} email - The email to validate.
     * @returns {boolean} True if valid, false otherwise.
     * 
     * @example
     * const result = auth.isValidEmail("test@example.com");
     * console.log(result); // true
     */
    isValidEmail: (email) => {
        return emailPattern.test(email);
    },

    /**
     * Validates a Tanzanian phone number.
     * 
     * @param {string} phone - The phone number to validate.
     * @returns {boolean} True if valid, false otherwise.
     * 
     * @example
     * const result = auth.isValidPhone("+255622660722");
     * console.log(result); // true
     */
    isValidPhone: (phone) => {
        return tanzaniaPhoneRegex.test(phone);
    },

    /**
     * Checks if a password meets security criteria.
     * 
     * @param {string} password - The password to validate.
     * @returns {boolean} True if valid, false otherwise.
     * 
     * @example
     * const result = auth.isValidPassword("StrongP@ss1");
     * console.log(result); // true
     */
    isValidPassword: (password) => {
        return passwordPattern.test(password);
    },

    /**
     * Analyzes password strength and returns an object indicating which constraints it meets.
     * 
     * @param {string} password - The password to analyze.
     * @returns {Object} An object with validation results.
     * 
     * @example
     * const result = auth.checkPasswordStrength("StrongP@ss1");
     * console.log(result);
     * // Output:
     * // {
     * //   hasLowercase: true,
     * //   hasUppercase: true,
     * //   hasNumber: true,
     * //   hasSpecialChar: true,
     * //   hasMinLength: true
     * // }
     */
    checkPasswordStrength: (password) => {
        return {
            hasLowercase: /[a-z]/.test(password),  // At least one lowercase letter
            hasUppercase: /[A-Z]/.test(password),  // At least one uppercase letter
            hasNumber: /\d/.test(password),        // At least one number
            hasSpecialChar: /[@$!%*?&]/.test(password), // At least one special character
            hasMinLength: password.length >= 8     // At least 8 characters
        };
    },
    
    /**
     * Checks if a email or Phone Number meets security criteria.
     * 
     * @param {string} userName - The  email or Phone Number to validate.
     * @returns {boolean} True if valid, false otherwise.
     * 
     * @example
     * const resultEmail = auth.checkEmailOrPhoneNumber("example@gmail.com");
     * console.log(resultEmail); // true
     * const resultPhoneNumber = auth.checkEmailOrPhoneNumber(""+255622660722"");
     * console.log(resultPhoneNumber); // true
     */
    checkEmailOrPhoneNumber: (userName) => {
        return emailPattern.test(userName) || tanzaniaPhoneRegex.test(userName);
    }
};

// Export authentication utility
export { auth };