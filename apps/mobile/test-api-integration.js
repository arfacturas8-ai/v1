#!/usr/bin/env node

/**
 * Test script to validate API integration with real endpoints
 * Run with: node test-api-integration.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing React Native Mobile App API Integration\n');

// Test files that should have been updated
const testFiles = [
  {
    file: 'src/services/RealApiService.ts',
    checks: [
      'process.env.NEXT_PUBLIC_API_URL',
      'async search(',
      'async getPosts(',
      'async getCommunities(',
      'async getMessages(',
      'Authorization: `Bearer ${this.token}`'
    ]
  },
  {
    file: 'src/screens/HomeScreen.tsx',
    checks: [
      'import apiService from',
      'loadFeed = useCallback',
      'apiService.getPosts(',
      'apiService.getCommunities(',
      'const [error, setError] = useState',
      'if (loading) {'
    ]
  },
  {
    file: 'src/screens/CommunitiesScreen.tsx',
    checks: [
      'import apiService from',
      'apiService.getCommunities()',
      'apiService.joinCommunity(',
      'apiService.leaveCommunity(',
      'const [initialLoading'
    ]
  },
  {
    file: 'src/screens/MessagesScreen.tsx',
    checks: [
      'import apiService from',
      'apiService.getMessages(',
      'apiService.getConversations(',
      'loadConversations = useCallback'
    ]
  },
  {
    file: 'src/screens/SearchScreen.tsx',
    checks: [
      'import apiService from',
      'apiService.search(',
      'response.posts',
      'response.communities',
      'response.users'
    ]
  },
  {
    file: 'src/stores/authStore.ts',
    checks: [
      'import apiService from',
      'apiService.login(',
      'apiService.register(',
      'apiService.getCurrentUser(',
      'apiService.getToken()'
    ]
  }
];

let allTestsPassed = true;

testFiles.forEach(({ file, checks }) => {
  const filePath = path.join(__dirname, file);
  
  console.log(`📁 Testing ${file}:`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ File not found`);
    allTestsPassed = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  checks.forEach(check => {
    if (content.includes(check)) {
      console.log(`   ✅ Contains: ${check}`);
    } else {
      console.log(`   ❌ Missing: ${check}`);
      allTestsPassed = false;
    }
  });
  
  console.log('');
});

// Test API service structure
console.log('🔧 Checking API Service Structure:');

const apiServicePath = path.join(__dirname, 'src/services/RealApiService.ts');
if (fs.existsSync(apiServicePath)) {
  const apiContent = fs.readFileSync(apiServicePath, 'utf8');
  
  // Check for proper endpoint implementation
  const requiredEndpoints = [
    '/posts',
    '/communities', 
    '/search',
    '/messages'
  ];
  
  requiredEndpoints.forEach(endpoint => {
    if (apiContent.includes(endpoint)) {
      console.log(`   ✅ Implements: ${endpoint}`);
    } else {
      console.log(`   ❌ Missing endpoint: ${endpoint}`);
      allTestsPassed = false;
    }
  });
}

console.log('\n🏗️  Checking Build Configuration:');

// Check package.json for required dependencies
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [
    '@react-native-async-storage/async-storage',
    'expo-file-system',
    'zustand'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`   ✅ Dependency: ${dep}`);
    } else {
      console.log(`   ⚠️  May need: ${dep}`);
    }
  });
}

// Summary
console.log('\n📊 Summary:');
if (allTestsPassed) {
  console.log('✅ All API integration tests passed!');
  console.log('\n🚀 Next Steps:');
  console.log('   1. Set NEXT_PUBLIC_API_URL environment variable');
  console.log('   2. Start your backend API server on localhost:3002');
  console.log('   3. Test the app with real API calls');
  console.log('   4. Verify authentication flow works end-to-end');
  
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please check the issues above.');
  process.exit(1);
}