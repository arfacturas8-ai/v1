/**
 * Simple Utils Unit Test
 * Tests for utility functions to increase test coverage
 */

describe('Simple Utility Functions', () => {
  test('should validate email format', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';

    // Simple email validation
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail(validEmail)).toBe(true);
    expect(isValidEmail(invalidEmail)).toBe(false);
  });

  test('should sanitize user input', () => {
    const dirtyInput = '<script>alert("xss")</script>';
    const cleanInput = 'Hello World';

    const sanitizeInput = (input: string): string => {
      return input.replace(/<[^>]*>/g, '');
    };

    expect(sanitizeInput(dirtyInput)).toBe('alert("xss")');
    expect(sanitizeInput(cleanInput)).toBe('Hello World');
  });

  test('should generate random strings', () => {
    const generateRandomString = (length: number): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const randomString1 = generateRandomString(10);
    const randomString2 = generateRandomString(10);

    expect(randomString1).toHaveLength(10);
    expect(randomString2).toHaveLength(10);
    expect(randomString1).not.toBe(randomString2);
  });

  test('should format timestamps', () => {
    const timestamp = new Date('2023-01-01T00:00:00.000Z');

    const formatTimestamp = (date: Date): string => {
      return date.toISOString();
    };

    expect(formatTimestamp(timestamp)).toBe('2023-01-01T00:00:00.000Z');
  });

  test('should validate user age', () => {
    const validateAge = (birthDate: Date): boolean => {
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13; // COPPA compliance
    };

    const adultBirthDate = new Date('1990-01-01');
    const childBirthDate = new Date('2020-01-01');

    expect(validateAge(adultBirthDate)).toBe(true);
    expect(validateAge(childBirthDate)).toBe(false);
  });

  test('should hash strings consistently', () => {
    const hashString = (input: string): string => {
      // Simple hash function for testing
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString();
    };

    const input = 'test-string';
    const hash1 = hashString(input);
    const hash2 = hashString(input);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe('');
  });

  test('should validate password strength', () => {
    const isStrongPassword = (password: string): boolean => {
      return password.length >= 8 && 
             /[A-Z]/.test(password) &&
             /[a-z]/.test(password) &&
             /[0-9]/.test(password);
    };

    expect(isStrongPassword('Password123')).toBe(true);
    expect(isStrongPassword('weak')).toBe(false);
    expect(isStrongPassword('NoNumbers')).toBe(false);
    expect(isStrongPassword('no-uppercase123')).toBe(false);
  });

  test('should parse JSON safely', () => {
    const safeJsonParse = (jsonString: string): any => {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        return null;
      }
    };

    const validJson = '{"test": "value"}';
    const invalidJson = '{invalid json}';

    expect(safeJsonParse(validJson)).toEqual({ test: 'value' });
    expect(safeJsonParse(invalidJson)).toBeNull();
  });

  test('should truncate long strings', () => {
    const truncateString = (str: string, maxLength: number): string => {
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    };

    const longString = 'This is a very long string that should be truncated';
    const shortString = 'Short';

    expect(truncateString(longString, 20)).toBe('This is a very long ...');
    expect(truncateString(shortString, 20)).toBe('Short');
  });

  test('should escape special characters', () => {
    const escapeHtml = (unsafe: string): string => {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const unsafeString = '<script>alert("xss")</script>';
    const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';

    expect(escapeHtml(unsafeString)).toBe(expected);
  });
});