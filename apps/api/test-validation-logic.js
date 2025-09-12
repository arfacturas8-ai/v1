#!/usr/bin/env node

// Test community validation logic without server dependencies
const { z } = require('zod');

// Reproduce the validation schema from the middleware
const communityCreateSchema = z.object({
  name: z.string().min(3).max(21).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  icon: z.string().url().optional(),
  banner: z.string().url().optional(),
  isPublic: z.boolean().default(true),
  isNsfw: z.boolean().default(false),
  rules: z.array(z.object({
    title: z.string().max(100),
    description: z.string().max(500)
  })).optional()
});

function testValidation() {
  console.log('🧪 Testing Community Validation Schema');
  console.log('=' .repeat(50));

  const testCases = [
    {
      name: 'Valid community data',
      data: {
        name: 'testcommunity',
        displayName: 'Test Community',
        description: 'A test community',
        isPublic: true,
        isNsfw: false
      },
      shouldPass: true
    },
    {
      name: 'Missing required fields',
      data: {
        description: 'Missing name and displayName'
      },
      shouldPass: false
    },
    {
      name: 'Invalid name (too short)',
      data: {
        name: 'ab',
        displayName: 'Test Community'
      },
      shouldPass: false
    },
    {
      name: 'Invalid name (special characters)',
      data: {
        name: 'test-community!',
        displayName: 'Test Community'
      },
      shouldPass: false
    },
    {
      name: 'Empty displayName',
      data: {
        name: 'testcommunity',
        displayName: ''
      },
      shouldPass: false
    },
    {
      name: 'Description too long',
      data: {
        name: 'testcommunity',
        displayName: 'Test Community',
        description: 'x'.repeat(1001)
      },
      shouldPass: false
    },
    {
      name: 'Invalid URL for icon',
      data: {
        name: 'testcommunity',
        displayName: 'Test Community',
        icon: 'not-a-url'
      },
      shouldPass: false
    },
    {
      name: 'Valid with all optional fields',
      data: {
        name: 'testcommunity',
        displayName: 'Test Community',
        description: 'A comprehensive test community',
        icon: 'https://example.com/icon.png',
        banner: 'https://example.com/banner.png',
        isPublic: false,
        isNsfw: true,
        rules: [
          {
            title: 'Be respectful',
            description: 'Treat all members with respect'
          }
        ]
      },
      shouldPass: true
    }
  ];

  let passCount = 0;
  let totalCount = testCases.length;

  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log('Input:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const result = communityCreateSchema.parse(testCase.data);
      console.log('✅ Validation PASSED');
      console.log('Parsed result:', JSON.stringify(result, null, 2));
      
      if (testCase.shouldPass) {
        passCount++;
        console.log('✅ Expected result: PASS');
      } else {
        console.log('❌ Expected result: FAIL (but validation passed)');
      }
    } catch (error) {
      console.log('❌ Validation FAILED');
      console.log('Error:', error.message);
      
      if (error.errors) {
        console.log('Validation errors:');
        error.errors.forEach(err => {
          console.log(`  - ${err.path.join('.')}: ${err.message}`);
        });
      }
      
      if (!testCase.shouldPass) {
        passCount++;
        console.log('✅ Expected result: FAIL');
      } else {
        console.log('❌ Expected result: PASS (but validation failed)');
      }
    }
  });

  console.log('\n' + '=' .repeat(50));
  console.log(`🎯 Test Summary: ${passCount}/${totalCount} tests behaved as expected`);
  
  if (passCount === totalCount) {
    console.log('✅ All validation tests passed!');
    console.log('🔍 The validation schema appears to be working correctly.');
    console.log('🔍 The issue might be in the server implementation or database layer.');
  } else {
    console.log('❌ Some validation tests failed!');
    console.log('🔍 There might be issues with the validation schema.');
  }

  console.log('\n🔧 Next steps to debug the server issue:');
  console.log('1. Check if the validation middleware is correctly applied');
  console.log('2. Verify the request.body is properly parsed');
  console.log('3. Check database connection and schema');
  console.log('4. Look for any silent errors in the database creation');
}

testValidation();