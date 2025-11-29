/**
 * Sanitize Utilities Test Suite
 * Tests for input sanitization functions
 */
import { sanitizeHTML, sanitizeText, sanitizeMarkdown, sanitizeURL } from '../sanitize'

describe('sanitize utilities', () => {
  describe('sanitizeHTML', () => {
    it('removes dangerous script tags', () => {
      const dirty = '<script>alert("XSS")</script><p>Safe content</p>'
      const clean = sanitizeHTML(dirty)
      expect(clean).not.toContain('<script>')
      expect(clean).toContain('Safe content')
    })

    it('removes event handlers', () => {
      const dirty = '<p onclick="alert(1)">Click me</p>'
      const clean = sanitizeHTML(dirty)
      expect(clean).not.toContain('onclick')
      expect(clean).toContain('Click me')
    })

    it('allows safe HTML tags', () => {
      const dirty = '<p>Hello</p><strong>World</strong>'
      const clean = sanitizeHTML(dirty)
      expect(clean).toContain('<p>')
      expect(clean).toContain('<strong>')
    })

    it('returns empty string for null/undefined', () => {
      expect(sanitizeHTML(null)).toBe('')
      expect(sanitizeHTML(undefined)).toBe('')
    })

    it('allows safe links', () => {
      const dirty = '<a href="https://example.com">Link</a>'
      const clean = sanitizeHTML(dirty)
      expect(clean).toContain('href')
      expect(clean).toContain('https://example.com')
    })

    it('removes javascript: URLs', () => {
      const dirty = '<a href="javascript:alert(1)">Bad Link</a>'
      const clean = sanitizeHTML(dirty)
      expect(clean).not.toContain('javascript:')
    })
  })

  describe('sanitizeText', () => {
    it('strips all HTML tags', () => {
      const dirty = '<p>Hello <strong>World</strong></p>'
      const clean = sanitizeText(dirty)
      expect(clean).toBe('Hello World')
    })

    it('removes script tags and content', () => {
      const dirty = 'Hello<script>alert(1)</script>World'
      const clean = sanitizeText(dirty)
      expect(clean).not.toContain('<script>')
      expect(clean).toContain('Hello')
      expect(clean).toContain('World')
    })

    it('returns empty string for null/undefined', () => {
      expect(sanitizeText(null)).toBe('')
      expect(sanitizeText(undefined)).toBe('')
    })

    it('preserves text content', () => {
      const dirty = 'Plain text with no HTML'
      const clean = sanitizeText(dirty)
      expect(clean).toBe(dirty)
    })
  })

  describe('sanitizeMarkdown', () => {
    it('allows markdown-friendly tags', () => {
      const dirty = '# Heading\n\n**Bold** and *italic*'
      const clean = sanitizeMarkdown(dirty)
      expect(clean).toBeTruthy()
    })

    it('removes dangerous content', () => {
      const dirty = '<script>alert(1)</script># Heading'
      const clean = sanitizeMarkdown(dirty)
      expect(clean).not.toContain('<script>')
    })

    it('returns empty string for null/undefined', () => {
      expect(sanitizeMarkdown(null)).toBe('')
      expect(sanitizeMarkdown(undefined)).toBe('')
    })
  })

  describe('sanitizeURL', () => {
    it('allows https URLs', () => {
      const url = 'https://example.com'
      const clean = sanitizeURL(url)
      expect(clean).toBe(url)
    })

    it('allows http URLs', () => {
      const url = 'http://example.com'
      const clean = sanitizeURL(url)
      expect(clean).toBe(url)
    })

    it('blocks javascript: URLs', () => {
      const url = 'javascript:alert(1)'
      const clean = sanitizeURL(url)
      expect(clean).not.toBe(url)
      expect(clean).toBe('')
    })

    it('blocks data: URLs', () => {
      const url = 'data:text/html,<script>alert(1)</script>'
      const clean = sanitizeURL(url)
      expect(clean).toBe('')
    })

    it('returns empty string for null/undefined', () => {
      expect(sanitizeURL(null)).toBe('')
      expect(sanitizeURL(undefined)).toBe('')
    })
  })
})
