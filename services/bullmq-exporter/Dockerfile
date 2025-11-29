# ==============================================
# BULLMQ EXPORTER - QUEUE MONITORING
# ==============================================
# Provides Prometheus metrics for BullMQ queues
# Monitors job processing, queue health, and performance
# ==============================================

FROM node:18-alpine

LABEL maintainer="Cryb Platform Engineering"
LABEL description="BullMQ Prometheus Exporter for Cryb Platform"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Install dependencies for better performance
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S bullmq && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G bullmq bullmq && \
    chown -R bullmq:bullmq /app

# Switch to non-root user
USER bullmq

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-9464}/health || exit 1

# Expose metrics port
EXPOSE 9464

# Start with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]