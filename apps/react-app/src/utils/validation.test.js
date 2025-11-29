/**
 * Tests for validation utilities
 */
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidURL,
  isValidPhone,
  isValidDate,
  isValidAge,
  isValidCreditCard,
  isValidCVV,
  isValidZipCode,
  isValidIPAddress,
  isValidMACAddress,
  isValidHexColor,
  isValidFileExtension,
  isValidFileSize,
  validatePasswordStrength,
  validateCOPPA
} from './validation';

describe('validation', () => {
  describe('isValidEmail', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('user_123@test-domain.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('rejects emails without TLD', () => {
      expect(isValidEmail('user@domain')).toBe(false);
    });

    it('rejects emails with multiple @', () => {
      expect(isValidEmail('user@@example.com')).toBe(false);
      expect(isValidEmail('user@test@example.com')).toBe(false);
    });

    it('handles null and undefined', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('validates strong passwords', () => {
      expect(isValidPassword('Password123!')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
      expect(isValidPassword('Str0ng!Pass')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('password')).toBe(false);
      expect(isValidPassword('12345678')).toBe(false);
      expect(isValidPassword('PASSWORD')).toBe(false);
    });

    it('requires minimum length', () => {
      expect(isValidPassword('Pass1!', { minLength: 8 })).toBe(false);
      expect(isValidPassword('Password1!', { minLength: 8 })).toBe(true);
    });

    it('requires uppercase letters', () => {
      expect(isValidPassword('password123!', { requireUppercase: true })).toBe(false);
      expect(isValidPassword('Password123!', { requireUppercase: true })).toBe(true);
    });

    it('requires lowercase letters', () => {
      expect(isValidPassword('PASSWORD123!', { requireLowercase: true })).toBe(false);
      expect(isValidPassword('Password123!', { requireLowercase: true })).toBe(true);
    });

    it('requires numbers', () => {
      expect(isValidPassword('Password!', { requireNumbers: true })).toBe(false);
      expect(isValidPassword('Password1!', { requireNumbers: true })).toBe(true);
    });

    it('requires special characters', () => {
      expect(isValidPassword('Password123', { requireSpecial: true })).toBe(false);
      expect(isValidPassword('Password123!', { requireSpecial: true })).toBe(true);
    });

    it('handles empty input', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('validates correct usernames', () => {
      expect(isValidUsername('john_doe')).toBe(true);
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('test-user')).toBe(true);
      expect(isValidUsername('UserName')).toBe(true);
    });

    it('rejects invalid usernames', () => {
      expect(isValidUsername('ab')).toBe(false); // Too short
      expect(isValidUsername('user@name')).toBe(false); // Invalid character
      expect(isValidUsername('user name')).toBe(false); // Space
      expect(isValidUsername('')).toBe(false);
    });

    it('enforces minimum length', () => {
      expect(isValidUsername('ab', { minLength: 3 })).toBe(false);
      expect(isValidUsername('abc', { minLength: 3 })).toBe(true);
    });

    it('enforces maximum length', () => {
      const longUsername = 'a'.repeat(30);
      expect(isValidUsername(longUsername, { maxLength: 20 })).toBe(false);
      expect(isValidUsername('shortname', { maxLength: 20 })).toBe(true);
    });

    it('rejects reserved usernames', () => {
      const reserved = ['admin', 'root', 'system'];
      expect(isValidUsername('admin', { reserved })).toBe(false);
      expect(isValidUsername('user', { reserved })).toBe(true);
    });

    it('handles case sensitivity for reserved names', () => {
      const reserved = ['admin'];
      expect(isValidUsername('Admin', { reserved, caseSensitive: false })).toBe(false);
      expect(isValidUsername('Admin', { reserved, caseSensitive: true })).toBe(true);
    });
  });

  describe('isValidURL', () => {
    it('validates HTTP URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('http://www.example.com/path')).toBe(true);
    });

    it('validates HTTPS URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('https://example.com:8080/path?query=1')).toBe(true);
    });

    it('validates URLs with subdomains', () => {
      expect(isValidURL('https://sub.domain.example.com')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('htp://example.com')).toBe(false);
      expect(isValidURL('example.com')).toBe(false); // Missing protocol
    });

    it('allows protocol-relative URLs', () => {
      expect(isValidURL('//example.com', { allowRelative: true })).toBe(true);
    });

    it('validates URLs with query parameters', () => {
      expect(isValidURL('https://example.com?param=value&other=123')).toBe(true);
    });

    it('validates URLs with fragments', () => {
      expect(isValidURL('https://example.com/page#section')).toBe(true);
    });

    it('handles empty input', () => {
      expect(isValidURL('')).toBe(false);
      expect(isValidURL(null)).toBe(false);
      expect(isValidURL(undefined)).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('validates US phone numbers', () => {
      expect(isValidPhone('(555) 123-4567')).toBe(true);
      expect(isValidPhone('555-123-4567')).toBe(true);
      expect(isValidPhone('5551234567')).toBe(true);
      expect(isValidPhone('+1 555 123 4567')).toBe(true);
    });

    it('validates international phone numbers', () => {
      expect(isValidPhone('+44 20 7123 4567')).toBe(true);
      expect(isValidPhone('+81-3-1234-5678')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcd')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });

    it('validates specific country formats', () => {
      expect(isValidPhone('555-123-4567', { country: 'US' })).toBe(true);
      expect(isValidPhone('+44 20 7123 4567', { country: 'UK' })).toBe(true);
    });

    it('handles extensions', () => {
      expect(isValidPhone('555-123-4567 ext. 123')).toBe(true);
      expect(isValidPhone('555-123-4567 x123')).toBe(true);
    });
  });

  describe('isValidDate', () => {
    it('validates date objects', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-01'))).toBe(true);
    });

    it('validates date strings', () => {
      expect(isValidDate('2024-01-01')).toBe(true);
      expect(isValidDate('01/01/2024')).toBe(true);
      expect(isValidDate('January 1, 2024')).toBe(true);
    });

    it('rejects invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2024-13-01')).toBe(false); // Invalid month
      expect(isValidDate('2024-01-32')).toBe(false); // Invalid day
    });

    it('validates date ranges', () => {
      const minDate = new Date('2020-01-01');
      const maxDate = new Date('2025-12-31');

      expect(isValidDate('2023-06-15', { min: minDate, max: maxDate })).toBe(true);
      expect(isValidDate('2019-06-15', { min: minDate, max: maxDate })).toBe(false);
      expect(isValidDate('2026-06-15', { min: minDate, max: maxDate })).toBe(false);
    });

    it('validates future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isValidDate(futureDate, { allowFuture: true })).toBe(true);
      expect(isValidDate(futureDate, { allowFuture: false })).toBe(false);
    });

    it('validates past dates', () => {
      const pastDate = new Date('2000-01-01');
      expect(isValidDate(pastDate, { allowPast: true })).toBe(true);
      expect(isValidDate(pastDate, { allowPast: false })).toBe(false);
    });
  });

  describe('isValidAge', () => {
    it('validates legal adult age', () => {
      expect(isValidAge(25)).toBe(true);
      expect(isValidAge(18)).toBe(true);
      expect(isValidAge(65)).toBe(true);
    });

    it('rejects underage', () => {
      expect(isValidAge(15, { minAge: 18 })).toBe(false);
      expect(isValidAge(17, { minAge: 18 })).toBe(false);
    });

    it('validates with custom minimum age', () => {
      expect(isValidAge(12, { minAge: 13 })).toBe(false);
      expect(isValidAge(13, { minAge: 13 })).toBe(true);
    });

    it('validates with maximum age', () => {
      expect(isValidAge(70, { maxAge: 65 })).toBe(false);
      expect(isValidAge(60, { maxAge: 65 })).toBe(true);
    });

    it('validates from birthdate', () => {
      const birthdate = new Date();
      birthdate.setFullYear(birthdate.getFullYear() - 25);

      expect(isValidAge(birthdate, { minAge: 18 })).toBe(true);
    });

    it('rejects invalid input', () => {
      expect(isValidAge(-5)).toBe(false);
      expect(isValidAge(150)).toBe(false);
      expect(isValidAge('abc')).toBe(false);
    });
  });

  describe('isValidCreditCard', () => {
    it('validates Visa cards', () => {
      expect(isValidCreditCard('4532015112830366')).toBe(true); // Valid Visa
    });

    it('validates Mastercard', () => {
      expect(isValidCreditCard('5425233430109903')).toBe(true); // Valid Mastercard
    });

    it('validates American Express', () => {
      expect(isValidCreditCard('374245455400126')).toBe(true); // Valid Amex
    });

    it('uses Luhn algorithm', () => {
      expect(isValidCreditCard('4532015112830367')).toBe(false); // Invalid checksum
    });

    it('rejects cards with invalid length', () => {
      expect(isValidCreditCard('123')).toBe(false);
      expect(isValidCreditCard('12345678901234567890')).toBe(false);
    });

    it('rejects non-numeric input', () => {
      expect(isValidCreditCard('abcd-efgh-ijkl-mnop')).toBe(false);
    });

    it('handles cards with spaces and dashes', () => {
      expect(isValidCreditCard('4532-0151-1283-0366')).toBe(true);
      expect(isValidCreditCard('4532 0151 1283 0366')).toBe(true);
    });

    it('handles empty input', () => {
      expect(isValidCreditCard('')).toBe(false);
      expect(isValidCreditCard(null)).toBe(false);
      expect(isValidCreditCard(undefined)).toBe(false);
    });
  });

  describe('isValidCVV', () => {
    it('validates 3-digit CVV', () => {
      expect(isValidCVV('123')).toBe(true);
      expect(isValidCVV('999')).toBe(true);
    });

    it('validates 4-digit CVV for Amex', () => {
      expect(isValidCVV('1234', { cardType: 'amex' })).toBe(true);
    });

    it('rejects invalid CVV', () => {
      expect(isValidCVV('12')).toBe(false);
      expect(isValidCVV('12345')).toBe(false);
      expect(isValidCVV('abc')).toBe(false);
    });

    it('handles empty input', () => {
      expect(isValidCVV('')).toBe(false);
      expect(isValidCVV(null)).toBe(false);
    });
  });

  describe('isValidZipCode', () => {
    it('validates US ZIP codes', () => {
      expect(isValidZipCode('12345')).toBe(true);
      expect(isValidZipCode('12345-6789')).toBe(true);
    });

    it('validates Canadian postal codes', () => {
      expect(isValidZipCode('K1A 0B1', { country: 'CA' })).toBe(true);
      expect(isValidZipCode('K1A0B1', { country: 'CA' })).toBe(true);
    });

    it('validates UK postcodes', () => {
      expect(isValidZipCode('SW1A 1AA', { country: 'UK' })).toBe(true);
    });

    it('rejects invalid ZIP codes', () => {
      expect(isValidZipCode('123')).toBe(false);
      expect(isValidZipCode('abcde')).toBe(false);
    });

    it('handles empty input', () => {
      expect(isValidZipCode('')).toBe(false);
      expect(isValidZipCode(null)).toBe(false);
    });
  });

  describe('isValidIPAddress', () => {
    it('validates IPv4 addresses', () => {
      expect(isValidIPAddress('192.168.1.1')).toBe(true);
      expect(isValidIPAddress('10.0.0.1')).toBe(true);
      expect(isValidIPAddress('255.255.255.255')).toBe(true);
    });

    it('rejects invalid IPv4', () => {
      expect(isValidIPAddress('256.1.1.1')).toBe(false);
      expect(isValidIPAddress('192.168.1')).toBe(false);
      expect(isValidIPAddress('192.168.1.1.1')).toBe(false);
    });

    it('validates IPv6 addresses', () => {
      expect(isValidIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isValidIPAddress('2001:db8::8a2e:370:7334')).toBe(true);
      expect(isValidIPAddress('::')).toBe(true); // Loopback shorthand
    });

    it('validates IPv4 only', () => {
      expect(isValidIPAddress('192.168.1.1', { version: 4 })).toBe(true);
      expect(isValidIPAddress('2001:db8::1', { version: 4 })).toBe(false);
    });

    it('validates IPv6 only', () => {
      expect(isValidIPAddress('2001:db8::1', { version: 6 })).toBe(true);
      expect(isValidIPAddress('192.168.1.1', { version: 6 })).toBe(false);
    });
  });

  describe('isValidMACAddress', () => {
    it('validates MAC addresses with colons', () => {
      expect(isValidMACAddress('00:1A:2B:3C:4D:5E')).toBe(true);
      expect(isValidMACAddress('FF:FF:FF:FF:FF:FF')).toBe(true);
    });

    it('validates MAC addresses with dashes', () => {
      expect(isValidMACAddress('00-1A-2B-3C-4D-5E')).toBe(true);
    });

    it('validates MAC addresses without separators', () => {
      expect(isValidMACAddress('001A2B3C4D5E')).toBe(true);
    });

    it('rejects invalid MAC addresses', () => {
      expect(isValidMACAddress('00:1A:2B:3C:4D')).toBe(false); // Too short
      expect(isValidMACAddress('ZZ:ZZ:ZZ:ZZ:ZZ:ZZ')).toBe(false); // Invalid hex
    });
  });

  describe('isValidHexColor', () => {
    it('validates 6-digit hex colors', () => {
      expect(isValidHexColor('#FF5733')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
    });

    it('validates 3-digit hex colors', () => {
      expect(isValidHexColor('#F00')).toBe(true);
      expect(isValidHexColor('#0F0')).toBe(true);
      expect(isValidHexColor('#00F')).toBe(true);
    });

    it('validates without hash symbol', () => {
      expect(isValidHexColor('FF5733', { requireHash: false })).toBe(true);
      expect(isValidHexColor('F00', { requireHash: false })).toBe(true);
    });

    it('rejects invalid hex colors', () => {
      expect(isValidHexColor('#GG5733')).toBe(false); // Invalid characters
      expect(isValidHexColor('#FF57')).toBe(false); // Invalid length
      expect(isValidHexColor('FF5733')).toBe(false); // Missing hash (if required)
    });
  });

  describe('isValidFileExtension', () => {
    it('validates allowed extensions', () => {
      const allowed = ['.jpg', '.png', '.gif'];
      expect(isValidFileExtension('photo.jpg', allowed)).toBe(true);
      expect(isValidFileExtension('image.png', allowed)).toBe(true);
    });

    it('rejects disallowed extensions', () => {
      const allowed = ['.jpg', '.png'];
      expect(isValidFileExtension('document.pdf', allowed)).toBe(false);
      expect(isValidFileExtension('script.exe', allowed)).toBe(false);
    });

    it('handles case insensitivity', () => {
      const allowed = ['.jpg'];
      expect(isValidFileExtension('photo.JPG', allowed, { caseSensitive: false })).toBe(true);
      expect(isValidFileExtension('photo.JPG', allowed, { caseSensitive: true })).toBe(false);
    });

    it('handles extensions without dots', () => {
      const allowed = ['jpg', 'png'];
      expect(isValidFileExtension('photo.jpg', allowed)).toBe(true);
    });

    it('handles files with multiple dots', () => {
      const allowed = ['.tar.gz'];
      expect(isValidFileExtension('archive.tar.gz', allowed)).toBe(true);
    });
  });

  describe('isValidFileSize', () => {
    it('validates file size within limit', () => {
      const file = new File(['a'.repeat(1000)], 'test.txt');
      expect(isValidFileSize(file, { maxSize: 2000 })).toBe(true);
    });

    it('rejects file size over limit', () => {
      const file = new File(['a'.repeat(5000)], 'test.txt');
      expect(isValidFileSize(file, { maxSize: 1000 })).toBe(false);
    });

    it('validates minimum file size', () => {
      const file = new File(['content'], 'test.txt');
      expect(isValidFileSize(file, { minSize: 5 })).toBe(true);
      expect(isValidFileSize(file, { minSize: 100 })).toBe(false);
    });

    it('handles empty files', () => {
      const file = new File([], 'empty.txt');
      expect(isValidFileSize(file, { minSize: 1 })).toBe(false);
      expect(isValidFileSize(file, { allowEmpty: true })).toBe(true);
    });

    it('handles MB/KB units', () => {
      const file = new File(['a'.repeat(2000000)], 'large.txt');
      expect(isValidFileSize(file, { maxSize: '3MB' })).toBe(true);
      expect(isValidFileSize(file, { maxSize: '1MB' })).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('returns strength score for passwords', () => {
      const weak = validatePasswordStrength('pass');
      const medium = validatePasswordStrength('Password1');
      const strong = validatePasswordStrength('P@ssw0rd!123');

      expect(weak.score).toBeLessThan(medium.score);
      expect(medium.score).toBeLessThan(strong.score);
    });

    it('provides feedback for weak passwords', () => {
      const result = validatePasswordStrength('weak');

      expect(result.feedback).toBeDefined();
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('checks for common patterns', () => {
      const result = validatePasswordStrength('password123');

      expect(result.hasCommonPattern).toBe(true);
    });

    it('checks password length', () => {
      const short = validatePasswordStrength('P@ss1');
      const long = validatePasswordStrength('P@ssw0rd!VeryLongPassword123');

      expect(short.lengthScore).toBeLessThan(long.lengthScore);
    });

    it('identifies character variety', () => {
      const result = validatePasswordStrength('P@ssw0rd!123');

      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumbers).toBe(true);
      expect(result.hasSpecialChars).toBe(true);
    });
  });

  describe('validateCOPPA', () => {
    it('validates users 13 and older', () => {
      const birthdate = new Date();
      birthdate.setFullYear(birthdate.getFullYear() - 15);

      expect(validateCOPPA(birthdate)).toBe(true);
    });

    it('rejects users under 13', () => {
      const birthdate = new Date();
      birthdate.setFullYear(birthdate.getFullYear() - 10);

      expect(validateCOPPA(birthdate)).toBe(false);
    });

    it('validates exactly 13 years old', () => {
      const birthdate = new Date();
      birthdate.setFullYear(birthdate.getFullYear() - 13);

      expect(validateCOPPA(birthdate)).toBe(true);
    });

    it('handles age as number', () => {
      expect(validateCOPPA(15)).toBe(true);
      expect(validateCOPPA(10)).toBe(false);
      expect(validateCOPPA(13)).toBe(true);
    });

    it('rejects invalid input', () => {
      expect(validateCOPPA('invalid')).toBe(false);
      expect(validateCOPPA(null)).toBe(false);
      expect(validateCOPPA(undefined)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles null and undefined gracefully', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
      expect(isValidUsername(null)).toBe(false);
    });

    it('handles very long inputs', () => {
      const longString = 'a'.repeat(10000);
      expect(isValidEmail(longString)).toBe(false);
      expect(isValidUsername(longString)).toBe(false);
    });

    it('handles special characters', () => {
      expect(isValidUsername('user™')).toBe(false);
      expect(isValidEmail('user™@example.com')).toBe(false);
    });

    it('handles Unicode in usernames', () => {
      expect(isValidUsername('用户名', { allowUnicode: true })).toBe(true);
      expect(isValidUsername('用户名', { allowUnicode: false })).toBe(false);
    });

    it('handles whitespace-only input', () => {
      expect(isValidEmail('   ')).toBe(false);
      expect(isValidPassword('   ')).toBe(false);
      expect(isValidUsername('   ')).toBe(false);
    });
  });
});
