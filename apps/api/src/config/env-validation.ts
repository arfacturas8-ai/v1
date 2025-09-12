import { z } from 'zod';
import { randomBytes } from 'crypto';

/**
 * Environment variable validation schema
 * Ensures all required configuration is present and valid
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server configuration
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('localhost'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().default('redis://:cryb_redis_password@localhost:6380/0'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6380),
  REDIS_PASSWORD: z.string().default('cryb_redis_password'),
  
  // JWT secrets (critical for security)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  JWT_ISSUER: z.string().default('cryb-platform'),
  JWT_AUDIENCE: z.string().default('cryb-users'),
  
  // CORS and security
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:19001'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // OAuth providers (optional but needed for OAuth functionality)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_REDIRECT_URI: z.string().url().optional(),
  
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().url().optional(),
  
  // Web3 / SIWE configuration
  SIWE_DOMAIN: z.string().default('localhost:3000'),
  INFURA_API_KEY: z.string().optional(),
  ALCHEMY_API_KEY: z.string().optional(),
  MORALIS_API_KEY: z.string().optional(),
  ETHERSCAN_API_KEY: z.string().optional(),
  
  // LiveKit for voice/video
  LIVEKIT_URL: z.string().default('ws://localhost:7880'),
  LIVEKIT_API_KEY: z.string().default('devkey'),
  LIVEKIT_API_SECRET: z.string().default('secret'),
  LIVEKIT_BACKUP_URLS: z.string().optional(),
  
  // Voice/Video Quality Settings
  VOICE_BITRATE: z.coerce.number().default(64000),
  VIDEO_BITRATE: z.coerce.number().default(1500000),
  AUDIO_ECHO_CANCELLATION: z.string().transform(val => val === 'true').default(true),
  AUDIO_NOISE_SUPPRESSION: z.string().transform(val => val === 'true').default(true),
  AUDIO_AUTO_GAIN_CONTROL: z.string().transform(val => val === 'true').default(true),
  
  // Feature Flags
  ENABLE_VOICE_VIDEO: z.string().transform(val => val === 'true').default(false),
  
  // External services (optional)
  ELASTICSEARCH_URL: z.string().url().optional(),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.coerce.number().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_USE_SSL: z.string().transform(val => val === 'true').optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // API configuration
  API_HOST: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
}).transform((env) => {
  // Auto-generate JWT_REFRESH_SECRET if not provided
  if (!env.JWT_REFRESH_SECRET) {
    env.JWT_REFRESH_SECRET = env.JWT_SECRET + '_refresh';
  }
  
  return env;
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws detailed errors if validation fails
 */
