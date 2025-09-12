// Gradually add main server components to find the hang
console.log('Starting main server debug...');

require('dotenv').config();

async function start() {
  try {
    console.log('1. Loading basic modules...');
    const { buildApp } = require('./src/app');
    
    console.log('2. Building app...');
    const app = await buildApp({
      logger: {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname'
          }
        }
      }
    });

    console.log('3. Starting server...');
    const PORT = 3002;
    const HOST = '0.0.0.0';
    
    await app.listen({ 
      port: PORT, 
      host: HOST,
      backlog: 512
    });
    
    console.log('4. ✅ Server started successfully!');
    console.log(`📡 Server listening at http://${HOST}:${PORT}`);
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();