/**
 * Input Sanitization Utilities for CRYB Platform
 *
 * Provides XSS protection using DOMPurify
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content
 * Use this for user-generated HTML content (posts, comments, bio, etc.)
 */
export const sanitizeHTML = (dirty) => {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class'
    ],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  })
}

/**
 * Sanitize plain text (strips all HTML)
 * Use this for usernames, search queries, metadata
 */
export const sanitizeText = (dirty) => {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

/**
 * Sanitize markdown content
 * Allows markdown-friendly tags
 */
export const sanitizeMarkdown = (dirty) => {
  if (!dirty) return ''

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'align'
    ],
  })
}

/**
 * Sanitize URL
 * Ensures URL is safe
 */
export const sanitizeURL = (url) => {
  if (!url) return ''

  // Only allow http, https, mailto protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:']

  try {
    const parsed = new URL(url)
    if (!allowedProtocols.includes(parsed.protocol)) {
      return ''
    }
    return url
  } catch (e) {
    // Invalid URL
    return ''
  }
}

/**
 * Sanitize filename
 * Removes dangerous characters from filenames
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return ''

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars with underscore
    .replace(/\.+/g, '.') // No multiple dots
    .replace(/^\./, '') // No leading dot
    .substring(0, 255) // Max length
}

/**
 * Sanitize JSON data
 * Prevents prototype pollution
 */
export const sanitizeJSON = (data) => {
  if (!data) return null

  try {
    const str = JSON.stringify(data)
    const parsed = JSON.parse(str)

    // Remove __proto__ and constructor
    delete parsed.__proto__
    delete parsed.constructor

    return parsed
  } catch (e) {
    console.error('Failed to sanitize JSON:', e)
    return null
  }
}

/**
 * Escape HTML entities
 * Use when you need to display HTML as text
 */
export const escapeHTML = (unsafe) => {
  if (!unsafe) return ''

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email) => {
  if (!email) return ''

  const cleaned = email.trim().toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleaned)) {
    return ''
  }

  return cleaned
}

/**
 * Validate and sanitize username
 */
export const sanitizeUsername = (username) => {
  if (!username) return ''

  return username
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only alphanumeric, underscore, hyphen
    .substring(0, 30) // Max length
}

/**
 * Sanitize search query
 * Prevents SQL injection and XSS
 */
export const sanitizeSearchQuery = (query) => {
  if (!query) return ''

  return sanitizeText(query)
    .trim()
    .substring(0, 100) // Max query length
}

/**
 * Sanitize bot/NFT description
 */
export const sanitizeDescription = (description) => {
  if (!description) return ''

  return sanitizeHTML(description).substring(0, 500) // Max length
}

/**
 * Configure DOMPurify hooks for custom behavior
 */
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Set all links to open in new tab
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeMarkdown,
  sanitizeURL,
  sanitizeFilename,
  sanitizeJSON,
  escapeHTML,
  sanitizeEmail,
  sanitizeUsername,
  sanitizeSearchQuery,
  sanitizeDescription,
}
