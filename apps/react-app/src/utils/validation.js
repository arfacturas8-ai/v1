/**
 * Validation Utilities
 * Comprehensive input validation and sanitization
 */

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: Min 8 chars, uppercase, lowercase, number, special char
 * @param {string} password
 * @returns {boolean}
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;

  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

/**
 * Validate username
 * Requirements: 3-30 chars, alphanumeric + underscore/hyphen
 * @param {string} username
 * @returns {boolean}
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;

  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * Validate URL
 * @param {string} url
 * @returns {boolean}
 */
export const validateURL = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html
 * @returns {string}
 */
export const sanitizeHTML = (html) => {
  if (!html) return '';

  // Remove script tags
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  clean = clean.replace(/on\w+="[^"]*"/gi, '');
  clean = clean.replace(/on\w+='[^']*'/gi, '');

  // Remove javascript: links
  clean = clean.replace(/href="javascript:[^"]*"/gi, '');
  clean = clean.replace(/href='javascript:[^']*'/gi, '');

  return clean;
};

/**
 * Validate Ethereum wallet address
 * @param {string} address
 * @returns {boolean}
 */
export const validateWalletAddress = (address) => {
  if (!address || typeof address !== 'string') return false;

  // Check if it starts with 0x and has 42 characters (0x + 40 hex chars)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
};

/**
 * Validate phone number (international format)
 * @param {string} phone
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
};

/**
 * Validate date (ISO format or Date object)
 * @param {string|Date} date
 * @returns {boolean}
 */
export const validateDate = (date) => {
  if (!date) return false;

  const dateObj = date instanceof Date ? date : new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Validate age (must be 13+ for COPPA compliance)
 * @param {string|Date} birthdate
 * @returns {boolean}
 */
export const validateAge = (birthdate) => {
  if (!validateDate(birthdate)) return false;

  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 13;
  }

  return age >= 13;
};

/**
 * Validate credit card number (Luhn algorithm)
 * @param {string} cardNumber
 * @returns {boolean}
 */
export const validateCreditCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') return false;

  const cleaned = cardNumber.replace(/\s/g, '');

  if (!/^\d{13,19}$/.test(cleaned)) return false;

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate file size
 * @param {File} file
 * @param {number} maxSizeMB
 * @returns {boolean}
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  if (!file || !(file instanceof File)) return false;

  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
};

/**
 * Validate file type
 * @param {File} file
 * @param {string[]} allowedTypes
 * @returns {boolean}
 */
export const validateFileType = (file, allowedTypes = []) => {
  if (!file || !(file instanceof File)) return false;
  if (allowedTypes.length === 0) return true;

  return allowedTypes.some(type => {
    if (type.includes('*')) {
      const category = type.split('/')[0];
      return file.type.startsWith(category + '/');
    }
    return file.type === type;
  });
};

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  validateURL,
  sanitizeHTML,
  validateWalletAddress,
  validatePhone,
  validateDate,
  validateAge,
  validateCreditCard,
  validateFileSize,
  validateFileType
};
