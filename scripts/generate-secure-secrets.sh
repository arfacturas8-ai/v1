#!/bin/bash

echo "🔒 Generating Secure Secrets for Production"
echo "==========================================="
echo ""
echo "Copy these values to your .env.production file:"
echo ""

# Generate secure JWT secret (256 characters)
JWT_SECRET=$(openssl rand -base64 192 | tr -d '\n' | cut -c1-256)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generate secure database password (32 characters)
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '\n/')
echo "# Update PostgreSQL password with:"
echo "# sudo -u postgres psql -c \"ALTER USER cryb_user PASSWORD '$DB_PASSWORD';\""
echo "DATABASE_URL=postgresql://cryb_user:$DB_PASSWORD@localhost:5432/cryb_platform?schema=public"
echo ""

# Generate MinIO credentials
MINIO_ACCESS=$(openssl rand -hex 16)
MINIO_SECRET=$(openssl rand -base64 32 | tr -d '\n/')
echo "# MinIO Credentials (update in /etc/minio/minio.conf too):"
echo "MINIO_ACCESS_KEY=$MINIO_ACCESS"
echo "MINIO_SECRET_KEY=$MINIO_SECRET"
echo ""

# Generate Redis password (optional but recommended)
REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d '\n/')
echo "# Redis Password (configure in redis.conf):"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo ""

echo "⚠️  IMPORTANT SECURITY STEPS:"
echo "1. Update all passwords in .env.production"
echo "2. Update PostgreSQL password using the command shown above"
echo "3. Update MinIO credentials in /etc/minio/minio.conf"
echo "4. Configure Redis password in /etc/redis/redis.conf"
echo "5. Restart all services after updating"
echo "6. Store these credentials securely (password manager, secrets management system)"
echo ""
echo "🔐 Never commit these secrets to version control!"