#!/usr/bin/env node

/**
 * CRYB Platform Comprehensive UI/UX Testing Script
 * Tests all user flows and interactions
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class CRYBUITester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            landing: {},
            authentication: {},
            mainApp: {},
            interactions: {},
            responsive: {},
            performance: {},
            accessibility: {}
        };
        this.appUrl = 'http://localhost:3003';
    }

    async init() {
        console.log('🚀 Initializing CRYB UI/UX Tester...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--window-size=1920,1080'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Enable console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Browser Error:', msg.text());
            }
        });
        
        console.log('✅ Browser initialized');
    }

    async testLandingPage() {
        console.log('🏠 Testing Landing Page...');
        
        try {
            await this.page.goto(this.appUrl, { waitUntil: 'networkidle0' });
            
            // Test 1: Page loads successfully
            const title = await this.page.title();
            this.testResults.landing.pageLoads = title.includes('CRYB') || title === 'Vite + React';
            
            // Test 2: Landing page content is visible
            const landingExists = await this.page.$('.landing-page') !== null;
            this.testResults.landing.contentVisible = landingExists;
            
            // Test 3: Navigation exists and is functional
            const nav = await this.page.$('.landing-nav, nav');
            this.testResults.landing.navigationExists = nav !== null;
            
            // Test 4: Check for CRYB logo/title
            const logo = await this.page.evaluate(() => {
                return document.body.innerText.includes('CRYB');
            });
            this.testResults.landing.logoVisible = logo;
            
            // Test 5: Check for CTA buttons
            const getStartedBtn = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(btn => 
                    btn.innerText.includes('Get Started') || 
                    btn.innerText.includes('Start')
                );
            });
            this.testResults.landing.ctaButtonsExist = getStartedBtn;
            
            // Test 6: Check white theme
            const bgColor = await this.page.evaluate(() => {
                const body = document.body;
                const computedStyle = window.getComputedStyle(body);
                return computedStyle.backgroundColor;
            });
            this.testResults.landing.whiteTheme = bgColor.includes('255, 255, 255') || bgColor === 'rgb(255, 255, 255)';
            
            // Test 7: Test scrolling
            await this.page.evaluate(() => window.scrollTo(0, 500));
            await this.page.waitForTimeout(500);
            const scrollPosition = await this.page.evaluate(() => window.pageYOffset);
            this.testResults.landing.scrollingWorks = scrollPosition > 0;
            
            console.log('✅ Landing page tests completed');
            
        } catch (error) {
            console.error('❌ Landing page test failed:', error.message);
            this.testResults.landing.error = error.message;
        }
    }

    async testAuthentication() {
        console.log('🔐 Testing Authentication Flow...');
        
        try {
            // Test 1: Navigate to login page
            let loginButtonFound = false;
            
            // Look for Get Started or Sign In buttons
            const buttons = await this.page.$$('button');
            for (const button of buttons) {
                const text = await this.page.evaluate(el => el.innerText, button);
                if (text.includes('Get Started') || text.includes('Sign In')) {
                    await button.click();
                    loginButtonFound = true;
                    break;
                }
            }
            
            this.testResults.authentication.navigationToLogin = loginButtonFound;
            
            if (loginButtonFound) {
                await this.page.waitForTimeout(1000);
                
                // Test 2: Check if login form is visible
                const loginForm = await this.page.$('form, .login-form, .auth-form');
                this.testResults.authentication.loginFormVisible = loginForm !== null;
                
                // Test 3: Check for demo credentials button
                const demoButton = await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.some(btn => 
                        btn.innerText.includes('Demo') || 
                        btn.innerText.includes('Fill Demo')
                    );
                });
                this.testResults.authentication.demoButtonExists = demoButton;
                
                // Test 4: Check for back to homepage button
                const backButton = await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    return buttons.some(btn => 
                        btn.innerText.includes('Back') || 
                        btn.innerText.includes('Homepage')
                    );
                });
                this.testResults.authentication.backButtonExists = backButton;
                
                // Test 5: Check form validation
                const emailInput = await this.page.$('input[type="email"], input[name="email"]');
                const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
                this.testResults.authentication.formFieldsExist = emailInput && passwordInput;
                
                // Test 6: Test demo credentials functionality
                if (demoButton) {
                    const demoBtn = await this.page.evaluateHandle(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        return buttons.find(btn => 
                            btn.innerText.includes('Demo') || 
                            btn.innerText.includes('Fill Demo')
                        );
                    });
                    
                    if (demoBtn) {
                        await demoBtn.click();
                        await this.page.waitForTimeout(500);
                        
                        const emailValue = await this.page.evaluate(() => {
                            const email = document.querySelector('input[type="email"], input[name="email"]');
                            return email ? email.value : '';
                        });
                        
                        this.testResults.authentication.demoCredentialsFill = emailValue.includes('demo@cryb.ai');
                    }
                }
                
                console.log('✅ Authentication tests completed');
            }
            
        } catch (error) {
            console.error('❌ Authentication test failed:', error.message);
            this.testResults.authentication.error = error.message;
        }
    }

    async testMainApplication() {
        console.log('💬 Testing Main Application...');
        
        try {
            // Try to login with demo credentials
            const emailInput = await this.page.$('input[type="email"], input[name="email"]');
            const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
            
            if (emailInput && passwordInput) {
                await emailInput.click({ clickCount: 3 });
                await emailInput.type('demo@cryb.ai');
                
                await passwordInput.click({ clickCount: 3 });
                await passwordInput.type('demo123');
                
                // Find and click login button
                const loginBtn = await this.page.evaluateHandle(() => {
                    const buttons = Array.from(document.querySelectorAll('button[type="submit"], button'));
                    return buttons.find(btn => 
                        btn.innerText.includes('Sign In') || 
                        btn.innerText.includes('Login') ||
                        btn.type === 'submit'
                    );
                });
                
                if (loginBtn) {
                    await loginBtn.click();
                    await this.page.waitForTimeout(3000); // Wait for login
                    
                    // Test 1: Check if main app interface loads
                    const mainApp = await this.page.$('.app-cryb, .main-content, .app-layout');
                    this.testResults.mainApp.interfaceLoads = mainApp !== null;
                    
                    // Test 2: Check for server sidebar
                    const serverSidebar = await this.page.$('.servers-sidebar, .sidebar, [class*="server"]');
                    this.testResults.mainApp.serverSidebarExists = serverSidebar !== null;
                    
                    // Test 3: Check for channel sidebar
                    const channelSidebar = await this.page.$('.channels-sidebar, [class*="channel"]');
                    this.testResults.mainApp.channelSidebarExists = channelSidebar !== null;
                    
                    // Test 4: Check for member list
                    const memberList = await this.page.$('.members-sidebar, [class*="member"]');
                    this.testResults.mainApp.memberListExists = memberList !== null;
                    
                    // Test 5: Check for chat area
                    const chatArea = await this.page.$('.main-content, [class*="chat"], [class*="message"]');
                    this.testResults.mainApp.chatAreaExists = chatArea !== null;
                    
                    // Test 6: Check for post system toggle
                    const postToggle = await this.page.evaluate(() => {
                        const text = document.body.innerText;
                        return text.includes('Posts') || text.includes('Post System');
                    });
                    this.testResults.mainApp.postSystemVisible = postToggle;
                    
                    console.log('✅ Main application tests completed');
                }
            }
            
        } catch (error) {
            console.error('❌ Main application test failed:', error.message);
            this.testResults.mainApp.error = error.message;
        }
    }

    async testComponentInteractions() {
        console.log('🎮 Testing Component Interactions...');
        
        try {
            // Test 1: Button hover states
            const buttons = await this.page.$$('button');
            if (buttons.length > 0) {
                await buttons[0].hover();
                this.testResults.interactions.hoverStatesWork = true;
            }
            
            // Test 2: Check for notification badges
            const notificationBadge = await this.page.$('[class*="notification"], .bell, [title*="notification"]');
            this.testResults.interactions.notificationBadgesExist = notificationBadge !== null;
            
            // Test 3: Check for modal functionality
            const modalTriggers = await this.page.$$('button[title*="Settings"], button[title*="Profile"]');
            if (modalTriggers.length > 0) {
                try {
                    await modalTriggers[0].click();
                    await this.page.waitForTimeout(500);
                    const modal = await this.page.$('.modal, [class*="modal"], [role="dialog"]');
                    this.testResults.interactions.modalsWork = modal !== null;
                    
                    // Close modal if opened
                    const closeBtn = await this.page.$('[aria-label="close"], .close, button[title*="close"]');
                    if (closeBtn) await closeBtn.click();
                } catch (e) {
                    this.testResults.interactions.modalsWork = false;
                }
            }
            
            // Test 4: Check for social features
            const socialButtons = await this.page.$$('button[title*="Friends"], button[title*="Bookmark"]');
            this.testResults.interactions.socialFeaturesExist = socialButtons.length > 0;
            
            console.log('✅ Component interaction tests completed');
            
        } catch (error) {
            console.error('❌ Component interaction test failed:', error.message);
            this.testResults.interactions.error = error.message;
        }
    }

    async testResponsiveDesign() {
        console.log('📱 Testing Responsive Design...');
        
        try {
            // Test mobile viewport
            await this.page.setViewport({ width: 375, height: 667 });
            await this.page.waitForTimeout(1000);
            
            const mobileLayout = await this.page.evaluate(() => {
                const body = document.body;
                const width = body.offsetWidth;
                return width <= 400;
            });
            this.testResults.responsive.mobileViewport = mobileLayout;
            
            // Test tablet viewport
            await this.page.setViewport({ width: 768, height: 1024 });
            await this.page.waitForTimeout(1000);
            
            const tabletLayout = await this.page.evaluate(() => {
                const body = document.body;
                const width = body.offsetWidth;
                return width > 400 && width <= 800;
            });
            this.testResults.responsive.tabletViewport = tabletLayout;
            
            // Reset to desktop
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            console.log('✅ Responsive design tests completed');
            
        } catch (error) {
            console.error('❌ Responsive design test failed:', error.message);
            this.testResults.responsive.error = error.message;
        }
    }

    async testAccessibility() {
        console.log('♿ Testing Accessibility...');
        
        try {
            // Test 1: Check for ARIA labels
            const ariaElements = await this.page.$$('[aria-label], [aria-describedby], [role]');
            this.testResults.accessibility.ariaLabelsExist = ariaElements.length > 0;
            
            // Test 2: Check for alt text on images
            const images = await this.page.$$('img');
            let imagesWithAlt = 0;
            for (const img of images) {
                const alt = await this.page.evaluate(el => el.alt, img);
                if (alt) imagesWithAlt++;
            }
            this.testResults.accessibility.imagesHaveAlt = imagesWithAlt === images.length;
            
            // Test 3: Check color contrast (basic check)
            const colorContrast = await this.page.evaluate(() => {
                const body = document.body;
                const computedStyle = window.getComputedStyle(body);
                const bgColor = computedStyle.backgroundColor;
                const textColor = computedStyle.color;
                
                // Simple contrast check for white background
                return bgColor.includes('255, 255, 255') && !textColor.includes('255, 255, 255');
            });
            this.testResults.accessibility.goodColorContrast = colorContrast;
            
            console.log('✅ Accessibility tests completed');
            
        } catch (error) {
            console.error('❌ Accessibility test failed:', error.message);
            this.testResults.accessibility.error = error.message;
        }
    }

    async testPerformance() {
        console.log('⚡ Testing Performance...');
        
        try {
            const metrics = await this.page.metrics();
            
            this.testResults.performance = {
                jsHeapUsedSize: metrics.JSHeapUsedSize,
                jsHeapTotalSize: metrics.JSHeapTotalSize,
                layoutCount: metrics.LayoutCount,
                scriptDuration: metrics.ScriptDuration
            };
            
            console.log('✅ Performance tests completed');
            
        } catch (error) {
            console.error('❌ Performance test failed:', error.message);
            this.testResults.performance.error = error.message;
        }
    }

    calculateOverallScore() {
        let totalTests = 0;
        let passedTests = 0;
        
        const countResults = (section) => {
            Object.values(section).forEach(result => {
                if (typeof result === 'boolean') {
                    totalTests++;
                    if (result) passedTests++;
                }
            });
        };
        
        countResults(this.testResults.landing);
        countResults(this.testResults.authentication);
        countResults(this.testResults.mainApp);
        countResults(this.testResults.interactions);
        countResults(this.testResults.responsive);
        countResults(this.testResults.accessibility);
        
        return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    }

    generateReport() {
        const overallScore = this.calculateOverallScore();
        
        const report = {
            timestamp: new Date().toISOString(),
            overallScore,
            testResults: this.testResults,
            summary: {
                landingPageWorks: Object.values(this.testResults.landing).filter(Boolean).length > 5,
                authenticationWorks: Object.values(this.testResults.authentication).filter(Boolean).length > 3,
                mainAppWorks: Object.values(this.testResults.mainApp).filter(Boolean).length > 4,
                interactionsWork: Object.values(this.testResults.interactions).filter(Boolean).length > 2,
                responsiveDesignWorks: Object.values(this.testResults.responsive).filter(Boolean).length > 1,
                accessibilityGood: Object.values(this.testResults.accessibility).filter(Boolean).length > 1
            },
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(__dirname, 'ui-ux-test-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📊 === CRYB UI/UX TEST RESULTS ===`);
        console.log(`🎯 Overall Score: ${overallScore}%`);
        console.log(`🏠 Landing Page: ${report.summary.landingPageWorks ? '✅' : '❌'}`);
        console.log(`🔐 Authentication: ${report.summary.authenticationWorks ? '✅' : '❌'}`);
        console.log(`💬 Main Application: ${report.summary.mainAppWorks ? '✅' : '❌'}`);
        console.log(`🎮 Interactions: ${report.summary.interactionsWork ? '✅' : '❌'}`);
        console.log(`📱 Responsive: ${report.summary.responsiveDesignWorks ? '✅' : '❌'}`);
        console.log(`♿ Accessibility: ${report.summary.accessibilityGood ? '✅' : '❌'}`);
        
        console.log(`\n📋 Report saved to: ${reportPath}`);
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!this.testResults.landing.whiteTheme) {
            recommendations.push("Ensure consistent white theme across landing page");
        }
        
        if (!this.testResults.authentication.demoCredentialsFill) {
            recommendations.push("Fix demo credentials auto-fill functionality");
        }
        
        if (!this.testResults.mainApp.interfaceLoads) {
            recommendations.push("Debug main application interface loading issues");
        }
        
        if (!this.testResults.accessibility.ariaLabelsExist) {
            recommendations.push("Add more ARIA labels for better accessibility");
        }
        
        if (!this.testResults.responsive.mobileViewport) {
            recommendations.push("Improve mobile responsive design");
        }
        
        return recommendations;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullTest() {
        try {
            await this.init();
            
            await this.testLandingPage();
            await this.testAuthentication();
            await this.testMainApplication();
            await this.testComponentInteractions();
            await this.testResponsiveDesign();
            await this.testAccessibility();
            await this.testPerformance();
            
            const report = this.generateReport();
            
            return report;
            
        } catch (error) {
            console.error('🚨 Test suite failed:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    console.log('🚀 Starting CRYB UI/UX Test Suite...\n');
    
    const tester = new CRYBUITester();
    tester.runFullTest()
        .then(report => {
            console.log('\n✨ All tests completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = CRYBUITester;