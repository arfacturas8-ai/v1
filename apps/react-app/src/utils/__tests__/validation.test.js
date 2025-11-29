import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateURL,
  sanitizeHTML,
  validateWalletAddress
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(validateEmail('test123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Test123!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
      expect(validatePassword('Str0ng!Pass')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('nouppercase1!')).toBe(false);
      expect(validatePassword('NOLOWERCASE1!')).toBe(false);
      expect(validatePassword('NoNumbers!')).toBe(false);
      expect(validatePassword('NoSpecial1')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('test_user')).toBe(true);
      expect(validateUsername('user-name')).toBe(true);
      expect(validateUsername('abc')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(validateUsername('ab')).toBe(false); // too short
      expect(validateUsername('a'.repeat(31))).toBe(false); // too long
      expect(validateUsername('user name')).toBe(false); // contains space
      expect(validateUsername('user@name')).toBe(false); // invalid character
      expect(validateUsername('')).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://test.com/path')).toBe(true);
      expect(validateURL('https://sub.domain.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not a url')).toBe(false);
      expect(validateURL('ftp://example.com')).toBe(false);
      expect(validateURL('example.com')).toBe(false);
      expect(validateURL('')).toBe(false);
    });
  });

  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
    });

    it('should allow safe HTML', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em></p>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('');
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
    });
  });

  describe('validateWalletAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(validateWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(true);
      expect(validateWalletAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid wallet addresses', () => {
      expect(validateWalletAddress('0x123')).toBe(false); // too short
      expect(validateWalletAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false); // missing 0x
      expect(validateWalletAddress('0xZZZd35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(false); // invalid hex
      expect(validateWalletAddress('')).toBe(false);
    });
  });
});
