const express = require('express');
const { Registry, Gauge } = require('prom-client');
const { io } = require('socket.io-client');
const winston = require('winston');

const PORT = process.env.PORT || 9468;
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3002';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console({ format: winston.format.simple() })] });

const register = new Registry();
const websocketConnected = new Gauge({ name: 'websocket_connected', help: 'WebSocket connection status (1 = connected, 0 = disconnected)', registers: [register] });
const websocketLatency = new Gauge({ name: 'websocket_latency_ms', help: 'WebSocket round-trip latency in milliseconds', registers: [register] });
const websocketReconnects = new Gauge({ name: 'websocket_reconnects_total', help: 'Total number of WebSocket reconnections', registers: [register] });

let reconnectCount = 0;
let connected = false;
let latency = 0;

const socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 });

socket.on('connect', () => { logger.info('WebSocket connected'); connected = true; websocketConnected.set(1); });
socket.on('disconnect', () => { logger.warn('WebSocket disconnected'); connected = false; websocketConnected.set(0); });
socket.on('reconnect', () => { reconnectCount++; websocketReconnects.set(reconnectCount); logger.info(`WebSocket reconnected (total: ${reconnectCount})`); });

setInterval(() => {
  if (connected) {
    const start = Date.now();
    socket.emit('ping', () => { latency = Date.now() - start; websocketLatency.set(latency); });
  }
}, 5000);

const app = express();
app.get('/metrics', async (req, res) => { res.set('Content-Type', register.contentType); res.end(await register.metrics()); });
app.get('/health', (req, res) => { res.json({ status: connected ? 'healthy' : 'unhealthy', service: 'websocket-monitoring', connected, latency, reconnects: reconnectCount }); });

app.listen(PORT, () => { logger.info(`WebSocket Monitoring listening on port ${PORT}`); logger.info(`Monitoring Socket.IO server at ${SOCKET_URL}`); });
