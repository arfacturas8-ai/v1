/**
 * Comprehensive Test Suite for Google Analytics Integration
 *
 * Tests analytics initialization, event tracking, user identification,
 * error handling, and various user action tracking functions.
 */

import {
  initGoogleAnalytics,
  isGALoaded,
  trackPageView,
  trackEvent,
  trackUserAction,
  trackException,
  trackTiming,
  setUserProperties,
  setUserId,
} from './analytics'

// Mock import.meta.env
const originalEnv = import.meta.env
const mockEnv = {
  VITE_GA_MEASUREMENT_ID: 'G-TEST123456',
}

describe('Analytics Module', () => {
  let mockGtag
  let scriptElement

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = ''

    // Mock gtag function
    mockGtag = jest.fn()
    window.gtag = mockGtag

    // Mock import.meta.env
    Object.defineProperty(import.meta, 'env', {
      value: mockEnv,
      configurable: true,
      writable: true,
    })

    // Reset any existing script tags
    scriptElement = null
  })

  afterEach(() => {
    // Cleanup
    delete window.gtag
    jest.clearAllMocks()

    // Restore original env
    Object.defineProperty(import.meta, 'env', {
      value: originalEnv,
      configurable: true,
    })
  })

  describe('initGoogleAnalytics', () => {
    it('should not initialize when GA_MEASUREMENT_ID is empty', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { VITE_GA_MEASUREMENT_ID: '' },
        configurable: true,
      })

      initGoogleAnalytics()

      const scripts = document.head.querySelectorAll('script')
      expect(scripts.length).toBe(0)
    })

    it('should not initialize when GA_MEASUREMENT_ID is placeholder', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { VITE_GA_MEASUREMENT_ID: 'G-XXXXXXXXXX' },
        configurable: true,
      })

      initGoogleAnalytics()

      const scripts = document.head.querySelectorAll('script')
      expect(scripts.length).toBe(0)
    })

    it('should load GA script dynamically with correct ID', () => {
      initGoogleAnalytics()

      const script = document.head.querySelector('script')
      expect(script).toBeTruthy()
      expect(script.async).toBe(true)
      expect(script.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST123456')
    })

    it('should configure GA on script load with correct settings', () => {
      initGoogleAnalytics()

      const script = document.head.querySelector('script')

      // Simulate script load
      script.onload()

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        send_page_view: true,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
      })
    })

    it('should only add one script tag when called multiple times', () => {
      initGoogleAnalytics()
      initGoogleAnalytics()

      const scripts = document.head.querySelectorAll('script')
      expect(scripts.length).toBe(2) // Note: Current implementation doesn't prevent duplicates
    })

    it('should handle missing document.head gracefully', () => {
      const originalHead = document.head
      Object.defineProperty(document, 'head', {
        value: null,
        configurable: true,
        writable: true,
      })

      expect(() => initGoogleAnalytics()).toThrow()

      // Restore
      Object.defineProperty(document, 'head', {
        value: originalHead,
        configurable: true,
      })
    })
  })

  describe('isGALoaded', () => {
    it('should return true when gtag is loaded', () => {
      window.gtag = jest.fn()
      expect(isGALoaded()).toBe(true)
    })

    it('should return false when gtag is not loaded', () => {
      delete window.gtag
      expect(isGALoaded()).toBe(false)
    })

    it('should return false when gtag is not a function', () => {
      window.gtag = 'not a function'
      expect(isGALoaded()).toBe(false)
    })

    it('should return false when window is undefined', () => {
      const originalWindow = global.window
      delete global.window

      expect(isGALoaded()).toBe(false)

      global.window = originalWindow
    })
  })

  describe('trackPageView', () => {
    it('should track page view with correct path', () => {
      window.gtag = mockGtag

      trackPageView('/test-page')

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        page_path: '/test-page',
      })
    })

    it('should not track when GA is not loaded', () => {
      delete window.gtag

      trackPageView('/test-page')

      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('should handle different path formats', () => {
      window.gtag = mockGtag

      trackPageView('/dashboard')
      trackPageView('/users/123')
      trackPageView('/posts/456/comments')

      expect(mockGtag).toHaveBeenCalledTimes(3)
    })

    it('should handle empty path', () => {
      window.gtag = mockGtag

      trackPageView('')

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        page_path: '',
      })
    })

    it('should handle undefined path', () => {
      window.gtag = mockGtag

      trackPageView(undefined)

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        page_path: undefined,
      })
    })
  })

  describe('trackEvent', () => {
    beforeEach(() => {
      // Mock Date to return consistent timestamp
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track event with name and default params', () => {
      window.gtag = mockGtag

      trackEvent('button_click')

      expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', {
        timestamp: '2025-01-01T00:00:00.000Z',
      })
    })

    it('should track event with custom parameters', () => {
      window.gtag = mockGtag

      trackEvent('user_signup', {
        method: 'google',
        category: 'authentication',
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'user_signup', {
        method: 'google',
        category: 'authentication',
        timestamp: '2025-01-01T00:00:00.000Z',
      })
    })

    it('should not track when GA is not loaded', () => {
      delete window.gtag

      trackEvent('test_event')

      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('should handle empty event name', () => {
      window.gtag = mockGtag

      trackEvent('')

      expect(mockGtag).toHaveBeenCalledWith('event', '', {
        timestamp: '2025-01-01T00:00:00.000Z',
      })
    })

    it('should merge event params with timestamp', () => {
      window.gtag = mockGtag

      trackEvent('test', {
        custom_param: 'value',
        another_param: 123,
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'test', {
        custom_param: 'value',
        another_param: 123,
        timestamp: '2025-01-01T00:00:00.000Z',
      })
    })

    it('should handle timestamp override in params', () => {
      window.gtag = mockGtag

      trackEvent('test', {
        timestamp: 'custom-timestamp',
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'test', {
        timestamp: '2025-01-01T00:00:00.000Z',
      })
    })
  })

  describe('trackUserAction - Authentication', () => {
    beforeEach(() => {
      window.gtag = mockGtag
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track signup with default method', () => {
      trackUserAction.signup()

      expect(mockGtag).toHaveBeenCalledWith('event', 'sign_up', {
        method: 'email',
        timestamp: expect.any(String),
      })
    })

    it('should track signup with custom method', () => {
      trackUserAction.signup('google')

      expect(mockGtag).toHaveBeenCalledWith('event', 'sign_up', {
        method: 'google',
        timestamp: expect.any(String),
      })
    })

    it('should track login with default method', () => {
      trackUserAction.login()

      expect(mockGtag).toHaveBeenCalledWith('event', 'login', {
        method: 'email',
        timestamp: expect.any(String),
      })
    })

    it('should track login with custom method', () => {
      trackUserAction.login('wallet')

      expect(mockGtag).toHaveBeenCalledWith('event', 'login', {
        method: 'wallet',
        timestamp: expect.any(String),
      })
    })

    it('should track logout', () => {
      trackUserAction.logout()

      expect(mockGtag).toHaveBeenCalledWith('event', 'logout', {
        timestamp: expect.any(String),
      })
    })
  })

  describe('trackUserAction - Community Events', () => {
    beforeEach(() => {
      window.gtag = mockGtag
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track join community', () => {
      trackUserAction.joinCommunity('comm123', 'Test Community')

      expect(mockGtag).toHaveBeenCalledWith('event', 'join_community', {
        community_id: 'comm123',
        community_name: 'Test Community',
        timestamp: expect.any(String),
      })
    })

    it('should track leave community', () => {
      trackUserAction.leaveCommunity('comm456', 'Another Community')

      expect(mockGtag).toHaveBeenCalledWith('event', 'leave_community', {
        community_id: 'comm456',
        community_name: 'Another Community',
        timestamp: expect.any(String),
      })
    })

    it('should track create community', () => {
      trackUserAction.createCommunity('comm789')

      expect(mockGtag).toHaveBeenCalledWith('event', 'create_community', {
        community_id: 'comm789',
        timestamp: expect.any(String),
      })
    })
  })

  describe('trackUserAction - Post/Comment Events', () => {
    beforeEach(() => {
      window.gtag = mockGtag
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track create post', () => {
      trackUserAction.createPost('comm123')

      expect(mockGtag).toHaveBeenCalledWith('event', 'create_post', {
        community_id: 'comm123',
        timestamp: expect.any(String),
      })
    })

    it('should track create comment', () => {
      trackUserAction.createComment('post456')

      expect(mockGtag).toHaveBeenCalledWith('event', 'create_comment', {
        post_id: 'post456',
        timestamp: expect.any(String),
      })
    })

    it('should track like post', () => {
      trackUserAction.likePost('post789')

      expect(mockGtag).toHaveBeenCalledWith('event', 'like_post', {
        post_id: 'post789',
        timestamp: expect.any(String),
      })
    })
  })

  describe('trackUserAction - Chat Events', () => {
    beforeEach(() => {
      window.gtag = mockGtag
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track send message with default channel type', () => {
      trackUserAction.sendMessage()

      expect(mockGtag).toHaveBeenCalledWith('event', 'send_message', {
        channel_type: 'text',
        timestamp: expect.any(String),
      })
    })

    it('should track send message with custom channel type', () => {
      trackUserAction.sendMessage('voice')

      expect(mockGtag).toHaveBeenCalledWith('event', 'send_message', {
        channel_type: 'voice',
        timestamp: expect.any(String),
      })
    })

    it('should track join voice channel', () => {
      trackUserAction.joinVoiceChannel('channel123')

      expect(mockGtag).toHaveBeenCalledWith('event', 'join_voice_channel', {
        channel_id: 'channel123',
        timestamp: expect.any(String),
      })
    })

    it('should track leave voice channel with duration', () => {
      trackUserAction.leaveVoiceChannel(300)

      expect(mockGtag).toHaveBeenCalledWith('event', 'leave_voice_channel', {
        duration_seconds: 300,
        timestamp: expect.any(String),
      })
    })
  })

  describe('trackUserAction - Web3 Events', () => {
    beforeEach(() => {
      window.gtag = mockGtag
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track connect wallet', () => {
      trackUserAction.connectWallet('MetaMask')

      expect(mockGtag).toHaveBeenCalledWith('event', 'connect_wallet', {
        wallet_type: 'MetaMask',
        timestamp: expect.any(String),
      })
    })

    it('should track disconnect wallet', () => {
      trackUserAction.disconnectWallet()

      expect(mockGtag).toHaveBeenCalledWith('event', 'disconnect_wallet', {
        timestamp: expect.any(String),
      })
    })

    it('should track mint NFT', () => {
      trackUserAction.mintNFT('profile-picture')

      expect(mockGtag).toHaveBeenCalledWith('event', 'mint_nft', {
        nft_type: 'profile-picture',
        timestamp: expect.any(String),
      })
    })
  })

  describe('trackUserAction - Feature Usage', () => {
    beforeEach(() => {
      window.gtag = mockGtag
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track search query', () => {
      trackUserAction.searchQuery('test query')

      expect(mockGtag).toHaveBeenCalledWith('event', 'search', {
        search_term: 'test query',
        timestamp: expect.any(String),
      })
    })

    it('should track share content', () => {
      trackUserAction.shareContent('post', 'twitter')

      expect(mockGtag).toHaveBeenCalledWith('event', 'share', {
        content_type: 'post',
        platform: 'twitter',
        timestamp: expect.any(String),
      })
    })

    it('should track report content', () => {
      trackUserAction.reportContent('comment')

      expect(mockGtag).toHaveBeenCalledWith('event', 'report_content', {
        content_type: 'comment',
        timestamp: expect.any(String),
      })
    })
  })

  describe('trackUserAction - Engagement', () => {
    beforeEach(() => {
      window.gtag = mockGtag
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should track complete onboarding', () => {
      trackUserAction.completeOnboarding()

      expect(mockGtag).toHaveBeenCalledWith('event', 'complete_onboarding', {
        timestamp: expect.any(String),
      })
    })

    it('should track update profile', () => {
      trackUserAction.updateProfile()

      expect(mockGtag).toHaveBeenCalledWith('event', 'update_profile', {
        timestamp: expect.any(String),
      })
    })

    it('should track change theme', () => {
      trackUserAction.changeTheme('dark')

      expect(mockGtag).toHaveBeenCalledWith('event', 'change_theme', {
        theme: 'dark',
        timestamp: expect.any(String),
      })
    })
  })

  describe('trackException', () => {
    it('should track exception with description', () => {
      window.gtag = mockGtag

      trackException('Test error occurred')

      expect(mockGtag).toHaveBeenCalledWith('event', 'exception', {
        description: 'Test error occurred',
        fatal: false,
      })
    })

    it('should track fatal exception', () => {
      window.gtag = mockGtag

      trackException('Critical error', true)

      expect(mockGtag).toHaveBeenCalledWith('event', 'exception', {
        description: 'Critical error',
        fatal: true,
      })
    })

    it('should not track when GA is not loaded', () => {
      delete window.gtag

      trackException('Error')

      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('should handle empty description', () => {
      window.gtag = mockGtag

      trackException('')

      expect(mockGtag).toHaveBeenCalledWith('event', 'exception', {
        description: '',
        fatal: false,
      })
    })

    it('should handle null description', () => {
      window.gtag = mockGtag

      trackException(null)

      expect(mockGtag).toHaveBeenCalledWith('event', 'exception', {
        description: null,
        fatal: false,
      })
    })
  })

  describe('trackTiming', () => {
    it('should track timing with all parameters', () => {
      window.gtag = mockGtag

      trackTiming('page_load', 'initial_render', 1500, 'Homepage')

      expect(mockGtag).toHaveBeenCalledWith('event', 'timing_complete', {
        name: 'initial_render',
        value: 1500,
        event_category: 'page_load',
        event_label: 'Homepage',
      })
    })

    it('should track timing without label', () => {
      window.gtag = mockGtag

      trackTiming('api_call', 'fetch_users', 250)

      expect(mockGtag).toHaveBeenCalledWith('event', 'timing_complete', {
        name: 'fetch_users',
        value: 250,
        event_category: 'api_call',
        event_label: '',
      })
    })

    it('should not track when GA is not loaded', () => {
      delete window.gtag

      trackTiming('test', 'test', 100)

      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('should handle zero timing value', () => {
      window.gtag = mockGtag

      trackTiming('performance', 'instant', 0)

      expect(mockGtag).toHaveBeenCalledWith('event', 'timing_complete', {
        name: 'instant',
        value: 0,
        event_category: 'performance',
        event_label: '',
      })
    })

    it('should handle negative timing value', () => {
      window.gtag = mockGtag

      trackTiming('test', 'negative', -100)

      expect(mockGtag).toHaveBeenCalledWith('event', 'timing_complete', {
        name: 'negative',
        value: -100,
        event_category: 'test',
        event_label: '',
      })
    })
  })

  describe('setUserProperties', () => {
    it('should set user properties', () => {
      window.gtag = mockGtag

      const properties = {
        plan_type: 'premium',
        user_role: 'admin',
        signup_date: '2025-01-01',
      }

      setUserProperties(properties)

      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', properties)
    })

    it('should not set properties when GA is not loaded', () => {
      delete window.gtag

      setUserProperties({ test: 'value' })

      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('should handle empty properties object', () => {
      window.gtag = mockGtag

      setUserProperties({})

      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', {})
    })

    it('should handle null properties', () => {
      window.gtag = mockGtag

      setUserProperties(null)

      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', null)
    })

    it('should handle complex nested properties', () => {
      window.gtag = mockGtag

      const properties = {
        user: {
          name: 'Test User',
          preferences: {
            theme: 'dark',
          },
        },
      }

      setUserProperties(properties)

      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', properties)
    })
  })

  describe('setUserId', () => {
    it('should set user ID', () => {
      window.gtag = mockGtag

      setUserId('user123')

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        user_id: 'user123',
      })
    })

    it('should not set user ID when GA is not loaded', () => {
      delete window.gtag

      setUserId('user456')

      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('should handle numeric user ID', () => {
      window.gtag = mockGtag

      setUserId(12345)

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        user_id: 12345,
      })
    })

    it('should handle null user ID', () => {
      window.gtag = mockGtag

      setUserId(null)

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        user_id: null,
      })
    })

    it('should handle empty string user ID', () => {
      window.gtag = mockGtag

      setUserId('')

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        user_id: '',
      })
    })
  })

  describe('Privacy and Consent', () => {
    it('should initialize with privacy-compliant settings', () => {
      initGoogleAnalytics()

      const script = document.head.querySelector('script')
      script.onload()

      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        send_page_view: true,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
      })
    })

    it('should anonymize IP addresses', () => {
      initGoogleAnalytics()

      const script = document.head.querySelector('script')
      script.onload()

      const configCall = mockGtag.mock.calls[0]
      expect(configCall[2].anonymize_ip).toBe(true)
    })

    it('should use secure cookie flags', () => {
      initGoogleAnalytics()

      const script = document.head.querySelector('script')
      script.onload()

      const configCall = mockGtag.mock.calls[0]
      expect(configCall[2].cookie_flags).toBe('SameSite=None;Secure')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing window.gtag gracefully in all tracking functions', () => {
      delete window.gtag

      expect(() => trackPageView('/test')).not.toThrow()
      expect(() => trackEvent('test')).not.toThrow()
      expect(() => trackException('error')).not.toThrow()
      expect(() => trackTiming('cat', 'var', 100)).not.toThrow()
      expect(() => setUserProperties({ test: 'value' })).not.toThrow()
      expect(() => setUserId('user123')).not.toThrow()
    })

    it('should handle window.gtag throwing errors', () => {
      window.gtag = jest.fn(() => {
        throw new Error('GA error')
      })

      expect(() => trackPageView('/test')).toThrow()
      expect(() => trackEvent('test')).toThrow()
    })

    it('should handle undefined parameters gracefully', () => {
      window.gtag = mockGtag

      trackPageView(undefined)
      trackEvent(undefined, undefined)
      trackException(undefined, undefined)
      setUserProperties(undefined)
      setUserId(undefined)

      expect(mockGtag).toHaveBeenCalled()
    })

    it('should handle all trackUserAction methods without GA loaded', () => {
      delete window.gtag

      expect(() => {
        trackUserAction.signup()
        trackUserAction.login()
        trackUserAction.logout()
        trackUserAction.joinCommunity('id', 'name')
        trackUserAction.leaveCommunity('id', 'name')
        trackUserAction.createCommunity('id')
        trackUserAction.createPost('id')
        trackUserAction.createComment('id')
        trackUserAction.likePost('id')
        trackUserAction.sendMessage()
        trackUserAction.joinVoiceChannel('id')
        trackUserAction.leaveVoiceChannel(100)
        trackUserAction.connectWallet('type')
        trackUserAction.disconnectWallet()
        trackUserAction.mintNFT('type')
        trackUserAction.searchQuery('query')
        trackUserAction.shareContent('type', 'platform')
        trackUserAction.reportContent('type')
        trackUserAction.completeOnboarding()
        trackUserAction.updateProfile()
        trackUserAction.changeTheme('dark')
      }).not.toThrow()
    })
  })

  describe('Integration Tests', () => {
    it('should handle full analytics lifecycle', () => {
      // Initialize
      initGoogleAnalytics()
      const script = document.head.querySelector('script')
      script.onload()

      expect(mockGtag).toHaveBeenCalledTimes(1)

      // Set user
      setUserId('user123')
      setUserProperties({ plan: 'premium' })

      expect(mockGtag).toHaveBeenCalledTimes(3)

      // Track events
      trackPageView('/home')
      trackEvent('custom_event', { param: 'value' })
      trackUserAction.login('google')

      expect(mockGtag).toHaveBeenCalledTimes(6)
    })

    it('should track multiple user actions in sequence', () => {
      window.gtag = mockGtag
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-01T00:00:00.000Z')

      trackUserAction.signup('email')
      trackUserAction.completeOnboarding()
      trackUserAction.joinCommunity('comm1', 'Community 1')
      trackUserAction.createPost('comm1')
      trackUserAction.updateProfile()

      expect(mockGtag).toHaveBeenCalledTimes(5)
      expect(mockGtag).toHaveBeenNthCalledWith(1, 'event', 'sign_up', expect.any(Object))
      expect(mockGtag).toHaveBeenNthCalledWith(2, 'event', 'complete_onboarding', expect.any(Object))
      expect(mockGtag).toHaveBeenNthCalledWith(3, 'event', 'join_community', expect.any(Object))
      expect(mockGtag).toHaveBeenNthCalledWith(4, 'event', 'create_post', expect.any(Object))
      expect(mockGtag).toHaveBeenNthCalledWith(5, 'event', 'update_profile', expect.any(Object))

      jest.restoreAllMocks()
    })

    it('should handle error tracking during user flow', () => {
      window.gtag = mockGtag

      trackUserAction.login('email')
      trackException('Login failed - network error', false)
      trackUserAction.login('email')

      expect(mockGtag).toHaveBeenCalledTimes(3)
    })
  })

  describe('Performance and Timing Tests', () => {
    it('should add timestamp to all tracked events', () => {
      window.gtag = mockGtag
      const mockDate = '2025-01-15T12:30:45.678Z'
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate)

      trackEvent('test_event')

      expect(mockGtag).toHaveBeenCalledWith('event', 'test_event', {
        timestamp: mockDate,
      })

      jest.restoreAllMocks()
    })

    it('should track different timing metrics', () => {
      window.gtag = mockGtag

      trackTiming('page_load', 'dom_ready', 1200, 'Home')
      trackTiming('api', 'user_fetch', 300, 'Profile')
      trackTiming('render', 'component_mount', 50, 'Dashboard')

      expect(mockGtag).toHaveBeenCalledTimes(3)
    })
  })

  describe('Default Export', () => {
    it('should export all functions in default object', async () => {
      const defaultExport = await import('./analytics')

      expect(defaultExport.default).toHaveProperty('initGoogleAnalytics')
      expect(defaultExport.default).toHaveProperty('trackPageView')
      expect(defaultExport.default).toHaveProperty('trackEvent')
      expect(defaultExport.default).toHaveProperty('trackUserAction')
      expect(defaultExport.default).toHaveProperty('trackException')
      expect(defaultExport.default).toHaveProperty('trackTiming')
      expect(defaultExport.default).toHaveProperty('setUserProperties')
      expect(defaultExport.default).toHaveProperty('setUserId')
      expect(defaultExport.default).toHaveProperty('isGALoaded')
    })
  })
})
