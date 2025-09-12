#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3001';
const testUser = {
    username: `quicktest_${Date.now()}`,
    displayName: 'Quick Test User',
    email: `quicktest_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!'
};

let tokens = null;

async function runQuickTest() {
    console.log('🧪 Running Quick Integration Test...');
    console.log('=' .repeat(50));

    try {
        // 1. Test Registration
        console.log('1. Testing User Registration...');
        const registerResponse = await axios.post(`${API_BASE}/api/v1/auth/register`, testUser);
        tokens = registerResponse.data.data.tokens;
        console.log(`✅ Registration successful: ${registerResponse.data.data.user.username}`);

        // 2. Test JWT Validation
        console.log('2. Testing JWT Validation...');
        const meResponse = await axios.get(`${API_BASE}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        console.log(`✅ JWT validation successful: ${meResponse.data.data.user.username}`);

        // 3. Test Server Creation (Discord Feature)
        console.log('3. Testing Server Creation...');
        const serverResponse = await axios.post(`${API_BASE}/api/v1/servers`, {
            name: `Test Server ${Date.now()}`,
            description: 'Quick test server',
            isPublic: true
        }, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        const server = serverResponse.data.data || serverResponse.data;
        console.log(`✅ Server creation successful: ${server.name} (ID: ${server.id})`);

        // 4. Test Community Creation (Reddit Feature)
        console.log('4. Testing Community Creation...');
        const communityResponse = await axios.post(`${API_BASE}/api/v1/communities`, {
            name: `test${Date.now()}`.slice(0, 20),
            displayName: `Test Community`,
            description: 'Quick test community',
            isPublic: true
        }, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        const community = communityResponse.data.data || communityResponse.data;
        console.log(`✅ Community creation successful: ${community.displayName} (ID: ${community.id})`);

        // 5. Test Post Creation
        console.log('5. Testing Post Creation...');
        const postResponse = await axios.post(`${API_BASE}/api/v1/posts`, {
            communityId: community.id,
            title: `Quick Test Post ${Date.now()}`,
            content: 'This is a quick test post',
            type: 'text'
        }, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        const post = postResponse.data.data || postResponse.data;
        console.log(`✅ Post creation successful: ${post.title} (ID: ${post.id})`);

        // 6. Test Communities List
        console.log('6. Testing Communities List...');
        const communitiesResponse = await axios.get(`${API_BASE}/api/v1/communities`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        const communities = communitiesResponse.data.data?.communities || communitiesResponse.data.communities || [];
        console.log(`✅ Communities list successful: Found ${communities.length} communities`);

        // 7. Test Servers List
        console.log('7. Testing Servers List...');
        const serversResponse = await axios.get(`${API_BASE}/api/v1/servers`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        const servers = serversResponse.data.data?.servers || serversResponse.data.servers || [];
        console.log(`✅ Servers list successful: Found ${servers.length} servers`);

        console.log('\n🎉 All Quick Tests Passed!');
        console.log('=' .repeat(50));

        return {
            success: true,
            results: {
                registration: true,
                jwt: true,
                serverCreation: true,
                communityCreation: true,
                postCreation: true,
                communitiesList: true,
                serversList: true
            }
        };

    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
        }
        return { success: false, error: error.message };
    }
}

if (require.main === module) {
    runQuickTest().then(result => {
        if (result.success) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    });
}

module.exports = { runQuickTest };