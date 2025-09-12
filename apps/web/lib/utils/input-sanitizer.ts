"use client";

// Input sanitization utility for preventing XSS and ensuring safe content

interface SanitizationOptions {
  maxLength?: number;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  removeEmptyTags?: boolean;
  preventScripts?: boolean;
  normalizeWhitespace?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  warnings: string[];
}

const DEFAULT_OPTIONS: Required<SanitizationOptions> = {
  maxLength: 2000,
  allowedTags: ['b', 'strong', 'i', 'em', 'u', 'code', 'pre', 'br'],
  allowedAttributes: {
    '*': ['class'],
    'code': ['class'],
    'pre': ['class'],
  },
  removeEmptyTags: true,
  preventScripts: true,
  normalizeWhitespace: true,
};

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = [
  // Script tags and javascript:
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  
  // Event handlers
  /on\w+\s*=/gi,
  
  // Meta refresh and other dangerous tags
  /<meta\s+http-equiv\s*=\s*["']?refresh["']?/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
  /<link\b/gi,
  /<style\b/gi,
  
  // Form elements that could be misused
  /<form\b/gi,
  /<input\b/gi,
  /<textarea\b/gi,
  /<select\b/gi,
  
  // Comments that could hide malicious content
  /<!--.*?-->/gs,
];

// Potentially unsafe URL schemes
const UNSAFE_SCHEMES = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application/',
  'file:',
];

export class InputSanitizer {
  private options: Required<SanitizationOptions>;

