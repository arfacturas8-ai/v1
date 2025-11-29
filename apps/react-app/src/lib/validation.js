/**
 * CRYB Platform - Form Validation Utilities
 * Centralized validation schemas using Zod
 * Provides consistent validation across the application
 */

import { z } from 'zod'

// ==============================================
// COMMON VALIDATION SCHEMAS
// ==============================================

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')

/**
 * Username validation schema
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')

/**
 * Display name validation schema
 */
export const displayNameSchema = z
  .string()
  .min(2, 'Display name must be at least 2 characters')
  .max(50, 'Display name must be less than 50 characters')
  .trim()

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL must be less than 2048 characters')
  .or(z.literal(''))

/**
 * Bio/Description validation schema
 */
export const bioSchema = z
  .string()
  .max(500, 'Bio must be less than 500 characters')
  .optional()

/**
 * Location validation schema
 */
export const locationSchema = z
  .string()
  .max(100, 'Location must be less than 100 characters')
  .optional()

// ==============================================
// AUTH FORMS
// ==============================================

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

/**
 * Registration form validation schema
 */
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms of Service and Privacy Policy'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

/**
 * Forgot password form validation schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema
})

/**
 * Reset password form validation schema
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

// ==============================================
// PROFILE FORMS
// ==============================================

/**
 * Profile update form validation schema
 */
export const profileUpdateSchema = z.object({
  displayName: displayNameSchema,
  bio: bioSchema,
  location: locationSchema,
  website: urlSchema
})

/**
 * Change password form validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

// ==============================================
// COMMUNITY FORMS
// ==============================================

/**
 * Community creation form validation schema
 */
export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, 'Community name must be at least 3 characters')
    .max(50, 'Community name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-\s]+$/, 'Community name can only contain letters, numbers, spaces, underscores, and hyphens')
    .trim(),
  slug: z
    .string()
    .min(3, 'URL slug must be at least 3 characters')
    .max(50, 'URL slug must be less than 50 characters')
    .regex(/^[a-z0-9_-]+$/, 'URL slug can only contain lowercase letters, numbers, underscores, and hyphens')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .trim(),
  category: z.string().min(1, 'Please select a category'),
  isPrivate: z.boolean().optional(),
  rules: z.string().max(5000, 'Rules must be less than 5000 characters').optional()
})

/**
 * Community update form validation schema
 */
export const updateCommunitySchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .trim(),
  rules: z.string().max(5000, 'Rules must be less than 5000 characters').optional(),
  isPrivate: z.boolean().optional()
})

// ==============================================
// POST & COMMENT FORMS
// ==============================================

/**
 * Post creation form validation schema
 */
export const createPostSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(300, 'Title must be less than 300 characters')
    .trim(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(40000, 'Content must be less than 40,000 characters')
    .trim(),
  communityId: z.string().min(1, 'Please select a community'),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
  nsfw: z.boolean().optional(),
  spoiler: z.boolean().optional()
})

/**
 * Comment creation form validation schema
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(10000, 'Comment must be less than 10,000 characters')
    .trim(),
  postId: z.string().min(1, 'Post ID is required'),
  parentId: z.string().optional()
})

// ==============================================
// SERVER & CHANNEL FORMS
// ==============================================

/**
 * Server creation form validation schema
 */
export const createServerSchema = z.object({
  name: z
    .string()
    .min(2, 'Server name must be at least 2 characters')
    .max(100, 'Server name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  isPrivate: z.boolean().optional()
})

/**
 * Channel creation form validation schema
 */
export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Channel name must be at least 1 character')
    .max(100, 'Channel name must be less than 100 characters')
    .trim(),
  type: z.enum(['TEXT', 'VOICE', 'VIDEO'], {
    errorMap: () => ({ message: 'Please select a channel type' })
  }),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isPrivate: z.boolean().optional()
})

// ==============================================
// MESSAGE FORMS
// ==============================================

/**
 * Message creation form validation schema
 */
export const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message must be less than 4000 characters')
    .trim(),
  channelId: z.string().min(1, 'Channel ID is required')
})

