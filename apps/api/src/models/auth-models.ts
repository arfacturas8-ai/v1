import { z } from 'zod';

// ============================================
// AUTHENTICATION DATABASE MODELS
// ============================================

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash?: string;
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  last_login?: Date;
  last_password_change?: Date;
  password_history: string[]; // Store hashed passwords to prevent reuse
  require_password_change: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  refresh_token: string;
  refresh_token_version: number;
  device_fingerprint?: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  is_active: boolean;
  expires_at: Date;
  last_activity: Date;
  created_at: Date;
}

export interface TwoFactorAuth {
  id: string;
  user_id: string;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthProvider {
  id: string;
  user_id: string;
  provider: 'google' | 'discord' | 'github' | 'twitter' | 'apple';
  provider_id: string;
  provider_email?: string;
  provider_username?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: Date;
  scope?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WebAuthnCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_type: string;
  device_name?: string;
  is_active: boolean;
  last_used?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  description?: string;
  permissions: string[];
  rate_limit: number; // requests per minute
  last_used?: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  granted_by: string;
  granted_at: Date;
  expires_at?: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  created_at: Date;
}

export interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'email_change' | 
              'mfa_enabled' | 'mfa_disabled' | 'account_locked' | 'suspicious_activity' |
              'api_key_created' | 'api_key_revoked' | 'oauth_connected' | 'oauth_disconnected';
  ip_address: string;
  user_agent: string;
  location?: string;
  metadata?: Record<string, any>;
  risk_score: number; // 0-100
  created_at: Date;
}

export interface AccountLockout {
  id: string;
  user_id: string;
  reason: 'failed_attempts' | 'suspicious_activity' | 'admin_action' | 'security_policy';
  locked_by?: string; // admin user id if manually locked
  locked_until: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  released_at?: Date;
}

export interface PasswordPolicy {
  id: string;
  name: string;
  min_length: number;
  max_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  forbidden_patterns: string[];
  max_age_days?: number;
  history_count: number; // prevent reuse of last N passwords
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const RegisterSchema = z.object({
  email: z.string().email().min(1).max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: "Terms must be accepted"
  })
});

export const LoginSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(1).max(128),
  remember_me: z.boolean().optional(),
  mfa_code: z.string().length(6).optional()
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email().min(1).max(255)
});

export const PasswordResetSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8).max(128)
});

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1).max(128),
  new_password: z.string().min(8).max(128)
});

export const TwoFactorSetupSchema = z.object({
  secret: z.string().min(1),
  verification_code: z.string().length(6)
});

export const TwoFactorVerifySchema = z.object({
  code: z.string().length(6)
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).min(1),
  rate_limit: z.number().min(1).max(10000).default(1000),
  expires_in_days: z.number().min(1).max(365).optional()
});

export const WebAuthnRegistrationSchema = z.object({
  device_name: z.string().min(1).max(100),
  credential_data: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      attestationObject: z.string(),
      clientDataJSON: z.string()
    }),
    type: z.literal('public-key')
  })
});

export const WebAuthnAuthenticationSchema = z.object({
  credential_data: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      authenticatorData: z.string(),
      clientDataJSON: z.string(),
      signature: z.string(),
      userHandle: z.string().optional()
    }),
    type: z.literal('public-key')
  })
});

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  provider: z.enum(['google', 'discord', 'github', 'twitter', 'apple'])
});

export const RoleAssignSchema = z.object({
  user_id: z.string().uuid(),
  role_id: z.string().uuid(),
  expires_in_days: z.number().min(1).max(365).optional()
});

export const PermissionSchema = z.object({
  resource: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional()
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type TwoFactorSetupInput = z.infer<typeof TwoFactorSetupSchema>;
export type TwoFactorVerifyInput = z.infer<typeof TwoFactorVerifySchema>;
export type ApiKeyCreateInput = z.infer<typeof ApiKeyCreateSchema>;
export type WebAuthnRegistrationInput = z.infer<typeof WebAuthnRegistrationSchema>;
export type WebAuthnAuthenticationInput = z.infer<typeof WebAuthnAuthenticationSchema>;
export type OAuthCallbackInput = z.infer<typeof OAuthCallbackSchema>;
export type RoleAssignInput = z.infer<typeof RoleAssignSchema>;
export type PermissionInput = z.infer<typeof PermissionSchema>;

// ============================================
// CONSTANTS
// ============================================

export const AUTH_CONSTANTS = {
  // Token expiry times
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  EMAIL_VERIFICATION_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in ms
  PASSWORD_RESET_EXPIRY: 1 * 60 * 60 * 1000, // 1 hour in ms
  
  // Security settings
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes in ms
  PROGRESSIVE_LOCKOUT_MULTIPLIER: 2,
  PASSWORD_HISTORY_COUNT: 5,
  
  // Rate limiting
  LOGIN_RATE_LIMIT: 5, // attempts per 15 minutes
  PASSWORD_RESET_RATE_LIMIT: 3, // attempts per hour
  EMAIL_VERIFICATION_RATE_LIMIT: 3, // attempts per hour
  
  // WebAuthn
  WEBAUTHN_TIMEOUT: 60000, // 60 seconds
  WEBAUTHN_CHALLENGE_SIZE: 32,
  
  // API Keys
  API_KEY_PREFIX_LENGTH: 8,
  API_KEY_SECRET_LENGTH: 32,
  
  // OAuth
  OAUTH_STATE_EXPIRY: 10 * 60 * 1000, // 10 minutes in ms
  
  // Default permissions
  DEFAULT_USER_PERMISSIONS: [
    'user:read:own',
    'user:update:own',
    'posts:create',
    'posts:read',
    'comments:create',
    'comments:read'
  ],
  
  // System roles
  SYSTEM_ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    USER: 'user',
    GUEST: 'guest'
  }
} as const;