/**
 * Utility functions for string manipulation, formatting, and general helpers.
 * These are generic functions not specific to D&D rules.
 */

/**
 * capitalises the first letter of a string.
 * 
 * @param {string} str - The string to capitalise
 * @returns {string} String with first letter capitalised
 * 
 * @example
 * capitalise("hello") // "Hello"
 * capitalise("HELLO") // "HELLO" (only first letter affected)
 * capitalise("") // ""
 */

export function capitaliseWords(aString) {
    if (!aString || typeof aString !== 'string') return '';

    return aString.split(' ').map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

/**
 * Clamps a number between a minimum and maximum value.
 * 
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 * 
 * @example
 * clamp(15, 1, 10) // 10
 * clamp(-5, 1, 10) // 1
 * clamp(5, 1, 10)  // 5
 */

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Formats a number with a + or - sign.
 * 
 * @param {number} num - The number to format
 * @returns {string} Formatted string with sign
 * 
 * @example
 * formatModifier(3)  // "+3"
 * formatModifier(-2) // "-2"
 * formatModifier(0)  // "+0"
 */
export function formatModifier(num) {
  return num >= 0 ? `+${num}` : `${num}`;
}