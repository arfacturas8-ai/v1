# ==============================================
# SOCKET.IO EXPORTER - REALTIME MONITORING
# ==============================================
# Provides Prometheus metrics for Socket.io connections
# Monitors real-time communications and WebSocket health
# ==============================================

FROM node:18-alpine

LABEL maintainer="Cryb Platform Engineering"
LABEL description="Socket.io Prometheus Exporter for Cryb Platform"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Install dependencies
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
RUN addgroup -g 1001 -S socketio && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G socketio socketio && \
    chown -R socketio:socketio /app

# Switch to non-root user
USER socketio

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-9466}/health || exit 1

# Expose metrics port
EXPOSE 9466

# Start with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]