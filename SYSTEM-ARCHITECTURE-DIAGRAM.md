# CRYB Platform - System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │ Mobile App   │  │  Web Lite    │  │  PWA         │      │
│  │  (React 18)  │  │ (React Native│  │  (Minimal)   │  │ (Offline)    │      │
│  │  35 Pages    │  │  iOS/Android)│  │              │  │              │      │
│  │  53 Components│ │              │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │                 │              │
│         └─────────────────┴─────────────────┴─────────────────┘              │
│                                   │                                           │
└───────────────────────────────────┼───────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WSS
                                    │
┌───────────────────────────────────▼───────────────────────────────────────────┐
│                            LOAD BALANCER (NGINX)                              │
│                        SSL Termination, Rate Limiting                         │
│                          https://api.cryb.ai                                  │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
┌───────────────────▼──────┐ ┌──────▼────────┐ ┌───▼──────────────┐
│   API Gateway (Fastify)  │ │  Socket.IO    │ │   CDN/Static     │
│   PM2: cryb-api          │ │   Real-time   │ │   Assets         │
│   PID: 918968            │ │   WebSocket   │ │                  │
│   Memory: 74.2 MB        │ │               │ │   CloudFront/    │
│   Uptime: 14h            │ │   Events:     │ │   Cloudflare     │
│                          │ │   - Messages  │ │                  │
│   Routes:                │ │   - Presence  │ │   Cached:        │
│   - /api/v1/auth         │ │   - Voice     │ │   - Images       │
│   - /api/v1/posts        │ │   - Typing    │ │   - Videos       │
│   - /api/v1/messages     │ │   - Notifs    │ │   - Thumbnails   │
│   - /api/v1/web3         │ │               │ │   - Avatars      │
│   - /api/v1/nft          │ │   Rooms:      │ │                  │
│   - ... (66 routes)      │ │   - User      │ │                  │
│                          │ │   - Channel   │ │                  │
│   Middleware:            │ │   - Server    │ │                  │
│   - JWT Auth             │ │               │ │                  │
│   - Rate Limit           │ │   Redis       │ │                  │
│   - Helmet Security      │ │   Adapter     │ │                  │
│   - CORS                 │ │               │ │                  │
│   - Compression          │ │               │ │                  │
└──────────┬───────────────┘ └───────┬───────┘ └──────────────────┘
           │                         │
           │                         │
┌──────────▼─────────────────────────▼─────────────────────────────────────────┐
│                            SERVICE LAYER                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    147 Backend Services                              │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  Authentication (10)    Media Processing (12)   Analytics (8)       │    │
│  │  ├─ auth.ts             ├─ minio.ts             ├─ analytics.ts     │    │
│  │  ├─ jwt.ts              ├─ cdn.ts               ├─ metrics.ts       │    │
│  │  ├─ oauth.ts            ├─ image-processor.ts   └─ search-analytics.ts│  │
│  │  ├─ web3-auth.ts        ├─ video-transcoding.ts                      │    │
│  │  └─ 2fa.ts              └─ ...                  Moderation (12)      │    │
│  │                                                 ├─ ai-moderation.ts  │    │
│  │  Search & AI (12)       Real-time (4)          ├─ spam-detection.ts │    │
│  │  ├─ elasticsearch.ts    ├─ socket.ts           ├─ nsfw-detection.ts │    │
│  │  ├─ ai-integration.ts   ├─ livekit.ts          └─ toxicity.ts       │    │
│  │  ├─ nlp-pipeline.ts     └─ voice-quality.ts                         │    │
│  │  └─ recommendations.ts                          Web3 (6)             │    │
│  │                         Queue (5)               ├─ web3.ts           │    │
│  │  Database (8)           ├─ queue-manager.ts    ├─ nft.ts            │    │
│  │  ├─ database-pool.ts    ├─ workers.ts          ├─ token-gating.ts   │    │
│  │  ├─ redis-cache.ts      └─ batch-jobs.ts       └─ crypto-payments.ts│    │
│  │  └─ optimization.ts                                                  │    │
│  │                         Monitoring (10)         Notifications (6)    │    │
│  │  Security (10)          ├─ prometheus.ts       ├─ push-notifs.ts    │    │
│  │  ├─ security.ts         ├─ sentry.ts           ├─ email.ts          │    │
│  │  ├─ fraud-detection.ts  └─ jaeger.ts           └─ notification-queue.ts│  │
│  │  └─ encryption.ts                                                    │    │
│  │                                                                       │    │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────┬─────────────┬─────────────┬─────────────┬────────────────────────┘
            │             │             │             │
            │             │             │             │
