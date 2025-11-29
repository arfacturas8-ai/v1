import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import VoteControls from './VoteControls'

describe('VoteControls', () => {
  describe('Vote Display', () => {
    it('should display initial score correctly', () => {
      render(<VoteControls postId="1" initialScore={42} />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should display score with K suffix for thousands', () => {
      render(<VoteControls postId="1" initialScore={1500} />)
      expect(screen.getByText('1.5K')).toBeInTheDocument()
    })

    it('should display score with M suffix for millions', () => {
      render(<VoteControls postId="1" initialScore={2500000} />)
      expect(screen.getByText('2.5M')).toBeInTheDocument()
    })

    it('should display negative scores correctly', () => {
      render(<VoteControls postId="1" initialScore={-42} />)
      expect(screen.getByText('-42')).toBeInTheDocument()
    })

    it('should display negative scores with K suffix', () => {
      render(<VoteControls postId="1" initialScore={-1500} />)
      expect(screen.getByText('-1.5K')).toBeInTheDocument()
    })

    it('should display zero score', () => {
      render(<VoteControls postId="1" initialScore={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should update score when initialScore prop changes', () => {
      const { rerender } = render(<VoteControls postId="1" initialScore={10} />)
      expect(screen.getByText('10')).toBeInTheDocument()

      rerender(<VoteControls postId="1" initialScore={20} />)
      expect(screen.getByText('20')).toBeInTheDocument()
    })
  })

  describe('Upvote Button', () => {
    it('should render upvote button', () => {
      render(<VoteControls postId="1" initialScore={0} />)
      expect(screen.getByLabelText('Upvote')).toBeInTheDocument()
    })

    it('should call onVote when upvote button is clicked', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={0} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({
            postId: '1',
            voteType: 'upvote',
            newVote: 'upvote',
            weight: 1,
            userKarma: 0
          })
        )
      })
    })

    it('should optimistically update score on upvote', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument()
      })
    })

    it('should highlight upvote button when active', () => {
      render(<VoteControls postId="1" initialScore={0} userVote="upvote" />)
      const button = screen.getByLabelText('Upvote')
      expect(button).toHaveClass('text-accent', 'bg-accent/8')
    })

    it('should remove upvote when clicking upvote button again', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} userVote="upvote" onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({
            newVote: null
          })
        )
      })
    })

    it('should decrease score when removing upvote', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={11} userVote="upvote" onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })
    })
  })

  describe('Downvote Button', () => {
    it('should render downvote button', () => {
      render(<VoteControls postId="1" initialScore={0} />)
      expect(screen.getByLabelText('Downvote')).toBeInTheDocument()
    })

    it('should call onVote when downvote button is clicked', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={0} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({
            postId: '1',
            voteType: 'downvote',
            newVote: 'downvote',
            weight: 1
          })
        )
      })
    })

    it('should optimistically update score on downvote', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument()
      })
    })

    it('should highlight downvote button when active', () => {
      render(<VoteControls postId="1" initialScore={0} userVote="downvote" />)
      const button = screen.getByLabelText('Downvote')
      expect(button).toHaveClass('text-accent', 'bg-accent/8')
    })

    it('should remove downvote when clicking downvote button again', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} userVote="downvote" onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({
            newVote: null
          })
        )
      })
    })

    it('should increase score when removing downvote', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={9} userVote="downvote" onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })
    })
  })

  describe('Vote Count Display', () => {
    it('should show green text when upvoted', () => {
      render(<VoteControls postId="1" initialScore={10} userVote="upvote" />)
      const scoreElement = screen.getByText('10')
      expect(scoreElement).toHaveClass('text-green-500')
    })

    it('should show red text when downvoted', () => {
      render(<VoteControls postId="1" initialScore={10} userVote="downvote" />)
      const scoreElement = screen.getByText('10')
      expect(scoreElement).toHaveClass('text-red-500')
    })

    it('should show muted text when no vote', () => {
      render(<VoteControls postId="1" initialScore={10} />)
      const scoreElement = screen.getByText('10')
      expect(scoreElement).toHaveClass('text-muted/70')
    })

    it('should display vote weight multiplier when weight > 1', () => {
      render(<VoteControls postId="1" initialScore={10} userKarma={5000} />)
      expect(screen.getByText('2.0x')).toBeInTheDocument()
    })

    it('should not display vote weight multiplier when weight = 1', () => {
      render(<VoteControls postId="1" initialScore={10} userKarma={0} />)
      expect(screen.queryByText(/x$/)).not.toBeInTheDocument()
    })
  })

  describe('Active State Highlighting', () => {
    it('should apply active styles only to upvote when upvoted', () => {
      render(<VoteControls postId="1" initialScore={0} userVote="upvote" />)

      const upvoteButton = screen.getByLabelText('Upvote')
      const downvoteButton = screen.getByLabelText('Downvote')

      expect(upvoteButton).toHaveClass('text-accent', 'bg-accent/8')
      expect(downvoteButton).not.toHaveClass('text-accent', 'bg-accent/8')
    })

    it('should apply active styles only to downvote when downvoted', () => {
      render(<VoteControls postId="1" initialScore={0} userVote="downvote" />)

      const upvoteButton = screen.getByLabelText('Upvote')
      const downvoteButton = screen.getByLabelText('Downvote')

      expect(downvoteButton).toHaveClass('text-accent', 'bg-accent/8')
      expect(upvoteButton).not.toHaveClass('text-accent', 'bg-accent/8')
    })

    it('should not apply active styles when no vote', () => {
      render(<VoteControls postId="1" initialScore={0} />)

      const upvoteButton = screen.getByLabelText('Upvote')
      const downvoteButton = screen.getByLabelText('Downvote')

      expect(upvoteButton).not.toHaveClass('bg-accent/8')
      expect(downvoteButton).not.toHaveClass('bg-accent/8')
    })

    it('should update active state when switching from upvote to downvote', async () => {
      const onVote = jest.fn().mockResolvedValue()
      const { rerender } = render(
        <VoteControls postId="1" initialScore={10} userVote="upvote" onVote={onVote} />
      )

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(screen.getByLabelText('Downvote')).toHaveClass('text-accent', 'bg-accent/8')
        expect(screen.getByLabelText('Upvote')).not.toHaveClass('bg-accent/8')
      })
    })

    it('should fill SVG icon when button is active', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} userVote="upvote" />)
      const upvoteSvg = screen.getByLabelText('Upvote').querySelector('svg')
      expect(upvoteSvg).toHaveClass('fill-current')
    })
  })

  describe('Optimistic Updates', () => {
    it('should optimistically change from no vote to upvote', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      expect(screen.getByText('11')).toBeInTheDocument()
    })

    it('should optimistically change from upvote to downvote', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={11} userVote="upvote" onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument()
      })
    })

    it('should revert score on API error', async () => {
      const onVote = jest.fn().mockRejectedValue(new Error('API Error'))
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })
    })

    it('should revert vote state on API error', async () => {
      const onVote = jest.fn().mockRejectedValue(new Error('API Error'))
      render(<VoteControls postId="1" initialScore={10} userVote={null} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(screen.getByLabelText('Upvote')).not.toHaveClass('bg-accent/8')
      })
    })

    it('should handle optimistic update with vote weight', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} userKarma={5000} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument()
      })
    })
  })

  describe('Vote Animations', () => {
    it('should apply animation class when voting', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      expect(screen.getByLabelText('Upvote')).toHaveClass('animate-pulse')
    })

    it('should remove animation class after vote completes', async () => {
      jest.useFakeTimers()
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByLabelText('Upvote')).not.toHaveClass('animate-pulse')
      })

      jest.useRealTimers()
    })

    it('should apply scale animation to score during voting', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      const scoreElement = screen.getByText('11')
      expect(scoreElement).toHaveClass('scale-105')
    })

    it('should prevent multiple votes during animation', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))
      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Orientation Variants', () => {
    it('should render vertical orientation by default', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} />)
      expect(container.firstChild).toHaveClass('flex-col')
    })

    it('should render vertical orientation when specified', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} orientation="vertical" />)
      expect(container.firstChild).toHaveClass('flex-col')
    })

    it('should render horizontal orientation when specified', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} orientation="horizontal" />)
      expect(container.firstChild).not.toHaveClass('flex-col')
      expect(container.firstChild).toHaveClass('flex')
    })

    it('should apply correct spacing for vertical orientation', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} orientation="vertical" size="md" />)
      expect(container.firstChild).toHaveClass('gap-1')
    })

    it('should apply correct spacing for horizontal orientation', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} orientation="horizontal" size="md" />)
      expect(container.firstChild).toHaveClass('gap-1')
    })
  })

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} size="sm" />)
      expect(container.firstChild).toHaveClass('text-xs')
    })

    it('should apply medium size classes', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} size="md" />)
      expect(container.firstChild).toHaveClass('text-sm')
    })

    it('should apply large size classes', () => {
      const { container } = render(<VoteControls postId="1" initialScore={0} size="lg" />)
      expect(container.firstChild).toHaveClass('text-base')
    })

    it('should apply small button size classes', () => {
      render(<VoteControls postId="1" initialScore={0} size="sm" />)
      expect(screen.getByLabelText('Upvote')).toHaveClass('w-6', 'h-6')
    })

    it('should apply medium button size classes', () => {
      render(<VoteControls postId="1" initialScore={0} size="md" />)
      expect(screen.getByLabelText('Upvote')).toHaveClass('w-7', 'h-7')
    })

    it('should apply large button size classes', () => {
      render(<VoteControls postId="1" initialScore={0} size="lg" />)
      expect(screen.getByLabelText('Upvote')).toHaveClass('w-8', 'h-8')
    })
  })

  describe('Disabled State', () => {
    it('should disable buttons when disabled prop is true', () => {
      render(<VoteControls postId="1" initialScore={0} disabled={true} />)

      expect(screen.getByLabelText('Upvote')).toBeDisabled()
      expect(screen.getByLabelText('Downvote')).toBeDisabled()
    })

    it('should apply disabled styles when disabled', () => {
      render(<VoteControls postId="1" initialScore={0} disabled={true} />)

      expect(screen.getByLabelText('Upvote')).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('should not call onVote when disabled', async () => {
      const onVote = jest.fn()
      render(<VoteControls postId="1" initialScore={0} disabled={true} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      expect(onVote).not.toHaveBeenCalled()
    })

    it('should enable buttons when disabled prop is false', () => {
      render(<VoteControls postId="1" initialScore={0} disabled={false} />)

      expect(screen.getByLabelText('Upvote')).not.toBeDisabled()
      expect(screen.getByLabelText('Downvote')).not.toBeDisabled()
    })
  })

  describe('Vote Weight Calculation', () => {
    it('should calculate weight 1 for karma < 100', () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={0} userKarma={50} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({ weight: 1 })
        )
      })
    })

    it('should calculate weight 1.2 for karma >= 100', () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={0} userKarma={100} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({ weight: 1.2 })
        )
      })
    })

    it('should calculate weight 1.5 for karma >= 1000', () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={0} userKarma={1000} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({ weight: 1.5 })
        )
      })
    })

    it('should calculate weight 2 for karma >= 5000', () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={0} userKarma={5000} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({ weight: 2 })
        )
      })
    })

    it('should calculate weight 2.5 for karma >= 10000', () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={0} userKarma={10000} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({ weight: 2.5 })
        )
      })
    })

    it('should calculate weight 3 for karma >= 50000', () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={0} userKarma={50000} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({ weight: 3 })
        )
      })
    })

    it('should apply community high karma bonus', () => {
      const communityRules = {
        highKarmaBonus: true,
        highKarmaThreshold: 1000,
        highKarmaMultiplier: 2
      }
      render(<VoteControls postId="1" initialScore={0} userKarma={1000} communityRules={communityRules} />)

      expect(screen.getByText('3.0x')).toBeInTheDocument()
    })

    it('should not exceed max vote weight', () => {
      const communityRules = {
        highKarmaBonus: true,
        highKarmaThreshold: 1000,
        highKarmaMultiplier: 5,
        maxVoteWeight: 2
      }
      render(<VoteControls postId="1" initialScore={0} userKarma={50000} communityRules={communityRules} />)

      expect(screen.getByText('2.0x')).toBeInTheDocument()
    })

    it('should apply trusted user bonus', () => {
      const communityRules = {
        trustedUsers: ['1']
      }
      render(<VoteControls postId="1" initialScore={0} userKarma={100} communityRules={communityRules} />)

      expect(screen.getByText('1.6x')).toBeInTheDocument()
    })
  })

  describe('Rate Limiting', () => {
    it('should prevent rapid successive votes', async () => {
      jest.useFakeTimers()
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))
      jest.advanceTimersByTime(500)
      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledTimes(1)
      })

      jest.useRealTimers()
    })

    it('should allow votes after rate limit period', async () => {
      jest.useFakeTimers()
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledTimes(1)
      })

      jest.advanceTimersByTime(1500)

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledTimes(2)
      })

      jest.useRealTimers()
    })
  })

  describe('Controversy Indicator', () => {
    it('should not show controversy indicator when showControvery is false', () => {
      const { container } = render(
        <VoteControls postId="1" initialScore={10} showControvery={false} controversyScore={0.8} />
      )
      expect(container.querySelector('.text-orange-500')).not.toBeInTheDocument()
    })

    it('should not show controversy indicator when score is below threshold', () => {
      const { container } = render(
        <VoteControls postId="1" initialScore={10} showControvery={true} controversyScore={0.4} />
      )
      expect(container.querySelector('.text-orange-500')).not.toBeInTheDocument()
    })

    it('should show controversy indicator when enabled and score is high', () => {
      const { container } = render(
        <VoteControls postId="1" initialScore={10} showControvery={true} controversyScore={0.8} />
      )
      expect(container.querySelector('.text-orange-500')).toBeInTheDocument()
    })

    it('should show controversy indicator at threshold value', () => {
      const { container } = render(
        <VoteControls postId="1" initialScore={10} showControvery={true} controversyScore={0.5} />
      )
      expect(container.querySelector('.text-orange-500')).toBeInTheDocument()
    })

    it('should show controversy score in title attribute', () => {
      const { container } = render(
        <VoteControls postId="1" initialScore={10} showControvery={true} controversyScore={0.87} />
      )
      const indicator = container.querySelector('[title*="Controversy Score"]')
      expect(indicator).toHaveAttribute('title', 'Controversy Score: 0.87')
    })

    it('should apply pulse animation to controversy indicator', () => {
      const { container } = render(
        <VoteControls postId="1" initialScore={10} showControvery={true} controversyScore={0.9} />
      )
      const svg = container.querySelector('.text-orange-500')
      expect(svg).toHaveClass('animate-pulse')
    })
  })

  describe('Vote Fuzzing', () => {
    it('should not apply fuzzing to scores below 10', () => {
      render(<VoteControls postId="1" initialScore={5} fuzzing={true} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should apply fuzzing when enabled and score >= 10', () => {
      const { container } = render(<VoteControls postId="1" initialScore={100} fuzzing={true} />)
      const scoreText = container.querySelector('.font-medium').textContent
      const scoreValue = parseInt(scoreText)
      expect(scoreValue).toBeGreaterThanOrEqual(90)
      expect(scoreValue).toBeLessThanOrEqual(110)
    })

    it('should not apply fuzzing when disabled', () => {
      render(<VoteControls postId="1" initialScore={100} fuzzing={false} />)
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should not display negative fuzzed scores', () => {
      render(<VoteControls postId="1" initialScore={10} fuzzing={true} />)
      const scoreText = screen.getByText(/\d+/).textContent
      const scoreValue = parseInt(scoreText)
      expect(scoreValue).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling', () => {
    it('should log error to console on vote failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const onVote = jest.fn().mockRejectedValue(new Error('Network error'))
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Vote failed:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('should remove animation class after error', async () => {
      jest.useFakeTimers()
      const onVote = jest.fn().mockRejectedValue(new Error('API Error'))
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(screen.getByLabelText('Upvote')).not.toHaveClass('animate-pulse')
      })

      jest.useRealTimers()
    })

    it('should handle missing onVote callback gracefully', async () => {
      render(<VoteControls postId="1" initialScore={10} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for upvote button', () => {
      render(<VoteControls postId="1" initialScore={0} />)
      expect(screen.getByLabelText('Upvote')).toBeInTheDocument()
    })

    it('should have proper aria-label for downvote button', () => {
      render(<VoteControls postId="1" initialScore={0} />)
      expect(screen.getByLabelText('Downvote')).toBeInTheDocument()
    })

    it('should show detailed vote information in title attribute', () => {
      const { container } = render(<VoteControls postId="1" initialScore={10} userKarma={5000} />)
      const scoreElement = container.querySelector('[title*="Actual score"]')
      expect(scoreElement).toHaveAttribute('title', expect.stringContaining('Actual score: 10'))
      expect(scoreElement).toHaveAttribute('title', expect.stringContaining('Your vote weight: 2.0x'))
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete vote flow from upvote to downvote', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(screen.getByText('11')).toBeInTheDocument()
        expect(screen.getByLabelText('Upvote')).toHaveClass('bg-accent/8')
      })

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument()
        expect(screen.getByLabelText('Downvote')).toHaveClass('bg-accent/8')
        expect(screen.getByLabelText('Upvote')).not.toHaveClass('bg-accent/8')
      })
    })

    it('should pass timestamp with vote data', async () => {
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(onVote).toHaveBeenCalledWith(
          expect.objectContaining({
            timestamp: expect.any(Number)
          })
        )
      })
    })

    it('should handle weighted vote changes correctly', async () => {
      jest.useFakeTimers()
      const onVote = jest.fn().mockResolvedValue()
      render(<VoteControls postId="1" initialScore={10} userKarma={5000} onVote={onVote} />)

      fireEvent.click(screen.getByLabelText('Upvote'))

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument()
      })

      jest.advanceTimersByTime(1500)

      fireEvent.click(screen.getByLabelText('Downvote'))

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })
})

export default onVote
