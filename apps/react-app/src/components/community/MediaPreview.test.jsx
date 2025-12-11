import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import MediaPreview from './MediaPreview'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

describe('MediaPreview Component', () => {
  describe('Image Preview', () => {
    it('should render image with correct src and alt', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} title="Test Image" />)

      const img = screen.getByAltText('Test Image')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('should use default alt text when title is not provided', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      expect(screen.getByAltText('Post image')).toBeInTheDocument()
    })

    it('should show loading spinner initially', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const spinner = document.querySelector('.')
      expect(spinner).toBeInTheDocument()
    })

    it('should hide loading spinner when image loads', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      fireEvent.load(img)

      const spinner = document.querySelector('.')
      expect(spinner).not.toBeInTheDocument()
    })

    it('should show loaded image with full opacity', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      fireEvent.load(img)

      expect(img).toHaveClass('opacity-100')
    })

    it('should have lazy loading attribute', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      expect(img).toHaveAttribute('loading', 'lazy')
    })

    it('should show error message when image fails to load', () => {
      const media = { type: 'image', url: 'https://example.com/broken.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      fireEvent.error(img)

      expect(screen.getByText('Failed to load image')).toBeInTheDocument()
    })

    it('should hide image when error occurs', () => {
      const media = { type: 'image', url: 'https://example.com/broken.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      fireEvent.error(img)

      expect(img).toHaveClass('opacity-0')
    })

    it('should show expand icon on loaded image in non-compact mode', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      fireEvent.load(img)

      const expandIcon = document.querySelector('svg')
      expect(expandIcon).toBeInTheDocument()
    })

    it('should not show expand icon in compact mode', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} compact />)

      const img = screen.getByAltText('Post image')
      fireEvent.load(img)

      const svgs = document.querySelectorAll('svg')
      // Only spinner SVG should be present initially, none after load
      expect(svgs.length).toBeLessThanOrEqual(1)
    })

    it('should call onExpand when image is clicked', () => {
      const onExpand = jest.fn()
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} onExpand={onExpand} />)

      const container = screen.getByRole('button', { name: 'View full image' })
      fireEvent.click(container)

      expect(onExpand).toHaveBeenCalledTimes(1)
    })

    it('should have cursor-pointer class on image', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      expect(img).toHaveClass('cursor-pointer')
    })

    it('should have proper accessibility attributes', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const container = screen.getByRole('button', { name: 'View full image' })
      expect(container).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Video Preview', () => {
    it('should render video with correct src', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const video = document.querySelector('video')
      expect(video).toBeInTheDocument()
      expect(video).toHaveAttribute('src', 'https://example.com/video.mp4')
    })

    it('should render video with poster image', () => {
      const media = {
        type: 'video',
        url: 'https://example.com/video.mp4',
        thumbnail: 'https://example.com/thumb.jpg'
      }
      render(<MediaPreview media={media} />)

      const video = document.querySelector('video')
      expect(video).toHaveAttribute('poster', 'https://example.com/thumb.jpg')
    })

    it('should have video attributes set correctly', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const video = document.querySelector('video')
      expect(video).toHaveAttribute('preload', 'metadata')
      expect(video).toHaveAttribute('muted')
      expect(video).toHaveAttribute('loop')
    })

    it('should show play icon initially', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const playIcon = screen.getByRole('img', { hidden: true })
      expect(playIcon).toBeInTheDocument()
    })

    it('should play video when clicked', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const video = document.querySelector('video')
      video.play = jest.fn()

      fireEvent.click(video)
      expect(video.play).toHaveBeenCalled()
    })

    it('should pause video when clicked while playing', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const video = document.querySelector('video')
      video.play = jest.fn()
      video.pause = jest.fn()

      // First click to play
      fireEvent.click(video)
      fireEvent.play(video)

      // Second click to pause
      fireEvent.click(video)
      expect(video.pause).toHaveBeenCalled()
    })

    it('should show pause icon when video is playing', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const video = document.querySelector('video')
      fireEvent.play(video)

      // Pause icon has different path
      const pauseIcon = document.querySelector('path[d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"]')
      expect(pauseIcon).toBeInTheDocument()
    })

    it('should stop propagation when video is clicked', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      const onExpand = jest.fn()
      render(<MediaPreview media={media} onExpand={onExpand} />)

      const video = document.querySelector('video')
      const event = new MouseEvent('click', { bubbles: true })
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation')

      fireEvent(video, event)
      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    it('should show controls on mouse enter', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.relative.overflow-hidden')
      const video = document.querySelector('video')

      fireEvent.play(video)
      fireEvent.mouseEnter(container)

      const overlay = document.querySelector('.absolute.inset-0')
      expect(overlay).toHaveClass('opacity-100')
    })

    it('should hide controls on mouse leave when playing', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.relative.overflow-hidden')
      const video = document.querySelector('video')

      fireEvent.play(video)
      fireEvent.mouseEnter(container)
      fireEvent.mouseLeave(container)

      const overlay = document.querySelector('.absolute.inset-0')
      expect(overlay).toHaveClass('opacity-0')
    })

    it('should display video duration badge', () => {
      const media = {
        type: 'video',
        url: 'https://example.com/video.mp4',
        duration: '1:23'
      }
      render(<MediaPreview media={media} />)

      expect(screen.getByText('1:23')).toBeInTheDocument()
    })

    it('should not display duration badge when duration is not provided', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const durationBadge = document.querySelector('.absolute.bottom-2.right-2')
      expect(durationBadge).not.toBeInTheDocument()
    })

    it('should toggle play on overlay click', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const video = document.querySelector('video')
      video.play = jest.fn()

      const overlay = document.querySelector('.absolute.inset-0')
      fireEvent.click(overlay)

      expect(video.play).toHaveBeenCalled()
    })
  })

  describe('GIF Preview', () => {
    it('should render GIF image', () => {
      const media = { type: 'gif', url: 'https://example.com/animation.gif' }
      render(<MediaPreview media={media} title="Test GIF" />)

      const img = screen.getByAltText('Test GIF')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/animation.gif')
    })

    it('should use default alt text for GIF', () => {
      const media = { type: 'gif', url: 'https://example.com/animation.gif' }
      render(<MediaPreview media={media} />)

      expect(screen.getByAltText('GIF')).toBeInTheDocument()
    })

    it('should show GIF badge', () => {
      const media = { type: 'gif', url: 'https://example.com/animation.gif' }
      render(<MediaPreview media={media} />)

      expect(screen.getByText('GIF')).toBeInTheDocument()
    })

    it('should have lazy loading attribute on GIF', () => {
      const media = { type: 'gif', url: 'https://example.com/animation.gif' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('GIF')
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('Gallery/Carousel Preview', () => {
    it('should render gallery with multiple images', () => {
      const media = {
        type: 'gallery',
        images: [
          { url: 'https://example.com/img1.jpg' },
          { url: 'https://example.com/img2.jpg' },
          { url: 'https://example.com/img3.jpg' }
        ]
      }
      render(<MediaPreview media={media} />)

      const images = screen.getAllByAltText(/Gallery image/)
      expect(images).toHaveLength(3)
    })

    it('should show maximum of 4 images', () => {
      const media = {
        type: 'gallery',
        images: [
          { url: 'https://example.com/img1.jpg' },
          { url: 'https://example.com/img2.jpg' },
          { url: 'https://example.com/img3.jpg' },
          { url: 'https://example.com/img4.jpg' },
          { url: 'https://example.com/img5.jpg' },
          { url: 'https://example.com/img6.jpg' }
        ]
      }
      render(<MediaPreview media={media} />)

      const images = screen.getAllByAltText(/Gallery image/)
      expect(images).toHaveLength(4)
    })

    it('should show count overlay when more than 4 images', () => {
      const media = {
        type: 'gallery',
        images: [
          { url: 'https://example.com/img1.jpg' },
          { url: 'https://example.com/img2.jpg' },
          { url: 'https://example.com/img3.jpg' },
          { url: 'https://example.com/img4.jpg' },
          { url: 'https://example.com/img5.jpg' },
          { url: 'https://example.com/img6.jpg' }
        ]
      }
      render(<MediaPreview media={media} />)

      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    it('should not show count overlay when exactly 4 images', () => {
      const media = {
        type: 'gallery',
        images: [
          { url: 'https://example.com/img1.jpg' },
          { url: 'https://example.com/img2.jpg' },
          { url: 'https://example.com/img3.jpg' },
          { url: 'https://example.com/img4.jpg' }
        ]
      }
      render(<MediaPreview media={media} />)

      expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
    })

    it('should have grid layout for gallery', () => {
      const media = {
        type: 'gallery',
        images: [
          { url: 'https://example.com/img1.jpg' },
          { url: 'https://example.com/img2.jpg' }
        ]
      }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.grid.grid-cols-2')
      expect(container).toBeInTheDocument()
    })

    it('should render images with correct alt text', () => {
      const media = {
        type: 'gallery',
        images: [
          { url: 'https://example.com/img1.jpg' },
          { url: 'https://example.com/img2.jpg' }
        ]
      }
      render(<MediaPreview media={media} />)

      expect(screen.getByAltText('Gallery image 1')).toBeInTheDocument()
      expect(screen.getByAltText('Gallery image 2')).toBeInTheDocument()
    })

    it('should have lazy loading on gallery images', () => {
      const media = {
        type: 'gallery',
        images: [
          { url: 'https://example.com/img1.jpg' },
          { url: 'https://example.com/img2.jpg' }
        ]
      }
      render(<MediaPreview media={media} />)

      const images = screen.getAllByAltText(/Gallery image/)
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy')
      })
    })
  })

  describe('Dimensions and Sizing', () => {
    it('should apply compact dimensions', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} compact />)

      const container = document.querySelector('.relative.overflow-hidden')
      expect(container).toHaveStyle({ maxWidth: '120px', maxHeight: '120px' })
    })

    it('should calculate dimensions based on aspect ratio', () => {
      const media = {
        type: 'image',
        url: 'https://example.com/image.jpg',
        width: 800,
        height: 600
      }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.relative.overflow-hidden')
      expect(container).toHaveStyle({ width: '600px', height: '450px' })
    })

    it('should use original dimensions when smaller than max', () => {
      const media = {
        type: 'image',
        url: 'https://example.com/image.jpg',
        width: 400,
        height: 300
      }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.relative.overflow-hidden')
      expect(container).toHaveStyle({ width: '400px', height: '300px' })
    })

    it('should apply default max height when dimensions not provided', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.relative.overflow-hidden')
      expect(container).toHaveStyle({ maxWidth: '100%', maxHeight: '400px' })
    })

    it('should have flex-shrink-0 class in compact mode', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} compact />)

      const container = document.querySelector('.flex-shrink-0')
      expect(container).toBeInTheDocument()
    })

    it('should have w-full class in non-compact mode', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.w-full')
      expect(container).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show pulse animation while loading', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.')
      expect(container).toBeInTheDocument()
    })

    it('should remove pulse animation after load', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      fireEvent.load(img)

      const container = document.querySelector('.')
      expect(container).not.toBeInTheDocument()
    })

    it('should remove pulse animation after error', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      fireEvent.error(img)

      const container = document.querySelector('.')
      expect(container).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error icon on image load failure', () => {
      const media = { type: 'image', url: 'https://example.com/broken.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      fireEvent.error(img)

      const errorSvg = document.querySelector('svg')
      expect(errorSvg).toBeInTheDocument()
    })

    it('should clear error state when image loads successfully', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')

      // Trigger error first
      fireEvent.error(img)
      expect(screen.getByText('Failed to load image')).toBeInTheDocument()

      // Then successful load
      fireEvent.load(img)
      expect(screen.queryByText('Failed to load image')).not.toBeInTheDocument()
    })
  })

  describe('Unknown Media Type Fallback', () => {
    it('should render fallback for unknown media type', () => {
      const media = { type: 'unknown', url: 'https://example.com/file.xyz' }
      render(<MediaPreview media={media} />)

      expect(screen.getByText('Media content')).toBeInTheDocument()
    })

    it('should show document icon in fallback', () => {
      const media = { type: 'unknown', url: 'https://example.com/file.xyz' }
      render(<MediaPreview media={media} />)

      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should have rounded corners', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.rounded-lg')
      expect(container).toBeInTheDocument()
    })

    it('should have overflow hidden', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.overflow-hidden')
      expect(container).toBeInTheDocument()
    })

    it('should have background color', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const container = document.querySelector('.bg-bg-tertiary')
      expect(container).toBeInTheDocument()
    })

    it('should have object-cover on image', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const img = screen.getByAltText('Post image')
      expect(img).toHaveClass('object-cover')
    })

    it('should have object-cover on video', () => {
      const media = { type: 'video', url: 'https://example.com/video.mp4' }
      render(<MediaPreview media={media} />)

      const video = document.querySelector('video')
      expect(video).toHaveClass('object-cover')
    })
  })

  describe('Prop Handling', () => {
    it('should accept isExpanded prop', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} isExpanded />)

      // Component should render without errors
      expect(screen.getByAltText('Post image')).toBeInTheDocument()
    })

    it('should handle missing onExpand callback', () => {
      const media = { type: 'image', url: 'https://example.com/image.jpg' }
      render(<MediaPreview media={media} />)

      const container = screen.getByRole('button', { name: 'View full image' })

      // Should not throw error when clicked without callback
      expect(() => fireEvent.click(container)).not.toThrow()
    })

    it('should handle empty gallery images array', () => {
      const media = { type: 'gallery', images: [] }
      render(<MediaPreview media={media} />)

      const images = screen.queryAllByAltText(/Gallery image/)
      expect(images).toHaveLength(0)
    })

    it('should handle gallery with undefined images', () => {
      const media = { type: 'gallery' }
      render(<MediaPreview media={media} />)

      // Should render without errors
      const container = document.querySelector('.grid')
      expect(container).toBeInTheDocument()
    })
  })
})

export default media
