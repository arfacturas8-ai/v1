/**
 * WebSocket Fallback Service
 * Provides polling fallback when WebSocket connections fail
 * Handles restrictive firewalls and unreliable networks
 */

class WebSocketFallback {
  constructor() {
    this.socket = null
    this.usePolling = false
    this.pollingInterval = null
    this.eventHandlers = new Map()
    this.connectionAttempts = 0
    this.maxConnectionAttempts = 3
    this.pollingRate = 2000 // 2 seconds
    this.reconnectDelay = 5000 // 5 seconds
    this.lastMessageTimestamp = Date.now()
  }

  /**
   * Connect to WebSocket with automatic fallback to polling
   */
  async connect(url, options = {}) {
    try {
      // Try WebSocket first
      await this.connectWebSocket(url, options)
    } catch (error) {
      console.warn('WebSocket connection failed, falling back to polling:', error)
      this.usePolling = true
      this.startPolling(options.pollingEndpoint || '/api/events/poll')
    }
  }

  /**
   * Attempt WebSocket connection
   */
  connectWebSocket(url, options) {
    return new Promise((resolve, reject) => {
      try {
        const socketUrl = url || import.meta.env.VITE_WEBSOCKET_URL || 'wss://api.cryb.ai'
        this.socket = new WebSocket(socketUrl)

        this.socket.onopen = () => {
          console.log('WebSocket connected successfully')
          this.connectionAttempts = 0
          this.usePolling = false

          // Authenticate if token provided
          if (options.auth) {
            this.socket.send(JSON.stringify({
              type: 'auth',
              token: options.auth.token
            }))
          }

          resolve()
        }

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.connectionAttempts++

          if (this.connectionAttempts >= this.maxConnectionAttempts) {
            reject(new Error('WebSocket connection failed after multiple attempts'))
          }
        }

        this.socket.onclose = () => {
          console.log('WebSocket disconnected')

          if (!this.usePolling && this.connectionAttempts < this.maxConnectionAttempts) {
            // Attempt to reconnect
            setTimeout(() => {
              console.log('Attempting to reconnect...')
              this.connectWebSocket(url, options).catch(() => {
                this.usePolling = true
                this.startPolling(options.pollingEndpoint)
              })
            }, this.reconnectDelay)
          }
        }

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.socket.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'))
          }
        }, 10000)

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Start HTTP long-polling as fallback
   */
  startPolling(endpoint) {
    console.log('Starting HTTP polling fallback')

    const poll = async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('cryb_session_token')}`
          },
          body: JSON.stringify({
            lastTimestamp: this.lastMessageTimestamp
          })
        })

        if (response.ok) {
          const data = await response.json()

          if (data.events && data.events.length > 0) {
            data.events.forEach(event => {
              this.handleMessage(JSON.stringify(event))
            })

            this.lastMessageTimestamp = data.events[data.events.length - 1].timestamp
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Initial poll
    poll()

    // Set up interval polling
    this.pollingInterval = setInterval(poll, this.pollingRate)
  }

  /**
   * Handle incoming messages (from WebSocket or polling)
   */
  handleMessage(data) {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data

      // Emit to all registered handlers for this event type
      const handlers = this.eventHandlers.get(message.type) || []
      handlers.forEach(handler => {
        try {
          handler(message.data || message)
        } catch (error) {
          console.error('Error in event handler:', error)
        }
      })
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  }

  /**
   * Register event handler
   */
  on(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }

    this.eventHandlers.get(eventType).push(handler)
  }

  /**
   * Unregister event handler
   */
  off(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) return

    const handlers = this.eventHandlers.get(eventType)
    const index = handlers.indexOf(handler)

    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  /**
   * Send message (via WebSocket or HTTP POST)
   */
  async emit(eventType, data) {
    const message = { type: eventType, data }

    if (this.usePolling) {
      // Send via HTTP POST
      try {
        await fetch('/api/events/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('cryb_session_token')}`
          },
          body: JSON.stringify(message)
        })
      } catch (error) {
        console.error('Error sending message via HTTP:', error)
        throw error
      }
    } else {
      // Send via WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message))
      } else {
        throw new Error('WebSocket not connected')
      }
    }
  }

  /**
   * Disconnect and clean up
   */
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    this.eventHandlers.clear()
    this.usePolling = false
    this.connectionAttempts = 0
  }

  /**
   * Check connection status
   */
  isConnected() {
    if (this.usePolling) {
      return this.pollingInterval !== null
    }

    return this.socket && this.socket.readyState === WebSocket.OPEN
  }

  /**
   * Get connection type
   */
  getConnectionType() {
    return this.usePolling ? 'polling' : 'websocket'
  }
}

// Singleton instance
const websocketFallback = new WebSocketFallback()

export default websocketFallback
