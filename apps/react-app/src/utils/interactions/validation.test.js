/**
 * Tests for validation utilities
 */
import { validators, validate } from './validation';

describe('validators', () => {
  describe('email', () => {
    it('validates correct email', () => {
      expect(validators.email('user@example.com')).toBe(null);
    });

    it('validates email with subdomain', () => {
      expect(validators.email('user@mail.example.com')).toBe(null);
    });

    it('validates email with plus sign', () => {
      expect(validators.email('user+tag@example.com')).toBe(null);
    });

    it('validates email with numbers', () => {
      expect(validators.email('user123@example456.com')).toBe(null);
    });

    it('rejects email without @', () => {
      expect(validators.email('userexample.com')).toBe('Please enter a valid email address');
    });

    it('rejects email without domain', () => {
      expect(validators.email('user@')).toBe('Please enter a valid email address');
    });

    it('rejects email without TLD', () => {
      expect(validators.email('user@example')).toBe('Please enter a valid email address');
    });

    it('rejects email with spaces', () => {
      expect(validators.email('user @example.com')).toBe('Please enter a valid email address');
    });

    it('rejects empty string', () => {
      expect(validators.email('')).toBe('Please enter a valid email address');
    });

    it('rejects email starting with @', () => {
      expect(validators.email('@example.com')).toBe('Please enter a valid email address');
    });
  });

  describe('required', () => {
    it('accepts non-empty string', () => {
      expect(validators.required('value')).toBe(null);
    });

    it('accepts number', () => {
      expect(validators.required(123)).toBe(null);
    });

    it('accepts zero', () => {
      expect(validators.required(0)).toBe(null);
    });

    it('accepts boolean true', () => {
      expect(validators.required(true)).toBe(null);
    });

    it('accepts boolean false', () => {
      expect(validators.required(false)).toBe(null);
    });

    it('accepts object', () => {
      expect(validators.required({})).toBe(null);
    });

    it('accepts array', () => {
      expect(validators.required([])).toBe(null);
    });

    it('rejects empty string', () => {
      expect(validators.required('')).toBe('This field is required');
    });

    it('rejects whitespace-only string', () => {
      expect(validators.required('   ')).toBe('This field is required');
    });

    it('rejects null', () => {
      expect(validators.required(null)).toBe('This field is required');
    });

    it('rejects undefined', () => {
      expect(validators.required(undefined)).toBe('This field is required');
    });
  });

  describe('minLength', () => {
    it('accepts string meeting minimum length', () => {
      const validator = validators.minLength(5);
      expect(validator('hello')).toBe(null);
    });

    it('accepts string exceeding minimum length', () => {
      const validator = validators.minLength(5);
      expect(validator('hello world')).toBe(null);
    });

    it('rejects string below minimum length', () => {
      const validator = validators.minLength(5);
      expect(validator('hi')).toBe('Minimum length is 5 characters');
    });

    it('accepts array meeting minimum length', () => {
      const validator = validators.minLength(3);
      expect(validator([1, 2, 3])).toBe(null);
    });

    it('rejects array below minimum length', () => {
      const validator = validators.minLength(3);
      expect(validator([1, 2])).toBe('Minimum length is 3 characters');
    });

    it('handles minimum length of 0', () => {
      const validator = validators.minLength(0);
      expect(validator('')).toBe(null);
    });

    it('handles minimum length of 1', () => {
      const validator = validators.minLength(1);
      expect(validator('a')).toBe(null);
    });
  });

  describe('maxLength', () => {
    it('accepts string within maximum length', () => {
      const validator = validators.maxLength(10);
      expect(validator('hello')).toBe(null);
    });

    it('accepts string exactly at maximum length', () => {
      const validator = validators.maxLength(5);
      expect(validator('hello')).toBe(null);
    });

    it('rejects string exceeding maximum length', () => {
      const validator = validators.maxLength(5);
      expect(validator('hello world')).toBe('Maximum length is 5 characters');
    });

    it('accepts array within maximum length', () => {
      const validator = validators.maxLength(5);
      expect(validator([1, 2, 3])).toBe(null);
    });

    it('rejects array exceeding maximum length', () => {
      const validator = validators.maxLength(3);
      expect(validator([1, 2, 3, 4, 5])).toBe('Maximum length is 3 characters');
    });

    it('handles maximum length of 0', () => {
      const validator = validators.maxLength(0);
      expect(validator('')).toBe(null);
    });

    it('handles very large maximum length', () => {
      const validator = validators.maxLength(1000);
      expect(validator('short')).toBe(null);
    });
  });

  describe('pattern', () => {
    it('accepts value matching pattern', () => {
      const validator = validators.pattern(/^\d{3}-\d{3}-\d{4}$/, 'Invalid phone number');
      expect(validator('123-456-7890')).toBe(null);
    });

    it('rejects value not matching pattern', () => {
      const validator = validators.pattern(/^\d{3}-\d{3}-\d{4}$/, 'Invalid phone number');
      expect(validator('1234567890')).toBe('Invalid phone number');
    });

    it('uses default error message when not provided', () => {
      const validator = validators.pattern(/^\d+$/);
      expect(validator('abc')).toBe('Invalid format');
    });

    it('validates alphanumeric pattern', () => {
      const validator = validators.pattern(/^[a-zA-Z0-9]+$/, 'Only letters and numbers allowed');
      expect(validator('User123')).toBe(null);
      expect(validator('User@123')).toBe('Only letters and numbers allowed');
    });

    it('validates postal code pattern', () => {
      const validator = validators.pattern(/^\d{5}$/, 'Invalid zip code');
      expect(validator('12345')).toBe(null);
      expect(validator('1234')).toBe('Invalid zip code');
    });

    it('validates with complex regex', () => {
      const validator = validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, 'Password too weak');
      expect(validator('Password1')).toBe(null);
      expect(validator('password')).toBe('Password too weak');
    });
  });

  describe('url', () => {
    it('validates HTTP URL', () => {
      expect(validators.url('http://example.com')).toBe(null);
    });

    it('validates HTTPS URL', () => {
      expect(validators.url('https://example.com')).toBe(null);
    });

    it('validates URL with path', () => {
      expect(validators.url('https://example.com/path/to/resource')).toBe(null);
    });

    it('validates URL with query parameters', () => {
      expect(validators.url('https://example.com?param=value&other=123')).toBe(null);
    });

    it('validates URL with hash', () => {
      expect(validators.url('https://example.com#section')).toBe(null);
    });

    it('validates URL with port', () => {
      expect(validators.url('https://example.com:8080')).toBe(null);
    });

    it('validates URL with subdomain', () => {
      expect(validators.url('https://sub.example.com')).toBe(null);
    });

    it('validates localhost URL', () => {
      expect(validators.url('http://localhost:3000')).toBe(null);
    });

    it('validates IP address URL', () => {
      expect(validators.url('http://192.168.1.1')).toBe(null);
    });

    it('rejects URL without protocol', () => {
      expect(validators.url('example.com')).toBe('Please enter a valid URL');
    });

    it('rejects invalid URL', () => {
      expect(validators.url('not a url')).toBe('Please enter a valid URL');
    });

    it('rejects empty string', () => {
      expect(validators.url('')).toBe('Please enter a valid URL');
    });

    it('rejects malformed URL', () => {
      expect(validators.url('http://')).toBe('Please enter a valid URL');
    });
  });
});

