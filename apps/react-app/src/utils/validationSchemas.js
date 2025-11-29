/**
 * CRYB Platform - Validation Schemas
 * Comprehensive Yup validation schemas for all forms
 */

import * as Yup from 'yup'

// Common regex patterns
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/
const COMMUNITY_NAME_REGEX = /^[a-z0-9]{3,21}$/

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required')
})

export const registerSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(USERNAME_REGEX, 'Username can only contain letters, numbers, underscores, and hyphens')
    .required('Username is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  acceptTerms: Yup.boolean()
    .oneOf([true], 'You must accept the Terms of Service and Privacy Policy')
})

export const passwordResetSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
})

export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .notOneOf([Yup.ref('currentPassword')], 'New password must be different from current password')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Please confirm your new password')
})

// ============================================
// Community Schemas
// ============================================

export const communityCreationSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Community name must be at least 3 characters')
    .max(21, 'Community name must be less than 21 characters')
    .matches(COMMUNITY_NAME_REGEX, 'Community name can only contain lowercase letters and numbers')
    .required('Community name is required'),
  displayName: Yup.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters')
    .required('Display name is required'),
  description: Yup.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .required('Description is required'),
  category: Yup.string()
    .oneOf(
      ['general', 'technology', 'gaming', 'science', 'entertainment', 'sports', 'music', 'art', 'education', 'business'],
      'Please select a valid category'
    )
    .required('Category is required'),
  isPrivate: Yup.boolean(),
  rules: Yup.array()
    .of(
      Yup.string()
        .max(500, 'Each rule must be less than 500 characters')
    ),
  icon: Yup.mixed()
    .nullable()
    .test('fileSize', 'Icon file is too large (max 5MB)', (value) => {
      if (!value) return true
      return value.size <= 5 * 1024 * 1024
    })
    .test('fileType', 'Icon must be an image file', (value) => {
      if (!value) return true
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(value.type)
    }),
  banner: Yup.mixed()
    .nullable()
    .test('fileSize', 'Banner file is too large (max 5MB)', (value) => {
      if (!value) return true
      return value.size <= 5 * 1024 * 1024
    })
    .test('fileType', 'Banner must be an image file', (value) => {
      if (!value) return true
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(value.type)
    })
})

// ============================================
// Post & Comment Schemas
// ============================================

export const postCreationSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(300, 'Title must be less than 300 characters')
    .required('Title is required'),
  content: Yup.string()
    .max(40000, 'Content must be less than 40,000 characters')
    .when('type', {
      is: 'text',
      then: (schema) => schema.min(1, 'Content is required').required('Content is required'),
      otherwise: (schema) => schema.nullable()
    }),
  url: Yup.string()
    .when('type', {
      is: 'link',
      then: (schema) => schema
        .matches(URL_REGEX, 'Please enter a valid URL')
        .required('URL is required'),
      otherwise: (schema) => schema.nullable()
    }),
  type: Yup.string()
    .oneOf(['text', 'link', 'image', 'video'], 'Invalid post type')
    .required('Post type is required'),
  communityId: Yup.string()
    .required('Please select a community'),
  tags: Yup.array()
    .of(Yup.string().max(30, 'Tag must be less than 30 characters'))
    .max(5, 'You can add up to 5 tags'),
  nsfw: Yup.boolean(),
  spoiler: Yup.boolean()
})

export const commentSchema = Yup.object().shape({
  content: Yup.string()
    .min(1, 'Comment cannot be empty')
    .max(10000, 'Comment must be less than 10,000 characters')
    .required('Comment content is required')
})

// ============================================
// Profile & Settings Schemas
// ============================================

export const profileUpdateSchema = Yup.object().shape({
  displayName: Yup.string()
    .max(100, 'Display name must be less than 100 characters')
    .nullable(),
  bio: Yup.string()
    .max(500, 'Bio must be less than 500 characters')
    .nullable(),
  location: Yup.string()
    .max(100, 'Location must be less than 100 characters')
    .nullable(),
  website: Yup.string()
    .matches(URL_REGEX, 'Please enter a valid URL')
    .nullable(),
  interests: Yup.array()
    .of(Yup.string())
    .max(20, 'You can select up to 20 interests'),
  socialLinks: Yup.object().shape({
    twitter: Yup.string()
      .matches(URL_REGEX, 'Please enter a valid URL')
      .nullable(),
    github: Yup.string()
      .matches(URL_REGEX, 'Please enter a valid URL')
      .nullable(),
    linkedin: Yup.string()
      .matches(URL_REGEX, 'Please enter a valid URL')
      .nullable(),
    cryb: Yup.string()
      .matches(URL_REGEX, 'Please enter a valid URL')
      .nullable()
  })
})

export const privacySettingsSchema = Yup.object().shape({
  profileVisibility: Yup.string()
    .oneOf(['public', 'friends', 'private'], 'Invalid visibility setting')
    .required(),
  friendRequestsFrom: Yup.string()
    .oneOf(['everyone', 'friends_of_friends', 'nobody'], 'Invalid friend request setting')
    .required(),
  messagePrivacy: Yup.string()
    .oneOf(['everyone', 'friends', 'nobody'], 'Invalid message privacy setting')
    .required(),
  onlineStatus: Yup.boolean(),
  showEmail: Yup.boolean(),
  showLocation: Yup.boolean()
})

