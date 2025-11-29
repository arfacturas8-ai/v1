module.exports = {
  apps: [{
    name: 'cryb-api',
    script: 'npx',
    args: 'tsx src/index.ts',
    cwd: '/home/ubuntu/cryb-platform/apps/api',
    instances: 4, // 2x CPU cores for optimal performance
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Performance optimizations
    node_args: '--max-old-space-size=1536 --optimize-for-size',
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Auto-restart on failure
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Cluster settings
    wait_ready: true,
    instance_var: 'INSTANCE_ID',
    // Logging
    error_file: '/home/ubuntu/.pm2/logs/cryb-api-error.log',
    out_file: '/home/ubuntu/.pm2/logs/cryb-api-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
