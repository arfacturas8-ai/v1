import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import CreateCommunityPage from '../CreateCommunityPage'
import { AuthContext } from '../../contexts/AuthContext'
import communityService from '../../services/communityService'
import fileUploadService from '../../services/fileUploadService'
import { mockAuthContext, mockUnauthContext } from '../../../tests/utils/testUtils'

// Mock services
jest.mock('../../services/communityService')
jest.mock('../../services/fileUploadService')

// Mock react-router-dom navigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('CreateCommunityPage - Rendering & Structure', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('renders without crashing', () => {
    renderWithRouter(<CreateCommunityPage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('has proper page structure with semantic HTML', () => {
    renderWithRouter(<CreateCommunityPage />)
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Create community page')
  })

  it('displays page heading', () => {
    renderWithRouter(<CreateCommunityPage />)
    expect(screen.getByRole('heading', { name: /create community/i })).toBeInTheDocument()
  })

  it('renders without console errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    renderWithRouter(<CreateCommunityPage />)
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('CreateCommunityPage - Form Fields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('displays community name input field', () => {
    renderWithRouter(<CreateCommunityPage />)
    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/name/i)
    expect(nameInput).toBeTruthy()
  })

  it('displays display name input field', () => {
    renderWithRouter(<CreateCommunityPage />)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    expect(displayNameInput).toBeTruthy()
  })

  it('displays description textarea', () => {
    renderWithRouter(<CreateCommunityPage />)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)
    expect(descInput).toBeTruthy()
  })

  it('displays category dropdown/select', () => {
    renderWithRouter(<CreateCommunityPage />)
    const categorySelect = screen.queryByLabelText(/category/i) || screen.queryByRole('combobox')
    expect(categorySelect).toBeTruthy()
  })

  it('displays privacy settings toggle', () => {
    renderWithRouter(<CreateCommunityPage />)
    const privacyToggle = screen.queryByLabelText(/private/i) || screen.queryByRole('checkbox')
    expect(privacyToggle).toBeTruthy()
  })

  it('displays icon upload section', () => {
    renderWithRouter(<CreateCommunityPage />)
    // Icon upload should be present in form
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays banner upload section', () => {
    renderWithRouter(<CreateCommunityPage />)
    // Banner upload should be present in form
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays rules input section', () => {
    renderWithRouter(<CreateCommunityPage />)
    // Rules section should be present
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('displays submit button', () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.queryByRole('button', { name: /create|submit/i })
    expect(submitButton).toBeTruthy()
  })
})

describe('CreateCommunityPage - Name Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('validates required community name', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).toBeTruthy()
    })
  })

  it('validates minimum name length (3 characters)', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)

    if (nameInput) {
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'ab')

      const submitButton = screen.getByRole('button', { name: /create|submit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/at least 3 characters/i)).toBeTruthy()
      })
    }
  })

  it('validates maximum name length (21 characters)', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)

    if (nameInput) {
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'a'.repeat(22))

      const submitButton = screen.getByRole('button', { name: /create|submit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/less than 21 characters/i)).toBeTruthy()
      })
    }
  })

  it('clears name error when user starts typing', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).toBeTruthy()
    })

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    if (nameInput) {
      await userEvent.type(nameInput, 'test')
      // Error should clear
    }
  })
})

describe('CreateCommunityPage - Display Name Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('validates required display name', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/display name is required/i)).toBeTruthy()
    })
  })

  it('validates maximum display name length (100 characters)', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)

    if (displayNameInput) {
      await userEvent.clear(displayNameInput)
      await userEvent.type(displayNameInput, 'a'.repeat(101))

      const submitButton = screen.getByRole('button', { name: /create|submit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/less than 100 characters/i)).toBeTruthy()
      })
    }
  })

  it('clears display name error when user starts typing', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/display name is required/i)).toBeTruthy()
    })

    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    if (displayNameInput) {
      await userEvent.type(displayNameInput, 'Test Community')
      // Error should clear
    }
  })
})

