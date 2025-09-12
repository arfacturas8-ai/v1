#!/bin/sh
set -e

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting CRYB Queue Workers..."

# Wait for required services
log "Waiting for Redis to be available..."
while ! nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
  log "Redis is unavailable - sleeping"
  sleep 2
done
log "Redis is available"

# If RABBITMQ_URL is set, wait for RabbitMQ
if [ -n "$RABBITMQ_URL" ]; then
    RABBITMQ_HOST=$(echo $RABBITMQ_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    RABBITMQ_PORT=${RABBITMQ_PORT:-5672}
    
    log "Waiting for RabbitMQ to be available..."
    while ! nc -z ${RABBITMQ_HOST} ${RABBITMQ_PORT}; do
        log "RabbitMQ is unavailable - sleeping"
        sleep 2
    done
    log "RabbitMQ is available"
fi

# If DATABASE_URL is set, wait for PostgreSQL
if [ -n "$DATABASE_URL" ]; then
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
    DB_PORT=${DB_PORT:-5432}
    
    log "Waiting for PostgreSQL to be available..."
    while ! nc -z ${DB_HOST} ${DB_PORT}; do
        log "PostgreSQL is unavailable - sleeping"
        sleep 2
    done
    log "PostgreSQL is available"
fi

# Additional startup delay to ensure all services are fully ready
log "Waiting additional 10 seconds for services to be fully ready..."
sleep 10

log "All dependencies are available, starting workers..."

# Start the main application
exec node src/crash-proof-index.js