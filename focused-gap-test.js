#!/usr/bin/env node

const axios = require('axios')
const fs = require('fs')

/**
 * Focused Gap Test - Tests specific functionality without rate limiting issues
 */

const API_BASE = 'http://localhost:3002'

class FocusedGapTest {
  constructor() {
    this.gaps = []
    this.working = []
  }

  async runTests() {
    console.log('🎯 Running Focused Gap Tests...\n')
    
    await this.testHealthEndpoints()
    await this.testApiStructure()
    await this.testAuthenticationSchema()
    await this.testRealTimeEndpoints()
    await this.testMediaEndpoints()
    await this.testSearchEndpoints()
    await this.testWebSocketConnection()
    
    this.generateFocusedReport()
  }

  async testHealthEndpoints() {
    console.log('🏥 Testing Health Endpoints...')
    
    try {
      const health = await axios.get(`${API_BASE}/health`)
      console.log(`   ✅ /health: ${health.data.status}`)
      this.working.push(`Health endpoint working: ${health.data.status}`)
      
      // Check individual service health
      if (health.data.checks) {
        Object.entries(health.data.checks).forEach(([service, status]) => {
          if (status === 'healthy') {
            this.working.push(`${service} service: healthy`)
          } else {
            this.gaps.push(`${service} service: ${status}`)
          }
        })
      }
    } catch (error) {
      this.gaps.push('Health endpoint not accessible')
    }

    try {
      const metrics = await axios.get(`${API_BASE}/metrics`)
      console.log('   ✅ /metrics: accessible')
      this.working.push('Metrics endpoint working')
    } catch (error) {
      this.gaps.push('Metrics endpoint not accessible')
    }
  }

  async testApiStructure() {
    console.log('🏗️ Testing API Structure...')
    
    // Test API root
    try {
      const apiRoot = await axios.get(`${API_BASE}/`)
      console.log('   ✅ API root accessible')
      this.working.push('API root endpoint accessible')
    } catch (error) {
      console.log('   ⚠️ API root not accessible (may be intentional)')
    }

    // Test API documentation
    try {
      const docs = await axios.get(`${API_BASE}/documentation`)
      console.log('   ✅ API documentation accessible')
      this.working.push('API documentation working')
    } catch (error) {
      this.gaps.push('API documentation not accessible')
    }

    // Test API version endpoints
    const versionedEndpoints = [
      '/api/v1',
      '/api/v1/status',
      '/api/v1/health'
    ]

    for (const endpoint of versionedEndpoints) {
      try {
        await axios.get(`${API_BASE}${endpoint}`)
        console.log(`   ✅ ${endpoint}: accessible`)
        this.working.push(`Endpoint accessible: ${endpoint}`)
      } catch (error) {
        if (error.response?.status === 404) {
          this.gaps.push(`Endpoint not found: ${endpoint}`)
        } else if (error.response?.status === 401) {
          this.working.push(`Endpoint exists but requires auth: ${endpoint}`)
        } else {
          this.gaps.push(`Endpoint error: ${endpoint} - ${error.message}`)
        }
      }
    }
  }