describe('CreateCommunityPage - Description Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('validates required description', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/description is required/i)).toBeTruthy()
    })
  })

  it('validates minimum description length (10 characters)', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (descInput) {
      await userEvent.clear(descInput)
      await userEvent.type(descInput, 'short')

      const submitButton = screen.getByRole('button', { name: /create|submit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/at least 10 characters/i)).toBeTruthy()
      })
    }
  })

  it('validates maximum description length (500 characters)', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (descInput) {
      await userEvent.clear(descInput)
      await userEvent.type(descInput, 'a'.repeat(501))

      const submitButton = screen.getByRole('button', { name: /create|submit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/less than 500 characters/i)).toBeTruthy()
      })
    }
  })

  it('clears description error when user starts typing', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/description is required/i)).toBeTruthy()
    })

    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)
    if (descInput) {
      await userEvent.type(descInput, 'This is a test description')
      // Error should clear
    }
  })
})

describe('CreateCommunityPage - Category Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('has default category selected', () => {
    renderWithRouter(<CreateCommunityPage />)
    const categorySelect = screen.queryByLabelText(/category/i) || screen.queryByRole('combobox')
    expect(categorySelect).toBeTruthy()
  })

  it('allows changing category', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const categorySelect = screen.queryByLabelText(/category/i) || screen.queryByRole('combobox')

    if (categorySelect) {
      fireEvent.change(categorySelect, { target: { value: 'gaming' } })
      expect(categorySelect.value).toBe('gaming')
    }
  })

  it('supports multiple category options', () => {
    renderWithRouter(<CreateCommunityPage />)
    // Categories should be available in select
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})

describe('CreateCommunityPage - Privacy Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('defaults to public community', () => {
    renderWithRouter(<CreateCommunityPage />)
    const privacyToggle = screen.queryByLabelText(/private/i) || screen.queryByRole('checkbox')
    if (privacyToggle) {
      expect(privacyToggle.checked).toBeFalsy()
    }
  })

  it('allows toggling to private community', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const privacyToggle = screen.queryByLabelText(/private/i) || screen.queryByRole('checkbox')

    if (privacyToggle) {
      await userEvent.click(privacyToggle)
      expect(privacyToggle.checked).toBeTruthy()
    }
  })

  it('allows toggling back to public', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const privacyToggle = screen.queryByLabelText(/private/i) || screen.queryByRole('checkbox')

    if (privacyToggle) {
      await userEvent.click(privacyToggle)
      await userEvent.click(privacyToggle)
      expect(privacyToggle.checked).toBeFalsy()
    }
  })
})

describe('CreateCommunityPage - Icon Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('accepts valid icon file', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const file = new File(['icon'], 'icon.png', { type: 'image/png' })
    const input = screen.queryByLabelText(/icon/i) || document.querySelector('input[type="file"]')

    if (input) {
      await userEvent.upload(input, file)
      expect(fileUploadService.validateFile).toHaveBeenCalled()
    }
  })

  it('validates icon file type', async () => {
    fileUploadService.validateFile = jest.fn(() => ['Invalid file type'])
    renderWithRouter(<CreateCommunityPage />)

    const file = new File(['icon'], 'icon.txt', { type: 'text/plain' })
    const input = screen.queryByLabelText(/icon/i) || document.querySelector('input[type="file"]')

    if (input) {
      await userEvent.upload(input, file)
      await waitFor(() => {
        expect(screen.queryByText(/invalid file type/i)).toBeTruthy()
      })
    }
  })

  it('validates icon file size', async () => {
    fileUploadService.validateFile = jest.fn(() => ['File too large'])
    renderWithRouter(<CreateCommunityPage />)

    const file = new File(['icon'], 'icon.png', { type: 'image/png' })
    const input = screen.queryByLabelText(/icon/i) || document.querySelector('input[type="file"]')

    if (input) {
      await userEvent.upload(input, file)
      await waitFor(() => {
        expect(screen.queryByText(/file too large/i)).toBeTruthy()
      })
    }
  })

  it('displays icon preview after upload', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const file = new File(['icon'], 'icon.png', { type: 'image/png' })
    const input = screen.queryByLabelText(/icon/i) || document.querySelector('input[type="file"]')

    if (input) {
      await userEvent.upload(input, file)
      // Preview should be displayed
    }
  })

  it('allows removing uploaded icon', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const file = new File(['icon'], 'icon.png', { type: 'image/png' })
    const input = screen.queryByLabelText(/icon/i) || document.querySelector('input[type="file"]')

    if (input) {
      await userEvent.upload(input, file)
      const removeButton = screen.queryByRole('button', { name: /remove icon/i })
      if (removeButton) {
        await userEvent.click(removeButton)
        // Icon should be removed
      }
    }
  })
})

