import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import WelcomeStep from './WelcomeStep'
import { useAuth } from '../../../contexts/AuthContext.jsx'

vi.mock('../../../contexts/AuthContext.jsx')

describe('WelcomeStep Component', () => {
  const mockOnComplete = vi.fn()
  const defaultUser = {
    username: 'TestUser',
    id: '123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: defaultUser })
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB/i)).toBeInTheDocument()
    })

    it('should render the main container with correct classes', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const mainDiv = container.firstChild
      expect(mainDiv).toHaveClass('text-center', 'py-8')
    })

    it('should render all main sections', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(container.querySelector('.text-6xl')).toBeInTheDocument()
      expect(screen.getByText(/Welcome to CRYB/i)).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should render with proper structure hierarchy', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const mainContainer = container.firstChild
      expect(mainContainer.children.length).toBeGreaterThan(0)
    })

    it('should render without errors when onComplete is undefined', () => {
      expect(() => render(<WelcomeStep />)).not.toThrow()
    })
  })

  describe('Welcome Message Display', () => {
    it('should display welcome emoji', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('🎉')).toBeInTheDocument()
    })

    it('should display welcome heading with user username', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB, TestUser!/i)).toBeInTheDocument()
    })

    it('should display welcome heading with "friend" when user is null', () => {
      useAuth.mockReturnValue({ user: null })
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB, friend!/i)).toBeInTheDocument()
    })

    it('should display welcome heading with "friend" when user is undefined', () => {
      useAuth.mockReturnValue({ user: undefined })
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB, friend!/i)).toBeInTheDocument()
    })

    it('should display welcome heading with "friend" when username is empty', () => {
      useAuth.mockReturnValue({ user: { username: '' } })
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB, friend!/i)).toBeInTheDocument()
    })

    it('should display introductory paragraph', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/You've joined the most innovative decentralized community platform/i)).toBeInTheDocument()
    })

    it('should display complete introductory text', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/We're here to help you get the most out of your CRYB experience/i)).toBeInTheDocument()
    })

    it('should apply correct heading styles', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const heading = screen.getByText(/Welcome to CRYB/i)
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'text-gray-800', 'mb-4')
    })

    it('should apply correct paragraph styles', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const paragraph = screen.getByText(/You've joined the most innovative/i)
      expect(paragraph).toHaveClass('text-lg', 'text-gray-600', 'max-w-2xl', 'mx-auto', 'leading-relaxed')
    })
  })

  describe('Feature Highlights - Three Main Features', () => {
    it('should display Join Communities feature card', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('Join Communities')).toBeInTheDocument()
    })

    it('should display Join Communities emoji', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('🏘️')).toBeInTheDocument()
    })

    it('should display Join Communities description', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Discover and participate in communities that match your interests/i)).toBeInTheDocument()
    })

    it('should display Voice & Video feature card', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('Voice & Video')).toBeInTheDocument()
    })

    it('should display Voice & Video emoji', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('🎤')).toBeInTheDocument()
    })

    it('should display Voice & Video description', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Connect with others through real-time voice and video chat/i)).toBeInTheDocument()
    })

    it('should display Earn Rewards feature card', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('Earn Rewards')).toBeInTheDocument()
    })

    it('should display Earn Rewards emoji', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('💰')).toBeInTheDocument()
    })

    it('should display Earn Rewards description', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Get CRYB tokens for participating and contributing to the community/i)).toBeInTheDocument()
    })

    it('should apply correct styling to feature grid', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const grid = container.querySelector('.grid.md\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('gap-6', 'mb-8')
    })

    it('should apply correct styling to Join Communities card', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const cards = container.querySelectorAll('.bg-blue-50')
      expect(cards[0]).toHaveClass('p-6', 'rounded-xl')
    })

    it('should apply correct styling to Voice & Video card', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const card = container.querySelector('.bg-purple-50')
      expect(card).toHaveClass('p-6', 'rounded-xl')
    })

    it('should apply correct styling to Earn Rewards card', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const card = container.querySelector('.bg-green-50')
      expect(card).toHaveClass('p-6', 'rounded-xl')
    })
  })

  describe('Feature Highlights - Special Features Section', () => {
    it('should display "What makes CRYB special?" heading', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('What makes CRYB special?')).toBeInTheDocument()
    })

    it('should display decentralized feature', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('Decentralized and community-owned')).toBeInTheDocument()
    })

    it('should display cryptocurrency rewards feature', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('Built-in cryptocurrency rewards')).toBeInTheDocument()
    })

    it('should display real-time chat feature', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('Real-time voice and video chat')).toBeInTheDocument()
    })

    it('should display NFT integration feature', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText('NFT integration and marketplace')).toBeInTheDocument()
    })

    it('should display all four checkmarks', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const checkmarks = screen.getAllByText('✓')
      expect(checkmarks).toHaveLength(4)
    })

    it('should apply correct styling to special features container', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const specialSection = container.querySelector('.bg-gradient-to-r.from-blue-100')
      expect(specialSection).toHaveClass('p-6', 'rounded-xl')
    })

    it('should apply correct styling to checkmarks', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const checkmarks = container.querySelectorAll('.text-green-500')
      expect(checkmarks.length).toBeGreaterThan(0)
      checkmarks.forEach(check => {
        expect(check.textContent).toBe('✓')
      })
    })
  })

  describe('Continue Button Functionality', () => {
    it('should render continue button', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })
      expect(button).toBeInTheDocument()
    })

    it('should display button text with rocket emoji', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Let's Get Started! 🚀/i)).toBeInTheDocument()
    })

    it('should call onComplete when button is clicked', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })

      await user.click(button)

      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })

    it('should call onComplete only once per click', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })

      await user.click(button)

      expect(mockOnComplete).toHaveBeenCalledTimes(1)
      expect(mockOnComplete).not.toHaveBeenCalledTimes(2)
    })

    it('should handle multiple clicks on continue button', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })

      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockOnComplete).toHaveBeenCalledTimes(3)
    })

    it('should not throw error when onComplete is not provided and button is clicked', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })

      await expect(user.click(button)).resolves.not.toThrow()
    })

    it('should apply correct button styles', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })
      expect(button).toHaveClass(
        'px-8',
        'py-3',
        'bg-gradient-to-r',
        'from-blue-600',
        'to-purple-600',
        'text-white',
        'font-semibold',
        'rounded-lg'
      )
    })

    it('should have hover transition classes', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })
      expect(button).toHaveClass('hover:from-blue-700', 'hover:to-purple-700', 'transition-all', 'transform', 'hover:scale-105')
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })

      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('should be triggerable with Space key', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button', { name: /Let's Get Started!/i })

      button.focus()
      await user.keyboard(' ')

      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(container.querySelector('h3')).toBeInTheDocument()
      expect(container.querySelector('h4')).toBeInTheDocument()
      expect(container.querySelector('button')).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const h3 = container.querySelector('h3')
      const h4Elements = container.querySelectorAll('h4')

      expect(h3).toBeInTheDocument()
      expect(h4Elements.length).toBeGreaterThan(0)
    })

    it('should have accessible button', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.textContent).toBeTruthy()
    })

    it('should use appropriate text contrast colors', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const heading = screen.getByText(/Welcome to CRYB/i)
      expect(heading).toHaveClass('text-gray-800')
    })

    it('should maintain readable text sizes', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const heading = screen.getByText(/Welcome to CRYB/i)
      const paragraph = screen.getByText(/You've joined the most innovative/i)

      expect(heading).toHaveClass('text-3xl')
      expect(paragraph).toHaveClass('text-lg')
    })

    it('should have sufficient spacing for touch targets', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-8', 'py-3')
    })
  })

  describe('Mobile Layout', () => {
    it('should render grid with mobile-responsive classes', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('md:grid-cols-3')
    })

    it('should render special features grid with mobile-responsive classes', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const grids = container.querySelectorAll('.md\\:grid-cols-2')
      expect(grids.length).toBeGreaterThan(0)
    })

    it('should have centered text alignment', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const mainDiv = container.firstChild
      expect(mainDiv).toHaveClass('text-center')
    })

    it('should have responsive padding', () => {
      const { container } = render(<WelcomeStep onComplete={mockOnComplete} />)
      const mainDiv = container.firstChild
      expect(mainDiv).toHaveClass('py-8')
    })

    it('should center introductory text with max-width', () => {
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const paragraph = screen.getByText(/You've joined the most innovative/i)
      expect(paragraph).toHaveClass('max-w-2xl', 'mx-auto')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle user object with null username', () => {
      useAuth.mockReturnValue({ user: { username: null } })
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB, friend!/i)).toBeInTheDocument()
    })

    it('should handle missing useAuth context gracefully', () => {
      useAuth.mockReturnValue({})
      expect(() => render(<WelcomeStep onComplete={mockOnComplete} />)).not.toThrow()
    })

    it('should handle user with special characters in username', () => {
      useAuth.mockReturnValue({ user: { username: 'Test@User#123' } })
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB, Test@User#123!/i)).toBeInTheDocument()
    })

    it('should handle very long usernames', () => {
      const longUsername = 'A'.repeat(100)
      useAuth.mockReturnValue({ user: { username: longUsername } })
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(new RegExp(`Welcome to CRYB, ${longUsername}!`, 'i'))).toBeInTheDocument()
    })

    it('should handle onComplete as null without crashing', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onComplete={null} />)
      const button = screen.getByRole('button')

      await expect(user.click(button)).resolves.not.toThrow()
    })

    it('should handle rapid successive button clicks', async () => {
      const user = userEvent.setup()
      render(<WelcomeStep onComplete={mockOnComplete} />)
      const button = screen.getByRole('button')

      await user.tripleClick(button)

      expect(mockOnComplete).toHaveBeenCalled()
    })

    it('should handle component re-rendering with different user', () => {
      const { rerender } = render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB, TestUser!/i)).toBeInTheDocument()

      useAuth.mockReturnValue({ user: { username: 'NewUser' } })
      rerender(<WelcomeStep onComplete={mockOnComplete} />)

      expect(screen.getByText(/Welcome to CRYB, NewUser!/i)).toBeInTheDocument()
    })

    it('should maintain state after multiple renders', () => {
      const { rerender } = render(<WelcomeStep onComplete={mockOnComplete} />)
      rerender(<WelcomeStep onComplete={mockOnComplete} />)
      rerender(<WelcomeStep onComplete={mockOnComplete} />)

      expect(screen.getByText(/Welcome to CRYB/i)).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle whitespace-only username', () => {
      useAuth.mockReturnValue({ user: { username: '   ' } })
      render(<WelcomeStep onComplete={mockOnComplete} />)
      expect(screen.getByText(/Welcome to CRYB,    !/i)).toBeInTheDocument()
    })

    it('should render all content even when user data is incomplete', () => {
      useAuth.mockReturnValue({ user: { id: '123' } })
      render(<WelcomeStep onComplete={mockOnComplete} />)

      expect(screen.getByText('Join Communities')).toBeInTheDocument()
      expect(screen.getByText('Voice & Video')).toBeInTheDocument()
      expect(screen.getByText('Earn Rewards')).toBeInTheDocument()
    })
  })
})

export default mockOnComplete
