import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import AwardModal from './AwardModal'

describe('AwardModal', () => {
  const mockPost = {
    id: 'post-123',
    title: 'Test Post Title',
    community: 'testcommunity',
    author: 'testuser'
  }

  const mockOnClose = jest.fn()
  const mockOnAward = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Modal Rendering', () => {
    test('renders modal with correct title', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Give Award')).toBeInTheDocument()
    })

    test('renders modal backdrop', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(container.querySelector('.modal-backdrop')).toBeInTheDocument()
    })

    test('renders modal content container', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(container.querySelector('.modal')).toBeInTheDocument()
    })

    test('renders close button in header', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    test('renders modal footer', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(container.querySelector('.modal-footer')).toBeInTheDocument()
    })

    test('renders with overflow-y-auto class for scrolling', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const modal = container.querySelector('.modal')
      expect(modal).toHaveClass('overflow-y-auto')
    })
  })

  describe('User Coins Display', () => {
    test('displays user coins section', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Your Coins')).toBeInTheDocument()
    })

    test('displays coin emoji', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('🪙', { selector: '.text-lg' })).toBeInTheDocument()
    })

    test('displays user coin balance formatted', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('1,250')).toBeInTheDocument()
    })

    test('coins section has tertiary background', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const coinsSection = container.querySelector('.bg-bg-tertiary')
      expect(coinsSection).toBeInTheDocument()
    })
  })

  describe('Post Preview', () => {
    test('displays post title', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    test('displays community name', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText(/c\/testcommunity/)).toBeInTheDocument()
    })

    test('displays author name', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText(/u\/testuser/)).toBeInTheDocument()
    })

    test('post preview has border styling', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const preview = container.querySelector('.border.border-border-primary.rounded-lg')
      expect(preview).toBeInTheDocument()
    })

    test('post title has line-clamp-2 class', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const title = container.querySelector('.line-clamp-2')
      expect(title).toHaveTextContent('Test Post Title')
    })
  })

  describe('Awards Grid', () => {
    test('renders "Choose an Award" heading', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Choose an Award')).toBeInTheDocument()
    })

    test('renders all 8 awards', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const awardButtons = container.querySelectorAll('button[class*="flex items-start gap-md"]')
      expect(awardButtons).toHaveLength(8)
    })

    test('renders silver award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Silver Award')).toBeInTheDocument()
      expect(screen.getByText('🥈')).toBeInTheDocument()
    })

    test('renders gold award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Gold Award')).toBeInTheDocument()
      expect(screen.getByText('🥇')).toBeInTheDocument()
    })

    test('renders platinum award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Platinum Award')).toBeInTheDocument()
      expect(screen.getByText('💎')).toBeInTheDocument()
    })

    test('renders wholesome award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Wholesome')).toBeInTheDocument()
      expect(screen.getByText('💖')).toBeInTheDocument()
    })

    test('renders helpful award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Helpful')).toBeInTheDocument()
      expect(screen.getByText('🤝')).toBeInTheDocument()
    })

    test('renders rocket like award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Rocket Like')).toBeInTheDocument()
      expect(screen.getByText('🚀')).toBeInTheDocument()
    })

    test('renders fire award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Fire')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    test('renders mind blown award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Mind Blown')).toBeInTheDocument()
      expect(screen.getByText('🤯')).toBeInTheDocument()
    })
  })

  describe('Award Details Display', () => {
    test('displays silver award cost', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const costs = screen.getAllByText('100')
      expect(costs.length).toBeGreaterThan(0)
    })

    test('displays silver award description', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Shows appreciation with a silver medal')).toBeInTheDocument()
    })

    test('displays gold award description', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Gives the recipient 1 week of Premium and 100 coins')).toBeInTheDocument()
    })

    test('displays platinum award description', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Gives the recipient 1 month of Premium and 700 coins')).toBeInTheDocument()
    })

    test('displays premium badge for gold award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const premiumBadges = screen.getAllByText('Premium')
      expect(premiumBadges.length).toBeGreaterThan(0)
    })

    test('displays premium badge for platinum award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const premiumBadges = screen.getAllByText('Premium')
      expect(premiumBadges.length).toBeGreaterThanOrEqual(2)
    })

    test('displays correct costs for all awards', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getAllByText('100')).toHaveLength(1)
      expect(screen.getAllByText('500')).toHaveLength(1)
      expect(screen.getAllByText('125')).toHaveLength(2)
      expect(screen.getAllByText('150')).toHaveLength(1)
      expect(screen.getAllByText('200')).toHaveLength(1)
      expect(screen.getAllByText('175')).toHaveLength(1)
    })
  })

  describe('Award Selection', () => {
    test('allows selecting affordable award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)
      expect(silverButton).toHaveClass('border-accent')
    })

    test('displays checkmark on selected award', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)
      const checkmark = container.querySelector('path[d*="M13.854 3.646"]')
      expect(checkmark).toBeInTheDocument()
    })

    test('changes selection when clicking different award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      const goldButton = screen.getByText('Gold Award').closest('button')

      fireEvent.click(silverButton)
      expect(silverButton).toHaveClass('border-accent')

      fireEvent.click(goldButton)
      expect(goldButton).toHaveClass('border-accent')
      expect(silverButton).not.toHaveClass('border-accent')
    })

    test('affordable awards have cursor-pointer class', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      expect(silverButton).toHaveClass('cursor-pointer')
    })

    test('affordable awards have hover styling', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      expect(silverButton).toHaveClass('hover:border-secondary')
      expect(silverButton).toHaveClass('hover:bg-hover-bg')
    })

    test('selecting award shows selected award summary', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      expect(screen.getByText(/Cost: 🪙 100 coins/)).toBeInTheDocument()
    })
  })

  describe('Balance Checks and Affordability', () => {
    test('platinum award is disabled when user has insufficient coins', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const platinumButton = screen.getByText('Platinum Award').closest('button')
      expect(platinumButton).toBeDisabled()
    })

    test('displays "Insufficient coins" for unaffordable awards', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Insufficient coins')).toBeInTheDocument()
    })

    test('unaffordable awards have opacity-50 class', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const platinumButton = screen.getByText('Platinum Award').closest('button')
      expect(platinumButton).toHaveClass('opacity-50')
    })

    test('unaffordable awards have cursor-not-allowed class', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const platinumButton = screen.getByText('Platinum Award').closest('button')
      expect(platinumButton).toHaveClass('cursor-not-allowed')
    })

    test('clicking unaffordable award does not select it', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const platinumButton = screen.getByText('Platinum Award').closest('button')
      fireEvent.click(platinumButton)
      expect(platinumButton).not.toHaveClass('border-accent')
    })

    test('affordable awards are not disabled', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      expect(silverButton).not.toBeDisabled()
    })
  })

  describe('Selected Award Summary', () => {
    test('summary is not displayed when no award selected', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.queryByText(/Remaining coins after purchase:/)).not.toBeInTheDocument()
    })

    test('summary displays selected award emoji', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const summary = screen.getByText(/Cost: 🪙 100 coins/).closest('.bg-bg-tertiary')
      expect(summary).toHaveTextContent('🥈')
    })

    test('summary displays selected award name', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const summaryNames = screen.getAllByText('Silver Award')
      expect(summaryNames.length).toBeGreaterThan(1)
    })

    test('summary displays selected award cost', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      expect(screen.getByText(/Cost: 🪙 100 coins/)).toBeInTheDocument()
    })

    test('summary displays selected award description', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const descriptions = screen.getAllByText('Shows appreciation with a silver medal')
      expect(descriptions.length).toBeGreaterThan(1)
    })

    test('summary displays remaining coins after purchase', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      expect(screen.getByText(/Remaining coins after purchase: 🪙 1,150/)).toBeInTheDocument()
    })

    test('summary shows premium benefits message for premium awards', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const goldButton = screen.getByText('Gold Award').closest('button')
      fireEvent.click(goldButton)

      expect(screen.getByText(/This award includes CRYB Premium benefits/)).toBeInTheDocument()
    })

    test('summary does not show premium benefits for non-premium awards', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      expect(screen.queryByText(/This award includes CRYB Premium benefits/)).not.toBeInTheDocument()
    })

    test('summary calculates correct remaining coins for gold award', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const goldButton = screen.getByText('Gold Award').closest('button')
      fireEvent.click(goldButton)

      expect(screen.getByText(/Remaining coins after purchase: 🪙 750/)).toBeInTheDocument()
    })
  })

  describe('Give Award Button', () => {
    test('give award button is disabled when no award selected', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const giveButton = screen.getByText(/Give Award/).closest('button')
      expect(giveButton).toBeDisabled()
    })

    test('give award button is enabled when award selected', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      expect(giveButton).not.toBeDisabled()
    })

    test('give award button displays selected award cost', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      expect(screen.getByText(/Give Award 🪙 100/)).toBeInTheDocument()
    })

    test('give award button updates cost when different award selected', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      const goldButton = screen.getByText('Gold Award').closest('button')

      fireEvent.click(silverButton)
      expect(screen.getByText(/Give Award 🪙 100/)).toBeInTheDocument()

      fireEvent.click(goldButton)
      expect(screen.getByText(/Give Award 🪙 500/)).toBeInTheDocument()
    })

    test('give award button has primary styling', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const giveButton = screen.getByText(/Give Award/).closest('button')
      expect(giveButton).toHaveClass('btn-primary')
    })
  })

  describe('Loading States', () => {
    test('displays loading spinner when submitting', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(screen.getByText('Giving Award...')).toBeInTheDocument()
      })
    })

    test('displays loading text when submitting', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(screen.getByText('Giving Award...')).toBeInTheDocument()
      })
    })

    test('give award button disabled during submission', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        const submittingButton = screen.getByText('Giving Award...').closest('button')
        expect(submittingButton).toBeDisabled()
      })
    })

    test('cancel button disabled during submission', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel').closest('button')
        expect(cancelButton).toBeDisabled()
      })
    })

    test('displays spinner with correct animation class', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        const spinner = container.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
      })
    })
  })

  describe('Award Submission', () => {
    test('calls onAward with post id and award id', async () => {
      mockOnAward.mockResolvedValue()

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalledWith('post-123', 'silver')
      })
    })

    test('calls onClose after successful submission', async () => {
      mockOnAward.mockResolvedValue()

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    test('does not call onAward if no award selected', async () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const giveButton = screen.getByText(/Give Award/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnAward).not.toHaveBeenCalled()
      }, { timeout: 100 })
    })

    test('prevents multiple submissions while submitting', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)
      fireEvent.click(giveButton)
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalledTimes(1)
      })
    })

    test('calls onAward with correct award for gold award', async () => {
      mockOnAward.mockResolvedValue()

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const goldButton = screen.getByText('Gold Award').closest('button')
      fireEvent.click(goldButton)

      const giveButton = screen.getByText(/Give Award 🪙 500/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalledWith('post-123', 'gold')
      })
    })

    test('handles undefined onAward gracefully', async () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    test('handles award submission error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockOnAward.mockRejectedValue(new Error('Award failed'))

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to give award:', expect.any(Error))
      })

      consoleErrorSpy.mockRestore()
    })

    test('does not close modal on award submission error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockOnAward.mockRejectedValue(new Error('Award failed'))

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      expect(mockOnClose).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    test('resets submitting state after error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockOnAward.mockRejectedValue(new Error('Award failed'))

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.queryByText('Giving Award...')).not.toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })

    test('can retry after error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockOnAward.mockRejectedValueOnce(new Error('Award failed')).mockResolvedValueOnce()

      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverButton = screen.getByText('Silver Award').closest('button')
      fireEvent.click(silverButton)

      const giveButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.queryByText('Giving Award...')).not.toBeInTheDocument()
      })

      const retryButton = screen.getByText(/Give Award 🪙 100/).closest('button')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Modal Close Functionality', () => {
    test('calls onClose when close button clicked', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const closeButton = screen.getByLabelText('Close modal')
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    })

    test('calls onClose when backdrop clicked', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const backdrop = container.querySelector('.modal-backdrop')
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalled()
    })

    test('does not close when modal content clicked', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const modal = container.querySelector('.modal')
      fireEvent.click(modal)
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('calls onClose when cancel button clicked', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const cancelButton = screen.getByText('Cancel').closest('button')
      fireEvent.click(cancelButton)
      expect(mockOnClose).toHaveBeenCalled()
    })

    test('calls onClose when escape key pressed', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnClose).toHaveBeenCalled()
    })

    test('does not close on other key presses', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'a' })
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Event Cleanup', () => {
    test('removes escape key listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { unmount } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })

    test('escape handler updates when onClose changes', () => {
      const newOnClose = jest.fn()
      const { rerender } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)

      rerender(<AwardModal post={mockPost} onClose={newOnClose} onAward={mockOnAward} />)

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(newOnClose).toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Cancel Button', () => {
    test('renders cancel button', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    test('cancel button has ghost styling', () => {
      render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const cancelButton = screen.getByText('Cancel').closest('button')
      expect(cancelButton).toHaveClass('btn-ghost')
    })
  })

  describe('Award Color Styling', () => {
    test('silver award has gray color', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const silverName = screen.getByText('Silver Award')
      expect(silverName).toHaveClass('text-gray-400')
    })

    test('gold award has yellow color', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const goldName = screen.getByText('Gold Award')
      expect(goldName).toHaveClass('text-yellow-500')
    })

    test('platinum award has cyan color', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const platinumName = screen.getByText('Platinum Award')
      expect(platinumName).toHaveClass('text-cyan-400')
    })

    test('wholesome award has pink color', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const wholesomeName = screen.getByText('Wholesome')
      expect(wholesomeName).toHaveClass('text-pink-500')
    })

    test('helpful award has green color', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const helpfulName = screen.getByText('Helpful')
      expect(helpfulName).toHaveClass('text-green-500')
    })

    test('rocket award has orange color', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const rocketName = screen.getByText('Rocket Like')
      expect(rocketName).toHaveClass('text-orange-500')
    })

    test('fire award has red color', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const fireName = screen.getByText('Fire')
      expect(fireName).toHaveClass('text-red-500')
    })

    test('mind blown award has purple color', () => {
      const { container } = render(<AwardModal post={mockPost} onClose={mockOnClose} onAward={mockOnAward} />)
      const mindBlownName = screen.getByText('Mind Blown')
      expect(mindBlownName).toHaveClass('text-purple-500')
    })
  })
})

export default mockPost
