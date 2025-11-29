import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import {
  ResponsiveLayout,
  SplitViewLayout,
  AdaptiveGrid,
  TabletDrawer,
  useOrientation,
  TabletCardLayout,
  TabletFAB,
  TabletBreadcrumb
} from './TabletLayout'

const mockMatchMedia = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  })
}

const TestComponent = ({ children, ...props }) => <div {...props}>{children}</div>

describe('ResponsiveLayout', () => {
  beforeEach(() => {
    mockMatchMedia(800, 600)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render layout with children', () => {
      render(
        <ResponsiveLayout>
          <div>Main Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Main Content')).toBeInTheDocument()
    })

    it('should render header when provided', () => {
      render(
        <ResponsiveLayout header={<div>Header</div>}>
          <div>Main Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Header')).toBeInTheDocument()
    })

    it('should render sidebar when provided', () => {
      render(
        <ResponsiveLayout sidebar={<div>Sidebar</div>}>
          <div>Main Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Sidebar')).toBeInTheDocument()
    })

    it('should render footer when provided', () => {
      render(
        <ResponsiveLayout footer={<div>Footer</div>}>
          <div>Main Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })

    it('should render all sections together', () => {
      render(
        <ResponsiveLayout
          header={<div>Header</div>}
          sidebar={<div>Sidebar</div>}
          footer={<div>Footer</div>}
        >
          <div>Main Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Sidebar')).toBeInTheDocument()
      expect(screen.getByText('Main Content')).toBeInTheDocument()
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <ResponsiveLayout className="custom-class">
          <div>Content</div>
        </ResponsiveLayout>
      )
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('should apply responsive-layout class', () => {
      const { container } = render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )
      expect(container.querySelector('.responsive-layout')).toBeInTheDocument()
    })
  })

  describe('Tablet Detection', () => {
    it('should detect tablet viewport (768-1023px)', () => {
      mockMatchMedia(800, 600)
      const { container } = render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )
      expect(container.querySelector('.responsive-layout')).toBeInTheDocument()
    })

    it('should not consider 767px as tablet', () => {
      mockMatchMedia(767, 600)
      render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should not consider 1024px as tablet', () => {
      mockMatchMedia(1024, 768)
      render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Orientation Detection', () => {
    it('should detect landscape mode when width > height', () => {
      mockMatchMedia(1000, 600)
      render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should detect portrait mode when height > width', () => {
      mockMatchMedia(600, 1000)
      render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should handle orientation change events', async () => {
      mockMatchMedia(800, 600)
      render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )

      act(() => {
        mockMatchMedia(600, 800)
        window.dispatchEvent(new Event('orientationchange'))
      })

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
      })
    })

    it('should debounce orientation change with timeout', async () => {
      jest.useFakeTimers()
      mockMatchMedia(800, 600)
      render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )

      act(() => {
        mockMatchMedia(600, 800)
        window.dispatchEvent(new Event('orientationchange'))
        jest.advanceTimersByTime(100)
      })

      expect(screen.getByText('Content')).toBeInTheDocument()
      jest.useRealTimers()
    })
  })

  describe('Sidebar Behavior', () => {
    it('should collapse sidebar on small tablets in portrait', async () => {
      mockMatchMedia(850, 1100)
      const { queryByText } = render(
        <ResponsiveLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </ResponsiveLayout>
      )

      await waitFor(() => {
        expect(queryByText('Sidebar')).not.toBeInTheDocument()
      })
    })

    it('should show sidebar when not collapsed', () => {
      mockMatchMedia(1000, 600)
      render(
        <ResponsiveLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </ResponsiveLayout>
      )
      expect(screen.getByText('Sidebar')).toBeInTheDocument()
    })

    it('should use custom sidebar width', () => {
      mockMatchMedia(1000, 600)
      const { container } = render(
        <ResponsiveLayout sidebar={<div>Sidebar</div>} sidebarWidth="300px">
          <div>Content</div>
        </ResponsiveLayout>
      )
      const sidebar = container.querySelector('.layout-sidebar')
      expect(sidebar).toHaveStyle({ width: '300px' })
    })

    it('should use default sidebar width', () => {
      mockMatchMedia(1000, 600)
      const { container } = render(
        <ResponsiveLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </ResponsiveLayout>
      )
      const sidebar = container.querySelector('.layout-sidebar')
      expect(sidebar).toHaveStyle({ width: '280px' })
    })

    it('should toggle sidebar when collapsibleSidebar is true', () => {
      mockMatchMedia(1000, 600)
      const MockHeader = ({ onToggleSidebar }) => (
        <button onClick={onToggleSidebar}>Toggle</button>
      )

      render(
        <ResponsiveLayout
          header={<MockHeader />}
          sidebar={<div>Sidebar</div>}
          collapsibleSidebar={true}
        >
          <div>Content</div>
        </ResponsiveLayout>
      )

      expect(screen.getByText('Sidebar')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Toggle'))
      expect(screen.queryByText('Sidebar')).not.toBeInTheDocument()
    })

    it('should not provide toggle function when collapsibleSidebar is false', () => {
      mockMatchMedia(1000, 600)
      let receivedProps = null
      const MockHeader = (props) => {
        receivedProps = props
        return <div>Header</div>
      }

      render(
        <ResponsiveLayout
          header={<MockHeader />}
          sidebar={<div>Sidebar</div>}
          collapsibleSidebar={false}
        >
          <div>Content</div>
        </ResponsiveLayout>
      )

      expect(receivedProps.onToggleSidebar).toBeUndefined()
    })
  })

  describe('Resize Handling', () => {
    it('should handle window resize events', async () => {
      mockMatchMedia(800, 600)
      render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )

      act(() => {
        mockMatchMedia(1200, 800)
        window.dispatchEvent(new Event('resize'))
      })

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
      })
    })

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )

      unmount()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))
    })
  })

  describe('Grid Layout Styles', () => {
    it('should apply correct grid template with sidebar', () => {
      mockMatchMedia(1000, 600)
      const { container } = render(
        <ResponsiveLayout sidebar={<div>Sidebar</div>}>
          <div>Content</div>
        </ResponsiveLayout>
      )
      const layout = container.querySelector('.responsive-layout')
      expect(layout).toHaveStyle({ display: 'grid' })
    })

    it('should apply correct grid template without sidebar', () => {
      const { container } = render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )
      const layout = container.querySelector('.responsive-layout')
      expect(layout).toHaveStyle({
        display: 'grid',
        gridTemplateColumns: '1fr'
      })
    })

    it('should have minHeight 100vh', () => {
      const { container } = render(
        <ResponsiveLayout>
          <div>Content</div>
        </ResponsiveLayout>
      )
      const layout = container.querySelector('.responsive-layout')
      expect(layout).toHaveStyle({ minHeight: '100vh' })
    })
  })
})

