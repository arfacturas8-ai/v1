# Discord-Style Voice/Video Deployment Guide

## Overview
This guide covers the deployment and configuration of the Discord-style voice/video system built with LiveKit for the CRYB Platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CRYB Platform Voice/Video                │
├─────────────────────────────────────────────────────────────────┤
│  Web App              │  Mobile App           │  API Server     │
│  ├─ Discord Voice UI  │  ├─ Enhanced Voice UI │  ├─ Voice Routes│
│  ├─ LiveKit Client    │  ├─ Mobile Service    │  ├─ JWT Auth    │
│  ├─ WebRTC Optimizer  │  ├─ Battery Optimizer │  └─ Webhooks    │
│  └─ Audio Optimizer   │  └─ Data Saver        │                 │
├─────────────────────────────────────────────────────────────────┤
│                        LiveKit Server                           │
│  ├─ SFU (Selective Forwarding Unit)                            │
│  ├─ Redis for scaling                                           │
│  ├─ TURN servers for NAT traversal                             │
│  └─ WebRTC media processing                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker and Docker Compose
- Domain with SSL certificates
- Redis server
- TURN server (optional but recommended for production)

## Production Deployment

### 1. Environment Configuration

Create `.env.production`:

```bash
# LiveKit Server Configuration
LIVEKIT_URL=wss://voice.cryb.app
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_SECRET_KEY=your_secret_key_here

# Redis Configuration
REDIS_URL=redis://localhost:6380
REDIS_PASSWORD=your_redis_password

# TURN Server Configuration (optional)
TURN_SERVER_URL=turn:turn.cryb.app:3478
TURN_SERVER_USERNAME=your_turn_username
TURN_SERVER_CREDENTIAL=your_turn_credential

# Domain and SSL
DOMAIN=voice.cryb.app
SSL_CERT_PATH=/etc/letsencrypt/live/voice.cryb.app/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/voice.cryb.app/privkey.pem

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cryb_platform
```

### 2. LiveKit Server Production Configuration

Update `config/livekit/livekit.yaml`:

```yaml
port: 7880
bind_addresses:
  - "0.0.0.0"

# Production RTC configuration
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 50200
  use_external_ip: true
  node_ip: ""  # Auto-detect public IP
  ice_servers:
    - urls: ["stun:stun.l.google.com:19302"]
    - urls: ["turn:turn.cryb.app:3478"]
      username: "${TURN_SERVER_USERNAME}"
      credential: "${TURN_SERVER_CREDENTIAL}"

# Redis for horizontal scaling
redis:
  address: "${REDIS_URL}"
  password: "${REDIS_PASSWORD}"
  db: 1
  cluster_addresses:
    - redis-node-1:6379
    - redis-node-2:6379
    - redis-node-3:6379

# TURN server configuration
turn:
  enabled: true
  domain: "${DOMAIN}"
  cert_file: "${SSL_CERT_PATH}"
  key_file: "${SSL_KEY_PATH}"
  tls_port: 5349
  udp_port: 3478
  relay_range_start: 61000
  relay_range_end: 61200
  external_tls: true

# Production API keys (use secure random keys)
keys:
  "${LIVEKIT_API_KEY}": "${LIVEKIT_SECRET_KEY}"

# Room configuration for Discord-style usage
room:
  max_participants: 100
  empty_timeout: 300  # 5 minutes
  auto_create: true
  enable_recording: false
  
  # Audio optimizations for Discord-quality
  audio:
    echo_cancellation: true
    noise_suppression: true
    auto_gain_control: true
    sample_rate: 48000
    channels: 2
    opus:
      max_bitrate: 64000
      dtx: true  # Discontinuous transmission
      fec: true  # Forward error correction
  
  # Video optimizations
  video:
    max_resolution: "1080p"
    adaptive_bitrate: true
    simulcast: true
    max_framerate: 30
    codecs: ["h264", "vp8", "vp9"]
    h264:
      profile_level_id: "42e01f"  # Baseline profile
      packetization_mode: 1

# Webhooks for server events
webhook:
  api_key: "${LIVEKIT_API_KEY}"
  urls:
    - https://api.cryb.app/api/v1/voice/webhook

# Production logging
logging:
  level: info
  pion_level: warn
  sample_rate: 1

# Metrics and monitoring
prometheus:
  port: 6789
  bind_addresses: ["127.0.0.1"]

# Development mode disabled in production
development: false

# Node configuration for multi-instance deployment
cluster:
  node_id: "${NODE_ID:-livekit-1}"
  port: 7900
  bind_addresses:
    - "0.0.0.0"
```

