import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServerSettingsModal from './ServerSettingsModal'
import serverService from '../../services/serverService'

jest.mock('../../services/serverService')

describe('ServerSettingsModal', () => {
  const mockServer = {
    id: 'server-123',
    name: 'Test Server',
    description: 'Test Description',
    isPublic: true,
    icon: 'https://example.com/icon.png',
    banner: 'https://example.com/banner.png',
    members: [
      {
        id: 'member-1',
        role: 'OWNER',
        user: {
          id: 'user-1',
          username: 'owner',
          displayName: 'Server Owner',
          avatar: 'https://example.com/avatar1.png'
        }
      },
      {
        id: 'member-2',
        role: 'ADMIN',
        user: {
          id: 'user-2',
          username: 'admin',
          displayName: 'Admin User',
          avatar: null
        }
      },
      {
        id: 'member-3',
        role: 'MEMBER',
        user: {
          id: 'user-3',
          username: 'member',
          displayName: null,
          avatar: null
        }
      }
    ]
  }

  const mockOnClose = jest.fn()
  const mockOnUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
    window.confirm = jest.fn(() => true)
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve())
      }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Modal Rendering', () => {
    it('renders without crashing', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Server Settings')).toBeInTheDocument()
    })

    it('renders modal backdrop', () => {
      const { container } = render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50')
      expect(backdrop).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const closeButton = screen.getByRole('button', { name: '' })
      expect(closeButton).toBeInTheDocument()
    })

    it('closes modal when close button is clicked', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const closeButton = screen.getAllByRole('button')[0]
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('renders all tab buttons', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('General')).toBeInTheDocument()
      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('Moderation')).toBeInTheDocument()
    })

    it('renders footer with Cancel button', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('renders Save Changes button only on general tab', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    it('does not render Save Changes button on members tab', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('defaults to general tab', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const generalTab = screen.getByText('General').closest('button')
      expect(generalTab).toHaveClass('bg-primary')
    })

    it('switches to members tab when clicked', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const membersTab = screen.getByText('Members').closest('button')
      expect(membersTab).toHaveClass('bg-primary')
    })

    it('switches to moderation tab when clicked', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      const moderationTab = screen.getByText('Moderation').closest('button')
      expect(moderationTab).toHaveClass('bg-primary')
    })

    it('renders correct content for general tab', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Server Name')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('renders correct content for members tab', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText(/Server Members/)).toBeInTheDocument()
    })

    it('renders correct content for moderation tab', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Moderation Tools')).toBeInTheDocument()
    })

    it('applies active styling to selected tab', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const activeTab = screen.getByText('Members').closest('button')
      const inactiveTab = screen.getByText('General').closest('button')
      expect(activeTab).toHaveClass('bg-primary')
      expect(inactiveTab).not.toHaveClass('bg-primary')
    })
  })

  describe('General Tab - Server Name', () => {
    it('displays current server name', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const nameInput = screen.getByDisplayValue('Test Server')
      expect(nameInput).toBeInTheDocument()
    })

    it('updates server name on input change', async () => {
      const user = userEvent.setup()
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const nameInput = screen.getByDisplayValue('Test Server')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Server Name')
      expect(nameInput).toHaveValue('New Server Name')
    })

    it('enforces max length of 50 characters for server name', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const nameInput = screen.getByDisplayValue('Test Server')
      expect(nameInput).toHaveAttribute('maxLength', '50')
    })

    it('clears error when name is changed', async () => {
      const user = userEvent.setup()
      serverService.updateServer.mockResolvedValueOnce({
        success: false,
        error: 'Server name is required'
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByDisplayValue('Test Server')
      await user.clear(nameInput)
      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Server name is required')).toBeInTheDocument()
      })

      await user.type(nameInput, 'New Name')
      expect(screen.queryByText('Server name is required')).not.toBeInTheDocument()
    })
  })

  describe('General Tab - Description', () => {
    it('displays current server description', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const descriptionInput = screen.getByDisplayValue('Test Description')
      expect(descriptionInput).toBeInTheDocument()
    })

    it('updates description on input change', async () => {
      const user = userEvent.setup()
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const descriptionInput = screen.getByDisplayValue('Test Description')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'New description')
      expect(descriptionInput).toHaveValue('New description')
    })

    it('enforces max length of 200 characters for description', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const descriptionInput = screen.getByDisplayValue('Test Description')
      expect(descriptionInput).toHaveAttribute('maxLength', '200')
    })

    it('handles empty description', () => {
      const serverWithoutDescription = { ...mockServer, description: '' }
      render(
        <ServerSettingsModal
          server={serverWithoutDescription}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const descriptionInput = screen.getByRole('textbox', { name: '' })
      expect(descriptionInput).toHaveValue('')
    })
  })

  describe('General Tab - Server Icon', () => {
    it('displays current server icon', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const iconImage = screen.getByAltText('Server icon')
      expect(iconImage).toHaveAttribute('src', mockServer.icon)
    })

    it('shows upload button for server icon', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Change Icon')).toBeInTheDocument()
    })

    it('handles icon file upload', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const file = new File(['icon'], 'icon.png', { type: 'image/png' })
      const input = screen.getAllByRole('button', { hidden: true })[0].closest('div').querySelector('input[type="file"]')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)
      })
    })

    it('validates file size for icon (max 5MB)', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

      const input = screen.getAllByRole('button', { hidden: true })[0].closest('div').querySelector('input[type="file"]')
      fireEvent.change(input, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByText('icon must be less than 5MB')).toBeInTheDocument()
      })
    })

    it('validates file type for icon (must be image)', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const textFile = new File(['text'], 'file.txt', { type: 'text/plain' })
      const input = screen.getAllByRole('button', { hidden: true })[0].closest('div').querySelector('input[type="file"]')

      fireEvent.change(input, { target: { files: [textFile] } })

      await waitFor(() => {
        expect(screen.getByText('icon must be an image')).toBeInTheDocument()
      })
    })

    it('creates preview URL for uploaded icon', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const file = new File(['icon'], 'icon.png', { type: 'image/png' })
      const input = screen.getAllByRole('button', { hidden: true })[0].closest('div').querySelector('input[type="file"]')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it('revokes old icon URL when new icon is uploaded', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const file1 = new File(['icon1'], 'icon1.png', { type: 'image/png' })
      const file2 = new File(['icon2'], 'icon2.png', { type: 'image/png' })
      const input = screen.getAllByRole('button', { hidden: true })[0].closest('div').querySelector('input[type="file"]')

      global.URL.createObjectURL.mockReturnValueOnce('blob:url1')
      fireEvent.change(input, { target: { files: [file1] } })

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file1)
      })

      global.URL.createObjectURL.mockReturnValueOnce('blob:url2')
      fireEvent.change(input, { target: { files: [file2] } })

      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url1')
      })
    })

    it('handles missing icon gracefully', () => {
      const serverWithoutIcon = { ...mockServer, icon: null }
      render(
        <ServerSettingsModal
          server={serverWithoutIcon}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.queryByAltText('Server icon')).not.toBeInTheDocument()
    })
  })

  describe('General Tab - Server Banner', () => {
    it('displays current server banner', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const bannerImage = screen.getByAltText('Server banner')
      expect(bannerImage).toHaveAttribute('src', mockServer.banner)
    })

    it('shows upload area for server banner', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Server Banner')).toBeInTheDocument()
    })

    it('handles banner file upload', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const file = new File(['banner'], 'banner.png', { type: 'image/png' })
      const inputs = document.querySelectorAll('input[type="file"]')
      const bannerInput = inputs[1]

      fireEvent.change(bannerInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)
      })
    })

    it('validates file size for banner (max 5MB)', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

      const inputs = document.querySelectorAll('input[type="file"]')
      const bannerInput = inputs[1]
      fireEvent.change(bannerInput, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(screen.getByText('banner must be less than 5MB')).toBeInTheDocument()
      })
    })

    it('validates file type for banner (must be image)', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const textFile = new File(['text'], 'file.txt', { type: 'text/plain' })
      const inputs = document.querySelectorAll('input[type="file"]')
      const bannerInput = inputs[1]

      fireEvent.change(bannerInput, { target: { files: [textFile] } })

      await waitFor(() => {
        expect(screen.getByText('banner must be an image')).toBeInTheDocument()
      })
    })

    it('creates preview URL for uploaded banner', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const file = new File(['banner'], 'banner.png', { type: 'image/png' })
      const inputs = document.querySelectorAll('input[type="file"]')
      const bannerInput = inputs[1]

      fireEvent.change(bannerInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it('revokes old banner URL when new banner is uploaded', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const file1 = new File(['banner1'], 'banner1.png', { type: 'image/png' })
      const file2 = new File(['banner2'], 'banner2.png', { type: 'image/png' })
      const inputs = document.querySelectorAll('input[type="file"]')
      const bannerInput = inputs[1]

      global.URL.createObjectURL.mockReturnValueOnce('blob:banner1')
      fireEvent.change(bannerInput, { target: { files: [file1] } })

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file1)
      })

      global.URL.createObjectURL.mockReturnValueOnce('blob:banner2')
      fireEvent.change(bannerInput, { target: { files: [file2] } })

      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:banner1')
      })
    })

    it('shows placeholder when no banner is set', () => {
      const serverWithoutBanner = { ...mockServer, banner: null }
      render(
        <ServerSettingsModal
          server={serverWithoutBanner}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Click to upload banner')).toBeInTheDocument()
    })
  })

  describe('General Tab - Public Server Toggle', () => {
    it('displays public server checkbox', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Public Server')).toBeInTheDocument()
    })

    it('shows checked state when server is public', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const checkbox = screen.getByRole('checkbox', { name: /Public Server/i })
      expect(checkbox).toBeChecked()
    })

    it('shows unchecked state when server is private', () => {
      const privateServer = { ...mockServer, isPublic: false }
      render(
        <ServerSettingsModal
          server={privateServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const checkbox = screen.getByRole('checkbox', { name: /Public Server/i })
      expect(checkbox).not.toBeChecked()
    })

    it('toggles public server state', async () => {
      const user = userEvent.setup()
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const checkbox = screen.getByRole('checkbox', { name: /Public Server/i })
      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })

    it('shows description for public server setting', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Anyone can find and join this server')).toBeInTheDocument()
    })
  })

  describe('General Tab - Danger Zone', () => {
    it('renders danger zone section', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Danger Zone')).toBeInTheDocument()
    })

    it('renders delete server button', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('shows delete server warning message', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      expect(screen.getByText('Once deleted, this server cannot be recovered')).toBeInTheDocument()
    })

    it('prompts confirmation before deleting server', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "Test Server"? This action cannot be undone.'
      )
    })

    it('cancels deletion when user declines confirmation', async () => {
      window.confirm.mockReturnValueOnce(false)
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)
      expect(serverService.deleteServer).not.toHaveBeenCalled()
    })

    it('deletes server when user confirms', async () => {
      serverService.deleteServer.mockResolvedValueOnce({ success: true })
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(serverService.deleteServer).toHaveBeenCalledWith(mockServer.id)
      })
    })

    it('calls onUpdate with null after successful deletion', async () => {
      serverService.deleteServer.mockResolvedValueOnce({ success: true })
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(null)
      })
    })

    it('closes modal after successful deletion', async () => {
      serverService.deleteServer.mockResolvedValueOnce({ success: true })
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('shows error message on failed deletion', async () => {
      serverService.deleteServer.mockResolvedValueOnce({
        success: false,
        error: 'Failed to delete server'
      })
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to delete server')).toBeInTheDocument()
      })
    })

    it('handles deletion error from exception', async () => {
      serverService.deleteServer.mockRejectedValueOnce(new Error('Network error'))
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const deleteButton = screen.getByText('Delete')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to delete server')).toBeInTheDocument()
      })
    })
  })

  describe('Members Tab', () => {
    it('displays member count', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('Server Members (3)')).toBeInTheDocument()
    })

    it('renders all server members', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('Server Owner')).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('@member')).toBeInTheDocument()
    })

    it('displays member avatars when available', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const avatarImages = screen.getAllByRole('img')
      expect(avatarImages.some(img => img.src.includes('avatar1.png'))).toBe(true)
    })

    it('displays member initials when no avatar', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('M')).toBeInTheDocument()
    })

    it('displays member usernames', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('@owner')).toBeInTheDocument()
      expect(screen.getByText('@admin')).toBeInTheDocument()
      expect(screen.getByText('@member')).toBeInTheDocument()
    })

    it('displays member roles', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('OWNER')).toBeInTheDocument()
      expect(screen.getByText('ADMIN')).toBeInTheDocument()
      expect(screen.getByText('MEMBER')).toBeInTheDocument()
    })

    it('does not show remove button for owner', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const ownerCard = screen.getByText('OWNER').closest('div')
      expect(ownerCard.querySelector('button')).toBeNull()
    })

    it('shows remove button for non-owner members', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const removeButtons = screen.getAllByText('Remove')
      expect(removeButtons.length).toBe(2)
    })

    it('prompts confirmation before removing member', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])
      expect(window.confirm).toHaveBeenCalledWith('Remove admin from the server?')
    })

    it('removes member when confirmed', async () => {
      serverService.kickMember.mockResolvedValueOnce({ success: true })
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(serverService.kickMember).toHaveBeenCalledWith(
          mockServer.id,
          'member-2',
          'Removed from server'
        )
      })
    })

    it('shows success message after removing member', async () => {
      serverService.kickMember.mockResolvedValueOnce({ success: true })
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(screen.getByText('admin has been removed')).toBeInTheDocument()
      })
    })

    it('shows error when member removal fails', async () => {
      serverService.kickMember.mockResolvedValueOnce({
        success: false,
        error: 'Cannot remove member'
      })
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Cannot remove member')).toBeInTheDocument()
      })
    })

    it('handles member removal exception', async () => {
      serverService.kickMember.mockRejectedValueOnce(new Error('Network error'))
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Failed to remove member')).toBeInTheDocument()
      })
    })

    it('shows empty state when no members', () => {
      const serverWithoutMembers = { ...mockServer, members: [] }
      render(
        <ServerSettingsModal
          server={serverWithoutMembers}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('No members found')).toBeInTheDocument()
    })

    it('displays invite members section', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('Invite Members')).toBeInTheDocument()
    })

    it('displays server ID in invite section', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const serverIdInput = screen.getByDisplayValue(mockServer.id)
      expect(serverIdInput).toBeInTheDocument()
      expect(serverIdInput).toHaveAttribute('readOnly')
    })

    it('copies server ID to clipboard', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const copyButton = screen.getByText('Copy ID')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockServer.id)
      })
    })

    it('shows success message after copying server ID', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      const copyButton = screen.getByText('Copy ID')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Server ID copied to clipboard!')).toBeInTheDocument()
      })
    })
  })

  describe('Moderation Tab', () => {
    it('renders moderation tools heading', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Moderation Tools')).toBeInTheDocument()
    })

    it('displays auto-moderation section', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Auto-Moderation')).toBeInTheDocument()
    })

    it('renders profanity filter option', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Profanity Filter')).toBeInTheDocument()
      expect(screen.getByText('Block messages containing profanity')).toBeInTheDocument()
    })

    it('renders spam detection option', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Spam Detection')).toBeInTheDocument()
      expect(screen.getByText('Automatically detect and remove spam')).toBeInTheDocument()
    })

    it('renders link filtering option', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Link Filtering')).toBeInTheDocument()
      expect(screen.getByText('Restrict external links')).toBeInTheDocument()
    })

    it('displays banned words section', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Banned Words')).toBeInTheDocument()
    })

    it('renders banned words input', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByPlaceholderText('Enter word to ban...')).toBeInTheDocument()
    })

    it('renders add word button', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Add Word')).toBeInTheDocument()
    })

    it('displays slow mode section', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Slow Mode')).toBeInTheDocument()
    })

    it('renders slow mode dropdown', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('renders slow mode options', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Off')).toBeInTheDocument()
      expect(screen.getByText('5 seconds')).toBeInTheDocument()
      expect(screen.getByText('10 seconds')).toBeInTheDocument()
      expect(screen.getByText('30 seconds')).toBeInTheDocument()
      expect(screen.getByText('1 minute')).toBeInTheDocument()
      expect(screen.getByText('5 minutes')).toBeInTheDocument()
    })

    it('renders save moderation settings button', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      expect(screen.getByText('Save Moderation Settings')).toBeInTheDocument()
    })

    it('shows success message when saving moderation settings', async () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Moderation'))
      const saveButton = screen.getByText('Save Moderation Settings')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Moderation settings saved!')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('validates required server name on save', async () => {
      const user = userEvent.setup()
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByDisplayValue('Test Server')
      await user.clear(nameInput)
      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Server name is required')).toBeInTheDocument()
      })
    })

    it('validates server name is not just whitespace', async () => {
      const user = userEvent.setup()
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByDisplayValue('Test Server')
      await user.clear(nameInput)
      await user.type(nameInput, '   ')
      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Server name is required')).toBeInTheDocument()
      })
    })

    it('does not save when validation fails', async () => {
      const user = userEvent.setup()
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const nameInput = screen.getByDisplayValue('Test Server')
      await user.clear(nameInput)
      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(serverService.updateServer).not.toHaveBeenCalled()
      })
    })
  })

  describe('Save Changes', () => {
    it('saves server settings successfully', async () => {
      serverService.updateServer.mockResolvedValueOnce({
        success: true,
        server: { ...mockServer, name: 'Updated Server' }
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(serverService.updateServer).toHaveBeenCalledWith(
          mockServer.id,
          expect.objectContaining({
            name: mockServer.name,
            description: mockServer.description,
            isPublic: mockServer.isPublic
          })
        )
      })
    })

    it('shows success message after successful save', async () => {
      serverService.updateServer.mockResolvedValueOnce({
        success: true,
        server: mockServer
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Server updated successfully')).toBeInTheDocument()
      })
    })

    it('calls onUpdate with updated server data', async () => {
      const updatedServer = { ...mockServer, name: 'Updated Server' }
      serverService.updateServer.mockResolvedValueOnce({
        success: true,
        server: updatedServer
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(updatedServer)
      })
    })

    it('closes modal after successful save', async () => {
      jest.useFakeTimers()
      serverService.updateServer.mockResolvedValueOnce({
        success: true,
        server: mockServer
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Server updated successfully')).toBeInTheDocument()
      })

      jest.advanceTimersByTime(1500)

      expect(mockOnClose).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('shows error message on failed save', async () => {
      serverService.updateServer.mockResolvedValueOnce({
        success: false,
        error: 'Server name already exists'
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Server name already exists')).toBeInTheDocument()
      })
    })

    it('handles save exception', async () => {
      serverService.updateServer.mockRejectedValueOnce(new Error('Network error'))

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Failed to update server')).toBeInTheDocument()
      })
    })

    it('includes uploaded files in save request', async () => {
      serverService.updateServer.mockResolvedValueOnce({
        success: true,
        server: mockServer
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const iconFile = new File(['icon'], 'icon.png', { type: 'image/png' })
      const inputs = document.querySelectorAll('input[type="file"]')
      fireEvent.change(inputs[0], { target: { files: [iconFile] } })

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(serverService.updateServer).toHaveBeenCalledWith(
          mockServer.id,
          expect.objectContaining({
            icon: iconFile
          })
        )
      })
    })

    it('clears success message when making changes', async () => {
      const user = userEvent.setup()
      serverService.updateServer.mockResolvedValueOnce({
        success: true,
        server: mockServer
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Server updated successfully')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue(mockServer.name)
      await user.type(nameInput, 'X')

      expect(screen.queryByText('Server updated successfully')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('shows loading state when saving', async () => {
      serverService.updateServer.mockImplementation(() => new Promise(() => {}))

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes').closest('button')
        expect(saveButton).toHaveAttribute('loading')
      })
    })

    it('disables cancel button while saving', async () => {
      serverService.updateServer.mockImplementation(() => new Promise(() => {}))

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel')
        expect(cancelButton).toBeDisabled()
      })
    })

    it('shows loading state when deleting server', async () => {
      serverService.deleteServer.mockImplementation(() => new Promise(() => {}))

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Delete'))

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete').closest('button')
        expect(deleteButton).toHaveAttribute('loading')
      })
    })

    it('shows loading state when removing member', async () => {
      serverService.kickMember.mockImplementation(() => new Promise(() => {}))

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Members'))
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        expect(serverService.kickMember).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error messages in error state', async () => {
      serverService.updateServer.mockResolvedValueOnce({
        success: false,
        error: 'Custom error message'
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        const errorElement = screen.getByText('Custom error message')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement.closest('div')).toHaveClass('bg-error/10')
      })
    })

    it('displays success messages in success state', async () => {
      serverService.updateServer.mockResolvedValueOnce({
        success: true,
        server: mockServer
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        const successElement = screen.getByText('Server updated successfully')
        expect(successElement).toBeInTheDocument()
        expect(successElement.closest('div')).toHaveClass('bg-success/10')
      })
    })

    it('clears error when user makes changes', async () => {
      const user = userEvent.setup()
      serverService.updateServer.mockResolvedValueOnce({
        success: false,
        error: 'Error message'
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue(mockServer.name)
      await user.type(nameInput, 'X')

      expect(screen.queryByText('Error message')).not.toBeInTheDocument()
    })

    it('handles network errors gracefully', async () => {
      serverService.updateServer.mockRejectedValueOnce(new Error('Network error'))

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Failed to update server')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Memory Management', () => {
    it('revokes object URLs on unmount', () => {
      const { unmount } = render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const file = new File(['icon'], 'icon.png', { type: 'image/png' })
      const input = document.querySelectorAll('input[type="file"]')[0]

      global.URL.createObjectURL.mockReturnValue('blob:test-url')
      fireEvent.change(input, { target: { files: [file] } })

      unmount()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    })

    it('does not revoke non-blob URLs on unmount', () => {
      const { unmount } = render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      unmount()

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalledWith(mockServer.icon)
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalledWith(mockServer.banner)
    })

    it('only revokes blob URLs on unmount', () => {
      global.URL.revokeObjectURL.mockClear()

      const { unmount } = render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const file = new File(['icon'], 'icon.png', { type: 'image/png' })
      const input = document.querySelectorAll('input[type="file"]')[0]

      global.URL.createObjectURL.mockReturnValue('blob:test-url')
      fireEvent.change(input, { target: { files: [file] } })

      unmount()

      const revokeCallsForBlobUrls = global.URL.revokeObjectURL.mock.calls.filter(
        call => call[0] && call[0].startsWith('blob:')
      )
      expect(revokeCallsForBlobUrls.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles server without name gracefully', () => {
      const serverWithoutName = { ...mockServer, name: '' }
      render(
        <ServerSettingsModal
          server={serverWithoutName}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const nameInput = screen.getByRole('textbox', { name: '' })
      expect(nameInput).toHaveValue('')
    })

    it('handles undefined server members', () => {
      const serverWithoutMembers = { ...mockServer, members: undefined }
      render(
        <ServerSettingsModal
          server={serverWithoutMembers}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('Server Members (0)')).toBeInTheDocument()
    })

    it('handles file upload with no file selected', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      const input = document.querySelectorAll('input[type="file"]')[0]
      fireEvent.change(input, { target: { files: [] } })

      expect(global.URL.createObjectURL).not.toHaveBeenCalled()
    })

    it('defaults isPublic to true when undefined', () => {
      const serverWithoutIsPublic = { ...mockServer }
      delete serverWithoutIsPublic.isPublic
      render(
        <ServerSettingsModal
          server={serverWithoutIsPublic}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      const checkbox = screen.getByRole('checkbox', { name: /Public Server/i })
      expect(checkbox).toBeChecked()
    })

    it('handles API returning undefined error', async () => {
      serverService.updateServer.mockResolvedValueOnce({
        success: false,
        error: undefined
      })

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Failed to update server')).toBeInTheDocument()
      })
    })

    it('cancels member removal when user declines', () => {
      window.confirm.mockReturnValueOnce(false)

      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )

      fireEvent.click(screen.getByText('Members'))
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])

      expect(serverService.kickMember).not.toHaveBeenCalled()
    })

    it('handles member without display name', () => {
      render(
        <ServerSettingsModal
          server={mockServer}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      )
      fireEvent.click(screen.getByText('Members'))
      expect(screen.getByText('@member')).toBeInTheDocument()
    })
  })
})

export default mockServer