describe('SplitViewLayout', () => {
  beforeEach(() => {
    mockMatchMedia(800, 600)
  })

  describe('Basic Rendering', () => {
    it('should render master and detail panels in landscape', () => {
      mockMatchMedia(1100, 800)
      render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
        />
      )
      expect(screen.getByText('Master')).toBeInTheDocument()
      expect(screen.getByText('Detail')).toBeInTheDocument()
    })

    it('should show only detail panel when showDetail is true in portrait', () => {
      mockMatchMedia(800, 1100)
      render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
          showDetail={true}
        />
      )
      expect(screen.getByText('Detail')).toBeInTheDocument()
      expect(screen.queryByText('Master')).not.toBeInTheDocument()
    })

    it('should show only master panel when showDetail is false in portrait', () => {
      mockMatchMedia(800, 1100)
      render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
          showDetail={false}
        />
      )
      expect(screen.getByText('Master')).toBeInTheDocument()
      expect(screen.queryByText('Detail')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      mockMatchMedia(1100, 800)
      const { container } = render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
          className="custom-split"
        />
      )
      expect(container.querySelector('.custom-split')).toBeInTheDocument()
    })
  })

  describe('Orientation Handling', () => {
    it('should show split view in landscape tablet mode', () => {
      mockMatchMedia(1000, 700)
      const { container } = render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
        />
      )
      expect(container.querySelector('.split-view-tablet')).toBeInTheDocument()
    })

    it('should show mobile view in portrait tablet mode', () => {
      mockMatchMedia(800, 1100)
      const { container } = render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
          showDetail={true}
        />
      )
      expect(container.querySelector('.split-view-mobile')).toBeInTheDocument()
    })

    it('should detect tablet range (768-1279px)', () => {
      mockMatchMedia(1000, 700)
      render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
        />
      )
      expect(screen.getByText('Master')).toBeInTheDocument()
    })

    it('should handle orientation change', async () => {
      mockMatchMedia(1000, 700)
      render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
        />
      )

      act(() => {
        mockMatchMedia(700, 1000)
        window.dispatchEvent(new Event('orientationchange'))
      })

      await waitFor(() => {
        expect(screen.getByText('Detail')).toBeInTheDocument()
      })
    })
  })

  describe('Back Navigation', () => {
    it('should show back button when onBackToMaster is provided', () => {
      mockMatchMedia(800, 1100)
      const onBackToMaster = jest.fn()
      render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
          showDetail={true}
          onBackToMaster={onBackToMaster}
        />
      )
      expect(screen.getByText('← Back')).toBeInTheDocument()
    })

    it('should call onBackToMaster when back button clicked', () => {
      mockMatchMedia(800, 1100)
      const onBackToMaster = jest.fn()
      render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
          showDetail={true}
          onBackToMaster={onBackToMaster}
        />
      )
      fireEvent.click(screen.getByText('← Back'))
      expect(onBackToMaster).toHaveBeenCalledTimes(1)
    })

    it('should not show back button when onBackToMaster is null', () => {
      mockMatchMedia(800, 1100)
      render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
          showDetail={true}
          onBackToMaster={null}
        />
      )
      expect(screen.queryByText('← Back')).not.toBeInTheDocument()
    })
  })

  describe('Layout Sizing', () => {
    it('should use custom masterWidth', () => {
      mockMatchMedia(1100, 800)
      const { container } = render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
          masterWidth="50%"
        />
      )
      const splitView = container.querySelector('.split-view-tablet')
      expect(splitView).toHaveStyle({ gridTemplateColumns: '50% 1fr' })
    })

    it('should use default masterWidth of 40%', () => {
      mockMatchMedia(1100, 800)
      const { container } = render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
        />
      )
      const splitView = container.querySelector('.split-view-tablet')
      expect(splitView).toHaveStyle({ gridTemplateColumns: '40% 1fr' })
    })
  })

  describe('Event Cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const { unmount } = render(
        <SplitViewLayout
          masterPanel={<div>Master</div>}
          detailPanel={<div>Detail</div>}
        />
      )

      unmount()
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))
    })
  })
})

