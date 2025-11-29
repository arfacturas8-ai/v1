# ==============================================
# CRYB ERROR TRACKING SERVICE DOCKERFILE
# ==============================================
# Production-ready container for error tracking and monitoring
# ==============================================

FROM node:18-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cryb -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY --chown=cryb:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown cryb:nodejs logs

# Switch to non-root user
USER cryb

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-9467}/health || exit 1

# Expose port
EXPOSE 9467

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the service
CMD ["node", "src/index.js"]