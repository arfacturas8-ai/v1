/**
 * CRYB Platform - Form Validation Utilities
 * Comprehensive validation functions for all form fields
 */

// Email validation
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return true;
};

// Password validation
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  if (!password) return 'Password is required';
  if (password.length < minLength) return `Password must be at least ${minLength} characters`;
  if (requireUppercase && !/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (requireLowercase && !/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (requireNumbers && !/\d/.test(password)) return 'Password must contain at least one number';
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return true;
};

// Password confirmation
export const validatePasswordConfirmation = (password, confirmation) => {
  if (!confirmation) return 'Please confirm your password';
  if (password !== confirmation) return 'Passwords do not match';
  return true;
};

// Username validation
export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 20) return 'Username must be less than 20 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, underscores, and hyphens';
  return true;
};

// URL validation
export const validateURL = (url) => {
  if (!url) return 'URL is required';
  try {
    new URL(url);
    return true;
  } catch {
    return 'Please enter a valid URL';
  }
};

// Phone number validation
export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  const phoneRegex = /^[\d\s()+-]+$/;
  if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) return 'Phone number must be at least 10 digits';
  return true;
};

// Required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return true;
};

// Min length validation
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (!value) return true; // Use with validateRequired for required fields
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return true;
};

// Max length validation
export const validateMaxLength = (value, maxLength, fieldName = 'This field') => {
  if (!value) return true;
  if (value.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return true;
};

// Number validation
export const validateNumber = (value, options = {}) => {
  const { min, max, integer = false } = options;

  if (!value) return 'Please enter a number';
  const num = Number(value);

  if (isNaN(num)) return 'Please enter a valid number';
  if (integer && !Number.isInteger(num)) return 'Please enter a whole number';
  if (min !== undefined && num < min) return `Number must be at least ${min}`;
  if (max !== undefined && num > max) return `Number must be at most ${max}`;

  return true;
};

// Date validation
export const validateDate = (date, options = {}) => {
  const { min, max, future = false, past = false } = options;

  if (!date) return 'Date is required';
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) return 'Please enter a valid date';

  const now = new Date();
  if (future && dateObj <= now) return 'Date must be in the future';
  if (past && dateObj >= now) return 'Date must be in the past';

  if (min && dateObj < new Date(min)) return `Date must be after ${new Date(min).toLocaleDateString()}`;
  if (max && dateObj > new Date(max)) return `Date must be before ${new Date(max).toLocaleDateString()}`;

  return true;
};

// Wallet address validation
export const validateWalletAddress = (address) => {
  if (!address) return 'Wallet address is required';
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return 'Please enter a valid Ethereum wallet address';
  return true;
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  if (!file) return 'Please select a file';

  if (maxSize && file.size > maxSize) {
    return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(2)}MB`;
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }

  if (allowedExtensions.length > 0) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return `File extension must be one of: ${allowedExtensions.join(', ')}`;
    }
  }

  return true;
};

// Custom regex validation
export const validateRegex = (value, regex, errorMessage = 'Invalid format') => {
  if (!value) return true;
  if (!regex.test(value)) return errorMessage;
  return true;
};

// Compose multiple validations
export const composeValidators = (...validators) => {
  return (value) => {
    for (const validator of validators) {
      const result = validator(value);
      if (result !== true) return result;
    }
    return true;
  };
};

// Example composed validators
export const validateRequiredEmail = composeValidators(
  (value) => validateRequired(value, 'Email'),
  validateEmail
);

export const validateRequiredPassword = composeValidators(
  (value) => validateRequired(value, 'Password'),
  validatePassword
);

export const validateRequiredUsername = composeValidators(
  (value) => validateRequired(value, 'Username'),
  validateUsername
);

export default {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
  validateURL,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateDate,
  validateWalletAddress,
  validateFile,
  validateRegex,
  composeValidators,
  validateRequiredEmail,
  validateRequiredPassword,
  validateRequiredUsername,
};
