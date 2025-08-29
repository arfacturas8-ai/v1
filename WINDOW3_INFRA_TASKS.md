# ⚙️ WINDOW 3: INFRASTRUCTURE & WEB3 - IMMEDIATE EXECUTION

## START NOW:
```bash
python3 start_timer.py --project "CRYB-Platform" --task "Infrastructure-Web3"
```

## CRITICAL TASKS - DO IN ORDER:

### ✅ TASK 1: FIX DOCKER SERVICES (30 MIN)
```bash
cd /home/ubuntu/cryb-platform
# Check what's broken
docker ps -a | grep -E "Exited|Restarting"
```

**Fix Elasticsearch memory:**
```yaml
# Edit docker-compose.complete.yml
elasticsearch:
  environment:
    - "ES_JAVA_OPTS=-Xms256m -Xmx256m"  # Reduce from 512m
  deploy:
    resources:
      limits:
        memory: 512M
```

**Fix RabbitMQ:**
```bash
docker-compose -f docker-compose.complete.yml down rabbitmq elasticsearch
docker-compose -f docker-compose.complete.yml up -d rabbitmq elasticsearch
docker logs -f cryb-rabbitmq  # Check it starts
```

### ✅ TASK 2: DEPLOY SMART CONTRACTS (1 HOUR)
```bash
cd /home/ubuntu/cryb-platform/packages/web3
mkdir -p contracts/src
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

**Create these contracts:**
```solidity
// contracts/src/CRYBToken.sol - Platform token
// contracts/src/CRYBGovernance.sol - DAO voting
// contracts/src/CRYBAccess.sol - NFT gating
// contracts/src/CRYBRewards.sol - Reward system
```

**Deploy to testnet:**
```bash
npx hardhat run scripts/deploy.js --network goerli
git add -A && git commit -m "feat(web3): Deploy smart contracts"
```

### ✅ TASK 3: SETUP LIVEKIT FOR VOICE (1 HOUR)
```bash
# Install LiveKit server
curl -sSL https://get.livekit.io | bash
mkdir -p config/livekit

# Create config
cat > config/livekit/livekit.yaml << EOF
port: 7880
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
keys:
  APIKey: devkey
  Secret: secret
EOF

# Start LiveKit
livekit-server --config=config/livekit/livekit.yaml &
```

### ✅ TASK 4: PRODUCTION DEPLOYMENT SETUP (2 HOURS)
```bash
mkdir -p .github/workflows kubernetes terraform
```

**Create CI/CD Pipeline:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker images
      - name: Deploy to Kubernetes
```

**Create Kubernetes configs:**
```yaml
# kubernetes/deployment.yaml
# kubernetes/service.yaml
# kubernetes/ingress.yaml
# kubernetes/configmap.yaml
# kubernetes/secrets.yaml
```

### ✅ TASK 5: CDN & MEDIA SETUP (1 HOUR)
```bash
# Setup MinIO for file storage
docker exec -it cryb-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin123
docker exec -it cryb-minio mc mb myminio/cryb-uploads
docker exec -it cryb-minio mc mb myminio/cryb-avatars
docker exec -it cryb-minio mc mb myminio/cryb-media

# Configure public access
docker exec -it cryb-minio mc anonymous set public myminio/cryb-media
```

**Setup Cloudinary:**
```typescript
// packages/media/src/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'drpber9kp',
  api_key: '238718328567742',
  api_secret: 'Iz-fqIrHPRsKCM0woYack8TtiQU'
});

export const uploadImage = async (file: Buffer) => {
  // Implementation
};
```

### ✅ TASK 6: MONITORING SETUP (1 HOUR)
```bash
# Prometheus is running, configure Grafana
docker exec -it cryb-grafana grafana-cli admin reset-admin-password admin123

# Setup Sentry
npm install @sentry/node @sentry/react-native
```

```typescript
// apps/api/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://7a4fea61fefe5586a8752bcd3a3eb500@o4509895505936384.ingest.us.sentry.io/4509895513931776',
  environment: 'production'
});
```

### ✅ TASK 7: LOAD TESTING (30 MIN)
```bash
npm install -g artillery
cat > loadtest.yml << EOF
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 60
      arrivalRate: 100
scenarios:
  - name: "User flow"
    flow:
      - post:
          url: "/api/auth/login"
      - get:
          url: "/api/users/me"
EOF

artillery run loadtest.yml
```

### ✅ TASK 8: SSL & DOMAIN SETUP (30 MIN)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate (when domain is ready)
# sudo certbot --nginx -d api.cryb.ai -d app.cryb.ai

# For now, create self-signed
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout config/nginx/ssl/cryb.key \
  -out config/nginx/ssl/cryb.crt
```

## CRITICAL WEB3 TASKS:

### ✅ WALLET INTEGRATION (1 HOUR)
```typescript
// packages/web3/src/wallets/WalletManager.ts
// Complete MetaMask connection
// Complete WalletConnect
// Add Coinbase Wallet
// Add Rainbow Wallet
```

### ✅ NFT VERIFICATION (1 HOUR)
```typescript
// packages/web3/src/nft/NFTGating.ts
import { MoralisClient } from './MoralisClient';

export const verifyNFTOwnership = async (wallet: string, contract: string) => {
  // Use Moralis API to verify
  // Gate community access
};
```

## COMMIT AFTER EACH TASK:
```bash
git add -A && git commit -m "feat(infra): [what you completed]"
git push origin main
```

## BY END OF DAY YOU MUST HAVE:
1. ✅ All Docker services running
2. ✅ Smart contracts deployed to testnet
3. ✅ LiveKit server running
4. ✅ CI/CD pipeline created
5. ✅ Production configs ready

## IF BLOCKED:
- Docker won't start? Restart Docker daemon: sudo systemctl restart docker
- Contract won't deploy? Use Remix IDE online
- LiveKit issues? Use Janus as backup
- Kubernetes complex? Use docker-compose for production too

## PRODUCTION CHECKLIST:
```
[ ] All services containerized
[ ] Environment variables secured
[ ] Database backed up
[ ] Redis configured
[ ] SSL certificates ready
[ ] Domain DNS configured
[ ] CDN active
[ ] Monitoring active
[ ] Error tracking active
[ ] Load tested for 1000 users
```

**NO PERFECT INFRASTRUCTURE - WORKING INFRASTRUCTURE!**