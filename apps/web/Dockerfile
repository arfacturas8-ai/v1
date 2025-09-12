# ==============================================
# CRYB WEB APPLICATION - PRODUCTION DOCKERFILE
# ==============================================

# Use specific Node.js version for stability
FROM node:20.11.1-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# ==============================================
# DEPENDENCY INSTALLATION STAGE
# ==============================================
FROM base AS deps

# Copy package files
COPY package*.json pnpm-lock.yaml ./
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../

# Install dependencies
RUN pnpm install --frozen-lockfile

# ==============================================
# BUILD STAGE
# ==============================================
FROM base AS builder

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /node_modules /node_modules

# Copy source code
COPY . .
COPY ../../packages ./../../packages

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN pnpm run build

# ==============================================
# PRODUCTION STAGE
# ==============================================
FROM node:20.11.1-alpine AS runner

# Install system dependencies for runtime
RUN apk add --no-cache \
    dumb-init \
    curl

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Create necessary directories
RUN mkdir -p /app/.next
RUN chown -R nextjs:nodejs /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install pnpm for runtime
RUN npm install -g pnpm@8.15.0

# Copy health check script
COPY --chown=nextjs:nodejs docker/healthcheck.js ./healthcheck.js

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

# ==============================================
# BUILD ARGUMENTS AND LABELS
# ==============================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="CRYB Web Application"
LABEL org.opencontainers.image.description="Next.js web application for CRYB platform"
LABEL org.opencontainers.image.version=${VERSION}
LABEL org.opencontainers.image.created=${BUILD_DATE}
LABEL org.opencontainers.image.source="https://github.com/cryb-ai/platform"
LABEL org.opencontainers.image.revision=${VCS_REF}
LABEL org.opencontainers.image.vendor="CRYB AI"
LABEL org.opencontainers.image.licenses="MIT"