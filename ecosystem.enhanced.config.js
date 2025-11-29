/**
 * CRYB Platform - Enhanced PM2 Ecosystem Configuration
 *
 * This configuration includes additional resilience and monitoring features:
 * - Memory limits and auto-restart on memory threshold
 * - Max restart limits to prevent restart loops
 * - Minimum uptime requirements
 * - Error log limits
 * - Auto-restart on file changes (disabled in production)
 *
 * To use this configuration:
 *   pm2 start ecosystem.enhanced.config.js
 *
 * Or replace the default:
 *   cp ecosystem.enhanced.config.js ecosystem.config.js
 */

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
        DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform?schema=public'
      },
      // Resilience settings
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      watch: false,
      // Logging
      error_file: '/home/ubuntu/.pm2/logs/cryb-workers-error.log',
      out_file: '/home/ubuntu/.pm2/logs/cryb-workers-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart delay
      restart_delay: 4000,
      // Kill timeout
      kill_timeout: 5000,
      // Listen timeout
      listen_timeout: 10000
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
        DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform?schema=public',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6380',
        REDIS_PASSWORD: '',
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9500',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin123',
        MINIO_USE_SSL: 'false',
        MINIO_BUCKET_NAME: 'cryb-uploads'
      },
      // Resilience settings
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      watch: false,
      // Logging
      error_file: '/home/ubuntu/.pm2/logs/cryb-api-error.log',
      out_file: '/home/ubuntu/.pm2/logs/cryb-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart delay
      restart_delay: 4000,
      // Kill timeout
      kill_timeout: 5000,
      // Listen timeout
      listen_timeout: 10000,
      // Health check (requires pm2-health module)
      // pm2_health: {
      //   url: 'http://localhost:3002/health',
      //   interval: 60000,
      //   timeout: 5000
      // }
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
      },
      // Resilience settings
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      watch: false,
      // Logging
      error_file: '/home/ubuntu/.pm2/logs/cryb-frontend-error.log',
      out_file: '/home/ubuntu/.pm2/logs/cryb-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart delay
      restart_delay: 4000,
      // Kill timeout
      kill_timeout: 3000,
      // Listen timeout
      listen_timeout: 10000,
      // Pre-start validation (uncomment to enable)
      // This will run verify-services.sh before starting
      // Note: May slow down restarts, use with caution
      // pre_start: '/home/ubuntu/cryb-platform/verify-services.sh --fix || exit 1'
    }
  ],

  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/cryb-platform.git',
      path: '/home/ubuntu/cryb-platform',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.enhanced.config.js --env production',
      'pre-setup': ''
    }
  }
};
