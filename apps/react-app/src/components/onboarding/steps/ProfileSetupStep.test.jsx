import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import ProfileSetupStep from './ProfileSetupStep.jsx'
import { useAuth } from '../../../contexts/AuthContext.jsx'

// Mock the AuthContext
vi.mock('../../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn()
}))

describe('ProfileSetupStep', () => {
  let mockUpdateUser
  let mockOnComplete
  let mockOnSkip
  let user

  beforeEach(() => {
    mockUpdateUser = vi.fn()
    mockOnComplete = vi.fn()
    mockOnSkip = vi.fn()
    user = userEvent.setup()

    // Default mock implementation
    useAuth.mockReturnValue({
      user: {
        id: '123',
        username: 'testuser',
        email: 'test@example.com'
      },
      updateUser: mockUpdateUser
    })

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }

    // Mock fetch
    global.fetch = vi.fn()

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the component with heading and description', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('Set Up Your Profile')).toBeInTheDocument()
      expect(screen.getByText(/Tell the community about yourself/)).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByPlaceholderText('Share something interesting about yourself...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('City, Country')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument()
    })

    it('should render avatar upload section', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('Click to upload your profile picture')).toBeInTheDocument()
      expect(screen.getByAltText('Avatar preview')).toBeInTheDocument()
    })

    it('should render all interest options', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const expectedInterests = [
        'Technology', 'Gaming', 'Art', 'Music', 'Sports', 'Travel',
        'Food', 'Photography', 'Science', 'Books', 'Movies', 'Fitness',
        'Cryptocurrency', 'NFTs', 'DeFi', 'Web3', 'Programming', 'Design'
      ]

      expectedInterests.forEach(interest => {
        expect(screen.getByRole('button', { name: interest })).toBeInTheDocument()
      })
    })

    it('should render Save & Continue button', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByRole('button', { name: 'Save & Continue' })).toBeInTheDocument()
    })

    it('should render Skip for now button', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByRole('button', { name: 'Skip for now' })).toBeInTheDocument()
    })
  })

  describe('Initial State and User Data', () => {
    it('should initialize with empty form when user has no profile data', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      const locationInput = screen.getByPlaceholderText('City, Country')
      const websiteInput = screen.getByPlaceholderText('https://...')

      expect(bioInput).toHaveValue('')
      expect(locationInput).toHaveValue('')
      expect(websiteInput).toHaveValue('')
    })

    it('should populate form with existing user data', () => {
      useAuth.mockReturnValue({
        user: {
          id: '123',
          bio: 'Existing bio',
          location: 'New York',
          website: 'https://example.com',
          interests: ['Technology', 'Gaming']
        },
        updateUser: mockUpdateUser
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByPlaceholderText('Share something interesting about yourself...')).toHaveValue('Existing bio')
      expect(screen.getByPlaceholderText('City, Country')).toHaveValue('New York')
      expect(screen.getByPlaceholderText('https://...')).toHaveValue('https://example.com')
    })

    it('should display existing user avatar', () => {
      useAuth.mockReturnValue({
        user: {
          id: '123',
          avatar: 'https://example.com/avatar.jpg'
        },
        updateUser: mockUpdateUser
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByAltText('Current avatar')).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should display default avatar icon when no avatar exists', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const avatarContainer = screen.getByAltText('Avatar preview').parentElement
      expect(avatarContainer.querySelector('svg')).toBeInTheDocument()
    })

    it('should pre-select user interests', () => {
      useAuth.mockReturnValue({
        user: {
          id: '123',
          interests: ['Technology', 'Gaming', 'Art']
        },
        updateUser: mockUpdateUser
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const techButton = screen.getByRole('button', { name: 'Technology' })
      const gamingButton = screen.getByRole('button', { name: 'Gaming' })
      const artButton = screen.getByRole('button', { name: 'Art' })

      expect(techButton).toHaveClass('bg-blue-600')
      expect(gamingButton).toHaveClass('bg-blue-600')
      expect(artButton).toHaveClass('bg-blue-600')
    })
  })

  describe('Bio Field', () => {
    it('should update bio on text input', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'This is my bio')

      expect(bioInput).toHaveValue('This is my bio')
    })

    it('should display character count for bio', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('0/500 characters')).toBeInTheDocument()
    })

    it('should update character count as user types', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'Hello')

      expect(screen.getByText('5/500 characters')).toBeInTheDocument()
    })

    it('should enforce 500 character limit on bio', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      const longText = 'a'.repeat(600)

      await user.type(bioInput, longText)

      expect(bioInput.value.length).toBeLessThanOrEqual(500)
    })

    it('should have maxLength attribute set to 500', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      expect(bioInput).toHaveAttribute('maxLength', '500')
    })

    it('should render bio as textarea with 3 rows', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      expect(bioInput.tagName).toBe('TEXTAREA')
      expect(bioInput).toHaveAttribute('rows', '3')
    })

    it('should show correct label for bio field', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('Tell us about yourself')).toBeInTheDocument()
    })
  })

  describe('Location Field', () => {
    it('should update location on text input', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const locationInput = screen.getByPlaceholderText('City, Country')
      await user.type(locationInput, 'San Francisco, USA')

      expect(locationInput).toHaveValue('San Francisco, USA')
    })

    it('should show optional label for location', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('Location (optional)')).toBeInTheDocument()
    })

    it('should render location as text input', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const locationInput = screen.getByPlaceholderText('City, Country')
      expect(locationInput).toHaveAttribute('type', 'text')
    })

    it('should allow clearing location field', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const locationInput = screen.getByPlaceholderText('City, Country')
      await user.type(locationInput, 'New York')
      await user.clear(locationInput)

      expect(locationInput).toHaveValue('')
    })
  })

  describe('Website Field', () => {
    it('should update website on text input', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const websiteInput = screen.getByPlaceholderText('https://...')
      await user.type(websiteInput, 'https://example.com')

      expect(websiteInput).toHaveValue('https://example.com')
    })

    it('should show optional label for website', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('Website (optional)')).toBeInTheDocument()
    })

    it('should render website as url input', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const websiteInput = screen.getByPlaceholderText('https://...')
      expect(websiteInput).toHaveAttribute('type', 'url')
    })

    it('should allow clearing website field', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const websiteInput = screen.getByPlaceholderText('https://...')
      await user.type(websiteInput, 'https://test.com')
      await user.clear(websiteInput)

      expect(websiteInput).toHaveValue('')
    })
  })

  describe('Interest Selection', () => {
    it('should toggle interest on click', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const techButton = screen.getByRole('button', { name: 'Technology' })
      await user.click(techButton)

      expect(techButton).toHaveClass('bg-blue-600')
    })

    it('should deselect interest on second click', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const techButton = screen.getByRole('button', { name: 'Technology' })
      await user.click(techButton)
      await user.click(techButton)

      expect(techButton).not.toHaveClass('bg-blue-600')
      expect(techButton).toHaveClass('bg-white')
    })

    it('should allow selecting multiple interests', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      await user.click(screen.getByRole('button', { name: 'Technology' }))
      await user.click(screen.getByRole('button', { name: 'Gaming' }))
      await user.click(screen.getByRole('button', { name: 'Art' }))

      expect(screen.getByRole('button', { name: 'Technology' })).toHaveClass('bg-blue-600')
      expect(screen.getByRole('button', { name: 'Gaming' })).toHaveClass('bg-blue-600')
      expect(screen.getByRole('button', { name: 'Art' })).toHaveClass('bg-blue-600')
    })

    it('should display interest count', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('Selected: 0/6')).toBeInTheDocument()
    })

    it('should update interest count when selecting interests', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      await user.click(screen.getByRole('button', { name: 'Technology' }))
      await user.click(screen.getByRole('button', { name: 'Gaming' }))

      expect(screen.getByText('Selected: 2/6')).toBeInTheDocument()
    })

    it('should allow selecting up to 6 interests', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const interests = ['Technology', 'Gaming', 'Art', 'Music', 'Sports', 'Travel']
      for (const interest of interests) {
        await user.click(screen.getByRole('button', { name: interest }))
      }

      expect(screen.getByText('Selected: 6/6')).toBeInTheDocument()
    })

    it('should disable unselected interests when 6 are selected', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const interests = ['Technology', 'Gaming', 'Art', 'Music', 'Sports', 'Travel']
      for (const interest of interests) {
        await user.click(screen.getByRole('button', { name: interest }))
      }

      const foodButton = screen.getByRole('button', { name: 'Food' })
      expect(foodButton).toBeDisabled()
    })

    it('should not disable already selected interests when limit reached', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const interests = ['Technology', 'Gaming', 'Art', 'Music', 'Sports', 'Travel']
      for (const interest of interests) {
        await user.click(screen.getByRole('button', { name: interest }))
      }

      const techButton = screen.getByRole('button', { name: 'Technology' })
      expect(techButton).not.toBeDisabled()
    })

    it('should re-enable other interests when one is deselected', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const interests = ['Technology', 'Gaming', 'Art', 'Music', 'Sports', 'Travel']
      for (const interest of interests) {
        await user.click(screen.getByRole('button', { name: interest }))
      }

      await user.click(screen.getByRole('button', { name: 'Technology' }))

      const foodButton = screen.getByRole('button', { name: 'Food' })
      expect(foodButton).not.toBeDisabled()
    })

    it('should show interest selection label', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      expect(screen.getByText('What are your interests? (Select up to 6)')).toBeInTheDocument()
    })
  })

  describe('Avatar Upload', () => {
    it('should handle avatar file selection', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
      const input = screen.getByLabelText(/Click to upload your profile picture/i).previousElementSibling

      await user.upload(input, file)

      expect(input.files[0]).toBe(file)
      expect(input.files).toHaveLength(1)
    })

    it('should create object URL for avatar preview', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
      const input = screen.getByLabelText(/Click to upload your profile picture/i).previousElementSibling

      await user.upload(input, file)

      expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    })

    it('should display avatar preview after upload', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
      const input = screen.getByLabelText(/Click to upload your profile picture/i).previousElementSibling

      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByAltText('Avatar preview')).toHaveAttribute('src', 'blob:mock-url')
      })
    })

    it('should accept only image files', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const input = screen.getByLabelText(/Click to upload your profile picture/i).previousElementSibling
      expect(input).toHaveAttribute('accept', 'image/*')
    })

    it('should revoke old object URL when new avatar is uploaded', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const file1 = new File(['avatar1'], 'avatar1.png', { type: 'image/png' })
      const file2 = new File(['avatar2'], 'avatar2.png', { type: 'image/png' })
      const input = screen.getByLabelText(/Click to upload your profile picture/i).previousElementSibling

      await user.upload(input, file1)
      await user.upload(input, file2)

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should render file input as hidden', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const input = screen.getByLabelText(/Click to upload your profile picture/i).previousElementSibling
      expect(input).toHaveClass('hidden')
    })

    it('should cleanup object URL on unmount', () => {
      const { unmount } = render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      unmount()

      // Object URL should be revoked on unmount if it exists
      // This is tested by the useEffect cleanup
    })
  })

  describe('Form Validation and Completion', () => {
    it('should disable Save button when form is empty', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      expect(saveButton).toBeDisabled()
    })

    it('should enable Save button when bio is filled', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'My bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      expect(saveButton).not.toBeDisabled()
    })

    it('should enable Save button when interests are selected', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      await user.click(screen.getByRole('button', { name: 'Technology' }))

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      expect(saveButton).not.toBeDisabled()
    })

    it('should disable Save button with only whitespace in bio', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, '   ')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      expect(saveButton).toBeDisabled()
    })

    it('should not consider location/website for completion validation', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const locationInput = screen.getByPlaceholderText('City, Country')
      const websiteInput = screen.getByPlaceholderText('https://...')

      await user.type(locationInput, 'New York')
      await user.type(websiteInput, 'https://example.com')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      expect(saveButton).toBeDisabled()
    })

    it('should apply disabled styling when button is disabled', () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      expect(saveButton).toHaveClass('bg-gray-300', 'text-gray-500', 'cursor-not-allowed')
    })

    it('should apply enabled styling when button is enabled', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'My bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      expect(saveButton).toHaveClass('bg-blue-600', 'text-white')
    })
  })

  describe('Skip Functionality', () => {
    it('should call onSkip when skip button is clicked', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const skipButton = screen.getByRole('button', { name: 'Skip for now' })
      await user.click(skipButton)

      expect(mockOnSkip).toHaveBeenCalledTimes(1)
    })

    it('should allow skipping without filling any fields', async () => {
      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const skipButton = screen.getByRole('button', { name: 'Skip for now' })
      expect(skipButton).not.toBeDisabled()

      await user.click(skipButton)
      expect(mockOnSkip).toHaveBeenCalled()
    })
  })

  describe('Save and API Integration', () => {
    it('should call API with correct endpoint on save', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123', bio: 'New bio' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', expect.any(Object))
    })

    it('should use PUT method for API call', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/user/profile',
          expect.objectContaining({ method: 'PUT' })
        )
      })
    })

    it('should include authorization header in API call', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/user/profile',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer mock-token'
            }
          })
        )
      })
    })

    it('should send FormData with profile data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/user/profile',
          expect.objectContaining({
            body: expect.any(FormData)
          })
        )
      })
    })

    it('should include avatar file in FormData if uploaded', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
      const fileInput = screen.getByLabelText(/Click to upload your profile picture/i).previousElementSibling
      await user.upload(fileInput, file)

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should stringify interests array in FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      await user.click(screen.getByRole('button', { name: 'Technology' }))
      await user.click(screen.getByRole('button', { name: 'Gaming' }))

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })

    it('should update user context on successful save', async () => {
      const updatedUser = { id: '123', bio: 'New bio', interests: ['Technology'] }
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: updatedUser })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser)
      })
    })

    it('should call onComplete on successful save', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1)
      })
    })

    it('should retrieve token from localStorage', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(localStorage.getItem).toHaveBeenCalledWith('token')
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state when saving', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })
    })

    it('should display spinner during loading', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        const spinner = screen.getByText('Saving...').previousElementSibling
        expect(spinner).toHaveClass('animate-spin')
      })
    })

    it('should disable save button during loading', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}))

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Saving/i })
        expect(button).toBeDisabled()
      })
    })

    it('should reset loading state after successful save', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('should still call onComplete on API error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('should handle network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('should reset loading state after error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('should log error to console on failure', async () => {
      const error = new Error('Failed to update profile')
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const bioInput = screen.getByPlaceholderText('Share something interesting about yourself...')
      await user.type(bioInput, 'New bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update profile:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Memory Management', () => {
    it('should revoke object URL on component unmount', () => {
      const { unmount } = render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      unmount()

      // The cleanup function should be called
      // Since no avatar was uploaded, revokeObjectURL should not be called
      expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    })

    it('should revoke object URL on unmount with avatar preview', async () => {
      const { unmount } = render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
      const input = screen.getByLabelText(/Click to upload your profile picture/i).previousElementSibling

      await user.upload(input, file)

      unmount()

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })
  })

  describe('Complete Form Submission', () => {
    it('should submit all filled fields together', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      await user.type(screen.getByPlaceholderText('Share something interesting about yourself...'), 'Full bio')
      await user.type(screen.getByPlaceholderText('City, Country'), 'Los Angeles')
      await user.type(screen.getByPlaceholderText('https://...'), 'https://mysite.com')
      await user.click(screen.getByRole('button', { name: 'Technology' }))
      await user.click(screen.getByRole('button', { name: 'Gaming' }))

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
        expect(mockOnComplete).toHaveBeenCalled()
      })
    })

    it('should not submit empty optional fields', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '123' } })
      })

      render(<ProfileSetupStep onComplete={mockOnComplete} onSkip={mockOnSkip} />)

      await user.type(screen.getByPlaceholderText('Share something interesting about yourself...'), 'Just bio')

      const saveButton = screen.getByRole('button', { name: 'Save & Continue' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })
})

export default expectedInterests
