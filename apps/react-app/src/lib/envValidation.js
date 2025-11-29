/**
 * Environment Variable Validation
 * Validates required environment variables on app startup
 * Prevents runtime errors due to missing configuration
 */

const REQUIRED_ENV_VARS = [
  'VITE_API_URL',
  'VITE_WS_URL'
]

const OPTIONAL_ENV_VARS = [
  'VITE_SENTRY_DSN',
  'VITE_GA_MEASUREMENT_ID',
  'VITE_ENVIRONMENT',
  'VITE_APP_VERSION',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_INFURA_PROJECT_ID'
]

const ENV_VAR_DESCRIPTIONS = {
  VITE_API_URL: 'Backend API base URL',
  VITE_WS_URL: 'WebSocket server URL',
  VITE_SENTRY_DSN: 'Sentry error tracking DSN',
  VITE_GA_MEASUREMENT_ID: 'Google Analytics measurement ID',
  VITE_ENVIRONMENT: 'Application environment (development/staging/production)',
  VITE_APP_VERSION: 'Application version number',
  VITE_STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key for payments',
  VITE_INFURA_PROJECT_ID: 'Infura project ID for Web3'
}

/**
 * Validate environment variables
 * @returns {Object} { isValid: boolean, missing: string[], warnings: string[] }
 */
export function validateEnvironment() {
  const missing = []
  const warnings = []

  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = import.meta.env[varName]
    if (!value || value === '' || value === 'undefined') {
      missing.push(varName)
    }
  })

  // Check optional variables and warn if missing
  OPTIONAL_ENV_VARS.forEach(varName => {
    const value = import.meta.env[varName]
    if (!value || value === '' || value === 'undefined') {
      warnings.push(varName)
    }
  })

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  }
}

/**
 * Log environment status to console
 */
export function logEnvironmentStatus() {
  const validation = validateEnvironment()
  const env = import.meta.env.VITE_ENVIRONMENT || 'development'

  console.group(`🔧 Environment Configuration [${env.toUpperCase()}]`)

  // Required variables
  console.group('✅ Required Variables')
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = import.meta.env[varName]
    const status = value && value !== 'undefined' ? '✓' : '✗'
    const displayValue = value && value !== 'undefined'
      ? (varName.includes('KEY') || varName.includes('DSN') ? '***' : value)
      : 'MISSING'
  })
  console.groupEnd()

  // Optional variables
  console.group('⚙️ Optional Variables')
  OPTIONAL_ENV_VARS.forEach(varName => {
    const value = import.meta.env[varName]
    const status = value && value !== 'undefined' ? '✓' : '○'
    const displayValue = value && value !== 'undefined'
      ? (varName.includes('KEY') || varName.includes('DSN') ? '***' : value)
      : 'not set'
  })
  console.groupEnd()

  // Validation summary
  if (validation.isValid) {
  } else {
    console.error('❌ Missing required environment variables:', validation.missing)
  }

  if (validation.warnings.length > 0) {
  }

  console.groupEnd()

  return validation
}

/**
 * Throw error if required environment variables are missing
 * Call this on app initialization
 */
export function enforceEnvironment() {
  const validation = validateEnvironment()

  if (!validation.isValid) {
    const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MISSING REQUIRED ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are required but not set:

${validation.missing.map(v => `  ❌ ${v} - ${ENV_VAR_DESCRIPTIONS[v]}`).join('\n')}

Please create a .env file in the project root with these variables.
See .env.example for reference.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim()

    console.error(errorMessage)
    throw new Error('Missing required environment variables')
  }

  return validation
}

/**
 * Get environment variable with fallback
 */
export function getEnv(key, fallback = null) {
  const value = import.meta.env[key]
  if (!value || value === '' || value === 'undefined') {
    return fallback
  }
  return value
}

/**
 * Check if running in production
 */
export function isProduction() {
  return import.meta.env.VITE_ENVIRONMENT === 'production' || import.meta.env.PROD
}

/**
 * Check if running in development
 */
export function isDevelopment() {
  return import.meta.env.VITE_ENVIRONMENT === 'development' || import.meta.env.DEV
}

export default {
  validateEnvironment,
  logEnvironmentStatus,
  enforceEnvironment,
  getEnv,
  isProduction,
  isDevelopment
}
