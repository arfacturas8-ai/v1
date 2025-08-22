# CRYB Platform - Crypto API Credentials Setup Guide

## 🔐 Required API Keys for Web3/Crypto Integration

Follow this guide to obtain all necessary API keys for CRYB's blockchain features.

---

## 1️⃣ Infura (Ethereum Provider) - FREE Tier

**What it's for:** Ethereum blockchain access, smart contract interactions, wallet balances

### Steps to Get API Key:
1. Go to https://infura.io/
2. Click "Sign Up" (free account)
3. Verify your email
4. Create a new project:
   - Click "Create New Key"
   - Select "Web3 API"
   - Name it "CRYB Platform"
5. Copy your credentials:
   - **Project ID** → `INFURA_PROJECT_ID`
   - **Project Secret** → `INFURA_PROJECT_SECRET`

**Free Tier Limits:**
- 100,000 requests per day
- 10 requests per second
- All major networks supported

---

## 2️⃣ Alchemy (Alternative to Infura) - FREE Tier

**What it's for:** Backup Ethereum provider with better analytics

### Steps to Get API Key:
1. Go to https://www.alchemy.com/
2. Click "Start for free"
3. Create account and verify email
4. Create an app:
   - Click "+ Create App"
   - Name: "CRYB Platform"
   - Chain: "Ethereum"
   - Network: "Mainnet"
5. Copy your **API Key** → `ALCHEMY_API_KEY`

**Free Tier Limits:**
- 300 million compute units/month
- Enhanced APIs included
- Webhook support

---

## 3️⃣ Block Cypher (Bitcoin) - FREE Tier

**What it's for:** Bitcoin blockchain interactions, BTC transactions

### Steps to Get API Token:
1. Go to https://www.blockcypher.com/
2. Click "Sign Up" (top right)
3. Create free account
4. Go to Dashboard → https://accounts.blockcypher.com/
5. Click "Show token"
6. Copy **Token** → `BLOCKCYPHER_TOKEN`

**Free Tier Limits:**
- 3 requests/second
- 200 requests/hour
- 2,000 requests/day

---

## 4️⃣ Moralis (NFT Data) - FREE Tier

**What it's for:** NFT metadata, ownership verification, collection data

### Steps to Get API Key:
1. Go to https://moralis.io/
2. Click "Start for Free"
3. Create account and verify
4. Go to Admin Panel: https://admin.moralis.io/
5. Navigate to "Web3 APIs" tab
6. Copy **API Key** → `MORALIS_API_KEY`

**Free Tier Limits:**
- 3,500 CU/second rate limit
- 100 million CU/month
- All chains supported

---

## 5️⃣ CoinGecko (Market Data) - FREE Tier

**What it's for:** Crypto prices, market data, charts

### Steps to Get API Key (Optional for higher limits):
1. Go to https://www.coingecko.com/en/api
2. Click "Get Your API Key"
3. Choose "Demo" (free)
4. Create account
5. Copy **API Key** → `COINGECKO_API_KEY`

**Free Tier Limits:**
- 10-30 calls/minute (without key)
- 50 calls/minute (with free key)
- All endpoints available

---

## 6️⃣ Transak (Fiat-to-Crypto) - FREE Setup

**What it's for:** Buy crypto with credit card, bank transfer

### Steps to Get API Key:
1. Go to https://transak.com/
2. Click "Get Started" → "I'm a Business"
3. Fill out application form:
   - Company: CRYB Platform
   - Website: your-domain.com
   - Expected volume: <$50k/month
4. Wait for approval (1-2 days)
5. Access dashboard: https://dashboard.transak.com/
6. Go to "API Keys" section
7. Copy credentials:
   - **API Key** → `TRANSAK_API_KEY`
   - **Webhook Secret** → `TRANSAK_WEBHOOK_SECRET`

**Fees:**
- No setup/monthly fees
- 1.5% transaction fee (paid by users)

---

## 7️⃣ WalletConnect (Multi-Wallet Support) - FREE

**What it's for:** Connect 300+ crypto wallets to your platform

### Steps to Get Project ID:
1. Go to https://cloud.walletconnect.com/
2. Click "Sign In" → Create account
3. Click "New Project"
4. Enter details:
   - Name: "CRYB Platform"
   - Homepage: your-domain.com
5. Copy **Project ID** → `WALLETCONNECT_PROJECT_ID`

**Free Tier:**
- Unlimited connections
- All wallets supported
- Real-time updates

---

## 📋 Quick Setup Checklist

```bash
# Copy these to your .env file:

# Ethereum (choose one or both)
□ INFURA_PROJECT_ID=
□ INFURA_PROJECT_SECRET=
□ ALCHEMY_API_KEY=

# Bitcoin
□ BLOCKCYPHER_TOKEN=

# NFTs
□ MORALIS_API_KEY=

# Market Data (optional)
□ COINGECKO_API_KEY=

# Payments
□ TRANSAK_API_KEY=
□ TRANSAK_WEBHOOK_SECRET=

# Wallet Connection
□ WALLETCONNECT_PROJECT_ID=
```

---

## 🚀 Testing Your Setup

Once you have all keys, test them:

```bash
# From project root
cd packages/web3
pnpm install
pnpm test:credentials
```

This will verify all your API keys are working.

---

## 🆘 Troubleshooting

### "API Key Invalid" Errors
- Double-check you copied the entire key
- Ensure no extra spaces or quotes
- Verify the key is activated in the provider's dashboard

### Rate Limiting Issues
- Start with conservative request rates
- Implement caching for price data
- Use batch requests where possible

### Network Connection Issues
- Check if APIs are accessible from your region
- Try using a VPN if blocked
- Ensure firewall allows HTTPS requests

---

## 📞 Support Contacts

- **Infura:** support@infura.io
- **Alchemy:** Via dashboard chat
- **Moralis:** support@moralis.io
- **Transak:** support@transak.com
- **WalletConnect:** Via Discord

---

## ⏰ Estimated Setup Time

- Getting all API keys: 30-45 minutes
- Transak approval: 1-2 business days
- Total active time: ~1 hour

---

## 💡 Pro Tips

1. **Use both Infura AND Alchemy** for redundancy
2. **Start with testnet** keys during development
3. **Set up monitoring** for API usage to avoid limits
4. **Cache price data** to reduce CoinGecko calls
5. **Test with small amounts** when using Transak

---

Once you have all credentials, you're ready to enable full Web3 functionality in CRYB! 🚀