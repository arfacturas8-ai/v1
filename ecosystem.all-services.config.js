module.exports = {
  apps: [
    // Main API
    {
      name: 'cryb-api',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/ubuntu/cryb-platform/apps/api',
      env_file: '/home/ubuntu/cryb-platform/apps/api/.env.production',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOST: '0.0.0.0'
      },
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 3000
    },

    // Frontend
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
      instances: 1,
      exec_mode: 'fork'
    },

    // Workers (BullMQ)
    {
      name: 'cryb-workers',
      script: 'npm',
      args: 'run start',
      cwd: '/home/ubuntu/cryb-platform/services/workers',
      env: {
        NODE_ENV: 'production',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6380,
        DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform?schema=public'
      },
      instances: 1,
      exec_mode: 'fork',
      restart_delay: 5000,
      max_restarts: 10
    },

    // Socket.IO Exporter
    {
      name: 'socketio-exporter',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/socketio-exporter',
      env: {
        NODE_ENV: 'production',
        PORT: 9466,
        API_URL: 'http://localhost:3002',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6380
      },
      instances: 1,
      exec_mode: 'fork'
    },

    // Business Metrics Exporter
    {
      name: 'business-metrics-exporter',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/business-metrics-exporter',
      env: {
        NODE_ENV: 'production',
        PORT: 9465,
        DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6380,
        ELASTICSEARCH_URL: 'http://localhost:9200'
      },
      instances: 1,
      exec_mode: 'fork'
    },

    // Security Exporter
    {
      name: 'security-exporter',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/security-exporter',
      env: {
        NODE_ENV: 'production',
        PORT: 9464,
        LOG_PATH: '/var/log/cryb',
        API_URL: 'http://localhost:3002'
      },
      instances: 1,
      exec_mode: 'fork'
    },

    // BullMQ Exporter
    {
      name: 'bullmq-exporter',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/bullmq-exporter',
      env: {
        NODE_ENV: 'production',
        PORT: 9467,
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6380
      },
      instances: 1,
      exec_mode: 'fork'
    },

    // WebSocket Monitoring
    {
      name: 'websocket-monitoring',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/websocket-monitoring',
      env: {
        NODE_ENV: 'production',
        PORT: 9468,
        SOCKET_URL: 'http://localhost:3002'
      },
      instances: 1,
      exec_mode: 'fork'
    },

    // Database Performance
    {
      name: 'database-performance',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/database-performance',
      env: {
        NODE_ENV: 'production',
        PORT: 9469,
        DATABASE_URL: 'postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform'
      },
      instances: 1,
      exec_mode: 'fork'
    },

    // Error Tracking
    {
      name: 'error-tracking',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/error-tracking',
      env: {
        NODE_ENV: 'production',
        PORT: 9470,
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6380
      },
      instances: 1,
      exec_mode: 'fork'
    },

    // Search Analytics
    {
      name: 'search-analytics',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/search-analytics',
      env: {
        NODE_ENV: 'production',
        PORT: 9471,
        ELASTICSEARCH_URL: 'http://localhost:9200'
      },
      instances: 1,
      exec_mode: 'fork'
    },

    // Security Automation
    {
      name: 'security-automation',
      script: 'src/index.js',
      cwd: '/home/ubuntu/cryb-platform/services/security-automation',
      env: {
        NODE_ENV: 'production',
        PORT: 9472,
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6380,
        API_URL: 'http://localhost:3002'
      },
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};
