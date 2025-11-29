/**
 * CRYB Platform - Error Handling Utilities
 * Comprehensive error handling and formatting
 */

// Error types
export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// Error messages
const errorMessages = {
  [ErrorType.NETWORK]: 'Network error. Please check your connection.',
  [ErrorType.VALIDATION]: 'Please check your input and try again.',
  [ErrorType.AUTHENTICATION]: 'Please sign in to continue.',
  [ErrorType.AUTHORIZATION]: 'You don\'t have permission to do that.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER]: 'Server error. Please try again later.',
  [ErrorType.TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please wait a moment.',
  [ErrorType.UNKNOWN]: 'Something went wrong. Please try again.',
};

// Parse error from various sources
export const parseError = (error) => {
  // Already a parsed error
  if (error?.type && error?.message) {
    return error;
  }

  // Axios/Fetch error
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;

    let type = ErrorType.UNKNOWN;
    let message = data?.message || errorMessages[ErrorType.UNKNOWN];
    let errorCode = data?.code || `HTTP_${status}`;

    if (status === 400) {
      type = ErrorType.VALIDATION;
      message = data?.message || errorMessages[ErrorType.VALIDATION];
    } else if (status === 401) {
      type = ErrorType.AUTHENTICATION;
      message = errorMessages[ErrorType.AUTHENTICATION];
    } else if (status === 403) {
      type = ErrorType.AUTHORIZATION;
      message = errorMessages[ErrorType.AUTHORIZATION];
    } else if (status === 404) {
      type = ErrorType.NOT_FOUND;
      message = errorMessages[ErrorType.NOT_FOUND];
    } else if (status === 429) {
      type = ErrorType.RATE_LIMIT;
      message = errorMessages[ErrorType.RATE_LIMIT];
    } else if (status >= 500) {
      type = ErrorType.SERVER;
      message = errorMessages[ErrorType.SERVER];
    }

    return {
      type,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      originalError: error,
      status,
      details: data?.details,
    };
  }

  // Network error
  if (error?.request && !error?.response) {
    return {
      type: ErrorType.NETWORK,
      message: errorMessages[ErrorType.NETWORK],
      errorCode: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
      originalError: error,
    };
  }

  // Timeout error
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      message: errorMessages[ErrorType.TIMEOUT],
      errorCode: 'TIMEOUT',
      timestamp: new Date().toISOString(),
      originalError: error,
    };
  }

  // Generic error object
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || errorMessages[ErrorType.UNKNOWN],
      errorCode: 'UNKNOWN',
      timestamp: new Date().toISOString(),
      originalError: error,
    };
  }

  // String error
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      message: error,
      errorCode: 'UNKNOWN',
      timestamp: new Date().toISOString(),
    };
  }

  // Unknown error format
  return {
    type: ErrorType.UNKNOWN,
    message: errorMessages[ErrorType.UNKNOWN],
    errorCode: 'UNKNOWN',
    timestamp: new Date().toISOString(),
    originalError: error,
  };
};

// Format error for display
export const formatErrorMessage = (error) => {
  const parsed = parseError(error);
  return parsed.message;
};

// Get user-friendly error title
export const getErrorTitle = (error) => {
  const parsed = parseError(error);

  const titles = {
    [ErrorType.NETWORK]: 'Connection Error',
    [ErrorType.VALIDATION]: 'Invalid Input',
    [ErrorType.AUTHENTICATION]: 'Authentication Required',
    [ErrorType.AUTHORIZATION]: 'Access Denied',
    [ErrorType.NOT_FOUND]: 'Not Found',
    [ErrorType.SERVER]: 'Server Error',
    [ErrorType.TIMEOUT]: 'Request Timeout',
    [ErrorType.RATE_LIMIT]: 'Too Many Requests',
    [ErrorType.UNKNOWN]: 'Error',
  };

  return titles[parsed.type] || 'Error';
};

// Check if error is retryable
export const isRetryableError = (error) => {
  const parsed = parseError(error);
  return [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.SERVER,
  ].includes(parsed.type);
};

// Get retry delay based on attempt count
export const getRetryDelay = (attemptCount, baseDelay = 1000, maxDelay = 10000) => {
  const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

// Handle error with toast notification
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    logToConsole = process.env.NODE_ENV === 'development',
    onError,
  } = options;

  const parsed = parseError(error);

  if (logToConsole) {
    console.error('[Error]', {
      type: parsed.type,
      message: parsed.message,
      errorCode: parsed.errorCode,
      timestamp: parsed.timestamp,
      originalError: parsed.originalError,
    });
  }

  if (onError) {
    onError(parsed);
  }

  return parsed;
};

// Retry with exponential backoff
export const retryWithBackoff = async (
  fn,
  options = {}
) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const parsed = parseError(error);

      // Don't retry if error is not retryable
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = getRetryDelay(attempt, baseDelay, maxDelay);

      if (onRetry) {
        onRetry(attempt + 1, delay, parsed);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Create error boundary fallback
export const createErrorFallback = (error, errorInfo) => {
  return {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please refresh the page and try again.',
    error: parseError(error),
    errorInfo,
  };
};

export default {
  ErrorType,
  parseError,
  formatErrorMessage,
  getErrorTitle,
  isRetryableError,
  getRetryDelay,
  handleError,
  retryWithBackoff,
  createErrorFallback,
};
