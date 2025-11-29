#!/usr/bin/env node
const fs = require('fs');
const http = require('http');

class SimpleSocketTester {
  constructor() {
    this.results = {
      handshake: false,
      polling: false,
      errors: []
    };
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} [${level}] ${message}`);
  }

  async testSocketIOHandshake() {
    this.log('INFO', 'Testing Socket.IO handshake...');
    
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/socket.io/?EIO=4&transport=polling',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            if (data.startsWith('0{')) {
              const jsonData = data.substring(1);
              const parsed = JSON.parse(jsonData);
              
              if (parsed.sid) {
                this.log('SUCCESS', `Socket.IO handshake successful! SID: ${parsed.sid}`);
                this.results.handshake = true;
                this.results.sessionId = parsed.sid;
                this.results.pingInterval = parsed.pingInterval;
                this.results.pingTimeout = parsed.pingTimeout;
              }
            }
          } catch (error) {
            this.log('ERROR', `Parse error: ${error.message}`);
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        this.log('ERROR', `Request failed: ${error.message}`);
        resolve();
      });

      req.end();
    });
  }

  async runTests() {
    this.log('INFO', 'Starting Socket.IO infrastructure test...');
    await this.testSocketIOHandshake();
    
    console.log('\n=== RESULTS ===');
    console.log(`Handshake: ${this.results.handshake ? 'PASS' : 'FAIL'}`);
    if (this.results.sessionId) {
      console.log(`Session ID: ${this.results.sessionId}`);
      console.log(`Ping Interval: ${this.results.pingInterval}ms`);
    }
  }
}

const tester = new SimpleSocketTester();
tester.runTests().catch(console.error);
