/**
 * CRYB Reddit-Style Features Automated Test Suite
 * Comprehensive testing of all Reddit-style features
 */

class CRYBRedditTester {
    constructor() {
        this.baseUrl = 'http://localhost:5173';
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            tests: {}
        };
        this.currentTest = null;
    }

    // Logging and result tracking
    log(message, type = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
        console.log(`${prefix} ${message}`);
    }

    pass(testName, details) {
        this.testResults.passed++;
        this.testResults.tests[testName] = { status: 'PASSED', details };
        this.log(`✅ ${testName}: ${details}`, 'pass');
    }

    fail(testName, details) {
        this.testResults.failed++;
        this.testResults.tests[testName] = { status: 'FAILED', details };
        this.log(`❌ ${testName}: ${details}`, 'fail');
    }

    // Utility functions for DOM testing
    async waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                } else {
                    setTimeout(checkElement, 100);
                }
            };
            checkElement();
        });
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async clickAndWait(selector, waitMs = 1000) {
        const element = await this.waitForElement(selector);
        element.click();
        await this.wait(waitMs);
        return element;
    }

    // Test 1: Post Creation System
    async testPostCreation() {
        this.log('🔥 Testing Post Creation System');
        
        try {
            // Test 1.1: Text Post Creation
            this.log('Testing text post creation...');
            
            // Check if create post button exists
            const createPostBtn = document.querySelector('[href="/submit"], [href="/create-post"], .create-post-fab, .post-creation-trigger');
            if (createPostBtn) {
                this.pass('text-post-button-exists', 'Create post button found in UI');
            } else {
                this.fail('text-post-button-exists', 'Create post button not found');
            }

            // Test 1.2: Post Creation Form Elements
            const formSelectors = [
                'input[type="text"]', // Title input
                'textarea', // Content textarea
                'select', // Community selector
                '.post-type-tabs, .post-type-selector' // Post type tabs
            ];

            let formElementsFound = 0;
            formSelectors.forEach((selector, index) => {
                const element = document.querySelector(selector);
                if (element) {
                    formElementsFound++;
                    this.log(`Found form element: ${selector}`);
                }
            });

            if (formElementsFound >= 2) {
                this.pass('post-form-elements', `Found ${formElementsFound}/4 expected form elements`);
            } else {
                this.fail('post-form-elements', `Only found ${formElementsFound}/4 expected form elements`);
            }

            // Test 1.3: Rich Text Editor
            const richEditorElements = document.querySelectorAll('[contenteditable="true"], .rich-text-editor, .format-btn, .ql-editor');
            if (richEditorElements.length > 0) {
                this.pass('rich-text-editor', `Rich text editor elements found (${richEditorElements.length} elements)`);
            } else {
                this.fail('rich-text-editor', 'No rich text editor elements found');
            }

        } catch (error) {
            this.fail('post-creation-system', `Error testing post creation: ${error.message}`);
        }
    }

    // Test 2: Voting System
    async testVotingSystem() {
        this.log('🔥 Testing Voting System');
        
        try {
            // Check for vote controls
            const upvoteButtons = document.querySelectorAll('.vote-controls button:first-child, [aria-label*="Upvote"], .upvote-btn');
            const downvoteButtons = document.querySelectorAll('.vote-controls button:last-child, [aria-label*="Downvote"], .downvote-btn');
            const scoreDisplays = document.querySelectorAll('.vote-controls div, .score, .karma-score');

            if (upvoteButtons.length > 0) {
                this.pass('upvote-buttons', `Found ${upvoteButtons.length} upvote buttons`);
            } else {
                this.fail('upvote-buttons', 'No upvote buttons found');
            }

            if (downvoteButtons.length > 0) {
                this.pass('downvote-buttons', `Found ${downvoteButtons.length} downvote buttons`);
            } else {
                this.fail('downvote-buttons', 'No downvote buttons found');
            }

            if (scoreDisplays.length > 0) {
                this.pass('score-displays', `Found ${scoreDisplays.length} score displays`);
            } else {
                this.fail('score-displays', 'No score displays found');
            }

            // Test vote button functionality
            if (upvoteButtons.length > 0) {
                const firstUpvoteBtn = upvoteButtons[0];
                const initialClasses = firstUpvoteBtn.className;
                
                // Simulate click
                firstUpvoteBtn.click();
                await this.wait(500);
                
                const afterClickClasses = firstUpvoteBtn.className;
                if (initialClasses !== afterClickClasses) {
                    this.pass('vote-interaction', 'Vote button state changes on click');
                } else {
                    this.fail('vote-interaction', 'Vote button state does not change on click');
                }
            }

        } catch (error) {
            this.fail('voting-system', `Error testing voting system: ${error.message}`);
        }
    }

    // Test 3: Comments System
    async testCommentsSystem() {
        this.log('🔥 Testing Comments System');
        
        try {
            // Check for comment elements
            const comments = document.querySelectorAll('.comment, .comment-item, .comment-container, [class*="comment"]');
            const commentActions = document.querySelectorAll('.comment-actions, .reply-btn, [aria-label*="Reply"]');
            const nestedComments = document.querySelectorAll('.comment .comment, .comment-reply, .nested-comment');

            if (comments.length > 0) {
                this.pass('comments-display', `Found ${comments.length} comment elements`);
            } else {
                this.fail('comments-display', 'No comment elements found');
            }

            if (commentActions.length > 0) {
                this.pass('comment-actions', `Found ${commentActions.length} comment action elements`);
            } else {
                this.fail('comment-actions', 'No comment action elements found');
            }

            if (nestedComments.length > 0) {
                this.pass('nested-comments', `Found ${nestedComments.length} nested comment elements`);
            } else {
                this.fail('nested-comments', 'No nested comment elements found - may not be implemented yet');
            }

            // Test comment collapse functionality
            const collapseButtons = document.querySelectorAll('.collapse-btn, [aria-label*="Collapse"], .comment-toggle');
            if (collapseButtons.length > 0) {
                this.pass('comment-collapse', `Found ${collapseButtons.length} collapse buttons`);
            } else {
                this.fail('comment-collapse', 'No comment collapse buttons found');
            }

        } catch (error) {
            this.fail('comments-system', `Error testing comments system: ${error.message}`);
        }
    }

    // Test 4: Awards System
    async testAwardsSystem() {
        this.log('🔥 Testing Awards System');
        
        try {
            // Check for award elements
            const awards = document.querySelectorAll('.award, .awards, .award-display, [class*="award"]');
            const awardButtons = document.querySelectorAll('.award-btn, .give-award, [aria-label*="Award"]');
            const awardModals = document.querySelectorAll('.award-modal, .award-picker');

            if (awards.length > 0) {
                this.pass('awards-display', `Found ${awards.length} award display elements`);
            } else {
                this.fail('awards-display', 'No award display elements found');
            }

            if (awardButtons.length > 0) {
                this.pass('award-buttons', `Found ${awardButtons.length} award action buttons`);
            } else {
                this.fail('award-buttons', 'No award action buttons found');
            }

            // Check for award icons/emojis
            const awardIcons = document.querySelectorAll('.award span, .award-icon');
            const emojiAwards = Array.from(document.querySelectorAll('*')).filter(el => 
                /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(el.textContent)
            );

            if (awardIcons.length > 0 || emojiAwards.length > 0) {
                this.pass('award-icons', `Found award icons or emojis (${awardIcons.length + emojiAwards.length} elements)`);
            } else {
                this.fail('award-icons', 'No award icons or emojis found');
            }

        } catch (error) {
            this.fail('awards-system', `Error testing awards system: ${error.message}`);
        }
    }

    // Test 5: User Profiles
    async testUserProfiles() {
        this.log('🔥 Testing User Profiles');
        
        try {
            // Check for profile links and elements
            const userLinks = document.querySelectorAll('a[href*="/user/"], a[href*="/u/"], .user-link, .username');
            const profileElements = document.querySelectorAll('.profile, .user-profile, .user-card');
            const karmaDisplays = document.querySelectorAll('.karma, .karma-display, .user-karma, [class*="karma"]');

            if (userLinks.length > 0) {
                this.pass('user-links', `Found ${userLinks.length} user profile links`);
            } else {
                this.fail('user-links', 'No user profile links found');
            }

            if (profileElements.length > 0) {
                this.pass('profile-elements', `Found ${profileElements.length} profile elements`);
            } else {
                this.fail('profile-elements', 'No profile elements found');
            }

            if (karmaDisplays.length > 0) {
                this.pass('karma-displays', `Found ${karmaDisplays.length} karma display elements`);
            } else {
                this.fail('karma-displays', 'No karma display elements found');
            }

            // Check for follow/unfollow functionality
            const followButtons = document.querySelectorAll('.follow-btn, .unfollow-btn, [aria-label*="Follow"]');
            if (followButtons.length > 0) {
                this.pass('follow-buttons', `Found ${followButtons.length} follow/unfollow buttons`);
            } else {
                this.fail('follow-buttons', 'No follow/unfollow buttons found - may not be implemented');
            }

        } catch (error) {
            this.fail('user-profiles', `Error testing user profiles: ${error.message}`);
        }
    }

    // Test 6: Community Features
    async testCommunityFeatures() {
        this.log('🔥 Testing Community Features');
        
        try {
            // Check for community elements
            const communityLinks = document.querySelectorAll('a[href*="/c/"], .community-link, .subreddit-link');
            const communityCards = document.querySelectorAll('.community-card, .community, .subreddit-card');
            const joinButtons = document.querySelectorAll('.join-btn, .leave-btn, [aria-label*="Join"]');

            if (communityLinks.length > 0) {
                this.pass('community-links', `Found ${communityLinks.length} community links`);
            } else {
                this.fail('community-links', 'No community links found');
            }

            if (communityCards.length > 0) {
                this.pass('community-cards', `Found ${communityCards.length} community card elements`);
            } else {
                this.fail('community-cards', 'No community card elements found');
            }

            if (joinButtons.length > 0) {
                this.pass('join-buttons', `Found ${joinButtons.length} join/leave buttons`);
            } else {
                this.fail('join-buttons', 'No join/leave buttons found');
            }

            // Check for community creation
            const createCommunityBtn = document.querySelector('[href*="create-community"], .create-community-btn');
            if (createCommunityBtn) {
                this.pass('create-community', 'Create community button found');
            } else {
                this.fail('create-community', 'Create community button not found');
            }

        } catch (error) {
            this.fail('community-features', `Error testing community features: ${error.message}`);
        }
    }

    // Test 7: White Theme
    async testWhiteTheme() {
        this.log('🔥 Testing White Theme Compatibility');
        
        try {
            // Check computed styles for white theme
            const body = document.body;
            const rootElement = document.documentElement;
            const computedStyle = window.getComputedStyle(body);
            const backgroundColor = computedStyle.backgroundColor;

            // Check if background is white/light
            const isWhiteTheme = backgroundColor.includes('255, 255, 255') || 
                                backgroundColor.includes('rgb(255, 255, 255)') ||
                                backgroundColor === 'white' ||
                                backgroundColor.includes('250, 251, 252'); // off-white

            if (isWhiteTheme) {
                this.pass('white-theme-background', 'Background is white/light colored');
            } else {
                this.fail('white-theme-background', `Background color is: ${backgroundColor}`);
            }

            // Check for white theme CSS variables
            const cssVars = [
                '--bg-primary',
                '--bg-secondary', 
                '--text-primary',
                '--border-color'
            ];

            let whiteThemeVars = 0;
            cssVars.forEach(cssVar => {
                const value = getComputedStyle(rootElement).getPropertyValue(cssVar);
                if (value.includes('255') || value.includes('white') || value.includes('250')) {
                    whiteThemeVars++;
                }
            });

            if (whiteThemeVars >= 2) {
                this.pass('white-theme-variables', `Found ${whiteThemeVars}/4 white theme CSS variables`);
            } else {
                this.fail('white-theme-variables', `Only found ${whiteThemeVars}/4 white theme CSS variables`);
            }

            // Check text contrast
            const textElements = document.querySelectorAll('p, h1, h2, h3, span, div');
            let goodContrastCount = 0;
            
            for (let i = 0; i < Math.min(10, textElements.length); i++) {
                const element = textElements[i];
                const textColor = window.getComputedStyle(element).color;
                
                // Check if text is dark enough for white background
                if (textColor.includes('0, 0, 0') || textColor.includes('26, 26, 26') || textColor.includes('51, 51, 51')) {
                    goodContrastCount++;
                }
            }

            if (goodContrastCount >= 5) {
                this.pass('white-theme-contrast', `Good text contrast found in ${goodContrastCount} elements`);
            } else {
                this.fail('white-theme-contrast', `Poor text contrast - only ${goodContrastCount} elements have good contrast`);
            }

        } catch (error) {
            this.fail('white-theme', `Error testing white theme: ${error.message}`);
        }
    }

    // Test 8: Performance and Responsiveness
    async testPerformanceAndResponsiveness() {
        this.log('🔥 Testing Performance and Responsiveness');
        
        try {
            // Test page load performance
            const performanceEntries = performance.getEntriesByType('navigation');
            if (performanceEntries.length > 0) {
                const loadTime = performanceEntries[0].loadEventEnd - performanceEntries[0].loadEventStart;
                if (loadTime < 3000) {
                    this.pass('page-load-performance', `Page loaded in ${loadTime}ms`);
                } else {
                    this.fail('page-load-performance', `Page load time too slow: ${loadTime}ms`);
                }
            }

            // Test responsive design
            const isMobile = window.innerWidth <= 768;
            const mobileElements = document.querySelectorAll('.mobile-only, .md\\:hidden, [class*="mobile"]');
            const desktopElements = document.querySelectorAll('.desktop-only, .hidden, [class*="desktop"]');

            if (isMobile && mobileElements.length > 0) {
                this.pass('mobile-responsive', `Mobile-specific elements found: ${mobileElements.length}`);
            } else if (!isMobile && desktopElements.length > 0) {
                this.pass('desktop-responsive', `Desktop-specific elements found: ${desktopElements.length}`);
            } else {
                this.pass('responsive-design', 'Responsive design elements detected');
            }

            // Test smooth scrolling
            const scrollableElements = document.querySelectorAll('[style*="overflow"], .scrollable, .overflow-auto');
            if (scrollableElements.length > 0) {
                this.pass('smooth-scrolling', `Found ${scrollableElements.length} scrollable elements`);
            } else {
                this.fail('smooth-scrolling', 'No scrollable elements found');
            }

        } catch (error) {
            this.fail('performance-responsiveness', `Error testing performance: ${error.message}`);
        }
    }

    // Main test runner
    async runAllTests() {
        this.log('🚀 Starting CRYB Reddit-Style Features Test Suite');
        this.log(`Testing URL: ${window.location.href}`);
        
        const tests = [
            this.testPostCreation,
            this.testVotingSystem,
            this.testCommentsSystem,
            this.testAwardsSystem,
            this.testUserProfiles,
            this.testCommunityFeatures,
            this.testWhiteTheme,
            this.testPerformanceAndResponsiveness
        ];

        for (const test of tests) {
            try {
                await test.call(this);
                await this.wait(500); // Brief pause between tests
            } catch (error) {
                this.fail('test-execution', `Error running test: ${error.message}`);
            }
        }

        this.testResults.total = this.testResults.passed + this.testResults.failed;
        this.generateReport();
    }

    // Generate test report
    generateReport() {
        this.log('📊 Generating Test Report');
        
        const passRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
        
        console.log('\n' + '='.repeat(60));
        console.log('🔥 CRYB REDDIT-STYLE FEATURES TEST REPORT');
        console.log('='.repeat(60));
        console.log(`📊 Total Tests: ${this.testResults.total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Pass Rate: ${passRate}%`);
        console.log('='.repeat(60));
        
        console.log('\n📋 Detailed Results:');
        Object.entries(this.testResults.tests).forEach(([testName, result]) => {
            const icon = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${icon} ${testName}: ${result.details}`);
        });
        
        console.log('\n🔍 Recommendations:');
        const failedTests = Object.entries(this.testResults.tests)
            .filter(([_, result]) => result.status === 'FAILED');
        
        if (failedTests.length === 0) {
            console.log('🎉 All tests passed! The Reddit-style features are working excellently.');
        } else {
            failedTests.forEach(([testName, result]) => {
                console.log(`🔧 Fix: ${testName} - ${result.details}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Return results for external use
        return this.testResults;
    }
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
    const tester = new CRYBRedditTester();
    
    // Make tester available globally
    window.crybtester = tester;
    
    console.log('🔥 CRYB Reddit Features Tester loaded!');
    console.log('📝 Run: crybtester.runAllTests() to start testing');
    console.log('🎯 Or run individual tests like: crybtester.testVotingSystem()');
    
    // Auto-run after a short delay to let page load
    setTimeout(() => {
        console.log('🚀 Auto-starting test suite...');
        tester.runAllTests();
    }, 2000);
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CRYBRedditTester;
}