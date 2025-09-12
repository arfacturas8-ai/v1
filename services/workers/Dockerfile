# Production Dockerfile for CRYB Queue Workers
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ 

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production image
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    tini

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cryb-worker -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder --chown=cryb-worker:nodejs /app/dist ./dist
COPY --from=builder --chown=cryb-worker:nodejs /app/src ./src

# Copy additional files
COPY --chown=cryb-worker:nodejs docker/healthcheck.js ./
COPY --chown=cryb-worker:nodejs docker/entrypoint.sh ./

# Make scripts executable
RUN chmod +x entrypoint.sh

# Switch to non-root user
USER cryb-worker

# Expose health check port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node healthcheck.js

# Use tini as init system
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["./entrypoint.sh"]