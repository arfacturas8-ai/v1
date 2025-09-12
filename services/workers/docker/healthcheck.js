const http = require('http');

// Health check configuration
const HEALTH_CHECK_PORT = process.env.PORT || 3001;
const HEALTH_CHECK_PATH = process.env.HEALTH_CHECK_PATH || '/health';
const HEALTH_CHECK_TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000;

// Make health check request
const options = {
  hostname: 'localhost',
  port: HEALTH_CHECK_PORT,
  path: HEALTH_CHECK_PATH,
  timeout: HEALTH_CHECK_TIMEOUT,
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const healthData = JSON.parse(data);
        console.log('Health check passed:', healthData);
        process.exit(0);
      } catch (error) {
        console.error('Health check response parsing failed:', error);
        process.exit(1);
      }
    } else {
      console.error(`Health check failed with status: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Health check request failed:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();