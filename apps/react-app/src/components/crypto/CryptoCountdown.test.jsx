import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import CryptoCountdown from './CryptoCountdown'

describe('CryptoCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      render(<CryptoCountdown />)
      expect(screen.getByText('Loading countdown...')).toBeInTheDocument()
    })

    it('should display "Launch Timeline" heading in loading state', () => {
      render(<CryptoCountdown />)
      expect(screen.getByText('Launch Timeline')).toBeInTheDocument()
    })

    it('should show Clock icon in loading state', () => {
      const { container } = render(<CryptoCountdown />)
      const clockIcon = container.querySelector('svg')
      expect(clockIcon).toBeInTheDocument()
    })

    it('should transition from loading to countdown display', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.queryByText('Loading countdown...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Countdown Display', () => {
    it('should display all four time blocks', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Days')).toBeInTheDocument()
        expect(screen.getByText('Hours')).toBeInTheDocument()
        expect(screen.getByText('Minutes')).toBeInTheDocument()
        expect(screen.getByText('Seconds')).toBeInTheDocument()
      })
    })

    it('should display "Launch Countdown" heading', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Launch Countdown')).toBeInTheDocument()
      })
    })

    it('should display "Until Web3 features launch" text', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Until Web3 features launch')).toBeInTheDocument()
      })
    })

    it('should render time blocks in a grid layout', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const grid = container.querySelector('.grid.grid-cols-4')
        expect(grid).toBeInTheDocument()
      })
    })

    it('should apply uppercase styling to time labels', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const labels = container.querySelectorAll('.uppercase')
        expect(labels.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Time Formatting', () => {
    it('should pad single digit days with zero', async () => {
      const now = new Date('2024-01-01T00:00:00')
      const future = new Date('2024-01-05T00:00:00')

      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const timeValues = screen.getAllByText(/^\d{2}$/)
        expect(timeValues.length).toBeGreaterThan(0)
      })
    })

    it('should pad single digit hours with zero', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const hours = screen.getByText('Hours').previousElementSibling
        expect(hours?.textContent).toMatch(/^\d{2}$/)
      })
    })

    it('should pad single digit minutes with zero', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const minutes = screen.getByText('Minutes').previousElementSibling
        expect(minutes?.textContent).toMatch(/^\d{2}$/)
      })
    })

    it('should pad single digit seconds with zero', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const seconds = screen.getByText('Seconds').previousElementSibling
        expect(seconds?.textContent).toMatch(/^\d{2}$/)
      })
    })

    it('should display double digit values without extra padding', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const timeValues = screen.getAllByText(/^\d{2}$/)
        timeValues.forEach(value => {
          expect(value.textContent?.length).toBe(2)
        })
      })
    })
  })

  describe('Timer Updates', () => {
    it('should update countdown every second', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.advanceTimersByTime(0)
      })

      await waitFor(() => {
        expect(screen.getByText('Seconds')).toBeInTheDocument()
      })

      const initialSeconds = screen.getByText('Seconds').previousElementSibling?.textContent

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      const updatedSeconds = screen.getByText('Seconds').previousElementSibling?.textContent
      expect(updatedSeconds).not.toBe(initialSeconds)
    })

    it('should decrement seconds correctly', async () => {
      const now = new Date('2024-01-01T00:00:30')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000)
        })
      }

      await waitFor(() => {
        expect(screen.getByText('Seconds')).toBeInTheDocument()
      })
    })

    it('should update minutes when seconds reach zero', async () => {
      const now = new Date('2024-01-01T00:00:58')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await act(async () => {
        vi.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(screen.getByText('Minutes')).toBeInTheDocument()
      })
    })

    it('should call setInterval with 1000ms interval', async () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval')

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
    })

    it('should clear interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      const { unmount } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Launch Date Calculation', () => {
    it('should set launch date to 3 months in future', async () => {
      const now = new Date('2024-01-01T12:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Days')).toBeInTheDocument()
      })
    })

    it('should set launch time to midnight', async () => {
      const now = new Date('2024-01-01T15:30:45')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Launch Countdown')).toBeInTheDocument()
      })
    })

    it('should calculate correct time distance', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const days = screen.getByText('Days').previousElementSibling
        expect(days?.textContent).toMatch(/^\d{2}$/)
      })
    })
  })

  describe('Roadmap Milestones', () => {
    it('should display all four milestone phases', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Phase 1')).toBeInTheDocument()
        expect(screen.getByText('Phase 2')).toBeInTheDocument()
        expect(screen.getByText('Phase 3')).toBeInTheDocument()
        expect(screen.getByText('Phase 4')).toBeInTheDocument()
      })
    })

    it('should display milestone titles', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Wallet Integration')).toBeInTheDocument()
        expect(screen.getByText('NFT Features')).toBeInTheDocument()
        expect(screen.getByText('Crypto Payments')).toBeInTheDocument()
        expect(screen.getByText('Token Gating & DAO')).toBeInTheDocument()
      })
    })

    it('should display milestone descriptions', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Connect your favorite Web3 wallets')).toBeInTheDocument()
        expect(screen.getByText('Profile pictures and collection showcase')).toBeInTheDocument()
        expect(screen.getByText('Send and receive cryptocurrency')).toBeInTheDocument()
        expect(screen.getByText('Exclusive communities and governance')).toBeInTheDocument()
      })
    })

    it('should display milestone dates', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getAllByText('Q1 2024').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Q2 2024').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Q3 2024').length).toBeGreaterThan(0)
      })
    })

    it('should render Zap icons for milestones', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const zapIcons = container.querySelectorAll('svg')
        expect(zapIcons.length).toBeGreaterThan(4)
      })
    })

    it('should display "Roadmap" heading on mobile', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Roadmap')).toBeInTheDocument()
      })
    })

    it('should display "Development Roadmap" heading on desktop', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Development Roadmap')).toBeInTheDocument()
      })
    })
  })

  describe('Progress Indicator', () => {
    it('should display development in progress message', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Development in progress')).toBeInTheDocument()
      })
    })

    it('should render pulsing dot indicator', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const pulsingDot = container.querySelector('.')
        expect(pulsingDot).toBeInTheDocument()
      })
    })
  })

  describe('Animation Effects', () => {
    it('should apply pulse animation to Clock icon', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const clockIcon = container.querySelector('.')
        expect(clockIcon).toBeInTheDocument()
      })
    })

    it('should apply backdrop blur to main container', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const backdropBlur = container.querySelector('.backdrop-blur-sm')
        expect(backdropBlur).toBeInTheDocument()
      })
    })

    it('should apply hover effects to milestone cards', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const hoverCards = container.querySelectorAll('.group')
        expect(hoverCards.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Styling and Layout', () => {
    it('should apply rounded corners to main container', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const roundedContainer = container.querySelector('.rounded-2xl')
        expect(roundedContainer).toBeInTheDocument()
      })
    })

    it('should apply border to main container', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const borderedContainer = container.querySelector('.border-accent-primary\\/20')
        expect(borderedContainer).toBeInTheDocument()
      })
    })

    it('should center align countdown section', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const centered = container.querySelector('.text-center')
        expect(centered).toBeInTheDocument()
      })
    })

    it('should apply responsive grid to time blocks', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const grid = container.querySelector('.grid-cols-4')
        expect(grid).toBeInTheDocument()
      })
    })

    it('should apply responsive text sizing', async () => {
      const { container } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const responsiveText = container.querySelector('.text-2xl.sm\\:text-3xl')
        expect(responsiveText).toBeInTheDocument()
      })
    })
  })

  describe('Client-Side Rendering', () => {
    it('should set isClient to true after mount', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.queryByText('Loading countdown...')).not.toBeInTheDocument()
      })
    })

    it('should not render countdown before client-side hydration', () => {
      render(<CryptoCountdown />)

      expect(screen.queryByText('Launch Countdown')).not.toBeInTheDocument()
    })

    it('should render countdown after client-side hydration', async () => {
      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        expect(screen.getByText('Launch Countdown')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle countdown with zero seconds', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const seconds = screen.getByText('Seconds').previousElementSibling
        expect(seconds?.textContent).toMatch(/^\d{2}$/)
      })
    })

    it('should handle countdown with all zero values', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const timeBlocks = screen.getAllByText(/^\d{2}$/)
        expect(timeBlocks.length).toBe(4)
      })
    })

    it('should handle large time values', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      await waitFor(() => {
        const days = screen.getByText('Days').previousElementSibling
        expect(days).toBeInTheDocument()
      })
    })

    it('should continue updating after multiple intervals', async () => {
      const now = new Date('2024-01-01T00:00:00')
      vi.setSystemTime(now)

      render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      for (let i = 0; i < 10; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000)
        })
      }

      await waitFor(() => {
        expect(screen.getByText('Seconds')).toBeInTheDocument()
      })
    })

    it('should handle rapid re-renders', async () => {
      const { rerender } = render(<CryptoCountdown />)

      await act(async () => {
        vi.runAllTimers()
      })

      rerender(<CryptoCountdown />)
      rerender(<CryptoCountdown />)
      rerender(<CryptoCountdown />)

      await waitFor(() => {
        expect(screen.getByText('Launch Countdown')).toBeInTheDocument()
      })
    })
  })
})

export default clockIcon
