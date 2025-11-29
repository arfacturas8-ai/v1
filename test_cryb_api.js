const axios = require('axios');

const API_BASE_URL = 'https://api.cryb.ai/api/v1';

// Generate a unique test user
const timestamp = Date.now();
const testUser = {
  email: `test${timestamp}@test.com`,
  username: `testuser${timestamp}`,
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
  displayName: `Test User ${timestamp}`
};

let authToken = null;

// Helper function for API calls
async function apiCall(method, endpoint, data = null, useAuth = false) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useAuth && authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'N/A',
      error: error.response?.data || error.message,
      message: error.message
    };
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('CRYB PLATFORM API TEST SUITE');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Create test user
  console.log('1. CREATING TEST USER ACCOUNT');
  console.log('-'.repeat(80));
  console.log('Test User Details:');
  console.log(JSON.stringify(testUser, null, 2));
  console.log();

  const registerResult = await apiCall('POST', '/auth/register', testUser);
  console.log('Registration Result:');
  console.log(JSON.stringify(registerResult, null, 2));
  console.log();

  if (!registerResult.success) {
    console.log('FAILED: Could not create test user. Trying to login instead...');
    console.log();
  }

  // Step 2: Get authentication token
  console.log('2. AUTHENTICATING AND GETTING TOKEN');
  console.log('-'.repeat(80));

  const loginResult = await apiCall('POST', '/auth/login', {
    login: testUser.username,
    password: testUser.password
  });

  console.log('Login Result:');
  console.log(JSON.stringify(loginResult, null, 2));
  console.log();

  if (loginResult.success && loginResult.data?.token) {
    authToken = loginResult.data.token;
    console.log(`Authentication Token Obtained: ${authToken.substring(0, 20)}...`);
  } else {
    console.log('FAILED: Could not obtain authentication token');
    console.log('Cannot proceed with authenticated endpoints');
    return;
  }
  console.log();

  // Step 3: Test Awards Endpoints
  console.log('3. TESTING AWARDS ENDPOINTS');
  console.log('='.repeat(80));
  console.log();

  console.log('3a. GET /api/v1/awards/types');
  console.log('-'.repeat(80));
  const awardTypesResult = await apiCall('GET', '/awards/types', null, true);
  console.log('Response:');
  console.log(JSON.stringify(awardTypesResult, null, 2));
  console.log();

  console.log('3b. GET /api/v1/awards/received');
  console.log('-'.repeat(80));
  const awardReceivedResult = await apiCall('GET', '/awards/received', null, true);
  console.log('Response:');
  console.log(JSON.stringify(awardReceivedResult, null, 2));
  console.log();

  console.log('3c. GET /api/v1/awards/given');
  console.log('-'.repeat(80));
  const awardGivenResult = await apiCall('GET', '/awards/given', null, true);
  console.log('Response:');
  console.log(JSON.stringify(awardGivenResult, null, 2));
  console.log();

  // Step 4: Test GDPR Endpoints
  console.log('4. TESTING GDPR ENDPOINTS');
  console.log('='.repeat(80));
  console.log();

  console.log('4a. GET /api/v1/gdpr/privacy-info');
  console.log('-'.repeat(80));
  const gdprPrivacyResult = await apiCall('GET', '/gdpr/privacy-info', null, true);
  console.log('Response:');
  console.log(JSON.stringify(gdprPrivacyResult, null, 2));
  console.log();

  console.log('4b. GET /api/v1/gdpr/requests');
  console.log('-'.repeat(80));
  const gdprRequestsResult = await apiCall('GET', '/gdpr/requests', null, true);
  console.log('Response:');
  console.log(JSON.stringify(gdprRequestsResult, null, 2));
  console.log();

  // Step 5: Test 2FA Endpoints
  console.log('5. TESTING 2FA ENDPOINTS');
  console.log('='.repeat(80));
  console.log();

  console.log('5a. GET /api/v1/2fa/status');
  console.log('-'.repeat(80));
  const twoFAStatusResult = await apiCall('GET', '/2fa/status', null, true);
  console.log('Response:');
  console.log(JSON.stringify(twoFAStatusResult, null, 2));
  console.log();

  console.log('5b. GET /api/v1/2fa/setup');
  console.log('-'.repeat(80));
  const twoFASetupResult = await apiCall('GET', '/2fa/setup', null, true);
  console.log('Response:');
  console.log(JSON.stringify(twoFASetupResult, null, 2));
  console.log();

  // Summary Report
  console.log('='.repeat(80));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(80));
  console.log();

  console.log('AWARDS SYSTEM:');
  console.log(`  - /awards/types: ${awardTypesResult.success ? 'SUCCESS' : 'FAILED'} (HTTP ${awardTypesResult.status})`);
  console.log(`  - /awards/received: ${awardReceivedResult.success ? 'SUCCESS' : 'FAILED'} (HTTP ${awardReceivedResult.status})`);
  console.log(`  - /awards/given: ${awardGivenResult.success ? 'SUCCESS' : 'FAILED'} (HTTP ${awardGivenResult.status})`);
  console.log();

  console.log('GDPR SYSTEM:');
  console.log(`  - /gdpr/privacy-info: ${gdprPrivacyResult.success ? 'SUCCESS' : 'FAILED'} (HTTP ${gdprPrivacyResult.status})`);
  console.log(`  - /gdpr/requests: ${gdprRequestsResult.success ? 'SUCCESS' : 'FAILED'} (HTTP ${gdprRequestsResult.status})`);
  console.log();

  console.log('2FA SYSTEM:');
  console.log(`  - /2fa/status: ${twoFAStatusResult.success ? 'SUCCESS' : 'FAILED'} (HTTP ${twoFAStatusResult.status})`);
  console.log(`  - /2fa/setup: ${twoFASetupResult.success ? 'SUCCESS' : 'FAILED'} (HTTP ${twoFASetupResult.status})`);
  console.log();

  // Implementation status
  const allEndpoints = [
    awardTypesResult, awardReceivedResult, awardGivenResult,
    gdprPrivacyResult, gdprRequestsResult,
    twoFAStatusResult, twoFASetupResult
  ];

  const implemented = allEndpoints.filter(r => r.success && r.status === 200).length;
  const notFound = allEndpoints.filter(r => r.status === 404).length;
  const unauthorized = allEndpoints.filter(r => r.status === 401).length;
  const errors = allEndpoints.filter(r => !r.success && r.status !== 404 && r.status !== 401).length;

  console.log('IMPLEMENTATION STATUS:');
  console.log(`  - Fully Implemented: ${implemented}/${allEndpoints.length}`);
  console.log(`  - Not Found (404): ${notFound}/${allEndpoints.length}`);
  console.log(`  - Unauthorized (401): ${unauthorized}/${allEndpoints.length}`);
  console.log(`  - Other Errors: ${errors}/${allEndpoints.length}`);
  console.log();

  console.log('='.repeat(80));
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
