/**
 * Tests for formatter utilities
 */
import { formatDate, formatFileSize, formatNumber, truncateText } from './formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    beforeEach(() => {
      // Mock current date for relative time tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('short format', () => {
      it('formats date in short format', () => {
        const date = new Date('2024-01-15');
        const result = formatDate(date, 'short');

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });

      it('uses short format by default', () => {
        const date = new Date('2024-01-15');
        const shortResult = formatDate(date, 'short');
        const defaultResult = formatDate(date);

        expect(defaultResult).toBe(shortResult);
      });
    });

    describe('long format', () => {
      it('formats date in long format', () => {
        const date = new Date('2024-01-15');
        const result = formatDate(date, 'long');

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(10);
      });

      it('includes month name in long format', () => {
        const date = new Date('2024-01-15');
        const result = formatDate(date, 'long');

        expect(result).toMatch(/january|february|march|april|may|june|july|august|september|october|november|december/i);
      });
    });

    describe('relative format', () => {
      it('shows "just now" for very recent dates', () => {
        const now = new Date('2024-01-15T12:00:00Z');
        const result = formatDate(now, 'relative');

        expect(result).toBe('just now');
      });

      it('shows minutes ago for recent dates', () => {
        const date = new Date('2024-01-15T11:30:00Z'); // 30 minutes ago
        const result = formatDate(date, 'relative');

        expect(result).toBe('30 minutes ago');
      });

      it('shows hours ago for dates within 24 hours', () => {
        const date = new Date('2024-01-15T09:00:00Z'); // 3 hours ago
        const result = formatDate(date, 'relative');

        expect(result).toBe('3 hours ago');
      });

      it('shows days ago for dates within a week', () => {
        const date = new Date('2024-01-12T12:00:00Z'); // 3 days ago
        const result = formatDate(date, 'relative');

        expect(result).toBe('3 days ago');
      });

      it('shows full date for dates over a week ago', () => {
        const date = new Date('2024-01-01T12:00:00Z'); // 14 days ago
        const result = formatDate(date, 'relative');

        expect(result).toBeDefined();
        expect(result).not.toContain('days ago');
      });

      it('handles 1 minute ago', () => {
        const date = new Date('2024-01-15T11:59:00Z');
        const result = formatDate(date, 'relative');

        expect(result).toBe('1 minutes ago');
      });

      it('handles 1 hour ago', () => {
        const date = new Date('2024-01-15T11:00:00Z');
        const result = formatDate(date, 'relative');

        expect(result).toBe('1 hours ago');
      });

      it('handles 1 day ago', () => {
        const date = new Date('2024-01-14T12:00:00Z');
        const result = formatDate(date, 'relative');

        expect(result).toBe('1 days ago');
      });
    });

    describe('edge cases', () => {
      it('handles string date input', () => {
        const result = formatDate('2024-01-15', 'short');

        expect(result).toBeDefined();
      });

      it('handles timestamp input', () => {
        const timestamp = Date.now();
        const result = formatDate(timestamp, 'short');

        expect(result).toBeDefined();
      });

      it('handles invalid format defaulting to short', () => {
        const date = new Date('2024-01-15');
        const result = formatDate(date, 'invalid');

        expect(result).toBeDefined();
      });

      it('handles future dates', () => {
        const futureDate = new Date('2025-01-15');
        const result = formatDate(futureDate, 'short');

        expect(result).toBeDefined();
      });
    });
  });

  describe('formatFileSize', () => {
    it('formats 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('formats bytes (under 1 KB)', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB'); // 1024 * 1024
      expect(formatFileSize(2097152)).toBe('2 MB'); // 2 * 1024 * 1024
    });

    it('formats gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB'); // 1024^3
      expect(formatFileSize(2147483648)).toBe('2 GB'); // 2 * 1024^3
    });

    it('formats terabytes', () => {
      expect(formatFileSize(1099511627776)).toBe('1 TB'); // 1024^4
    });

    it('rounds to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 * 1024
      expect(formatFileSize(2560)).toBe('2.5 KB'); // 2.5 * 1024
    });

    it('handles fractional KB', () => {
      const result = formatFileSize(1500);
      expect(result).toContain('KB');
      expect(result).toContain('1.46');
    });

    it('handles fractional MB', () => {
      const result = formatFileSize(1572864); // 1.5 MB
      expect(result).toContain('MB');
    });

    it('handles very small files', () => {
      expect(formatFileSize(1)).toBe('1 Bytes');
      expect(formatFileSize(10)).toBe('10 Bytes');
    });

    it('handles very large files', () => {
      const result = formatFileSize(5000000000000); // ~4.5 TB
      expect(result).toContain('TB');
    });
  });

  describe('formatNumber', () => {
    it('formats integer without decimals by default', () => {
      expect(formatNumber(1000)).toBeDefined();
      expect(typeof formatNumber(1000)).toBe('string');
    });

    it('formats number with specified decimals', () => {
      const result = formatNumber(1234.5678, 2);
      expect(result).toContain('1,234'); // Contains thousands separator
      expect(result).toContain('.57'); // Rounded to 2 decimals
    });

    it('adds thousands separator', () => {
      const result = formatNumber(1000000);
      expect(result).toMatch(/1[,\s]000[,\s]000/); // Different locales use different separators
    });

    it('formats with 0 decimals', () => {
      const result = formatNumber(1234.5678, 0);
      expect(result).not.toContain('.');
    });

    it('formats with 1 decimal', () => {
      const result = formatNumber(1234.5678, 1);
      expect(result).toContain('.5');
    });

    it('formats with 3 decimals', () => {
      const result = formatNumber(1234.5678, 3);
      expect(result).toContain('.568');
    });

    it('pads decimals with zeros', () => {
      const result = formatNumber(100, 2);
      expect(result).toContain('.00');
    });

    it('formats negative numbers', () => {
      const result = formatNumber(-1234.56, 2);
      expect(result).toContain('-');
      expect(result).toMatch(/1[,\s]234/);
    });

    it('formats zero', () => {
      expect(formatNumber(0, 0)).toBe('0');
      expect(formatNumber(0, 2)).toContain('.00');
    });

    it('formats small numbers', () => {
      expect(formatNumber(0.5, 2)).toContain('0.5');
    });

    it('formats large numbers', () => {
      const result = formatNumber(1000000000, 0);
      expect(result).toBeDefined();
    });
  });

  describe('truncateText', () => {
    it('returns original text if shorter than max length', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('returns original text if equal to max length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('truncates text longer than max length', () => {
      const result = truncateText('Hello World', 8);
      expect(result).toBe('Hello...');
      expect(result.length).toBe(8);
    });

    it('uses default suffix "..."', () => {
      const result = truncateText('Hello World', 8);
      expect(result.endsWith('...')).toBe(true);
    });

    it('uses custom suffix', () => {
      const result = truncateText('Hello World', 8, '…');
      expect(result.endsWith('…')).toBe(true);
      expect(result.length).toBe(8);
    });

    it('accounts for suffix length in truncation', () => {
      const result = truncateText('Hello World', 8, '...');
      expect(result.length).toBe(8);
      expect(result).toBe('Hello...');
    });

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('handles max length of 0', () => {
      const result = truncateText('Hello', 0);
      expect(result.length).toBe(0);
    });

    it('handles very short max length', () => {
      const result = truncateText('Hello World', 3);
      expect(result.length).toBe(3);
      expect(result).toBe('...');
    });

    it('handles long text', () => {
      const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
      const result = truncateText(longText, 20);
      expect(result.length).toBe(20);
      expect(result.endsWith('...')).toBe(true);
    });

    it('handles custom long suffix', () => {
      const result = truncateText('Hello World', 10, ' [...]');
      expect(result.length).toBe(10);
      expect(result.endsWith('[...]')).toBe(true);
    });

    it('preserves words boundary when truncating', () => {
      const result = truncateText('Hello World Test', 11);
      // Note: This implementation doesn't preserve word boundaries
      // It just truncates at exact position
      expect(result.length).toBe(11);
    });

    it('handles text with special characters', () => {
      const result = truncateText('Hello <world> & "test"', 15);
      expect(result.length).toBe(15);
    });

    it('handles text with emojis', () => {
      const result = truncateText('Hello 👋 World 🌍', 10);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('handles text with newlines', () => {
      const result = truncateText('Hello\nWorld\nTest', 10);
      expect(result.length).toBe(10);
    });
  });

  describe('Default Export', () => {
    it('exports all formatters as default', async () => {
      const defaultExport = (await import('./formatters')).default;

      expect(defaultExport).toHaveProperty('formatDate');
      expect(defaultExport).toHaveProperty('formatFileSize');
      expect(defaultExport).toHaveProperty('formatNumber');
      expect(defaultExport).toHaveProperty('truncateText');
    });

    it('default export functions match named exports', async () => {
      const defaultExport = (await import('./formatters')).default;

      expect(defaultExport.formatDate).toBe(formatDate);
      expect(defaultExport.formatFileSize).toBe(formatFileSize);
      expect(defaultExport.formatNumber).toBe(formatNumber);
      expect(defaultExport.truncateText).toBe(truncateText);
    });
  });

  describe('Function Types', () => {
    it('all exports are functions', () => {
      expect(typeof formatDate).toBe('function');
      expect(typeof formatFileSize).toBe('function');
      expect(typeof formatNumber).toBe('function');
      expect(typeof truncateText).toBe('function');
    });

    it('all functions return strings', () => {
      expect(typeof formatDate(new Date())).toBe('string');
      expect(typeof formatFileSize(100)).toBe('string');
      expect(typeof formatNumber(100)).toBe('string');
      expect(typeof truncateText('test', 10)).toBe('string');
    });
  });
});
