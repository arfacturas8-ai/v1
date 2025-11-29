/**
 * Tests for formValidation utilities
 */
import {
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
  validateRequiredUsername
} from './formValidation';

describe('formValidation', () => {
  describe('validateEmail', () => {
    it('validates correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.com')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid')).toContain('valid email');
      expect(validateEmail('test@')).toContain('valid email');
      expect(validateEmail('@example.com')).toContain('valid email');
      expect(validateEmail('test @example.com')).toContain('valid email');
    });

    it('requires email', () => {
      expect(validateEmail('')).toContain('required');
      expect(validateEmail(null)).toContain('required');
      expect(validateEmail(undefined)).toContain('required');
    });
  });

  describe('validatePassword', () => {
    it('validates strong password', () => {
      expect(validatePassword('Passw0rd!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd123')).toBe(true);
    });

    it('requires minimum length', () => {
      expect(validatePassword('Pass1!')).toContain('8 characters');
    });

    it('requires uppercase letter', () => {
      expect(validatePassword('password1!')).toContain('uppercase');
    });

    it('requires lowercase letter', () => {
      expect(validatePassword('PASSWORD1!')).toContain('lowercase');
    });

    it('requires number', () => {
      expect(validatePassword('Password!')).toContain('number');
    });

    it('requires special character', () => {
      expect(validatePassword('Password123')).toContain('special character');
    });

    it('respects custom options', () => {
      expect(validatePassword('simple', {
        minLength: 4,
        requireUppercase: false,
        requireNumbers: false,
        requireSpecialChars: false
      })).toBe(true);
    });

    it('requires password', () => {
      expect(validatePassword('')).toContain('required');
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('validates matching passwords', () => {
      expect(validatePasswordConfirmation('password123', 'password123')).toBe(true);
    });

    it('rejects non-matching passwords', () => {
      expect(validatePasswordConfirmation('password123', 'different')).toContain('do not match');
    });

    it('requires confirmation', () => {
      expect(validatePasswordConfirmation('password123', '')).toContain('confirm');
    });
  });

  describe('validateUsername', () => {
    it('validates correct usernames', () => {
      expect(validateUsername('john_doe')).toBe(true);
      expect(validateUsername('user-123')).toBe(true);
      expect(validateUsername('JohnDoe')).toBe(true);
    });

    it('requires minimum 3 characters', () => {
      expect(validateUsername('ab')).toContain('3 characters');
    });

    it('limits to 20 characters', () => {
      expect(validateUsername('a'.repeat(21))).toContain('less than 20');
    });

    it('rejects invalid characters', () => {
      expect(validateUsername('user@name')).toContain('letters, numbers');
      expect(validateUsername('user name')).toContain('letters, numbers');
    });

    it('requires username', () => {
      expect(validateUsername('')).toContain('required');
    });
  });

  describe('validateURL', () => {
    it('validates correct URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://test.co.uk')).toBe(true);
      expect(validateURL('https://example.com/path?query=value')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      const result = validateURL('not-a-url');
      expect(typeof result === 'string' && result.includes('valid URL')).toBe(true);
    });

    it('requires URL', () => {
      expect(validateURL('')).toContain('required');
    });
  });

  describe('validatePhone', () => {
    it('validates correct phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(true);
      expect(validatePhone('(123) 456-7890')).toBe(true);
      expect(validatePhone('+1-234-567-8900')).toBe(true);
    });

    it('requires at least 10 digits', () => {
      expect(validatePhone('123456789')).toContain('10 digits');
    });

    it('rejects invalid characters', () => {
      expect(validatePhone('12345abc67890')).toContain('valid phone');
    });

    it('requires phone', () => {
      expect(validatePhone('')).toContain('required');
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty values', () => {
      expect(validateRequired('value')).toBe(true);
      expect(validateRequired('0')).toBe(true);
    });

    it('rejects empty values', () => {
      expect(validateRequired('')).toContain('required');
      expect(validateRequired('   ')).toContain('required');
      expect(validateRequired(null)).toContain('required');
      expect(validateRequired(undefined)).toContain('required');
    });

    it('uses custom field name', () => {
      expect(validateRequired('', 'Email')).toContain('Email');
    });
  });

  describe('validateMinLength', () => {
    it('validates sufficient length', () => {
      expect(validateMinLength('hello', 5)).toBe(true);
      expect(validateMinLength('hello world', 5)).toBe(true);
    });

    it('rejects insufficient length', () => {
      expect(validateMinLength('hi', 5)).toContain('5 characters');
    });

    it('allows empty for optional fields', () => {
      expect(validateMinLength('', 5)).toBe(true);
    });

    it('uses custom field name', () => {
      expect(validateMinLength('hi', 5, 'Username')).toContain('Username');
    });
  });

  describe('validateMaxLength', () => {
    it('validates within max length', () => {
      expect(validateMaxLength('hello', 10)).toBe(true);
    });

    it('rejects exceeding length', () => {
      expect(validateMaxLength('hello world', 5)).toContain('less than 5');
    });

    it('allows empty for optional fields', () => {
      expect(validateMaxLength('', 5)).toBe(true);
    });

    it('uses custom field name', () => {
      expect(validateMaxLength('too long text', 5, 'Bio')).toContain('Bio');
    });
  });

  describe('validateNumber', () => {
    it('validates valid numbers', () => {
      expect(validateNumber('42')).toBe(true);
      expect(validateNumber('3.14')).toBe(true);
      expect(validateNumber('-10')).toBe(true);
    });

    it('rejects non-numbers', () => {
      expect(validateNumber('abc')).toContain('valid number');
      expect(validateNumber('')).toContain('enter a number');
    });

    it('validates integer constraint', () => {
      expect(validateNumber('42', { integer: true })).toBe(true);
      expect(validateNumber('3.14', { integer: true })).toContain('whole number');
    });

    it('validates min constraint', () => {
      expect(validateNumber('10', { min: 5 })).toBe(true);
      expect(validateNumber('3', { min: 5 })).toContain('at least 5');
    });

    it('validates max constraint', () => {
      expect(validateNumber('5', { max: 10 })).toBe(true);
      expect(validateNumber('15', { max: 10 })).toContain('at most 10');
    });

    it('validates combined constraints', () => {
      expect(validateNumber('5', { min: 0, max: 10, integer: true })).toBe(true);
    });
  });

  describe('validateDate', () => {
    it('validates valid dates', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate(new Date())).toBe(true);
    });

    it('rejects invalid dates', () => {
      expect(validateDate('invalid')).toContain('valid date');
      expect(validateDate('')).toContain('required');
    });

    it('validates future dates', () => {
      const future = new Date(Date.now() + 86400000);
      expect(validateDate(future, { future: true })).toBe(true);

      const past = new Date(Date.now() - 86400000);
      expect(validateDate(past, { future: true })).toContain('future');
    });

    it('validates past dates', () => {
      const past = new Date(Date.now() - 86400000);
      expect(validateDate(past, { past: true })).toBe(true);

      const future = new Date(Date.now() + 86400000);
      expect(validateDate(future, { past: true })).toContain('past');
    });

    it('validates min date', () => {
      const minDate = '2024-01-01';
      expect(validateDate('2024-06-01', { min: minDate })).toBe(true);
      expect(validateDate('2023-12-01', { min: minDate })).toContain('after');
    });

    it('validates max date', () => {
      const maxDate = '2024-12-31';
      expect(validateDate('2024-06-01', { max: maxDate })).toBe(true);
      expect(validateDate('2025-01-01', { max: maxDate })).toContain('before');
    });
  });

  describe('validateWalletAddress', () => {
    it('validates correct Ethereum addresses', () => {
      expect(validateWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
      expect(validateWalletAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('rejects invalid addresses', () => {
      expect(validateWalletAddress('0x123')).toContain('valid Ethereum');
      expect(validateWalletAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toContain('valid Ethereum');
      expect(validateWalletAddress('0xGGGd35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toContain('valid Ethereum');
    });

    it('requires address', () => {
      expect(validateWalletAddress('')).toContain('required');
    });
  });

  describe('validateFile', () => {
    const createMockFile = (name, size, type) => ({
      name,
      size,
      type
    });

    it('validates correct file', () => {
      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      expect(validateFile(file)).toBe(true);
    });

    it('rejects oversized files', () => {
      const file = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg');
      expect(validateFile(file, { maxSize: 5 * 1024 * 1024 })).toContain('5.00MB');
    });

    it('validates file types', () => {
      const jpgFile = createMockFile('test.jpg', 1024, 'image/jpeg');
      const pdfFile = createMockFile('test.pdf', 1024, 'application/pdf');

      expect(validateFile(jpgFile, { allowedTypes: ['image/jpeg', 'image/png'] })).toBe(true);
      expect(validateFile(pdfFile, { allowedTypes: ['image/jpeg', 'image/png'] })).toContain('File type');
    });

    it('validates file extensions', () => {
      const jpgFile = createMockFile('test.jpg', 1024, 'image/jpeg');
      const pdfFile = createMockFile('test.pdf', 1024, 'application/pdf');

      expect(validateFile(jpgFile, { allowedExtensions: ['jpg', 'png'] })).toBe(true);
      expect(validateFile(pdfFile, { allowedExtensions: ['jpg', 'png'] })).toContain('File extension');
    });

    it('requires file', () => {
      expect(validateFile(null)).toContain('select a file');
    });
  });

  describe('validateRegex', () => {
    it('validates matching patterns', () => {
      expect(validateRegex('abc123', /^[a-z0-9]+$/)).toBe(true);
    });

    it('rejects non-matching patterns', () => {
      expect(validateRegex('ABC', /^[a-z]+$/)).toContain('Invalid format');
    });

    it('uses custom error message', () => {
      expect(validateRegex('123', /^[a-z]+$/, 'Must be letters only')).toContain('letters only');
    });

    it('allows empty for optional fields', () => {
      expect(validateRegex('', /^[a-z]+$/)).toBe(true);
    });
  });

  describe('composeValidators', () => {
    it('runs all validators in sequence', () => {
      const validator = composeValidators(
        (v) => validateRequired(v, 'Field'),
        (v) => validateMinLength(v, 5, 'Field')
      );

      expect(validator('hello')).toBe(true);
      expect(validator('')).toContain('required');
      expect(validator('hi')).toContain('5 characters');
    });

    it('stops at first error', () => {
      const validator = composeValidators(
        (v) => validateRequired(v, 'Field'),
        (v) => validateMinLength(v, 10, 'Field')
      );

      const result = validator('');
      expect(result).toContain('required');
      expect(result).not.toContain('10 characters');
    });
  });

  describe('validateRequiredEmail', () => {
    it('validates required email', () => {
      expect(validateRequiredEmail('test@example.com')).toBe(true);
    });

    it('checks both required and email format', () => {
      expect(validateRequiredEmail('')).toContain('required');
      expect(validateRequiredEmail('invalid')).toContain('valid email');
    });
  });

  describe('validateRequiredPassword', () => {
    it('validates required strong password', () => {
      expect(validateRequiredPassword('Passw0rd!')).toBe(true);
    });

    it('checks both required and password strength', () => {
      expect(validateRequiredPassword('')).toContain('required');
      expect(validateRequiredPassword('weak')).toContain('8 characters');
    });
  });

  describe('validateRequiredUsername', () => {
    it('validates required username', () => {
      expect(validateRequiredUsername('john_doe')).toBe(true);
    });

    it('checks both required and username format', () => {
      expect(validateRequiredUsername('')).toContain('required');
      expect(validateRequiredUsername('ab')).toContain('3 characters');
    });
  });
});
