const fetch = require('node-fetch');
const API_URL = 'http://localhost:3002';

async function testPlatform() {
  console.log('=== CRYB PLATFORM STATUS CHECK ===\n');
  
  const tests = {
    'API Health': async () => {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      return { pass: data.status === 'healthy', details: data.checks };
    },
    
    'Authentication': async () => {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'demo@cryb.ai',
          password: 'demo123'
        })
      });
      return { pass: res.ok, details: res.status };
    },
    
    'Communities List': async () => {
      const res = await fetch(`${API_URL}/api/v1/communities`);
      const data = await res.json();
      const count = data.data ? data.data.length : 0;
      return { pass: res.ok && data.success, details: `${count} communities` };
    },
    
    'Posts Feed': async () => {
      const res = await fetch(`${API_URL}/api/v1/posts`);
      const data = await res.json();
      const count = data.data ? data.data.length : 0;
      return { pass: res.ok && data.success, details: `${count} posts` };
    },
    
    'Search': async () => {
      const res = await fetch(`${API_URL}/api/v1/search?q=test`);
      return { pass: res.ok, details: res.status };
    },
    
    'WebSocket': async () => {
      // Just check if socket.io endpoint responds
      const res = await fetch(`${API_URL}/socket.io/?EIO=4&transport=polling`);
      return { pass: res.ok, details: res.status };
    }
  };
  
  let passCount = 0;
  let failCount = 0;
  
  for (const [name, test] of Object.entries(tests)) {
    try {
      const result = await test();
      if (result.pass) {
        console.log(`✅ ${name}: PASS`, result.details ? `(${JSON.stringify(result.details)})` : '');
        passCount++;
      } else {
        console.log(`❌ ${name}: FAIL`, result.details ? `(${JSON.stringify(result.details)})` : '');
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);
  console.log(`🎯 Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);
}

testPlatform().catch(console.error);