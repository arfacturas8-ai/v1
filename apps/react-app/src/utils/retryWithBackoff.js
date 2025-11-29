/**
 * Retry Utility with Exponential Backoff
 *
 * Implements automatic retry logic with exponential backoff for failed operations.
 * Useful for API calls, network requests, and other potentially failing operations.
 */

const DEFAULT_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
  onRetry: () => {},
};

/**
 * Executes a function with automatic retry logic and exponential backoff
 *
 * @example
 * ```javascript
 * const data = await retryWithBackoff(
 *   () => apiService.getPosts(),
 *   {
 *     maxRetries: 3,
 *     initialDelay: 1000,
 *     shouldRetry: (error) => error.code !== 'UNAUTHORIZED'
 *   }
 * );
 * ```
 *
 * @param {Function} fn - The async function to execute with retry logic
 * @param {Object} options - Retry configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms before first retry (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms between retries (default: 10000)
 * @param {number} options.backoffMultiplier - Backoff multiplier for exponential growth (default: 2)
 * @param {Function} options.shouldRetry - Function to determine if error should trigger retry
 * @param {Function} options.onRetry - Callback invoked before each retry attempt
 * @returns {Promise} Promise resolving to the function result
 * @throws The last error if all retry attempts fail
 */
export async function retryWithBackoff(fn, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!config.shouldRetry(error, attempt + 1)) {
        throw error;
      }

      // Notify before retry
      config.onRetry(error, attempt + 1, delay);

      // Wait before next attempt
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Creates a retryable version of an async function
 *
 * @example
 * ```javascript
 * const fetchPosts = createRetryable(
 *   (communityId) => apiService.getPosts(communityId),
 *   { maxRetries: 3 }
 * );
 *
 * const posts = await fetchPosts('tech');
 * ```
 */
export function createRetryable(fn, options = {}) {
  return (...args) => retryWithBackoff(() => fn(...args), options);
}

/**
 * Default retry strategies for common scenarios
 */
export const retryStrategies = {
  /**
   * Retry only on network errors
   */
  networkOnly: (error) => {
    const errorMessage = error?.message?.toLowerCase() || '';
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      error?.code === 'NETWORK_ERROR'
    );
  },

  /**
   * Retry on 5xx server errors, but not 4xx client errors
   */
  serverErrorsOnly: (error) => {
    const status = error?.response?.status || error?.status;
    return status >= 500 && status < 600;
  },

  /**
   * Retry on specific HTTP status codes
   */
  statusCodes: (codes) => (error) => {
    const status = error?.response?.status || error?.status;
    return codes.includes(status);
  },

  /**
   * Never retry on authentication errors
   */
  excludeAuth: (error) => {
    const status = error?.response?.status || error?.status;
    return status !== 401 && status !== 403;
  },
};

/**
 * Helper function to sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * React Hook for retryable API calls with loading state
 *
 * @example
 * ```javascript
 * const { execute, loading, error, data } = useRetryable(
 *   () => apiService.getPosts(),
 *   { maxRetries: 3 }
 * );
 *
 * useEffect(() => {
 *   execute();
 * }, []);
 * ```
 */
export function useRetryable(fn, options = {}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  const execute = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryWithBackoff(fn, options);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fn, options]);

  return { execute, loading, error, data };
}

// Export default
export default retryWithBackoff;
