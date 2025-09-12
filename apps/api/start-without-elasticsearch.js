#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Set environment variable to disable Elasticsearch
process.env.DISABLE_ELASTICSEARCH = 'true';
process.env.NODE_ENV = 'development';

console.log('🚀 Starting CRYB API server without Elasticsearch...\n');

// Start the development server
const devProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  env: { ...process.env }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  devProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  devProcess.kill('SIGTERM');
  process.exit(0);
});

devProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

devProcess.on('exit', (code) => {
  console.log(`\nServer process exited with code ${code}`);
  process.exit(code);
});