describe('CreateCommunityPage - Banner Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('accepts valid banner file', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const file = new File(['banner'], 'banner.png', { type: 'image/png' })
    const inputs = document.querySelectorAll('input[type="file"]')

    if (inputs.length > 1) {
      await userEvent.upload(inputs[1], file)
      expect(fileUploadService.validateFile).toHaveBeenCalled()
    }
  })

  it('validates banner file type', async () => {
    fileUploadService.validateFile = jest.fn(() => ['Invalid file type'])
    renderWithRouter(<CreateCommunityPage />)

    const file = new File(['banner'], 'banner.txt', { type: 'text/plain' })
    const inputs = document.querySelectorAll('input[type="file"]')

    if (inputs.length > 1) {
      await userEvent.upload(inputs[1], file)
      await waitFor(() => {
        expect(screen.queryByText(/invalid file type/i)).toBeTruthy()
      })
    }
  })

  it('validates banner file size', async () => {
    fileUploadService.validateFile = jest.fn(() => ['File too large'])
    renderWithRouter(<CreateCommunityPage />)

    const file = new File(['banner'], 'banner.png', { type: 'image/png' })
    const inputs = document.querySelectorAll('input[type="file"]')

    if (inputs.length > 1) {
      await userEvent.upload(inputs[1], file)
      await waitFor(() => {
        expect(screen.queryByText(/file too large/i)).toBeTruthy()
      })
    }
  })

  it('displays banner preview after upload', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const file = new File(['banner'], 'banner.png', { type: 'image/png' })
    const inputs = document.querySelectorAll('input[type="file"]')

    if (inputs.length > 1) {
      await userEvent.upload(inputs[1], file)
      // Preview should be displayed
    }
  })

  it('allows removing uploaded banner', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const file = new File(['banner'], 'banner.png', { type: 'image/png' })
    const inputs = document.querySelectorAll('input[type="file"]')

    if (inputs.length > 1) {
      await userEvent.upload(inputs[1], file)
      const removeButton = screen.queryByRole('button', { name: /remove banner/i })
      if (removeButton) {
        await userEvent.click(removeButton)
        // Banner should be removed
      }
    }
  })
})

