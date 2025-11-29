/**
 * Enterprise SFU Manager for CRYB Platform
 * Handles load balancing, failover, and scaling across multiple LiveKit servers
 * Supports unlimited participants with automatic server selection
 */

class SFUManager {
  constructor() {
    this.servers = new Map()
    this.activeConnections = new Map()
    this.serverHealthChecks = new Map()
    this.loadBalancingStrategy = 'weighted_round_robin' // round_robin, least_connections, weighted_round_robin, geographic
    this.failoverEnabled = true
    this.healthCheckInterval = 30000 // 30 seconds
    this.maxConnectionsPerServer = 1500
    this.geographicRegions = new Map()
    
    // Server performance metrics
    this.serverMetrics = new Map()
    
    // Initialize default servers
    this.initializeServers()
    
    // Start health monitoring
    this.startHealthMonitoring()
    
    // Setup geographic optimization
    this.setupGeographicOptimization()
  }

  initializeServers() {
    const servers = [
      {
        id: 'primary-us-east',
        url: 'wss://api.cryb.ai:7880',
        region: 'us-east-1',
        weight: 100,
        maxConnections: 2000,
        priority: 1,
        features: ['recording', 'transcription', 'spatial_audio']
      },
      {
        id: 'backup-us-east',
        url: 'wss://backup1.cryb.ai:7880',
        region: 'us-east-1',
        weight: 80,
        maxConnections: 1500,
        priority: 2,
        features: ['recording', 'spatial_audio']
      },
      {
        id: 'eu-central',
        url: 'wss://eu.cryb.ai:7880',
        region: 'eu-central-1',
        weight: 100,
        maxConnections: 2000,
        priority: 1,
        features: ['recording', 'transcription', 'spatial_audio']
      },
      {
        id: 'asia-pacific',
        url: 'wss://asia.cryb.ai:7880',
        region: 'ap-southeast-1',
        weight: 90,
        maxConnections: 1800,
        priority: 1,
        features: ['recording', 'spatial_audio']
      },
      {
        id: 'us-west',
        url: 'wss://west.cryb.ai:7880',
        region: 'us-west-2',
        weight: 95,
        maxConnections: 1800,
        priority: 1,
        features: ['recording', 'transcription', 'spatial_audio']
      }
    ]

    servers.forEach(server => {
      this.servers.set(server.id, {
        ...server,
        isHealthy: true,
        currentConnections: 0,
        lastHealthCheck: Date.now(),
        responseTime: 0,
        errorCount: 0,
        totalRequests: 0
      })
      
      this.serverMetrics.set(server.id, {
        cpuUsage: 0,
        memoryUsage: 0,
        bandwidth: 0,
        activeRooms: 0,
        totalParticipants: 0,
        qualityScore: 100
      })
    })
  }

  async selectOptimalServer(requirements = {}) {
    const {
      userLocation = null,
      requiredFeatures = [],
      roomSize = 1,
      qualityPreference = 'balanced' // performance, quality, balanced
    } = requirements

    // Filter servers based on requirements
    let availableServers = Array.from(this.servers.values()).filter(server => {
      // Check health
      if (!server.isHealthy) return false
      
      // Check capacity
      if (server.currentConnections + roomSize > server.maxConnections) return false
      
      // Check required features
      if (requiredFeatures.length > 0) {
        const hasAllFeatures = requiredFeatures.every(feature => 
          server.features.includes(feature)
        )
        if (!hasAllFeatures) return false
      }
      
      return true
    })

    if (availableServers.length === 0) {
      throw new Error('No available servers meet the requirements')
    }

    // Apply load balancing strategy
    let selectedServer
    switch (this.loadBalancingStrategy) {
      case 'geographic':
        selectedServer = this.selectByGeographicProximity(availableServers, userLocation)
        break
      case 'least_connections':
        selectedServer = this.selectByLeastConnections(availableServers)
        break
      case 'weighted_round_robin':
        selectedServer = this.selectByWeightedRoundRobin(availableServers)
        break
      case 'performance':
        selectedServer = this.selectByPerformance(availableServers, qualityPreference)
        break
      default:
        selectedServer = this.selectByRoundRobin(availableServers)
    }

    // Update connection count
    this.servers.get(selectedServer.id).currentConnections += roomSize
    
    return selectedServer
  }

  selectByGeographicProximity(servers, userLocation) {
    if (!userLocation) {
      return this.selectByLeastConnections(servers)
    }

    // Calculate distance to each server region
    const serversWithDistance = servers.map(server => {
      const regionCoords = this.getRegionCoordinates(server.region)
      const distance = this.calculateDistance(userLocation, regionCoords)
      return { ...server, distance }
    })

    // Sort by distance, then by performance
    serversWithDistance.sort((a, b) => {
      if (Math.abs(a.distance - b.distance) < 500) { // Within 500km, use performance
        const aScore = this.calculatePerformanceScore(a)
        const bScore = this.calculatePerformanceScore(b)
        return bScore - aScore
      }
      return a.distance - b.distance
    })

    return serversWithDistance[0]
  }

  selectByLeastConnections(servers) {
    return servers.reduce((min, server) => 
      server.currentConnections < min.currentConnections ? server : min
    )
  }

