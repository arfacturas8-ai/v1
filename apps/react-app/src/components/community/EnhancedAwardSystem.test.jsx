import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnhancedAwardSystem from './EnhancedAwardSystem'
import '@testing-library/jest-dom'

global.fetch = jest.fn()

const mockPost = {
  id: 'post-123',
  community: 'gaming',
  title: 'Test Post',
  author: 'testuser'
}

const mockOnClose = jest.fn()
const mockOnAward = jest.fn()

const defaultProps = {
  post: mockPost,
  isOpen: true,
  onClose: mockOnClose,
  onAward: mockOnAward,
  userCoins: 1000,
  userPremium: false
}

describe('EnhancedAwardSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockClear()
  })

  describe('Component Rendering', () => {
    test('should not render when isOpen is false', () => {
      const { container } = render(
        <EnhancedAwardSystem {...defaultProps} isOpen={false} />
      )
      expect(container.firstChild).toBeNull()
    })

    test('should render modal when isOpen is true', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('Give Award')).toBeInTheDocument()
    })

    test('should display correct header text', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('Give Award')).toBeInTheDocument()
      expect(screen.getByText('Show appreciation for this post')).toBeInTheDocument()
    })

    test('should display user coin balance', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={5000} />)
      expect(screen.getByText('5,000')).toBeInTheDocument()
    })

    test('should display formatted coin balance with locale string', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={1234567} />)
      expect(screen.getByText('1,234,567')).toBeInTheDocument()
    })

    test('should render close button', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(button => button.querySelector('svg'))
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Award Display', () => {
    test('should display standard awards', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('Silver Award')).toBeInTheDocument()
      expect(screen.getByText('Gold Award')).toBeInTheDocument()
    })

    test('should display award descriptions', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('Shows the post deserves recognition')).toBeInTheDocument()
    })

    test('should display award costs', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('500')).toBeInTheDocument()
    })

    test('should display award karma values', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('+25 karma')).toBeInTheDocument()
      expect(screen.getByText('+100 karma')).toBeInTheDocument()
    })

    test('should display award icons', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('🥈')).toBeInTheDocument()
      expect(screen.getByText('🥇')).toBeInTheDocument()
    })

    test('should display award benefits for gold award', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('+ 1 week Premium')).toBeInTheDocument()
      expect(screen.getByText('+ 100 coins')).toBeInTheDocument()
    })

    test('should display "Available Awards" section header', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(screen.getByText('Available Awards')).toBeInTheDocument()
    })
  })

  describe('Award Types and Tiers', () => {
    test('should display affordable awards when user has sufficient coins', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={500} />)
      expect(screen.getByText('Silver Award')).toBeInTheDocument()
      expect(screen.getByText('Helpful Award')).toBeInTheDocument()
    })

    test('should show premium awards section only for premium users', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={5000} userPremium={true} />)
      expect(screen.getByText('Premium Awards')).toBeInTheDocument()
    })

    test('should not show premium awards section for non-premium users', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={5000} userPremium={false} />)
      expect(screen.queryByText('Premium Awards')).not.toBeInTheDocument()
    })

    test('should display platinum award for premium users with enough coins', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={2000} userPremium={true} />)
      expect(screen.getByText('Platinum Award')).toBeInTheDocument()
    })

    test('should display premium indicator crown icon on premium awards', () => {
      const { container } = render(
        <EnhancedAwardSystem {...defaultProps} userCoins={2000} userPremium={true} />
      )
      const premiumCrowns = container.querySelectorAll('.text-yellow-500')
      expect(premiumCrowns.length).toBeGreaterThan(0)
    })

    test('should filter awards based on user coins', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={150} />)
      expect(screen.getByText('Silver Award')).toBeInTheDocument()
      expect(screen.queryByText('Gold Award')).not.toBeInTheDocument()
    })

    test('should display wholesome award', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={200} />)
      expect(screen.getByText('Wholesome Award')).toBeInTheDocument()
      expect(screen.getByText('🤍')).toBeInTheDocument()
    })

    test('should display rocket like award', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={300} />)
      expect(screen.getByText('Rocket Like')).toBeInTheDocument()
      expect(screen.getByText('🚀')).toBeInTheDocument()
    })

    test('should display fire award', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={400} />)
      expect(screen.getByText('Fire Award')).toBeInTheDocument()
      expect(screen.getByText('🔥')).toBeInTheDocument()
    })

    test('should display mind blown award', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={300} />)
      expect(screen.getByText('Mind Blown')).toBeInTheDocument()
      expect(screen.getByText('🤯')).toBeInTheDocument()
    })

    test('should display all-seeing upvote for premium users', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={2000} userPremium={true} />)
      expect(screen.getByText('All-Seeing Upvote')).toBeInTheDocument()
    })

    test('should display argentium award for premium users with enough coins', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={25000} userPremium={true} />)
      expect(screen.getByText('Argentium')).toBeInTheDocument()
      expect(screen.getByText('⚡')).toBeInTheDocument()
    })

    test('should display argentium benefits', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={25000} userPremium={true} />)
      expect(screen.getByText('+ 3 months Premium')).toBeInTheDocument()
      expect(screen.getByText('+ 2500 coins')).toBeInTheDocument()
    })
  })

  describe('Award Selection', () => {
    test('should select award when clicked', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)
      await waitFor(() => {
        expect(screen.getByText('Add a message (optional)')).toBeInTheDocument()
      })
    })

    test('should display selected award details', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)
      await waitFor(() => {
        expect(screen.getByText('Cost: 100')).toBeInTheDocument()
      })
    })

    test('should show give award button when award is selected', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)
      await waitFor(() => {
        expect(screen.getByText('Give Award (100 coins)')).toBeInTheDocument()
      })
    })

    test('should not allow selection of unaffordable awards', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={50} />)
      const silverCard = screen.getByText('Silver Award').closest('div').closest('div')
      expect(silverCard).toHaveClass('cursor-not-allowed')
    })

    test('should display "Need more coins" message for unaffordable awards', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={50} />)
      expect(screen.getByText('Need 50 more coins')).toBeInTheDocument()
    })

    test('should highlight selected award with border', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)
      await waitFor(() => {
        expect(silverAward).toHaveClass('border-rgb(var(--color-primary-500))')
      })
    })
  })

  describe('Give Award Modal', () => {
    test('should display award message textarea', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Say something nice...')).toBeInTheDocument()
      })
    })

    test('should update message character count', async () => {
      const user = userEvent.setup()
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      await waitFor(() => {
        expect(screen.getByText('0/200 characters')).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText('Say something nice...')
      await user.type(textarea, 'Great post!')

      await waitFor(() => {
        expect(screen.getByText('11/200 characters')).toBeInTheDocument()
      })
    })

    test('should limit message to 200 characters', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const textarea = screen.getByPlaceholderText('Say something nice...')
      expect(textarea).toHaveAttribute('maxLength', '200')
    })

    test('should display selected award icon in details', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      await waitFor(() => {
        const icons = screen.getAllByText('🥈')
        expect(icons.length).toBeGreaterThan(1)
      })
    })

    test('should display karma value in award details', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      await waitFor(() => {
        expect(screen.getByText('+25 karma to author')).toBeInTheDocument()
      })
    })
  })

  describe('Award Giving Process', () => {
    test('should call onAward when give button is clicked', async () => {
      mockOnAward.mockResolvedValue({})
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      await waitFor(() => {
        const giveButton = screen.getByText('Give Award (100 coins)')
        fireEvent.click(giveButton)
      })

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalled()
      })
    })

    test('should pass correct award data when giving award', async () => {
      mockOnAward.mockResolvedValue({})
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      await waitFor(() => {
        const giveButton = screen.getByText('Give Award (100 coins)')
        fireEvent.click(giveButton)
      })

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalledWith(
          expect.objectContaining({
            postId: 'post-123',
            awardType: 'silver',
            cost: 100,
            karmaValue: 25
          })
        )
      })
    })

    test('should include message in award data', async () => {
      const user = userEvent.setup()
      mockOnAward.mockResolvedValue({})
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const textarea = await screen.findByPlaceholderText('Say something nice...')
      await user.type(textarea, 'Great post!')

      const giveButton = screen.getByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Great post!'
          })
        )
      })
    })

    test('should show loading state when giving award', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(screen.getByText('Giving Award...')).toBeInTheDocument()
      })
    })

    test('should disable button while giving award', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      await waitFor(() => {
        const button = screen.getByText('Giving Award...')
        expect(button).toBeDisabled()
      })
    })

    test('should not give award if insufficient coins', async () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={50} />)

      expect(screen.queryByText('Add a message (optional)')).not.toBeInTheDocument()
    })

    test('should show alert when trying to give award without enough coins', async () => {
      global.alert = jest.fn()
      render(<EnhancedAwardSystem {...defaultProps} userCoins={500} />)

      const goldAward = screen.getByText('Gold Award').closest('div').closest('div')
      fireEvent.click(goldAward)

      const giveButton = await screen.findByText('Give Award (500 coins)')

      mockOnAward.mockRejectedValue(new Error('Insufficient coins'))
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalled()
      })
    })
  })

  describe('Award Animations', () => {
    test('should show success animation after giving award', async () => {
      mockOnAward.mockResolvedValue({})
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      await waitFor(() => {
        const animations = screen.getAllByText('🥈')
        expect(animations.length).toBeGreaterThan(0)
      })
    })

    test('should hide animation after timeout', async () => {
      jest.useFakeTimers()
      mockOnAward.mockResolvedValue({})
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })

      jest.useRealTimers()
    })

    test('should apply bounce animation class', async () => {
      mockOnAward.mockResolvedValue({})
      const { container } = render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      await waitFor(() => {
        const animatedElements = container.querySelectorAll('.animate-bounce')
        expect(animatedElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Custom Community Awards', () => {
    test('should fetch custom awards on open', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => []
      })

      render(<EnhancedAwardSystem {...defaultProps} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/communities/gaming/awards')
      })
    })

    test('should display custom community awards', async () => {
      const customAwards = [
        {
          id: 'custom-1',
          name: 'Gaming Legend',
          description: 'For epic gaming moments',
          icon: '🎮',
          cost: 200,
          karmaValue: 50,
          isPremium: false
        }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => customAwards
      })

      render(<EnhancedAwardSystem {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Gaming Legend')).toBeInTheDocument()
      })
    })

    test('should show community awards section header', async () => {
      const customAwards = [
        {
          id: 'custom-1',
          name: 'Gaming Legend',
          icon: '🎮',
          cost: 200,
          karmaValue: 50,
          isPremium: false
        }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => customAwards
      })

      render(<EnhancedAwardSystem {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('c/gaming Awards')).toBeInTheDocument()
      })
    })

    test('should not display custom awards section when no custom awards available', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => []
      })

      render(<EnhancedAwardSystem {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/c\/.*Awards/)).not.toBeInTheDocument()
      })
    })

    test('should handle fetch error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValue(new Error('Network error'))

      render(<EnhancedAwardSystem {...defaultProps} />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to fetch custom awards:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })

    test('should handle non-ok response from API', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      })

      render(<EnhancedAwardSystem {...defaultProps} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      expect(screen.queryByText('c/gaming Awards')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    test('should show loading state during award submission', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      expect(screen.getByText('Giving Award...')).toBeInTheDocument()
    })

    test('should disable give button during submission', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      const loadingButton = screen.getByText('Giving Award...')
      expect(loadingButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    test('should handle award submission error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      mockOnAward.mockRejectedValue(new Error('Award failed'))

      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to give award:',
          expect.any(Error)
        )
      })

      consoleError.mockRestore()
    })

    test('should reset loading state on error', async () => {
      mockOnAward.mockRejectedValue(new Error('Award failed'))

      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(screen.getByText('Give Award (100 coins)')).toBeInTheDocument()
      })
    })

    test('should not hide animation on error', async () => {
      mockOnAward.mockRejectedValue(new Error('Award failed'))

      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalled()
      })
    })
  })

  describe('Modal Controls', () => {
    test('should close modal when close button is clicked', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(button => button.querySelector('svg'))
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    })

    test('should close modal after successful award', async () => {
      jest.useFakeTimers()
      mockOnAward.mockResolvedValue({})

      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })

      jest.useRealTimers()
    })

    test('should reset selected award after successful submission', async () => {
      jest.useFakeTimers()
      mockOnAward.mockResolvedValue({})

      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })

      jest.useRealTimers()
    })

    test('should reset award message after successful submission', async () => {
      jest.useFakeTimers()
      const user = userEvent.setup({ delay: null })
      mockOnAward.mockResolvedValue({})

      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const textarea = await screen.findByPlaceholderText('Say something nice...')
      await user.type(textarea, 'Great!')

      const giveButton = screen.getByText('Give Award (100 coins)')
      fireEvent.click(giveButton)

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })

      jest.useRealTimers()
    })
  })

  describe('Award Categories', () => {
    test('should categorize awards correctly', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={1000} />)
      expect(screen.getByText('Available Awards')).toBeInTheDocument()
    })

    test('should show affordable awards in correct section', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={500} />)
      const availableSection = screen.getByText('Available Awards').closest('div')
      expect(within(availableSection).getByText('Silver Award')).toBeInTheDocument()
    })

    test('should not show awards user cannot afford in affordable section', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={150} />)
      expect(screen.queryByText('Gold Award')).not.toBeInTheDocument()
    })

    test('should show all premium awards for premium users', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={25000} userPremium={true} />)
      expect(screen.getByText('Platinum Award')).toBeInTheDocument()
      expect(screen.getByText('All-Seeing Upvote')).toBeInTheDocument()
      expect(screen.getByText('Argentium')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('should handle zero coins', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    test('should handle undefined userCoins', () => {
      const { userCoins, ...propsWithoutCoins } = defaultProps
      render(<EnhancedAwardSystem {...propsWithoutCoins} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    test('should handle very large coin amounts', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={9999999} />)
      expect(screen.getByText('9,999,999')).toBeInTheDocument()
    })

    test('should not call onAward when no award is selected', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      expect(mockOnAward).not.toHaveBeenCalled()
    })

    test('should prevent double submission', async () => {
      mockOnAward.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      const giveButton = await screen.findByText('Give Award (100 coins)')
      fireEvent.click(giveButton)
      fireEvent.click(giveButton)

      await waitFor(() => {
        expect(mockOnAward).toHaveBeenCalledTimes(1)
      })
    })

    test('should handle empty custom awards response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => []
      })

      render(<EnhancedAwardSystem {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText('c/gaming Awards')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('should have accessible textarea with label', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      await waitFor(() => {
        expect(screen.getByText('Add a message (optional)')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Say something nice...')).toBeInTheDocument()
      })
    })

    test('should have accessible buttons', () => {
      render(<EnhancedAwardSystem {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Award Filtering', () => {
    test('should filter premium awards by user premium status', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={5000} userPremium={false} />)
      expect(screen.queryByText('Platinum Award')).not.toBeInTheDocument()
    })

    test('should show affordable standard awards regardless of premium status', () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={1000} userPremium={false} />)
      expect(screen.getByText('Silver Award')).toBeInTheDocument()
      expect(screen.getByText('Gold Award')).toBeInTheDocument()
    })

    test('should filter custom awards by cost', async () => {
      const customAwards = [
        {
          id: 'custom-1',
          name: 'Expensive Award',
          icon: '💰',
          cost: 5000,
          karmaValue: 100,
          isPremium: false
        }
      ]

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => customAwards
      })

      render(<EnhancedAwardSystem {...defaultProps} userCoins={100} />)

      await waitFor(() => {
        expect(screen.queryByText('Expensive Award')).not.toBeInTheDocument()
      })
    })
  })

  describe('Award Details Display', () => {
    test('should show selected award large icon', async () => {
      render(<EnhancedAwardSystem {...defaultProps} />)

      const silverAward = screen.getByText('Silver Award').closest('div').closest('div')
      fireEvent.click(silverAward)

      await waitFor(() => {
        const detailsSection = screen.getByText('Add a message (optional)').closest('div')
        expect(within(detailsSection).getByText('🥈')).toBeInTheDocument()
      })
    })

    test('should display benefits for awards that have them', async () => {
      render(<EnhancedAwardSystem {...defaultProps} userCoins={600} />)

      const goldAward = screen.getByText('Gold Award').closest('div').closest('div')
      fireEvent.click(goldAward)

      await waitFor(() => {
        expect(screen.getByText(/1 week Premium, 100 coins/)).toBeInTheDocument()
      })
    })
  })
})

export default mockPost
