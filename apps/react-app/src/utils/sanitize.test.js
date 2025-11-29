/**
 * Tests for sanitize utilities
 */
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeMarkdown,
  sanitizeURL,
  sanitizeFilename,
  stripHTML,
  escapeHTML,
  sanitizeInput,
  allowedTags,
  allowedAttributes
} from './sanitize';

describe('sanitize', () => {
  describe('sanitizeHTML', () => {
    it('allows safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeHTML(input);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
    });

    it('removes script tags', () => {
      const input = '<p>Safe</p><script>alert("XSS")</script>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Safe');
    });

    it('removes onclick handlers', () => {
      const input = '<button onclick="alert(1)">Click</button>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('removes javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('javascript:');
    });

    it('allows safe attributes', () => {
      const input = '<a href="https://example.com" title="Example">Link</a>';
      const result = sanitizeHTML(input);

      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('title="Example"');
    });

    it('removes style tags', () => {
      const input = '<style>body { display: none; }</style><p>Content</p>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('<style>');
      expect(result).toContain('Content');
    });

    it('removes iframe tags', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('evil.com');
    });

    it('allows images with safe sources', () => {
      const input = '<img src="https://example.com/image.jpg" alt="Test" />';
      const result = sanitizeHTML(input);

      expect(result).toContain('<img');
      expect(result).toContain('src="https://example.com/image.jpg"');
      expect(result).toContain('alt="Test"');
    });

    it('removes data: URLs in images', () => {
      const input = '<img src="data:text/html,<script>alert(1)</script>" />';
      const result = sanitizeHTML(input);

      // DOMPurify typically removes dangerous data URLs
      expect(result).not.toContain('data:text/html');
    });

    it('handles empty input', () => {
      expect(sanitizeHTML('')).toBe('');
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
    });

    it('preserves nested tags', () => {
      const input = '<div><p><strong><em>Nested</em></strong></p></div>';
      const result = sanitizeHTML(input);

      expect(result).toContain('<div>');
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });
  });

  describe('sanitizeText', () => {
    it('strips all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeText(input);

      expect(result).toBe('Hello world');
    });

    it('removes script tags and content', () => {
      const input = 'Safe text<script>alert(1)</script>more text';
      const result = sanitizeText(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('decodes HTML entities', () => {
      const input = '&lt;div&gt;Test&amp;nbsp;&lt;/div&gt;';
      const result = sanitizeText(input);

      expect(result).toContain('<div>');
      expect(result).toContain('</div>');
    });

    it('trims whitespace', () => {
      const input = '  Hello world  ';
      const result = sanitizeText(input);

      expect(result).toBe('Hello world');
    });

    it('handles empty input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });

    it('preserves line breaks', () => {
      const input = 'Line 1\nLine 2';
      const result = sanitizeText(input);

      expect(result).toBe('Line 1\nLine 2');
    });

    it('removes multiple consecutive spaces', () => {
      const input = 'Hello    world';
      const result = sanitizeText(input);

      expect(result).toBe('Hello world');
    });
  });

  describe('sanitizeMarkdown', () => {
    it('allows markdown syntax', () => {
      const input = '# Header\n\n**Bold** and *italic*';
      const result = sanitizeMarkdown(input);

      expect(result).toContain('#');
      expect(result).toContain('**Bold**');
      expect(result).toContain('*italic*');
    });

    it('removes HTML script tags from markdown', () => {
      const input = '# Title\n\n<script>alert(1)</script>';
      const result = sanitizeMarkdown(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('# Title');
    });

    it('allows markdown links', () => {
      const input = '[Link](https://example.com)';
      const result = sanitizeMarkdown(input);

      expect(result).toContain('[Link]');
      expect(result).toContain('https://example.com');
    });

    it('removes javascript: URLs from markdown links', () => {
      const input = '[Click](javascript:alert(1))';
      const result = sanitizeMarkdown(input);

      expect(result).not.toContain('javascript:');
    });

    it('allows code blocks', () => {
      const input = '```javascript\nconst x = 1;\n```';
      const result = sanitizeMarkdown(input);

      expect(result).toContain('```');
      expect(result).toContain('const x = 1;');
    });

    it('allows inline code', () => {
      const input = 'Use `console.log()` to debug';
      const result = sanitizeMarkdown(input);

      expect(result).toContain('`console.log()`');
    });

    it('handles empty input', () => {
      expect(sanitizeMarkdown('')).toBe('');
      expect(sanitizeMarkdown(null)).toBe('');
      expect(sanitizeMarkdown(undefined)).toBe('');
    });
  });

  describe('sanitizeURL', () => {
    it('allows HTTP URLs', () => {
      const url = 'http://example.com/path';
      const result = sanitizeURL(url);

      expect(result).toBe('http://example.com/path');
    });

    it('allows HTTPS URLs', () => {
      const url = 'https://example.com/path';
      const result = sanitizeURL(url);

      expect(result).toBe('https://example.com/path');
    });

    it('blocks javascript: URLs', () => {
      const url = 'javascript:alert(1)';
      const result = sanitizeURL(url);

      expect(result).toBe('');
    });

    it('blocks data: URLs by default', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeURL(url);

      expect(result).toBe('');
    });

    it('allows data: URLs when explicitly permitted', () => {
      const url = 'data:image/png;base64,abc123';
      const result = sanitizeURL(url, { allowData: true });

      expect(result).toBe(url);
    });

    it('blocks file: URLs', () => {
      const url = 'file:///etc/passwd';
      const result = sanitizeURL(url);

      expect(result).toBe('');
    });

    it('allows relative URLs', () => {
      const url = '/path/to/page';
      const result = sanitizeURL(url);

      expect(result).toBe('/path/to/page');
    });

    it('allows anchor links', () => {
      const url = '#section';
      const result = sanitizeURL(url);

      expect(result).toBe('#section');
    });

    it('decodes URL-encoded characters', () => {
      const url = 'https://example.com/path%20with%20spaces';
      const result = sanitizeURL(url);

      expect(result).toContain('example.com');
    });

    it('handles empty input', () => {
      expect(sanitizeURL('')).toBe('');
      expect(sanitizeURL(null)).toBe('');
      expect(sanitizeURL(undefined)).toBe('');
    });

    it('handles malformed URLs', () => {
      const url = 'ht!tp://bad-url';
      const result = sanitizeURL(url);

      expect(result).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('removes path traversal attempts', () => {
      const filename = '../../../etc/passwd';
      const result = sanitizeFilename(filename);

      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('removes null bytes', () => {
      const filename = 'file\0name.txt';
      const result = sanitizeFilename(filename);

      expect(result).not.toContain('\0');
    });

    it('allows valid filenames', () => {
      const filename = 'my-file_123.txt';
      const result = sanitizeFilename(filename);

      expect(result).toBe('my-file_123.txt');
    });

    it('removes special characters', () => {
      const filename = 'file<>:|?*.txt';
      const result = sanitizeFilename(filename);

      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain(':');
      expect(result).not.toContain('|');
      expect(result).not.toContain('?');
      expect(result).not.toContain('*');
    });

    it('preserves file extension', () => {
      const filename = 'document.pdf';
      const result = sanitizeFilename(filename);

      expect(result).toContain('.pdf');
    });

    it('handles filenames with spaces', () => {
      const filename = 'my document.txt';
      const result = sanitizeFilename(filename);

      expect(result).toContain('document');
    });

    it('limits filename length', () => {
      const filename = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(filename);

      expect(result.length).toBeLessThan(256);
    });

    it('handles empty input', () => {
      expect(sanitizeFilename('')).toBe('file');
      expect(sanitizeFilename(null)).toBe('file');
      expect(sanitizeFilename(undefined)).toBe('file');
    });
  });

  describe('stripHTML', () => {
    it('removes all HTML tags', () => {
      const input = '<div><p>Text</p></div>';
      const result = stripHTML(input);

      expect(result).toBe('Text');
    });

    it('removes self-closing tags', () => {
      const input = 'Text<br/>More<hr/>';
      const result = stripHTML(input);

      expect(result).toBe('TextMore');
    });

    it('preserves text content', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = stripHTML(input);

      expect(result).toBe('Hello world!');
    });

    it('handles nested tags', () => {
      const input = '<div><p><span>Deep</span></p></div>';
      const result = stripHTML(input);

      expect(result).toBe('Deep');
    });

    it('handles empty input', () => {
      expect(stripHTML('')).toBe('');
      expect(stripHTML(null)).toBe('');
      expect(stripHTML(undefined)).toBe('');
    });
  });

  describe('escapeHTML', () => {
    it('escapes < and >', () => {
      const input = '<div>Test</div>';
      const result = escapeHTML(input);

      expect(result).toBe('&lt;div&gt;Test&lt;/div&gt;');
    });

    it('escapes ampersands', () => {
      const input = 'Tom & Jerry';
      const result = escapeHTML(input);

      expect(result).toBe('Tom &amp; Jerry');
    });

    it('escapes quotes', () => {
      const input = 'He said "Hello"';
      const result = escapeHTML(input);

      expect(result).toContain('&quot;');
    });

    it('escapes apostrophes', () => {
      const input = "It's working";
      const result = escapeHTML(input);

      expect(result).toContain('&#x27;');
    });

    it('handles empty input', () => {
      expect(escapeHTML('')).toBe('');
      expect(escapeHTML(null)).toBe('');
      expect(escapeHTML(undefined)).toBe('');
    });

    it('escapes multiple characters', () => {
      const input = '<script>alert("XSS")</script>';
      const result = escapeHTML(input);

      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  describe('sanitizeInput', () => {
    it('sanitizes general user input', () => {
      const input = '<p>Hello</p><script>alert(1)</script>';
      const result = sanitizeInput(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('trims whitespace', () => {
      const input = '  Test input  ';
      const result = sanitizeInput(input);

      expect(result).toBe('Test input');
    });

    it('normalizes whitespace', () => {
      const input = 'Test\n\n\nmultiple\n\nlines';
      const result = sanitizeInput(input);

      expect(result).not.toContain('\n\n\n');
    });

    it('handles very long input', () => {
      const input = 'a'.repeat(100000);
      const result = sanitizeInput(input, { maxLength: 1000 });

      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('handles empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  describe('allowedTags', () => {
    it('exports list of allowed tags', () => {
      expect(Array.isArray(allowedTags)).toBe(true);
      expect(allowedTags).toContain('p');
      expect(allowedTags).toContain('div');
      expect(allowedTags).toContain('strong');
      expect(allowedTags).toContain('em');
    });

    it('does not include script in allowed tags', () => {
      expect(allowedTags).not.toContain('script');
    });

    it('does not include iframe in allowed tags', () => {
      expect(allowedTags).not.toContain('iframe');
    });
  });

  describe('allowedAttributes', () => {
    it('exports allowed attributes configuration', () => {
      expect(typeof allowedAttributes).toBe('object');
    });

    it('allows href on links', () => {
      expect(allowedAttributes['a']).toContain('href');
    });

    it('allows src on images', () => {
      expect(allowedAttributes['img']).toContain('src');
    });

    it('allows class attribute', () => {
      const hasClass = Object.values(allowedAttributes).some(attrs => attrs.includes('class'));
      expect(hasClass).toBe(true);
    });
  });

  describe('XSS Prevention', () => {
    it('prevents stored XSS', () => {
      const input = '<img src=x onerror="alert(1)">';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('prevents reflected XSS', () => {
      const input = '"><script>alert(document.cookie)</script>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('document.cookie');
    });

    it('prevents DOM-based XSS', () => {
      const input = '<div id="x"></div><script>document.getElementById("x").innerHTML="XSS"</script>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('innerHTML');
    });

    it('prevents event handler XSS', () => {
      const handlers = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus'];

      handlers.forEach(handler => {
        const input = `<div ${handler}="alert(1)">Test</div>`;
        const result = sanitizeHTML(input);
        expect(result).not.toContain(handler);
      });
    });

    it('prevents CSS-based XSS', () => {
      const input = '<div style="background:url(javascript:alert(1))">Test</div>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('javascript:');
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed HTML', () => {
      const input = '<div><p>Unclosed tags<div>';
      const result = sanitizeHTML(input);

      expect(result).toBeDefined();
    });

    it('handles Unicode characters', () => {
      const input = '<p>Hello 世界 🌍</p>';
      const result = sanitizeHTML(input);

      expect(result).toContain('世界');
      expect(result).toContain('🌍');
    });

    it('handles HTML comments', () => {
      const input = '<!-- Comment --><p>Content</p>';
      const result = sanitizeHTML(input);

      expect(result).toContain('Content');
    });

    it('handles CDATA sections', () => {
      const input = '<![CDATA[Some data]]><p>Content</p>';
      const result = sanitizeHTML(input);

      expect(result).toContain('Content');
    });

    it('handles SVG tags', () => {
      const input = '<svg><script>alert(1)</script></svg>';
      const result = sanitizeHTML(input);

      expect(result).not.toContain('alert');
    });

    it('handles very deeply nested tags', () => {
      let input = 'Content';
      for (let i = 0; i < 100; i++) {
        input = `<div>${input}</div>`;
      }

      const result = sanitizeHTML(input);
      expect(result).toContain('Content');
    });
  });
});
