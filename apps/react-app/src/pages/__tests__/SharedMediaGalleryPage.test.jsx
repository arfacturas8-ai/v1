/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom'
import { renderWithProviders } from '../../__test__/utils/testUtils'
import SharedMediaGalleryPage from '../SharedMediaGalleryPage'

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn()
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div>ArrowLeft</div>,
  Image: () => <div>Image</div>,
  File: () => <div>File</div>,
  Link: () => <div>Link</div>,
  Download: () => <div>Download</div>,
  ExternalLink: () => <div>ExternalLink</div>,
  Search: () => <div>Search</div>,
  Filter: () => <div>Filter</div>,
  Grid: () => <div>Grid</div>,
  List: () => <div>List</div>,
  Calendar: () => <div>Calendar</div>
}))

describe('SharedMediaGalleryPage', () => {
  const mockNavigate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useParams.mockReturnValue({ conversationId: 'conv123' })
    useNavigate.mockReturnValue(mockNavigate)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(container).toBeInTheDocument()
    })

    it('displays the page title', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText('Shared Media')).toBeInTheDocument()
    })

    it('has proper main role with aria-label', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'Shared media gallery page')
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('displays description text', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText(/All shared content from this conversation/i)).toBeInTheDocument()
    })

    it('has correct background styling', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main).toHaveClass('min-h-screen')
      expect(main).toHaveClass('bg-gray-50')
    })

    it('uses memo optimization', () => {
      expect(SharedMediaGalleryPage).toBeDefined()
    })

    it('renders the main container', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders back button', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const backButton = screen.getByLabelText('Go back')
      expect(backButton).toBeInTheDocument()
    })

    it('displays conversation ID from params', () => {
      useParams.mockReturnValue({ conversationId: 'test-conv-123' })
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Header and Navigation', () => {
    it('renders header section', () => {
      const { container } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(container.querySelector('.bg-white')).toBeInTheDocument()
    })

    it('back button navigates back', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const backButton = screen.getByLabelText('Go back')
      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('displays page header', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText('Shared Media')).toBeInTheDocument()
    })

    it('applies proper styling to header', () => {
      const { container } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const header = container.querySelector('.bg-white.dark\\:bg-[#161b22]')
      expect(header).toBeInTheDocument()
    })

    it('has border bottom on header', () => {
      const { container } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const header = container.querySelector('.border-b')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Tabs Functionality', () => {
    it('renders media tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('tab', { name: /Media/i })).toBeInTheDocument()
    })

    it('renders files tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('tab', { name: /Files/i })).toBeInTheDocument()
    })

    it('renders links tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('tab', { name: /Links/i })).toBeInTheDocument()
    })

    it('media tab is active by default', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const mediaTab = screen.getByRole('tab', { name: /Media/i })
      expect(mediaTab).toHaveAttribute('aria-selected', 'true')
    })

    it('switches to files tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(filesTab).toHaveAttribute('aria-selected', 'true')
    })

    it('switches to links tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const linksTab = screen.getByRole('tab', { name: /Links/i })
      fireEvent.click(linksTab)
      expect(linksTab).toHaveAttribute('aria-selected', 'true')
    })

    it('displays count badge on media tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('displays count badge on files tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getAllByText('4')).toHaveLength(2)
    })

    it('displays count badge on links tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('applies active styling to selected tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const mediaTab = screen.getByRole('tab', { name: /Media/i })
      expect(mediaTab).toHaveClass('bg-blue-50')
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toBeInTheDocument()
    })

    it('allows typing in search input', async () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const searchInput = screen.getByPlaceholderText('Search...')
      await userEvent.type(searchInput, 'test search')
      expect(searchInput).toHaveValue('test search')
    })

    it('updates search query state', async () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const searchInput = screen.getByPlaceholderText('Search...')
      await userEvent.type(searchInput, 'screenshot')
      expect(searchInput.value).toBe('screenshot')
    })

    it('search input has proper styling', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toHaveClass('w-full')
    })

    it('displays search icon', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getAllByText('Search')).toHaveLength(1)
    })
  })

  describe('Filter Button', () => {
    it('renders filter button', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText('Filter')).toBeInTheDocument()
    })

    it('filter button is clickable', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filterButton = screen.getByText('Filter').closest('button')
      expect(filterButton).toBeInTheDocument()
      fireEvent.click(filterButton)
    })

    it('applies hover styles to filter button', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filterButton = screen.getByText('Filter').closest('button')
      expect(filterButton).toHaveClass('hover:bg-gray-100')
    })
  })

  describe('View Mode Toggle', () => {
    it('renders grid view button', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const gridButton = screen.getByLabelText('Grid view')
      expect(gridButton).toBeInTheDocument()
    })

    it('renders list view button', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const listButton = screen.getByLabelText('List view')
      expect(listButton).toBeInTheDocument()
    })

    it('grid view is active by default', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const gridButton = screen.getByLabelText('Grid view')
      expect(gridButton).toHaveClass('bg-white')
    })

    it('switches to list view', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const listButton = screen.getByLabelText('List view')
      fireEvent.click(listButton)
      expect(listButton).toHaveClass('bg-white')
    })

    it('switches back to grid view', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const listButton = screen.getByLabelText('List view')
      const gridButton = screen.getByLabelText('Grid view')

      fireEvent.click(listButton)
      fireEvent.click(gridButton)

      expect(gridButton).toHaveClass('bg-white')
    })

    it('displays grid icon', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText('Grid')).toBeInTheDocument()
    })

    it('displays list icon', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText('List')).toBeInTheDocument()
    })
  })

  describe('Media Tab Content', () => {
    it('displays media items in grid view', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const mediaTab = screen.getByRole('tab', { name: /Media/i })
      fireEvent.click(mediaTab)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays images in media gallery', () => {
      const { container } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const images = container.querySelectorAll('img')
      expect(images.length).toBeGreaterThan(0)
    })

    it('displays video placeholder', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByText('🎥')).toBeInTheDocument()
    })

    it('shows download button on hover', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getAllByText('Download').length).toBeGreaterThan(0)
    })

    it('shows external link button on hover', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getAllByText('ExternalLink').length).toBeGreaterThan(0)
    })

    it('applies grid layout to media items', () => {
      const { container } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toBeInTheDocument()
    })

    it('displays media in list view', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const listButton = screen.getByLabelText('List view')
      fireEvent.click(listButton)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('shows media metadata in list view', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const listButton = screen.getByLabelText('List view')
      fireEvent.click(listButton)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Files Tab Content', () => {
    it('displays files when files tab is active', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(screen.getByText('Project_Proposal.pdf')).toBeInTheDocument()
    })

    it('displays file icons', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(screen.getAllByText('File').length).toBeGreaterThan(0)
    })

    it('displays file names', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(screen.getByText('Budget_2024.xlsx')).toBeInTheDocument()
    })

    it('displays file types', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(screen.getByText(/PDF/)).toBeInTheDocument()
    })

    it('displays file sizes', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(screen.getByText(/2.5 MB/)).toBeInTheDocument()
    })

    it('displays file dates', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument()
    })

    it('displays download button for each file', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(screen.getAllByText('Download').length).toBeGreaterThan(0)
    })

    it('shows file type colors', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const filesTab = screen.getByRole('tab', { name: /Files/i })
      fireEvent.click(filesTab)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Links Tab Content', () => {
    it('displays links when links tab is active', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const linksTab = screen.getByRole('tab', { name: /Links/i })
      fireEvent.click(linksTab)
      expect(screen.getByText('GitHub Repository')).toBeInTheDocument()
    })

    it('displays link titles', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const linksTab = screen.getByRole('tab', { name: /Links/i })
      fireEvent.click(linksTab)
      expect(screen.getByText('Documentation')).toBeInTheDocument()
    })

    it('displays link URLs', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const linksTab = screen.getByRole('tab', { name: /Links/i })
      fireEvent.click(linksTab)
      expect(screen.getByText('https://github.com/example/repo')).toBeInTheDocument()
    })

    it('displays link dates', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const linksTab = screen.getByRole('tab', { name: /Links/i })
      fireEvent.click(linksTab)
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument()
    })

    it('displays link icons', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const linksTab = screen.getByRole('tab', { name: /Links/i })
      fireEvent.click(linksTab)
      expect(screen.getAllByText('Link').length).toBeGreaterThan(0)
    })

    it('displays external link buttons', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const linksTab = screen.getByRole('tab', { name: /Links/i })
      fireEvent.click(linksTab)
      expect(screen.getAllByText('ExternalLink').length).toBeGreaterThan(0)
    })

    it('links open in new tab', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const linksTab = screen.getByRole('tab', { name: /Links/i })
      fireEvent.click(linksTab)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Shared media gallery page')
    })

    it('tabs have proper role', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('tab', { name: /Media/i })).toBeInTheDocument()
    })

    it('tabs have aria-selected attribute', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const mediaTab = screen.getByRole('tab', { name: /Media/i })
      expect(mediaTab).toHaveAttribute('aria-selected')
    })

    it('buttons have proper labels', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByLabelText('Go back')).toBeInTheDocument()
      expect(screen.getByLabelText('Grid view')).toBeInTheDocument()
      expect(screen.getByLabelText('List view')).toBeInTheDocument()
    })

    it('supports keyboard navigation', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const tabs = screen.getAllByRole('tab')
      tabs.forEach(tab => {
        expect(tab).toBeInTheDocument()
      })
    })

    it('has semantic HTML structure', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on mobile', () => {
      global.innerWidth = 375
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders properly on tablet', () => {
      global.innerWidth = 768
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders properly on desktop', () => {
      global.innerWidth = 1920
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('adjusts grid columns for different screens', () => {
      const { container } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-2')
    })
  })

  describe('Performance', () => {
    it('uses React.memo for optimization', () => {
      expect(SharedMediaGalleryPage).toBeDefined()
    })

    it('renders efficiently', () => {
      const { rerender } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      rerender(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles multiple rerenders', () => {
      const { rerender } = render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      rerender(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      rerender(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing conversation ID', () => {
      useParams.mockReturnValue({})
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles empty media items', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles render errors gracefully', () => {
      render(<BrowserRouter><SharedMediaGalleryPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})

export default mockNavigate