### 3. Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  livekit:
    image: livekit/livekit-server:latest
    container_name: livekit-server
    restart: unless-stopped
    ports:
      - "7880:7880"        # WebSocket
      - "7881:7881"        # TCP fallback
      - "50000-50200:50000-50200/udp"  # RTP/RTCP
      - "3478:3478/udp"    # TURN UDP
      - "5349:5349"        # TURN TLS
      - "6789:6789"        # Metrics
    volumes:
      - ./config/livekit/livekit.yaml:/livekit.yaml:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    environment:
      - LIVEKIT_CONFIG=/livekit.yaml
      - REDIS_URL=${REDIS_URL}
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - TURN_SERVER_USERNAME=${TURN_SERVER_USERNAME}
      - TURN_SERVER_CREDENTIAL=${TURN_SERVER_CREDENTIAL}
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_SECRET_KEY=${LIVEKIT_SECRET_KEY}
      - DOMAIN=${DOMAIN}
      - SSL_CERT_PATH=${SSL_CERT_PATH}
      - SSL_KEY_PATH=${SSL_KEY_PATH}
      - NODE_ID=livekit-1
    networks:
      - cryb-network
    depends_on:
      - redis
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'
        reservations:
          memory: 2G
          cpus: '1'

  redis:
    image: redis:7-alpine
    container_name: livekit-redis
    restart: unless-stopped
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
      - ./config/redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    networks:
      - cryb-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

  # Optional: TURN server (use if you don't have external TURN)
  coturn:
    image: coturn/coturn:latest
    container_name: turn-server
    restart: unless-stopped
    ports:
      - "3478:3478/udp"    # STUN/TURN UDP
      - "3478:3478/tcp"    # STUN/TURN TCP
      - "5349:5349"        # TURN TLS
      - "49152-65535:49152-65535/udp"  # Media relay
    volumes:
      - ./config/coturn/turnserver.conf:/etc/coturn/turnserver.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    environment:
      - TURN_USERNAME=${TURN_SERVER_USERNAME}
      - TURN_PASSWORD=${TURN_SERVER_CREDENTIAL}
      - DOMAIN=${DOMAIN}
    networks:
      - cryb-network
    command: turnserver -c /etc/coturn/turnserver.conf

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: voice-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - cryb-network

  grafana:
    image: grafana/grafana:latest
    container_name: voice-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    networks:
      - cryb-network