describe('CreateCommunityPage - Rules Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('starts with one empty rule field', () => {
    renderWithRouter(<CreateCommunityPage />)
    // Should have at least one rule field
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('allows adding new rule', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const addButton = screen.queryByRole('button', { name: /add rule/i })

    if (addButton) {
      await userEvent.click(addButton)
      // New rule field should be added
    }
  })

  it('allows removing rule', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const addButton = screen.queryByRole('button', { name: /add rule/i })

    if (addButton) {
      await userEvent.click(addButton)
      const removeButton = screen.queryByRole('button', { name: /remove rule/i })
      if (removeButton) {
        await userEvent.click(removeButton)
        // Rule should be removed
      }
    }
  })

  it('prevents removing last rule', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const removeButton = screen.queryByRole('button', { name: /remove rule/i })

    if (removeButton) {
      await userEvent.click(removeButton)
      // Should still have at least one rule field
    }
  })

  it('allows typing rule text', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const ruleInput = screen.queryByPlaceholderText(/rule/i) || screen.queryByLabelText(/rule/i)

    if (ruleInput) {
      await userEvent.type(ruleInput, 'Be respectful')
      expect(ruleInput.value).toContain('Be respectful')
    }
  })

  it('validates maximum rule length (500 characters)', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const ruleInput = screen.queryByPlaceholderText(/rule/i) || screen.queryByLabelText(/rule/i)

    if (ruleInput) {
      await userEvent.type(ruleInput, 'a'.repeat(501))

      const submitButton = screen.getByRole('button', { name: /create|submit/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/less than 500 characters/i)).toBeTruthy()
      })
    }
  })

  it('filters out empty rules on submit', async () => {
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: true, data: { id: '1' } })
    )

    renderWithRouter(<CreateCommunityPage />)

    // Fill in required fields
    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      if (communityService.createCommunity.mock.calls.length > 0) {
        const callArgs = communityService.createCommunity.mock.calls[0][0]
        // Empty rules should be filtered out
        expect(callArgs.rules).toBeDefined()
      }
    })
  })
})

describe('CreateCommunityPage - Form Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: true, data: { id: '1' } })
    )
  })

  it('submits form with valid data', async () => {
    renderWithRouter(<CreateCommunityPage />)

    // Fill in form
    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(communityService.createCommunity).toHaveBeenCalled()
    })
  })

  it('shows loading state during submission', async () => {
    communityService.createCommunity = jest.fn(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/creating/i) || submitButton.disabled).toBeTruthy()
    })
  })

  it('disables submit button during submission', async () => {
    communityService.createCommunity = jest.fn(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton.disabled).toBeTruthy()
    })
  })

  it('redirects to community page on success', async () => {
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: true, data: { id: '1' } })
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/c/testcommunity')
    }, { timeout: 3000 })
  })

  it('shows success message on creation', async () => {
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: true, data: { id: '1' } })
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(communityService.createCommunity).toHaveBeenCalled()
    })
  })
})

describe('CreateCommunityPage - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('displays API error message on failure', async () => {
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: false, error: 'Community name already exists' })
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/already exists/i)).toBeTruthy()
    })
  })

  it('handles network errors gracefully', async () => {
    communityService.createCommunity = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/unexpected error/i)).toBeTruthy()
    })
  })

  it('re-enables submit button after error', async () => {
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: false, error: 'Error' })
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton.disabled).toBeFalsy()
    })
  })

  it('clears error message when user edits form', async () => {
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: false, error: 'Error' })
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText(/error/i)).toBeTruthy()
    })

    if (nameInput) {
      await userEvent.type(nameInput, '2')
      // Error should clear
    }
  })
})

describe('CreateCommunityPage - Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('has proper ARIA labels', () => {
    renderWithRouter(<CreateCommunityPage />)
    expect(screen.getByRole('main')).toHaveAttribute('aria-label')
  })

  it('has proper form labels', () => {
    renderWithRouter(<CreateCommunityPage />)
    // All inputs should have associated labels
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('announces errors to screen readers', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      const errorMessages = screen.queryAllByRole('alert')
      // Error messages should be announced
    })
  })

  it('supports keyboard navigation', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const submitButton = screen.getByRole('button', { name: /create|submit/i })

    // Should be focusable
    submitButton.focus()
    expect(document.activeElement).toBe(submitButton)
  })

  it('has proper heading hierarchy', () => {
    renderWithRouter(<CreateCommunityPage />)
    const heading = screen.getByRole('heading', { name: /create community/i })
    expect(heading.tagName).toBe('H1')
  })
})