  selectByWeightedRoundRobin(servers) {
    // Calculate weighted scores
    const weightedServers = servers.map(server => {
      const loadFactor = 1 - (server.currentConnections / server.maxConnections)
      const performanceScore = this.calculatePerformanceScore(server)
      const score = server.weight * loadFactor * (performanceScore / 100)
      return { ...server, score }
    })

    // Select server with highest score
    return weightedServers.reduce((max, server) => 
      server.score > max.score ? server : max
    )
  }

  selectByPerformance(servers, qualityPreference) {
    const scoredServers = servers.map(server => {
      const metrics = this.serverMetrics.get(server.id)
      let score = 0

      switch (qualityPreference) {
        case 'performance':
          score = (100 - metrics.cpuUsage) * 0.4 + 
                  (100 - metrics.memoryUsage) * 0.3 + 
                  metrics.qualityScore * 0.3
          break
        case 'quality':
          score = metrics.qualityScore * 0.6 + 
                  server.responseTime > 0 ? (1000 / server.responseTime) * 0.4 : 0
          break
        default: // balanced
          score = (100 - metrics.cpuUsage) * 0.25 + 
                  (100 - metrics.memoryUsage) * 0.25 + 
                  metrics.qualityScore * 0.25 + 
                  (server.responseTime > 0 ? (1000 / server.responseTime) * 0.25 : 0)
      }

      return { ...server, score }
    })

    return scoredServers.reduce((max, server) => 
      server.score > max.score ? server : max
    )
  }

  selectByRoundRobin(servers) {
    // Simple round-robin selection
    const sortedServers = servers.sort((a, b) => a.totalRequests - b.totalRequests)
    return sortedServers[0]
  }

  calculatePerformanceScore(server) {
    const metrics = this.serverMetrics.get(server.id)
    if (!metrics) return 50

    const cpuScore = Math.max(0, 100 - metrics.cpuUsage)
    const memoryScore = Math.max(0, 100 - metrics.memoryUsage)
    const responseScore = server.responseTime > 0 ? Math.min(100, 1000 / server.responseTime) : 0
    const errorRate = server.totalRequests > 0 ? (server.errorCount / server.totalRequests) * 100 : 0
    const errorScore = Math.max(0, 100 - errorRate)

    return (cpuScore * 0.3 + memoryScore * 0.3 + responseScore * 0.2 + errorScore * 0.2)
  }

  getRegionCoordinates(region) {
    const coordinates = {
      'us-east-1': { lat: 39.0458, lng: -76.6413 },
      'us-west-2': { lat: 45.5152, lng: -122.6784 },
      'eu-central-1': { lat: 50.1109, lng: 8.6821 },
      'ap-southeast-1': { lat: 1.3521, lng: 103.8198 }
    }
    return coordinates[region] || { lat: 0, lng: 0 }
  }

