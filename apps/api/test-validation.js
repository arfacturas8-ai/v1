const { z } = require('zod');

// Test community creation schema
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

// Test channel creation schema
const channelCreateSchema = z.object({
  serverId: z.string().cuid(),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().max(500).optional(),
  type: z.enum(['TEXT', 'VOICE', 'VIDEO', 'FORUM', 'STAGE', 'CATEGORY', 'ANNOUNCEMENT']).default('TEXT'),
  parentId: z.string().cuid().optional(),
  isPrivate: z.boolean().default(false),
  slowMode: z.number().min(0).max(21600).default(0),
  nsfw: z.boolean().default(false)
});

// Test message creation schema
const messageCreateSchema = z.object({
  channelId: z.string().cuid(),
  content: z.string().min(1).max(4000),
  replyToId: z.string().cuid().optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number(),
    contentType: z.string()
  })).optional(),
  embeds: z.array(z.any()).optional()
});

console.log('🔍 Testing validation schemas...\n');

// Test 1: Valid community data
const testCommunity = {
  name: 'testcommunity',
  displayName: 'Test Community',
  description: 'A test community',
  isPublic: true,
  isNsfw: false
};

console.log('1. Testing community creation:');
try {
  const result = communityCreateSchema.parse(testCommunity);
  console.log('✅ Valid community data passed validation');
} catch (error) {
  console.log('❌ Community validation failed:', error.errors);
}

// Test 2: Invalid community name (too short)
console.log('\n2. Testing invalid community name (too short):');
try {
  const result = communityCreateSchema.parse({
    ...testCommunity,
    name: 'ab'
  });
  console.log('❌ Should have failed but passed!');
} catch (error) {
  console.log('✅ Correctly rejected short name:', error.errors[0].message);
}

// Test 3: Valid channel data with proper CUID
const testChannel = {
  serverId: 'ckm8xtj3q0001g6o6v2h9z5z1', // Example CUID
  name: 'general',
  description: 'General discussion',
  type: 'TEXT'
};

console.log('\n3. Testing channel creation:');
try {
  const result = channelCreateSchema.parse(testChannel);
  console.log('✅ Valid channel data passed validation');
} catch (error) {
  console.log('❌ Channel validation failed:', error.errors);
}

// Test 4: Invalid channel with non-CUID serverId
console.log('\n4. Testing channel with invalid serverId:');
try {
  const result = channelCreateSchema.parse({
    ...testChannel,
    serverId: 'not-a-cuid'
  });
  console.log('❌ Should have failed but passed!');
} catch (error) {
  console.log('✅ Correctly rejected invalid serverId:', error.errors[0].message);
}

// Test 5: Valid message data
const testMessage = {
  channelId: 'ckm8xtj3q0002g6o6v2h9z5z2', // Example CUID
  content: 'Hello world!'
};

console.log('\n5. Testing message creation:');
try {
  const result = messageCreateSchema.parse(testMessage);
  console.log('✅ Valid message data passed validation');
} catch (error) {
  console.log('❌ Message validation failed:', error.errors);
}

// Test 6: Invalid message (empty content)
console.log('\n6. Testing message with empty content:');
try {
  const result = messageCreateSchema.parse({
    ...testMessage,
    content: ''
  });
  console.log('❌ Should have failed but passed!');
} catch (error) {
  console.log('✅ Correctly rejected empty content:', error.errors[0].message);
}

console.log('\n🎯 Validation schema testing complete!');