export function validateEnvironment(): Environment {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional security validations for production
    if (env.NODE_ENV === 'production') {
      validateProductionSecurity(env);
    }
    
    // Log configuration status (without sensitive values)
    console.log('✅ Environment validation passed');
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Server: ${env.HOST}:${env.PORT}`);
    console.log(`🔐 JWT configured: ${env.JWT_SECRET ? 'Yes' : 'No'}`);
    console.log(`📊 Database: ${env.DATABASE_URL ? 'Configured' : 'Missing'}`);
    console.log(`⚡ Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
    
    // OAuth provider status
    const oauthProviders = [];
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) oauthProviders.push('Google');
    if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) oauthProviders.push('Discord');
    if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) oauthProviders.push('GitHub');
    console.log(`🔗 OAuth providers: ${oauthProviders.length > 0 ? oauthProviders.join(', ') : 'None configured'}`);
    
    // Web3 status
    const web3Providers = [];
    if (env.INFURA_API_KEY) web3Providers.push('Infura');
    if (env.ALCHEMY_API_KEY) web3Providers.push('Alchemy');
    if (env.MORALIS_API_KEY) web3Providers.push('Moralis');
    console.log(`🌐 Web3 providers: ${web3Providers.length > 0 ? web3Providers.join(', ') : 'None configured'}`);
    
    // LiveKit status
    console.log(`🎙️  Voice/Video: ${env.ENABLE_VOICE_VIDEO ? 'Enabled' : 'Disabled'}`);
    console.log(`📞 LiveKit: ${env.LIVEKIT_URL}`);
    if (env.ENABLE_VOICE_VIDEO) {
      console.log(`🎵 Voice bitrate: ${env.VOICE_BITRATE} bps`);
      console.log(`📹 Video bitrate: ${env.VIDEO_BITRATE} bps`);
      console.log(`🔊 Audio processing: EC=${env.AUDIO_ECHO_CANCELLATION}, NS=${env.AUDIO_NOISE_SUPPRESSION}, AGC=${env.AUDIO_AUTO_GAIN_CONTROL}`);
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error('');
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  • ${path}: ${err.message}`);
      });
      
      console.error('');
      console.error('Please check your .env file and ensure all required variables are set correctly.');
      console.error('');
      
      // Provide helpful suggestions for common issues
      if (error.errors.some(e => e.path.includes('JWT_SECRET'))) {
        console.error('💡 To generate a secure JWT secret:');
        console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
        console.error('');
      }
      
      if (error.errors.some(e => e.path.includes('DATABASE_URL'))) {
        console.error('💡 Database URL format:');
        console.error('   postgresql://username:password@localhost:5432/database_name');
        console.error('');
      }
      
      process.exit(1);
    }
    
    console.error('❌ Unexpected error during environment validation:', error);
    process.exit(1);
  }
}

/**
 * Additional security validations for production environment
 */
function validateProductionSecurity(env: Environment): void {
  const securityIssues: string[] = [];
  
  // Check for default/weak secrets
  if (env.JWT_SECRET === 'development-secret-change-in-production') {
    securityIssues.push('JWT_SECRET is using development default value');
  }
  
  if (env.JWT_SECRET.length < 64) {
    securityIssues.push('JWT_SECRET should be at least 64 characters in production');
  }
  
  // Check for development URLs in production
  if (env.DATABASE_URL.includes('localhost')) {
    securityIssues.push('DATABASE_URL should not use localhost in production');
  }
  
  if (env.REDIS_URL.includes('localhost') || env.REDIS_HOST === 'localhost') {
    securityIssues.push('Redis should not use localhost in production');
  }
  
  // Check HTTPS requirements
  if (!env.FRONTEND_URL.startsWith('https://')) {
    securityIssues.push('FRONTEND_URL should use HTTPS in production');
  }
  
  // OAuth redirect URIs should use HTTPS
  const oauthRedirects = [
    env.GOOGLE_REDIRECT_URI,
    env.DISCORD_REDIRECT_URI,
    env.GITHUB_REDIRECT_URI
  ].filter(Boolean);
  
  oauthRedirects.forEach((uri) => {
    if (uri && !uri.startsWith('https://')) {
      securityIssues.push(`OAuth redirect URI should use HTTPS in production: ${uri}`);
    }
  });
  
  if (securityIssues.length > 0) {
    console.error('🚨 Production security issues detected:');
    console.error('');
    securityIssues.forEach(issue => {
      console.error(`  • ${issue}`);
    });
    console.error('');
    console.error('These issues must be resolved before deploying to production.');
    process.exit(1);
  }
  
  console.log('🔒 Production security validation passed');
}

/**
 * Generate development secrets if missing
 */
export function generateDevelopmentSecrets(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const requiredSecrets = ['JWT_SECRET'];
  const missingSecrets: string[] = [];
  
  requiredSecrets.forEach(secret => {
    if (!process.env[secret]) {
      missingSecrets.push(secret);
    }
  });
  
  if (missingSecrets.length > 0) {
    console.log('🔧 Generating missing development secrets...');
    
    missingSecrets.forEach(secret => {
      const value = randomBytes(64).toString('hex');
      process.env[secret] = value;
      console.log(`  • ${secret}: Generated (64 bytes)`);
    });
    
    console.log('');
    console.log('⚠️  Add these to your .env file for consistent development:');
    console.log('');
    missingSecrets.forEach(secret => {
      console.log(`${secret}=${process.env[secret]}`);
    });
    console.log('');
  }
}

/**
 * Initialize environment validation
 * Call this early in your application startup
 */
export function initializeEnvironment(): Environment {
  // Generate development secrets if needed
  generateDevelopmentSecrets();
  
  // Validate and return parsed environment
  return validateEnvironment();
}