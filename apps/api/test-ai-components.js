#!/usr/bin/env node

/**
 * AI Components Integration Testing Script
 * Tests individual AI/ML components with realistic data
 */

console.log('🧪 AI COMPONENTS INTEGRATION TESTING');
console.log('===================================');

// Test data for different AI components
const testData = {
  safe: [
    "Hello everyone! How is your day going?",
    "Thanks for sharing that helpful tutorial!",
    "Looking forward to the meeting tomorrow.",
    "Great work on the project, team!",
    "Can someone help me with this coding issue?"
  ],
  spam: [
    "FREE MONEY! Click here now! Limited time offer!",
    "URGENT! You've won $1000! Claim now!",
    "Make money from home! Easy cash! No experience needed!",
    "Buy followers! Cheap! Instagram followers for sale!",
    "Crypto giveaway! Double your Bitcoin! Send now!"
  ],
  toxic: [
    "You are such an idiot and I hate you",
    "Kill yourself, nobody wants you here",
    "This is the worst garbage I've ever seen",
    "Shut up you stupid moron",
    "I hope you die in a fire"
  ],
  nsfw: [
    "Check out these sexy photos and adult content",
    "Hot singles in your area want to meet",
    "Explicit adult videos available now",
    "Nude photos and mature content inside",
    "XXX adult entertainment for you"
  ],
  mixed: [
    "This damn project is taking forever but I love the team",
    "WTF is wrong with this code? Need help ASAP!",
    "Shit happens but we keep moving forward",
    "That's fucking awesome work you did there!",
    "Hell yeah! Finally got it working!"
  ]
};

// Simulate AI component functionality
class AIComponentTester {
  constructor() {
    this.results = {
      toxicity: { tested: 0, flagged: 0, accuracy: 0 },
      spam: { tested: 0, flagged: 0, accuracy: 0 },
      nsfw: { tested: 0, flagged: 0, accuracy: 0 },
      sentiment: { tested: 0, positive: 0, negative: 0, neutral: 0 },
      overall: { processed: 0, errors: 0, avgProcessingTime: 0 }
    };
    this.processingTimes = [];
  }

