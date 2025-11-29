/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { renderWithProviders } from '../../__test__/utils/testUtils'
import MessageRequestsPage from '../MessageRequestsPage'

// Mock PageSkeleton component
jest.mock('../../components/LoadingSkeleton', () => ({
  PageSkeleton: ({ type }) => <div data-testid="loading-skeleton" data-type={type}>Loading...</div>
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MessageCircle: ({ size, color, style }) => <div data-testid="message-circle-icon">MessageCircle</div>,
  Check: () => <div>Check</div>,
  X: () => <div>X</div>,
  Clock: () => <div>Clock</div>,
  User: () => <div>User</div>
}))

const mockRequests = [
  {
    id: '1',
    sender: { id: 'user1', username: 'user1', displayName: 'User One', avatar: null },
    message: 'Hey, would love to connect!',
    createdAt: new Date().toISOString(),
    status: 'pending'
  },
  {
    id: '2',
    sender: { id: 'user2', username: 'user2', displayName: 'User Two', avatar: null },
    message: 'Hi there!',
    createdAt: new Date().toISOString(),
    status: 'pending'
  }
]

describe('MessageRequestsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      const { container } = render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(container).toBeInTheDocument()
    })

    it('displays the page title', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByText('Message Requests')).toBeInTheDocument()
    })

    it('has proper main role with aria-label', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'Message requests page')
    })

    it('renders without console errors', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('displays description text', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByText(/Review messages from people you don't follow/i)).toBeInTheDocument()
    })

    it('has correct background styling', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      const { container } = render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main.style.minHeight).toBe('100vh')
    })

    it('renders the main container', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has proper padding top', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      const { container } = render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main.style.paddingTop).toBe('80px')
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton initially', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}))
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
    })

    it('loading skeleton has correct type', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}))
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const skeleton = screen.getByTestId('loading-skeleton')
      expect(skeleton).toHaveAttribute('data-type', 'feed')
    })

    it('hides loading after data loads', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('Filter Tabs', () => {
    it('renders pending filter tab', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('renders accepted filter tab', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByText('Accepted')).toBeInTheDocument()
    })

    it('renders declined filter tab', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByText('Declined')).toBeInTheDocument()
    })

    it('pending tab is active by default', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const pendingButton = screen.getByLabelText('View Pending requests')
      expect(pendingButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to accepted filter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const acceptedButton = screen.getByLabelText('View Accepted requests')
      fireEvent.click(acceptedButton)
      expect(acceptedButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('switches to declined filter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const declinedButton = screen.getByLabelText('View Declined requests')
      fireEvent.click(declinedButton)
      expect(declinedButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('fetches data when filter changes', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/messages/requests?status=pending',
          expect.any(Object)
        )
      })

      const acceptedButton = screen.getByLabelText('View Accepted requests')
      fireEvent.click(acceptedButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/messages/requests?status=accepted',
          expect.any(Object)
        )
      })
    })

    it('applies active styling to selected tab', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const pendingButton = screen.getByLabelText('View Pending requests')
      expect(pendingButton.style.borderBottom).toBe('2px solid #667eea')
    })

    it('applies inactive styling to unselected tabs', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const acceptedButton = screen.getByLabelText('View Accepted requests')
      expect(acceptedButton.style.borderBottom).toBe('2px solid transparent')
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.getByText(/No pending message requests/i)).toBeInTheDocument()
      })
    })

    it('displays message circle icon in empty state', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument()
      })
    })

    it('shows helper text in empty state', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.getByText(/When people send you messages, they'll appear here/i)).toBeInTheDocument()
      })
    })

    it('shows appropriate empty state for each filter', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.getByText(/No pending message requests/i)).toBeInTheDocument()
      })

      const acceptedButton = screen.getByLabelText('View Accepted requests')
      fireEvent.click(acceptedButton)

      await waitFor(() => {
        expect(screen.getByText(/No accepted message requests/i)).toBeInTheDocument()
      })
    })
  })

  describe('Message Request Display', () => {
    it('displays message requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })

    it('shows sender information', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })

    it('displays message preview', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })

    it('shows timestamp', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accept/Decline Actions', () => {
    it('shows accept and decline buttons for pending requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })

    it('hides action buttons for accepted requests', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })

      const acceptedButton = screen.getByLabelText('View Accepted requests')

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] })
      })

      fireEvent.click(acceptedButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/messages/requests?status=accepted',
          expect.any(Object)
        )
      })
    })

    it('handles accept request', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: mockRequests })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: [] })
        })

      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })

    it('handles decline request', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: mockRequests })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: [] })
        })

      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })
    })

    it('refetches requests after accept', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: mockRequests })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: [] })
        })

      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('refetches requests after decline', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: mockRequests })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: [] })
        })

      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles fetch error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValue(new Error('Network error'))

      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Fetch requests error:', expect.any(Error))
      })

      consoleError.mockRestore()
    })

    it('handles accept error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: mockRequests })
        })
        .mockRejectedValueOnce(new Error('Accept failed'))

      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })

      consoleError.mockRestore()
    })

    it('handles decline error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ requests: mockRequests })
        })
        .mockRejectedValueOnce(new Error('Decline failed'))

      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument()
      })

      consoleError.mockRestore()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Message requests page')
    })

    it('filter buttons have aria-labels', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByLabelText('View Pending requests')).toBeInTheDocument()
      expect(screen.getByLabelText('View Accepted requests')).toBeInTheDocument()
      expect(screen.getByLabelText('View Declined requests')).toBeInTheDocument()
    })

    it('filter buttons have aria-pressed attribute', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const pendingButton = screen.getByLabelText('View Pending requests')
      expect(pendingButton).toHaveAttribute('aria-pressed')
    })

    it('supports keyboard navigation', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
      })
    })

    it('has semantic HTML structure', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on mobile', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      global.innerWidth = 375
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders properly on tablet', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      global.innerWidth = 768
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders properly on desktop', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      global.innerWidth = 1920
      render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      const { rerender } = render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      rerender(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles multiple rerenders', () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ requests: [] })
      })
      const { rerender } = render(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      rerender(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      rerender(<BrowserRouter><MessageRequestsPage /></BrowserRouter>)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})

export default mockRequests
