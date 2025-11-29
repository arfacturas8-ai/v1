module.exports = {
  apps: [
    {
      name: 'cryb-api',
      script: 'npx',
      args: 'tsx src/index.ts',
      cwd: '/home/ubuntu/cryb-platform/apps/api',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        PORT: 3002,
        NODE_ENV: 'production',
        JWT_SECRET: 'cryb_production_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024',
        DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5433/cryb',
        REDIS_URL: 'redis://localhost:6380',
        ALLOWED_ORIGINS: 'https://platform.cryb.ai,https://api.cryb.ai',
        SOCKET_IO_CORS_ORIGIN: 'https://platform.cryb.ai,https://api.cryb.ai',
        ELASTICSEARCH_NODE: 'http://localhost:9200',
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9000',
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin'
      },
      max_memory_restart: '2G',
      error_file: '/home/ubuntu/cryb-platform/logs/api-error.log',
      out_file: '/home/ubuntu/cryb-platform/logs/api-out.log',
      log_file: '/home/ubuntu/cryb-platform/logs/api-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 15,
      min_uptime: '30s',
      restart_delay: 4000,
      kill_timeout: 10000,
      listen_timeout: 10000,
      wait_ready: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Enhanced error handling
      ignore_watch: ['node_modules', 'logs'],
      node_args: '--max-old-space-size=2048',
      
      // Health checks
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: false,
      
      // Advanced options for production stability
      vizion: false,
      pmx: true,
      automation: false,
      instance_var: 'INSTANCE_ID'
    },
    {
      name: 'cryb-web',
      script: 'npm',
      args: 'run start',
      cwd: '/home/ubuntu/cryb-platform/apps/web',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.cryb.ai',
        NEXT_PUBLIC_SOCKET_URL: 'https://api.cryb.ai',
        NEXT_PUBLIC_PLATFORM_URL: 'https://platform.cryb.ai'
      },
      max_memory_restart: '2G',
      error_file: '/home/ubuntu/cryb-platform/logs/web-error.log',
      out_file: '/home/ubuntu/cryb-platform/logs/web-out.log',
      log_file: '/home/ubuntu/cryb-platform/logs/web-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 15,
      min_uptime: '30s',
      restart_delay: 4000,
      kill_timeout: 10000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      ignore_watch: ['node_modules', 'logs'],
      node_args: '--max-old-space-size=2048'
    },
    {
      name: 'cryb-react',
      script: 'node',
      args: 'server.js',
      cwd: '/home/ubuntu/cryb-platform/apps/react-app',
      instances: 1,
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      },
      max_memory_restart: '1G',
      error_file: '/home/ubuntu/cryb-platform/logs/react-error.log',
      out_file: '/home/ubuntu/cryb-platform/logs/react-out.log',
      log_file: '/home/ubuntu/cryb-platform/logs/react-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_restarts: 15,
      min_uptime: '30s',
      restart_delay: 4000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      ignore_watch: ['node_modules', 'logs'],
      node_args: '--max-old-space-size=1024'
    }
  ],

  // PM2 Plus monitoring configuration
  pmx: {
    http: true,
    ignore_routes: ['/health', '/ping'],
    errors: true,
    custom_probes: true,
    network: true,
    ports: true
  },

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:cryb-platform/cryb-platform.git',
      path: '/home/ubuntu/cryb-platform',
      'post-deploy': 'pnpm install && pm2 reload ecosystem.production.config.js --env production'
    }
  }
}