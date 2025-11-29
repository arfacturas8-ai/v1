# ==============================================
# BUSINESS METRICS EXPORTER - KPI MONITORING
# ==============================================
# Provides Prometheus metrics for business KPIs
# Tracks user engagement, revenue, and platform health
# ==============================================

FROM node:18-alpine

LABEL maintainer="Cryb Platform Engineering"
LABEL description="Business Metrics Prometheus Exporter for Cryb Platform"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    postgresql-client \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S business && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G business business && \
    chown -R business:business /app

# Switch to non-root user
USER business

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-9465}/health || exit 1

# Expose metrics port
EXPOSE 9465

# Start with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]