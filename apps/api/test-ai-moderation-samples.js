#!/usr/bin/env node

const OpenAI = require('openai');
const natural = require('natural');

console.log('🧪 AI MODERATION CONTENT SAMPLE TESTING');
console.log('=======================================');

class ContentModerationTester {
    constructor() {
        this.classifier = new natural.BayesClassifier();
        this.sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        this.results = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            falsePositives: 0,
            falseNegatives: 0,
            testResults: []
        };
        
        this.initializeClassifier();
    }

    initializeClassifier() {
        // Basic training data
        const trainingData = [
            { text: 'free money click here now', label: 'spam' },
            { text: 'congratulations you won million dollars', label: 'spam' },
            { text: 'hey how are you doing today', label: 'legitimate' },
            { text: 'can someone help me with this code', label: 'legitimate' },
            { text: 'crypto giveaway double your bitcoin', label: 'spam' },
            { text: 'great discussion thanks for sharing', label: 'legitimate' }
        ];

        trainingData.forEach(item => {
            this.classifier.addDocument(item.text, item.label);
        });
        
        this.classifier.train();
        console.log('✅ ML classifier trained with sample data\n');
    }

    async runContentTests() {
        console.log('📋 Testing with Real Content Samples...\n');
        
        // Test cases with expected outcomes
        const testCases = [
            // Safe content
            {
                content: "Hello everyone! Hope you're having a great day. Let's discuss the new project updates.",
                type: 'safe',
                expected: { toxic: false, spam: false, nsfw: false },
                category: 'Normal conversation'
            },
            {
                content: "Check out this cool GitHub repo: https://github.com/microsoft/typescript",
                type: 'safe',
                expected: { toxic: false, spam: false, nsfw: false },
                category: 'Legitimate link sharing'
            },
            {
                content: "Thanks for the help! Really appreciate the detailed explanation.",
                type: 'safe',
                expected: { toxic: false, spam: false, nsfw: false },
                category: 'Gratitude expression'
            },

            // Toxic content
            {
                content: "I hate everyone in this stupid server, you're all idiots and should die",
                type: 'toxic',
                expected: { toxic: true, spam: false, nsfw: false },
                category: 'Hate speech and threats'
            },
            {
                content: "Kill yourself, nobody wants you here",
                type: 'toxic',
                expected: { toxic: true, spam: false, nsfw: false },
                category: 'Self-harm encouragement'
            },
            {
                content: "You're such a f***ing loser, get out of here",
                type: 'toxic',
                expected: { toxic: true, spam: false, nsfw: false },
                category: 'Harassment with profanity'
            },

            // Spam content
            {
                content: "🚀🚀🚀 FREE MONEY GIVEAWAY!!! Click here NOW to claim your $10,000 prize!!! Limited time offer!!! 💰💰💰",
                type: 'spam',
                expected: { toxic: false, spam: true, nsfw: false },
                category: 'Money scam spam'
            },
            {
                content: "CRYPTO AIRDROP!!! Double your Bitcoin instantly! Send 1 BTC get 2 BTC back guaranteed! bit.ly/scamlink",
                type: 'spam',
                expected: { toxic: false, spam: true, nsfw: false },
                category: 'Crypto scam'
            },
            {
                content: "BUY VIAGRA ONLINE CHEAP CHEAP CHEAP!!! NO PRESCRIPTION NEEDED!!! CLICK HERE NOW!!!",
                type: 'spam',
                expected: { toxic: false, spam: true, nsfw: true },
                category: 'Pharmaceutical spam'
            },

            // NSFW content
            {
                content: "Check out these nude photos of celebrities at adultsite.xxx/gallery",
                type: 'nsfw',
                expected: { toxic: false, spam: false, nsfw: true },
                category: 'Adult content link'
            },
            {
                content: "Hot sexy girls want to chat with you! Click here for adult dating!",
                type: 'nsfw',
                expected: { toxic: false, spam: true, nsfw: true },
                category: 'Adult dating spam'
            },
            {
                content: "Looking for some fun tonight? Meet singles in your area for adult activities.",
                type: 'nsfw',
                expected: { toxic: false, spam: false, nsfw: true },
                category: 'Suggestive content'
            },

            // Borderline cases (challenging)
            {
                content: "This game is so frustrating, I want to kill the boss character",
                type: 'borderline',
                expected: { toxic: false, spam: false, nsfw: false },
                category: 'Gaming context violence'
            },
            {
                content: "Join our investment group for amazing returns! Message me for details.",
                type: 'borderline',
                expected: { toxic: false, spam: true, nsfw: false },
                category: 'Investment solicitation'
            },
            {
                content: "That movie was really intense with all the violence and adult themes",
                type: 'borderline',
                expected: { toxic: false, spam: false, nsfw: false },
                category: 'Content discussion'
            },

            // Mixed content
            {
                content: "You idiots keep falling for these crypto scams! FREE BITCOIN = SCAM!",
                type: 'mixed',
                expected: { toxic: true, spam: false, nsfw: false },
                category: 'Toxic but educational'
            }
        ];

        console.log(`🧪 Running ${testCases.length} test cases...\n`);

        for (const testCase of testCases) {
            await this.runSingleTest(testCase);
        }

        this.generateTestReport();
    }

    async runSingleTest(testCase) {
        const startTime = Date.now();
        
        console.log(`📝 Testing: ${testCase.category}`);
        console.log(`   Content: "${testCase.content.substring(0, 80)}${testCase.content.length > 80 ? '...' : ''}"`);
        
        const result = await this.analyzeContent(testCase.content);
        const processingTime = Date.now() - startTime;
        
        // Compare with expected results
        const accuracy = this.calculateAccuracy(result, testCase.expected);
        const passed = accuracy >= 0.67; // Pass if at least 2/3 checks are correct
        
        console.log(`   Result: ${passed ? '✅ PASS' : '❌ FAIL'} (${(accuracy * 100).toFixed(1)}% accurate, ${processingTime}ms)`);
        console.log(`   Toxic: ${result.toxic ? '🔴' : '🟢'} | Spam: ${result.spam ? '🔴' : '🟢'} | NSFW: ${result.nsfw ? '🔴' : '🟢'}`);
        
        if (!passed) {
            console.log(`   Expected: Toxic: ${testCase.expected.toxic ? '🔴' : '🟢'} | Spam: ${testCase.expected.spam ? '🔴' : '🟢'} | NSFW: ${testCase.expected.nsfw ? '🔴' : '🟢'}`);
        }
        
        console.log(`   Risk Score: ${(result.confidence * 100).toFixed(1)}%\n`);

        // Track results
        this.results.totalTests++;
        if (passed) {
            this.results.passedTests++;
        } else {
            this.results.failedTests++;
            
            // Track false positives/negatives
            if (testCase.type === 'safe' && (result.toxic || result.spam || result.nsfw)) {
                this.results.falsePositives++;
            } else if (testCase.type !== 'safe' && !result.toxic && !result.spam && !result.nsfw) {
                this.results.falseNegatives++;
            }
        }

        this.results.testResults.push({
            category: testCase.category,
            content: testCase.content.substring(0, 100),
            expected: testCase.expected,
            actual: result,
            accuracy,
            passed,
            processingTime
        });
    }

    async analyzeContent(content) {
        const result = {
            toxic: false,
            spam: false,
            nsfw: false,
            confidence: 0,
            details: {
                toxicityScore: 0,
                spamScore: 0,
                nsfwScore: 0,
                sentimentScore: 0,
                flags: []
            }
        };

        // Toxicity detection using keyword patterns
        const toxicPatterns = [
            /\b(kill|murder|die|suicide|death)\b/gi,
            /\b(hate|racist|nazi|terrorist|bomb)\b/gi,
            /\b(stupid|idiot|loser|moron|retard)\b/gi,
            /\b(f\*\*k|sh\*t|damn|b\*tch|ass)\b/gi
        ];

        let toxicScore = 0;
        for (const pattern of toxicPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                toxicScore += matches.length * 0.3;
                result.details.flags.push(`Toxic pattern: ${matches[0]}`);
            }
        }

        // Spam detection
        const spamPatterns = [
            /\b(free|win|winner|congratulations|prize)\b/gi,
            /\b(click here|visit now|limited time|act now)\b/gi,
            /\b(money|cash|dollars|bitcoin|crypto giveaway)\b/gi,
            /(.)\1{5,}/gi, // Excessive repetition
            /[🚀💰🔥💎]{3,}/gi // Excessive emojis
        ];

        let spamScore = 0;
        for (const pattern of spamPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                spamScore += matches.length * 0.25;
                result.details.flags.push(`Spam pattern detected`);
            }
        }

        // NSFW detection
        const nsfwPatterns = [
            /\b(porn|xxx|adult|nsfw|nude|naked|sex)\b/gi,
            /\b(viagra|dating|singles|hot girls|sexy)\b/gi,
            /\.(xxx|porn|adult)/gi
        ];

        let nsfwScore = 0;
        for (const pattern of nsfwPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                nsfwScore += matches.length * 0.4;
                result.details.flags.push(`NSFW content detected`);
            }
        }

        // ML-based classification
        try {
            const classification = this.classifier.classify(content);
            if (classification === 'spam') {
                spamScore += 0.3;
                result.details.flags.push('ML classified as spam');
            }
        } catch (error) {
            // Continue without ML classification
        }

        // Sentiment analysis
        try {
            const tokens = natural.WordTokenizer.tokenize(content.toLowerCase());
            const stemmedTokens = tokens.map(token => natural.PorterStemmer.stem(token));
            const sentimentScore = this.sentiment.getSentiment(stemmedTokens);
            result.details.sentimentScore = sentimentScore;
            
            if (sentimentScore < -0.5) {
                toxicScore += 0.2;
                result.details.flags.push('Very negative sentiment');
            }
        } catch (error) {
            // Continue without sentiment analysis
        }

        // Set final results
        result.details.toxicityScore = Math.min(toxicScore, 1.0);
        result.details.spamScore = Math.min(spamScore, 1.0);
        result.details.nsfwScore = Math.min(nsfwScore, 1.0);

        result.toxic = result.details.toxicityScore > 0.6;
        result.spam = result.details.spamScore > 0.5;
        result.nsfw = result.details.nsfwScore > 0.4;

        // Overall confidence
        const maxScore = Math.max(
            result.details.toxicityScore,
            result.details.spamScore,
            result.details.nsfwScore
        );
        result.confidence = maxScore;

        return result;
    }

    calculateAccuracy(result, expected) {
        let correctPredictions = 0;
        let totalPredictions = 3;

        if (result.toxic === expected.toxic) correctPredictions++;
        if (result.spam === expected.spam) correctPredictions++;
        if (result.nsfw === expected.nsfw) correctPredictions++;

        return correctPredictions / totalPredictions;
    }

    generateTestReport() {
        console.log('📊 AI MODERATION TEST RESULTS');
        console.log('=============================\n');

        const accuracy = (this.results.passedTests / this.results.totalTests) * 100;
        const falsePositiveRate = (this.results.falsePositives / this.results.totalTests) * 100;
        const falseNegativeRate = (this.results.falseNegatives / this.results.totalTests) * 100;

        console.log(`🎯 Overall Accuracy: ${accuracy.toFixed(1)}%`);
        console.log(`✅ Tests Passed: ${this.results.passedTests}/${this.results.totalTests}`);
        console.log(`❌ Tests Failed: ${this.results.failedTests}/${this.results.totalTests}`);
        console.log(`🟡 False Positives: ${this.results.falsePositives} (${falsePositiveRate.toFixed(1)}%)`);
        console.log(`🔴 False Negatives: ${this.results.falseNegatives} (${falseNegativeRate.toFixed(1)}%)\n`);

        // Performance metrics
        const avgProcessingTime = this.results.testResults.reduce((sum, result) => sum + result.processingTime, 0) / this.results.testResults.length;
        console.log(`⚡ Average Processing Time: ${avgProcessingTime.toFixed(0)}ms\n`);

        // Category breakdown
        console.log('📋 Results by Category:');
        const categoryResults = {};
        this.results.testResults.forEach(result => {
            if (!categoryResults[result.category]) {
                categoryResults[result.category] = { passed: 0, total: 0 };
            }
            categoryResults[result.category].total++;
            if (result.passed) {
                categoryResults[result.category].passed++;
            }
        });

        for (const [category, stats] of Object.entries(categoryResults)) {
            const categoryAccuracy = (stats.passed / stats.total) * 100;
            console.log(`   ${stats.passed === stats.total ? '✅' : stats.passed === 0 ? '❌' : '⚠️'} ${category}: ${stats.passed}/${stats.total} (${categoryAccuracy.toFixed(1)}%)`);
        }

        console.log('\n🔍 Failed Test Cases:');
        const failedTests = this.results.testResults.filter(r => !r.passed);
        if (failedTests.length === 0) {
            console.log('   None! 🎉');
        } else {
            failedTests.forEach(test => {
                console.log(`   ❌ ${test.category}: ${(test.accuracy * 100).toFixed(1)}% accuracy`);
                console.log(`      Content: "${test.content}"`);
            });
        }

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (accuracy >= 90) {
            console.log('✅ Excellent performance! System is production-ready.');
        } else if (accuracy >= 80) {
            console.log('⚠️ Good performance, but could use some tuning.');
            if (falsePositiveRate > 10) {
                console.log('   - Reduce false positive rate by adjusting thresholds');
            }
            if (falseNegativeRate > 10) {
                console.log('   - Improve detection patterns to catch more violations');
            }
        } else if (accuracy >= 70) {
            console.log('🟡 Acceptable performance for MVP, needs improvement.');
            console.log('   - Review and improve detection patterns');
            console.log('   - Add more training data for ML classifiers');
            console.log('   - Consider integrating external AI services');
        } else {
            console.log('🔴 Performance below acceptable threshold.');
            console.log('   - Major improvements needed before production use');
            console.log('   - Consider professional moderation service integration');
        }

        if (avgProcessingTime > 1000) {
            console.log('   - Optimize processing speed (currently too slow)');
        }

        // App Store readiness
        console.log('\n🏪 APP STORE READINESS:');
        const isReady = accuracy >= 70 && falsePositiveRate < 20 && avgProcessingTime < 2000;
        console.log(`${isReady ? '✅ READY' : '❌ NOT READY'} for App Store submission`);
        
        if (!isReady) {
            console.log('Requirements:');
            console.log(`   - Accuracy ≥70%: ${accuracy >= 70 ? '✅' : '❌'} (${accuracy.toFixed(1)}%)`);
            console.log(`   - False positive rate <20%: ${falsePositiveRate < 20 ? '✅' : '❌'} (${falsePositiveRate.toFixed(1)}%)`);
            console.log(`   - Processing time <2s: ${avgProcessingTime < 2000 ? '✅' : '❌'} (${avgProcessingTime.toFixed(0)}ms)`);
        }

        // Save results
        const fs = require('fs');
        fs.writeFileSync('ai-moderation-test-results.json', JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                accuracy: accuracy,
                passedTests: this.results.passedTests,
                totalTests: this.results.totalTests,
                falsePositiveRate: falsePositiveRate,
                falseNegativeRate: falseNegativeRate,
                avgProcessingTime: avgProcessingTime,
                appStoreReady: isReady
            },
            results: this.results
        }, null, 2));

        console.log('\n📄 Detailed results saved to ai-moderation-test-results.json');
        console.log('🎉 Content sample testing completed!');
    }
}

// Run the tests
const tester = new ContentModerationTester();
tester.runContentTests().catch(console.error);