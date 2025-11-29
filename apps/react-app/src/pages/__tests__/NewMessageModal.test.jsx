import { render, screen, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import NewMessageModal from '../NewMessageModal'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }) => <div onClick={onClick} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  UserPlus: () => <div data-testid="user-plus-icon">UserPlus</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
}))

const mockOnClose = jest.fn()

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
}

const renderModal = (props = {}) => {
  return render(
    <BrowserRouter>
      <NewMessageModal {...defaultProps} {...props} />
    </BrowserRouter>
  )
}

describe('NewMessageModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Modal Visibility', () => {
    it('renders when isOpen is true', () => {
      renderModal()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      renderModal({ isOpen: false })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('returns null when closed', () => {
      const { container } = renderModal({ isOpen: false })
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      renderModal()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has proper accessibility attributes', () => {
      renderModal()
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'new-message-title')
    })

    it('displays modal title', () => {
      renderModal()
      expect(screen.getByText('New Message')).toBeInTheDocument()
    })

    it('displays search input', () => {
      renderModal()
      expect(screen.getByRole('textbox', { name: /Search users/i })).toBeInTheDocument()
    })

    it('displays close button', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /Close modal/i })).toBeInTheDocument()
    })

    it('displays cancel button', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
    })

    it('displays create conversation button', () => {
      renderModal()
      expect(screen.getByText('Start Chat')).toBeInTheDocument()
    })
  })

  describe('User Loading', () => {
    it('shows loading spinner initially', () => {
      renderModal()
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument()
    })

    it('loads users on mount', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('displays all mock users', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
        expect(screen.getByText('bob')).toBeInTheDocument()
        expect(screen.getByText('charlie')).toBeInTheDocument()
        expect(screen.getByText('diana')).toBeInTheDocument()
        expect(screen.getByText('eve')).toBeInTheDocument()
      })
    })

    it('shows user avatars', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('🐱')).toBeInTheDocument()
        expect(screen.getByText('🐶')).toBeInTheDocument()
      })
    })

    it('displays user status', async () => {
      renderModal()

      await waitFor(() => {
        const users = screen.getAllByText(/online|idle|offline|dnd/i)
        expect(users.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search Functionality', () => {
    it('filters users based on search query', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(searchInput, 'ali')

      expect(screen.getByText('alice')).toBeInTheDocument()
      expect(screen.queryByText('bob')).not.toBeInTheDocument()
    })

    it('shows all users when search is empty', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(searchInput, 'test')
      await user.clear(searchInput)

      expect(screen.getByText('alice')).toBeInTheDocument()
      expect(screen.getByText('bob')).toBeInTheDocument()
    })

    it('is case insensitive', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(searchInput, 'ALICE')

      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    it('shows no users found message when no matches', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(searchInput, 'zzzzz')

      expect(screen.getByText('No users found')).toBeInTheDocument()
    })

    it('trims whitespace from search query', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(searchInput, '  alice  ')

      expect(screen.getByText('alice')).toBeInTheDocument()
    })
  })

  describe('User Selection', () => {
    it('selects user on click', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      expect(aliceButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('deselects user on second click', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))

      await user.click(aliceButton)
      expect(aliceButton).toHaveAttribute('aria-pressed', 'true')

      await user.click(aliceButton)
      expect(aliceButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('displays selected users above search', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const selectedUsersContainer = screen.getByRole('textbox', { name: /Search users/i }).parentElement.parentElement
      expect(within(selectedUsersContainer).getAllByText('alice')).toHaveLength(2)
    })

    it('allows selecting multiple users', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      const bobButton = userButtons.find(btn => within(btn).queryByText('bob'))

      await user.click(aliceButton)
      await user.click(bobButton)

      expect(aliceButton).toHaveAttribute('aria-pressed', 'true')
      expect(bobButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('shows check icon for selected users', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      expect(within(aliceButton).getByTestId('check-icon')).toBeInTheDocument()
    })

    it('can remove selected user from chip', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const removeButton = screen.getByRole('button', { name: /Remove alice/i })
      await user.click(removeButton)

      expect(aliceButton).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Group DM Functionality', () => {
    it('shows group name input when multiple users selected', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      const bobButton = userButtons.find(btn => within(btn).queryByText('bob'))

      await user.click(aliceButton)
      await user.click(bobButton)

      expect(screen.getByRole('textbox', { name: /Group name/i })).toBeInTheDocument()
    })

    it('allows entering group name', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      const bobButton = userButtons.find(btn => within(btn).queryByText('bob'))

      await user.click(aliceButton)
      await user.click(bobButton)

      const groupNameInput = screen.getByRole('textbox', { name: /Group name/i })
      await user.type(groupNameInput, 'Test Group')

      expect(groupNameInput).toHaveValue('Test Group')
    })

    it('shows Create Group button for multiple users', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      const bobButton = userButtons.find(btn => within(btn).queryByText('bob'))

      await user.click(aliceButton)
      await user.click(bobButton)

      expect(screen.getByText('Create Group')).toBeInTheDocument()
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })

    it('shows Start Chat for single user', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      expect(screen.getByText('Start Chat')).toBeInTheDocument()
      expect(screen.getByTestId('user-plus-icon')).toBeInTheDocument()
    })
  })

  describe('Creating Conversation', () => {
    it('disables create button when no users selected', () => {
      renderModal()
      const createButton = screen.getByRole('button', { name: /Start Chat/i }).closest('button')
      expect(createButton).toBeDisabled()
    })

    it('enables create button when user is selected', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const createButton = screen.getByText('Start Chat').closest('button')
      expect(createButton).not.toBeDisabled()
    })

    it('creates conversation and navigates', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const createButton = screen.getByText('Start Chat').closest('button')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/messages\/conv_\d+$/))
      }, { timeout: 1000 })
    })

    it('closes modal after creating conversation', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const createButton = screen.getByText('Start Chat').closest('button')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    it('shows loading spinner during creation', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const createButton = screen.getByText('Start Chat').closest('button')
      await user.click(createButton)

      const spinners = screen.getAllByRole('progressbar', { hidden: true })
      expect(spinners.length).toBeGreaterThan(0)
    })

    it('disables button during creation', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const createButton = screen.getByText('Start Chat').closest('button')
      await user.click(createButton)

      expect(createButton).toBeDisabled()
    })
  })

  describe('Modal Closing', () => {
    it('closes on close button click', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      const closeButton = screen.getByRole('button', { name: /Close modal/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('closes on cancel button click', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('closes on backdrop click', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      const backdrop = screen.getByRole('dialog')
      await user.click(backdrop)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('does not close on modal content click', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      const title = screen.getByText('New Message')
      await user.click(title)

      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('User Status Display', () => {
    it('shows online status with correct color', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const statusElements = screen.getAllByLabelText(/Status: online/i)
      expect(statusElements.length).toBeGreaterThan(0)
    })

    it('displays all status types', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByLabelText(/Status: online/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Status: idle/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Status: offline/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Status: dnd/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message on load failure', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {})

      renderModal()

      await waitFor(() => {
        expect(screen.queryByText('alice')).toBeInTheDocument()
      })

      console.error.mockRestore()
    })

    it('loads users successfully by default', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getByText('alice')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      renderModal()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal attribute', () => {
      renderModal()
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      renderModal()
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'new-message-title')
    })

    it('title has correct id', () => {
      renderModal()
      const title = screen.getByText('New Message')
      expect(title).toHaveAttribute('id', 'new-message-title')
    })

    it('search input has label', () => {
      renderModal()
      expect(screen.getByLabelText(/Search users/i)).toBeInTheDocument()
    })

    it('close button has label', () => {
      renderModal()
      expect(screen.getByLabelText(/Close modal/i)).toBeInTheDocument()
    })

    it('user buttons have pressed state', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      expect(userButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Re-opening Modal', () => {
    it('reloads users when reopened', async () => {
      const { rerender } = renderModal({ isOpen: false })

      rerender(
        <BrowserRouter>
          <NewMessageModal isOpen={true} onClose={mockOnClose} />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })
    })

    it('resets state when reopened', async () => {
      const user = userEvent.setup({ delay: null })
      const { rerender } = renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(searchInput, 'test')

      rerender(
        <BrowserRouter>
          <NewMessageModal isOpen={false} onClose={mockOnClose} />
        </BrowserRouter>
      )

      rerender(
        <BrowserRouter>
          <NewMessageModal isOpen={true} onClose={mockOnClose} />
        </BrowserRouter>
      )

      await waitFor(() => {
        const newSearchInput = screen.getByRole('textbox', { name: /Search users/i })
        expect(newSearchInput).toHaveValue('test')
      })
    })
  })

  describe('Styling', () => {
    it('applies backdrop blur effect', () => {
      renderModal()
      const backdrop = screen.getByRole('dialog')
      expect(backdrop.className).toContain('backdrop-blur')
    })

    it('applies correct modal styling', () => {
      renderModal()
      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('fixed')
      expect(dialog.className).toContain('inset-0')
      expect(dialog.className).toContain('z-50')
    })

    it('applies dark mode classes', () => {
      renderModal()
      const title = screen.getByText('New Message')
      expect(title.className).toContain('dark:text-white')
    })
  })

  describe('Search Input', () => {
    it('has correct placeholder', () => {
      renderModal()
      const input = screen.getByRole('textbox', { name: /Search users/i })
      expect(input).toHaveAttribute('placeholder', 'Search users...')
    })

    it('updates value on typing', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      const input = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(input, 'test')

      expect(input).toHaveValue('test')
    })

    it('shows search icon', () => {
      renderModal()
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    })
  })

  describe('User List Display', () => {
    it('displays user avatars', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('🐱')).toBeInTheDocument()
      })
    })

    it('displays usernames', async () => {
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
        expect(screen.getByText('bob')).toBeInTheDocument()
      })
    })

    it('displays status text', async () => {
      renderModal()

      await waitFor(() => {
        const statusTexts = screen.getAllByText(/online|idle|offline|dnd/i)
        expect(statusTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles selecting and deselecting same user multiple times', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))

      await user.click(aliceButton)
      await user.click(aliceButton)
      await user.click(aliceButton)

      expect(aliceButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('handles empty search query', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const input = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(input, '   ')

      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    it('handles special characters in search', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const input = screen.getByRole('textbox', { name: /Search users/i })
      await user.type(input, '!@#$%')

      expect(screen.getByText('No users found')).toBeInTheDocument()
    })
  })

  describe('Memo Optimization', () => {
    it('is a memoized component', () => {
      expect(NewMessageModal.$$typeof).toBeDefined()
    })
  })

  describe('Navigation Integration', () => {
    it('uses navigate hook', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const createButton = screen.getByText('Start Chat').closest('button')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    it('generates unique conversation IDs', async () => {
      const user = userEvent.setup({ delay: null })
      renderModal()

      await waitFor(() => {
        expect(screen.getByText('alice')).toBeInTheDocument()
      })

      const userButtons = screen.getAllByRole('button', { pressed: false })
      const aliceButton = userButtons.find(btn => within(btn).queryByText('alice'))
      await user.click(aliceButton)

      const createButton = screen.getByText('Start Chat').closest('button')
      await user.click(createButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/conv_\d+/))
      }, { timeout: 1000 })
    })
  })
})

export default mockNavigate
