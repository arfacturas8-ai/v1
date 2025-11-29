const { AuthService } = require('./src/services/auth');
const Redis = require('ioredis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testTokenValidation() {
  console.log('🔍 Testing token validation...');
  
  const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZvZWc2b24wMDAwMTFmd2pkazRreTFkIiwiZW1haWwiOiJkaXNjb3JkdGVzdEB0ZXN0LmNvbSIsInNlc3Npb25JZCI6Ijc2YjMxMDlkLTE3YzQtNDAzMC04YTMzLWU1NjI4YTI2Zjg1NCIsImlzVmVyaWZpZWQiOnRydWUsImlhdCI6MTc1ODE0MzM5MSwiZXhwIjoxNzU4MTQ0MjkxLCJhdWQiOiJjcnliLXVzZXJzIiwiaXNzIjoiY3J5Yi1wbGF0Zm9ybSJ9.6FZ1Gedh0kyzUmEWOhusVWUD4fkR0w7Xk3QOhCsGJhw';
  
  try {
    // Create Redis connection
    const redis = new Redis(process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0');
    
    // Create AuthService instance
    const authService = new AuthService(redis);
    
    console.log('Testing token validation with AuthService...');
    
    // Test token validation
    const result = await authService.validateAccessToken(TEST_TOKEN);
    
    console.log('Validation result:', result);
    
    if (result.valid) {
      console.log('✅ Token is valid!');
      console.log('User payload:', result.payload);
    } else {
      console.log('❌ Token is invalid:', result.reason);
    }
    
    await redis.quit();
    
  } catch (error) {
    console.error('❌ Error testing token validation:', error);
  }
}

testTokenValidation().catch(console.error);