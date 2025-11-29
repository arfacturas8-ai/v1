export const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },

  required: (value) => {
    return value && value.toString().trim() !== '' ? null : 'This field is required';
  },

  minLength: (min) => (value) => {
    return value && value.length >= min ? null : 'Minimum length is ' + min + ' characters';
  },

  maxLength: (max) => (value) => {
    return value && value.length <= max ? null : 'Maximum length is ' + max + ' characters';
  },

  pattern: (regex, message) => (value) => {
    return regex.test(value) ? null : message || 'Invalid format';
  },

  url: (value) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  }
};

export const validate = (value, rules) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
};

export default validators;
