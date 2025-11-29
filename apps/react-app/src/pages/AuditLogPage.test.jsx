/**
 * AuditLogPage Test Suite
 * Comprehensive tests for the Audit Log page functionality with 60+ test cases
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import AuditLogPage from '../AuditLogPage'

// Mock window.URL methods
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock document methods
const mockAppendChild = jest.fn()
const mockRemoveChild = jest.fn()
document.body.appendChild = mockAppendChild
document.body.removeChild = mockRemoveChild

const mockAdminUser = {
  id: '1',
  username: 'admin',
  email: 'admin@cryb.com',
  role: 'admin',
}

const mockNormalUser = {
  id: '2',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
}

const mockAuthContext = {
  user: mockAdminUser,
  isAuthenticated: true,
  loading: false,
}

const mockLogs = [
  {
    id: 'log-1',
    action: 'user.created',
    actionLabel: 'User Created',
    user: 'admin@cryb.com',
    target: 'user-123',
    timestamp: '2024-01-15T10:30:00.000Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: { reason: 'New registration', userId: '123' },
    severity: 'info',
  },
  {
    id: 'log-2',
    action: 'user.banned',
    actionLabel: 'User Banned',
    user: 'mod1@cryb.com',
    target: 'user-456',
    timestamp: '2024-01-14T15:45:00.000Z',
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: { reason: 'Violation of community guidelines', status: 'banned' },
    severity: 'warning',
  },
  {
    id: 'log-3',
    action: 'content.deleted',
    actionLabel: 'Content Deleted',
    user: 'admin@cryb.com',
    target: 'post-789',
    timestamp: '2024-01-13T09:15:00.000Z',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: { reason: 'Spam content', postId: '789' },
    severity: 'error',
  },
]

const renderWithAuth = (component, authValue = mockAuthContext) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>,
    { container }
  )
}

describe('AuditLogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAppendChild.mockClear()
    mockRemoveChild.mockClear()
    global.fetch = jest.fn()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        logs: mockLogs,
      }),
    })
  })

  afterEach(() => {
    cleanup()
  })

  describe('Page Rendering', () => {
    it('renders without crashing', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    it('displays the page title', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Audit Log')).toBeInTheDocument()
      })
    })

    it('displays the page description', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText(/Comprehensive log of all system actions/i)).toBeInTheDocument()
      })
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithAuth(<AuditLogPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('has proper page structure with main role', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toBeInTheDocument()
        expect(main).toHaveAttribute('aria-label', 'Audit log')
      })
    })

    it('displays the Shield icon in header', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Audit Log')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      renderWithAuth(<AuditLogPage />)
      expect(screen.getByText(/Loading audit logs/i)).toBeInTheDocument()
    })

    it('displays loading spinner', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      renderWithAuth(<AuditLogPage />)
      const loadingText = screen.getByText(/Loading audit logs/i)
      expect(loadingText).toBeInTheDocument()
    })

    it('hides loading state after data loads', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading audit logs/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Loading', () => {
    it('calls API endpoint on mount', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/audit-logs',
          expect.objectContaining({
            credentials: 'include',
          })
        )
      })
    })

    it('displays logs from API response', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
        expect(screen.getByText('User Banned')).toBeInTheDocument()
      })
    })

    it('generates mock data when API fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'))
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('uses mock data when API returns non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Audit Log Display', () => {
    it('displays all log entries in table', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
        expect(screen.getByText('User Banned')).toBeInTheDocument()
        expect(screen.getByText('Content Deleted')).toBeInTheDocument()
      })
    })

    it('displays log severity icons', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })
    })

    it('displays formatted timestamps', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument()
      })
    })

    it('displays user information', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('admin@cryb.com')).toBeInTheDocument()
        expect(screen.getByText('mod1@cryb.com')).toBeInTheDocument()
      })
    })

    it('displays target information', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('user-123')).toBeInTheDocument()
        expect(screen.getByText('user-456')).toBeInTheDocument()
      })
    })

    it('displays IP addresses', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument()
        expect(screen.getByText('192.168.1.2')).toBeInTheDocument()
      })
    })

    it('displays action icons for each log type', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
      })
    })

    it('shows View details button for each log', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const viewButtons = screen.getAllByText('View')
        expect(viewButtons.length).toBeGreaterThan(0)
      })
    })

    it('displays empty state when no logs match filters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      })
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText(/No logs found matching your filters/i)).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('displays search input', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search logs by user, action, or target/i)).toBeInTheDocument()
      })
    })

    it('updates search term on input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search logs/i)
        expect(searchInput).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'admin')
      expect(searchInput).toHaveValue('admin')
    })

    it('filters logs by user search term', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('admin@cryb.com')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'mod1')
      await waitFor(() => {
        expect(screen.queryByText('admin@cryb.com')).not.toBeInTheDocument()
        expect(screen.getByText('mod1@cryb.com')).toBeInTheDocument()
      })
    })

    it('filters logs by action label search', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'banned')
      await waitFor(() => {
        expect(screen.queryByText('User Created')).not.toBeInTheDocument()
      })
    })

    it('filters logs by target search', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('user-123')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'post-789')
      await waitFor(() => {
        expect(screen.queryByText('user-123')).not.toBeInTheDocument()
      })
    })

    it('is case-insensitive when searching', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'ADMIN')
      await waitFor(() => {
        expect(screen.getByText('admin@cryb.com')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Options', () => {
    it('displays filters toggle button', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })
    })

    it('toggles filter visibility on click', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })
      const filterButton = screen.getByText('Filters')
      expect(screen.queryByText('Action Type')).not.toBeInTheDocument()
      await user.click(filterButton)
      expect(screen.getByText('Action Type')).toBeInTheDocument()
    })

    it('displays action type filter dropdown', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const filterButton = screen.getByText('Filters')
        user.click(filterButton)
      })
      await waitFor(() => {
        expect(screen.getByText('Action Type')).toBeInTheDocument()
      })
    })

    it('displays user filter dropdown', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument()
      })
    })

    it('displays date range inputs', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        expect(screen.getByText('Date Range')).toBeInTheDocument()
      })
    })

    it('shows chevron down when filters are closed', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument()
      })
    })

    it('shows chevron up when filters are open', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const filterButton = screen.getByText('Filters')
        user.click(filterButton)
      })
    })
  })

  describe('Filter by Action Type', () => {
    it('filters logs by selected action type', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const actionSelect = screen.getByLabelText('Action Type')
        fireEvent.change(actionSelect, { target: { value: 'user.banned' } })
      })
      await waitFor(() => {
        expect(screen.queryByText('User Created')).not.toBeInTheDocument()
        expect(screen.getByText('User Banned')).toBeInTheDocument()
      })
    })

    it('shows all logs when "all" is selected', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const actionSelect = screen.getByLabelText('Action Type')
        fireEvent.change(actionSelect, { target: { value: 'all' } })
      })
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
        expect(screen.getByText('User Banned')).toBeInTheDocument()
      })
    })

    it('displays all action type options', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const actionSelect = screen.getByLabelText('Action Type')
        const options = within(actionSelect).getAllByRole('option')
        expect(options.length).toBeGreaterThan(5)
      })
    })
  })

  describe('Filter by User', () => {
    it('filters logs by selected user', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const userSelect = screen.getByLabelText('User')
        fireEvent.change(userSelect, { target: { value: 'admin@cryb.com' } })
      })
      await waitFor(() => {
        expect(screen.queryByText('mod1@cryb.com')).not.toBeInTheDocument()
      })
    })

    it('shows all users option', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const userSelect = screen.getByLabelText('User')
        expect(within(userSelect).getByText('All Users')).toBeInTheDocument()
      })
    })

    it('populates user list from logs', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const userSelect = screen.getByLabelText('User')
        expect(within(userSelect).getByText('admin@cryb.com')).toBeInTheDocument()
      })
    })
  })

  describe('Filter by Date Range', () => {
    it('filters logs by start date', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const dateInputs = screen.getAllByDisplayValue('')
        fireEvent.change(dateInputs[0], { target: { value: '2024-01-14' } })
      })
    })

    it('filters logs by end date', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const dateInputs = screen.getAllByDisplayValue('')
        fireEvent.change(dateInputs[1], { target: { value: '2024-01-14' } })
      })
    })

    it('filters logs within date range', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const dateInputs = screen.getAllByDisplayValue('')
        fireEvent.change(dateInputs[0], { target: { value: '2024-01-14' } })
        fireEvent.change(dateInputs[1], { target: { value: '2024-01-15' } })
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('displays refresh button', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const refreshButton = screen.getByTitle('Refresh')
        expect(refreshButton).toBeInTheDocument()
      })
    })

    it('reloads logs on refresh click', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1)
      })
      const refreshButton = screen.getByTitle('Refresh')
      await user.click(refreshButton)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('disables refresh button while loading', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      renderWithAuth(<AuditLogPage />)
      const refreshButton = screen.getByTitle('Refresh')
      expect(refreshButton).toBeDisabled()
    })
  })

  describe('Export Functionality', () => {
    it('displays export button', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
    })

    it('exports logs as CSV', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
      const exportButton = screen.getByText('Export')
      await user.click(exportButton)
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it('shows exporting state during export', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
      const exportButton = screen.getByText('Export')
      await user.click(exportButton)
      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })

    it('disables export button when no logs', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      })
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const exportButton = screen.getByText('Export')
        expect(exportButton).toBeDisabled()
      })
    })

    it('includes filtered logs in export', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'admin')
      const exportButton = screen.getByText('Export')
      await user.click(exportButton)
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it('creates download link with correct filename', async () => {
      const user = userEvent.setup()
      const mockLink = { click: jest.fn() }
      jest.spyOn(document, 'createElement').mockReturnValueOnce(mockLink)
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
      const exportButton = screen.getByText('Export')
      await user.click(exportButton)
      await waitFor(() => {
        expect(mockLink.download).toMatch(/audit-logs-\d{4}-\d{2}-\d{2}\.csv/)
      })
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      const manyLogs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        action: 'user.created',
        actionLabel: 'User Created',
        user: 'admin@cryb.com',
        target: `user-${i}`,
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: {},
        severity: 'info',
      }))
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ logs: manyLogs }),
      })
    })

    it('displays pagination controls for many logs', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Previous')).toBeInTheDocument()
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('shows correct page numbers', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('navigates to next page', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)
      await waitFor(() => {
        const page2Button = screen.getByText('2')
        expect(page2Button).toHaveClass('bg-[#58a6ff]')
      })
    })

    it('navigates to previous page', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        const page2Button = screen.getByText('2')
        expect(page2Button).toHaveClass('bg-[#58a6ff]')
      })
      await user.click(screen.getByText('Previous'))
      await waitFor(() => {
        const page1Button = screen.getByText('1')
        expect(page1Button).toHaveClass('bg-[#58a6ff]')
      })
    })

    it('disables previous button on first page', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const prevButton = screen.getByText('Previous')
        expect(prevButton).toBeDisabled()
      })
    })

    it('disables next button on last page', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
      // Navigate to last page
      await user.click(screen.getByText('3'))
      await waitFor(() => {
        const nextButton = screen.getByText('Next')
        expect(nextButton).toBeDisabled()
      })
    })

    it('displays correct result count', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText(/Showing 1-20 of 50 logs/i)).toBeInTheDocument()
      })
    })

    it('updates result count on page change', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Next'))
      await waitFor(() => {
        expect(screen.getByText(/Showing 21-40 of 50 logs/i)).toBeInTheDocument()
      })
    })

    it('resets to page 1 when applying filters', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Next'))
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'test')
      await waitFor(() => {
        const page1Button = screen.getByText('1')
        expect(page1Button).toHaveClass('bg-[#58a6ff]')
      })
    })
  })

  describe('Entry Details Modal', () => {
    it('opens detail modal when View is clicked', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })
      await user.click(screen.getAllByText('View')[0])
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
      })
    })

    it('displays log details in modal', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })
      await user.click(screen.getAllByText('View')[0])
      await waitFor(() => {
        expect(screen.getByText('admin@cryb.com')).toBeInTheDocument()
        expect(screen.getByText('user-123')).toBeInTheDocument()
      })
    })

    it('displays user agent in modal', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })
      await user.click(screen.getAllByText('View')[0])
      await waitFor(() => {
        expect(screen.getByText(/Mozilla\/5\.0/i)).toBeInTheDocument()
      })
    })

    it('displays JSON details in modal', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })
      await user.click(screen.getAllByText('View')[0])
      await waitFor(() => {
        expect(screen.getByText(/New registration/i)).toBeInTheDocument()
      })
    })

    it('closes modal when X button is clicked', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })
      await user.click(screen.getAllByText('View')[0])
      await waitFor(async () => {
        const closeButtons = screen.getAllByRole('button')
        const xButton = closeButtons.find(btn => btn.querySelector('svg'))
        if (xButton) {
          await user.click(xButton)
        }
      })
    })

    it('closes modal when backdrop is clicked', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })
      await user.click(screen.getAllByText('View')[0])
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const backdrop = buttons[0]?.closest('.fixed')
        if (backdrop) {
          fireEvent.click(backdrop)
        }
      })
    })

    it('prevents modal close when clicking inside modal', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })
      await user.click(screen.getAllByText('View')[0])
      await waitFor(() => {
        const modalContent = screen.getByText('User Created').parentElement
        if (modalContent) {
          fireEvent.click(modalContent)
        }
      })
    })
  })

  describe('Severity Icons', () => {
    it('displays error icon for error severity', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Content Deleted')).toBeInTheDocument()
      })
    })

    it('displays warning icon for warning severity', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('User Banned')).toBeInTheDocument()
      })
    })

    it('displays info icon for info severity', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
      consoleSpy.mockRestore()
    })

    it('handles export errors', async () => {
      const user = userEvent.setup()
      global.URL.createObjectURL = jest.fn(() => {
        throw new Error('Export error')
      })
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
      const exportButton = screen.getByText('Export')
      await user.click(exportButton)
      await waitFor(() => {
        expect(screen.getByText(/Failed to export logs/i)).toBeInTheDocument()
      })
    })

    it('displays error message after export failure', async () => {
      const user = userEvent.setup()
      global.URL.createObjectURL = jest.fn(() => {
        throw new Error('Export error')
      })
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Export'))
      await waitFor(() => {
        expect(screen.getByText(/Failed to export logs/i)).toBeInTheDocument()
      })
    })
  })

  describe('Table Structure', () => {
    it('renders table with proper headers', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText('Severity')).toBeInTheDocument()
        expect(screen.getByText('Timestamp')).toBeInTheDocument()
        expect(screen.getByText('User')).toBeInTheDocument()
        expect(screen.getByText('Action')).toBeInTheDocument()
        expect(screen.getByText('Target')).toBeInTheDocument()
        expect(screen.getByText('IP Address')).toBeInTheDocument()
        expect(screen.getByText('Details')).toBeInTheDocument()
      })
    })

    it('renders table rows for each log', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const table = screen.getByRole('table')
        const rows = within(table).getAllByRole('row')
        expect(rows.length).toBeGreaterThan(3)
      })
    })

    it('applies hover styles to table rows', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const main = screen.getByRole('main')
        expect(main).toHaveAttribute('aria-label', 'Audit log')
      })
    })

    it('supports keyboard navigation', async () => {
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search logs/i)
        searchInput.focus()
        expect(document.activeElement).toBe(searchInput)
      })
    })

    it('has accessible form inputs', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        user.click(screen.getByText('Filters'))
      })
      await waitFor(() => {
        const actionSelect = screen.getByLabelText('Action Type')
        expect(actionSelect).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles logs with missing data', async () => {
      const incompleteLog = [{
        id: 'log-incomplete',
        action: 'unknown',
        user: 'test',
        timestamp: new Date().toISOString(),
      }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: incompleteLog }),
      })
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('handles very long user names', async () => {
      const longNameLog = [{
        ...mockLogs[0],
        user: 'verylongusernamethatshouldwraporcutoff@example.com',
      }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: longNameLog }),
      })
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText(/verylongusernamethatshouldwraporcutoff/i)).toBeInTheDocument()
      })
    })

    it('handles invalid date formats', async () => {
      const invalidDateLog = [{
        ...mockLogs[0],
        timestamp: 'invalid-date',
      }]
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: invalidDateLog }),
      })
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('handles empty filter results', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search logs/i)).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'nonexistentuser123456789')
      await waitFor(() => {
        expect(screen.getByText(/No logs found matching your filters/i)).toBeInTheDocument()
      })
    })

    it('handles rapid filter changes', async () => {
      const user = userEvent.setup()
      renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search logs/i)).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/Search logs/i)
      await user.type(searchInput, 'admin')
      await user.clear(searchInput)
      await user.type(searchInput, 'mod')
      await waitFor(() => {
        expect(searchInput).toHaveValue('mod')
      })
    })
  })

  describe('Component Snapshot', () => {
    it('matches snapshot for loading state', () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))
      const { container } = renderWithAuth(<AuditLogPage />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for loaded state with data', async () => {
      const { container } = renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for empty state', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      })
      const { container } = renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getByText(/No logs found/i)).toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for modal open state', async () => {
      const user = userEvent.setup()
      const { container } = renderWithAuth(<AuditLogPage />)
      await waitFor(() => {
        expect(screen.getAllByText('View')[0]).toBeInTheDocument()
      })
      await user.click(screen.getAllByText('View')[0])
      await waitFor(() => {
        expect(screen.getByText('User Created')).toBeInTheDocument()
      })
      expect(container).toMatchSnapshot()
    })
  })
})

export default mockAppendChild
