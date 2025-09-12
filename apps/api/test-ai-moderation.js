#!/usr/bin/env node

/**
 * Test script for AI-powered content moderation
 * This script tests the complete moderation pipeline
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-jwt-token';

// Test messages with different risk levels
const testMessages = [
  {
    name: 'Safe Message',
    content: 'Hello everyone! How is your day going?',
    expectedRisk: 'safe'
  },
  {
    name: 'Mild Spam',
    content: 'FREE MONEY! Click here now! Limited time offer!',
    expectedRisk: 'medium'
  },
  {
    name: 'Toxic Content',
    content: 'You are a stupid idiot and I hate you',
    expectedRisk: 'high'
  },
  {
    name: 'NSFW Content', 
    content: 'Check out these sexy photos and adult content',
    expectedRisk: 'high'
  },
  {
    name: 'Crypto Scam',
    content: 'URGENT! Double your Bitcoin now! Send to this address and get 2x back guaranteed!',
    expectedRisk: 'critical'
  }
];

class AIModerationTester {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.headers = {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    };
    this.results = [];
  }

  async testHealthCheck() {
    console.log('🏥 Testing AI service health...');
    try {
      const response = await axios.get(`${this.baseURL}/api/ai-moderation/health`, {
        headers: this.headers,
        timeout: 5000
      });

      if (response.data.success) {
        console.log('✅ AI service health check passed');
        console.log(`   Status: ${response.data.data.status}`);
        console.log(`   Service initialized: ${response.data.data.serviceInitialized}`);
        return true;
      } else {
        console.log('⚠️ AI service health check returned not successful');
        console.log(`   Error: ${response.data.error}`);
        return false;
      }
    } catch (error) {
      console.log('❌ AI service health check failed');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      return false;
    }
  }

  async testMessageAnalysis(testMessage) {
    console.log(`\n🔍 Testing: "${testMessage.name}"`);
    console.log(`   Content: "${testMessage.content}"`);
    console.log(`   Expected Risk: ${testMessage.expectedRisk}`);

    try {
      const messageId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const userId = 'test-user-123';
      const channelId = 'test-channel-456';

      const requestData = {
        messageId,
        content: testMessage.content,
        userId,
        channelId,
        priority: 'medium'
      };

      const response = await axios.post(`${this.baseURL}/api/ai-moderation/messages/analyze`, requestData, {
        headers: this.headers,
        timeout: 15000
      });

      if (response.data.success) {
        const result = response.data.data;
        console.log('✅ Analysis completed successfully');
        console.log(`   Risk Level: ${result.riskLevel}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   Blocked: ${result.blocked}`);
        console.log(`   Requires Review: ${result.requiresReview}`);
        console.log(`   Flags: ${result.flags?.join(', ') || 'none'}`);
        console.log(`   Processing Time: ${result.processingTime}ms`);

        this.results.push({
          name: testMessage.name,
          success: true,
          actualRisk: result.riskLevel,
          expectedRisk: testMessage.expectedRisk,
          confidence: result.confidence,
          blocked: result.blocked,
          flags: result.flags || []
        });

        return true;
      } else {
        console.log('⚠️ Analysis returned not successful');
        console.log(`   Error: ${response.data.error}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Analysis failed');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.error || 'Unknown error'}`);
        
        // Check if fallback was provided
        if (error.response.data?.fallback) {
          console.log('   🔄 Fallback response provided');
          console.log(`   Fallback Risk Level: ${error.response.data.fallback.riskLevel}`);
          this.results.push({
            name: testMessage.name,
            success: false,
            error: error.response.data.error,
            fallback: true
          });
        }
      } else {
        console.log(`   Error: ${error.message}`);
      }
      return false;
    }
  }

  async testBatchAnalysis() {
    console.log('\n📦 Testing batch message analysis...');
    
    const batchMessages = testMessages.slice(0, 3).map((msg, index) => ({
      messageId: `batch_${Date.now()}_${index}`,
      content: msg.content,
      userId: 'test-user-batch',
      channelId: 'test-channel-batch',
      timestamp: new Date().toISOString()
    }));

    try {
      const response = await axios.post(`${this.baseURL}/api/ai-moderation/messages/batch-analyze`, {
        messages: batchMessages
      }, {
        headers: this.headers,
        timeout: 20000
      });

      if (response.data.success) {
        console.log('✅ Batch analysis completed');
        console.log(`   Processed: ${response.data.data.processed} messages`);
        response.data.data.results.forEach((result, index) => {
          if (result.error) {
            console.log(`   Message ${index + 1}: ❌ ${result.error}`);
          } else {
            console.log(`   Message ${index + 1}: ${result.riskLevel} (${(result.confidence * 100).toFixed(1)}%)`);
          }
        });
        return true;
      } else {
        console.log('⚠️ Batch analysis returned not successful');
        return false;
      }
    } catch (error) {
      console.log('❌ Batch analysis failed');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }

  async testTransactionAnalysis() {
    console.log('\n💰 Testing transaction fraud analysis...');

    const transactionData = {
      transactionId: `tx_${Date.now()}`,
      type: 'withdrawal',
      amount: 15000,
      currency: 'USD',
      fromAddress: '0x123...',
      toAddress: '0x456...',
      blockchain: 'ethereum'
    };

    try {
      const response = await axios.post(`${this.baseURL}/api/ai-moderation/transactions/analyze`, transactionData, {
        headers: this.headers,
        timeout: 10000
      });

      if (response.data.success) {
        const result = response.data.data;
        console.log('✅ Transaction analysis completed');
        console.log(`   Risk Level: ${result.riskLevel}`);
        console.log(`   Blocked: ${result.blocked}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   Recommended Action: ${result.recommendedAction}`);
        return true;
      } else {
        console.log('⚠️ Transaction analysis returned not successful');
        return false;
      }
    } catch (error) {
      console.log('❌ Transaction analysis failed');
      if (error.response?.status === 503) {
        console.log('   Service temporarily unavailable');
      }
      return false;
    }
  }

  async testAIStats() {
    console.log('\n📊 Testing AI moderation statistics...');

    try {
      const response = await axios.get(`${this.baseURL}/api/moderation/ai-stats`, {
        headers: this.headers,
        timeout: 5000
      });

      if (response.data.success) {
        const stats = response.data.data;
        console.log('✅ AI stats retrieved successfully');
        console.log(`   Overall Health: ${stats.overallHealth}`);
        console.log(`   Service Initialized: ${stats.serviceInitialized}`);
        console.log(`   Active Services: ${Object.keys(stats.servicesHealth).length}`);
        return true;
      } else {
        console.log('⚠️ AI stats returned not successful');
        return false;
      }
    } catch (error) {
      console.log('❌ AI stats failed');
      return false;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));

    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;

    console.log(`✅ Successful analyses: ${successful}/${total}`);
    
    if (this.results.length > 0) {
      console.log('\nDetailed Results:');
      this.results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const risk = result.success ? `${result.actualRisk} (expected: ${result.expectedRisk})` : 'failed';
        const confidence = result.success ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A';
        
        console.log(`${status} ${result.name}: ${risk} - Confidence: ${confidence}`);
        
        if (result.flags && result.flags.length > 0) {
          console.log(`   Flags: ${result.flags.join(', ')}`);
        }
        
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        
        if (result.fallback) {
          console.log(`   🔄 Fallback mode used`);
        }
      });
    }

    console.log('\n🎯 Test completion summary:');
    console.log(`   • Health check: Available for validation`);
    console.log(`   • Message analysis: ${successful}/${total} successful`);
    console.log(`   • Batch analysis: Available for testing`);
    console.log(`   • Transaction analysis: Available for testing`);
    console.log(`   • Statistics endpoint: Available for monitoring`);
  }

  async runAllTests() {
    console.log('🚀 Starting AI-powered content moderation tests...\n');

    // Test health check first
    const healthOk = await this.testHealthCheck();
    
    if (!healthOk) {
      console.log('\n⚠️ Health check failed, but continuing with tests (may use fallbacks)...');
    }

    // Test individual message analysis
    for (const testMessage of testMessages) {
      await this.testMessageAnalysis(testMessage);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test batch analysis
    await this.testBatchAnalysis();

    // Test transaction analysis
    await this.testTransactionAnalysis();

    // Test AI stats
    await this.testAIStats();

    // Print summary
    this.printSummary();

    console.log('\n🏁 All tests completed!');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new AIModerationTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = AIModerationTester;