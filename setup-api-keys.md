# CRYB Platform - API Keys Setup Guide

## Required API Keys for Production

### 1. OpenAI API Key (For AI Moderation & Features)
- **Get it from**: https://platform.openai.com/api-keys
- **Cost**: Pay-as-you-go (~$0.002 per 1K tokens)
- **Used for**: Content moderation, spam detection, AI assistance
- **Environment variables**:
  - `OPENAI_API_KEY=sk-...`
  - `OPENAI_ORG_ID=org-...`

### 2. SendGrid API Key (Email Service)
- **Get it from**: https://app.sendgrid.com/settings/api_keys
- **Cost**: Free tier - 100 emails/day, Essentials - $19.95/month for 50K emails
- **Used for**: Email verification, password resets, notifications
- **Environment variable**:
  - `SENDGRID_API_KEY=SG...`

### 3. Infura API Key (Ethereum Provider)
- **Get it from**: https://infura.io/dashboard
- **Cost**: Free tier - 100K requests/day
- **Used for**: Web3 wallet connections, NFT verification
- **Environment variables**:
  - `INFURA_PROJECT_ID=...`
  - `INFURA_PROJECT_SECRET=...`

### 4. Alchemy API Key (Alternative/Backup Ethereum Provider)
- **Get it from**: https://dashboard.alchemy.com/
- **Cost**: Free tier - 300M compute units/month
- **Used for**: Backup Web3 provider, better NFT APIs
- **Environment variable**:
  - `ALCHEMY_API_KEY=...`

### 5. WalletConnect Project ID
- **Get it from**: https://cloud.walletconnect.com/
- **Cost**: Free
- **Used for**: Mobile wallet connections
- **Environment variable**:
  - `WALLETCONNECT_PROJECT_ID=...`

### 6. Transak API Key (Crypto Payments)
- **Get it from**: https://dashboard.transak.com/
- **Cost**: 1% transaction fee
- **Used for**: Fiat to crypto on-ramp
- **Environment variables**:
  - `TRANSAK_API_KEY=...`
  - `TRANSAK_WEBHOOK_SECRET=...`

### 7. Google Analytics (Optional)
- **Get it from**: https://analytics.google.com/
- **Cost**: Free
- **Used for**: User analytics and tracking
- **Environment variable**:
  - `GOOGLE_ANALYTICS_ID=G-...`

### 8. Sentry DSN (Error Tracking)
- **Get it from**: https://sentry.io/
- **Cost**: Free tier - 5K errors/month
- **Used for**: Error tracking and monitoring
- **Environment variable**:
  - `SENTRY_DSN=https://...@sentry.io/...`

## Free/Already Configured Services

 **PostgreSQL** - Using local database
 **Redis** - Using local Redis
 **Elasticsearch** - Using local instance
 **MinIO** - Using local S3-compatible storage
 **LiveKit** - Using local WebRTC server

## Implementation Priority

1. **Critical (Needed immediately)**:
   - None required for basic functionality

2. **Important (Needed for full features)**:
   - OpenAI - For AI moderation
   - SendGrid - For email features
   - Infura/Alchemy - For Web3 features

3. **Optional (Nice to have)**:
   - Google Analytics
   - Sentry
   - Transak

## Security Notes

- Never commit API keys to git
- Use environment variables only
- Rotate keys regularly
- Set up IP restrictions where possible
- Use different keys for dev/staging/production