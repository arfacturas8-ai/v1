const express = require('express');
const { Registry, Gauge, Histogram } = require('prom-client');
const { Client } = require('@elastic/elasticsearch');
const winston = require('winston');

const PORT = process.env.PORT || 9471;
const ES_NODE = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Elasticsearch client
const esClient = new Client({
  node: ES_NODE,
  maxRetries: 3,
  requestTimeout: 10000
});

// Prometheus registry
const register = new Registry();

// Metrics
const searchQueriesTotal = new Gauge({
  name: 'elasticsearch_queries_total',
  help: 'Total number of search queries',
  registers: [register]
});

const searchLatency = new Histogram({
  name: 'elasticsearch_query_duration_seconds',
  help: 'Search query duration',
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const indexDocuments = new Gauge({
  name: 'elasticsearch_index_documents_total',
  help: 'Total number of documents in index',
  labelNames: ['index'],
  registers: [register]
});

const indexSize = new Gauge({
  name: 'elasticsearch_index_size_bytes',
  help: 'Index size in bytes',
  labelNames: ['index'],
  registers: [register]
});

const clusterHealth = new Gauge({
  name: 'elasticsearch_cluster_health_status',
  help: 'Cluster health status (0=red, 1=yellow, 2=green)',
  registers: [register]
});

// Collect metrics
async function collectMetrics() {
  try {
    // Cluster health
    const health = await esClient.cluster.health();
    const healthStatus = { red: 0, yellow: 1, green: 2 };
    clusterHealth.set(healthStatus[health.status] || 0);

    // Index stats
    const stats = await esClient.indices.stats();
    for (const [indexName, indexStats] of Object.entries(stats.indices || {})) {
      const docs = indexStats.primaries?.docs?.count || 0;
      const size = indexStats.primaries?.store?.size_in_bytes || 0;
      indexDocuments.set({ index: indexName }, docs);
      indexSize.set({ index: indexName }, size);
    }

    // Search stats
    const searchStats = await esClient.nodes.stats({ metric: 'indices' });
    const totalQueries = Object.values(searchStats.nodes || {}).reduce((sum, node) => {
      return sum + (node.indices?.search?.query_total || 0);
    }, 0);
    searchQueriesTotal.set(totalQueries);

  } catch (error) {
    logger.error('Error collecting Elasticsearch metrics:', error.message);
  }
}

// Express app
const app = express();

app.get('/metrics', async (req, res) => {
  try {
    await collectMetrics();
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end();
  }
});

app.get('/health', async (req, res) => {
  try {
    const ping = await esClient.ping();
    res.json({ status: 'healthy', service: 'search-analytics', elasticsearch: ping });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', service: 'search-analytics', error: error.message });
  }
});

app.listen(PORT, () => {
  logger.info(`Search Analytics Exporter listening on port ${PORT}`);
  logger.info(`Monitoring Elasticsearch at ${ES_NODE}`);
});
