#!/usr/bin/env node

// Fix database connection and start API
process.env.NODE_ENV = 'development';
process.env.DATABASE_URL = 'postgresql://cryb_user:cryb_password@localhost:5432/cryb';
process.env.PORT = '3002';
process.env.HOST = '0.0.0.0';

// Basic MinIO configuration
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_ACCESS_KEY = 'minioadmin';
process.env.MINIO_SECRET_KEY = 'minioadmin123';
process.env.MINIO_USE_SSL = 'false';

console.log('🚀 Starting API with fixed configuration...');
console.log('Database URL:', process.env.DATABASE_URL);
console.log('MinIO Config:', {
  endpoint: process.env.MINIO_ENDPOINT,
  port: process.env.MINIO_PORT,
  ssl: process.env.MINIO_USE_SSL
});

require('./src/index.ts');