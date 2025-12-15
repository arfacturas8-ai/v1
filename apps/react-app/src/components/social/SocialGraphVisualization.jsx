import React, { useState, useEffect, useRef } from 'react'
import { 
  Users, Network, Zap, Target, Eye, EyeOff, 
  Maximize2, Minimize2, RotateCcw, Download,
  Filter, Settings, Info
} from 'lucide-react'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
const SocialGraphVisualization = ({ userId, onClose }) => {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: [],
    stats: {}
  })
  
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('network') // network, hierarchy, circle
  const [filterType, setFilterType] = useState('all') // all, friends, followers, following
  const [showLabels, setShowLabels] = useState(true)
  const [showStats, setShowStats] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const [simulation, setSimulation] = useState({
    running: false,
    strength: 0.3,
    distance: 50
  })
  
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)

  useEffect(() => {
    loadGraphData()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [userId, filterType])

  useEffect(() => {
    if (graphData.nodes.length > 0) {
      initializeVisualization()
    }
  }, [graphData, viewMode, showLabels])

  const loadGraphData = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would fetch the actual social graph data
      const [networkStats, mutualConnections] = await Promise.all([
        socialService.getNetworkStats(userId),
        socialService.getMutualConnections(userId, 50)
      ])

      // Generate mock graph data for demo
      const mockData = generateMockGraphData()
      
      setGraphData({
        nodes: mockData.nodes,
        edges: mockData.edges,
        stats: {
          totalConnections: networkStats.totalConnections || 150,
          mutualConnections: mutualConnections.length || 25,
          clusters: 3,
          density: 0.15,
          averageDegree: 4.2
        }
      })
      
    } catch (error) {
      console.error('Error loading graph data:', error)
      showToast('Failed to load social graph', 'error')
      
      // Fallback to mock data
      const mockData = generateMockGraphData()
      setGraphData({
        nodes: mockData.nodes,
        edges: mockData.edges,
        stats: {
          totalConnections: 150,
          mutualConnections: 25,
          clusters: 3,
          density: 0.15,
          averageDegree: 4.2
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMockGraphData = () => {
    const nodes = []
    const edges = []
    
    // Central user (you)
    const centralUser = {
      id: userId || currentUser?.id || 'central',
      username: currentUser?.username || 'You',
      displayName: currentUser?.displayName || 'You',
      avatar: currentUser?.avatar,
      type: 'central',
      connections: 45,
      influence: 0.8,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    }
    nodes.push(centralUser)

    // Generate connected users
    const connectionTypes = ['friend', 'follower', 'following', 'mutual']
    const positions = generateCircularPositions(30, 200)
    
    for (let i = 0; i < 30; i++) {
      const node = {
        id: `user_${i}`,
        username: `user${i}`,
        displayName: `User ${i}`,
        avatar: ['👑', '🎨', '💎', '🚀', '⚡', '🌟', '🔥', '💫'][i % 8],
        type: connectionTypes[Math.floor(Math.random() * connectionTypes.length)],
        connections: Math.floor(Math.random() * 20) + 5,
        influence: Math.random() * 0.6 + 0.2,
        x: positions[i].x,
        y: positions[i].y,
        vx: 0,
        vy: 0
      }
      nodes.push(node)

      // Create edge to central user
      edges.push({
        id: `edge_central_${i}`,
        source: centralUser.id,
        target: node.id,
        strength: Math.random() * 0.8 + 0.2,
        type: node.type
      })
    }

    // Generate connections between users
    for (let i = 0; i < 20; i++) {
      const source = nodes[Math.floor(Math.random() * (nodes.length - 1)) + 1]
      const target = nodes[Math.floor(Math.random() * (nodes.length - 1)) + 1]
      
      if (source.id !== target.id && !edges.find(e => 
        (e.source === source.id && e.target === target.id) ||
        (e.source === target.id && e.target === source.id)
      )) {
        edges.push({
          id: `edge_${source.id}_${target.id}`,
          source: source.id,
          target: target.id,
          strength: Math.random() * 0.5 + 0.3,
          type: 'mutual'
        })
      }
    }

    return { nodes, edges }
  }

  const generateCircularPositions = (count, radius) => {
    const positions = []
    const angleStep = (2 * Math.PI) / count
    
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep
      positions.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      })
    }
    
    return positions
  }

  const initializeVisualization = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    startAnimation()
  }

  const startAnimation = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Apply force simulation if running
      if (simulation.running) {
        applyForces()
      }

      // Draw edges
      drawEdges(ctx, width, height)
      
      // Draw nodes
      drawNodes(ctx, width, height)
      
      // Draw labels if enabled
      if (showLabels) {
        drawLabels(ctx, width, height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
  }

  const applyForces = () => {
    const { nodes, edges } = graphData
    const centerX = canvasRef.current.clientWidth / 2
    const centerY = canvasRef.current.clientHeight / 2

    // Center force
    nodes.forEach(node => {
      if (node.type !== 'central') {
        const dx = centerX - (node.x + centerX)
        const dy = centerY - (node.y + centerY)
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 0) {
          node.vx += (dx / distance) * 0.001
          node.vy += (dy / distance) * 0.001
        }
      }
    })

    // Link forces
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      
      if (source && target) {
        const dx = target.x - source.x
        const dy = target.y - source.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const targetDistance = simulation.distance
        
        if (distance > 0) {
          const force = (distance - targetDistance) * simulation.strength * 0.01
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          
          source.vx += fx
          source.vy += fy
          target.vx -= fx
          target.vy -= fy
        }
      }
    })

    // Apply velocity and damping
    nodes.forEach(node => {
      if (node.type !== 'central') {
        node.x += node.vx
        node.y += node.vy
        node.vx *= 0.9
        node.vy *= 0.9
      }
    })
  }

  const drawEdges = (ctx, width, height) => {
    const centerX = width / 2
    const centerY = height / 2

    graphData.edges.forEach(edge => {
      const source = graphData.nodes.find(n => n.id === edge.source)
      const target = graphData.nodes.find(n => n.id === edge.target)
      
      if (source && target) {
        ctx.beginPath()
        ctx.moveTo(source.x + centerX, source.y + centerY)
        ctx.lineTo(target.x + centerX, target.y + centerY)
        
        // Color based on connection type
        const alpha = edge.strength * 0.6
        switch (edge.type) {
          case 'friend':
            ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`
            break
          case 'follower':
            ctx.strokeStyle = `rgba(255, 184, 0, ${alpha})`
            break
          case 'following':
            ctx.strokeStyle = `rgba(0, 187, 255, ${alpha})`
            break
          case 'mutual':
            ctx.strokeStyle = `rgba(255, 68, 68, ${alpha})`
            break
          default:
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`
        }
        
        ctx.lineWidth = edge.strength * 2
        ctx.stroke()
      }
    })
  }

  const drawNodes = (ctx, width, height) => {
    const centerX = width / 2
    const centerY = height / 2

    graphData.nodes.forEach(node => {
      const x = node.x + centerX
      const y = node.y + centerY
      const radius = node.type === 'central' ? 20 : 8 + (node.influence * 8)

      // Node background
      ctx.beginPath()
      ctx.arc(x, y, radius + 2, 0, 2 * Math.PI)
      ctx.fillStyle = node.type === 'central' ? '#00FF88' : 'rgba(255, 255, 255, 0.1)'
      ctx.fill()

      // Node border
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      
      if (node.id === selectedNode?.id) {
        ctx.strokeStyle = '#00FF88'
        ctx.lineWidth = 3
      } else if (node.id === hoveredNode?.id) {
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)'
        ctx.lineWidth = 2
      } else {
        ctx.strokeStyle = getNodeColor(node.type)
        ctx.lineWidth = 1
      }
      ctx.stroke()

      // Node fill
      ctx.fillStyle = node.type === 'central' ? '#000' : getNodeColor(node.type)
      ctx.fill()

      // Avatar or emoji
      if (node.avatar && typeof node.avatar === 'string' && !node.avatar.startsWith('http')) {
        ctx.font = `${radius}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#fff'
        ctx.fillText(node.avatar, x, y)
      }
    })
  }

  const drawLabels = (ctx, width, height) => {
    const centerX = width / 2
    const centerY = height / 2

    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'

    graphData.nodes.forEach(node => {
      const x = node.x + centerX
      const y = node.y + centerY + (node.type === 'central' ? 25 : 15)
      
      ctx.fillText(node.displayName, x, y)
    })
  }

  const getNodeColor = (type) => {
    switch (type) {
      case 'central':
        return '#00FF88'
      case 'friend':
        return '#00FF88'
      case 'follower':
        return '#FFB800'
      case 'following':
        return '#00BBFF'
      case 'mutual':
        return '#FF4444'
      default:
        return 'rgba(255, 255, 255, 0.5)'
    }
  }

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - canvas.clientWidth / 2
    const y = e.clientY - rect.top - canvas.clientHeight / 2

    // Find clicked node
    const clickedNode = graphData.nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      const radius = node.type === 'central' ? 20 : 8 + (node.influence * 8)
      return distance <= radius
    })

    setSelectedNode(clickedNode)
  }

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - canvas.clientWidth / 2
    const y = e.clientY - rect.top - canvas.clientHeight / 2

    // Find hovered node
    const hoveredNode = graphData.nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      const radius = node.type === 'central' ? 20 : 8 + (node.influence * 8)
      return distance <= radius
    })

    setHoveredNode(hoveredNode)
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default'
  }

  const exportGraph = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = 'social-graph.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  if (loading) {
    return (
      <div className="graph-loading">
        <div className="spinner" />
        <p>Loading social graph...</p>
      </div>
    )
  }

  return (
    <div className={`social-graph-modal ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="graph-container">
        {/* Header */}
        <div className="graph-header">
          <div className="header-title">
            <Network size={24} />
            <h2>Social Network Graph</h2>
          </div>
          
          <div className="header-controls">
            <button
              className="control-btn"
              onClick={() => setSimulation(prev => ({ ...prev, running: !prev.running }))}
              title={simulation.running ? 'Pause animation' : 'Start animation'}
            >
              {simulation.running ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            
            <button
              className="control-btn"
              onClick={() => setShowLabels(!showLabels)}
              title="Toggle labels"
            >
              <Target size={16} />
            </button>
            
            <button
              className="control-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            
            <button
              className="control-btn"
              onClick={exportGraph}
              title="Export graph"
            >
              <Download size={16} />
            </button>
            
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="graph-controls">
          <div className="control-group">
            <label>View Mode:</label>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="network">Network</option>
              <option value="hierarchy">Hierarchy</option>
              <option value="circle">Circle</option>
            </select>
          </div>

          <div className="control-group">
            <label>Filter:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Connections</option>
              <option value="friends">Friends Only</option>
              <option value="followers">Followers Only</option>
              <option value="following">Following Only</option>
            </select>
          </div>

          <div className="control-group">
            <label>Force Strength:</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={simulation.strength}
              onChange={(e) => setSimulation(prev => ({ 
                ...prev, 
                strength: parseFloat(e.target.value) 
              }))}
            />
          </div>
        </div>

        {/* Graph Canvas */}
        <div className="graph-viewport">
          <canvas
            ref={canvasRef}
            className="graph-canvas"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
          />
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="graph-stats">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{graphData.stats.totalConnections}</span>
                <span className="stat-label">Total Connections</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{graphData.stats.mutualConnections}</span>
                <span className="stat-label">Mutual Connections</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{graphData.stats.clusters}</span>
                <span className="stat-label">Clusters</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{(graphData.stats.density * 100).toFixed(1)}%</span>
                <span className="stat-label">Network Density</span>
              </div>
            </div>
          </div>
        )}

        {/* Node Info Panel */}
        {selectedNode && (
          <div className="node-info-panel">
            <div className="node-info-header">
              <h3>{selectedNode.displayName}</h3>
              <span className="node-type">{selectedNode.type}</span>
            </div>
            <div className="node-info-stats">
              <div className="info-stat">
                <span className="label">Connections:</span>
                <span className="value">{selectedNode.connections}</span>
              </div>
              <div className="info-stat">
                <span className="label">Influence:</span>
                <span className="value">{(selectedNode.influence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="graph-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <span>Friends</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FFB800' }}></div>
            <span>Followers</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
            <span>Following</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FF4444' }}></div>
            <span>Mutual</span>
          </div>
        </div>
      </div>
    </div>
  )
}



export default SocialGraphVisualization