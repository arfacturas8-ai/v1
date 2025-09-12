#!/usr/bin/env node

const http = require('http');

const options = {
  host: 'localhost',
  port: 3000,
  path: '/',
  timeout: 5000,
  method: 'GET'
};

const healthCheck = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});

healthCheck.on('timeout', () => {
  console.error('Health check timeout');
  process.exit(1);
});

healthCheck.end();