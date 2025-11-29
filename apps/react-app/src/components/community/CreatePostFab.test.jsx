import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import CreatePostFab from './CreatePostFab'

describe('CreatePostFab', () => {
  describe('Rendering', () => {
    it('should render the main FAB button', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      expect(fabButton).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      const { container } = render(<CreatePostFab className="custom-class" />)
      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
    })

    it('should render FAB with correct positioning classes', () => {
      const { container } = render(<CreatePostFab />)
      const wrapper = container.querySelector('.fixed.bottom-20.right-4.z-50')
      expect(wrapper).toBeInTheDocument()
    })

    it('should render plus icon inside FAB button', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      const svg = fabButton.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '24')
      expect(svg).toHaveAttribute('height', '24')
    })

    it('should not render quick actions initially', () => {
      render(<CreatePostFab />)
      expect(screen.queryByText('Text Post')).not.toBeInTheDocument()
      expect(screen.queryByText('Image Post')).not.toBeInTheDocument()
      expect(screen.queryByText('Link Post')).not.toBeInTheDocument()
    })
  })

  describe('Quick Actions Display', () => {
    it('should show quick actions when FAB is clicked', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      expect(screen.getByText('Text Post')).toBeInTheDocument()
      expect(screen.getByText('Image Post')).toBeInTheDocument()
      expect(screen.getByText('Link Post')).toBeInTheDocument()
    })

    it('should hide quick actions when FAB is clicked again', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })

      fireEvent.click(fabButton)
      expect(screen.getByText('Text Post')).toBeInTheDocument()

      fireEvent.click(fabButton)
      expect(screen.queryByText('Text Post')).not.toBeInTheDocument()
    })

    it('should render three quick action buttons when expanded', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const actionLinks = screen.getAllByRole('link')
      expect(actionLinks).toHaveLength(3)
    })

    it('should render text post quick action with correct href', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const textPostLink = screen.getByLabelText('Text Post')
      expect(textPostLink).toHaveAttribute('href', '/submit?type=text')
    })

    it('should render image post quick action with correct href', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const imagePostLink = screen.getByLabelText('Image Post')
      expect(imagePostLink).toHaveAttribute('href', '/submit?type=image')
    })

    it('should render link post quick action with correct href', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const linkPostLink = screen.getByLabelText('Link Post')
      expect(linkPostLink).toHaveAttribute('href', '/submit?type=link')
    })
  })

  describe('Community Name Integration', () => {
    it('should use community-specific URLs when communityName is provided', () => {
      render(<CreatePostFab communityName="javascript" />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const textPostLink = screen.getByLabelText('Text Post')
      expect(textPostLink).toHaveAttribute('href', '/r/javascript/submit?type=text')
    })

    it('should use community-specific URL for image post', () => {
      render(<CreatePostFab communityName="pics" />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const imagePostLink = screen.getByLabelText('Image Post')
      expect(imagePostLink).toHaveAttribute('href', '/r/pics/submit?type=image')
    })

    it('should use community-specific URL for link post', () => {
      render(<CreatePostFab communityName="programming" />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const linkPostLink = screen.getByLabelText('Link Post')
      expect(linkPostLink).toHaveAttribute('href', '/r/programming/submit?type=link')
    })

    it('should use default URLs when communityName is null', () => {
      render(<CreatePostFab communityName={null} />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      expect(screen.getByLabelText('Text Post')).toHaveAttribute('href', '/submit?type=text')
      expect(screen.getByLabelText('Image Post')).toHaveAttribute('href', '/submit?type=image')
      expect(screen.getByLabelText('Link Post')).toHaveAttribute('href', '/submit?type=link')
    })
  })

  describe('Animation and Styling', () => {
    it('should apply rotation class when quick actions are shown', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })

      expect(fabButton).not.toHaveClass('rotate-45')

      fireEvent.click(fabButton)
      expect(fabButton).toHaveClass('rotate-45')
    })

    it('should remove rotation class when quick actions are hidden', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })

      fireEvent.click(fabButton)
      expect(fabButton).toHaveClass('rotate-45')

      fireEvent.click(fabButton)
      expect(fabButton).not.toHaveClass('rotate-45')
    })

    it('should apply correct color classes to quick action buttons', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const textPostLink = screen.getByLabelText('Text Post')
      const imagePostLink = screen.getByLabelText('Image Post')
      const linkPostLink = screen.getByLabelText('Link Post')

      expect(textPostLink).toHaveClass('bg-blue-500')
      expect(imagePostLink).toHaveClass('bg-green-500')
      expect(linkPostLink).toHaveClass('bg-purple-500')
    })

    it('should apply animation classes to quick action buttons', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const actionLinks = screen.getAllByRole('link')
      actionLinks.forEach(link => {
        expect(link).toHaveClass('animate-slide-up')
      })
    })

    it('should apply staggered animation delays to quick action labels', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const labels = [
        screen.getByText('Text Post'),
        screen.getByText('Image Post'),
        screen.getByText('Link Post')
      ]

      expect(labels[0]).toHaveStyle({ animationDelay: '0ms' })
      expect(labels[1]).toHaveStyle({ animationDelay: '50ms' })
      expect(labels[2]).toHaveStyle({ animationDelay: '100ms' })
    })
  })

  describe('Backdrop Interaction', () => {
    it('should render backdrop when quick actions are shown', () => {
      const { container } = render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })

      fireEvent.click(fabButton)

      const backdrop = container.querySelector('.fixed.inset-0.bg-transparent')
      expect(backdrop).toBeInTheDocument()
    })

    it('should not render backdrop when quick actions are hidden', () => {
      const { container } = render(<CreatePostFab />)

      const backdrop = container.querySelector('.fixed.inset-0.bg-transparent')
      expect(backdrop).not.toBeInTheDocument()
    })

    it('should close quick actions when backdrop is clicked', () => {
      const { container } = render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })

      fireEvent.click(fabButton)
      expect(screen.getByText('Text Post')).toBeInTheDocument()

      const backdrop = container.querySelector('.fixed.inset-0.bg-transparent')
      fireEvent.click(backdrop)

      expect(screen.queryByText('Text Post')).not.toBeInTheDocument()
    })
  })

  describe('Quick Action Link Clicks', () => {
    it('should close quick actions when text post link is clicked', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const textPostLink = screen.getByLabelText('Text Post')
      fireEvent.click(textPostLink)

      expect(screen.queryByText('Text Post')).not.toBeInTheDocument()
    })

    it('should close quick actions when image post link is clicked', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const imagePostLink = screen.getByLabelText('Image Post')
      fireEvent.click(imagePostLink)

      expect(screen.queryByText('Image Post')).not.toBeInTheDocument()
    })

    it('should close quick actions when link post link is clicked', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const linkPostLink = screen.getByLabelText('Link Post')
      fireEvent.click(linkPostLink)

      expect(screen.queryByText('Link Post')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on main FAB button', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      expect(fabButton).toHaveAttribute('aria-label', 'Create post')
    })

    it('should have sr-only labels for quick action buttons', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const textPostLink = screen.getByLabelText('Text Post')
      const srOnly = textPostLink.querySelector('.sr-only')
      expect(srOnly).toHaveTextContent('Text Post')
    })

    it('should maintain keyboard accessibility for all links', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('should be keyboard navigable for main button', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })

      fabButton.focus()
      expect(fabButton).toHaveFocus()
    })
  })

  describe('Icon Rendering', () => {
    it('should render icons for all quick action buttons', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const actionLinks = screen.getAllByRole('link')
      actionLinks.forEach(link => {
        const svg = link.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('width', '20')
        expect(svg).toHaveAttribute('height', '20')
      })
    })

    it('should render different icons for each action type', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const textPostLink = screen.getByLabelText('Text Post')
      const imagePostLink = screen.getByLabelText('Image Post')
      const linkPostLink = screen.getByLabelText('Link Post')

      expect(textPostLink.querySelector('svg')).toBeInTheDocument()
      expect(imagePostLink.querySelector('svg')).toBeInTheDocument()
      expect(linkPostLink.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('should toggle showQuickActions state correctly', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })

      expect(screen.queryByText('Text Post')).not.toBeInTheDocument()

      fireEvent.click(fabButton)
      expect(screen.getByText('Text Post')).toBeInTheDocument()

      fireEvent.click(fabButton)
      expect(screen.queryByText('Text Post')).not.toBeInTheDocument()

      fireEvent.click(fabButton)
      expect(screen.getByText('Text Post')).toBeInTheDocument()
    })

    it('should maintain state through multiple interactions', () => {
      const { container } = render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })

      fireEvent.click(fabButton)
      const textPostLink = screen.getByLabelText('Text Post')
      fireEvent.click(textPostLink)

      expect(screen.queryByText('Text Post')).not.toBeInTheDocument()

      fireEvent.click(fabButton)
      expect(screen.getByText('Text Post')).toBeInTheDocument()
    })
  })

  describe('Label Display', () => {
    it('should show labels for all quick actions when expanded', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const labels = screen.getAllByText(/Post$/)
      expect(labels).toHaveLength(6) // 3 visible labels + 3 sr-only labels
    })

    it('should apply fade-in animation to labels', () => {
      render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const labelContainers = screen.getAllByText(/Post$/).filter(el =>
        el.classList.contains('animate-fade-in')
      )
      expect(labelContainers.length).toBeGreaterThan(0)
    })

    it('should position labels correctly relative to FAB', () => {
      const { container } = render(<CreatePostFab />)
      const fabButton = screen.getByRole('button', { name: /create post/i })
      fireEvent.click(fabButton)

      const labelsContainer = container.querySelector('.absolute.right-16.bottom-0')
      expect(labelsContainer).toBeInTheDocument()
    })
  })
})

export default fabButton
