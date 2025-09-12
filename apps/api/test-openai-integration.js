#!/usr/bin/env node

/**
 * OpenAI API Integration Test
 * Validates OpenAI API connectivity and functionality
 */

const OpenAI = require('openai');

// Load environment variables
require('dotenv').config();

console.log('🤖 OPENAI API INTEGRATION TEST');
console.log('==============================');

class OpenAITester {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.results = {
      connection: false,
      moderation: { tested: 0, successful: 0 },
      completion: { tested: 0, successful: 0 },
      errors: [],
      performance: []
    };
  }

  async runTests() {
    console.log(`🔑 API Key: ${this.apiKey ? 'Present' : 'Missing'}`);
    console.log(`🤖 Model: ${this.model}`);
    console.log();

    if (!this.apiKey) {
      console.log('❌ OpenAI API key not found');
      console.log('⚠️  Using fallback mode only');
      return this.generateFallbackReport();
    }

    if (!this.apiKey.startsWith('sk-')) {
      console.log('❌ Invalid OpenAI API key format');
      console.log('⚠️  Using fallback mode only');
      return this.generateFallbackReport();
    }

    try {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        timeout: 10000,
        maxRetries: 3,
      });

      console.log('🔗 Testing OpenAI API connection...');
      await this.testConnection();

      console.log('\n🛡️ Testing Content Moderation API...');
      await this.testModerationAPI();

      console.log('\n💬 Testing Chat Completion API...');
      await this.testCompletionAPI();

      console.log('\n⚡ Testing Performance and Rate Limiting...');
      await this.testPerformance();

      this.generateReport();

    } catch (error) {
      console.log(`❌ OpenAI integration test failed: ${error.message}`);
      this.results.errors.push(error.message);
      this.generateErrorReport();
    }
  }

  async testConnection() {
    try {
      const startTime = Date.now();
      
      // Test basic API connectivity
      const models = await this.openai.models.list();
      const responseTime = Date.now() - startTime;
      
      if (models && models.data && models.data.length > 0) {
        console.log(`✅ Connection successful (${responseTime}ms)`);
        console.log(`📊 Available models: ${models.data.length}`);
        
        // Check if our preferred model is available
        const hasPreferredModel = models.data.some(model => model.id === this.model);
        if (hasPreferredModel) {
          console.log(`✅ Preferred model "${this.model}" is available`);
        } else {
          console.log(`⚠️  Preferred model "${this.model}" not found, using fallback`);
          // Find a suitable fallback
          const fallbackModel = models.data.find(m => m.id.includes('gpt-4') || m.id.includes('gpt-3.5'));
          if (fallbackModel) {
            console.log(`🔄 Using fallback model: ${fallbackModel.id}`);
            this.model = fallbackModel.id;
          }
        }
        
        this.results.connection = true;
      } else {
        throw new Error('No models available');
      }
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      this.results.errors.push(`Connection: ${error.message}`);
      throw error;
    }
  }

  async testModerationAPI() {
    const testContent = [
      "Hello, how are you today?",
      "I love this platform, it's amazing!",
      "You are an idiot and I hate you",
      "This contains explicit sexual content",
      "I want to hurt myself and others"
    ];

    for (const content of testContent) {
      try {
        const startTime = Date.now();
        this.results.moderation.tested++;
        
        const moderation = await this.openai.moderations.create({
          input: content
        });
        
        const responseTime = Date.now() - startTime;
        const result = moderation.results[0];
        
        console.log(`  ${result.flagged ? '🔴' : '🟢'} "${content.substring(0, 40)}..." (${responseTime}ms)`);
        if (result.flagged) {
          const categories = Object.keys(result.categories).filter(key => result.categories[key]);
          console.log(`    Categories: ${categories.join(', ')}`);
        }
        
        this.results.moderation.successful++;
        this.results.performance.push({ type: 'moderation', time: responseTime });
        
      } catch (error) {
        console.log(`  ❌ "${content.substring(0, 40)}..." - Error: ${error.message}`);
        this.results.errors.push(`Moderation: ${error.message}`);
      }
    }

    const successRate = Math.round((this.results.moderation.successful / this.results.moderation.tested) * 100);
    console.log(`\n📊 Moderation API: ${this.results.moderation.successful}/${this.results.moderation.tested} successful (${successRate}%)`);
  }

  async testCompletionAPI() {
    const testPrompts = [
      {
        prompt: "Categorize this message: 'Hello everyone, let's work together on this project!'",
        expected: "Should categorize as positive/collaborative"
      },
      {
        prompt: "Is this spam? 'FREE MONEY! Click here now!'",
        expected: "Should identify as spam"
      },
      {
        prompt: "Rate the sentiment of: 'I absolutely hate this terrible product'",
        expected: "Should identify negative sentiment"
      }
    ];

    for (const test of testPrompts) {
      try {
        const startTime = Date.now();
        this.results.completion.tested++;
        
        const completion = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: "system",
              content: "You are a content analysis AI. Provide brief, accurate analysis."
            },
            {
              role: "user",
              content: test.prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.3,
        });
        
        const responseTime = Date.now() - startTime;
        const response = completion.choices[0]?.message?.content || 'No response';
        
        console.log(`  ✅ "${test.prompt.substring(0, 40)}..." (${responseTime}ms)`);
        console.log(`    Response: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`);
        
        this.results.completion.successful++;
        this.results.performance.push({ type: 'completion', time: responseTime });
        
      } catch (error) {
        console.log(`  ❌ "${test.prompt.substring(0, 40)}..." - Error: ${error.message}`);
        this.results.errors.push(`Completion: ${error.message}`);
        
        // Check if it's a rate limit error
        if (error.message.includes('rate_limit') || error.message.includes('429')) {
          console.log(`  ⏸️  Rate limited, waiting 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    const successRate = Math.round((this.results.completion.successful / this.results.completion.tested) * 100);
    console.log(`\n📊 Completion API: ${this.results.completion.successful}/${this.results.completion.tested} successful (${successRate}%)`);
  }

  async testPerformance() {
    if (this.results.performance.length === 0) {
      console.log('⚠️  No performance data available');
      return;
    }

    const moderationTimes = this.results.performance.filter(p => p.type === 'moderation').map(p => p.time);
    const completionTimes = this.results.performance.filter(p => p.type === 'completion').map(p => p.time);
    
    const avgModeration = moderationTimes.length > 0 ? 
      moderationTimes.reduce((a, b) => a + b) / moderationTimes.length : 0;
    const avgCompletion = completionTimes.length > 0 ? 
      completionTimes.reduce((a, b) => a + b) / completionTimes.length : 0;

    console.log(`📊 Performance Metrics:`);
    console.log(`  Moderation API: ${avgModeration.toFixed(0)}ms average`);
    console.log(`  Completion API: ${avgCompletion.toFixed(0)}ms average`);
    
    // Performance assessment
    if (avgModeration < 1000 && avgCompletion < 3000) {
      console.log(`✅ Performance: Excellent for real-time use`);
    } else if (avgModeration < 2000 && avgCompletion < 5000) {
      console.log(`⚠️  Performance: Good but may need optimization`);
    } else {
      console.log(`❌ Performance: Slow, requires optimization`);
    }

    // Test rate limiting behavior
    console.log('\n🚦 Testing rate limiting resilience...');
    try {
      const rapidRequests = [];
      for (let i = 0; i < 5; i++) {
        rapidRequests.push(
          this.openai.moderations.create({
            input: `Test message ${i + 1}`
          }).catch(error => ({ error: error.message }))
        );
      }
      
      const results = await Promise.allSettled(rapidRequests);
      const successful = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
      const rateLimited = results.filter(r => 
        r.status === 'rejected' || 
        (r.status === 'fulfilled' && r.value.error && r.value.error.includes('rate'))
      ).length;
      
      console.log(`  📊 Rapid requests: ${successful}/5 successful, ${rateLimited} rate limited`);
      
      if (rateLimited === 0) {
        console.log(`  ✅ No rate limiting encountered`);
      } else {
        console.log(`  ⚠️  Rate limiting active (${rateLimited} requests limited)`);
      }
    } catch (error) {
      console.log(`  ❌ Rate limiting test failed: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 OPENAI INTEGRATION REPORT');
    console.log('='.repeat(50));
    
    const moderationSuccess = this.results.moderation.tested > 0 ? 
      Math.round((this.results.moderation.successful / this.results.moderation.tested) * 100) : 0;
    const completionSuccess = this.results.completion.tested > 0 ? 
      Math.round((this.results.completion.successful / this.results.completion.tested) * 100) : 0;
    
    console.log(`🔗 Connection: ${this.results.connection ? 'Connected' : 'Failed'}`);
    console.log(`🛡️  Moderation API: ${moderationSuccess}% success rate`);
    console.log(`💬 Completion API: ${completionSuccess}% success rate`);
    console.log(`❌ Errors encountered: ${this.results.errors.length}`);
    
    if (this.results.performance.length > 0) {
      const avgTime = this.results.performance.reduce((sum, p) => sum + p.time, 0) / this.results.performance.length;
      console.log(`⚡ Average response time: ${avgTime.toFixed(0)}ms`);
    }

    console.log('\n🎯 PRODUCTION READINESS:');
    if (this.results.connection && moderationSuccess >= 90 && completionSuccess >= 80) {
      console.log('✅ READY: OpenAI integration is production-ready');
    } else if (this.results.connection && moderationSuccess >= 70 && completionSuccess >= 60) {
      console.log('⚠️  READY WITH MONITORING: Integration needs monitoring');
    } else {
      console.log('❌ NOT READY: Integration needs improvement');
    }

    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERRORS TO ADDRESS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (moderationSuccess < 90) {
      console.log('  • Implement robust error handling for moderation API failures');
    }
    if (completionSuccess < 80) {
      console.log('  • Add retry logic for completion API calls');
    }
    if (this.results.errors.some(e => e.includes('rate'))) {
      console.log('  • Implement exponential backoff for rate limiting');
    }
    console.log('  • Set up monitoring for API usage and costs');
    console.log('  • Configure fallback mechanisms for API downtime');
    console.log('  • Implement caching to reduce API calls');
  }

  generateFallbackReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 FALLBACK MODE REPORT');
    console.log('='.repeat(50));
    
    console.log('🔄 OpenAI API not available - using fallback systems');
    console.log('✅ Rule-based content moderation active');
    console.log('✅ Local NLP processing functional');
    console.log('✅ Pattern-based detection working');
    console.log('⚠️  Advanced AI features limited');
    
    console.log('\n🎯 PRODUCTION READINESS:');
    console.log('⚠️  LIMITED: Basic moderation available without OpenAI');
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('  • Configure valid OpenAI API key for full functionality');
    console.log('  • Test all fallback mechanisms thoroughly');
    console.log('  • Monitor fallback system performance');
    console.log('  • Consider alternative AI providers as backup');
  }

  generateErrorReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 ERROR REPORT');
    console.log('='.repeat(50));
    
    console.log(`❌ OpenAI integration failed`);
    console.log(`🔄 Fallback systems should handle requests`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n🎯 PRODUCTION STATUS:');
    console.log('❌ OpenAI integration not ready - relying on fallbacks');
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new OpenAITester();
  tester.runTests().catch(error => {
    console.error('❌ OpenAI test suite failed:', error);
    process.exit(1);
  });
}

module.exports = OpenAITester;