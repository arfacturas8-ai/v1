/**
 * CRYB Platform - File Upload Security Tests
 * 
 * Comprehensive security testing for file upload functionality:
 * - Malicious file detection
 * - Path traversal prevention
 * - File type validation bypass attempts
 * - Size limit enforcement
 * - Authorization checks
 * - MIME type spoofing
 * - Metadata exploitation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileUploadSecurityTester {
  constructor(config = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || 'http://localhost:3002',
      authToken: config.authToken || null,
      ...config
    };

    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      vulnerabilities: [],
      details: []
    };

    this.testDir = path.join(__dirname, '../fixtures/security-test');
  }

  async initialize() {
    console.log('🔒 Initializing File Upload Security Tester...');
    
    // Create test directory
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }

    // Authenticate
    if (!this.config.authToken) {
      this.config.authToken = await this.authenticate();
    }

    // Create malicious test files
    await this.createMaliciousTestFiles();
    
    console.log('✅ Security tester initialized');
  }

  async authenticate() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'sectest@example.com',
          password: 'SecTest123!'
        })
      });

      if (!response.ok) {
        // Create user first
        await fetch(`${this.config.apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'sectest@example.com',
            username: 'sectest',
            password: 'SecTest123!',
            firstName: 'Security',
            lastName: 'Test'
          })
        });

        // Retry login
        const retryResponse = await fetch(`${this.config.apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'sectest@example.com',
            password: 'SecTest123!'
          })
        });

        const retryData = await retryResponse.json();
        return retryData.data.token;
      }

      const data = await response.json();
      return data.data.token;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  async createMaliciousTestFiles() {
    console.log('🦠 Creating malicious test files...');

    // 1. Executable files disguised as images
    const fakeImageExe = path.join(this.testDir, 'fake-image.jpg.exe');
    fs.writeFileSync(fakeImageExe, 'MZ\x90\x00\x03\x00\x00\x00'); // DOS header
    
    // 2. PHP backdoor disguised as image
    const phpBackdoor = path.join(this.testDir, 'backdoor.jpg.php');
    fs.writeFileSync(phpBackdoor, '<?php system($_GET["cmd"]); ?>');
    
    // 3. Script with double extension
    const doubleExt = path.join(this.testDir, 'script.txt.js');
    fs.writeFileSync(doubleExt, 'console.log("malicious code");');
    
    // 4. Path traversal attempts
    const pathTraversal = path.join(this.testDir, '..%2F..%2Fetc%2Fpasswd');
    fs.writeFileSync(pathTraversal, 'root:x:0:0:root:/root:/bin/bash\n');
    
    // 5. MIME type spoofing - executable with image MIME
    const mimeSpoof = path.join(this.testDir, 'spoof.jpg');
    fs.writeFileSync(mimeSpoof, 'MZ\x90\x00'); // PE header but .jpg extension
    
    // 6. Polyglot file (valid image + executable)
    const polyglot = path.join(this.testDir, 'polyglot.jpg');
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const maliciousCode = Buffer.from('MZ\x90\x00\x03\x00\x00\x00'); // DOS header
    const jpegFooter = Buffer.from([0xFF, 0xD9]);
    fs.writeFileSync(polyglot, Buffer.concat([jpegHeader, maliciousCode, jpegFooter]));
    
    // 7. ZIP bomb (decompression bomb)
    const zipBomb = path.join(this.testDir, 'bomb.zip');
    // Simple zip with highly compressible data
    const compressibleData = Buffer.alloc(1024 * 1024, 0); // 1MB of zeros
    fs.writeFileSync(zipBomb, compressibleData);
    
    // 8. SVG with embedded JavaScript
    const maliciousSVG = path.join(this.testDir, 'xss.svg');
    fs.writeFileSync(maliciousSVG, `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <script>alert('XSS')</script>
  <rect width="100" height="100" fill="red"/>
</svg>`);
    
    // 9. HTML file disguised as image
    const htmlAsImage = path.join(this.testDir, 'malicious.gif');
    fs.writeFileSync(htmlAsImage, '<html><script>alert("XSS")</script></html>');
    
    // 10. File with null bytes in name
    const nullByteFile = path.join(this.testDir, 'test\x00.jpg.php');
    try {
      fs.writeFileSync(nullByteFile, 'malicious content');
    } catch (error) {
      // Handle systems that don't allow null bytes in filenames
    }
    
    // 11. Oversized file
    const oversizedFile = path.join(this.testDir, 'oversized.jpg');
    const largeBuffer = Buffer.alloc(500 * 1024 * 1024, 0); // 500MB
    try {
      fs.writeFileSync(oversizedFile, largeBuffer);
    } catch (error) {
      // Handle systems with insufficient space
      console.warn('⚠️ Could not create oversized file for testing');
    }

    console.log('✅ Malicious test files created');
  }

  async runTest(testName, testFunction) {
    console.log(`🧪 Running: ${testName}`);
    
    try {
      const result = await testFunction();
      
      if (result.passed) {
        this.testResults.passed++;
        console.log(`  ✅ ${testName}: PASSED`);
      } else if (result.warning) {
        this.testResults.warnings++;
        console.log(`  ⚠️ ${testName}: WARNING - ${result.message}`);
      } else {
        this.testResults.failed++;
        console.log(`  ❌ ${testName}: FAILED - ${result.message}`);
        if (result.vulnerability) {
          this.testResults.vulnerabilities.push({
            test: testName,
            severity: result.severity || 'medium',
            description: result.message,
            details: result.details
          });
        }
      }
      
      this.testResults.details.push({
        test: testName,
        result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.testResults.failed++;
      console.log(`  💥 ${testName}: ERROR - ${error.message}`);
      
      this.testResults.details.push({
        test: testName,
        result: { passed: false, error: error.message },
        timestamp: new Date().toISOString()
      });
    }
  }

  async uploadTestFile(filePath, endpoint = 'media', expectedToFail = true) {
    try {
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      
      const file = new File([fileBuffer], fileName, {
        type: this.guessContentType(fileName)
      });
      
      formData.append('file', file);
      
      const response = await fetch(`${this.config.apiBaseUrl}/uploads/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`
        },
        body: formData
      });

      const responseData = await response.text();
      
      return {
        success: response.ok,
        status: response.status,
        response: responseData,
        headers: Object.fromEntries(response.headers.entries())
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  guessContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.php': 'application/x-httpd-php',
      '.exe': 'application/x-msdownload',
      '.js': 'application/javascript'
    };
    return types[ext] || 'application/octet-stream';
  }

  // Security Test Cases

  async testExecutableFileUpload() {
    const filePath = path.join(this.testDir, 'fake-image.jpg.exe');
    const result = await this.uploadTestFile(filePath);
    
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'high',
        message: 'Executable file was uploaded successfully - potential RCE vulnerability',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'Executable file upload properly blocked'
      };
    }
  }

  async testPHPBackdoorUpload() {
    const filePath = path.join(this.testDir, 'backdoor.jpg.php');
    const result = await this.uploadTestFile(filePath);
    
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'critical',
        message: 'PHP backdoor file was uploaded - critical security vulnerability',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'PHP backdoor upload properly blocked'
      };
    }
  }

  async testDoubleExtensionBypass() {
    const filePath = path.join(this.testDir, 'script.txt.js');
    const result = await this.uploadTestFile(filePath);
    
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'medium',
        message: 'Double extension bypass successful - script file uploaded',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'Double extension bypass properly prevented'
      };
    }
  }

  async testPathTraversalAttack() {
    const filePath = path.join(this.testDir, '..%2F..%2Fetc%2Fpasswd');
    const result = await this.uploadTestFile(filePath);
    
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'high',
        message: 'Path traversal attack successful - sensitive file access possible',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'Path traversal attack properly blocked'
      };
    }
  }

  async testMIMETypeSpoofing() {
    const filePath = path.join(this.testDir, 'spoof.jpg');
    const result = await this.uploadTestFile(filePath);
    
    // Check if the server properly validates file content vs MIME type
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'medium',
        message: 'MIME type spoofing successful - file content not validated',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'MIME type spoofing properly detected and blocked'
      };
    }
  }

  async testPolygoltFileUpload() {
    const filePath = path.join(this.testDir, 'polyglot.jpg');
    const result = await this.uploadTestFile(filePath);
    
    if (result.success) {
      return {
        passed: false,
        warning: true,
        message: 'Polyglot file uploaded - verify deep content inspection is enabled',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'Polyglot file properly rejected'
      };
    }
  }

  async testSVGWithJavaScript() {
    const filePath = path.join(this.testDir, 'xss.svg');
    const result = await this.uploadTestFile(filePath);
    
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'medium',
        message: 'SVG with embedded JavaScript uploaded - XSS vulnerability possible',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'Malicious SVG properly blocked'
      };
    }
  }

  async testOversizedFileUpload() {
    const filePath = path.join(this.testDir, 'oversized.jpg');
    
    if (!fs.existsSync(filePath)) {
      return {
        passed: true,
        warning: true,
        message: 'Oversized file test skipped - file not created'
      };
    }
    
    const result = await this.uploadTestFile(filePath);
    
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'low',
        message: 'Oversized file uploaded - DoS vulnerability possible',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'Oversized file properly rejected'
      };
    }
  }

  async testUnauthorizedFileUpload() {
    const filePath = path.join(this.testDir, 'fake-image.jpg.exe');
    
    // Test without authentication
    const originalToken = this.config.authToken;
    this.config.authToken = null;
    
    const result = await this.uploadTestFile(filePath);
    
    // Restore token
    this.config.authToken = originalToken;
    
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'high',
        message: 'Unauthorized file upload successful - authentication bypass',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'Unauthorized upload properly blocked'
      };
    }
  }

  async testInvalidTokenFileUpload() {
    const filePath = path.join(this.testDir, 'fake-image.jpg.exe');
    
    // Test with invalid token
    const originalToken = this.config.authToken;
    this.config.authToken = 'invalid-token-12345';
    
    const result = await this.uploadTestFile(filePath);
    
    // Restore token
    this.config.authToken = originalToken;
    
    if (result.success) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'high',
        message: 'File upload with invalid token successful - authorization bypass',
        details: result
      };
    } else {
      return {
        passed: true,
        message: 'Invalid token properly rejected'
      };
    }
  }

  async testContentTypeHeaderManipulation() {
    const filePath = path.join(this.testDir, 'fake-image.jpg.exe');
    
    try {
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      
      // Try to bypass by setting image content type for executable
      const file = new File([fileBuffer], 'legitimate.jpg', {
        type: 'image/jpeg'
      });
      
      formData.append('file', file);
      
      const response = await fetch(`${this.config.apiBaseUrl}/uploads/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
          'Content-Type': undefined // Let browser set it
        },
        body: formData
      });

      if (response.ok) {
        return {
          passed: false,
          vulnerability: true,
          severity: 'medium',
          message: 'Content-Type header manipulation successful - relies only on client-side validation',
          details: { status: response.status }
        };
      } else {
        return {
          passed: true,
          message: 'Content-Type manipulation properly detected'
        };
      }
      
    } catch (error) {
      return {
        passed: true,
        message: 'Content-Type manipulation blocked'
      };
    }
  }

  async testConcurrentMaliciousUploads() {
    const filePath = path.join(this.testDir, 'fake-image.jpg.exe');
    
    // Attempt multiple concurrent malicious uploads
    const uploadPromises = [];
    for (let i = 0; i < 5; i++) {
      uploadPromises.push(this.uploadTestFile(filePath));
    }
    
    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    if (successfulUploads > 0) {
      return {
        passed: false,
        vulnerability: true,
        severity: 'medium',
        message: `${successfulUploads}/5 concurrent malicious uploads succeeded - rate limiting may be insufficient`,
        details: { successfulUploads, totalAttempts: 5 }
      };
    } else {
      return {
        passed: true,
        message: 'All concurrent malicious uploads properly blocked'
      };
    }
  }

  generateSecurityReport() {
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    
    const report = {
      summary: {
        totalTests,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        warnings: this.testResults.warnings,
        vulnerabilities: this.testResults.vulnerabilities.length,
        securityScore: totalTests > 0 ? Math.round((this.testResults.passed / totalTests) * 100) : 0
      },
      vulnerabilities: this.testResults.vulnerabilities,
      recommendations: this.generateSecurityRecommendations(),
      details: this.testResults.details,
      timestamp: new Date().toISOString()
    };

    return report;
  }

  generateSecurityRecommendations() {
    const recommendations = [];
    
    // Analyze vulnerabilities and generate specific recommendations
    const vulnTypes = {};
    this.testResults.vulnerabilities.forEach(vuln => {
      vulnTypes[vuln.test] = vuln.severity;
    });
    
    if (vulnTypes.testExecutableFileUpload) {
      recommendations.push('Implement server-side file type validation based on file content, not just extension');
    }
    
    if (vulnTypes.testPHPBackdoorUpload) {
      recommendations.push('Add strict server-side script file detection and blocking');
    }
    
    if (vulnTypes.testMIMETypeSpoofing) {
      recommendations.push('Implement deep file content inspection beyond MIME type headers');
    }
    
    if (vulnTypes.testSVGWithJavaScript) {
      recommendations.push('Sanitize SVG files to remove embedded scripts before storage');
    }
    
    if (vulnTypes.testUnauthorizedFileUpload || vulnTypes.testInvalidTokenFileUpload) {
      recommendations.push('Strengthen authentication and authorization checks for file uploads');
    }
    
    if (vulnTypes.testPathTraversalAttack) {
      recommendations.push('Implement proper filename sanitization and path validation');
    }
    
    if (vulnTypes.testOversizedFileUpload) {
      recommendations.push('Enforce strict file size limits to prevent DoS attacks');
    }

    // General security recommendations
    recommendations.push('Implement virus/malware scanning for uploaded files');
    recommendations.push('Store uploaded files outside the web root directory');
    recommendations.push('Use a CDN or separate domain for serving user-uploaded content');
    recommendations.push('Implement rate limiting for file uploads per user/IP');
    recommendations.push('Log all file upload attempts for security monitoring');
    
    if (recommendations.length === 0) {
      recommendations.push('File upload security appears robust. Continue regular security testing.');
    }
    
    return recommendations;
  }

  async cleanup() {
    console.log('🧹 Cleaning up security test files...');
    try {
      fs.rmSync(this.testDir, { recursive: true, force: true });
      console.log('✅ Security test cleanup completed');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }
}

// Main security test runner
async function runFileUploadSecurityTests() {
  console.log('🔒 Starting CRYB File Upload Security Tests\n');
  
  const tester = new FileUploadSecurityTester({
    apiBaseUrl: 'http://localhost:3002'
  });

  try {
    await tester.initialize();
    
    console.log('\n🛡️ Running Security Test Suite:\n');
    
    // Run all security tests
    await tester.runTest('Executable File Upload', () => tester.testExecutableFileUpload());
    await tester.runTest('PHP Backdoor Upload', () => tester.testPHPBackdoorUpload());
    await tester.runTest('Double Extension Bypass', () => tester.testDoubleExtensionBypass());
    await tester.runTest('Path Traversal Attack', () => tester.testPathTraversalAttack());
    await tester.runTest('MIME Type Spoofing', () => tester.testMIMETypeSpoofing());
    await tester.runTest('Polyglot File Upload', () => tester.testPolygoltFileUpload());
    await tester.runTest('SVG with JavaScript', () => tester.testSVGWithJavaScript());
    await tester.runTest('Oversized File Upload', () => tester.testOversizedFileUpload());
    await tester.runTest('Unauthorized Upload', () => tester.testUnauthorizedFileUpload());
    await tester.runTest('Invalid Token Upload', () => tester.testInvalidTokenFileUpload());
    await tester.runTest('Content-Type Manipulation', () => tester.testContentTypeHeaderManipulation());
    await tester.runTest('Concurrent Malicious Uploads', () => tester.testConcurrentMaliciousUploads());
    
    // Generate security report
    console.log('\n🔍 Generating Security Report...\n');
    const report = tester.generateSecurityReport();
    
    console.log('='.repeat(80));
    console.log('🔒 CRYB FILE UPLOAD SECURITY TEST REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📊 SUMMARY:');
    Object.entries(report.summary).forEach(([key, value]) => {
      const emoji = key === 'securityScore' ? '🏆' : '📈';
      console.log(`  ${emoji} ${key}: ${value}${key === 'securityScore' ? '%' : ''}`);
    });
    
    if (report.vulnerabilities.length > 0) {
      console.log('\n🚨 VULNERABILITIES FOUND:');
      report.vulnerabilities.forEach((vuln, index) => {
        const severityEmoji = vuln.severity === 'critical' ? '💀' : 
                             vuln.severity === 'high' ? '🔴' : 
                             vuln.severity === 'medium' ? '🟡' : '🟢';
        console.log(`  ${index + 1}. ${severityEmoji} ${vuln.test}: ${vuln.description}`);
      });
    } else {
      console.log('\n✅ NO CRITICAL VULNERABILITIES FOUND');
    }
    
    console.log('\n💡 SECURITY RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log('\n='.repeat(80));
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'file-upload-security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`🔐 Security report saved to: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Security tests failed:', error);
    throw error;
  } finally {
    // await tester.cleanup();
  }
}

// Run tests if called directly
if (require.main === module) {
  runFileUploadSecurityTests()
    .then((report) => {
      const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'critical').length;
      const highVulns = report.vulnerabilities.filter(v => v.severity === 'high').length;
      
      if (criticalVulns > 0) {
        console.log('\n🚨 CRITICAL VULNERABILITIES FOUND - IMMEDIATE ACTION REQUIRED!');
        process.exit(1);
      } else if (highVulns > 0) {
        console.log('\n⚠️ HIGH SEVERITY VULNERABILITIES FOUND - REVIEW REQUIRED');
        process.exit(1);
      } else {
        console.log('\n✅ Security tests completed - no critical vulnerabilities detected');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Security tests failed:', error);
      process.exit(1);
    });
}

module.exports = { FileUploadSecurityTester, runFileUploadSecurityTests };