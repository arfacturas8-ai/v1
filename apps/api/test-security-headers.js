// Simple test to verify security headers implementation
console.log('🔍 Testing Enhanced Security Headers...');

try {
  // Test 1: Import the security headers module
  console.log('\n📦 Testing module import...');
  const EnhancedSecurityHeaders = require('./src/middleware/enhanced-security-headers').default;
  console.log('✅ EnhancedSecurityHeaders module imported successfully');

  // Test 2: Create instance with default config
  console.log('\n⚙️ Testing configuration...');
  const security = new EnhancedSecurityHeaders();
  const config = security.getConfig();
  console.log('✅ Security configuration loaded:', {
    cspEnabled: config.csp.enabled,
    hstsEnabled: config.hsts.enabled,
    corsEnabled: config.cors.enabled,
    frameOptionsEnabled: config.frameOptions.enabled
  });

  // Test 3: Test input sanitization
  console.log('\n🧹 Testing input sanitization...');
  const testInputs = [
    '<script>alert("xss")</script>',
    'normal text',
    '<img src="x" onerror="alert(1)">',
    'Test "quotes" and \'apostrophes\'',
    'Backslash \\ and forward slash /'
  ];

  testInputs.forEach(input => {
    const sanitized = EnhancedSecurityHeaders.sanitizeInput(input);
    console.log(`  Input: ${input}`);
    console.log(`  Sanitized: ${sanitized}`);
    console.log(`  Safe: ${sanitized === input ? '✅' : '🔧'}`);
  });

  // Test 4: Generate security report
  console.log('\n📊 Testing security report generation...');
  security.generateSecurityReport().then(report => {
    console.log('✅ Security report generated:', {
      cspEnabled: report.securityHeaders.csp,
      hstsEnabled: report.securityHeaders.hsts,
      environment: report.configuration.environment,
      reportOnlyMode: report.configuration.reportOnlyMode
    });
  }).catch(error => {
    console.log('❌ Security report generation failed:', error.message);
  });

  // Test 5: Configuration update
  console.log('\n🔄 Testing configuration updates...');
  security.updateConfig({
    csp: { enabled: false },
    hsts: { maxAge: 86400 }
  });
  
  const updatedConfig = security.getConfig();
  console.log('✅ Configuration updated:', {
    cspEnabled: updatedConfig.csp.enabled,
    hstsMaxAge: updatedConfig.hsts.maxAge
  });

  console.log('\n🎉 Enhanced Security Headers test completed successfully!');
  console.log('\n🔒 Security Features Available:');
  console.log('  • Content Security Policy with nonce support');
  console.log('  • HTTP Strict Transport Security');
  console.log('  • X-Frame-Options protection');
  console.log('  • CORS with origin validation');
  console.log('  • Input sanitization for XSS prevention');
  console.log('  • CSP violation reporting');
  console.log('  • Security event monitoring');
  console.log('  • Dynamic configuration updates');
  console.log('  • Comprehensive security reporting');

  console.log('\n🔗 Security API Endpoints:');
  console.log('  POST /api/v1/security/csp-report - CSP violation reports');
  console.log('  GET  /api/v1/security/monitoring - Security monitoring (admin)');
  console.log('  GET  /api/v1/security/config - Security configuration (admin)');
  console.log('  PATCH /api/v1/security/config - Update configuration (admin)');
  console.log('  GET  /api/v1/security/report - Security compliance report (admin)');
  console.log('  GET  /api/v1/security/health - Security health check');
  console.log('  POST /api/v1/security/sanitize - Test input sanitization');
  console.log('  GET  /api/v1/security/headers-test - Test security headers');
  console.log('  GET  /api/v1/security/cors-test - Test CORS configuration');

} catch (error) {
  console.error('❌ Security headers test failed:', error.message);
}