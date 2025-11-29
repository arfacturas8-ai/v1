#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Create Prisma client with metrics enabled
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'query', emit: 'event' },
  ],
});

// Enable metrics collection
const prometheus = require('prom-client');

// Connection pool metrics
const connectionPoolGauge = new prometheus.Gauge({
  name: 'cryb_database_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state']
});

const queryDurationHistogram = new prometheus.Histogram({
  name: 'cryb_database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation']
});

const queryCountCounter = new prometheus.Counter({
  name: 'cryb_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'status']
});

// Listen to Prisma events
prisma.$on('query', (e) => {
  queryDurationHistogram.observe({ operation: e.query.split(' ')[0] }, e.duration / 1000);
  queryCountCounter.inc({ operation: e.query.split(' ')[0], status: 'success' });
});

prisma.$on('info', (e) => {
  console.log('📊 Prisma Info:', e.message);
});

prisma.$on('warn', (e) => {
  console.warn('⚠️  Prisma Warning:', e.message);
});

prisma.$on('error', (e) => {
  console.error('❌ Prisma Error:', e.message);
  queryCountCounter.inc({ operation: 'unknown', status: 'error' });
});

async function monitorConnections() {
  try {
    // Get connection statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        count(*) FILTER (WHERE state = 'idle in transaction (aborted)') as aborted_connections,
        count(*) FILTER (WHERE waiting = true) as waiting_connections
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid();
    `;
    
    // Update Prometheus metrics
    for (const stat of stats) {
      connectionPoolGauge.set({ state: 'total' }, Number(stat.total_connections));
      connectionPoolGauge.set({ state: 'active' }, Number(stat.active_connections));
      connectionPoolGauge.set({ state: 'idle' }, Number(stat.idle_connections));
      connectionPoolGauge.set({ state: 'idle_in_transaction' }, Number(stat.idle_in_transaction));
      connectionPoolGauge.set({ state: 'waiting' }, Number(stat.waiting_connections));
    }
    
    // Log statistics
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📊 Connection Pool Status:`);
    for (const stat of stats) {
      console.log(`  Total: ${stat.total_connections}, Active: ${stat.active_connections}, Idle: ${stat.idle_connections}`);
      console.log(`  In Transaction: ${stat.idle_in_transaction}, Waiting: ${stat.waiting_connections}`);
    }
    
    // Check for potential issues
    for (const stat of stats) {
      const totalConn = Number(stat.total_connections);
      const activeConn = Number(stat.active_connections);
      const waitingConn = Number(stat.waiting_connections);
      
      if (totalConn > 15) {
        console.warn(`⚠️  High connection count: ${totalConn}`);
      }
      
      if (waitingConn > 0) {
        console.warn(`⚠️  Connections waiting for resources: ${waitingConn}`);
      }
      
      if (activeConn > 0 && (activeConn / totalConn) > 0.8) {
        console.warn(`⚠️  High connection utilization: ${Math.round((activeConn / totalConn) * 100)}%`);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection monitoring error:', error.message);
  }
}

async function monitorSlowQueries() {
  try {
    // Get slow queries from pg_stat_statements (if available)
    const slowQueries = await prisma.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      WHERE mean_time > 1000 -- Queries taking more than 1 second on average
      ORDER BY mean_time DESC
      LIMIT 10;
    `;
    
    if (slowQueries.length > 0) {
      console.log('🐌 Slow Queries Detected:');
      for (const query of slowQueries) {
        console.log(`  Query: ${query.query.substring(0, 100)}...`);
        console.log(`  Calls: ${query.calls}, Avg Time: ${query.mean_time.toFixed(2)}ms`);
      }
    }
    
  } catch (error) {
    // pg_stat_statements might not be available
    console.log('📝 pg_stat_statements not available for slow query monitoring');
  }
}

// Start monitoring
async function startMonitoring() {
  console.log('🚀 Starting CRYB database connection monitoring...');
  
  // Monitor connections every 30 seconds
  setInterval(monitorConnections, 30000);
  
  // Monitor slow queries every 2 minutes
  setInterval(monitorSlowQueries, 120000);
  
  // Initial check
  await monitorConnections();
  
  // Expose metrics endpoint for Prometheus
  const express = require('express');
  const app = express();
  
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', prometheus.register.contentType);
      res.end(await prometheus.register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });
  
  const port = process.env.METRICS_PORT || 9090;
  app.listen(port, () => {
    console.log(`📊 Metrics endpoint available at http://localhost:${port}/metrics`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down connection monitoring...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start if run directly
if (require.main === module) {
  startMonitoring().catch(console.error);
}

module.exports = { monitorConnections, monitorSlowQueries };