  // Simulate toxicity detection
  detectToxicity(content) {
    const startTime = Date.now();
    
    const toxicPatterns = [
      /\b(kill|murder|die|death|suicide)\b/gi,
      /\b(hate|stupid|idiot|moron|retard|dumb)\b/gi,
      /\b(shut up|fuck you|damn you|go to hell)\b/gi,
      /\b(worst|garbage|trash|suck|terrible)\b/gi
    ];

    let toxicityScore = 0;
    const flags = [];

    toxicPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        toxicityScore += matches.length * (0.3 + index * 0.1);
        flags.push(`pattern_${index + 1}`);
      }
    });

    const processingTime = Date.now() - startTime;
    this.processingTimes.push(processingTime);

    return {
      flagged: toxicityScore > 0.5,
      score: Math.min(toxicityScore, 1),
      confidence: toxicityScore > 0 ? 0.8 : 0.9,
      flags,
      processingTime
    };
  }

  // Simulate spam detection
  detectSpam(content) {
    const startTime = Date.now();
    
    const spamPatterns = [
      /\b(free|win|winner|congratulations|claim|prize)\b/gi,
      /\b(money|cash|dollars|bitcoin|crypto|giveaway)\b/gi,
      /\b(click here|visit now|limited time|urgent|act now)\b/gi,
      /\b(buy|sell|cheap|discount|offer|deal)\b/gi,
      /(.)\1{3,}/gi // Repeated characters
    ];

    let spamScore = 0;
    const indicators = [];

    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) {
      spamScore += 0.4;
      indicators.push('excessive_caps');
    }

    // Check spam patterns
    spamPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        spamScore += 0.3;
        indicators.push(`spam_pattern_${index + 1}`);
      }
    });

    // Check for excessive punctuation
    const punctRatio = (content.match(/[!?]{2,}/g) || []).length;
    if (punctRatio > 0) {
      spamScore += 0.2;
      indicators.push('excessive_punctuation');
    }

    const processingTime = Date.now() - startTime;
    this.processingTimes.push(processingTime);

    return {
      isSpam: spamScore > 0.6,
      score: Math.min(spamScore, 1),
      confidence: spamScore > 0.3 ? 0.85 : 0.9,
      indicators,
      processingTime
    };
  }

  // Simulate NSFW detection
  detectNSFW(content) {
    const startTime = Date.now();
    
    const nsfwPatterns = [
      /\b(sex|adult|explicit|mature|xxx)\b/gi,
      /\b(nude|naked|sexy|hot|porn|erotic)\b/gi,
      /\b(singles|dating|hookup|meet)\b/gi,
      /\b(dick|cock|pussy|tits|ass|boobs)\b/gi
    ];

    let nsfwScore = 0;
    const categories = [];

    nsfwPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        nsfwScore += 0.4;
        categories.push(`category_${index + 1}`);
      }
    });

    const processingTime = Date.now() - startTime;
    this.processingTimes.push(processingTime);

    return {
      isNSFW: nsfwScore > 0.6,
      score: Math.min(nsfwScore, 1),
      confidence: nsfwScore > 0.2 ? 0.8 : 0.95,
      categories,
      processingTime
    };
  }

  // Simulate sentiment analysis
  analyzeSentiment(content) {
    const startTime = Date.now();
    
    const positiveWords = [
      'good', 'great', 'awesome', 'excellent', 'amazing', 'wonderful',
      'love', 'like', 'happy', 'pleased', 'satisfied', 'fantastic',
      'perfect', 'brilliant', 'outstanding', 'superb', 'thanks', 'grateful'
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate',
      'dislike', 'angry', 'frustrated', 'disappointed', 'annoyed',
      'worst', 'pathetic', 'useless', 'garbage', 'trash', 'suck'
    ];

    const words = content.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const score = positiveCount - negativeCount;
    let classification = 'neutral';
    
    if (score > 1) classification = 'positive';
    else if (score > 2) classification = 'very_positive';
    else if (score < -1) classification = 'negative';
    else if (score < -2) classification = 'very_negative';

    const processingTime = Date.now() - startTime;
    this.processingTimes.push(processingTime);

    return {
      score,
      comparative: score / Math.max(words.length, 1),
      classification,
      confidence: Math.min(Math.abs(score) * 0.3 + 0.5, 1),
      positiveWords: positiveCount,
      negativeWords: negativeCount,
      processingTime
    };
  }

  // Test all components with test data
  async runAllTests() {
    console.log('🔬 Testing Toxicity Detection...');
    await this.testToxicityDetection();
    
    console.log('\n🔬 Testing Spam Detection...');
    await this.testSpamDetection();
    
    console.log('\n🔬 Testing NSFW Detection...');
    await this.testNSFWDetection();
    
    console.log('\n🔬 Testing Sentiment Analysis...');
    await this.testSentimentAnalysis();
    
    console.log('\n📊 Generating Performance Report...');
    this.generatePerformanceReport();
  }

  async testToxicityDetection() {
    const allTestData = [...testData.safe, ...testData.toxic, ...testData.mixed];
    let correctPredictions = 0;
    let totalTests = 0;

    for (const [category, messages] of Object.entries(testData)) {
      if (category === 'mixed') continue; // Skip mixed for accuracy calculation
      
      for (const message of messages) {
        const result = this.detectToxicity(message);
        totalTests++;
        this.results.toxicity.tested++;

        if (result.flagged) {
          this.results.toxicity.flagged++;
        }

        // Check accuracy (safe should not be flagged, toxic should be flagged)
        const shouldBeFlagged = category === 'toxic';
        if (result.flagged === shouldBeFlagged) {
          correctPredictions++;
        }

        console.log(`  ${result.flagged ? '🔴' : '🟢'} "${message.substring(0, 50)}..." - Score: ${result.score.toFixed(2)} (${result.processingTime}ms)`);
      }
    }

    this.results.toxicity.accuracy = Math.round((correctPredictions / totalTests) * 100);
    console.log(`\n  📈 Toxicity Detection Accuracy: ${this.results.toxicity.accuracy}%`);
    console.log(`  📊 Flagged: ${this.results.toxicity.flagged}/${this.results.toxicity.tested} messages`);
  }

  async testSpamDetection() {
    const allTestData = [...testData.safe, ...testData.spam];
    let correctPredictions = 0;
    let totalTests = 0;

    for (const [category, messages] of Object.entries(testData)) {
      if (!['safe', 'spam'].includes(category)) continue;
      
      for (const message of messages) {
        const result = this.detectSpam(message);
        totalTests++;
        this.results.spam.tested++;

        if (result.isSpam) {
          this.results.spam.flagged++;
        }

        // Check accuracy
        const shouldBeSpam = category === 'spam';
        if (result.isSpam === shouldBeSpam) {
          correctPredictions++;
        }

        console.log(`  ${result.isSpam ? '🔴' : '🟢'} "${message.substring(0, 50)}..." - Score: ${result.score.toFixed(2)} (${result.processingTime}ms)`);
      }
    }

    this.results.spam.accuracy = Math.round((correctPredictions / totalTests) * 100);
    console.log(`\n  📈 Spam Detection Accuracy: ${this.results.spam.accuracy}%`);
    console.log(`  📊 Flagged as Spam: ${this.results.spam.flagged}/${this.results.spam.tested} messages`);
  }

  async testNSFWDetection() {
    const allTestData = [...testData.safe, ...testData.nsfw];
    let correctPredictions = 0;
    let totalTests = 0;

    for (const [category, messages] of Object.entries(testData)) {
      if (!['safe', 'nsfw'].includes(category)) continue;
      
      for (const message of messages) {
        const result = this.detectNSFW(message);
        totalTests++;
        this.results.nsfw.tested++;

        if (result.isNSFW) {
          this.results.nsfw.flagged++;
        }

        // Check accuracy
        const shouldBeNSFW = category === 'nsfw';
        if (result.isNSFW === shouldBeNSFW) {
          correctPredictions++;
        }

        console.log(`  ${result.isNSFW ? '🔴' : '🟢'} "${message.substring(0, 50)}..." - Score: ${result.score.toFixed(2)} (${result.processingTime}ms)`);
      }
    }

    this.results.nsfw.accuracy = Math.round((correctPredictions / totalTests) * 100);
    console.log(`\n  📈 NSFW Detection Accuracy: ${this.results.nsfw.accuracy}%`);
    console.log(`  📊 Flagged as NSFW: ${this.results.nsfw.flagged}/${this.results.nsfw.tested} messages`);
  }

  async testSentimentAnalysis() {
    for (const [category, messages] of Object.entries(testData)) {
      console.log(`\n  Testing ${category} messages:`);
      
      for (const message of messages) {
        const result = this.analyzeSentiment(message);
        this.results.sentiment.tested++;

        if (result.classification.includes('positive')) {
          this.results.sentiment.positive++;
        } else if (result.classification.includes('negative')) {
          this.results.sentiment.negative++;
        } else {
          this.results.sentiment.neutral++;
        }

        const emoji = result.classification.includes('positive') ? '😊' : 
                     result.classification.includes('negative') ? '😢' : '😐';
        
        console.log(`  ${emoji} "${message.substring(0, 50)}..." - ${result.classification} (${result.score >= 0 ? '+' : ''}${result.score}) (${result.processingTime}ms)`);
      }
    }

    console.log(`\n  📈 Sentiment Distribution:`);
    console.log(`    Positive: ${this.results.sentiment.positive}/${this.results.sentiment.tested} (${Math.round((this.results.sentiment.positive/this.results.sentiment.tested)*100)}%)`);
    console.log(`    Negative: ${this.results.sentiment.negative}/${this.results.sentiment.tested} (${Math.round((this.results.sentiment.negative/this.results.sentiment.tested)*100)}%)`);
    console.log(`    Neutral: ${this.results.sentiment.neutral}/${this.results.sentiment.tested} (${Math.round((this.results.sentiment.neutral/this.results.sentiment.tested)*100)}%)`);
  }

  generatePerformanceReport() {
    this.results.overall.processed = this.results.toxicity.tested + this.results.spam.tested + this.results.nsfw.tested + this.results.sentiment.tested;
    
    if (this.processingTimes.length > 0) {
      this.results.overall.avgProcessingTime = this.processingTimes.reduce((a, b) => a + b) / this.processingTimes.length;
    }

    const overallAccuracy = Math.round((this.results.toxicity.accuracy + this.results.spam.accuracy + this.results.nsfw.accuracy) / 3);

    console.log('\n📊 PERFORMANCE SUMMARY');
    console.log('=====================');
    console.log(`Total Messages Processed: ${this.results.overall.processed}`);
    console.log(`Average Processing Time: ${this.results.overall.avgProcessingTime.toFixed(2)}ms`);
    console.log(`Overall Detection Accuracy: ${overallAccuracy}%`);
    console.log(`\nDetailed Results:`);
    console.log(`  🛡️  Toxicity Detection: ${this.results.toxicity.accuracy}% accuracy (${this.results.toxicity.flagged}/${this.results.toxicity.tested} flagged)`);
    console.log(`  🚫 Spam Detection: ${this.results.spam.accuracy}% accuracy (${this.results.spam.flagged}/${this.results.spam.tested} flagged)`);
    console.log(`  🔞 NSFW Detection: ${this.results.nsfw.accuracy}% accuracy (${this.results.nsfw.flagged}/${this.results.nsfw.tested} flagged)`);
    console.log(`  💭 Sentiment Analysis: ${this.results.sentiment.tested} messages analyzed`);

    // Performance assessment
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:');
    
    if (overallAccuracy >= 85 && this.results.overall.avgProcessingTime < 100) {
      console.log('✅ EXCELLENT: Ready for production deployment');
    } else if (overallAccuracy >= 75 && this.results.overall.avgProcessingTime < 200) {
      console.log('⚠️  GOOD: Ready with monitoring and tuning');
    } else if (overallAccuracy >= 65) {
      console.log('⚠️  FAIR: Needs improvement before production');
    } else {
      console.log('❌ POOR: Significant improvements needed');
    }

    // Performance recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.results.toxicity.accuracy < 80) {
      console.log('  • Improve toxicity detection patterns and thresholds');
    }
    if (this.results.spam.accuracy < 80) {
      console.log('  • Enhance spam detection with more sophisticated algorithms');
    }
    if (this.results.nsfw.accuracy < 80) {
      console.log('  • Refine NSFW content detection rules');
    }
    if (this.results.overall.avgProcessingTime > 100) {
      console.log('  • Optimize processing performance for real-time use');
    }
    
    console.log('  • Consider implementing machine learning models for better accuracy');
    console.log('  • Add user feedback loops to improve detection over time');
    console.log('  • Implement A/B testing for different algorithm configurations');
  }
}

// Run the tests
const tester = new AIComponentTester();
tester.runAllTests().catch(error => {
  console.error('❌ Testing failed:', error);
  process.exit(1);
});