// ==============================================
// CONTACT FORM
// ==============================================

/**
 * Contact form validation schema
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: emailSchema,
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(5000, 'Message must be less than 5000 characters')
    .trim()
})

// ==============================================
// REPORT FORM
// ==============================================

/**
 * Report form validation schema
 */
export const reportSchema = z.object({
  reason: z.enum([
    'SPAM',
    'HARASSMENT',
    'HATE_SPEECH',
    'MISINFORMATION',
    'VIOLENCE',
    'SEXUAL_CONTENT',
    'COPYRIGHT',
    'OTHER'
  ], {
    errorMap: () => ({ message: 'Please select a reason' })
  }),
  details: z
    .string()
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(1000, 'Details must be less than 1000 characters')
    .trim(),
  targetId: z.string().min(1, 'Target ID is required'),
  targetType: z.enum(['POST', 'COMMENT', 'USER', 'COMMUNITY', 'MESSAGE'])
})

// ==============================================
// SEARCH FORM
// ==============================================

/**
 * Search form validation schema
 */
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(500, 'Search query must be less than 500 characters')
    .trim(),
  type: z.enum(['all', 'posts', 'comments', 'users', 'communities', 'servers']).optional(),
  sortBy: z.enum(['relevance', 'date', 'popularity']).optional()
})

// ==============================================
// ADMIN FORMS
// ==============================================

/**
 * Ban user form validation schema
 */
export const banUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be less than 500 characters')
    .trim(),
  duration: z.number().positive('Duration must be positive').optional(),
  deleteContent: z.boolean().optional(),
  notifyUser: z.boolean().optional()
})

/**
 * Content moderation form validation schema
 */
export const moderateContentSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  action: z.enum(['APPROVE', 'REJECT', 'FLAG', 'REMOVE']),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be less than 500 characters')
    .trim()
})

// ==============================================
// HELPER FUNCTIONS
// ==============================================

/**
 * Validate data against a schema
 * @param {z.ZodSchema} schema - Zod schema
 * @param {any} data - Data to validate
 * @returns {{ success: boolean, data?: any, errors?: Record<string, string> }}
 */
export function validate(schema, data) {
  try {
    const validData = schema.parse(data)
    return {
      success: true,
      data: validData,
      errors: null
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return {
        success: false,
        data: null,
        errors
      }
    }
    return {
      success: false,
      data: null,
      errors: { _global: 'Validation failed' }
    }
  }
}

/**
 * Safe parse with error formatting
 * @param {z.ZodSchema} schema - Zod schema
 * @param {any} data - Data to validate
 * @returns {z.SafeParseReturnType}
 */
export function safeParse(schema, data) {
  return schema.safeParse(data)
}

/**
 * Get error messages from Zod error
 * @param {z.ZodError} error - Zod error
 * @returns {Record<string, string>}
 */
export function getErrorMessages(error) {
  const errors = {}
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      const path = err.path.join('.') || '_global'
      errors[path] = err.message
    })
  }
  return errors
}

/**
 * Format validation errors for form display
 * @param {z.ZodError} error - Zod error
 * @returns {Array<{field: string, message: string}>}
 */
export function formatValidationErrors(error) {
  if (!(error instanceof z.ZodError)) {
    return [{ field: '_global', message: 'Validation failed' }]
  }

  return error.errors.map((err) => ({
    field: err.path.join('.') || '_global',
    message: err.message
  }))
}

export default {
  // Schemas
  emailSchema,
  passwordSchema,
  usernameSchema,
  displayNameSchema,
  urlSchema,
  bioSchema,
  locationSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileUpdateSchema,
  changePasswordSchema,
  createCommunitySchema,
  updateCommunitySchema,
  createPostSchema,
  createCommentSchema,
  createServerSchema,
  createChannelSchema,
  createMessageSchema,
  contactFormSchema,
  reportSchema,
  searchSchema,
  banUserSchema,
  moderateContentSchema,

  // Helper functions
  validate,
  safeParse,
  getErrorMessages,
  formatValidationErrors
}
