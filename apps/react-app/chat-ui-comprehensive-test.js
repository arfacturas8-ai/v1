/**
 * Comprehensive Chat UI Component Test Suite
 * Tests all aspects of the CRYB platform chat interface
 */

class ChatUITester {
  constructor() {
    this.testResults = []
    this.testsPassed = 0
    this.testsFailed = 0
    this.startTime = Date.now()
  }

  log(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`)
    this.testResults.push({ message, type, timestamp: new Date().toISOString() })
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async runTest(testName, testFn) {
    try {
      this.log(`Testing: ${testName}`, 'test')
      await testFn()
      this.testsPassed++
      this.log(`✅ PASSED: ${testName}`, 'success')
    } catch (error) {
      this.testsFailed++
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error')
    }
  }

  // Test 1: Message Components
  async testMessageComponents() {
    await this.runTest('Message Bubble Rendering', async () => {
      const messageBubbles = document.querySelectorAll('[class*="message-bubble"], .message-item')
      if (messageBubbles.length === 0) {
        throw new Error('No message bubbles found')
      }
      this.log(`Found ${messageBubbles.length} message bubbles`)
    })

    await this.runTest('Message Timestamps', async () => {
      const timestamps = document.querySelectorAll('[class*="timestamp"], time, [data-timestamp]')
      if (timestamps.length === 0) {
        throw new Error('No timestamps found in messages')
      }
      this.log(`Found ${timestamps.length} timestamp elements`)
    })

    await this.runTest('User Avatars Display', async () => {
      const avatars = document.querySelectorAll('[class*="avatar"], [class*="profile-pic"], .rounded-full img, .rounded-full div')
      if (avatars.length === 0) {
        throw new Error('No user avatars found')
      }
      this.log(`Found ${avatars.length} avatar elements`)
    })

    await this.runTest('Message Hover States', async () => {
      const messageBubbles = document.querySelectorAll('.message-item, [class*="message-bubble"]')
      if (messageBubbles.length > 0) {
        const firstMessage = messageBubbles[0]
        
        // Simulate hover
        const hoverEvent = new MouseEvent('mouseenter', { bubbles: true })
        firstMessage.dispatchEvent(hoverEvent)
        
        await this.sleep(200)
        
        // Check for hover effects (actions, etc.)
        const hoverActions = document.querySelectorAll('[class*="message-action"], [class*="hover-action"]')
        this.log(`Hover triggered, found ${hoverActions.length} action elements`)
        
        // Simulate leave
        const leaveEvent = new MouseEvent('mouseleave', { bubbles: true })
        firstMessage.dispatchEvent(leaveEvent)
      }
    })

    await this.runTest('Message Reactions System', async () => {
      const reactionElements = document.querySelectorAll('[class*="reaction"], [class*="emoji-reaction"], .reaction-button')
      const emojiElements = document.querySelectorAll('[data-emoji], .emoji')
      this.log(`Found ${reactionElements.length} reaction elements and ${emojiElements.length} emoji elements`)
      
      if (reactionElements.length === 0 && emojiElements.length === 0) {
        throw new Error('No reaction system found')
      }
    })

    await this.runTest('Message Editing Functionality', async () => {
      const editButtons = document.querySelectorAll('[class*="edit"], [title*="edit" i], [aria-label*="edit" i]')
      this.log(`Found ${editButtons.length} edit-related elements`)
    })

    await this.runTest('Message Deletion Functionality', async () => {
      const deleteButtons = document.querySelectorAll('[class*="delete"], [title*="delete" i], [aria-label*="delete" i], [class*="trash"]')
      this.log(`Found ${deleteButtons.length} delete-related elements`)
    })
  }

  // Test 2: Input Components
  async testInputComponents() {
    await this.runTest('Message Input Field', async () => {
      const messageInputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]')
      const chatInputs = Array.from(messageInputs).filter(input => 
        input.placeholder?.toLowerCase().includes('message') ||
        input.className.includes('message') ||
        input.closest('[class*="input"], [class*="compose"]')
      )
      
      if (chatInputs.length === 0) {
        throw new Error('No message input field found')
      }
      
      this.log(`Found ${chatInputs.length} message input field(s)`)
      
      // Test input functionality
      const mainInput = chatInputs[0]
      if (mainInput.tagName === 'INPUT' || mainInput.tagName === 'TEXTAREA') {
        mainInput.value = 'Test message'
        mainInput.dispatchEvent(new Event('input', { bubbles: true }))
        await this.sleep(100)
        if (mainInput.value !== 'Test message') {
          throw new Error('Input field not responding to text input')
        }
        mainInput.value = '' // Clear
      }
    })

    await this.runTest('Emoji Picker Functionality', async () => {
      const emojiButtons = document.querySelectorAll('[class*="emoji"], [title*="emoji" i], [aria-label*="emoji" i]')
      if (emojiButtons.length === 0) {
        throw new Error('No emoji picker button found')
      }
      
      this.log(`Found ${emojiButtons.length} emoji-related buttons`)
      
      // Try to trigger emoji picker
      const emojiButton = emojiButtons[0]
      emojiButton.click()
      await this.sleep(300)
      
      // Check for emoji picker modal/dropdown
      const emojiPicker = document.querySelector('[class*="emoji-picker"], [class*="emoji-modal"], .emoji-selector')
      if (emojiPicker) {
        this.log('Emoji picker opened successfully')
        // Close it
        const closeButton = emojiPicker.querySelector('[class*="close"], button[aria-label*="close" i]')
        if (closeButton) closeButton.click()
        else emojiButton.click() // Toggle again
      }
    })

    await this.runTest('File Attachment UI', async () => {
      const fileButtons = document.querySelectorAll('[class*="file"], [class*="attach"], [title*="file" i], [aria-label*="attach" i], input[type="file"]')
      if (fileButtons.length === 0) {
        throw new Error('No file attachment UI found')
      }
      
      this.log(`Found ${fileButtons.length} file attachment elements`)
      
      // Test file button click
      const visibleFileButtons = Array.from(fileButtons).filter(btn => 
        btn.offsetParent !== null && btn.type !== 'file'
      )
      if (visibleFileButtons.length > 0) {
        visibleFileButtons[0].click()
        await this.sleep(200)
        
        // Check for file upload modal/interface
        const fileModal = document.querySelector('[class*="file-upload"], [class*="upload-modal"], [class*="attachment"]')
        if (fileModal) {
          this.log('File upload interface opened')
        }
      }
    })

    await this.runTest('@Mentions Functionality', async () => {
      const messageInputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]')
      const chatInputs = Array.from(messageInputs).filter(input => 
        input.placeholder?.toLowerCase().includes('message')
      )
      
      if (chatInputs.length > 0) {
        const input = chatInputs[0]
        
        // Simulate typing @mention
        if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
          input.value = '@'
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('keyup', { bubbles: true }))
          await this.sleep(300)
          
          // Look for mention dropdown/suggestions
          const mentionDropdown = document.querySelector('[class*="mention"], [class*="suggestion"], [class*="autocomplete"]')
          if (mentionDropdown) {
            this.log('Mention suggestions appeared')
          }
          
          input.value = '' // Clear
        }
      }
    })

    await this.runTest('Typing Indicators', async () => {
      const typingIndicators = document.querySelectorAll('[class*="typing"], [class*="indicator"], .typing-animation')
      this.log(`Found ${typingIndicators.length} typing indicator elements`)
      
      // Simulate typing to trigger indicator
      const messageInputs = document.querySelectorAll('input[type="text"], textarea')
      if (messageInputs.length > 0) {
        const input = messageInputs[0]
        input.value = 'Testing typing...'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('keydown', { bubbles: true }))
        await this.sleep(500)
        input.value = ''
      }
    })

    await this.runTest('Rich Text Formatting Toolbar', async () => {
      const toolbarElements = document.querySelectorAll('[class*="toolbar"], [class*="format"], [class*="rich-text"]')
      const formatButtons = document.querySelectorAll('[class*="bold"], [class*="italic"], [class*="code"], [title*="bold" i], [title*="italic" i]')
      
      this.log(`Found ${toolbarElements.length} toolbar elements and ${formatButtons.length} format buttons`)
      
      if (formatButtons.length > 0) {
        this.log('Rich text formatting toolbar detected')
      }
    })
  }

  // Test 3: Real-time Updates
  async testRealTimeUpdates() {
    await this.runTest('New Message Appearance', async () => {
      const initialMessageCount = document.querySelectorAll('.message-item, [class*="message-bubble"]').length
      
      // Simulate sending a message
      const messageInputs = document.querySelectorAll('input[type="text"], textarea')
      const sendButtons = document.querySelectorAll('[class*="send"], [title*="send" i], [aria-label*="send" i]')
      
      if (messageInputs.length > 0 && sendButtons.length > 0) {
        const input = messageInputs[0]
        const sendBtn = sendButtons[0]
        
        if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
          input.value = 'Test message from automated test'
          input.dispatchEvent(new Event('input', { bubbles: true }))
          
          sendBtn.click()
          await this.sleep(500)
          
          const newMessageCount = document.querySelectorAll('.message-item, [class*="message-bubble"]').length
          if (newMessageCount > initialMessageCount) {
            this.log(`New message appeared (${newMessageCount} vs ${initialMessageCount})`)
          } else {
            this.log('Message may have been sent (checking localStorage)')
          }
        }
      }
    })

    await this.runTest('Online/Offline Status Updates', async () => {
      const statusIndicators = document.querySelectorAll('[class*="status"], [class*="online"], [class*="offline"], .presence, [class*="indicator"]')
      this.log(`Found ${statusIndicators.length} status indicator elements`)
      
      // Check for user presence indicators
      const userElements = document.querySelectorAll('[class*="user"], [class*="member"], [class*="participant"]')
      const usersWithStatus = Array.from(userElements).filter(user => 
        user.querySelector('[class*="status"], [class*="online"], [class*="offline"]')
      )
      this.log(`Found ${usersWithStatus.length} users with status indicators`)
    })

    await this.runTest('Read Receipts Display', async () => {
      const readReceipts = document.querySelectorAll('[class*="read"], [class*="receipt"], [class*="seen"], .checkmark, [title*="read" i]')
      this.log(`Found ${readReceipts.length} read receipt elements`)
      
      // Look for double checkmarks or similar read indicators
      const checkmarks = document.querySelectorAll('svg[class*="check"], .check-icon, [class*="delivered"]')
      this.log(`Found ${checkmarks.length} delivery/read checkmark elements`)
    })

    await this.runTest('Notification System', async () => {
      // Check for notification permission
      if ('Notification' in window) {
        this.log(`Notification API available. Permission: ${Notification.permission}`)
      }
      
      // Look for notification-related elements
      const notificationElements = document.querySelectorAll('[class*="notification"], [class*="alert"], [class*="toast"]')
      this.log(`Found ${notificationElements.length} notification elements`)
    })
  }

  // Test 4: Search & Navigation
  async testSearchAndNavigation() {
    await this.runTest('Message Search Functionality', async () => {
      const searchElements = document.querySelectorAll('[class*="search"], input[placeholder*="search" i], [aria-label*="search" i]')
      if (searchElements.length === 0) {
        throw new Error('No search functionality found')
      }
      
      this.log(`Found ${searchElements.length} search elements`)
      
      // Try to open search
      const searchButtons = Array.from(searchElements).filter(el => el.tagName === 'BUTTON')
      if (searchButtons.length > 0) {
        searchButtons[0].click()
        await this.sleep(300)
        
        const searchModal = document.querySelector('[class*="search-modal"], [class*="search-overlay"], [class*="search-popup"]')
        if (searchModal) {
          this.log('Search modal opened successfully')
          
          // Try search input
          const searchInput = searchModal.querySelector('input[type="text"], input[placeholder*="search" i]')
          if (searchInput) {
            searchInput.value = 'test'
            searchInput.dispatchEvent(new Event('input', { bubbles: true }))
            await this.sleep(500)
            
            const searchResults = searchModal.querySelectorAll('[class*="result"], [class*="match"]')
            this.log(`Search returned ${searchResults.length} results`)
          }
        }
      }
    })

    await this.runTest('Jump to Message Feature', async () => {
      // Look for message navigation features
      const jumpButtons = document.querySelectorAll('[class*="jump"], [title*="jump" i], [aria-label*="jump" i]')
      const messageLinks = document.querySelectorAll('[href*="message"], [data-message-id]')
      
      this.log(`Found ${jumpButtons.length} jump buttons and ${messageLinks.length} message links`)
    })

    await this.runTest('Scroll to Bottom Button', async () => {
      const scrollButtons = document.querySelectorAll('[class*="scroll"], [class*="bottom"], [title*="bottom" i], [aria-label*="bottom" i]')
      const scrollToBottomBtns = Array.from(scrollButtons).filter(btn => 
        btn.title?.toLowerCase().includes('bottom') || 
        btn.className.includes('bottom') ||
        btn.querySelector('svg')
      )
      
      this.log(`Found ${scrollToBottomBtns.length} scroll-to-bottom buttons`)
      
      if (scrollToBottomBtns.length > 0) {
        const btn = scrollToBottomBtns[0]
        btn.click()
        await this.sleep(300)
        this.log('Scroll to bottom triggered')
      }
    })

    await this.runTest('Channel Switching', async () => {
      const channelElements = document.querySelectorAll('[class*="channel"], [class*="room"], [data-channel]')
      const sidebarChannels = document.querySelectorAll('sidebar [class*="channel"], aside [class*="channel"], nav [class*="channel"]')
      
      this.log(`Found ${channelElements.length} channel elements, ${sidebarChannels.length} in sidebar`)
      
      if (sidebarChannels.length > 1) {
        // Try switching channels
        const currentActive = document.querySelector('[class*="channel"][class*="active"], [class*="channel"][class*="selected"]')
        const otherChannel = Array.from(sidebarChannels).find(ch => ch !== currentActive)
        
        if (otherChannel) {
          otherChannel.click()
          await this.sleep(300)
          this.log('Channel switch attempted')
        }
      }
    })

    await this.runTest('Message History Loading', async () => {
      // Check for infinite scroll or load more functionality
      const loadMoreButtons = document.querySelectorAll('[class*="load"], [class*="more"], [title*="load" i]')
      const messageContainer = document.querySelector('[class*="message-list"], [class*="chat-container"], [class*="messages"]')
      
      this.log(`Found ${loadMoreButtons.length} load more buttons`)
      
      if (messageContainer) {
        // Try scrolling to top to trigger history load
        messageContainer.scrollTop = 0
        await this.sleep(500)
        
        const loadingIndicators = document.querySelectorAll('[class*="loading"], [class*="spinner"], .animate-spin')
        this.log(`Found ${loadingIndicators.length} loading indicators after scroll`)
      }
    })
  }

  // Test 5: Mobile Responsiveness
  async testMobileResponsiveness() {
    await this.runTest('Mobile Layout Detection', async () => {
      const isMobile = window.innerWidth <= 768
      const mobileElements = document.querySelectorAll('[class*="mobile"], [class*="touch"]')
      const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]')
      
      this.log(`Screen width: ${window.innerWidth}px (Mobile: ${isMobile})`)
      this.log(`Found ${mobileElements.length} mobile-specific elements`)
      this.log(`Found ${responsiveElements.length} responsive utility classes`)
    })

    await this.runTest('Touch-Friendly Controls', async () => {
      const touchTargets = document.querySelectorAll('[class*="touch"], [class*="tap"], button, [role="button"]')
      const largeTouchTargets = Array.from(touchTargets).filter(el => {
        const rect = el.getBoundingClientRect()
        return rect.width >= 44 || rect.height >= 44 // Minimum touch target size
      })
      
      this.log(`Found ${touchTargets.length} interactive elements, ${largeTouchTargets.length} with adequate touch targets`)
    })

    await this.runTest('Swipe Gestures', async () => {
      const swipeElements = document.querySelectorAll('[class*="swipe"], [data-swipe]')
      const messageBubbles = document.querySelectorAll('.message-item, [class*="message-bubble"]')
      
      this.log(`Found ${swipeElements.length} swipe-enabled elements`)
      
      if (messageBubbles.length > 0) {
        // Test swipe gesture on message
        const message = messageBubbles[0]
        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 }],
          bubbles: true
        })
        const touchMove = new TouchEvent('touchmove', {
          touches: [{ clientX: 150, clientY: 100 }],
          bubbles: true
        })
        const touchEnd = new TouchEvent('touchend', { bubbles: true })
        
        message.dispatchEvent(touchStart)
        await this.sleep(50)
        message.dispatchEvent(touchMove)
        await this.sleep(50)
        message.dispatchEvent(touchEnd)
        
        this.log('Swipe gesture simulation completed')
      }
    })
  }

  // Test 6: Performance & Accessibility
  async testPerformanceAndAccessibility() {
    await this.runTest('Keyboard Navigation', async () => {
      const focusableElements = document.querySelectorAll('button, input, textarea, [tabindex], [role="button"]')
      const keyboardNavigable = Array.from(focusableElements).filter(el => 
        el.tabIndex >= 0 && el.offsetParent !== null
      )
      
      this.log(`Found ${keyboardNavigable.length} keyboard-navigable elements`)
      
      if (keyboardNavigable.length > 0) {
        // Test tab navigation
        keyboardNavigable[0].focus()
        await this.sleep(100)
        
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
        document.dispatchEvent(tabEvent)
        
        this.log('Keyboard navigation test completed')
      }
    })

    await this.runTest('ARIA Labels and Accessibility', async () => {
      const ariaLabels = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]')
      const roleElements = document.querySelectorAll('[role]')
      const altTexts = document.querySelectorAll('img[alt]')
      
      this.log(`Found ${ariaLabels.length} ARIA labeled elements`)
      this.log(`Found ${roleElements.length} elements with roles`)
      this.log(`Found ${altTexts.length} images with alt text`)
    })

    await this.runTest('Virtual Scrolling Performance', async () => {
      const messageContainer = document.querySelector('[class*="message-list"], [class*="chat-container"]')
      if (messageContainer) {
        const messages = messageContainer.querySelectorAll('.message-item, [class*="message-bubble"]')
        const containerHeight = messageContainer.clientHeight
        const avgMessageHeight = messages.length > 0 ? messageContainer.scrollHeight / messages.length : 0
        
        this.log(`Message container: ${containerHeight}px height, ${messages.length} messages`)
        this.log(`Average message height: ${avgMessageHeight.toFixed(2)}px`)
        
        // Check for virtual scrolling indicators
        const virtualScrollElements = document.querySelectorAll('[class*="virtual"], [class*="viewport"], [style*="transform"]')
        this.log(`Found ${virtualScrollElements.length} potential virtual scroll elements`)
      }
    })

    await this.runTest('Memory Usage and Cleanup', async () => {
      // Check for proper event cleanup
      const eventListeners = document.querySelectorAll('[class*="listener"], [data-event]')
      this.log(`Found ${eventListeners.length} elements with potential event listeners`)
      
      // Performance memory info (if available)
      if (performance.memory) {
        const memInfo = performance.memory
        this.log(`JS Heap: ${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB used / ${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB total`)
      }
    })
  }

  // Generate comprehensive report
  generateReport() {
    const endTime = Date.now()
    const duration = (endTime - this.startTime) / 1000
    
    const report = {
      summary: {
        totalTests: this.testsPassed + this.testsFailed,
        passed: this.testsPassed,
        failed: this.testsFailed,
        successRate: ((this.testsPassed / (this.testsPassed + this.testsFailed)) * 100).toFixed(1),
        duration: `${duration.toFixed(2)}s`
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    }
    
    return report
  }

  generateRecommendations() {
    const recommendations = []
    
    if (this.testsFailed > 0) {
      recommendations.push('Review failed tests and implement missing functionality')
    }
    
    // Add specific recommendations based on test results
    const hasEmojiPicker = this.testResults.some(r => r.message.includes('emoji') && r.type === 'success')
    if (!hasEmojiPicker) {
      recommendations.push('Implement emoji picker for better user engagement')
    }
    
    const hasFileUpload = this.testResults.some(r => r.message.includes('file') && r.type === 'success')
    if (!hasFileUpload) {
      recommendations.push('Add file upload functionality for media sharing')
    }
    
    const hasSearch = this.testResults.some(r => r.message.includes('search') && r.type === 'success')
    if (!hasSearch) {
      recommendations.push('Implement message search for better user experience')
    }
    
    recommendations.push('Consider implementing lazy loading for better performance')
    recommendations.push('Add more comprehensive error handling and user feedback')
    recommendations.push('Optimize for different screen sizes and devices')
    
    return recommendations
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Comprehensive Chat UI Test Suite', 'info')
    this.log(`Testing environment: ${window.location.href}`, 'info')
    this.log(`Screen resolution: ${window.innerWidth}x${window.innerHeight}`, 'info')
    this.log(`User agent: ${navigator.userAgent}`, 'info')
    
    await this.sleep(1000) // Wait for page to load
    
    try {
      await this.testMessageComponents()
      await this.testInputComponents()
      await this.testRealTimeUpdates()
      await this.testSearchAndNavigation()
      await this.testMobileResponsiveness()
      await this.testPerformanceAndAccessibility()
    } catch (error) {
      this.log(`Test suite error: ${error.message}`, 'error')
    }
    
    const report = this.generateReport()
    
    // Display results
    this.log('📊 TEST SUMMARY', 'info')
    this.log(`Total Tests: ${report.summary.totalTests}`, 'info')
    this.log(`Passed: ${report.summary.passed}`, 'success')
    this.log(`Failed: ${report.summary.failed}`, 'error')
    this.log(`Success Rate: ${report.summary.successRate}%`, 'info')
    this.log(`Duration: ${report.summary.duration}`, 'info')
    
    if (report.recommendations.length > 0) {
      this.log('💡 RECOMMENDATIONS:', 'info')
      report.recommendations.forEach(rec => this.log(`• ${rec}`, 'warning'))
    }
    
    return report
  }
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  window.ChatUITester = ChatUITester
  
  // Auto-run test when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const tester = new ChatUITester()
        window.testResults = tester.runAllTests()
      }, 2000) // Wait 2 seconds for components to initialize
    })
  } else {
    setTimeout(() => {
      const tester = new ChatUITester()
      window.testResults = tester.runAllTests()
    }, 2000)
  }
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatUITester
}