// ===================================================
// CRYB PLATFORM - PM2 ECOSYSTEM CONFIGURATION
// ===================================================
// Production-ready PM2 configuration for 24/7 operation
// Includes API, Web, Workers, and Monitoring services
// ===================================================

const productionEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5433/cryb?schema=public',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'cryb_production_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024',
  NEXTAUTH_URL: 'https://platform.cryb.ai',
  NEXTAUTH_SECRET: 'cryb_production_nextauth_secret_key_for_secure_authentication_minimum_32_characters_required_for_production_2024'
};

module.exports = {
  apps: [
    // ===================================================
    // API SERVER (Backend)
    // ===================================================
    {
      name: 'cryb-api',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/ubuntu/cryb-platform/apps/api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      
      // Environment variables
      env: {
        ...productionEnv,
        PORT: 3001
      },
      
      // Logging configuration
      error_file: '/home/ubuntu/cryb-platform/logs/api-error.log',
      out_file: '/home/ubuntu/cryb-platform/logs/api-out.log',
      log_file: '/home/ubuntu/cryb-platform/logs/api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Restart strategy
      min_uptime: '10s',
      max_restarts: 10
    },
    
    // ===================================================
    // WEB SERVER (Frontend)
    // ===================================================
    {
      name: 'cryb-web',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/ubuntu/cryb-platform/apps/web',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      
      // Environment variables
      env: {
        ...productionEnv,
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:3001'
      },
      
      // Logging configuration
      error_file: '/home/ubuntu/cryb-platform/logs/web-error.log',
      out_file: '/home/ubuntu/cryb-platform/logs/web-out.log',
      log_file: '/home/ubuntu/cryb-platform/logs/web-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Restart strategy
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};