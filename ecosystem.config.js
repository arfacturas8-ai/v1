module.exports = {
  apps: [
    {
      name: 'cryb-workers',
      script: 'npx',
      args: 'tsx watch src/start-workers.ts',
      cwd: '/home/ubuntu/cryb-platform/apps/api',
      env_file: '/home/ubuntu/cryb-platform/apps/api/.env.production',
      env: {
        NODE_ENV: 'production',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6380',
        REDIS_PASSWORD: '',
        DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5433/cryb?schema=public'
      }
    },
    {
      name: 'cryb-api',
      script: 'npx',
      args: 'tsx watch src/index.ts',
      cwd: '/home/ubuntu/cryb-platform/apps/api',
      env_file: '/home/ubuntu/cryb-platform/apps/api/.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOST: '0.0.0.0',
        ALLOWED_ORIGINS: 'https://platform.cryb.ai,https://api.cryb.ai,https://cryb.ai,https://www.cryb.ai,http://54.236.166.224',
        JWT_SECRET: 'cryb_production_jwt_secret_key_minimum_64_characters_change_this_immediately_2024',
        DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5433/cryb?schema=public',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6380',
        REDIS_PASSWORD: '',
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9500',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin123',
        MINIO_USE_SSL: 'false',
        MINIO_BUCKET_NAME: 'cryb-uploads',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: 'therealcryb@gmail.com',
        SMTP_PASS: 'urnc xnci abxl nyvv',
        SMTP_FROM: 'CRYB Platform <therealcryb@gmail.com>',
        EMAIL_ENABLED: 'true',
        EMAIL_PROVIDER: 'smtp',
        RESEND_API_KEY: 're_5vUBhwDq_3CQi2v64qF7H6ZtYL5Zw8vfn'
      }
    },
    {
      name: 'cryb-frontend',
      script: 'serve-production.js',
      cwd: '/home/ubuntu/cryb-platform/apps/react-app',
      env_file: '/home/ubuntu/cryb-platform/apps/react-app/.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
        HOST: '0.0.0.0'
      }
    }
  ]
};
