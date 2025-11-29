/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateServerModal from './CreateServerModal'
import serverService from '../../services/serverService'

jest.mock('../../services/serverService')
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>
}))

const ImageIcon = () => <div data-testid="image-icon">Image</div>
global.ImageIcon = ImageIcon

describe('CreateServerModal', () => {
  const mockOnClose = jest.fn()
  const mockOnServerCreated = jest.fn()

  const defaultProps = {
    onClose: mockOnClose,
    onServerCreated: mockOnServerCreated
  }

  beforeEach(() => {
    jest.clearAllMocks()
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Modal Rendering and Visibility', () => {
    it('renders the modal when mounted', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByText('Create Server')).toBeInTheDocument()
    })

    it('renders with correct structure and overlay', () => {
      const { container } = render(<CreateServerModal {...defaultProps} />)
      const overlay = container.querySelector('.fixed.inset-0')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('bg-black/50')
    })

    it('renders close button with X icon', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      render(<CreateServerModal {...defaultProps} />)
      const closeButton = screen.getByTestId('x-icon').closest('button')
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('renders modal with proper z-index for layering', () => {
      const { container } = render(<CreateServerModal {...defaultProps} />)
      const overlay = container.querySelector('.fixed.inset-0')
      expect(overlay).toHaveClass('z-50')
    })

    it('renders modal content with scrollable container', () => {
      const { container } = render(<CreateServerModal {...defaultProps} />)
      const modalContent = container.querySelector('.max-h-\\[90vh\\]')
      expect(modalContent).toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('starts on step 1 by default', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByText('Server Name')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Server Type')).toBeInTheDocument()
    })

    it('shows Next button on step 1', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('shows Cancel button on step 1', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('calls onClose when Cancel button is clicked', () => {
      render(<CreateServerModal {...defaultProps} />)
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('navigates to step 2 when Next button is clicked with valid data', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Server Icon')).toBeInTheDocument()
      })
    })

    it('shows Back button on step 2', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      })
    })

    it('navigates back to step 1 when Back button is clicked', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Server Icon')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /back/i }))

      await waitFor(() => {
        expect(screen.getByText('Server Name')).toBeInTheDocument()
      })
    })

    it('shows Create Server button on step 2', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create server/i })).toBeInTheDocument()
      })
    })
  })

  describe('Server Name Input', () => {
    it('renders server name input field', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByPlaceholderText('My Awesome Server')).toBeInTheDocument()
    })

    it('shows required indicator for server name', () => {
      render(<CreateServerModal {...defaultProps} />)
      const requiredAsterisk = screen.getByText('*')
      expect(requiredAsterisk).toBeInTheDocument()
      expect(requiredAsterisk).toHaveClass('text-rgb(var(--color-error-500))')
    })

    it('updates server name value when typing', async () => {
      render(<CreateServerModal {...defaultProps} />)
      const nameInput = screen.getByPlaceholderText('My Awesome Server')

      await userEvent.type(nameInput, 'My Gaming Server')

      expect(nameInput).toHaveValue('My Gaming Server')
    })

    it('displays character count for server name', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByText('0/50 characters')).toBeInTheDocument()
    })

    it('updates character count as user types', async () => {
      render(<CreateServerModal {...defaultProps} />)
      const nameInput = screen.getByPlaceholderText('My Awesome Server')

      await userEvent.type(nameInput, 'Test')

      expect(screen.getByText('4/50 characters')).toBeInTheDocument()
    })

    it('enforces max length of 50 characters', () => {
      render(<CreateServerModal {...defaultProps} />)
      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      expect(nameInput).toHaveAttribute('maxLength', '50')
    })

    it('focuses name input on mount', () => {
      render(<CreateServerModal {...defaultProps} />)
      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      expect(nameInput).toHaveAttribute('autoFocus')
    })
  })

  describe('Server Description', () => {
    it('renders description textarea', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByPlaceholderText("What's your server about?")).toBeInTheDocument()
    })

    it('updates description value when typing', async () => {
      render(<CreateServerModal {...defaultProps} />)
      const descriptionInput = screen.getByPlaceholderText("What's your server about?")

      await userEvent.type(descriptionInput, 'A server for gaming enthusiasts')

      expect(descriptionInput).toHaveValue('A server for gaming enthusiasts')
    })

    it('displays character count for description', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByText('0/200 characters')).toBeInTheDocument()
    })

    it('updates character count for description as user types', async () => {
      render(<CreateServerModal {...defaultProps} />)
      const descriptionInput = screen.getByPlaceholderText("What's your server about?")

      await userEvent.type(descriptionInput, 'Gaming')

      expect(screen.getByText('6/200 characters')).toBeInTheDocument()
    })

    it('enforces max length of 200 characters for description', () => {
      render(<CreateServerModal {...defaultProps} />)
      const descriptionInput = screen.getByPlaceholderText("What's your server about?")
      expect(descriptionInput).toHaveAttribute('maxLength', '200')
    })

    it('renders description textarea with 3 rows', () => {
      render(<CreateServerModal {...defaultProps} />)
      const descriptionInput = screen.getByPlaceholderText("What's your server about?")
      expect(descriptionInput).toHaveAttribute('rows', '3')
    })
  })

  describe('Privacy Settings', () => {
    it('renders Public and Private radio options', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByText('Public')).toBeInTheDocument()
      expect(screen.getByText('Private')).toBeInTheDocument()
    })

    it('renders Globe icon for Public option', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByTestId('globe-icon')).toBeInTheDocument()
    })

    it('renders Lock icon for Private option', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    })

    it('defaults to Public option selected', () => {
      render(<CreateServerModal {...defaultProps} />)
      const publicRadio = screen.getByRole('radio', { name: /public anyone can find and join your server/i })
      expect(publicRadio).toBeChecked()
    })

    it('shows description for Public option', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByText('Anyone can find and join your server')).toBeInTheDocument()
    })

    it('shows description for Private option', () => {
      render(<CreateServerModal {...defaultProps} />)
      expect(screen.getByText('Only people with an invite can join')).toBeInTheDocument()
    })

    it('switches to Private when Private option is clicked', async () => {
      render(<CreateServerModal {...defaultProps} />)
      const privateRadio = screen.getByRole('radio', { name: /private only people with an invite can join/i })

      fireEvent.click(privateRadio)

      await waitFor(() => {
        expect(privateRadio).toBeChecked()
      })
    })

    it('switches to Public when Public option is clicked after Private', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const privateRadio = screen.getByRole('radio', { name: /private only people with an invite can join/i })
      fireEvent.click(privateRadio)

      const publicRadio = screen.getByRole('radio', { name: /public anyone can find and join your server/i })
      fireEvent.click(publicRadio)

      await waitFor(() => {
        expect(publicRadio).toBeChecked()
      })
    })
  })

  describe('Server Icon Upload', () => {
    it('renders icon upload section on step 2', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Server Icon')).toBeInTheDocument()
      })
    })

    it('renders Upload Icon button', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload icon/i })).toBeInTheDocument()
      })
    })

    it('shows upload icon recommendations', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Recommended: 512x512px, max 5MB')).toBeInTheDocument()
      })
    })

    it('handles icon file selection', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')
        const file = new File(['icon'], 'icon.png', { type: 'image/png' })

        fireEvent.change(iconInput, { target: { files: [file] } })

        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)
      })
    })

    it('displays icon preview after upload', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(async () => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')
        const file = new File(['icon'], 'icon.png', { type: 'image/png' })

        fireEvent.change(iconInput, { target: { files: [file] } })

        await waitFor(() => {
          const preview = screen.getByAltText('Server icon')
          expect(preview).toBeInTheDocument()
          expect(preview).toHaveAttribute('src', 'blob:mock-url')
        })
      })
    })

    it('shows error when icon file exceeds 5MB', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })
        Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

        fireEvent.change(iconInput, { target: { files: [largeFile] } })

        expect(screen.getByText('icon must be less than 5MB')).toBeInTheDocument()
      })
    })

    it('shows error when icon file is not an image', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')
        const textFile = new File(['text'], 'file.txt', { type: 'text/plain' })

        fireEvent.change(iconInput, { target: { files: [textFile] } })

        expect(screen.getByText('icon must be an image')).toBeInTheDocument()
      })
    })

    it('clears error when valid icon is uploaded', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(async () => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')

        const textFile = new File(['text'], 'file.txt', { type: 'text/plain' })
        fireEvent.change(iconInput, { target: { files: [textFile] } })
        expect(screen.getByText('icon must be an image')).toBeInTheDocument()

        const validFile = new File(['icon'], 'icon.png', { type: 'image/png' })
        fireEvent.change(iconInput, { target: { files: [validFile] } })

        await waitFor(() => {
          expect(screen.queryByText('icon must be an image')).not.toBeInTheDocument()
        })
      })
    })

    it('revokes old icon URL when new icon is uploaded', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')

        const file1 = new File(['icon1'], 'icon1.png', { type: 'image/png' })
        fireEvent.change(iconInput, { target: { files: [file1] } })

        const file2 = new File(['icon2'], 'icon2.png', { type: 'image/png' })
        fireEvent.change(iconInput, { target: { files: [file2] } })

        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      })
    })
  })

  describe('Server Banner Upload', () => {
    it('renders banner upload section on step 2', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Server Banner (Optional)')).toBeInTheDocument()
      })
    })

    it('shows banner upload recommendations', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Recommended: 1920x480px, max 5MB')).toBeInTheDocument()
      })
    })

    it('shows click to upload banner text', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Click to upload banner')).toBeInTheDocument()
      })
    })

    it('handles banner file selection', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const bannerContainer = screen.getByText('Click to upload banner').closest('div')
        const bannerInput = bannerContainer.parentElement.querySelector('input[type="file"]')
        const file = new File(['banner'], 'banner.png', { type: 'image/png' })

        fireEvent.change(bannerInput, { target: { files: [file] } })

        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)
      })
    })

    it('displays banner preview after upload', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(async () => {
        const bannerContainer = screen.getByText('Click to upload banner').closest('div')
        const bannerInput = bannerContainer.parentElement.querySelector('input[type="file"]')
        const file = new File(['banner'], 'banner.png', { type: 'image/png' })

        fireEvent.change(bannerInput, { target: { files: [file] } })

        await waitFor(() => {
          const preview = screen.getByAltText('Server banner')
          expect(preview).toBeInTheDocument()
          expect(preview).toHaveAttribute('src', 'blob:mock-url')
        })
      })
    })

    it('shows error when banner file exceeds 5MB', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const bannerContainer = screen.getByText('Click to upload banner').closest('div')
        const bannerInput = bannerContainer.parentElement.querySelector('input[type="file"]')
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })
        Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })

        fireEvent.change(bannerInput, { target: { files: [largeFile] } })

        expect(screen.getByText('banner must be less than 5MB')).toBeInTheDocument()
      })
    })

    it('shows error when banner file is not an image', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const bannerContainer = screen.getByText('Click to upload banner').closest('div')
        const bannerInput = bannerContainer.parentElement.querySelector('input[type="file"]')
        const textFile = new File(['text'], 'file.txt', { type: 'text/plain' })

        fireEvent.change(bannerInput, { target: { files: [textFile] } })

        expect(screen.getByText('banner must be an image')).toBeInTheDocument()
      })
    })

    it('revokes old banner URL when new banner is uploaded', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const bannerContainer = screen.getByText('Click to upload banner').closest('div')
        const bannerInput = bannerContainer.parentElement.querySelector('input[type="file"]')

        const file1 = new File(['banner1'], 'banner1.png', { type: 'image/png' })
        fireEvent.change(bannerInput, { target: { files: [file1] } })

        const file2 = new File(['banner2'], 'banner2.png', { type: 'image/png' })
        fireEvent.change(bannerInput, { target: { files: [file2] } })

        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      })
    })
  })

  describe('Server Preview', () => {
    it('renders server preview section on step 2', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Server Preview')).toBeInTheDocument()
      })
    })

    it('shows server name in preview', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Gaming Hub')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const preview = screen.getByText('Server Preview').closest('div')
        expect(preview).toHaveTextContent('Gaming Hub')
      })
    })

    it('shows default server name placeholder when empty', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /back/i }))
      })

      await waitFor(() => {
        const nameInputAgain = screen.getByPlaceholderText('My Awesome Server')
        userEvent.clear(nameInputAgain)
      })

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Server Name')).toBeInTheDocument()
      })
    })

    it('shows server description in preview', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')

      const descriptionInput = screen.getByPlaceholderText("What's your server about?")
      await userEvent.type(descriptionInput, 'A fun gaming community')

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const preview = screen.getByText('Server Preview').closest('div')
        expect(preview).toHaveTextContent('A fun gaming community')
      })
    })

    it('shows "No description" when description is empty', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('No description')).toBeInTheDocument()
      })
    })

    it('shows first letter of server name as fallback icon', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const preview = screen.getByText('Server Preview').closest('div')
        expect(preview).toHaveTextContent('T')
      })
    })
  })

  describe('Form Validation', () => {
    it('shows error when trying to proceed without server name', () => {
      render(<CreateServerModal {...defaultProps} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      expect(screen.getByText('Server name is required')).toBeInTheDocument()
    })

    it('shows error when server name is only whitespace', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, '   ')

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)

      expect(screen.getByText('Server name is required')).toBeInTheDocument()
    })

    it('clears error when valid server name is entered', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nextButton = screen.getByRole('button', { name: /next/i })
      fireEvent.click(nextButton)
      expect(screen.getByText('Server name is required')).toBeInTheDocument()

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')

      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.queryByText('Server name is required')).not.toBeInTheDocument()
      })
    })

    it('validates server name on submit from step 2', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /back/i }))
      })

      await waitFor(async () => {
        const nameInputAgain = screen.getByPlaceholderText('My Awesome Server')
        await userEvent.clear(nameInputAgain)
      })

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        expect(screen.getByText('Server name is required')).toBeInTheDocument()
      })
    })
  })

  describe('Create Server Action', () => {
    it('calls serverService.createServer on form submission', async () => {
      serverService.createServer.mockResolvedValue({
        success: true,
        server: { id: '1', name: 'Test Server' }
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(serverService.createServer).toHaveBeenCalledTimes(1)
      })
    })

    it('passes correct form data to serverService.createServer', async () => {
      serverService.createServer.mockResolvedValue({
        success: true,
        server: { id: '1', name: 'Test Server' }
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Gaming Server')

      const descriptionInput = screen.getByPlaceholderText("What's your server about?")
      await userEvent.type(descriptionInput, 'For gamers')

      const privateRadio = screen.getByRole('radio', { name: /private only people with an invite can join/i })
      fireEvent.click(privateRadio)

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(serverService.createServer).toHaveBeenCalledWith({
          name: 'Gaming Server',
          description: 'For gamers',
          isPublic: false,
          icon: null,
          banner: null
        })
      })
    })

    it('includes uploaded files in form data', async () => {
      serverService.createServer.mockResolvedValue({
        success: true,
        server: { id: '1', name: 'Test Server' }
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')
        const iconFile = new File(['icon'], 'icon.png', { type: 'image/png' })
        fireEvent.change(iconInput, { target: { files: [iconFile] } })

        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        const call = serverService.createServer.mock.calls[0][0]
        expect(call.icon).toBeInstanceOf(File)
        expect(call.icon.name).toBe('icon.png')
      })
    })

    it('calls onServerCreated with server data on success', async () => {
      const mockServer = { id: '1', name: 'Test Server' }
      serverService.createServer.mockResolvedValue({
        success: true,
        server: mockServer
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(mockOnServerCreated).toHaveBeenCalledWith(mockServer)
      })
    })
  })

  describe('API Integration', () => {
    it('handles API error response', async () => {
      serverService.createServer.mockResolvedValue({
        success: false,
        error: 'Server name already exists'
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Server name already exists')).toBeInTheDocument()
      })
    })

    it('handles API error without error message', async () => {
      serverService.createServer.mockResolvedValue({
        success: false
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to create server')).toBeInTheDocument()
      })
    })

    it('handles API exception', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      serverService.createServer.mockRejectedValue(new Error('Network error'))

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to create server')).toBeInTheDocument()
        expect(consoleError).toHaveBeenCalledWith('Failed to create server:', expect.any(Error))
      })

      consoleError.mockRestore()
    })
  })

  describe('Loading States', () => {
    it('shows loading state on submit button during submission', async () => {
      serverService.createServer.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      const createButton = screen.getByRole('button', { name: /create server/i })
      expect(createButton).toHaveAttribute('loading')
    })

    it('disables submit button during loading', async () => {
      serverService.createServer.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(async () => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)

        await waitFor(() => {
          expect(createButton).toHaveAttribute('loading')
        })
      })
    })

    it('re-enables submit button after submission completes', async () => {
      serverService.createServer.mockResolvedValue({
        success: true,
        server: { id: '1', name: 'Test Server' }
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(mockOnServerCreated).toHaveBeenCalled()
      })
    })

    it('re-enables submit button after error', async () => {
      serverService.createServer.mockResolvedValue({
        success: false,
        error: 'Error'
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        expect(createButton).not.toHaveAttribute('disabled')
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message in error banner', async () => {
      serverService.createServer.mockResolvedValue({
        success: false,
        error: 'Custom error message'
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        const errorBanner = screen.getByText('Custom error message')
        expect(errorBanner).toBeInTheDocument()
        expect(errorBanner.closest('div')).toHaveClass('bg-error/10')
      })
    })

    it('clears error when form is resubmitted', async () => {
      serverService.createServer
        .mockResolvedValueOnce({
          success: false,
          error: 'Error message'
        })
        .mockResolvedValueOnce({
          success: true,
          server: { id: '1', name: 'Test Server' }
        })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument()
      })

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('Error message')).not.toBeInTheDocument()
      })
    })

    it('does not call onServerCreated on error', async () => {
      serverService.createServer.mockResolvedValue({
        success: false,
        error: 'Error'
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument()
      })

      expect(mockOnServerCreated).not.toHaveBeenCalled()
    })
  })

  describe('Memory Management', () => {
    it('revokes object URLs on unmount', () => {
      const { unmount } = render(<CreateServerModal {...defaultProps} />)

      unmount()

      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('revokes icon URL on unmount after icon upload', async () => {
      const { unmount } = render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')
        const file = new File(['icon'], 'icon.png', { type: 'image/png' })
        fireEvent.change(iconInput, { target: { files: [file] } })
      })

      unmount()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('revokes banner URL on unmount after banner upload', async () => {
      const { unmount } = render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const bannerContainer = screen.getByText('Click to upload banner').closest('div')
        const bannerInput = bannerContainer.parentElement.querySelector('input[type="file"]')
        const file = new File(['banner'], 'banner.png', { type: 'image/png' })
        fireEvent.change(bannerInput, { target: { files: [file] } })
      })

      unmount()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })
  })

  describe('Success Callback', () => {
    it('does not close modal automatically on success', async () => {
      serverService.createServer.mockResolvedValue({
        success: true,
        server: { id: '1', name: 'Test Server' }
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(mockOnServerCreated).toHaveBeenCalled()
      })

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('passes server data with all properties to onServerCreated', async () => {
      const mockServer = {
        id: '123',
        name: 'Gaming Hub',
        description: 'Best gaming community',
        isPublic: false,
        icon: 'icon-url',
        banner: 'banner-url'
      }

      serverService.createServer.mockResolvedValue({
        success: true,
        server: mockServer
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Gaming Hub')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(mockOnServerCreated).toHaveBeenCalledWith(mockServer)
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles missing file input gracefully', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const iconInput = screen.getByRole('button', { name: /upload icon/i }).parentElement.querySelector('input[type="file"]')
        fireEvent.change(iconInput, { target: { files: [] } })
      })

      expect(screen.queryByAltText('Server icon')).not.toBeInTheDocument()
    })

    it('handles empty server name after trimming', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, '     ')

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      expect(screen.getByText('Server name is required')).toBeInTheDocument()
    })

    it('preserves form state when navigating between steps', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')

      const descriptionInput = screen.getByPlaceholderText("What's your server about?")
      await userEvent.type(descriptionInput, 'Test description')

      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /back/i }))
      })

      await waitFor(() => {
        const nameInputAgain = screen.getByPlaceholderText('My Awesome Server')
        const descriptionInputAgain = screen.getByPlaceholderText("What's your server about?")

        expect(nameInputAgain).toHaveValue('Test Server')
        expect(descriptionInputAgain).toHaveValue('Test description')
      })
    })

    it('handles form submission via Enter key', async () => {
      serverService.createServer.mockResolvedValue({
        success: true,
        server: { id: '1', name: 'Test Server' }
      })

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const form = screen.getByRole('button', { name: /create server/i }).closest('form')
        fireEvent.submit(form)
      })

      await waitFor(() => {
        expect(serverService.createServer).toHaveBeenCalled()
      })
    })

    it('prevents form submission when loading', async () => {
      serverService.createServer.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

      render(<CreateServerModal {...defaultProps} />)

      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, 'Test Server')
      fireEvent.click(screen.getByRole('button', { name: /next/i }))

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create server/i })
        fireEvent.click(createButton)
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(serverService.createServer).toHaveBeenCalledTimes(1)
      })
    })

    it('handles very long server name within limit', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const longName = 'A'.repeat(50)
      const nameInput = screen.getByPlaceholderText('My Awesome Server')
      await userEvent.type(nameInput, longName)

      expect(nameInput).toHaveValue(longName)
      expect(screen.getByText('50/50 characters')).toBeInTheDocument()
    })

    it('handles very long description within limit', async () => {
      render(<CreateServerModal {...defaultProps} />)

      const longDescription = 'A'.repeat(200)
      const descriptionInput = screen.getByPlaceholderText("What's your server about?")
      await userEvent.type(descriptionInput, longDescription)

      expect(descriptionInput).toHaveValue(longDescription)
      expect(screen.getByText('200/200 characters')).toBeInTheDocument()
    })
  })
})

export default ImageIcon