┌───────────▼──┐  ┌───────▼──┐  ┌──────▼───┐  ┌──────▼──────┐
│   Database   │  │   Cache  │  │  Queue   │  │   Storage   │
│   Layer      │  │  Layer   │  │  Layer   │  │   Layer     │
└──────────────┘  └──────────┘  └──────────┘  └─────────────┘
       │               │             │               │
       │               │             │               │
┌──────▼────────┐ ┌───▼──────┐ ┌───▼────────┐ ┌────▼────────┐
│ PostgreSQL    │ │  Redis   │ │  BullMQ    │ │   MinIO     │
│               │ │          │ │            │ │  (S3-compat)│
│ 72 Models:    │ │  Uses:   │ │  Queues:   │ │             │
│ - User        │ │  - Cache │ │  - media   │ │  Buckets:   │
│ - Server      │ │  - Locks │ │  - email   │ │  - uploads  │
│ - Channel     │ │  - Sess  │ │  - index   │ │  - avatars  │
│ - Message     │ │  - Pub/  │ │  - notifs  │ │  - videos   │
│ - Post        │ │    Sub   │ │  - jobs    │ │  - images   │
│ - Community   │ │  - Queue │ │            │ │  - audio    │
│ - NFT         │ │          │ │  Workers:  │ │             │
│ - Token       │ │  Port:   │ │  - 5 conc  │ │  CDN:       │
│ - Vote        │ │  6380    │ │  - retry   │ │  - Cached   │
│ - Comment     │ │          │ │  - DLQ     │ │  - Optimize │
│ - Award       │ │          │ │            │ │  - Transcode│
│ - Stake       │ │          │ │  PM2:      │ │             │
│ - Governance  │ │          │ │  cryb-     │ │             │
│ - ... (60+)   │ │          │ │  workers   │ │             │
│               │ │          │ │  PID:      │ │             │
│ Indexes: 150+ │ │          │ │  1666729   │ │             │
│ Pooling: 20   │ │          │ │  135.9 MB  │ │             │
└───────────────┘ └──────────┘ └────────────┘ └─────────────┘
       │               │             │               │
       │               │             │               │
