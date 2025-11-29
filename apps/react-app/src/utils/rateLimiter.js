/**
 * Client-Side Rate Limiter for API Requests
 *
 * Prevents overwhelming the backend with too many requests
 */

class RateLimiter {
  constructor() {
    // Store request timestamps by endpoint
    this.requestLog = new Map()

    // Rate limits configuration
    this.limits = {
      // Global limits
      global: {
        maxRequests: 100,
        windowMs: 60000, // 1 minute
      },

      // Per-endpoint limits
      search: {
        maxRequests: 10,
        windowMs: 10000, // 10 seconds
      },
      auth: {
        maxRequests: 5,
        windowMs: 60000, // 1 minute
      },
      upload: {
        maxRequests: 3,
        windowMs: 60000, // 1 minute
      },
      messages: {
        maxRequests: 30,
        windowMs: 10000, // 10 seconds
      },
      default: {
        maxRequests: 20,
        windowMs: 10000, // 10 seconds
      },
    }

    // Queue for rate-limited requests
    this.queue = []
    this.processing = false
  }

  /**
   * Get rate limit configuration for endpoint
   */
  getLimitConfig(endpoint) {
    // Check if endpoint matches specific limit
    if (endpoint.includes('/search')) return this.limits.search
    if (endpoint.includes('/auth')) return this.limits.auth
    if (endpoint.includes('/upload')) return this.limits.upload
    if (endpoint.includes('/messages')) return this.limits.messages

    return this.limits.default
  }

  /**
   * Check if request is allowed
   */
  isAllowed(endpoint) {
    const config = this.getLimitConfig(endpoint)
    const now = Date.now()

    // Get request log for this endpoint
    if (!this.requestLog.has(endpoint)) {
      this.requestLog.set(endpoint, [])
    }

    const log = this.requestLog.get(endpoint)

    // Remove old requests outside the time window
    const cutoff = now - config.windowMs
    const recentRequests = log.filter((timestamp) => timestamp > cutoff)

    // Update log
    this.requestLog.set(endpoint, recentRequests)

    // Check if under limit
    if (recentRequests.length >= config.maxRequests) {
      return false
    }

    // Check global limit
    const totalRequests = Array.from(this.requestLog.values())
      .flat()
      .filter((timestamp) => timestamp > now - this.limits.global.windowMs)

    if (totalRequests.length >= this.limits.global.maxRequests) {
      return false
    }

    return true
  }

  /**
   * Record a request
   */
  recordRequest(endpoint) {
    const now = Date.now()

    if (!this.requestLog.has(endpoint)) {
      this.requestLog.set(endpoint, [])
    }

    this.requestLog.get(endpoint).push(now)
  }

  /**
   * Wait until request is allowed (with exponential backoff)
   */
  async waitUntilAllowed(endpoint, attempt = 0) {
    if (this.isAllowed(endpoint)) {
      return true
    }

    // Max 5 retries
    if (attempt >= 5) {
      throw new Error(`Rate limit exceeded for ${endpoint} after 5 retries`)
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, attempt), 16000)


    await new Promise((resolve) => setTimeout(resolve, delay))

    return this.waitUntilAllowed(endpoint, attempt + 1)
  }

  /**
   * Clear old entries (cleanup)
   */
  cleanup() {
    const now = Date.now()
    const maxAge = Math.max(
      ...Object.values(this.limits).map((limit) => limit.windowMs)
    )

    for (const [endpoint, log] of this.requestLog.entries()) {
      const recentRequests = log.filter((timestamp) => timestamp > now - maxAge)

      if (recentRequests.length === 0) {
        this.requestLog.delete(endpoint)
      } else {
        this.requestLog.set(endpoint, recentRequests)
      }
    }
  }

  /**
   * Get remaining requests for endpoint
   */
  getRemaining(endpoint) {
    const config = this.getLimitConfig(endpoint)
    const now = Date.now()

    if (!this.requestLog.has(endpoint)) {
      return config.maxRequests
    }

    const log = this.requestLog.get(endpoint)
    const cutoff = now - config.windowMs
    const recentRequests = log.filter((timestamp) => timestamp > cutoff)

    return Math.max(0, config.maxRequests - recentRequests.length)
  }

  /**
   * Get time until next request is allowed
   */
  getRetryAfter(endpoint) {
    const config = this.getLimitConfig(endpoint)
    const now = Date.now()

    if (!this.requestLog.has(endpoint)) {
      return 0
    }

    const log = this.requestLog.get(endpoint)
    const cutoff = now - config.windowMs
    const recentRequests = log.filter((timestamp) => timestamp > cutoff)

    if (recentRequests.length < config.maxRequests) {
      return 0
    }

    // Oldest request will expire first
    const oldestRequest = Math.min(...recentRequests)
    const retryAfter = oldestRequest + config.windowMs - now

    return Math.max(0, retryAfter)
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

// Cleanup every minute
setInterval(() => {
  rateLimiter.cleanup()
}, 60000)

export default rateLimiter