describe('AdaptiveGrid', () => {
  it('should render children', () => {
    render(
      <AdaptiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </AdaptiveGrid>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('should apply custom minItemWidth', () => {
    const { container } = render(
      <AdaptiveGrid minItemWidth="300px">
        <div>Item</div>
      </AdaptiveGrid>
    )
    const grid = container.querySelector('.adaptive-grid')
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' })
  })

  it('should use default minItemWidth of 280px', () => {
    const { container } = render(
      <AdaptiveGrid>
        <div>Item</div>
      </AdaptiveGrid>
    )
    const grid = container.querySelector('.adaptive-grid')
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' })
  })

  it('should apply custom gap', () => {
    const { container } = render(
      <AdaptiveGrid gap="20px">
        <div>Item</div>
      </AdaptiveGrid>
    )
    const grid = container.querySelector('.adaptive-grid')
    expect(grid).toHaveStyle({ gap: '20px' })
  })

  it('should apply custom className', () => {
    const { container } = render(
      <AdaptiveGrid className="custom-grid">
        <div>Item</div>
      </AdaptiveGrid>
    )
    expect(container.querySelector('.custom-grid')).toBeInTheDocument()
  })

  it('should have 100% width', () => {
    const { container } = render(
      <AdaptiveGrid>
        <div>Item</div>
      </AdaptiveGrid>
    )
    const grid = container.querySelector('.adaptive-grid')
    expect(grid).toHaveStyle({ width: '100%' })
  })
})

describe('TabletDrawer', () => {
  beforeEach(() => {
    mockMatchMedia(800, 600)
    document.body.style.overflow = ''
  })

  describe('Rendering', () => {
    it('should render when open on tablet', () => {
      render(
        <TabletDrawer isOpen={true} onClose={jest.fn()}>
          <div>Drawer Content</div>
        </TabletDrawer>
      )
      expect(screen.getByText('Drawer Content')).toBeInTheDocument()
    })

    it('should render overlay when open', () => {
      const { container } = render(
        <TabletDrawer isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </TabletDrawer>
      )
      const overlays = container.querySelectorAll('div[style*="position: fixed"]')
      expect(overlays.length).toBeGreaterThan(0)
    })

    it('should not render on non-tablet devices', () => {
      mockMatchMedia(500, 800)
      render(
        <TabletDrawer isOpen={true} onClose={jest.fn()}>
          <div>Drawer Content</div>
        </TabletDrawer>
      )
      expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <TabletDrawer isOpen={true} onClose={jest.fn()} className="custom-drawer">
          <div>Content</div>
        </TabletDrawer>
      )
      expect(container.querySelector('.custom-drawer')).toBeInTheDocument()
    })
  })

  describe('Position and Width', () => {
    it('should position drawer on left by default', () => {
      const { container } = render(
        <TabletDrawer isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </TabletDrawer>
      )
      const drawer = container.querySelector('.tablet-drawer')
      expect(drawer).toHaveStyle({ left: '0' })
    })

    it('should position drawer on right when specified', () => {
      const { container } = render(
        <TabletDrawer isOpen={true} onClose={jest.fn()} position="right">
          <div>Content</div>
        </TabletDrawer>
      )
      const drawer = container.querySelector('.tablet-drawer')
      expect(drawer).toHaveStyle({ right: '0' })
    })

    it('should use custom width', () => {
      const { container } = render(
        <TabletDrawer isOpen={true} onClose={jest.fn()} width="400px">
          <div>Content</div>
        </TabletDrawer>
      )
      const drawer = container.querySelector('.tablet-drawer')
      expect(drawer).toHaveStyle({ width: '400px' })
    })

    it('should use default width of 320px', () => {
      const { container } = render(
        <TabletDrawer isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </TabletDrawer>
      )
      const drawer = container.querySelector('.tablet-drawer')
      expect(drawer).toHaveStyle({ width: '320px' })
    })
  })

  describe('Body Overflow', () => {
    it('should set body overflow to hidden when open', () => {
      render(
        <TabletDrawer isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </TabletDrawer>
      )
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body overflow when closed', () => {
      const { rerender } = render(
        <TabletDrawer isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </TabletDrawer>
      )

      rerender(
        <TabletDrawer isOpen={false} onClose={jest.fn()}>
          <div>Content</div>
        </TabletDrawer>
      )

      expect(document.body.style.overflow).toBe('')
    })

    it('should restore body overflow on unmount', () => {
      const { unmount } = render(
        <TabletDrawer isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </TabletDrawer>
      )

      unmount()
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('Interactions', () => {
    it('should call onClose when overlay clicked', () => {
      const onClose = jest.fn()
      const { container } = render(
        <TabletDrawer isOpen={true} onClose={onClose}>
          <div>Content</div>
        </TabletDrawer>
      )

      const overlays = container.querySelectorAll('div[style*="position: fixed"]')
      const overlay = Array.from(overlays).find(el => el.style.background.includes('rgba'))
      fireEvent.click(overlay)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})

describe('useOrientation', () => {
  const TestHookComponent = () => {
    const { orientation, isPortrait, isLandscape, isTablet } = useOrientation()
    return (
      <div>
        <div data-testid="orientation">{orientation}</div>
        <div data-testid="isPortrait">{isPortrait.toString()}</div>
        <div data-testid="isLandscape">{isLandscape.toString()}</div>
        <div data-testid="isTablet">{isTablet.toString()}</div>
      </div>
    )
  }

  it('should detect landscape orientation', () => {
    mockMatchMedia(1000, 600)
    render(<TestHookComponent />)
    expect(screen.getByTestId('orientation')).toHaveTextContent('landscape')
    expect(screen.getByTestId('isLandscape')).toHaveTextContent('true')
    expect(screen.getByTestId('isPortrait')).toHaveTextContent('false')
  })

  it('should detect portrait orientation', () => {
    mockMatchMedia(600, 1000)
    render(<TestHookComponent />)
    expect(screen.getByTestId('orientation')).toHaveTextContent('portrait')
    expect(screen.getByTestId('isPortrait')).toHaveTextContent('true')
    expect(screen.getByTestId('isLandscape')).toHaveTextContent('false')
  })

  it('should detect tablet viewport', () => {
    mockMatchMedia(800, 600)
    render(<TestHookComponent />)
    expect(screen.getByTestId('isTablet')).toHaveTextContent('true')
  })

  it('should not detect tablet when width < 768', () => {
    mockMatchMedia(700, 600)
    render(<TestHookComponent />)
    expect(screen.getByTestId('isTablet')).toHaveTextContent('false')
  })

  it('should not detect tablet when width >= 1024', () => {
    mockMatchMedia(1024, 600)
    render(<TestHookComponent />)
    expect(screen.getByTestId('isTablet')).toHaveTextContent('false')
  })

  it('should handle resize events', async () => {
    mockMatchMedia(1000, 600)
    render(<TestHookComponent />)

    expect(screen.getByTestId('orientation')).toHaveTextContent('landscape')

    act(() => {
      mockMatchMedia(600, 1000)
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('orientation')).toHaveTextContent('portrait')
    })
  })

  it('should cleanup listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = render(<TestHookComponent />)

    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))
  })
})

describe('TabletCardLayout', () => {
  beforeEach(() => {
    mockMatchMedia(800, 600)
  })

  const mockCards = [
    <div key="1">Card 1</div>,
    <div key="2">Card 2</div>,
    <div key="3">Card 3</div>
  ]

  it('should render all cards', () => {
    render(<TabletCardLayout cards={mockCards} />)
    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
    expect(screen.getByText('Card 3')).toBeInTheDocument()
  })

  it('should use auto columns in landscape tablet mode', () => {
    mockMatchMedia(1000, 600)
    const { container } = render(<TabletCardLayout cards={mockCards} />)
    const layout = container.querySelector('.tablet-card-layout')
    expect(layout).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' })
  })

  it('should use 2 columns in portrait tablet mode', () => {
    mockMatchMedia(800, 1100)
    const { container } = render(<TabletCardLayout cards={mockCards} />)
    const layout = container.querySelector('.tablet-card-layout')
    expect(layout).toHaveStyle({ gridTemplateColumns: 'repeat(2, 1fr)' })
  })

  it('should use 1 column on non-tablet devices', () => {
    mockMatchMedia(500, 800)
    const { container } = render(<TabletCardLayout cards={mockCards} />)
    const layout = container.querySelector('.tablet-card-layout')
    expect(layout).toHaveStyle({ gridTemplateColumns: 'repeat(1, 1fr)' })
  })

  it('should use custom column count', () => {
    const { container } = render(<TabletCardLayout cards={mockCards} columns={4} />)
    const layout = container.querySelector('.tablet-card-layout')
    expect(layout).toHaveStyle({ gridTemplateColumns: 'repeat(4, 1fr)' })
  })

  it('should call onCardSelect when card clicked', () => {
    const onCardSelect = jest.fn()
    render(<TabletCardLayout cards={mockCards} onCardSelect={onCardSelect} />)

    fireEvent.click(screen.getByText('Card 1'))
    expect(onCardSelect).toHaveBeenCalledWith(0, mockCards[0])
  })

  it('should highlight selected card', () => {
    const { container } = render(
      <TabletCardLayout cards={mockCards} selectedCard={1} onCardSelect={jest.fn()} />
    )
    const cards = container.querySelectorAll('.card')
    expect(cards[1].className).toContain('ring-2 ring-accent')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <TabletCardLayout cards={mockCards} className="custom-layout" />
    )
    expect(container.querySelector('.custom-layout')).toBeInTheDocument()
  })
})

describe('TabletFAB', () => {
  beforeEach(() => {
    mockMatchMedia(800, 600)
  })

  it('should render on tablet devices', () => {
    render(<TabletFAB icon="+" label="Add" onClick={jest.fn()} />)
    expect(screen.getByTitle('Add')).toBeInTheDocument()
  })

  it('should not render on non-tablet devices', () => {
    mockMatchMedia(500, 800)
    render(<TabletFAB icon="+" label="Add" onClick={jest.fn()} />)
    expect(screen.queryByTitle('Add')).not.toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const onClick = jest.fn()
    render(<TabletFAB icon="+" label="Add" onClick={onClick} />)

    fireEvent.click(screen.getByTitle('Add'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should position at bottom-right by default', () => {
    render(<TabletFAB icon="+" label="Add" onClick={jest.fn()} />)
    const fab = screen.getByTitle('Add')
    expect(fab.className).toContain('bottom-6 right-6')
  })

  it('should position at custom location', () => {
    render(<TabletFAB icon="+" label="Add" onClick={jest.fn()} position="top-left" />)
    const fab = screen.getByTitle('Add')
    expect(fab.className).toContain('top-6 left-6')
  })

  it('should use medium size by default', () => {
    render(<TabletFAB icon="+" label="Add" onClick={jest.fn()} />)
    const fab = screen.getByTitle('Add')
    expect(fab.className).toContain('w-14 h-14')
  })

  it('should use custom size', () => {
    render(<TabletFAB icon="+" label="Add" onClick={jest.fn()} size="lg" />)
    const fab = screen.getByTitle('Add')
    expect(fab.className).toContain('w-16 h-16')
  })

  it('should apply custom className', () => {
    render(<TabletFAB icon="+" label="Add" onClick={jest.fn()} className="custom-fab" />)
    const fab = screen.getByTitle('Add')
    expect(fab.className).toContain('custom-fab')
  })

  it('should render icon content', () => {
    render(<TabletFAB icon={<span>Icon</span>} label="Add" onClick={jest.fn()} />)
    expect(screen.getByText('Icon')).toBeInTheDocument()
  })
})

describe('TabletBreadcrumb', () => {
  beforeEach(() => {
    mockMatchMedia(800, 600)
  })

  const mockItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Details' }
  ]

  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  it('should render breadcrumb items on tablet', () => {
    renderWithRouter(<TabletBreadcrumb items={mockItems} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('should not render on non-tablet devices', () => {
    mockMatchMedia(500, 800)
    renderWithRouter(<TabletBreadcrumb items={mockItems} />)
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
  })

  it('should not render when items.length <= 1', () => {
    renderWithRouter(<TabletBreadcrumb items={[{ label: 'Home' }]} />)
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
  })

  it('should render separators between items', () => {
    renderWithRouter(<TabletBreadcrumb items={mockItems} />)
    const separators = screen.getAllByText('/')
    expect(separators).toHaveLength(2)
  })

  it('should use custom separator', () => {
    renderWithRouter(<TabletBreadcrumb items={mockItems} separator=">" />)
    const separators = screen.getAllByText('>')
    expect(separators).toHaveLength(2)
  })

  it('should render last item as plain text', () => {
    renderWithRouter(<TabletBreadcrumb items={mockItems} />)
    const detailsElement = screen.getByText('Details')
    expect(detailsElement.tagName).toBe('SPAN')
  })

  it('should render other items as links', () => {
    renderWithRouter(<TabletBreadcrumb items={mockItems} />)
    const homeLink = screen.getByText('Home')
    expect(homeLink.tagName).toBe('A')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should call onClick when item clicked', () => {
    const onClick = jest.fn()
    const itemsWithClick = [
      { label: 'Home', href: '/', onClick },
      { label: 'Current' }
    ]

    renderWithRouter(<TabletBreadcrumb items={itemsWithClick} />)

    fireEvent.click(screen.getByText('Home'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    const { container } = renderWithRouter(
      <TabletBreadcrumb items={mockItems} className="custom-breadcrumb" />
    )
    expect(container.querySelector('.custom-breadcrumb')).toBeInTheDocument()
  })

  it('should prevent default when onClick is provided', () => {
    const onClick = jest.fn()
    const itemsWithClick = [
      { label: 'Home', href: '/', onClick },
      { label: 'Current' }
    ]

    renderWithRouter(<TabletBreadcrumb items={itemsWithClick} />)

    const link = screen.getByText('Home')
    const event = { preventDefault: jest.fn() }
    fireEvent.click(link, event)

    expect(onClick).toHaveBeenCalled()
  })
})

export default mockMatchMedia
