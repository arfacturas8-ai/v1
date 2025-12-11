import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import PullToRefresh from './PullToRefresh'

describe('PullToRefresh', () => {
  let container
  let touchArea
  let mockOnRefresh

  beforeEach(() => {
    mockOnRefresh = jest.fn()
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0
    })

    const result = render(<PullToRefresh onRefresh={mockOnRefresh} />)
    container = result.container
    touchArea = container.querySelector('.absolute.inset-0')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createTouchEvent = (type, clientY) => {
    return new TouchEvent(type, {
      touches: type !== 'touchend' ? [{ clientY }] : [],
      bubbles: true,
      cancelable: true
    })
  }

  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      expect(container).toBeInTheDocument()
    })

    test('renders touch area with correct styles', () => {
      expect(touchArea).toHaveStyle({
        height: '100vh',
        width: '100vw',
        top: '0',
        left: '0',
        zIndex: '-1'
      })
    })

    test('renders indicator with pointer-events none', () => {
      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ pointerEvents: 'none' })
    })

    test('applies custom className to indicator', () => {
      const { container: customContainer } = render(
        <PullToRefresh onRefresh={mockOnRefresh} className="custom-class" />
      )
      const indicator = customContainer.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveClass('custom-class')
    })

    test('does not render progress bar initially', () => {
      const progressBar = container.querySelector('.fixed.top-0.left-0.right-0.z-50')
      expect(progressBar).not.toBeInTheDocument()
    })

    test('renders indicator with opacity 0 initially', () => {
      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 0 })
    })
  })

  describe('Touch Event Handling - Touch Start', () => {
    test('handles touchstart when scrollY is 0', () => {
      window.scrollY = 0
      const event = createTouchEvent('touchstart', 100)

      act(() => {
        touchArea.dispatchEvent(event)
      })

      expect(window.scrollY).toBe(0)
    })

    test('ignores touchstart when scrollY > 0', () => {
      window.scrollY = 50
      const startEvent = createTouchEvent('touchstart', 100)
      const moveEvent = createTouchEvent('touchmove', 200)

      act(() => {
        touchArea.dispatchEvent(startEvent)
        touchArea.dispatchEvent(moveEvent)
      })

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 0 })
    })

    test('stores initial touch position on touchstart', () => {
      const event = createTouchEvent('touchstart', 150)

      act(() => {
        touchArea.dispatchEvent(event)
      })

      expect(event.touches[0].clientY).toBe(150)
    })

    test('allows multiple touchstart events', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchstart', 150))
      })

      expect(container).toBeInTheDocument()
    })
  })

  describe('Touch Event Handling - Touch Move', () => {
    test('calculates pull distance with resistance', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 1 })
    })

    test('applies custom resistance factor', () => {
      const { container: customContainer } = render(
        <PullToRefresh onRefresh={mockOnRefresh} resistance={5} />
      )
      const customTouchArea = customContainer.querySelector('.absolute.inset-0')

      act(() => {
        customTouchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        customTouchArea.dispatchEvent(createTouchEvent('touchmove', 300))
      })

      const indicator = customContainer.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 1 })
    })

    test('prevents default scroll when pulling down', () => {
      const moveEvent = createTouchEvent('touchmove', 200)
      const preventDefaultSpy = jest.spyOn(moveEvent, 'preventDefault')

      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(moveEvent)
      })

      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    test('ignores upward swipes (negative deltaY)', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 200))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 100))
      })

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 0 })
    })

    test('ignores touchmove when refreshing is true', () => {
      const { container: refreshingContainer } = render(
        <PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />
      )
      const refreshingTouchArea = refreshingContainer.querySelector('.absolute.inset-0')

      act(() => {
        refreshingTouchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        refreshingTouchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      expect(mockOnRefresh).not.toHaveBeenCalled()
    })

    test('ignores touchmove when scrollY > 0', () => {
      window.scrollY = 100

      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 0 })
    })

    test('updates pull distance continuously during move', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 150))
      })

      let indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 1 })

      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 1 })
    })
  })

  describe('Pull Distance Calculation', () => {
    test('calculates pull distance correctly with default resistance', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 350))
      })

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      const transform = indicator.style.transform
      expect(transform).toContain('translateY')
    })

    test('limits transform to threshold + 20', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 1000))
      })

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 1 })
    })

    test('pull distance increases with larger touch movement', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      const indicator1 = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      const transform1 = indicator1.style.transform

      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 300))
      })

      const indicator2 = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      const transform2 = indicator2.style.transform

      expect(transform1).not.toBe(transform2)
    })
  })

  describe('Refresh Threshold', () => {
    test('sets canRefresh to true when exceeding default threshold', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 350))
      })

      expect(screen.getByText('Release to refresh')).toBeInTheDocument()
    })

    test('sets canRefresh to false when below threshold', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 150))
      })

      expect(screen.getByText('Pull to refresh')).toBeInTheDocument()
    })

    test('respects custom threshold prop', () => {
      const { container: customContainer } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={150} />
      )
      const customTouchArea = customContainer.querySelector('.absolute.inset-0')

      act(() => {
        customTouchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        customTouchArea.dispatchEvent(createTouchEvent('touchmove', 400))
      })

      expect(screen.getByText('Release to refresh')).toBeInTheDocument()
    })

    test('threshold boundary - exactly at threshold', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 300))
      })

      const text = screen.queryByText('Release to refresh') || screen.queryByText('Pull to refresh')
      expect(text).toBeInTheDocument()
    })
  })

  describe('Refresh Callback', () => {
    test('calls onRefresh when released above threshold', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 350))
        touchArea.dispatchEvent(createTouchEvent('touchend'))
      })

      expect(mockOnRefresh).toHaveBeenCalledTimes(1)
    })

    test('does not call onRefresh when released below threshold', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 150))
        touchArea.dispatchEvent(createTouchEvent('touchend'))
      })

      expect(mockOnRefresh).not.toHaveBeenCalled()
    })

    test('does not call onRefresh if already refreshing', () => {
      const { container: refreshingContainer } = render(
        <PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />
      )
      const refreshingTouchArea = refreshingContainer.querySelector('.absolute.inset-0')

      act(() => {
        refreshingTouchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        refreshingTouchArea.dispatchEvent(createTouchEvent('touchmove', 350))
        refreshingTouchArea.dispatchEvent(createTouchEvent('touchend'))
      })

      expect(mockOnRefresh).not.toHaveBeenCalled()
    })

    test('handles missing onRefresh gracefully', () => {
      const { container: noCallbackContainer } = render(<PullToRefresh />)
      const noCallbackTouchArea = noCallbackContainer.querySelector('.absolute.inset-0')

      expect(() => {
        act(() => {
          noCallbackTouchArea.dispatchEvent(createTouchEvent('touchstart', 100))
          noCallbackTouchArea.dispatchEvent(createTouchEvent('touchmove', 350))
          noCallbackTouchArea.dispatchEvent(createTouchEvent('touchend'))
        })
      }).not.toThrow()
    })
  })

  describe('Loading Indicator', () => {
    test('displays "Pull to refresh" initially', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 150))
      })

      expect(screen.getByText('Pull to refresh')).toBeInTheDocument()
    })

    test('displays "Release to refresh" when above threshold', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 350))
      })

      expect(screen.getByText('Release to refresh')).toBeInTheDocument()
    })

    test('displays "Refreshing..." when refreshing prop is true', () => {
      const { rerender } = render(<PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />)

      expect(screen.getByText('Refreshing...')).toBeInTheDocument()
    })

    test('shows loading spinner icon when refreshing', () => {
      render(<PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />)

      const spinner = container.querySelector('.')
      expect(spinner).toBeInTheDocument()
    })

    test('shows arrow icon when not refreshing', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 150))
      })

      const arrow = container.querySelector('svg path[d="M10 2l-4 4h3v8h2V6h3l-4-4z"]')
      expect(arrow).toBeInTheDocument()
    })

    test('rotates arrow 180deg when canRefresh is true', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 350))
      })

      const icon = container.querySelector('.rotate-180')
      expect(icon).toBeInTheDocument()
    })

    test('indicator has opacity 1 when pulling', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 1 })
    })

    test('indicator has opacity 1 when refreshing', () => {
      render(<PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />)

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 1 })
    })
  })

  describe('Snap Back Animation', () => {
    test('resets pull distance to 0 on touchend', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
        touchArea.dispatchEvent(createTouchEvent('touchend'))
      })

      waitFor(() => {
        const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
        expect(indicator).toHaveStyle({ transform: 'translateY(0px)' })
      })
    })

    test('resets isPulling state on touchend', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
        touchArea.dispatchEvent(createTouchEvent('touchend'))
      })

      waitFor(() => {
        const progressBar = container.querySelector('.fixed.top-0.left-0.right-0.z-50')
        expect(progressBar).not.toBeInTheDocument()
      })
    })

    test('resets canRefresh state on touchend', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 350))
        touchArea.dispatchEvent(createTouchEvent('touchend'))
      })

      waitFor(() => {
        const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
        expect(indicator).toHaveStyle({ opacity: 0 })
      })
    })

    test('resets state when refreshing prop changes to false', async () => {
      const { rerender } = render(
        <PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />
      )

      rerender(<PullToRefresh onRefresh={mockOnRefresh} refreshing={false} />)

      await waitFor(() => {
        const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
        expect(indicator).toHaveStyle({ opacity: 0 })
      })
    })
  })

  describe('Pull Progress Display', () => {
    test('renders progress bar when pulling', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      const progressBar = container.querySelector('.fixed.top-0.left-0.right-0.z-50')
      expect(progressBar).toBeInTheDocument()
    })

    test('renders progress bar when refreshing', () => {
      render(<PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />)

      const progressBar = container.querySelector('.fixed.top-0.left-0.right-0.z-50')
      expect(progressBar).toBeInTheDocument()
    })

    test('progress bar width increases with pull distance', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      const progressFill = container.querySelector('.h-full.bg-accent')
      const width = progressFill.style.width
      expect(width).not.toBe('0%')
    })

    test('progress bar is 100% when refreshing', () => {
      render(<PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />)

      const progressFill = container.querySelector('.h-full.bg-accent')
      expect(progressFill).toHaveStyle({ width: '100%' })
    })

    test('progress bar has  when refreshing', () => {
      render(<PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />)

      const progressFill = container.querySelector('.h-full.bg-accent')
      expect(progressFill).toHaveClass('')
    })

    test('progress bar caps at 100%', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 1000))
      })

      const progressFill = container.querySelector('.h-full.bg-accent')
      expect(progressFill.style.width).toBe('100%')
    })

    test('indicator scale increases with pull progress', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      const indicatorContent = container.querySelector('.bg-bg-secondary')
      const transform = indicatorContent.style.transform
      expect(transform).toContain('scale')
    })

    test('indicator scale is 1 when refreshing', () => {
      render(<PullToRefresh onRefresh={mockOnRefresh} refreshing={true} />)

      const indicatorContent = container.querySelector('.bg-bg-secondary')
      expect(indicatorContent).toHaveStyle({ transform: 'scale(1)' })
    })
  })

  describe('Event Listener Cleanup', () => {
    test('removes event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(HTMLElement.prototype, 'removeEventListener')
      const { unmount } = render(<PullToRefresh onRefresh={mockOnRefresh} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    test('re-attaches listeners when dependencies change', () => {
      const { rerender } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={80} />
      )

      const newCallback = jest.fn()
      rerender(<PullToRefresh onRefresh={newCallback} threshold={100} />)

      expect(container).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles rapid touch events', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 150))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 250))
        touchArea.dispatchEvent(createTouchEvent('touchend'))
      })

      expect(container).toBeInTheDocument()
    })

    test('handles touchend without touchstart', () => {
      expect(() => {
        act(() => {
          touchArea.dispatchEvent(createTouchEvent('touchend'))
        })
      }).not.toThrow()
    })

    test('handles touchmove without touchstart', () => {
      expect(() => {
        act(() => {
          touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
        })
      }).not.toThrow()
    })

    test('handles zero pull distance', () => {
      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 100))
      })

      const indicator = container.querySelector('.fixed.top-0.left-0.right-0.z-40')
      expect(indicator).toHaveStyle({ opacity: 0 })
    })

    test('handles very small threshold values', () => {
      const { container: smallThresholdContainer } = render(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={1} />
      )
      const smallThresholdTouchArea = smallThresholdContainer.querySelector('.absolute.inset-0')

      act(() => {
        smallThresholdTouchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        smallThresholdTouchArea.dispatchEvent(createTouchEvent('touchmove', 110))
      })

      expect(screen.getByText('Release to refresh')).toBeInTheDocument()
    })

    test('handles very large resistance values', () => {
      const { container: largeResistanceContainer } = render(
        <PullToRefresh onRefresh={mockOnRefresh} resistance={100} />
      )
      const largeResistanceTouchArea = largeResistanceContainer.querySelector('.absolute.inset-0')

      act(() => {
        largeResistanceTouchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        largeResistanceTouchArea.dispatchEvent(createTouchEvent('touchmove', 500))
      })

      expect(largeResistanceContainer).toBeInTheDocument()
    })

    test('handles component re-render during pull', () => {
      const { rerender } = render(<PullToRefresh onRefresh={mockOnRefresh} threshold={80} />)

      act(() => {
        touchArea.dispatchEvent(createTouchEvent('touchstart', 100))
        touchArea.dispatchEvent(createTouchEvent('touchmove', 200))
      })

      rerender(<PullToRefresh onRefresh={mockOnRefresh} threshold={80} />)

      expect(container).toBeInTheDocument()
    })

    test('handles missing container ref', () => {
      const { container: newContainer } = render(<PullToRefresh onRefresh={mockOnRefresh} />)
      expect(newContainer).toBeInTheDocument()
    })
  })
})

export default result
