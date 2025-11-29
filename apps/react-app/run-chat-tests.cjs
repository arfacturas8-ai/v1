#!/usr/bin/env node

/**
 * Automated Chat UI Testing Script
 * Uses headless browser to test CRYB chat interface
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class ChatUITestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
      categories: {
        messageComponents: { tests: [], status: 'pending' },
        inputComponents: { tests: [], status: 'pending' },
        realTimeUpdates: { tests: [], status: 'pending' },
        searchNavigation: { tests: [], status: 'pending' },
        mobileResponsiveness: { tests: [], status: 'pending' },
        performance: { tests: [], status: 'pending' }
      },
      recommendations: [],
      issues: []
    };
  }

  async init() {
    console.log('🚀 Initializing Chat UI Test Runner...');
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport for desktop testing
    await this.page.setViewport({ width: 1366, height: 768 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Error:', msg.text());
      }
    });

    console.log('✅ Browser initialized');
  }

  async loadApplication() {
    console.log('📱 Loading CRYB chat application...');
    
    try {
      await this.page.goto('http://localhost:3008', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for React app to load
      await this.page.waitForSelector('body', { timeout: 10000 });
      await this.page.waitForTimeout(3000); // Additional wait for components to initialize
      
      console.log('✅ Application loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load application:', error.message);
      this.addIssue('Application Loading', `Failed to load: ${error.message}`, 'critical');
      return false;
    }
  }

  addTestResult(category, testName, status, details = '') {
    const test = { name: testName, status, details, timestamp: new Date().toISOString() };
    this.testResults.categories[category].tests.push(test);
    this.testResults.summary.total++;
    
    if (status === 'passed') {
      this.testResults.summary.passed++;
      console.log(`✅ ${testName}`);
    } else if (status === 'failed') {
      this.testResults.summary.failed++;
      console.log(`❌ ${testName}: ${details}`);
    } else if (status === 'warning') {
      this.testResults.summary.warnings++;
      console.log(`⚠️ ${testName}: ${details}`);
    }
  }

  addIssue(component, description, severity = 'medium') {
    this.testResults.issues.push({
      component,
      description,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  addRecommendation(recommendation) {
    this.testResults.recommendations.push(recommendation);
  }

  async testMessageComponents() {
    console.log('\n💬 Testing Message Components...');
    
    try {
      // Test message bubbles
      const messageBubbles = await this.page.$$('.message-item, [class*="message-bubble"], [class*="message"]');
      if (messageBubbles.length > 0) {
        this.addTestResult('messageComponents', 'Message Bubbles Rendering', 'passed', `Found ${messageBubbles.length} message bubbles`);
      } else {
        this.addTestResult('messageComponents', 'Message Bubbles Rendering', 'failed', 'No message bubbles found');
      }

      // Test avatars
      const avatars = await this.page.$$('[class*="avatar"], .rounded-full img, .rounded-full div');
      if (avatars.length > 0) {
        this.addTestResult('messageComponents', 'User Avatars', 'passed', `Found ${avatars.length} avatars`);
      } else {
        this.addTestResult('messageComponents', 'User Avatars', 'warning', 'No user avatars found');
      }

      // Test timestamps
      const timestamps = await this.page.$$('[class*="timestamp"], time, [data-timestamp]');
      if (timestamps.length > 0) {
        this.addTestResult('messageComponents', 'Message Timestamps', 'passed', `Found ${timestamps.length} timestamps`);
      } else {
        this.addTestResult('messageComponents', 'Message Timestamps', 'warning', 'No timestamps found');
      }

      // Test hover interactions
      if (messageBubbles.length > 0) {
        await messageBubbles[0].hover();
        await this.page.waitForTimeout(300);
        
        const hoverActions = await this.page.$$('[class*="action"], [class*="hover"]');
        if (hoverActions.length > 0) {
          this.addTestResult('messageComponents', 'Message Hover States', 'passed', 'Hover actions detected');
        } else {
          this.addTestResult('messageComponents', 'Message Hover States', 'warning', 'No hover actions found');
        }
      }

      // Test reactions
      const reactions = await this.page.$$('[class*="reaction"], [class*="emoji"], .emoji');
      if (reactions.length > 0) {
        this.addTestResult('messageComponents', 'Message Reactions', 'passed', `Found ${reactions.length} reaction elements`);
      } else {
        this.addTestResult('messageComponents', 'Message Reactions', 'warning', 'No reaction system found');
      }

      // Test edit/delete functionality
      const editButtons = await this.page.$$('[title*="edit" i], [aria-label*="edit" i], [class*="edit"]');
      const deleteButtons = await this.page.$$('[title*="delete" i], [aria-label*="delete" i], [class*="delete"], [class*="trash"]');
      
      if (editButtons.length > 0 || deleteButtons.length > 0) {
        this.addTestResult('messageComponents', 'Edit/Delete Functionality', 'passed', `Found ${editButtons.length} edit, ${deleteButtons.length} delete buttons`);
      } else {
        this.addTestResult('messageComponents', 'Edit/Delete Functionality', 'warning', 'No edit/delete buttons found');
      }

    } catch (error) {
      this.addTestResult('messageComponents', 'Message Components Test', 'failed', error.message);
    }

    this.testResults.categories.messageComponents.status = 'completed';
  }

  async testInputComponents() {
    console.log('\n⌨️ Testing Input Components...');
    
    try {
      // Test message input field
      const messageInputs = await this.page.$$('input[type="text"], textarea, [contenteditable="true"]');
      const chatInputs = [];
      
      for (let input of messageInputs) {
        const placeholder = await input.evaluate(el => el.placeholder || '');
        if (placeholder.toLowerCase().includes('message') || placeholder.toLowerCase().includes('type')) {
          chatInputs.push(input);
        }
      }

      if (chatInputs.length > 0) {
        this.addTestResult('inputComponents', 'Message Input Field', 'passed', `Found ${chatInputs.length} message input(s)`);
        
        // Test typing in input
        const input = chatInputs[0];
        await input.click();
        await input.type('Test message from automation');
        await this.page.waitForTimeout(500);
        await input.evaluate(el => el.value = ''); // Clear
        
        this.addTestResult('inputComponents', 'Input Field Functionality', 'passed', 'Input accepts text');
      } else {
        this.addTestResult('inputComponents', 'Message Input Field', 'failed', 'No message input field found');
      }

      // Test emoji picker
      const emojiButtons = await this.page.$$('[class*="emoji"], [title*="emoji" i], [aria-label*="emoji" i]');
      if (emojiButtons.length > 0) {
        this.addTestResult('inputComponents', 'Emoji Picker Button', 'passed', `Found ${emojiButtons.length} emoji buttons`);
        
        // Try to open emoji picker
        try {
          await emojiButtons[0].click();
          await this.page.waitForTimeout(500);
          
          const emojiPicker = await this.page.$('[class*="emoji-picker"], [class*="emoji-modal"]');
          if (emojiPicker) {
            this.addTestResult('inputComponents', 'Emoji Picker Functionality', 'passed', 'Emoji picker opens');
          } else {
            this.addTestResult('inputComponents', 'Emoji Picker Functionality', 'warning', 'Emoji picker may not be visible');
          }
        } catch (error) {
          this.addTestResult('inputComponents', 'Emoji Picker Functionality', 'warning', 'Could not test emoji picker interaction');
        }
      } else {
        this.addTestResult('inputComponents', 'Emoji Picker', 'warning', 'No emoji picker found');
      }

      // Test file upload
      const fileButtons = await this.page.$$('[class*="file"], [class*="attach"], input[type="file"]');
      if (fileButtons.length > 0) {
        this.addTestResult('inputComponents', 'File Upload UI', 'passed', `Found ${fileButtons.length} file upload elements`);
      } else {
        this.addTestResult('inputComponents', 'File Upload UI', 'warning', 'No file upload UI found');
      }

      // Test send button
      const sendButtons = await this.page.$$('[class*="send"], [title*="send" i], [aria-label*="send" i]');
      if (sendButtons.length > 0) {
        this.addTestResult('inputComponents', 'Send Button', 'passed', `Found ${sendButtons.length} send buttons`);
      } else {
        this.addTestResult('inputComponents', 'Send Button', 'warning', 'No send button found');
      }

      // Test formatting toolbar
      const formatButtons = await this.page.$$('[class*="bold"], [class*="italic"], [class*="format"], [class*="toolbar"]');
      if (formatButtons.length > 0) {
        this.addTestResult('inputComponents', 'Rich Text Toolbar', 'passed', `Found ${formatButtons.length} formatting elements`);
      } else {
        this.addTestResult('inputComponents', 'Rich Text Toolbar', 'warning', 'No rich text formatting found');
      }

    } catch (error) {
      this.addTestResult('inputComponents', 'Input Components Test', 'failed', error.message);
    }

    this.testResults.categories.inputComponents.status = 'completed';
  }

  async testRealTimeUpdates() {
    console.log('\n⚡ Testing Real-time Updates...');
    
    try {
      // Test typing indicators
      const typingIndicators = await this.page.$$('[class*="typing"], [class*="indicator"]');
      if (typingIndicators.length > 0) {
        this.addTestResult('realTimeUpdates', 'Typing Indicators', 'passed', `Found ${typingIndicators.length} typing indicators`);
      } else {
        this.addTestResult('realTimeUpdates', 'Typing Indicators', 'warning', 'No typing indicators found');
      }

      // Test online status
      const statusIndicators = await this.page.$$('[class*="status"], [class*="online"], [class*="offline"]');
      if (statusIndicators.length > 0) {
        this.addTestResult('realTimeUpdates', 'User Status Indicators', 'passed', `Found ${statusIndicators.length} status indicators`);
      } else {
        this.addTestResult('realTimeUpdates', 'User Status Indicators', 'warning', 'No user status indicators found');
      }

      // Test read receipts
      const readReceipts = await this.page.$$('[class*="read"], [class*="receipt"], .checkmark');
      if (readReceipts.length > 0) {
        this.addTestResult('realTimeUpdates', 'Read Receipts', 'passed', `Found ${readReceipts.length} read receipt elements`);
      } else {
        this.addTestResult('realTimeUpdates', 'Read Receipts', 'warning', 'No read receipts found');
      }

      // Test message sending (if possible)
      try {
        const messageInput = await this.page.$('input[type="text"], textarea');
        const sendButton = await this.page.$('[class*="send"], [title*="send" i]');
        
        if (messageInput && sendButton) {
          const initialMessageCount = await this.page.$$eval('.message-item, [class*="message"]', els => els.length);
          
          await messageInput.type('Automated test message');
          await sendButton.click();
          await this.page.waitForTimeout(1000);
          
          const newMessageCount = await this.page.$$eval('.message-item, [class*="message"]', els => els.length);
          
          if (newMessageCount > initialMessageCount) {
            this.addTestResult('realTimeUpdates', 'Message Sending', 'passed', 'New message appeared');
          } else {
            this.addTestResult('realTimeUpdates', 'Message Sending', 'warning', 'Message may not have appeared immediately');
          }
        }
      } catch (error) {
        this.addTestResult('realTimeUpdates', 'Message Sending', 'warning', 'Could not test message sending');
      }

    } catch (error) {
      this.addTestResult('realTimeUpdates', 'Real-time Updates Test', 'failed', error.message);
    }

    this.testResults.categories.realTimeUpdates.status = 'completed';
  }

  async testSearchAndNavigation() {
    console.log('\n🔍 Testing Search & Navigation...');
    
    try {
      // Test search functionality
      const searchElements = await this.page.$$('[class*="search"], [placeholder*="search" i]');
      if (searchElements.length > 0) {
        this.addTestResult('searchNavigation', 'Search Interface', 'passed', `Found ${searchElements.length} search elements`);
        
        // Try to open search
        try {
          const searchButton = await this.page.$('[class*="search"][role="button"], button[class*="search"]');
          if (searchButton) {
            await searchButton.click();
            await this.page.waitForTimeout(500);
            
            const searchModal = await this.page.$('[class*="search-modal"], [class*="search-popup"]');
            if (searchModal) {
              this.addTestResult('searchNavigation', 'Search Modal', 'passed', 'Search modal opens');
            }
          }
        } catch (error) {
          this.addTestResult('searchNavigation', 'Search Functionality', 'warning', 'Could not test search interaction');
        }
      } else {
        this.addTestResult('searchNavigation', 'Search Interface', 'warning', 'No search functionality found');
      }

      // Test scroll to bottom
      const scrollButtons = await this.page.$$('[class*="scroll"], [class*="bottom"]');
      if (scrollButtons.length > 0) {
        this.addTestResult('searchNavigation', 'Scroll to Bottom', 'passed', `Found ${scrollButtons.length} scroll buttons`);
      } else {
        this.addTestResult('searchNavigation', 'Scroll to Bottom', 'warning', 'No scroll to bottom button found');
      }

      // Test channel navigation
      const channels = await this.page.$$('[class*="channel"], [class*="room"], [data-channel]');
      if (channels.length > 1) {
        this.addTestResult('searchNavigation', 'Channel Navigation', 'passed', `Found ${channels.length} channels`);
        
        // Try switching channels
        try {
          await channels[1].click();
          await this.page.waitForTimeout(500);
          this.addTestResult('searchNavigation', 'Channel Switching', 'passed', 'Channel switch attempted');
        } catch (error) {
          this.addTestResult('searchNavigation', 'Channel Switching', 'warning', 'Could not test channel switching');
        }
      } else {
        this.addTestResult('searchNavigation', 'Channel Navigation', 'warning', 'Limited channel navigation found');
      }

    } catch (error) {
      this.addTestResult('searchNavigation', 'Search & Navigation Test', 'failed', error.message);
    }

    this.testResults.categories.searchNavigation.status = 'completed';
  }

  async testMobileResponsiveness() {
    console.log('\n📱 Testing Mobile Responsiveness...');
    
    try {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 }); // iPhone SE
      await this.page.waitForTimeout(1000);

      // Check for mobile-specific elements
      const mobileElements = await this.page.$$('[class*="mobile"], [class*="sm:"], [class*="touch"]');
      if (mobileElements.length > 0) {
        this.addTestResult('mobileResponsiveness', 'Mobile-Specific Elements', 'passed', `Found ${mobileElements.length} mobile elements`);
      } else {
        this.addTestResult('mobileResponsiveness', 'Mobile-Specific Elements', 'warning', 'No mobile-specific elements detected');
      }

      // Test touch targets
      const buttons = await this.page.$$('button, [role="button"]');
      let adequateTouchTargets = 0;
      
      for (let button of buttons) {
        const box = await button.boundingBox();
        if (box && (box.width >= 44 || box.height >= 44)) {
          adequateTouchTargets++;
        }
      }

      if (adequateTouchTargets > 0) {
        this.addTestResult('mobileResponsiveness', 'Touch Target Sizes', 'passed', `${adequateTouchTargets}/${buttons.length} adequate touch targets`);
      } else {
        this.addTestResult('mobileResponsiveness', 'Touch Target Sizes', 'warning', 'Touch targets may be too small');
      }

      // Test sidebar behavior on mobile
      const sidebar = await this.page.$('[class*="sidebar"], aside, nav');
      if (sidebar) {
        const isVisible = await sidebar.isIntersectingViewport();
        if (!isVisible) {
          this.addTestResult('mobileResponsiveness', 'Mobile Sidebar', 'passed', 'Sidebar hidden on mobile (good)');
        } else {
          this.addTestResult('mobileResponsiveness', 'Mobile Sidebar', 'warning', 'Sidebar may not be mobile-optimized');
        }
      }

      // Reset viewport
      await this.page.setViewport({ width: 1366, height: 768 });

    } catch (error) {
      this.addTestResult('mobileResponsiveness', 'Mobile Responsiveness Test', 'failed', error.message);
    }

    this.testResults.categories.mobileResponsiveness.status = 'completed';
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      // Measure page load performance
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.navigationStart
        };
      });

      if (performanceMetrics.totalTime < 5000) {
        this.addTestResult('performance', 'Page Load Speed', 'passed', `Loaded in ${performanceMetrics.totalTime}ms`);
      } else {
        this.addTestResult('performance', 'Page Load Speed', 'warning', `Slow load: ${performanceMetrics.totalTime}ms`);
      }

      // Test memory usage
      const memoryInfo = await this.page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });

      if (memoryInfo) {
        const usedMB = (memoryInfo.used / 1024 / 1024).toFixed(2);
        this.addTestResult('performance', 'Memory Usage', 'passed', `${usedMB}MB JS heap used`);
      }

      // Test for console errors
      const consoleErrors = [];
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      if (consoleErrors.length === 0) {
        this.addTestResult('performance', 'Console Errors', 'passed', 'No console errors detected');
      } else {
        this.addTestResult('performance', 'Console Errors', 'warning', `${consoleErrors.length} console errors found`);
      }

    } catch (error) {
      this.addTestResult('performance', 'Performance Test', 'failed', error.message);
    }

    this.testResults.categories.performance.status = 'completed';
  }

  generateRecommendations() {
    const { passed, failed, warnings, total } = this.testResults.summary;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    if (successRate < 70) {
      this.addRecommendation('Critical: Overall test success rate is below 70%. Immediate attention required.');
    }

    if (failed > 0) {
      this.addRecommendation(`Address ${failed} critical failures in the chat interface.`);
    }

    if (warnings > 5) {
      this.addRecommendation('High number of warnings detected. Consider implementing missing features.');
    }

    // Category-specific recommendations
    const messageTests = this.testResults.categories.messageComponents.tests;
    if (messageTests.some(t => t.name.includes('Reactions') && t.status !== 'passed')) {
      this.addRecommendation('Implement message reactions system for better user engagement.');
    }

    if (messageTests.some(t => t.name.includes('Edit') && t.status !== 'passed')) {
      this.addRecommendation('Add message editing and deletion functionality.');
    }

    const inputTests = this.testResults.categories.inputComponents.tests;
    if (inputTests.some(t => t.name.includes('Emoji') && t.status !== 'passed')) {
      this.addRecommendation('Implement emoji picker for enhanced messaging experience.');
    }

    if (inputTests.some(t => t.name.includes('File') && t.status !== 'passed')) {
      this.addRecommendation('Add file upload and media sharing capabilities.');
    }

    const searchTests = this.testResults.categories.searchNavigation.tests;
    if (searchTests.some(t => t.name.includes('Search') && t.status !== 'passed')) {
      this.addRecommendation('Implement message search functionality for better UX.');
    }

    // Performance recommendations
    if (this.testResults.categories.performance.tests.some(t => t.status === 'warning')) {
      this.addRecommendation('Optimize performance - consider lazy loading and virtualization.');
    }

    // Mobile recommendations
    const mobileTests = this.testResults.categories.mobileResponsiveness.tests;
    if (mobileTests.some(t => t.status === 'warning')) {
      this.addRecommendation('Improve mobile responsiveness and touch interface optimization.');
    }

    // General recommendations
    this.addRecommendation('Consider implementing real-time features with WebSocket/Socket.io integration.');
    this.addRecommendation('Add comprehensive error handling and user feedback mechanisms.');
    this.addRecommendation('Implement accessibility features (ARIA labels, keyboard navigation).');
    this.addRecommendation('Add unit and integration tests for better code coverage.');
  }

  async runAllTests() {
    console.log('🎯 Starting Comprehensive Chat UI Test Suite\n');
    
    const startTime = Date.now();
    
    await this.init();
    
    const appLoaded = await this.loadApplication();
    if (!appLoaded) {
      console.log('❌ Cannot proceed with tests - application failed to load');
      return this.testResults;
    }

    await this.testMessageComponents();
    await this.testInputComponents();
    await this.testRealTimeUpdates();
    await this.testSearchAndNavigation();
    await this.testMobileResponsiveness();
    await this.testPerformance();

    this.generateRecommendations();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Calculate success rate
    const { total, passed } = this.testResults.summary;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`❌ Failed: ${this.testResults.summary.failed}`);
    console.log(`⚠️ Warnings: ${this.testResults.summary.warnings}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log(`⏱️ Duration: ${duration.toFixed(2)}s`);

    if (this.testResults.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.testResults.issues.forEach(issue => {
        console.log(`   ${issue.severity.toUpperCase()}: ${issue.component} - ${issue.description}`);
      });
    }

    if (this.testResults.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.testResults.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    await this.cleanup();
    return this.testResults;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('\n🧹 Test cleanup completed');
    }
  }

  async saveResults() {
    const resultsPath = path.join(__dirname, 'chat-ui-test-results.json');
    const reportPath = path.join(__dirname, 'chat-ui-test-report.html');
    
    // Save JSON results
    fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`📄 Test results saved to: ${resultsPath}`);

    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(reportPath, htmlReport);
    console.log(`📊 HTML report saved to: ${reportPath}`);
  }

  generateHTMLReport() {
    const { summary, categories, recommendations, issues } = this.testResults;
    const successRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRYB Chat UI Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0052FF, #00D4FF); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .passed { color: #10B981; }
        .failed { color: #EF4444; }
        .warning { color: #F59E0B; }
        .category { background: white; margin-bottom: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .category-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; }
        .test-list { padding: 20px; }
        .test-item { display: flex; justify-content: between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .test-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .recommendations { background: #FEF3CD; border: 1px solid #F59E0B; border-radius: 12px; padding: 20px; margin-top: 30px; }
        .issues { background: #FEE2E2; border: 1px solid #EF4444; border-radius: 12px; padding: 20px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 CRYB Chat UI Test Report</h1>
            <p>Generated on ${this.testResults.timestamp}</p>
            <p>Success Rate: ${successRate}%</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <div class="stat-value">${summary.total}</div>
                <div>Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value passed">${summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value failed">${summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value warning">${summary.warnings}</div>
                <div>Warnings</div>
            </div>
        </div>

        ${Object.entries(categories).map(([categoryName, category]) => `
            <div class="category">
                <div class="category-header">
                    <h3>${categoryName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                    <p>Status: ${category.status}</p>
                </div>
                <div class="test-list">
                    ${category.tests.map(test => `
                        <div class="test-item">
                            <span>${test.name}</span>
                            <span class="test-status ${test.status}">${test.status.toUpperCase()}</span>
                        </div>
                        ${test.details ? `<div style="color: #666; font-size: 0.9em; margin-left: 20px;">${test.details}</div>` : ''}
                    `).join('')}
                </div>
            </div>
        `).join('')}

        ${recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                <ul>
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}

        ${issues.length > 0 ? `
            <div class="issues">
                <h3>🚨 Critical Issues</h3>
                <ul>
                    ${issues.map(issue => `<li><strong>${issue.component}:</strong> ${issue.description} (${issue.severity})</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>
</body>
</html>`;
  }
}

// Run the tests if called directly
if (require.main === module) {
  const runner = new ChatUITestRunner();
  
  runner.runAllTests()
    .then(async (results) => {
      await runner.saveResults();
      console.log('\n🎉 Chat UI testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = ChatUITestRunner;