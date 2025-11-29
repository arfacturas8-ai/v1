const express = require('express');
const { Registry, Gauge } = require('prom-client');
const { Pool } = require('pg');
const winston = require('winston');

const PORT = process.env.PORT || 9469;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://cryb_user:cryb_password@localhost:5432/cryb_platform';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console({ format: winston.format.simple() })] });

const pool = new Pool({ connectionString: DATABASE_URL, max: 5 });

const register = new Registry();
const dbConnectionsActive = new Gauge({ name: 'database_connections_active', help: 'Number of active database connections', registers: [register] });
const dbConnectionsIdle = new Gauge({ name: 'database_connections_idle', help: 'Number of idle database connections', registers: [register] });
const dbConnectionsTotal = new Gauge({ name: 'database_connections_total', help: 'Total number of database connections', registers: [register] });
const dbQueryDuration = new Gauge({ name: 'database_query_duration_seconds', help: 'Sample query duration in seconds', registers: [register] });
const dbSize = new Gauge({ name: 'database_size_bytes', help: 'Database size in bytes', registers: [register] });
const dbTableCount = new Gauge({ name: 'database_tables_total', help: 'Total number of tables', registers: [register] });

async function collectMetrics() {
  try {
    dbConnectionsTotal.set(pool.totalCount);
    dbConnectionsIdle.set(pool.idleCount);
    dbConnectionsActive.set(pool.totalCount - pool.idleCount);

    const queryStart = Date.now();
    await pool.query('SELECT 1');
    const queryDuration = (Date.now() - queryStart) / 1000;
    dbQueryDuration.set(queryDuration);

    const sizeResult = await pool.query('SELECT pg_database_size(current_database()) as size');
    dbSize.set(parseInt(sizeResult.rows[0].size));

    const tableResult = await pool.query("SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
    dbTableCount.set(parseInt(tableResult.rows[0].count));
  } catch (error) {
    logger.error('Error collecting database metrics:', error);
  }
}

const app = express();
app.get('/metrics', async (req, res) => { try { await collectMetrics(); res.set('Content-Type', register.contentType); res.end(await register.metrics()); } catch (error) { logger.error('Error generating metrics:', error); res.status(500).end(); } });
app.get('/health', async (req, res) => { try { await pool.query('SELECT 1'); res.json({ status: 'healthy', service: 'database-performance' }); } catch (error) { res.status(500).json({ status: 'unhealthy', service: 'database-performance', error: error.message }); } });

app.listen(PORT, () => { logger.info(`Database Performance Exporter listening on port ${PORT}`); });