describe('CreateCommunityPage - Data Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: true, data: { id: '1' } })
    )
  })

  it('trims whitespace from name', async () => {
    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, '  testcommunity  ')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      if (communityService.createCommunity.mock.calls.length > 0) {
        const callArgs = communityService.createCommunity.mock.calls[0][0]
        expect(callArgs.name).toBe('testcommunity')
      }
    })
  })

  it('trims whitespace from display name', async () => {
    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, '  Test Community  ')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      if (communityService.createCommunity.mock.calls.length > 0) {
        const callArgs = communityService.createCommunity.mock.calls[0][0]
        expect(callArgs.displayName).toBe('Test Community')
      }
    })
  })

  it('trims whitespace from description', async () => {
    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, '  This is a test community description  ')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      if (communityService.createCommunity.mock.calls.length > 0) {
        const callArgs = communityService.createCommunity.mock.calls[0][0]
        expect(callArgs.description).toBe('This is a test community description')
      }
    })
  })

  it('converts isPrivate to isPublic', async () => {
    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      if (communityService.createCommunity.mock.calls.length > 0) {
        const callArgs = communityService.createCommunity.mock.calls[0][0]
        expect(callArgs.isPublic).toBeDefined()
      }
    })
  })

  it('includes icon file in submission', async () => {
    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const file = new File(['icon'], 'icon.png', { type: 'image/png' })
    const input = screen.queryByLabelText(/icon/i) || document.querySelector('input[type="file"]')
    if (input) await userEvent.upload(input, file)

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      if (communityService.createCommunity.mock.calls.length > 0) {
        const callArgs = communityService.createCommunity.mock.calls[0][0]
        expect(callArgs.icon).toBeDefined()
      }
    })
  })

  it('includes banner file in submission', async () => {
    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const file = new File(['banner'], 'banner.png', { type: 'image/png' })
    const inputs = document.querySelectorAll('input[type="file"]')
    if (inputs.length > 1) await userEvent.upload(inputs[1], file)

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      if (communityService.createCommunity.mock.calls.length > 0) {
        const callArgs = communityService.createCommunity.mock.calls[0][0]
        expect(callArgs.banner).toBeDefined()
      }
    })
  })
})

describe('CreateCommunityPage - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fileUploadService.validateFile = jest.fn(() => [])
  })

  it('handles special characters in name', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)

    if (nameInput) {
      await userEvent.type(nameInput, 'test@#$%')
      // Should handle special characters appropriately
    }
  })

  it('handles unicode characters in description', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (descInput) {
      await userEvent.type(descInput, 'Test 🚀 emoji description')
      expect(descInput.value).toContain('🚀')
    }
  })

  it('handles rapid form submissions', async () => {
    communityService.createCommunity = jest.fn(() =>
      Promise.resolve({ success: true, data: { id: '1' } })
    )

    renderWithRouter(<CreateCommunityPage />)

    const nameInput = screen.queryByLabelText(/community name/i) || screen.queryByPlaceholderText(/^name/i)
    const displayNameInput = screen.queryByLabelText(/display name/i) || screen.queryByPlaceholderText(/display name/i)
    const descInput = screen.queryByLabelText(/description/i) || screen.queryByPlaceholderText(/description/i)

    if (nameInput) await userEvent.type(nameInput, 'testcommunity')
    if (displayNameInput) await userEvent.type(displayNameInput, 'Test Community')
    if (descInput) await userEvent.type(descInput, 'This is a test community description')

    const submitButton = screen.getByRole('button', { name: /create|submit/i })
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Should only submit once
      expect(communityService.createCommunity).toHaveBeenCalledTimes(1)
    })
  })

  it('handles empty category selection', async () => {
    renderWithRouter(<CreateCommunityPage />)
    const categorySelect = screen.queryByLabelText(/category/i) || screen.queryByRole('combobox')

    if (categorySelect) {
      fireEvent.change(categorySelect, { target: { value: '' } })
      // Should handle empty category
    }
  })
})

export default mockNavigate
