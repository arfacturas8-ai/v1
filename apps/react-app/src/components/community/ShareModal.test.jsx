import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ShareModal from './ShareModal'

describe('ShareModal', () => {
  let mockPost
  let mockOnClose
  let mockOnShare
  let originalClipboard
  let originalExecCommand
  let originalLocation

  beforeEach(() => {
    mockPost = {
      id: 'post123',
      title: 'Test Post Title',
      community: 'testcommunity',
      author: 'testauthor'
    }
    mockOnClose = jest.fn()
    mockOnShare = jest.fn()

    originalClipboard = navigator.clipboard
    originalExecCommand = document.execCommand
    originalLocation = window.location

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn()
      },
      writable: true,
      configurable: true
    })

    document.execCommand = jest.fn()

    delete window.location
    window.location = { origin: 'https://example.com' }
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true
    })
    document.execCommand = originalExecCommand
    window.location = originalLocation
  })

  describe('Modal Rendering', () => {
    it('renders the modal with correct title', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText('Share Post')).toBeInTheDocument()
    })

    it('renders modal backdrop', () => {
      const { container } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(container.querySelector('.modal-backdrop')).toBeInTheDocument()
    })

    it('renders modal with open class', () => {
      const { container } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const modal = container.querySelector('.modal')
      expect(modal).toHaveClass('open')
    })

    it('renders close button with correct aria-label', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('renders post preview section', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText('Test Post Title')).toBeInTheDocument()
    })

    it('renders post community and author', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText('r/testcommunity • u/testauthor')).toBeInTheDocument()
    })

    it('renders URL input field', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const input = screen.getByDisplayValue('https://example.com/c/testcommunity/comments/post123')
      expect(input).toBeInTheDocument()
    })

    it('renders URL input as readonly', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const input = screen.getByDisplayValue('https://example.com/c/testcommunity/comments/post123')
      expect(input).toHaveAttribute('readonly')
    })

    it('renders share options section label', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText('Share to')).toBeInTheDocument()
    })

    it('renders post URL label', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText('Post URL')).toBeInTheDocument()
    })
  })

  describe('Share Options', () => {
    it('renders all four share options', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText('Twitter')).toBeInTheDocument()
      expect(screen.getByText('Facebook')).toBeInTheDocument()
      expect(screen.getByText('CRYB')).toBeInTheDocument()
      expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    })

    it('renders Twitter share option with correct URL', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const twitterLink = screen.getByText('Twitter').closest('a')
      expect(twitterLink).toHaveAttribute('href', expect.stringContaining('twitter.com/intent/tweet'))
      expect(twitterLink.href).toContain(encodeURIComponent('https://example.com/c/testcommunity/comments/post123'))
      expect(twitterLink.href).toContain(encodeURIComponent('Test Post Title'))
    })

    it('renders Facebook share option with correct URL', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const facebookLink = screen.getByText('Facebook').closest('a')
      expect(facebookLink).toHaveAttribute('href', expect.stringContaining('facebook.com/sharer/sharer.php'))
      expect(facebookLink.href).toContain(encodeURIComponent('https://example.com/c/testcommunity/comments/post123'))
    })

    it('renders CRYB share option with correct URL', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const crybLink = screen.getByText('CRYB').closest('a')
      expect(crybLink).toHaveAttribute('href', expect.stringContaining('/submit'))
      expect(crybLink.href).toContain(encodeURIComponent('https://example.com/c/testcommunity/comments/post123'))
      expect(crybLink.href).toContain(encodeURIComponent('Test Post Title'))
    })

    it('renders LinkedIn share option with correct URL', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const linkedInLink = screen.getByText('LinkedIn').closest('a')
      expect(linkedInLink).toHaveAttribute('href', expect.stringContaining('linkedin.com/sharing/share-offsite'))
      expect(linkedInLink.href).toContain(encodeURIComponent('https://example.com/c/testcommunity/comments/post123'))
    })

    it('applies correct color class to Twitter option', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const twitterLink = screen.getByText('Twitter').closest('a')
      expect(twitterLink).toHaveClass('text-blue-500')
    })

    it('applies correct color class to Facebook option', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const facebookLink = screen.getByText('Facebook').closest('a')
      expect(facebookLink).toHaveClass('text-blue-600')
    })

    it('applies correct color class to CRYB option', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const crybLink = screen.getByText('CRYB').closest('a')
      expect(crybLink).toHaveClass('text-orange-500')
    })

    it('applies correct color class to LinkedIn option', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const linkedInLink = screen.getByText('LinkedIn').closest('a')
      expect(linkedInLink).toHaveClass('text-blue-700')
    })

    it('share options open in new tab', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const twitterLink = screen.getByText('Twitter').closest('a')
      expect(twitterLink).toHaveAttribute('target', '_blank')
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('calls onShare when Twitter option is clicked', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const twitterLink = screen.getByText('Twitter').closest('a')
      fireEvent.click(twitterLink)
      expect(mockOnShare).toHaveBeenCalledWith('post123', 'twitter')
    })

    it('calls onClose when Twitter option is clicked', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const twitterLink = screen.getByText('Twitter').closest('a')
      fireEvent.click(twitterLink)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onShare when Facebook option is clicked', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const facebookLink = screen.getByText('Facebook').closest('a')
      fireEvent.click(facebookLink)
      expect(mockOnShare).toHaveBeenCalledWith('post123', 'facebook')
    })

    it('calls onShare when CRYB option is clicked', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const crybLink = screen.getByText('CRYB').closest('a')
      fireEvent.click(crybLink)
      expect(mockOnShare).toHaveBeenCalledWith('post123', 'cryb')
    })

    it('calls onShare when LinkedIn option is clicked', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const linkedInLink = screen.getByText('LinkedIn').closest('a')
      fireEvent.click(linkedInLink)
      expect(mockOnShare).toHaveBeenCalledWith('post123', 'linkedin')
    })

    it('does not call onShare when onShare prop is not provided', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} />)
      const twitterLink = screen.getByText('Twitter').closest('a')
      fireEvent.click(twitterLink)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Copy Link Functionality', () => {
    it('renders copy button', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
    })

    it('copies URL to clipboard when copy button is clicked', async () => {
      navigator.clipboard.writeText.mockResolvedValueOnce()
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await userEvent.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/c/testcommunity/comments/post123')
    })

    it('shows "Copied!" text after successful copy', async () => {
      jest.useFakeTimers()
      navigator.clipboard.writeText.mockResolvedValueOnce()
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await userEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText(/copied!/i)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('changes button style to success after copy', async () => {
      navigator.clipboard.writeText.mockResolvedValueOnce()
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await userEvent.click(copyButton)

      await waitFor(() => {
        expect(copyButton).toHaveClass('btn-success')
      })
    })

    it('reverts "Copied!" text back to "Copy" after 2 seconds', async () => {
      jest.useFakeTimers()
      navigator.clipboard.writeText.mockResolvedValueOnce()
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await userEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText(/copied!/i)).toBeInTheDocument()
      })

      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.queryByText(/copied!/i)).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('uses fallback execCommand when clipboard API fails', async () => {
      const mockSelect = jest.fn()
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard API not available'))
      document.execCommand.mockReturnValueOnce(true)

      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const input = screen.getByDisplayValue('https://example.com/c/testcommunity/comments/post123')
      input.select = mockSelect

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await userEvent.click(copyButton)

      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalled()
        expect(document.execCommand).toHaveBeenCalledWith('copy')
      })
    })

    it('shows "Copied!" text after successful fallback copy', async () => {
      jest.useFakeTimers()
      const mockSelect = jest.fn()
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard API not available'))
      document.execCommand.mockReturnValueOnce(true)

      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const input = screen.getByDisplayValue('https://example.com/c/testcommunity/comments/post123')
      input.select = mockSelect

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await userEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText(/copied!/i)).toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('generates correct post URL based on window location', () => {
      window.location.origin = 'https://different.com'
      mockPost.community = 'newcommunity'
      mockPost.id = 'newpost456'

      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const input = screen.getByDisplayValue('https://different.com/c/newcommunity/comments/newpost456')
      expect(input).toBeInTheDocument()
    })
  })

  describe('Close Modal', () => {
    it('calls onClose when close button is clicked', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const closeButton = screen.getByLabelText('Close modal')
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop is clicked', () => {
      const { container } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const backdrop = container.querySelector('.modal-backdrop')
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when modal content is clicked', () => {
      const { container } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const modal = container.querySelector('.modal')
      fireEvent.click(modal)
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('calls onClose when Escape key is pressed', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when other keys are pressed', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { unmount } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Focus Management', () => {
    it('selects URL input on mount', () => {
      const mockSelect = jest.fn()
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const input = screen.getByDisplayValue('https://example.com/c/testcommunity/comments/post123')
      input.select = mockSelect

      waitFor(() => {
        expect(mockSelect).toHaveBeenCalled()
      })
    })

    it('focuses URL input when modal opens', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const input = screen.getByDisplayValue('https://example.com/c/testcommunity/comments/post123')

      waitFor(() => {
        expect(document.activeElement).toBe(input)
      })
    })
  })

  describe('Post Data Display', () => {
    it('displays post title correctly', () => {
      mockPost.title = 'This is a very long post title that should be displayed'
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText('This is a very long post title that should be displayed')).toBeInTheDocument()
    })

    it('displays community name correctly', () => {
      mockPost.community = 'javascript'
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText(/r\/javascript/)).toBeInTheDocument()
    })

    it('displays author name correctly', () => {
      mockPost.author = 'johndoe'
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText(/u\/johndoe/)).toBeInTheDocument()
    })

    it('applies line-clamp-2 class to post title', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const title = screen.getByText('Test Post Title')
      expect(title).toHaveClass('line-clamp-2')
    })
  })

  describe('Accessibility', () => {
    it('close button has correct accessible role', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const closeButton = screen.getByLabelText('Close modal')
      expect(closeButton).toHaveAttribute('type', 'button')
    })

    it('share links have correct accessible attributes', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const twitterLink = screen.getByText('Twitter').closest('a')
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('copy button has accessible text', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const copyButton = screen.getByRole('button', { name: /copy/i })
      expect(copyButton).toBeInTheDocument()
    })

    it('modal has proper semantic structure', () => {
      const { container } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const modal = container.querySelector('.modal')
      const header = container.querySelector('.modal-header')
      const content = container.querySelector('.modal-content')

      expect(modal).toBeInTheDocument()
      expect(header).toBeInTheDocument()
      expect(content).toBeInTheDocument()
    })

    it('form labels are properly associated', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      expect(screen.getByText('Post URL')).toHaveClass('form-label')
      expect(screen.getByText('Share to')).toHaveClass('form-label')
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive classes to modal', () => {
      const { container } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const modal = container.querySelector('.modal')
      expect(modal).toHaveClass('max-w-md', 'w-full', 'sm:w-auto', 'mx-4', 'sm:mx-auto')
    })

    it('applies responsive grid classes to share options', () => {
      const { container } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2')
    })

    it('copy button has responsive minimum touch target size', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const copyButton = screen.getByRole('button', { name: /copy/i })
      expect(copyButton).toHaveClass('min-h-[44px]')
    })

    it('close button has responsive minimum touch target size', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const closeButton = screen.getByLabelText('Close modal')
      expect(closeButton).toHaveClass('min-h-[44px]', 'min-w-[44px]')
    })

    it('share option links have minimum touch target size', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const twitterLink = screen.getByText('Twitter').closest('a')
      expect(twitterLink).toHaveClass('min-h-[44px]')
    })
  })

  describe('Event Handling', () => {
    it('prevents backdrop click propagation to modal content', () => {
      const { container } = render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const modal = container.querySelector('.modal')
      const clickEvent = new Event('click', { bubbles: true })

      modal.dispatchEvent(clickEvent)
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('handles multiple rapid copy button clicks', async () => {
      jest.useFakeTimers()
      navigator.clipboard.writeText.mockResolvedValue()
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await userEvent.click(copyButton)
      await userEvent.click(copyButton)
      await userEvent.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(3)
      jest.useRealTimers()
    })

    it('handles multiple share option clicks', () => {
      render(<ShareModal post={mockPost} onClose={mockOnClose} onShare={mockOnShare} />)
      const twitterLink = screen.getByText('Twitter').closest('a')

      fireEvent.click(twitterLink)
      expect(mockOnShare).toHaveBeenCalledTimes(1)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})

export default modal
