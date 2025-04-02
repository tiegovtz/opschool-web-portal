/**
 * @description Utility module for sanitizing user inputs to prevent XSS attacks.
 * @author Minja Baraka (https://github.com/MinjaBaraka)
 * @version 1.0.0
 * @since 1.0.0
 */

const sanitize = {
    /**
     * Escapes HTML special characters to prevent XSS attacks.
     *
     * @param {string} str - The input string containing HTML.
     * @returns {string} The sanitized string with escaped characters.
     *
     * @example
     * const safeString = sanitize.html('<script>alert("XSS")</script>');
     * console.log(safeString); // &lt;script&gt;alert("XSS")&lt;/script&gt;
     */
    html: (str) => {
        return str.replace(/[&<>"]/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;'
            }[char];
        });
    },

    /**
     * Removes JavaScript event handlers and potentially harmful attributes from input.
     *
     * @param {string} str - The input string.
     * @returns {string} The sanitized string without JavaScript event attributes.
     *
     * @example
     * const cleanInput = sanitize.js('<div onclick="alert(1)">Click me</div>');
     * console.log(cleanInput); // <div>Click me</div>
     */
    js: (str) => {
        return str.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
    },

    /**
     * Fully sanitizes an input by escaping HTML and removing JavaScript attributes.
     *
     * @param {string} input - The user-provided input.
     * @returns {string} The fully sanitized string.
     *
     * @example
     * const sanitizedInput = sanitize.input('<img src="x" onerror="alert(1)">');
     * console.log(sanitizedInput); // &lt;img src="x" &gt;
     */
    input: (input) => {
        return sanitize.html(sanitize.js(input));
    }
};

export { sanitize };
