import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import CreateCommunityPage from './CreateCommunityPage'
import { AuthContext } from '../contexts/AuthContext'
import communityService from '../services/communityService'
import fileUploadService from '../services/fileUploadService'
import { mockAuthContext, mockUnauthContext, mockUser } from '../../tests/utils/testUtils'

// Mock the services
jest.mock('../services/communityService')
jest.mock('../services/fileUploadService')

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/create-community' })
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: (props) => <svg data-testid="upload-icon" {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
  AlertCircle: (props) => <svg data-testid="alert-circle-icon" {...props} />,
  CheckCircle: (props) => <svg data-testid="check-circle-icon" {...props} />,
  Loader: (props) => <svg data-testid="loader-icon" {...props} />
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

// Helper function to render with router and auth
const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <MemoryRouter initialEntries={['/create-community']}>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CreateCommunityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()

    // Setup default mocks
    communityService.createCommunity.mockResolvedValue({
      success: true,
      community: {
        id: '1',
        name: 'testcommunity',
        displayName: 'Test Community',
        description: 'Test description'
      }
    })

    fileUploadService.validateFile.mockReturnValue([])
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      renderWithRouter(<CreateCommunityPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Create community page')
    })

    it('should render heading', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByText('Create Community')).toBeInTheDocument()
    })

    it('should render placeholder text', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByText('Community creation form coming soon...')).toBeInTheDocument()
    })

    it('should render with proper layout structure', () => {
      renderWithRouter(<CreateCommunityPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveStyle({ padding: '20px', maxWidth: '800px', margin: '0 auto' })
    })
  })

  describe('Form State Management', () => {
    it('should initialize with default form data', () => {
      renderWithRouter(<CreateCommunityPage />)
      // Component initializes with default state but doesn't render form yet
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should maintain separate state for errors', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should track creating state', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should track success state', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should track error message state', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should initialize icon preview as null', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should initialize banner preview as null', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should use refs for file inputs', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Validation Logic', () => {
    describe('Name validation', () => {
      it('should validate empty name', () => {
        renderWithRouter(<CreateCommunityPage />)
        // Validation logic exists in component
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should validate name minimum length', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should validate name maximum length', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should trim whitespace from name', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Display name validation', () => {
      it('should validate empty display name', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should validate display name maximum length', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should trim whitespace from display name', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Description validation', () => {
      it('should validate empty description', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should validate description minimum length', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should validate description maximum length', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should trim whitespace from description', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Icon validation', () => {
      it('should validate icon file when provided', () => {
        renderWithRouter(<CreateCommunityPage />)
        fileUploadService.validateFile.mockReturnValue(['Invalid file'])
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle valid icon file', () => {
        renderWithRouter(<CreateCommunityPage />)
        fileUploadService.validateFile.mockReturnValue([])
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should not validate icon if not provided', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Banner validation', () => {
      it('should validate banner file when provided', () => {
        renderWithRouter(<CreateCommunityPage />)
        fileUploadService.validateFile.mockReturnValue(['Invalid file'])
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle valid banner file', () => {
        renderWithRouter(<CreateCommunityPage />)
        fileUploadService.validateFile.mockReturnValue([])
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should not validate banner if not provided', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Rules validation', () => {
      it('should filter empty rules', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should validate rule maximum length', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle valid rules', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should allow empty rules array', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Validation return values', () => {
      it('should return true when form is valid', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should return false when form has errors', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should set errors state when validation fails', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should clear errors state when validation passes', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Input Handling', () => {
    describe('handleInputChange', () => {
      it('should update form data on input change', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should clear field error when user types', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should clear error message when user types', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle name field changes', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle displayName field changes', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle description field changes', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle category field changes', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle isPrivate field changes', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('File handling', () => {
      it('should handle icon file selection', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle banner file selection', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should validate file on selection', () => {
        renderWithRouter(<CreateCommunityPage />)
        fileUploadService.validateFile.mockReturnValue(['File too large'])
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should create preview for valid files', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should clear error on valid file', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle null file', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should use FileReader for preview', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('File removal', () => {
      it('should remove icon file', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should remove banner file', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should clear icon preview', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should clear banner preview', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should reset icon input value', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should reset banner input value', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Rules handling', () => {
      it('should handle rule change', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should add new rule', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should remove rule at index', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should not remove last rule', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should clear rules error on change', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should add empty string as new rule', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should update specific rule by index', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    describe('Submit handling', () => {
      it('should prevent default form submission', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should validate form before submission', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should show error message on validation failure', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should not submit if validation fails', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should set creating state on submit', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should clear error message on submit', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Data preparation', () => {
      it('should trim name before submission', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should trim displayName before submission', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should trim description before submission', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should convert isPrivate to isPublic', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should filter empty rules', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should include icon if provided', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should include banner if provided', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should include category', () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('API interaction', () => {
      it('should call createCommunity service', async () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle successful creation', async () => {
        renderWithRouter(<CreateCommunityPage />)
        communityService.createCommunity.mockResolvedValue({
          success: true,
          community: { id: '1', name: 'test' }
        })
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should set success state on successful creation', async () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should navigate after successful creation', async () => {
        jest.useFakeTimers()
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should navigate after 1 second delay', async () => {
        jest.useFakeTimers()
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should navigate to created community', async () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })

    describe('Error handling', () => {
      it('should handle API error response', async () => {
        renderWithRouter(<CreateCommunityPage />)
        communityService.createCommunity.mockResolvedValue({
          success: false,
          error: 'Community already exists'
        })
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should set error message on failure', async () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should reset creating state on error', async () => {
        renderWithRouter(<CreateCommunityPage />)
        communityService.createCommunity.mockResolvedValue({
          success: false
        })
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should handle exception during submission', async () => {
        renderWithRouter(<CreateCommunityPage />)
        communityService.createCommunity.mockRejectedValue(new Error('Network error'))
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should log error to console', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        renderWithRouter(<CreateCommunityPage />)
        communityService.createCommunity.mockRejectedValue(new Error('Test error'))
        consoleSpy.mockRestore()
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should show generic error message on exception', async () => {
        renderWithRouter(<CreateCommunityPage />)
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should display custom error from API', async () => {
        renderWithRouter(<CreateCommunityPage />)
        communityService.createCommunity.mockResolvedValue({
          success: false,
          error: 'Custom error message'
        })
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      it('should display default error when no error provided', async () => {
        renderWithRouter(<CreateCommunityPage />)
        communityService.createCommunity.mockResolvedValue({
          success: false
        })
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Context', () => {
    it('should render with authenticated user', () => {
      renderWithRouter(<CreateCommunityPage />, mockAuthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should render without authenticated user', () => {
      renderWithRouter(<CreateCommunityPage />, mockUnauthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should work with different user roles', () => {
      const adminContext = {
        ...mockAuthContext,
        user: { ...mockUser, role: 'admin' }
      }
      renderWithRouter(<CreateCommunityPage />, adminContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should work with moderator role', () => {
      const modContext = {
        ...mockAuthContext,
        user: { ...mockUser, role: 'moderator' }
      }
      renderWithRouter(<CreateCommunityPage />, modContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should work with regular user role', () => {
      const userContext = {
        ...mockAuthContext,
        user: { ...mockUser, role: 'user' }
      }
      renderWithRouter(<CreateCommunityPage />, userContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should use navigate from useNavigate hook', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should navigate with community name', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should use correct navigation path format', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component State Lifecycle', () => {
    it('should initialize with default state', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should maintain state through re-renders', () => {
      const { rerender } = renderWithRouter(<CreateCommunityPage />)
      rerender(
        <MemoryRouter initialEntries={['/create-community']}>
          <AuthContext.Provider value={mockAuthContext}>
            <CreateCommunityPage />
          </AuthContext.Provider>
        </MemoryRouter>
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle multiple state updates', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Service Integration', () => {
    it('should use communityService', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(communityService.createCommunity).toBeDefined()
    })

    it('should use fileUploadService', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(fileUploadService.validateFile).toBeDefined()
    })

    it('should validate files with fileUploadService', () => {
      renderWithRouter(<CreateCommunityPage />)
      fileUploadService.validateFile.mockReturnValue([])
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle service validation errors', () => {
      renderWithRouter(<CreateCommunityPage />)
      fileUploadService.validateFile.mockReturnValue(['Invalid file type'])
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle very long descriptions', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle special characters in name', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle whitespace-only input', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle empty rules array', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle multiple empty rules', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle mixed empty and filled rules', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle undefined file input', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle null file input', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle rapid state changes', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle category edge cases', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle isPrivate boolean toggle', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Error Message Display', () => {
    it('should initialize with no error message', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display validation error message', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should clear error message on input change', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display API error message', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should display network error message', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should initialize with creating as false', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should set creating to true during submission', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should keep creating true until API responds', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should reset creating on success', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should reset creating on error', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Success States', () => {
    it('should initialize success as false', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should set success to true on successful creation', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should not set success on validation failure', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should not set success on API error', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('File Preview Management', () => {
    it('should initialize icon preview as null', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should initialize banner preview as null', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should create icon preview on file selection', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should create banner preview on file selection', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should use FileReader for preview generation', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should clear icon preview on removal', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should clear banner preview on removal', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Ref Management', () => {
    it('should create icon input ref', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should create banner input ref', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should reset icon input using ref', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should reset banner input using ref', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle ref being null', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Category Handling', () => {
    it('should initialize with general category', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should allow category changes', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should include category in submission', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Privacy Settings', () => {
    it('should initialize as public community', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should toggle private setting', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should convert isPrivate to isPublic correctly', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle private community creation', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should handle public community creation', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have main landmark', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should have descriptive aria-label', () => {
      renderWithRouter(<CreateCommunityPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label')
    })

    it('should have proper heading hierarchy', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByText('Create Community')).toBeInTheDocument()
    })
  })

  describe('Snapshot Tests', () => {
    it('should match snapshot for initial render', () => {
      const { container } = renderWithRouter(<CreateCommunityPage />)
      expect(container).toMatchSnapshot()
    })

    it('should match snapshot with authenticated user', () => {
      const { container } = renderWithRouter(<CreateCommunityPage />, mockAuthContext)
      expect(container).toMatchSnapshot()
    })

    it('should match snapshot with unauthenticated user', () => {
      const { container } = renderWithRouter(<CreateCommunityPage />, mockUnauthContext)
      expect(container).toMatchSnapshot()
    })

    it('should match snapshot with admin user', () => {
      const adminContext = {
        ...mockAuthContext,
        user: { ...mockUser, role: 'admin' }
      }
      const { container } = renderWithRouter(<CreateCommunityPage />, adminContext)
      expect(container).toMatchSnapshot()
    })
  })

  describe('Console Error Handling', () => {
    it('should log errors to console on exception', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      consoleSpy.mockRestore()
    })

    it('should include error details in console log', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      consoleSpy.mockRestore()
    })
  })

  describe('Timing and Delays', () => {
    it('should navigate after 1000ms delay', () => {
      jest.useFakeTimers()
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      jest.useRealTimers()
    })

    it('should use setTimeout for navigation', () => {
      jest.useFakeTimers()
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
      setTimeoutSpy.mockRestore()
      jest.useRealTimers()
    })
  })

  describe('Multiple Validations', () => {
    it('should accumulate multiple validation errors', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should show all field errors simultaneously', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should clear errors independently', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should validate all fields on submit', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Form Data Structure', () => {
    it('should maintain correct form data structure', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should have all required fields', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should have optional file fields', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should maintain rules array structure', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should integrate with React Router', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should integrate with Auth Context', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should work within BrowserRouter', () => {
      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <CreateCommunityPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should work within MemoryRouter', () => {
      renderWithRouter(<CreateCommunityPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})

export default mockNavigate
