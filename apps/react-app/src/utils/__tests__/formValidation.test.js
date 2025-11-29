/**
 * Form Validation Utilities Test Suite
 * Tests for form validation functions
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
} from '../formValidation'

describe('formValidation utilities', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid')).toContain('valid email')
      expect(validateEmail('test@')).toContain('valid email')
      expect(validateEmail('@example.com')).toContain('valid email')
    })

    it('requires email', () => {
      expect(validateEmail('')).toContain('required')
      expect(validateEmail(null)).toContain('required')
    })
  })

  describe('validatePassword', () => {
    it('accepts strong passwords', () => {
      expect(validatePassword('SecurePass123!')).toBe(true)
      expect(validatePassword('MyP@ssw0rd')).toBe(true)
    })

    it('enforces minimum length', () => {
      expect(validatePassword('Short1!')).toContain('at least 8 characters')
    })

    it('requires uppercase letters', () => {
      expect(validatePassword('lowercase123!')).toContain('uppercase')
    })

    it('requires lowercase letters', () => {
      expect(validatePassword('UPPERCASE123!')).toContain('lowercase')
    })

    it('requires numbers', () => {
      expect(validatePassword('NoNumbers!')).toContain('number')
    })

    it('requires special characters', () => {
      expect(validatePassword('NoSpecialChar123')).toContain('special character')
    })

    it('supports custom options', () => {
      const result = validatePassword('short', { minLength: 3, requireUppercase: false, requireNumbers: false, requireSpecialChars: false })
      expect(result).toBe(true)
    })
  })

  describe('validatePasswordConfirmation', () => {
    it('accepts matching passwords', () => {
      expect(validatePasswordConfirmation('password123', 'password123')).toBe(true)
    })

    it('rejects non-matching passwords', () => {
      expect(validatePasswordConfirmation('password123', 'different')).toContain('do not match')
    })

    it('requires confirmation', () => {
      expect(validatePasswordConfirmation('password123', '')).toContain('confirm')
    })
  })

  describe('validateUsername', () => {
    it('accepts valid usernames', () => {
      expect(validateUsername('user123')).toBe(true)
      expect(validateUsername('test_user')).toBe(true)
      expect(validateUsername('user-name')).toBe(true)
    })

    it('enforces minimum length', () => {
      expect(validateUsername('ab')).toContain('at least 3 characters')
    })

    it('enforces maximum length', () => {
      expect(validateUsername('a'.repeat(21))).toContain('less than 20 characters')
    })

    it('rejects invalid characters', () => {
      expect(validateUsername('user@name')).toContain('letters, numbers')
      expect(validateUsername('user name')).toContain('letters, numbers')
    })

    it('requires username', () => {
      expect(validateUsername('')).toContain('required')
    })
  })

  describe('validateURL', () => {
    it('accepts valid URLs', () => {
      expect(validateURL('https://example.com')).toBe(true)
      expect(validateURL('http://test.co.uk')).toBe(true)
      expect(validateURL('https://sub.domain.com/path')).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(validateURL('not-a-url')).toContain('valid URL')
      expect(validateURL('htp://wrong')).toContain('valid URL')
    })

    it('requires URL', () => {
      expect(validateURL('')).toContain('required')
    })
  })

  describe('validatePhone', () => {
    it('accepts valid phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(true)
      expect(validatePhone('(123) 456-7890')).toBe(true)
      expect(validatePhone('+1 234 567 8900')).toBe(true)
    })

    it('enforces minimum digits', () => {
      expect(validatePhone('12345')).toContain('at least 10 digits')
    })

    it('rejects invalid characters', () => {
      expect(validatePhone('123-abc-7890')).toContain('valid phone')
    })

    it('requires phone number', () => {
      expect(validatePhone('')).toContain('required')
    })
  })

  describe('validateRequired', () => {
    it('accepts non-empty values', () => {
      expect(validateRequired('value')).toBe(true)
      expect(validateRequired(123)).toBe(true)
    })

    it('rejects empty values', () => {
      expect(validateRequired('')).toContain('required')
      expect(validateRequired('   ')).toContain('required')
      expect(validateRequired(null)).toContain('required')
    })

    it('uses custom field name', () => {
      expect(validateRequired('', 'Username')).toContain('Username')
    })
  })

  describe('validateMinLength', () => {
    it('accepts values meeting minimum length', () => {
      expect(validateMinLength('hello', 3)).toBe(true)
      expect(validateMinLength('test', 4)).toBe(true)
    })

    it('rejects values below minimum length', () => {
      expect(validateMinLength('hi', 5)).toContain('at least 5')
    })

    it('allows empty for non-required fields', () => {
      expect(validateMinLength('', 5)).toBe(true)
    })
  })

  describe('validateMaxLength', () => {
    it('accepts values within maximum length', () => {
      expect(validateMaxLength('hello', 10)).toBe(true)
      expect(validateMaxLength('test', 10)).toBe(true)
    })

    it('rejects values exceeding maximum length', () => {
      expect(validateMaxLength('toolongstring', 5)).toContain('must be less than 5')
    })

    it('allows empty values', () => {
      expect(validateMaxLength('', 5)).toBe(true)
    })
  })
})