volumes:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  cryb-network:
    external: true
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/voice.cryb.app`:

```nginx
upstream livekit {
    server 127.0.0.1:7880;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name voice.cryb.app;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/voice.cryb.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voice.cryb.app/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # WebSocket proxy for LiveKit
    location / {
        proxy_pass http://livekit;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_connect_timeout 10s;
        
        # Disable buffering for real-time communication
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://livekit/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name voice.cryb.app;
    return 301 https://$server_name$request_uri;
}
```

### 5. TURN Server Configuration

Create `config/coturn/turnserver.conf`:

```conf
# TURN server configuration for NAT traversal
listening-port=3478
tls-listening-port=5349

# External IP (auto-detect or set manually)
external-ip=AUTO_DETECT_IP

# Relay ports for media
min-port=49152
max-port=65535

# Authentication
use-auth-secret
static-auth-secret=YOUR_TURN_SECRET_HERE

# Database for persistent authentication (optional)
redis-userdb="ip=127.0.0.1 dbname=2 password=${REDIS_PASSWORD}"

# SSL certificates
cert=/etc/letsencrypt/live/voice.cryb.app/fullchain.pem
pkey=/etc/letsencrypt/live/voice.cryb.app/privkey.pem

# Logging
log-file=/var/log/turnserver.log
verbose

# Security
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=::1
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=172.16.0.0-172.31.255.255

# Performance
total-quota=100
bps-capacity=0
stale-nonce=600
```

### 6. Monitoring Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "voice_video_alerts.yml"

scrape_configs:
  - job_name: 'livekit'
    static_configs:
      - targets: ['livekit:6789']
    scrape_interval: 5s
    metrics_path: /metrics

  - job_name: 'cryb-api'
    static_configs:
      - targets: ['api:3002']
    scrape_interval: 10s
    metrics_path: /metrics

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 10s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 7. Environment-Specific Configurations

#### Development
```bash
# .env.development
LIVEKIT_URL=ws://localhost:7880
NODE_ENV=development
LOG_LEVEL=debug
```

#### Staging
```bash
# .env.staging
LIVEKIT_URL=wss://voice-staging.cryb.app
NODE_ENV=staging
LOG_LEVEL=info
```

#### Production
```bash
# .env.production
LIVEKIT_URL=wss://voice.cryb.app
NODE_ENV=production
LOG_LEVEL=warn
```

## Deployment Commands

### Initial Deployment

```bash
# 1. Clone and setup
git clone https://github.com/cryb-app/cryb-platform.git
cd cryb-platform

# 2. Set up environment
cp .env.example .env.production
# Edit .env.production with your values

# 3. Generate SSL certificates
sudo certbot certonly --nginx -d voice.cryb.app

# 4. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 5. Setup nginx
sudo cp nginx/voice.cryb.app /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/voice.cryb.app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Updates and Maintenance

```bash
# Update LiveKit server
docker-compose -f docker-compose.prod.yml pull livekit
docker-compose -f docker-compose.prod.yml up -d livekit

# View logs
docker-compose -f docker-compose.prod.yml logs -f livekit

# Monitor metrics
curl http://localhost:6789/metrics
```

## Scaling Configuration

### Multi-Node Setup

For high availability and scaling:

```yaml
# Add multiple LiveKit nodes
services:
  livekit-1:
    <<: *livekit-common
    environment:
      - NODE_ID=livekit-1
    ports:
      - "7880:7880"

  livekit-2:
    <<: *livekit-common
    environment:
      - NODE_ID=livekit-2
    ports:
      - "7881:7880"

  # Load balancer
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/livekit-lb.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - livekit-1
      - livekit-2
```

### Redis Cluster

```yaml
redis-cluster:
  image: redis:7-alpine
  command: redis-cli --cluster create
    redis-1:6379 redis-2:6379 redis-3:6379
    --cluster-replicas 1 --cluster-yes
  depends_on:
    - redis-1
    - redis-2
    - redis-3
```

## Performance Tuning

### System-Level Optimizations

```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize network settings
echo "net.core.rmem_max = 134217728" >> /etc/sysctl.conf
echo "net.core.wmem_max = 134217728" >> /etc/sysctl.conf
echo "net.ipv4.udp_mem = 102400 873800 16777216" >> /etc/sysctl.conf

# Apply settings
sysctl -p
```

### LiveKit Optimizations

```yaml
# In livekit.yaml
rtc:
  # Use more UDP ports for better distribution
  port_range_start: 40000
  port_range_end: 50000
  
  # Enable TCP fallback
  tcp_fallback_port: 7881
  
  # Buffer optimization
  udp_buffer_size: 2097152  # 2MB
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Connection Metrics**
   - Active connections
   - Connection success rate
   - Average connection time

2. **Media Quality Metrics**
   - Packet loss rates
   - Audio/video bitrates
   - Frame rates

3. **Resource Metrics**
   - CPU usage
   - Memory usage
   - Network bandwidth

4. **Error Rates**
   - WebRTC connection failures
   - Authentication errors
   - Media processing errors

### Alert Configurations

```yaml
# voice_video_alerts.yml
groups:
  - name: voice_video_alerts
    rules:
      - alert: HighConnectionFailureRate
        expr: rate(livekit_connection_failures_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High connection failure rate detected"

      - alert: HighPacketLoss
        expr: avg(livekit_packet_loss_ratio) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High packet loss detected"
```

## Security Considerations

### Network Security
- Use firewall rules to restrict access
- Enable DDoS protection
- Monitor for unusual traffic patterns

### Authentication Security
- Regularly rotate API keys
- Use strong JWT secrets
- Implement rate limiting

### Media Security
- Enable DTLS for media encryption
- Use secure signaling (WSS)
- Validate all media parameters

## Troubleshooting

### Common Issues

1. **Connection Failures**
   ```bash
   # Check LiveKit logs
   docker logs livekit-server
   
   # Test WebSocket connection
   websocat wss://voice.cryb.app
   ```

2. **Audio/Video Issues**
   ```bash
   # Check codec support
   curl https://voice.cryb.app/health
   
   # Monitor media quality
   curl http://localhost:6789/metrics | grep packet_loss
   ```

3. **Performance Issues**
   ```bash
   # Monitor resource usage
   docker stats livekit-server
   
   # Check Redis performance
   redis-cli --latency-history -h localhost -p 6380
   ```

## Backup and Recovery

### Backup Strategy
- Database snapshots
- Configuration backups
- SSL certificate backups

### Recovery Procedures
- Automated failover setup
- Data restoration procedures
- Service recovery steps

This completes the comprehensive Discord-style voice/video deployment guide for the CRYB Platform.