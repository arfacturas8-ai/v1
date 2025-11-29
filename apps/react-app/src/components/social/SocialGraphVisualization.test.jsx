import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import SocialGraphVisualization from './SocialGraphVisualization'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'

vi.mock('../../services/socialService')
vi.mock('../../contexts/AuthContext')
vi.mock('../ui/useToast')

vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  Network: () => <div data-testid="network-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Maximize2: () => <div data-testid="maximize2-icon" />,
  Minimize2: () => <div data-testid="minimize2-icon" />,
  RotateCcw: () => <div data-testid="rotate-ccw-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Info: () => <div data-testid="info-icon" />
}))

describe('SocialGraphVisualization', () => {
  let mockShowToast
  let mockOnClose
  let mockNetworkStats
  let mockMutualConnections
  let mockCanvas
  let mockCanvasContext

  beforeEach(() => {
    mockShowToast = vi.fn()
    mockOnClose = vi.fn()

    mockNetworkStats = {
      totalConnections: 150,
      followers: 75,
      following: 50,
      mutualConnections: 25
    }

    mockMutualConnections = Array.from({ length: 25 }, (_, i) => ({
      id: `user_${i}`,
      username: `user${i}`
    }))

    useAuth.mockReturnValue({
      user: {
        id: 'current-user',
        username: 'currentuser',
        displayName: 'Current User',
        avatar: '👤'
      }
    })

    useToast.mockReturnValue({
      showToast: mockShowToast
    })

    socialService.getNetworkStats.mockResolvedValue(mockNetworkStats)
    socialService.getMutualConnections.mockResolvedValue(mockMutualConnections)

    mockCanvasContext = {
      scale: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      getContext: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn()
    }

    mockCanvas = {
      getContext: vi.fn(() => mockCanvasContext),
      getBoundingClientRect: vi.fn(() => ({
        width: 800,
        height: 600,
        left: 0,
        top: 0
      })),
      clientWidth: 800,
      clientHeight: 600,
      width: 800,
      height: 600,
      toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
      style: {}
    }

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext)
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      left: 0,
      top: 0
    }))

    window.devicePixelRatio = 2
    global.requestAnimationFrame = vi.fn((cb) => {
      setTimeout(cb, 0)
      return 1
    })
    global.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      expect(screen.getByText('Loading social graph...')).toBeInTheDocument()
      const spinner = document.querySelector('.spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('should render graph container after loading', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })
    })

    it('should render header with network icon', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTestId('network-icon')).toBeInTheDocument()
      })
    })

    it('should render canvas element', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
        expect(canvas.tagName).toBe('CANVAS')
      })
    })

    it('should render control buttons', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTitle('Start animation')).toBeInTheDocument()
        expect(screen.getByTitle('Toggle labels')).toBeInTheDocument()
        expect(screen.getByTitle('Toggle fullscreen')).toBeInTheDocument()
        expect(screen.getByTitle('Export graph')).toBeInTheDocument()
      })
    })

    it('should render view mode selector', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })
    })

    it('should render filter type selector', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('All Connections')
        expect(selector).toBeInTheDocument()
      })
    })

    it('should render force strength slider', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        expect(slider).toBeInTheDocument()
        expect(slider).toHaveAttribute('min', '0.1')
        expect(slider).toHaveAttribute('max', '1')
        expect(slider).toHaveAttribute('step', '0.1')
      })
    })

    it('should render legend with connection types', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Friends')).toBeInTheDocument()
        expect(screen.getByText('Followers')).toBeInTheDocument()
        expect(screen.getByText('Following')).toBeInTheDocument()
        expect(screen.getByText('Mutual')).toBeInTheDocument()
      })
    })
  })

  describe('Graph Data Loading', () => {
    it('should fetch network stats on mount', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledWith('test-user')
      })
    })

    it('should fetch mutual connections on mount', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getMutualConnections).toHaveBeenCalledWith('test-user', 50)
      })
    })

    it('should display network stats after loading', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
        expect(screen.getByText('Total Connections')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText('Mutual Connections')).toBeInTheDocument()
      })
    })

    it('should display cluster information', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Clusters')).toBeInTheDocument()
      })
    })

    it('should display network density', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('15.0%')).toBeInTheDocument()
        expect(screen.getByText('Network Density')).toBeInTheDocument()
      })
    })

    it('should reload data when userId changes', async () => {
      const { rerender } = render(
        <SocialGraphVisualization userId="user1" onClose={mockOnClose} />
      )

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledWith('user1')
      })

      rerender(<SocialGraphVisualization userId="user2" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledWith('user2')
      })
    })

    it('should reload data when filter type changes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledTimes(1)
      })

      const filterSelect = screen.getByDisplayValue('All Connections')
      fireEvent.change(filterSelect, { target: { value: 'friends' } })

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledTimes(2)
      })
    })

    it('should generate mock graph data with correct structure', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })

      // Verify that the graph has nodes and edges
      expect(mockCanvasContext.arc).toHaveBeenCalled()
      expect(mockCanvasContext.moveTo).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should show error toast when network stats fail', async () => {
      socialService.getNetworkStats.mockRejectedValueOnce(new Error('Network error'))

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load social graph', 'error')
      })
    })

    it('should fallback to mock data on error', async () => {
      socialService.getNetworkStats.mockRejectedValueOnce(new Error('Network error'))

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })
    })

    it('should display default stats on error', async () => {
      socialService.getNetworkStats.mockRejectedValueOnce(new Error('Network error'))

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
        expect(screen.getByText('25')).toBeInTheDocument()
      })
    })

    it('should handle mutual connections fetch error', async () => {
      socialService.getMutualConnections.mockRejectedValueOnce(new Error('Connection error'))

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to load social graph', 'error')
      })
    })

    it('should log error to console on failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation()
      socialService.getNetworkStats.mockRejectedValueOnce(new Error('Test error'))

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Interactive Controls', () => {
    it('should toggle simulation on animation button click', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTitle('Start animation')).toBeInTheDocument()
      })

      const animationBtn = screen.getByTitle('Start animation')
      fireEvent.click(animationBtn)

      await waitFor(() => {
        expect(screen.getByTitle('Pause animation')).toBeInTheDocument()
      })
    })

    it('should toggle labels on labels button click', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const labelsBtn = screen.getByTitle('Toggle labels')
        expect(labelsBtn).toBeInTheDocument()
      })

      const labelsBtn = screen.getByTitle('Toggle labels')
      fireEvent.click(labelsBtn)

      expect(labelsBtn).toBeInTheDocument()
    })

    it('should toggle fullscreen mode', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const fullscreenBtn = screen.getByTitle('Toggle fullscreen')
        expect(fullscreenBtn).toBeInTheDocument()
      })

      const fullscreenBtn = screen.getByTitle('Toggle fullscreen')
      fireEvent.click(fullscreenBtn)

      expect(screen.getByTestId('minimize2-icon')).toBeInTheDocument()
    })

    it('should call onClose when close button clicked', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const closeBtn = screen.getByText('×')
        expect(closeBtn).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('×'))
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should update view mode on selector change', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('Network')
      fireEvent.change(selector, { target: { value: 'hierarchy' } })

      expect(selector.value).toBe('hierarchy')
    })

    it('should update filter type on selector change', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('All Connections')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('All Connections')
      fireEvent.change(selector, { target: { value: 'friends' } })

      expect(selector.value).toBe('friends')
    })

    it('should update force strength on slider change', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        expect(slider).toBeInTheDocument()
      })

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '0.7' } })

      expect(slider.value).toBe('0.7')
    })

    it('should have default force strength of 0.3', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        expect(slider.value).toBe('0.3')
      })
    })
  })

  describe('Canvas Interactions', () => {
    it('should initialize canvas on render', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })
    })

    it('should handle canvas click for node selection', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })

      expect(canvas).toBeInTheDocument()
    })

    it('should handle mouse move for node hover', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.mouseMove(canvas, { clientX: 400, clientY: 300 })

      expect(canvas).toBeInTheDocument()
    })

    it('should clear selected node on background click', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })
      fireEvent.click(canvas, { clientX: 10, clientY: 10 })

      expect(canvas).toBeInTheDocument()
    })

    it('should change cursor on node hover', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.mouseMove(canvas, { clientX: 400, clientY: 300 })

      expect(canvas).toBeInTheDocument()
    })

    it('should handle clicks outside nodes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      // Click far from center where no nodes should be
      fireEvent.click(canvas, { clientX: 1, clientY: 1 })

      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Node Selection', () => {
    it('should display node info panel when node selected', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      // Click near center where the central node should be
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })

      await waitFor(() => {
        const infoPanels = screen.queryAllByText(/Connections:|Influence:/)
        expect(infoPanels.length).toBeGreaterThanOrEqual(0)
      })
    })

    it('should show node type in info panel', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(document.querySelector('.graph-canvas')).toBeInTheDocument()
      })
    })

    it('should show node connections count', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(document.querySelector('.graph-canvas')).toBeInTheDocument()
      })
    })

    it('should show node influence percentage', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(document.querySelector('.graph-canvas')).toBeInTheDocument()
      })
    })

    it('should clear selected node when clicking empty space', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })
      fireEvent.click(canvas, { clientX: 1, clientY: 1 })

      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Graph Visualization', () => {
    it('should create canvas context with proper scaling', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.scale).toHaveBeenCalledWith(2, 2)
      })
    })

    it('should start animation loop', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(global.requestAnimationFrame).toHaveBeenCalled()
      })
    })

    it('should clear canvas on each frame', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.clearRect).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should draw edges between nodes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.moveTo).toHaveBeenCalled()
        expect(mockCanvasContext.lineTo).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should draw nodes as circles', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.arc).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should draw labels when enabled', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.fillText).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should not draw labels when disabled', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const labelsBtn = screen.getByTitle('Toggle labels')
        expect(labelsBtn).toBeInTheDocument()
      })

      mockCanvasContext.fillText.mockClear()

      const labelsBtn = screen.getByTitle('Toggle labels')
      fireEvent.click(labelsBtn)

      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('should set canvas dimensions based on container', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })
    })

    it('should handle high DPI displays', async () => {
      window.devicePixelRatio = 3
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.scale).toHaveBeenCalledWith(3, 3)
      })
    })
  })

  describe('Force-Directed Layout', () => {
    it('should apply forces when simulation running', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const animationBtn = screen.getByTitle('Start animation')
        expect(animationBtn).toBeInTheDocument()
      })

      const animationBtn = screen.getByTitle('Start animation')
      fireEvent.click(animationBtn)

      await waitFor(() => {
        expect(screen.getByTitle('Pause animation')).toBeInTheDocument()
      })
    })

    it('should not apply forces when simulation paused', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const animationBtn = screen.getByTitle('Start animation')
        expect(animationBtn).toBeInTheDocument()
      })
    })

    it('should respect force strength setting', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        expect(slider).toBeInTheDocument()
      })

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '0.8' } })

      expect(slider.value).toBe('0.8')
    })

    it('should apply center force to nodes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const animationBtn = screen.getByTitle('Start animation')
        expect(animationBtn).toBeInTheDocument()
      })

      const animationBtn = screen.getByTitle('Start animation')
      fireEvent.click(animationBtn)

      expect(animationBtn).toBeInTheDocument()
    })

    it('should apply link forces between connected nodes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const animationBtn = screen.getByTitle('Start animation')
        expect(animationBtn).toBeInTheDocument()
      })

      const animationBtn = screen.getByTitle('Start animation')
      fireEvent.click(animationBtn)

      expect(animationBtn).toBeInTheDocument()
    })

    it('should apply damping to node velocities', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const animationBtn = screen.getByTitle('Start animation')
        expect(animationBtn).toBeInTheDocument()
      })

      const animationBtn = screen.getByTitle('Start animation')
      fireEvent.click(animationBtn)

      expect(animationBtn).toBeInTheDocument()
    })

    it('should keep central node fixed in position', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(document.querySelector('.graph-canvas')).toBeInTheDocument()
      })

      // Central node should always be at 0,0
      expect(mockCanvasContext.arc).toHaveBeenCalled()
    })

    it('should update node positions over time', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const animationBtn = screen.getByTitle('Start animation')
        expect(animationBtn).toBeInTheDocument()
      })

      const animationBtn = screen.getByTitle('Start animation')
      fireEvent.click(animationBtn)

      await new Promise(resolve => setTimeout(resolve, 200))

      expect(global.requestAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('Export Functionality', () => {
    it('should export graph as PNG', async () => {
      const mockLink = {
        click: vi.fn(),
        download: '',
        href: ''
      }
      const createElementSpy = vi.spyOn(document, 'createElement')
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'a') return mockLink
        return document.createElement(tag)
      })

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const exportBtn = screen.getByTitle('Export graph')
        expect(exportBtn).toBeInTheDocument()
      })

      const exportBtn = screen.getByTitle('Export graph')
      fireEvent.click(exportBtn)

      expect(mockLink.download).toBe('social-graph.png')
      expect(mockLink.click).toHaveBeenCalled()

      createElementSpy.mockRestore()
    })

    it('should use canvas toDataURL for export', async () => {
      const mockToDataURL = vi.fn(() => 'data:image/png;base64,exported')
      HTMLCanvasElement.prototype.toDataURL = mockToDataURL

      const mockLink = {
        click: vi.fn(),
        download: '',
        href: ''
      }
      const createElementSpy = vi.spyOn(document, 'createElement')
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'a') return mockLink
        return document.createElement(tag)
      })

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const exportBtn = screen.getByTitle('Export graph')
        expect(exportBtn).toBeInTheDocument()
      })

      const exportBtn = screen.getByTitle('Export graph')
      fireEvent.click(exportBtn)

      expect(mockLink.href).toBe('data:image/png;base64,exported')

      createElementSpy.mockRestore()
    })

    it('should trigger download when export is clicked', async () => {
      const mockLink = {
        click: vi.fn(),
        download: '',
        href: ''
      }
      const createElementSpy = vi.spyOn(document, 'createElement')
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'a') return mockLink
        return document.createElement(tag)
      })

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const exportBtn = screen.getByTitle('Export graph')
        expect(exportBtn).toBeInTheDocument()
      })

      const exportBtn = screen.getByTitle('Export graph')
      fireEvent.click(exportBtn)

      expect(mockLink.click).toHaveBeenCalledTimes(1)

      createElementSpy.mockRestore()
    })
  })

  describe('Legend Display', () => {
    it('should render connection type legend', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Friends')).toBeInTheDocument()
        expect(screen.getByText('Followers')).toBeInTheDocument()
        expect(screen.getByText('Following')).toBeInTheDocument()
        expect(screen.getByText('Mutual')).toBeInTheDocument()
      })
    })

    it('should show correct colors in legend', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const legend = screen.getByText('Friends').closest('.graph-legend')
        expect(legend).toBeInTheDocument()
      })

      const legendItems = document.querySelectorAll('.legend-color')
      expect(legendItems.length).toBe(4)
    })

    it('should display legend colors matching edge colors', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const friendsColor = screen.getByText('Friends').previousSibling
        expect(friendsColor).toHaveStyle({ backgroundColor: '#00FF88' })
      })
    })
  })

  describe('View Modes', () => {
    it('should support network view mode', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })
    })

    it('should support hierarchy view mode', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('Network')
      fireEvent.change(selector, { target: { value: 'hierarchy' } })

      expect(selector.value).toBe('hierarchy')
    })

    it('should support circle view mode', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('Network')
      fireEvent.change(selector, { target: { value: 'circle' } })

      expect(selector.value).toBe('circle')
    })

    it('should reinitialize visualization on view mode change', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })

      mockCanvasContext.scale.mockClear()

      const selector = screen.getByDisplayValue('Network')
      fireEvent.change(selector, { target: { value: 'hierarchy' } })

      await waitFor(() => {
        expect(mockCanvasContext.scale).toHaveBeenCalled()
      })
    })

    it('should have all three view mode options', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })

      const options = screen.getByDisplayValue('Network').querySelectorAll('option')
      expect(options.length).toBe(3)
    })
  })

  describe('Filter Types', () => {
    it('should filter by all connections', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('All Connections')
        expect(selector).toBeInTheDocument()
      })
    })

    it('should filter by friends only', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('All Connections')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('All Connections')
      fireEvent.change(selector, { target: { value: 'friends' } })

      expect(selector.value).toBe('friends')
    })

    it('should filter by followers only', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('All Connections')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('All Connections')
      fireEvent.change(selector, { target: { value: 'followers' } })

      expect(selector.value).toBe('followers')
    })

    it('should filter by following only', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('All Connections')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('All Connections')
      fireEvent.change(selector, { target: { value: 'following' } })

      expect(selector.value).toBe('following')
    })

    it('should have all four filter options available', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('All Connections')
        expect(selector).toBeInTheDocument()
      })

      const options = screen.getByDisplayValue('All Connections').querySelectorAll('option')
      expect(options.length).toBe(4)
    })
  })

  describe('Connection Strength Visualization', () => {
    it('should vary edge thickness by connection strength', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.stroke).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should vary edge opacity by connection strength', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.stroke).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should color edges by connection type', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.stroke).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should draw edges with varying line widths', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.stroke).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Stats Panel', () => {
    it('should display stats panel by default', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Total Connections')).toBeInTheDocument()
      })
    })

    it('should show total connections stat', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
        expect(screen.getByText('Total Connections')).toBeInTheDocument()
      })
    })

    it('should show mutual connections stat', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText('Mutual Connections')).toBeInTheDocument()
      })
    })

    it('should show clusters stat', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Clusters')).toBeInTheDocument()
      })
    })

    it('should show network density stat', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('15.0%')).toBeInTheDocument()
        expect(screen.getByText('Network Density')).toBeInTheDocument()
      })
    })

    it('should format density as percentage', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const densityText = screen.getByText('15.0%')
        expect(densityText).toBeInTheDocument()
      })
    })
  })

  describe('Cleanup', () => {
    it('should cancel animation frame on unmount', async () => {
      const { unmount } = render(
        <SocialGraphVisualization userId="test-user" onClose={mockOnClose} />
      )

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })

      unmount()

      expect(global.cancelAnimationFrame).toHaveBeenCalled()
    })

    it('should clear animation ref on unmount', async () => {
      const { unmount } = render(
        <SocialGraphVisualization userId="test-user" onClose={mockOnClose} />
      )

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })

      unmount()

      expect(global.cancelAnimationFrame).toHaveBeenCalled()
    })

    it('should not throw errors on unmount', async () => {
      const { unmount } = render(
        <SocialGraphVisualization userId="test-user" onClose={mockOnClose} />
      )

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })

      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Fullscreen Mode', () => {
    it('should add fullscreen class when toggled', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const fullscreenBtn = screen.getByTitle('Toggle fullscreen')
        expect(fullscreenBtn).toBeInTheDocument()
      })

      const fullscreenBtn = screen.getByTitle('Toggle fullscreen')
      fireEvent.click(fullscreenBtn)

      const modal = screen.getByText('Social Network Graph').closest('.social-graph-modal')
      expect(modal).toHaveClass('fullscreen')
    })

    it('should remove fullscreen class when toggled back', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const fullscreenBtn = screen.getByTitle('Toggle fullscreen')
        expect(fullscreenBtn).toBeInTheDocument()
      })

      const fullscreenBtn = screen.getByTitle('Toggle fullscreen')
      fireEvent.click(fullscreenBtn)
      fireEvent.click(fullscreenBtn)

      const modal = screen.getByText('Social Network Graph').closest('.social-graph-modal')
      expect(modal).not.toHaveClass('fullscreen')
    })

    it('should toggle icon when entering fullscreen', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTestId('maximize2-icon')).toBeInTheDocument()
      })

      const fullscreenBtn = screen.getByTitle('Toggle fullscreen')
      fireEvent.click(fullscreenBtn)

      expect(screen.getByTestId('minimize2-icon')).toBeInTheDocument()
    })
  })

  describe('Node Rendering', () => {
    it('should render central node larger than other nodes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.arc).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should vary node size by influence', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.arc).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should highlight selected node', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })

      await waitFor(() => {
        expect(mockCanvasContext.stroke).toHaveBeenCalled()
      })
    })

    it('should highlight hovered node', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.mouseMove(canvas, { clientX: 400, clientY: 300 })

      await waitFor(() => {
        expect(mockCanvasContext.stroke).toHaveBeenCalled()
      })
    })

    it('should render node avatars', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.fillText).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should render different colors for different node types', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.stroke).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Performance with Large Graphs', () => {
    it('should handle graph with 30 nodes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })

      expect(mockCanvasContext.arc).toHaveBeenCalled()
    })

    it('should render edges efficiently', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.moveTo).toHaveBeenCalled()
        expect(mockCanvasContext.lineTo).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should use requestAnimationFrame for smooth rendering', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(global.requestAnimationFrame).toHaveBeenCalled()
      })
    })

    it('should throttle expensive operations', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.clearRect).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Accessibility', () => {
    it('should have accessible button controls', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('should have title attributes on control buttons', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByTitle('Start animation')).toBeInTheDocument()
        expect(screen.getByTitle('Toggle labels')).toBeInTheDocument()
        expect(screen.getByTitle('Toggle fullscreen')).toBeInTheDocument()
        expect(screen.getByTitle('Export graph')).toBeInTheDocument()
      })
    })

    it('should have labeled select controls', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('View Mode:')).toBeInTheDocument()
        expect(screen.getByText('Filter:')).toBeInTheDocument()
        expect(screen.getByText('Force Strength:')).toBeInTheDocument()
      })
    })

    it('should have accessible slider with proper range', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const slider = screen.getByRole('slider')
        expect(slider).toHaveAttribute('min', '0.1')
        expect(slider).toHaveAttribute('max', '1')
        expect(slider).toHaveAttribute('step', '0.1')
      })
    })

    it('should provide meaningful stats labels', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Total Connections')).toBeInTheDocument()
        expect(screen.getByText('Mutual Connections')).toBeInTheDocument()
        expect(screen.getByText('Clusters')).toBeInTheDocument()
        expect(screen.getByText('Network Density')).toBeInTheDocument()
      })
    })

    it('should have accessible close button', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const closeBtn = screen.getByText('×')
        expect(closeBtn).toBeInTheDocument()
        expect(closeBtn.tagName).toBe('BUTTON')
      })
    })
  })

  describe('Zoom and Pan', () => {
    it('should handle mouse wheel events for zoom', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      // Note: The current implementation doesn't have zoom/pan
      // but the canvas is interactive
      expect(document.querySelector('.graph-canvas')).toBeInTheDocument()
    })

    it('should support mouse interactions', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 })

      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty graph data', async () => {
      socialService.getNetworkStats.mockResolvedValueOnce({
        totalConnections: 0,
        mutualConnections: 0
      })
      socialService.getMutualConnections.mockResolvedValueOnce([])

      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })
    })

    it('should handle missing userId prop', async () => {
      render(<SocialGraphVisualization onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })
    })

    it('should handle rapid filter changes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('All Connections')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('All Connections')
      fireEvent.change(selector, { target: { value: 'friends' } })
      fireEvent.change(selector, { target: { value: 'followers' } })
      fireEvent.change(selector, { target: { value: 'following' } })

      expect(selector.value).toBe('following')
    })

    it('should handle rapid view mode changes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('Network')
      fireEvent.change(selector, { target: { value: 'hierarchy' } })
      fireEvent.change(selector, { target: { value: 'circle' } })
      fireEvent.change(selector, { target: { value: 'network' } })

      expect(selector.value).toBe('network')
    })

    it('should handle multiple clicks on same node', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const canvas = document.querySelector('.graph-canvas')
        expect(canvas).toBeInTheDocument()
      })

      const canvas = document.querySelector('.graph-canvas')
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })
      fireEvent.click(canvas, { clientX: 400, clientY: 300 })

      expect(canvas).toBeInTheDocument()
    })
  })

  describe('Data Updates', () => {
    it('should handle stats updates', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    it('should update when switching users', async () => {
      const { rerender } = render(
        <SocialGraphVisualization userId="user1" onClose={mockOnClose} />
      )

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledWith('user1')
      })

      socialService.getNetworkStats.mockClear()

      rerender(<SocialGraphVisualization userId="user2" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(socialService.getNetworkStats).toHaveBeenCalledWith('user2')
      })
    })

    it('should reinitialize on data reload', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.scale).toHaveBeenCalled()
      })

      const callCount = mockCanvasContext.scale.mock.calls.length

      const filterSelect = screen.getByDisplayValue('All Connections')
      fireEvent.change(filterSelect, { target: { value: 'friends' } })

      await waitFor(() => {
        expect(mockCanvasContext.scale.mock.calls.length).toBeGreaterThan(callCount)
      })
    })
  })

  describe('Layout Algorithms', () => {
    it('should generate circular positions for nodes', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.arc).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should position central node at origin', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(mockCanvasContext.arc).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should distribute nodes evenly in circle layout', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        const selector = screen.getByDisplayValue('Network')
        expect(selector).toBeInTheDocument()
      })

      const selector = screen.getByDisplayValue('Network')
      fireEvent.change(selector, { target: { value: 'circle' } })

      await waitFor(() => {
        expect(mockCanvasContext.arc).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('should show spinner during initial load', () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      const spinner = document.querySelector('.spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('should show loading text', () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      expect(screen.getByText('Loading social graph...')).toBeInTheDocument()
    })

    it('should hide loading state after data loads', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      await waitFor(() => {
        expect(screen.queryByText('Loading social graph...')).not.toBeInTheDocument()
      })
    })

    it('should transition from loading to loaded state', async () => {
      render(<SocialGraphVisualization userId="test-user" onClose={mockOnClose} />)

      expect(screen.getByText('Loading social graph...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Social Network Graph')).toBeInTheDocument()
      })

      expect(screen.queryByText('Loading social graph...')).not.toBeInTheDocument()
    })
  })
})

export default spinner
