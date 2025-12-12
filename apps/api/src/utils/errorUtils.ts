/**
 * Error Utilities for Backend API
 * Ensures error messages are always strings for safe responses
 */

/**
 * Converts any error value to a safe string
 * Prevents sending error objects to frontend
 *
 * @param {any} error - Error value (string, Error object, API response, etc.)
 * @param {string} fallback - Fallback message if error cannot be extracted
 * @returns {string} Safe error message string
 */
export function getErrorMessage(error: any, fallback: string = 'An error occurred'): string {
  // Already a string
  if (typeof error === 'string') {
    return error || fallback;
  }

  // Null or undefined
  if (error == null) {
    return fallback;
  }

  // Error object with message
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  // API response with error field
  if (error.error) {
    return getErrorMessage(error.error, fallback);
  }

  // API response with data.error field
  if (error.data?.error) {
    return getErrorMessage(error.data.error, fallback);
  }

  // API response with data.message field
  if (error.data?.message && typeof error.data.message === 'string') {
    return error.data.message;
  }

  // Try toString() as last resort
  try {
    const stringified = String(error);
    if (stringified && stringified !== '[object Object]') {
      return stringified;
    }
  } catch (e) {
    // toString failed, use fallback
  }

  return fallback;
}

export default {
  getErrorMessage,
};
