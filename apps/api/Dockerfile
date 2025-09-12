# ==============================================
# CRYB DISCORD-LIKE API - PRODUCTION DOCKERFILE
# ==============================================

# Use specific Node.js version for stability
FROM node:20.11.1-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install pnpm with specific version
RUN npm install -g pnpm@8.15.0 --registry=https://registry.npmjs.org/ \
    && npm cache clean --force

# ==============================================
# DEPENDENCY INSTALLATION STAGE
# ==============================================
FROM base AS deps

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# ==============================================
# BUILD STAGE
# ==============================================
FROM base AS builder

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the application
RUN pnpm run build

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# ==============================================
# PRODUCTION STAGE
# ==============================================
FROM node:20.11.1-alpine AS runner

# Install system dependencies for runtime
RUN apk add --no-cache \
    dumb-init \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    curl

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiserver

# Set working directory
WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/temp
RUN chown -R apiserver:nodejs /app

# Copy built application
COPY --from=builder --chown=apiserver:nodejs /app/dist ./dist
COPY --from=builder --chown=apiserver:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apiserver:nodejs /app/package.json ./package.json
COPY --from=builder --chown=apiserver:nodejs /app/prisma ./prisma

# Copy health check script
COPY --chown=apiserver:nodejs docker/healthcheck.js ./healthcheck.js

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3001

# Switch to non-root user
USER apiserver

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# ==============================================
# BUILD ARGUMENTS AND LABELS
# ==============================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="CRYB Discord-like API"
LABEL org.opencontainers.image.description="High-performance Discord-like API built with Fastify, TypeScript, and PostgreSQL"
LABEL org.opencontainers.image.version=${VERSION}
LABEL org.opencontainers.image.created=${BUILD_DATE}
LABEL org.opencontainers.image.source="https://github.com/cryb-ai/platform"
LABEL org.opencontainers.image.revision=${VCS_REF}
LABEL org.opencontainers.image.vendor="CRYB AI"
LABEL org.opencontainers.image.licenses="MIT"