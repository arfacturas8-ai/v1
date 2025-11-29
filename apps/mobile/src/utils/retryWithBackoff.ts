/**
 * Retry Utility with Exponential Backoff
 *
 * Implements automatic retry logic with exponential backoff for failed operations.
 * Useful for API calls, network requests, and other potentially failing operations.
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 10000
   */
  maxDelay?: number;

  /**
   * Backoff multiplier for exponential growth
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Custom function to determine if error should trigger a retry
   * @param error The error that occurred
   * @param attempt Current attempt number (1-indexed)
   * @returns true if should retry, false otherwise
   */
  shouldRetry?: (error: any, attempt: number) => boolean;

  /**
   * Callback invoked before each retry attempt
   * @param error The error that occurred
   * @param attempt Current attempt number (1-indexed)
   * @param delay Delay in ms before next retry
   */
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
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
 * ```typescript
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
 * @param fn The async function to execute with retry logic
 * @param options Retry configuration options
 * @returns Promise resolving to the function result
 * @throws The last error if all retry attempts fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
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
 * ```typescript
 * const fetchPosts = createRetryable(
 *   (communityId: string) => apiService.getPosts(communityId),
 *   { maxRetries: 3 }
 * );
 *
 * const posts = await fetchPosts('tech');
 * ```
 */
export function createRetryable<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => retryWithBackoff(() => fn(...args), options);
}

/**
 * Default retry strategies for common scenarios
 */
export const retryStrategies = {
  /**
   * Retry only on network errors
   */
  networkOnly: (error: any) => {
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
  serverErrorsOnly: (error: any) => {
    const status = error?.response?.status || error?.status;
    return status >= 500 && status < 600;
  },

  /**
   * Retry on specific HTTP status codes
   */
  statusCodes: (codes: number[]) => (error: any) => {
    const status = error?.response?.status || error?.status;
    return codes.includes(status);
  },

  /**
   * Never retry on authentication errors
   */
  excludeAuth: (error: any) => {
    const status = error?.response?.status || error?.status;
    return status !== 401 && status !== 403;
  },
};

/**
 * Helper function to sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * React Hook for retryable API calls with loading state
 *
 * @example
 * ```typescript
 * const { execute, loading, error } = useRetryable(
 *   () => apiService.getPosts(),
 *   { maxRetries: 3 }
 * );
 *
 * useEffect(() => {
 *   execute();
 * }, []);
 * ```
 */
export function useRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryWithBackoff(fn, options);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fn, options]);

  return { execute, loading, error, data };
}

// Export for CommonJS compatibility
export default retryWithBackoff;