  calculateDistance(point1, point2) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  async startHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthChecks()
    }, this.healthCheckInterval)

    // Initial health check
    await this.performHealthChecks()
  }

  async performHealthChecks() {
    const healthPromises = Array.from(this.servers.keys()).map(serverId => 
      this.checkServerHealth(serverId)
    )

    await Promise.allSettled(healthPromises)
  }

  async checkServerHealth(serverId) {
    const server = this.servers.get(serverId)
    if (!server) return

    const startTime = Date.now()
    
    try {
      // Perform health check (ping the server)
      const response = await fetch(`${server.url.replace('wss://', 'https://')}/health`, {
        method: 'GET',
        timeout: 5000
      })

      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const healthData = await response.json()
        
        // Update server status
        server.isHealthy = true
        server.responseTime = responseTime
        server.lastHealthCheck = Date.now()
        server.errorCount = Math.max(0, server.errorCount - 1) // Reduce error count on success
        
        // Update metrics if provided by health endpoint
        if (healthData.metrics) {
          this.serverMetrics.set(serverId, {
            ...this.serverMetrics.get(serverId),
            ...healthData.metrics,
            qualityScore: this.calculateQualityScore(healthData.metrics)
          })
        }
        
      } else {
        throw new Error(`Health check failed: ${response.status}`)
      }
    } catch (error) {
      
      server.errorCount++
      server.responseTime = Date.now() - startTime
      
      // Mark as unhealthy if multiple consecutive failures
      if (server.errorCount >= 3) {
        server.isHealthy = false
        console.error(`Server ${serverId} marked as unhealthy after ${server.errorCount} failures`)
        
        // Trigger failover for active connections
        if (this.failoverEnabled) {
          await this.triggerFailover(serverId)
        }
      }
    }
    
    server.totalRequests++
  }

  calculateQualityScore(metrics) {
    const cpuFactor = Math.max(0, 100 - (metrics.cpuUsage || 0))
    const memoryFactor = Math.max(0, 100 - (metrics.memoryUsage || 0))
    const bandwidthFactor = Math.min(100, (metrics.availableBandwidth || 1000) / 10)
    
    return (cpuFactor * 0.4 + memoryFactor * 0.4 + bandwidthFactor * 0.2)
  }

  async triggerFailover(failedServerId) {
    const activeConnections = this.getActiveConnectionsForServer(failedServerId)
    
    if (activeConnections.length === 0) return

    
    // Find alternative servers for each connection
    for (const connection of activeConnections) {
      try {
        const requirements = {
          requiredFeatures: connection.requiredFeatures || [],
          roomSize: connection.participantCount || 1,
          qualityPreference: connection.qualityPreference || 'balanced'
        }
        
        const newServer = await this.selectOptimalServer(requirements)
        
        // Notify the connection about server change
        connection.webrtcService.handleServerFailover(newServer, connection)
        
        // Update connection tracking
        this.moveConnection(connection.id, failedServerId, newServer.id)
        
      } catch (error) {
        console.error(`Failed to failover connection ${connection.id}:`, error)
      }
    }
  }

  getActiveConnectionsForServer(serverId) {
    return Array.from(this.activeConnections.values()).filter(
      connection => connection.serverId === serverId
    )
  }

  moveConnection(connectionId, fromServerId, toServerId) {
    const connection = this.activeConnections.get(connectionId)
    if (!connection) return

    // Update server connection counts
    const fromServer = this.servers.get(fromServerId)
    const toServer = this.servers.get(toServerId)
    
    if (fromServer) {
      fromServer.currentConnections = Math.max(0, fromServer.currentConnections - 1)
    }
    
    if (toServer) {
      toServer.currentConnections++
    }
    
    // Update connection tracking
    connection.serverId = toServerId
    this.activeConnections.set(connectionId, connection)
  }

  registerConnection(connectionId, serverId, connectionInfo) {
    this.activeConnections.set(connectionId, {
      id: connectionId,
      serverId,
      startTime: Date.now(),
      ...connectionInfo
    })
  }

  unregisterConnection(connectionId) {
    const connection = this.activeConnections.get(connectionId)
    if (!connection) return

    // Update server connection count
    const server = this.servers.get(connection.serverId)
    if (server) {
      server.currentConnections = Math.max(0, server.currentConnections - 1)
    }

    this.activeConnections.delete(connectionId)
  }

  setupGeographicOptimization() {
    // Geographic optimization DISABLED - no location permission requests
    // if (navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition(
    //     (position) => {
    //       this.userLocation = {
    //         lat: position.coords.latitude,
    //         lng: position.coords.longitude
    //       }
    //     },
    //     (error) => {
    //     }
    //   )
    // }
  }

  // Analytics and monitoring
  getServerStats() {
    const stats = {}
    
    for (const [serverId, server] of this.servers) {
      const metrics = this.serverMetrics.get(serverId)
      stats[serverId] = {
        ...server,
        metrics,
        performanceScore: this.calculatePerformanceScore(server),
        activeConnections: this.getActiveConnectionsForServer(serverId).length
      }
    }
    
    return stats
  }

  getLoadBalancingStats() {
    const totalConnections = Array.from(this.servers.values())
      .reduce((sum, server) => sum + server.currentConnections, 0)
    
    const serverDistribution = {}
    for (const [serverId, server] of this.servers) {
      serverDistribution[serverId] = {
        connections: server.currentConnections,
        percentage: totalConnections > 0 ? (server.currentConnections / totalConnections) * 100 : 0,
        capacity: (server.currentConnections / server.maxConnections) * 100
      }
    }
    
    return {
      totalConnections,
      activeServers: Array.from(this.servers.values()).filter(s => s.isHealthy).length,
      totalServers: this.servers.size,
      distribution: serverDistribution,
      strategy: this.loadBalancingStrategy
    }
  }

  // Configuration methods
  setLoadBalancingStrategy(strategy) {
    const validStrategies = ['round_robin', 'least_connections', 'weighted_round_robin', 'geographic', 'performance']
    if (validStrategies.includes(strategy)) {
      this.loadBalancingStrategy = strategy
    } else {
      throw new Error(`Invalid load balancing strategy: ${strategy}`)
    }
  }

  addServer(serverConfig) {
    const server = {
      ...serverConfig,
      isHealthy: true,
      currentConnections: 0,
      lastHealthCheck: Date.now(),
      responseTime: 0,
      errorCount: 0,
      totalRequests: 0
    }
    
    this.servers.set(server.id, server)
    this.serverMetrics.set(server.id, {
      cpuUsage: 0,
      memoryUsage: 0,
      bandwidth: 0,
      activeRooms: 0,
      totalParticipants: 0,
      qualityScore: 100
    })
    
  }

  removeServer(serverId) {
    if (this.servers.has(serverId)) {
      // Trigger failover for any active connections
      if (this.failoverEnabled) {
        this.triggerFailover(serverId)
      }
      
      this.servers.delete(serverId)
      this.serverMetrics.delete(serverId)
    }
  }

  // Cleanup
  destroy() {
    // Stop health monitoring
    clearInterval(this.healthCheckInterval)
    
    // Clear all data
    this.servers.clear()
    this.activeConnections.clear()
    this.serverMetrics.clear()
    this.serverHealthChecks.clear()
  }
}

// Export singleton instance
const sfuManager = new SFUManager()
export default sfuManager