┌──────▼───────────────▼─────────────▼───────────────▼─────────────────┐
│                    BACKGROUND WORKERS                                 │
│                    PM2: cryb-workers (PID 1666729)                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │    Media     │  │    Email     │  │   Search     │              │
│  │  Processing  │  │   Sending    │  │  Indexing    │              │
│  │              │  │              │  │              │              │
│  │ - Transcode  │  │ - Sendgrid   │  │ - Elastic    │              │
│  │ - Optimize   │  │ - Templates  │  │ - Reindex    │              │
│  │ - Thumbnail  │  │ - Queue      │  │ - Sync       │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Notifications│  │  Analytics   │  │  Moderation  │              │
│  │              │  │              │  │              │              │
│  │ - Push       │  │ - Aggregate  │  │ - AI Scan    │              │
│  │ - Web Push   │  │ - Metrics    │  │ - Auto-ban   │              │
│  │ - Email      │  │ - Reports    │  │ - Queue      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────┐
│                      MICROSERVICES (11 Services)                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  socketio-       │  │  business-       │  │  security-       │  │
│  │  exporter        │  │  metrics-        │  │  exporter        │  │
│  │                  │  │  exporter        │  │                  │  │
│  │  Prometheus      │  │                  │  │  Prometheus      │  │
│  │  Metrics:        │  │  Metrics:        │  │  Metrics:        │  │
│  │  - Connections   │  │  - DAU/MAU       │  │  - Failed auth   │  │
│  │  - Rooms         │  │  - Revenue       │  │  - Suspicious    │  │
│  │  - Events/sec    │  │  - Engagement    │  │  - IP blocks     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  websocket-      │  │  database-       │  │  error-          │  │
│  │  monitoring      │  │  performance     │  │  tracking        │  │
│  │                  │  │                  │  │                  │  │
│  │  Health checks   │  │  Metrics:        │  │  Centralized     │  │
│  │  Connection      │  │  - Query time    │  │  errors          │  │
│  │  quality         │  │  - Pool usage    │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  search-         │  │  bullmq-         │  │  security-       │  │
│  │  analytics       │  │  exporter        │  │  automation      │  │
│  │                  │  │                  │  │                  │  │
│  │  Elasticsearch   │  │  Queue metrics   │  │  Auto-response   │  │
│  │  query metrics   │  │  - Throughput    │  │  to threats      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
│  ┌──────────────────┐                                                │
│  │  agents          │                                                │
│  │                  │                                                │
│  │  AI automation   │                                                │
│  └──────────────────┘                                                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES & INTEGRATIONS                   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │  OpenAI    │  │  LiveKit   │  │  Transak   │  │  MoonPay   │    │
│  │            │  │            │  │            │  │            │    │
│  │  AI        │  │  Voice/    │  │  Crypto    │  │  Crypto    │    │
│  │  Moderation│  │  Video SFU │  │  On-ramp   │  │  On-ramp   │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │  Sentry    │  │ Prometheus │  │  Grafana   │  │  Jaeger    │    │
│  │            │  │            │  │            │  │            │    │
│  │  Error     │  │  Metrics   │  │  Dash-     │  │  Tracing   │    │
│  │  Tracking  │  │  Collection│  │  boards    │  │            │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│                                                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                     │
│  │  Sendgrid  │  │  Ethereum  │  │  Polygon   │                     │
│  │            │  │            │  │            │                     │
│  │  Email     │  │  Mainnet   │  │  Mainnet   │                     │
│  │  Delivery  │  │  Web3 RPC  │  │  Web3 RPC  │                     │
│  └────────────┘  └────────────┘  └────────────┘                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────┐
│                    MONITORING & OBSERVABILITY                         │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Prometheus                                                   │   │
│  │  ├─ API metrics (requests/sec, latency, errors)             │   │
│  │  ├─ Database metrics (queries/sec, pool usage)              │   │
│  │  ├─ Cache metrics (hit rate, memory)                        │   │
│  │  ├─ Queue metrics (job throughput, failures)                │   │
│  │  ├─ Socket.IO metrics (connections, rooms, events)          │   │
│  │  └─ Business metrics (DAU, MAU, revenue)                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Grafana Dashboards                                          │   │
│  │  ├─ API Performance                                          │   │
│  │  ├─ Database Health                                          │   │
│  │  ├─ Infrastructure                                           │   │
│  │  ├─ Business Metrics                                         │   │
│  │  └─ Security Dashboard                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Sentry Error Tracking                                       │   │
│  │  ├─ Frontend errors (React error boundaries)                │   │
│  │  ├─ Backend errors (try/catch, async handlers)              │   │
│  │  ├─ Performance monitoring                                   │   │
│  │  └─ Release tracking                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Jaeger Distributed Tracing                                  │   │
│  │  ├─ Request flow across services                            │   │
│  │  ├─ Database query tracing                                   │   │
│  │  ├─ External API calls                                       │   │
│  │  └─ Performance bottlenecks                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW EXAMPLES                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. User sends a message:                                            │
│     Client → Socket.IO → Redis Pub/Sub → All connected clients      │
│                    ↓                                                  │
│              Database (Message)                                       │
│                    ↓                                                  │
│              BullMQ (process_message)                                │
│                    ↓                                                  │
│              - Notification                                           │
│              - Search indexing                                        │
│              - Analytics                                              │
│                                                                       │
│  2. User uploads an image:                                           │
│     Client → API (multipart) → MinIO (original)                     │
│                          ↓                                            │
│                    BullMQ (media)                                    │
│                          ↓                                            │
│                    - Image optimization (Sharp)                      │
│                    - Thumbnail generation                             │
│                    - NSFW detection                                   │
│                    - CDN upload                                       │
│                          ↓                                            │
│                    Database (UploadedFile)                           │
│                          ↓                                            │
│                    CDN URL → Client                                   │
│                                                                       │
│  3. User votes on a post:                                            │
│     Client → API (/posts/:id/vote)                                  │
│                    ↓                                                  │
│              Database transaction:                                    │
│              - Create/Update Vote                                     │
│              - Update Post.score                                      │
│              - Update User karma                                      │
│                    ↓                                                  │
│              Socket.IO (post:vote event)                             │
│                    ↓                                                  │
│              All clients update score                                 │
│                                                                       │
│  4. User connects wallet (Web3):                                     │
│     Client → MetaMask signature                                      │
│                    ↓                                                  │
│              API (/web3/verify-signature)                            │
│                    ↓                                                  │
│              - Verify SIWE signature                                  │
│              - Check token/NFT ownership                              │
│              - Update User.walletAddress                              │
│              - Create Session token                                   │
│                    ↓                                                  │
│              Client authenticated                                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Key Architecture Principles