  async testAuthenticationSchema() {
    console.log('🔐 Testing Authentication Schema...')
    
    // Test auth endpoints exist
    const authEndpoints = [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/logout',
      '/api/v1/auth/refresh'
    ]

    for (const endpoint of authEndpoints) {
      try {
        // Use HEAD request to avoid rate limiting
        await axios.head(`${API_BASE}${endpoint}`)
        console.log(`   ✅ ${endpoint}: exists`)
        this.working.push(`Auth endpoint exists: ${endpoint}`)
      } catch (error) {
        if (error.response?.status === 405) {
          // Method not allowed means endpoint exists
          console.log(`   ✅ ${endpoint}: exists (HEAD not allowed)`)
          this.working.push(`Auth endpoint exists: ${endpoint}`)
        } else if (error.response?.status === 400 || error.response?.status === 422) {
          // Bad request means endpoint exists but needs data
          console.log(`   ✅ ${endpoint}: exists (needs valid data)`)
          this.working.push(`Auth endpoint exists: ${endpoint}`)
        } else if (error.response?.status === 404) {
          this.gaps.push(`Auth endpoint missing: ${endpoint}`)
        } else {
          console.log(`   ⚠️ ${endpoint}: ${error.response?.status || error.message}`)
        }
      }
    }

    // Test auth schema by sending empty POST (to get validation errors)
    try {
      await axios.post(`${API_BASE}/api/v1/auth/register`, {})
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.details?.validation) {
        console.log('   ✅ Auth validation working - registration requires fields')
        this.working.push('Auth validation schema working')
        
        const requiredFields = error.response.data.details.validation.unknown || []
        console.log(`   📋 Required fields: ${requiredFields.join(', ')}`)
      }
    }
  }

  async testRealTimeEndpoints() {
    console.log('🔄 Testing Real-time Endpoints...')
    
    // Test Socket.IO server presence
    try {
      const socketHealth = await axios.get(`${API_BASE}/socket.io/`)
      // Socket.IO usually returns 400 for GET requests, which means it's working
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Socket.IO server responding')
        this.working.push('Socket.IO server working')
      } else {
        this.gaps.push('Socket.IO server not responding properly')
      }
    }

    // Test realtime API endpoints
    const realtimeEndpoints = [
      '/api/v1/messages',
      '/api/v1/channels', 
      '/api/v1/servers'
    ]

    for (const endpoint of realtimeEndpoints) {
      try {
        await axios.get(`${API_BASE}${endpoint}`)
        console.log(`   ✅ ${endpoint}: accessible`)
        this.working.push(`Realtime endpoint accessible: ${endpoint}`)
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`   ✅ ${endpoint}: exists (requires auth)`)
          this.working.push(`Realtime endpoint exists: ${endpoint}`)
        } else if (error.response?.status === 404) {
          this.gaps.push(`Realtime endpoint missing: ${endpoint}`)
        }
      }
    }
  }

  async testMediaEndpoints() {
    console.log('📷 Testing Media Endpoints...')
    
    const mediaEndpoints = [
      '/api/v1/uploads',
      '/cdn',
      '/api/v1/uploads/health'
    ]

    for (const endpoint of mediaEndpoints) {
      try {
        await axios.get(`${API_BASE}${endpoint}`)
        console.log(`   ✅ ${endpoint}: accessible`)
        this.working.push(`Media endpoint accessible: ${endpoint}`)
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`   ✅ ${endpoint}: exists (requires auth)`)
          this.working.push(`Media endpoint exists: ${endpoint}`)
        } else if (error.response?.status === 404) {
          this.gaps.push(`Media endpoint missing: ${endpoint}`)
        } else if (error.response?.status === 405) {
          console.log(`   ✅ ${endpoint}: exists (wrong method)`)
          this.working.push(`Media endpoint exists: ${endpoint}`)
        }
      }
    }
  }

  async testSearchEndpoints() {
    console.log('🔍 Testing Search Endpoints...')
    
    try {
      await axios.get(`${API_BASE}/api/v1/search`)
      console.log('   ✅ Search endpoint accessible')
      this.working.push('Search endpoint working')
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Search endpoint exists (requires auth)')
        this.working.push('Search endpoint exists')
      } else if (error.response?.status === 400) {
        console.log('   ✅ Search endpoint exists (needs query)')
        this.working.push('Search endpoint exists')
      } else {
        this.gaps.push('Search endpoint not working')
      }
    }
  }

  async testWebSocketConnection() {
    console.log('🌐 Testing WebSocket Connection...')
    
    // Test if we can establish a WebSocket connection
    try {
      const WebSocket = require('ws')
      const ws = new WebSocket(`ws://localhost:3002/socket.io/?EIO=4&transport=websocket`)
      
      ws.on('open', () => {
        console.log('   ✅ WebSocket connection successful')
        this.working.push('WebSocket connection working')
        ws.close()
      })
      
      ws.on('error', (error) => {
        this.gaps.push('WebSocket connection failed')
      })
      
      // Give it a moment to connect
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      this.gaps.push('WebSocket library or connection issue')
    }
  }

  generateFocusedReport() {
    console.log('\n📊 FOCUSED GAP TEST REPORT')
    console.log('='*50)
    
    console.log(`\n✅ WORKING FEATURES (${this.working.length}):`)
    this.working.forEach(item => console.log(`   • ${item}`))
    
    console.log(`\n❌ IDENTIFIED GAPS (${this.gaps.length}):`)
    this.gaps.forEach(gap => console.log(`   • ${gap}`))
    
    console.log('\n🎯 SPECIFIC ISSUES FOUND:')
    
    // Categorize gaps
    const criticalGaps = this.gaps.filter(gap => 
      gap.includes('Health endpoint') || 
      gap.includes('Socket.IO') ||
      gap.includes('Auth endpoint missing')
    )
    
    const featureGaps = this.gaps.filter(gap => 
      gap.includes('endpoint missing') ||
      gap.includes('not accessible')
    )
    
    const configGaps = this.gaps.filter(gap => 
      gap.includes('service:') ||
      gap.includes('connection')
    )

    if (criticalGaps.length > 0) {
      console.log('\n🚨 CRITICAL GAPS:')
      criticalGaps.forEach(gap => console.log(`   • ${gap}`))
    }
    
    if (featureGaps.length > 0) {
      console.log('\n🔧 FEATURE GAPS:')
      featureGaps.forEach(gap => console.log(`   • ${gap}`))
    }
    
    if (configGaps.length > 0) {
      console.log('\n⚙️ CONFIGURATION GAPS:')
      configGaps.forEach(gap => console.log(`   • ${gap}`))
    }

    // Overall assessment
    const workingCount = this.working.length
    const gapCount = this.gaps.length
    const totalChecks = workingCount + gapCount
    const healthPercentage = Math.round((workingCount / totalChecks) * 100)
    
    console.log(`\n📈 FOCUSED HEALTH SCORE: ${healthPercentage}%`)
    console.log(`   (${workingCount} working out of ${totalChecks} checks)`)
    
    if (healthPercentage >= 90) {
      console.log('   🟢 EXCELLENT - Very few gaps found')
    } else if (healthPercentage >= 75) {
      console.log('   🟡 GOOD - Some minor gaps to address')
    } else if (healthPercentage >= 50) {
      console.log('   🟠 FAIR - Several gaps need attention')
    } else {
      console.log('   🔴 POOR - Major gaps found')
    }

    console.log('\n💡 ACTIONABLE RECOMMENDATIONS:')
    
    if (criticalGaps.length > 0) {
      console.log('   1. 🚨 Fix critical infrastructure issues immediately')
    }
    
    if (this.gaps.some(gap => gap.includes('rate limit') || gap.includes('429'))) {
      console.log('   2. 🔧 Adjust rate limiting for development/testing')
    }
    
    if (featureGaps.length > 0) {
      console.log('   3. 🛠️ Implement missing feature endpoints')
    }
    
    if (this.gaps.some(gap => gap.includes('auth'))) {
      console.log('   4. 🔐 Review authentication system configuration')
    }
    
    console.log('   5. 🧪 Implement proper API testing with authentication')
    console.log('   6. 📱 Test mobile responsiveness and PWA features')
    console.log('   7. 🚀 Review production deployment readiness')

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      healthScore: healthPercentage,
      working: this.working,
      gaps: this.gaps,
      summary: {
        totalChecks,
        workingCount,
        gapCount,
        criticalGaps: criticalGaps.length,
        featureGaps: featureGaps.length,
        configGaps: configGaps.length
      }
    }

    fs.writeFileSync('focused-gap-report.json', JSON.stringify(report, null, 2))
    console.log('\n💾 Detailed report saved to: focused-gap-report.json')
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new FocusedGapTest()
  tester.runTests().catch(console.error)
}

module.exports = FocusedGapTest