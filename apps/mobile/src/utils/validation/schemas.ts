/**
 * VALIDATION SCHEMAS
 * Centralized validation rules for all forms using Zod
 *
 * Installation required:
 * npm install zod react-hook-form @hookform/resolvers
 */

import { z } from 'zod';

// ============================================================================
// CUSTOM VALIDATORS
// ============================================================================

export const validators = {
  // Email validation with additional checks
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(
      (email) => {
        // Additional email format validation
        const parts = email.split('@');
        if (parts.length !== 2) return false;
        const [localPart, domain] = parts;
        return localPart.length > 0 && domain.includes('.');
      },
      { message: 'Please enter a valid email address' }
    ),

  // Username validation
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    )
    .regex(
      /^[a-zA-Z]/,
      'Username must start with a letter'
    ),

  // Password validation with strength requirements
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /[a-z]/,
      'Password must contain at least one lowercase letter'
    )
    .regex(
      /[A-Z]/,
      'Password must contain at least one uppercase letter'
    )
    .regex(
      /[0-9]/,
      'Password must contain at least one number'
    ),

  // Strong password (optional special characters)
  strongPassword: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),

  // URL validation
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Please enter a valid URL')
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url);
          return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
          return false;
        }
      },
      { message: 'URL must start with http:// or https://' }
    ),

  // Phone number validation (US format)
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^\+?1?\d{10,14}$/,
      'Please enter a valid phone number'
    ),

  // Date validation (must be in the past)
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const today = new Date();
        return birthDate < today;
      },
      { message: 'Date of birth must be in the past' }
    )
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 13;
      },
      { message: 'You must be at least 13 years old' }
    ),

  // Text length validators
  shortText: z.string().max(100, 'Text must be less than 100 characters'),
  mediumText: z.string().max(500, 'Text must be less than 500 characters'),
  longText: z.string().max(10000, 'Text must be less than 10,000 characters'),

  // Title validator
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(300, 'Title must be less than 300 characters'),

  // Community name validator
  communityName: z
    .string()
    .min(1, 'Community name is required')
    .min(3, 'Community name must be at least 3 characters')
    .max(21, 'Community name must be less than 21 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Community name can only contain letters, numbers, and underscores'
    ),

  // Bio validator
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),

  // Display name validator
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
};

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const loginSchema = z.object({
  email: validators.email,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    username: validators.username,
    email: validators.email,
    password: validators.password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: validators.email,
});

export const resetPasswordSchema = z
  .object({
    code: z.string().min(1, 'Reset code is required').length(6, 'Code must be 6 digits'),
    password: validators.password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: validators.password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

export const profileEditSchema = z.object({
  username: validators.username,
  displayName: validators.displayName,
  email: validators.email,
  bio: validators.bio,
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  dateOfBirth: validators.dateOfBirth.optional(),
});

export const profileSetupSchema = z.object({
  displayName: validators.displayName,
  bio: validators.bio,
  interests: z.array(z.string()).min(1, 'Select at least one interest').max(10, 'Select up to 10 interests'),
});

// ============================================================================
// COMMUNITY SCHEMAS
// ============================================================================

export const communityCreationSchema = z.object({
  name: validators.communityName,
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  category: z.string().min(1, 'Category is required'),
  isPrivate: z.boolean(),
  rules: z
    .array(
      z.object({
        title: z.string().min(1, 'Rule title is required').max(100, 'Title too long'),
        description: z.string().min(1, 'Rule description is required').max(500, 'Description too long'),
      })
    )
    .optional(),
});

// ============================================================================
// POST SCHEMAS
// ============================================================================

export const postCreationSchema = z.object({
  title: validators.title,
  content: z.string().max(10000, 'Content must be less than 10,000 characters').optional(),
  communityId: z.string().min(1, 'Please select a community'),
  type: z.enum(['text', 'image', 'video', 'link', 'poll']),
  url: z.string().url('Please enter a valid URL').optional(),
  flair: z.string().max(50, 'Flair must be less than 50 characters').optional(),
  isNSFW: z.boolean().optional(),
  spoiler: z.boolean().optional(),
  isOriginalContent: z.boolean().optional(),
});

export const textPostSchema = postCreationSchema.extend({
  type: z.literal('text'),
  content: z.string().min(1, 'Please enter some content').max(10000, 'Content must be less than 10,000 characters'),
});

export const linkPostSchema = postCreationSchema.extend({
  type: z.literal('link'),
  url: validators.url,
});

export const pollPostSchema = postCreationSchema.extend({
  type: z.literal('poll'),
  pollOptions: z
    .array(z.string().min(1, 'Poll option cannot be empty').max(180, 'Option too long'))
    .min(2, 'Please provide at least 2 poll options')
    .max(6, 'Maximum 6 poll options allowed'),
  pollDuration: z.number().min(1, 'Duration must be at least 1 day').max(14, 'Duration cannot exceed 14 days'),
});

export const imagePostSchema = postCreationSchema.extend({
  type: z.literal('image'),
  mediaUri: z.string().min(1, 'Please select an image'),
});

export const videoPostSchema = postCreationSchema.extend({
  type: z.literal('video'),
  mediaUri: z.string().min(1, 'Please select a video'),
});

// ============================================================================
// COMMENT SCHEMAS
// ============================================================================

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(10000, 'Comment must be less than 10,000 characters'),
  parentId: z.string().optional(),
});

// ============================================================================
// MESSAGE SCHEMAS
// ============================================================================

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2,000 characters'),
  recipientId: z.string().min(1, 'Recipient is required'),
});

export const directMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2,000 characters'),
});

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters'),
  type: z.enum(['all', 'posts', 'communities', 'users']).optional(),
  sortBy: z.enum(['relevance', 'recent', 'top']).optional(),
});

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  messageNotifications: z.boolean(),
  commentNotifications: z.boolean(),
  mentionNotifications: z.boolean(),
  upvoteNotifications: z.boolean(),
});

export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']),
  showOnlineStatus: z.boolean(),
  allowDirectMessages: z.enum(['everyone', 'friends', 'none']),
  showActivity: z.boolean(),
});

export const accountSettingsSchema = z.object({
  email: validators.email,
  language: z.string(),
  timezone: z.string(),
  twoFactorEnabled: z.boolean().optional(),
});

// ============================================================================
// PAYMENT SCHEMAS (if needed)
// ============================================================================

export const paymentCardSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{16}$/, 'Please enter a valid card number'),
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Please enter a valid expiry date (MM/YY)'),
  cvv: z
    .string()
    .min(1, 'CVV is required')
    .regex(/^\d{3,4}$/, 'Please enter a valid CVV'),
  billingZip: z
    .string()
    .min(1, 'Billing ZIP code is required')
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
});

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

export const reportSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1,000 characters')
    .optional(),
});

// ============================================================================
// TYPES (exported for TypeScript)
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProfileEditFormData = z.infer<typeof profileEditSchema>;
export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;
export type CommunityCreationFormData = z.infer<typeof communityCreationSchema>;
export type PostCreationFormData = z.infer<typeof postCreationSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;
export type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>;
export type AccountSettingsFormData = z.infer<typeof accountSettingsSchema>;
export type PaymentCardFormData = z.infer<typeof paymentCardSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
