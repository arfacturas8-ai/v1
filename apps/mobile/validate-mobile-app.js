/**
 * Mobile App Validation Script
 * Tests that the CRYB mobile app can connect to the API and basic functionality works
 */

const fs = require('fs');
const path = require('path');

// Configuration from environment
const API_BASE_URL = 'http://localhost:3002';
const METRO_URL = 'http://localhost:8081';

class MobileAppValidator {
  constructor() {
    this.results = {
      config: [],
      api: [],
      files: [],
      metro: []
    };
  }

  log(category, message, status = 'info') {
    const timestamp = new Date().toISOString();
    const statusIcon = status === 'success' ? '✅' : status === 'error' ? '❌' : 'ℹ️';
    console.log(`${statusIcon} [${timestamp}] ${message}`);
    
    this.results[category].push({
      message,
      status,
      timestamp
    });
  }

  async testAPIConnection() {
    console.log('\n🔍 Testing API Connection...');
    
    try {
      // Test API health
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      
      if (response.status === 400 || response.status === 401) {
        this.log('api', 'API authentication endpoint is responding correctly', 'success');
        return true;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      this.log('api', `API connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testMetroServer() {
    console.log('\n🔍 Testing Metro Bundler...');
    
    try {
      const response = await fetch(`${METRO_URL}/status`, { method: 'GET' });
      if (response.ok) {
        this.log('metro', 'Metro bundler is running and accessible', 'success');
        return true;
      }
    } catch (error) {
      // Metro might not have /status endpoint, try a different approach
      try {
        const response = await fetch(METRO_URL, { method: 'GET' });
        this.log('metro', 'Metro bundler is accessible on port 8081', 'success');
        return true;
      } catch (innerError) {
        this.log('metro', `Metro bundler is not accessible: ${innerError.message}`, 'error');
        return false;
      }
    }
  }

  validateConfiguration() {
    console.log('\n🔍 Validating Configuration...');
    
    const envPath = path.join(__dirname, '.env.development');
    
    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('EXPO_PUBLIC_API_BASE_URL=http://localhost:3002')) {
          this.log('config', 'API URL correctly configured for port 3002', 'success');
        } else {
          this.log('config', 'API URL configuration may be incorrect', 'error');
        }
        
        if (envContent.includes('EXPO_PUBLIC_WS_URL=ws://localhost:3002')) {
          this.log('config', 'WebSocket URL correctly configured for port 3002', 'success');
        } else {
          this.log('config', 'WebSocket URL configuration may be incorrect', 'error');
        }
        
      } else {
        this.log('config', '.env.development file not found', 'error');
      }
    } catch (error) {
      this.log('config', `Configuration validation failed: ${error.message}`, 'error');
    }
  }

  validateCriticalFiles() {
    console.log('\n🔍 Validating Critical Files...');
    
    const criticalFiles = [
      'src/stores/authStore.ts',
      'src/services/ApiService.ts',
      'src/navigation/RootNavigator.tsx',
      'src/screens/auth/LoginScreen.tsx',
      'src/screens/HomeScreen.tsx',
      'App.tsx',
      'package.json'
    ];

    let allFilesExist = true;
    
    criticalFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.log('files', `Critical file exists: ${file}`, 'success');
      } else {
        this.log('files', `Missing critical file: ${file}`, 'error');
        allFilesExist = false;
      }
    });

    return allFilesExist;
  }

  async runAllTests() {
    console.log('🚀 Starting CRYB Mobile App Validation...\n');

    // Run all validation tests
    this.validateConfiguration();
    const filesOk = this.validateCriticalFiles();
    const apiOk = await this.testAPIConnection();
    const metroOk = await this.testMetroServer();

    // Generate summary
    console.log('\n📋 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    const configSuccesses = this.results.config.filter(r => r.status === 'success').length;
    const apiSuccesses = this.results.api.filter(r => r.status === 'success').length;
    const filesSuccesses = this.results.files.filter(r => r.status === 'success').length;
    const metroSuccesses = this.results.metro.filter(r => r.status === 'success').length;
    
    console.log(`📁 Configuration: ${configSuccesses}/${this.results.config.length} checks passed`);
    console.log(`📄 Files: ${filesSuccesses}/${this.results.files.length} files found`);
    console.log(`🔗 API Connection: ${apiSuccesses}/${this.results.api.length} tests passed`);
    console.log(`⚡ Metro Bundler: ${metroSuccesses}/${this.results.metro.length} tests passed`);
    
    const overallSuccess = filesOk && apiOk && (configSuccesses > 0) && metroOk;
    
    console.log('\n🎯 OVERALL STATUS:', overallSuccess ? '✅ READY FOR TESTING' : '❌ NEEDS ATTENTION');
    
    if (overallSuccess) {
      console.log('\n🎉 The CRYB mobile app is configured and ready!');
      console.log('📱 To test on iOS/Android:');
      console.log('   1. Make sure Metro bundler is running (npm start in mobile directory)');
      console.log('   2. Install Expo Go app on your device');
      console.log('   3. Scan the QR code or use the connection URL');
      console.log('   4. Test login/register functionality');
      console.log('\n🖥️  API is running on:', API_BASE_URL);
      console.log('📡 Metro bundler on:', METRO_URL);
    } else {
      console.log('\n🔧 Issues found that need to be resolved before testing.');
    }

    return overallSuccess;
  }
}

// Run the validation
const validator = new MobileAppValidator();
validator.runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});