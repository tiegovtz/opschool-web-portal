/**
 * JavaScript Validation Module
 * 
 * This module provides utility functions for validating names, email addresses, 
 * Tanzanian phone numbers, and passwords based on predefined regular expressions.
 * 
 * @author Minja Baraka (https://github.com/MinjaBaraka)
 * @version 1.1.0
 * @since 1.0.0
 */

// Validation patterns
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const tanzaniaPhoneRegex = /^(?:\+255|0)(6[1-9]|7[1-9]|9[1-9])\d{7}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const usernameRegex = /^[A-Za-z]+\.[A-Za-z]+$/;

/**
 * Authentication Utility
 * Provides validation functions for names, email, phone numbers, and passwords.
 */
const auth = {
    /**
     * Validates an email address format.
     * 
     * @param {string} email - The email to validate.
     * @returns {boolean} True if valid, false otherwise.
     * 
     * @example
     * console.log(auth.isValidEmail("test@example.com")); // true
     */
    isValidEmail: (email) => emailPattern.test(email),

    /**
     * Validates a Tanzanian phone number.
     * 
     * @param {string} phone - The phone number to validate.
     * @returns {boolean} True if valid, false otherwise.
     * 
     * @example
     * console.log(auth.isValidPhone("+255622660722")); // true
     */
    isValidPhone: (phone) => tanzaniaPhoneRegex.test(phone),

    /**
     * Checks if a password meets security criteria.
     * 
     * @param {string} password - The password to validate.
     * @returns {boolean} True if valid, false otherwise.
     * 
     * @example
     * console.log(auth.isValidPassword("StrongP@ss1")); // true
     */
    isValidPassword: (password) => passwordPattern.test(password),

    /**
     * Analyzes password strength and returns an object indicating which constraints it meets.
     * 
     * @param {string} password - The password to analyze.
     * @returns {Object} An object with validation results.
     * 
     * @example
     * console.log(auth.checkPasswordStrength("StrongP@ss1"));
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
            hasNumber: /\d/.test(password),       // At least one number
            hasSpecialChar: /[@$!%*?&]/.test(password), // At least one special character
            hasMinLength: password.length >= 8    // At least 8 characters
        };
    },

  /**
 * Validates whether the input is a valid email, Tanzanian phone number, or username in the format "Example.Example".
 * 
 * @param {string} userInput - The email, phone number, or username to validate.
 * @returns {boolean} True if valid, false otherwise.
 * 
 * @example
 * console.log(auth.checkEmailPhoneOrUsername("example@gmail.com")); // true (valid email)
 * console.log(auth.checkEmailPhoneOrUsername("+255622660722")); // true (valid Tanzanian phone number)
 * console.log(auth.checkEmailPhoneOrUsername("John.Doe")); // true (valid username)
 * console.log(auth.checkEmailPhoneOrUsername("invalid@com")); // false (invalid email)
 * console.log(auth.checkEmailPhoneOrUsername("12345")); // false (invalid phone number)
 * console.log(auth.checkEmailPhoneOrUsername("JohnDoe")); // false (missing dot in username)
 */
checkEmailPhoneOrUsername: (userInput) => {
    return emailPattern.test(userInput) || tanzaniaPhoneRegex.test(userInput) || usernameRegex.test(userInput);
},

    /**
     * Validates a name, ensuring it contains only letters, has at least 3 characters,
     * and does not have repeated letters more than twice in a row.
     * 
     * @param {string} name - The name to validate.
     * @returns {Object} True if valid, false otherwise.
     * 
     * @example
     * console.log(auth.isValidName("James")); // true
     * console.log(auth.isValidName("ffff")); // false
     * console.log(auth.isValidName("Ja@mes")); // false
     */
     isValidName: (name) => {
        return {
            isMinLength: name.length >= 3, // Name must be at least 3 characters long
            hasNoSpecialChars: /^[A-Za-z]+$/.test(name), // Name should not contain special characters or numbers
            hasNoRepeatedChars: !/(.)\1{2,}/.test(name) // Name should not have three or more repeating characters
        };
    }
};

// Export authentication utility
export { auth };
