/**
 * @description This file contains the controls for generating a random number identifier.
 * @author MinjaBaraka (https://github.com/MinjaBaraka)
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * Generates a random number identifier between 001 and 999.
 * 
 * @function generateRandomID
 * @returns {string} A three-digit string representing the random number (e.g., "001", "123", "999").
 * 
 * @example
 * console.log(generateRandomID()); // Outputs: "045", "237", "999"
 */
const generateRandomID = () => {
    const randomNum = Math.floor(Math.random() * 999) + 1; // Generates number from 1 to 999
    return randomNum.toString().padStart(3, '0'); // Ensures it has 3 digits (001-999)
}

export {
    generateRandomID,
}