export const appearanceSettingsSchema = Yup.object().shape({
  reduceMotion: Yup.boolean(),
  highContrast: Yup.boolean(),
  compactMode: Yup.boolean()
})

export const notificationPreferencesSchema = Yup.object().shape({
  friend_requests: Yup.boolean(),
  friend_accepted: Yup.boolean(),
  new_follower: Yup.boolean(),
  messages: Yup.boolean(),
  mentions: Yup.boolean()
})

// ============================================
// Contact & Support Schemas
// ============================================

export const contactFormSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  subject: Yup.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters')
    .required('Subject is required'),
  message: Yup.string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message must be less than 2,000 characters')
    .required('Message is required'),
  category: Yup.string()
    .oneOf(['general', 'support', 'bug', 'feature', 'feedback', 'other'], 'Please select a valid category')
    .required('Category is required')
})

export const reportSchema = Yup.object().shape({
  reason: Yup.string()
    .oneOf(
      ['spam', 'harassment', 'hateSpeech', 'violence', 'misinformation', 'copyright', 'other'],
      'Please select a valid reason'
    )
    .required('Reason is required'),
  description: Yup.string()
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(1000, 'Description must be less than 1,000 characters')
    .required('Description is required')
})

// ============================================
// Search & Filter Schemas
// ============================================

export const searchSchema = Yup.object().shape({
  query: Yup.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(200, 'Search query must be less than 200 characters')
    .required('Search query is required'),
  type: Yup.string()
    .oneOf(['all', 'posts', 'communities', 'users', 'comments'], 'Invalid search type')
})

// ============================================
// API Key Schemas
// ============================================

export const apiKeyCreationSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'API key name must be at least 3 characters')
    .max(50, 'API key name must be less than 50 characters')
    .required('API key name is required'),
  description: Yup.string()
    .max(200, 'Description must be less than 200 characters')
    .nullable(),
  scopes: Yup.array()
    .of(Yup.string())
    .min(1, 'Please select at least one scope')
    .required('Scopes are required'),
  expiresAt: Yup.date()
    .min(new Date(), 'Expiration date must be in the future')
    .nullable()
})

// ============================================
// Messaging Schemas
// ============================================

export const messageSchema = Yup.object().shape({
  content: Yup.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2,000 characters')
    .required('Message content is required'),
  recipientId: Yup.string()
    .required('Recipient is required')
})

export const conversationSchema = Yup.object().shape({
  participantIds: Yup.array()
    .of(Yup.string())
    .min(1, 'Please select at least one participant')
    .max(50, 'You can add up to 50 participants')
    .required('Participants are required'),
  title: Yup.string()
    .max(100, 'Title must be less than 100 characters')
    .when('participantIds', {
      is: (val) => val && val.length > 2,
      then: (schema) => schema.required('Group conversation title is required'),
      otherwise: (schema) => schema.nullable()
    })
})

// ============================================
// Helper Functions
// ============================================

/**
 * Validate a single field against a schema
 * @param {Object} schema - Yup schema object
 * @param {string} field - Field name to validate
 * @param {any} value - Value to validate
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
export const validateField = async (schema, field, value) => {
  try {
    await schema.validateAt(field, { [field]: value })
    return { valid: true, error: null }
  } catch (err) {
    return { valid: false, error: err.message }
  }
}

/**
 * Validate entire form data against a schema
 * @param {Object} schema - Yup schema object
 * @param {Object} data - Form data to validate
 * @returns {Promise<{valid: boolean, errors: Object}>}
 */
export const validateForm = async (schema, data) => {
  try {
    await schema.validate(data, { abortEarly: false })
    return { valid: true, errors: {} }
  } catch (err) {
    const errors = {}
    err.inner.forEach((error) => {
      if (error.path) {
        errors[error.path] = error.message
      }
    })
    return { valid: false, errors }
  }
}

/**
 * Get validation schema by name
 * @param {string} schemaName - Name of the schema
 * @returns {Object|null} - Yup schema object or null
 */
export const getSchema = (schemaName) => {
  const schemas = {
    login: loginSchema,
    register: registerSchema,
    passwordReset: passwordResetSchema,
    changePassword: changePasswordSchema,
    communityCreation: communityCreationSchema,
    postCreation: postCreationSchema,
    comment: commentSchema,
    profileUpdate: profileUpdateSchema,
    privacySettings: privacySettingsSchema,
    appearanceSettings: appearanceSettingsSchema,
    notificationPreferences: notificationPreferencesSchema,
    contactForm: contactFormSchema,
    report: reportSchema,
    search: searchSchema,
    apiKeyCreation: apiKeyCreationSchema,
    message: messageSchema,
    conversation: conversationSchema
  }

  return schemas[schemaName] || null
}

export default {
  // Auth
  loginSchema,
  registerSchema,
  passwordResetSchema,
  changePasswordSchema,

  // Community
  communityCreationSchema,

  // Posts & Comments
  postCreationSchema,
  commentSchema,

  // Profile & Settings
  profileUpdateSchema,
  privacySettingsSchema,
  appearanceSettingsSchema,
  notificationPreferencesSchema,

  // Contact & Support
  contactFormSchema,
  reportSchema,

  // Search
  searchSchema,

  // API
  apiKeyCreationSchema,

  // Messaging
  messageSchema,
  conversationSchema,

  // Helpers
  validateField,
  validateForm,
  getSchema
}