describe('validate', () => {
  it('returns null when all rules pass', () => {
    const rules = [validators.required, validators.minLength(3)];
    expect(validate('hello', rules)).toBe(null);
  });

  it('returns first error when rule fails', () => {
    const rules = [validators.required, validators.minLength(10)];
    expect(validate('hello', rules)).toBe('Minimum length is 10 characters');
  });

  it('returns error from first failing rule', () => {
    const rules = [
      validators.minLength(5),
      validators.maxLength(3)
    ];
    expect(validate('hi', rules)).toBe('Minimum length is 5 characters');
  });

  it('validates with multiple passing rules', () => {
    const rules = [
      validators.required,
      validators.minLength(5),
      validators.maxLength(20),
      validators.pattern(/^[a-z]+$/, 'Lowercase only')
    ];
    expect(validate('hello', rules)).toBe(null);
  });

  it('validates email with multiple rules', () => {
    const rules = [
      validators.required,
      validators.email
    ];
    expect(validate('user@example.com', rules)).toBe(null);
    expect(validate('', rules)).toBe('This field is required');
    expect(validate('invalid', rules)).toBe('Please enter a valid email address');
  });

  it('handles empty rules array', () => {
    expect(validate('anything', [])).toBe(null);
  });

  it('stops at first error', () => {
    const spy1 = jest.fn(() => 'Error 1');
    const spy2 = jest.fn(() => 'Error 2');
    const rules = [spy1, spy2];

    validate('value', rules);

    expect(spy1).toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });

  it('validates password with complex rules', () => {
    const rules = [
      validators.required,
      validators.minLength(8),
      validators.pattern(/^(?=.*[A-Z])/, 'Must contain uppercase'),
      validators.pattern(/^(?=.*[a-z])/, 'Must contain lowercase'),
      validators.pattern(/^(?=.*\d)/, 'Must contain number')
    ];

    expect(validate('Password123', rules)).toBe(null);
    expect(validate('pass', rules)).toBe('Minimum length is 8 characters');
    expect(validate('password123', rules)).toBe('Must contain uppercase');
  });

  it('validates username with rules', () => {
    const rules = [
      validators.required,
      validators.minLength(3),
      validators.maxLength(20),
      validators.pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    ];

    expect(validate('user_123', rules)).toBe(null);
    expect(validate('ab', rules)).toBe('Minimum length is 3 characters');
    expect(validate('user@name', rules)).toBe('Username can only contain letters, numbers, and underscores');
  });
});