  constructor(options: SanitizationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Sanitize and validate text input for chat messages
   */
  sanitizeMessage(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Initial validation
      if (typeof input !== 'string') {
        return {
          isValid: false,
          sanitized: '',
          errors: ['Input must be a string'],
          warnings: [],
        };
      }

      let sanitized = input;

      // Check length
      if (sanitized.length > this.options.maxLength) {
        warnings.push(`Message truncated to ${this.options.maxLength} characters`);
        sanitized = sanitized.substring(0, this.options.maxLength);
      }

      // Remove dangerous patterns
      for (const pattern of DANGEROUS_PATTERNS) {
        const matches = sanitized.match(pattern);
        if (matches) {
          warnings.push(`Removed potentially dangerous content: ${matches.length} instances`);
          sanitized = sanitized.replace(pattern, '');
        }
      }

      // Sanitize HTML if any tags are present
      if (sanitized.includes('<') || sanitized.includes('>')) {
        sanitized = this.sanitizeHtml(sanitized);
        warnings.push('HTML content has been sanitized');
      }

      // Normalize whitespace
      if (this.options.normalizeWhitespace) {
        sanitized = this.normalizeWhitespace(sanitized);
      }

      // Check for remaining suspicious content
      const suspiciousPatterns = [
        /eval\s*\(/gi,
        /Function\s*\(/gi,
        /setTimeout\s*\(/gi,
        /setInterval\s*\(/gi,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(sanitized)) {
          warnings.push('Potentially suspicious content detected');
          break;
        }
      }

      // Final validation
      const isEmpty = sanitized.trim().length === 0;
      
      return {
        isValid: !isEmpty && errors.length === 0,
        sanitized: sanitized.trim(),
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error in sanitizeMessage:', error);
      return {
        isValid: false,
        sanitized: '',
        errors: ['Failed to sanitize message'],
        warnings: [],
      };
    }
  }

  /**
   * Sanitize HTML content while preserving allowed tags
   */
  private sanitizeHtml(html: string): string {
    try {
      // Create a temporary container
      const temp = document.createElement('div');
      temp.innerHTML = html;

      // Recursively process all nodes
      this.sanitizeNode(temp);

      return temp.innerHTML;
    } catch (error) {
      console.error('Error sanitizing HTML:', error);
      // Fallback: strip all HTML
      return html.replace(/<[^>]*>/g, '');
    }
  }

  /**
   * Recursively sanitize DOM nodes
   */
  private sanitizeNode(node: Node): void {
    const nodesToRemove: Node[] = [];
    
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();
        
        // Check if tag is allowed
        if (!this.options.allowedTags.includes(tagName)) {
          // Remove tag but keep content
          while (element.firstChild) {
            node.insertBefore(element.firstChild, element);
          }
          nodesToRemove.push(element);
          continue;
        }

        // Sanitize attributes
        this.sanitizeAttributes(element);

        // Remove empty tags if configured
        if (this.options.removeEmptyTags && this.isEmptyTag(element)) {
          nodesToRemove.push(element);
          continue;
        }

        // Recursively sanitize children
        this.sanitizeNode(element);
      }
    }

    // Remove marked nodes
    nodesToRemove.forEach(nodeToRemove => {
      if (nodeToRemove.parentNode) {
        nodeToRemove.parentNode.removeChild(nodeToRemove);
      }
    });
  }

  /**
   * Sanitize element attributes
   */
  private sanitizeAttributes(element: Element): void {
    const tagName = element.tagName.toLowerCase();
    const allowedAttrs = this.options.allowedAttributes[tagName] || this.options.allowedAttributes['*'] || [];
    
    const attributesToRemove: string[] = [];
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      const attrName = attr.name.toLowerCase();
      
      // Remove if not in allowed list
      if (!allowedAttrs.includes(attrName)) {
        attributesToRemove.push(attr.name);
        continue;
      }

      // Check attribute value for unsafe content
      if (this.hasUnsafeAttributeValue(attr.value)) {
        attributesToRemove.push(attr.name);
      }
    }

    // Remove unsafe attributes
    attributesToRemove.forEach(attrName => {
      element.removeAttribute(attrName);
    });
  }

  /**
   * Check if an attribute value contains unsafe content
   */
  private hasUnsafeAttributeValue(value: string): boolean {
    const lowerValue = value.toLowerCase();
    
    // Check for unsafe URL schemes
    for (const scheme of UNSAFE_SCHEMES) {
      if (lowerValue.includes(scheme)) {
        return true;
      }
    }

    // Check for event handlers in attribute values
    if (/on\w+\s*=/.test(lowerValue)) {
      return true;
    }

    return false;
  }

  /**
   * Check if an element is effectively empty
   */
  private isEmptyTag(element: Element): boolean {
    const textContent = element.textContent?.trim() || '';
    return textContent.length === 0 && element.children.length === 0;
  }

  /**
   * Normalize whitespace in text
   */
  private normalizeWhitespace(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')   // Convert remaining \r to \n
      .replace(/\t/g, '    ') // Convert tabs to spaces
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .replace(/[ \u00a0]+/g, ' '); // Normalize spaces (including non-breaking spaces)
  }

  /**
   * Sanitize a username or display name
   */
  sanitizeUsername(username: string): ValidationResult {
    try {
      if (typeof username !== 'string') {
        return {
          isValid: false,
          sanitized: '',
          errors: ['Username must be a string'],
          warnings: [],
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      
      let sanitized = username.trim();

      // Remove all HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');

      // Remove dangerous characters
      sanitized = sanitized.replace(/[<>'"&]/g, '');

      // Normalize whitespace
      sanitized = sanitized.replace(/\s+/g, ' ').trim();

      // Length validation
      if (sanitized.length === 0) {
        errors.push('Username cannot be empty');
      } else if (sanitized.length > 32) {
        warnings.push('Username truncated to 32 characters');
        sanitized = sanitized.substring(0, 32);
      }

      // Check for suspicious patterns
      if (/^\s*$/.test(sanitized)) {
        errors.push('Username cannot contain only whitespace');
      }

      return {
        isValid: errors.length === 0,
        sanitized,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error sanitizing username:', error);
      return {
        isValid: false,
        sanitized: '',
        errors: ['Failed to sanitize username'],
        warnings: [],
      };
    }
  }

  /**
   * Sanitize a file name
   */
  sanitizeFileName(fileName: string): ValidationResult {
    try {
      if (typeof fileName !== 'string') {
        return {
          isValid: false,
          sanitized: '',
          errors: ['File name must be a string'],
          warnings: [],
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      
      let sanitized = fileName.trim();

      // Remove path traversal attempts
      sanitized = sanitized.replace(/\.\.+/g, '.');
      sanitized = sanitized.replace(/[\/\\]/g, '_');

      // Remove dangerous characters
      sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '_');

      // Remove leading/trailing dots and spaces
      sanitized = sanitized.replace(/^[\s\.]+|[\s\.]+$/g, '');

      // Check for reserved names (Windows)
      const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
      if (reservedNames.includes(sanitized.toUpperCase())) {
        sanitized = `_${sanitized}`;
        warnings.push('File name was a reserved system name and has been modified');
      }

      // Length validation
      if (sanitized.length === 0) {
        errors.push('File name cannot be empty');
      } else if (sanitized.length > 255) {
        warnings.push('File name truncated to 255 characters');
        sanitized = sanitized.substring(0, 255);
      }

      return {
        isValid: errors.length === 0,
        sanitized,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error sanitizing file name:', error);
      return {
        isValid: false,
        sanitized: '',
        errors: ['Failed to sanitize file name'],
        warnings: [],
      };
    }
  }

  /**
   * Update sanitization options
   */
  updateOptions(newOptions: Partial<SanitizationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

// Create a singleton instance for the application
export const inputSanitizer = new InputSanitizer();

// Utility functions for common use cases
export function sanitizeMessageContent(content: string): ValidationResult {
  return inputSanitizer.sanitizeMessage(content);
}

export function sanitizeUserInput(input: string): string {
  const result = inputSanitizer.sanitizeMessage(input);
  return result.sanitized;
}

export function isValidMessage(content: string): boolean {
  const result = inputSanitizer.sanitizeMessage(content);
  return result.isValid;
}

export function sanitizeDisplayName(name: string): string {
  const result = inputSanitizer.sanitizeUsername(name);
  return result.sanitized;
}

export function sanitizeFileUploadName(fileName: string): string {
  const result = inputSanitizer.sanitizeFileName(fileName);
  return result.sanitized;
}