### 1. **Separation of Concerns**
- Frontend handles UI/UX
- API handles business logic
- Workers handle async jobs
- Microservices handle specialized metrics

### 2. **Scalability**
- Horizontal scaling: Multiple API instances behind load balancer
- Vertical scaling: Database read replicas
- Queue-based: Async processing offloads heavy work
- Caching: Multi-tier (app → Redis → CDN)

### 3. **Resilience**
- Error handling: Try/catch everywhere
- Graceful degradation: Continue without Elasticsearch/MinIO if down
- Retry logic: BullMQ with exponential backoff
- Dead letter queues: Failed jobs don't block pipeline
- Health checks: `/health` endpoint monitors all services

### 4. **Security**
- Authentication: JWT with refresh tokens
- Authorization: RBAC, token gating
- Input validation: Zod schemas
- Rate limiting: Per-IP and per-user
- Content scanning: AI moderation, NSFW detection, malware scanning
- Encryption: bcrypt (passwords), field-level encryption (sensitive data)

### 5. **Observability**
- Logging: Pino (structured JSON logs)
- Metrics: Prometheus (exporters for every service)
- Tracing: Jaeger (distributed tracing)
- Alerts: Grafana alerts on critical metrics
- Error tracking: Sentry with source maps

### 6. **Performance**
- Framework: Fastify (fastest Node.js framework)
- Caching: Redis + in-memory LRU cache
- Database: Connection pooling, strategic indexes
- CDN: CloudFront/Cloudflare for static assets
- Compression: Gzip/Brotli response compression
- Lazy loading: Pagination, infinite scroll

---

## Technology Choices & Rationale

| Category | Technology | Why? |
|----------|-----------|------|
| **API Framework** | Fastify | 3x faster than Express, built-in validation, TypeScript support |
| **ORM** | Prisma | Type-safe queries, auto-migrations, excellent DX |
| **Database** | PostgreSQL | ACID compliance, complex queries, JSON support, mature |
| **Cache** | Redis | In-memory speed, pub/sub for real-time, battle-tested |
| **Queue** | BullMQ | Redis-based, retry logic, priority queues, UI dashboard |
| **Real-time** | Socket.IO | WebSocket + fallback, rooms, Redis adapter for scaling |
| **Storage** | MinIO | S3-compatible, self-hosted, cost-effective |
| **Search** | Elasticsearch | Full-text search, fuzzy matching, aggregations, fast |
| **Voice/Video** | LiveKit | Open-source SFU, WebRTC, scalable, feature-rich |
| **Frontend** | React 18 | Concurrent rendering, suspense, hooks, huge ecosystem |
| **Build** | Vite | Instant HMR, fast builds, ESM-native |
| **Web3** | ethers.js | Lightweight, well-documented, widely used |
| **AI** | OpenAI | State-of-the-art, easy API, moderation endpoint |
| **Monitoring** | Prometheus | Industry standard, pull-based, powerful queries |

---

**This architecture supports 100K+ concurrent users with proper infrastructure scaling.**
