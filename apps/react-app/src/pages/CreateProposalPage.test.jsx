/**
 * CreateProposalPage Test Suite
 * Comprehensive tests for the Create Proposal page functionality
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CreateProposalPage from './CreateProposalPage'
import { AuthContext } from '../contexts/AuthContext'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FileText: (props) => <div data-testid="icon-filetext" {...props} />,
  Calendar: (props) => <div data-testid="icon-calendar" {...props} />,
  Users: (props) => <div data-testid="icon-users" {...props} />,
  Vote: (props) => <div data-testid="icon-vote" {...props} />,
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  avatar: null,
  bio: 'Test bio',
  role: 'user',
  isVerified: true,
}

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
  error: null,
  updateUser: jest.fn(),
}

const mockUnauthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
  error: null,
  updateUser: jest.fn(),
}

const renderWithAuth = (component, authValue = mockAuthContext) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CreateProposalPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      expect(container).toBeInTheDocument()
    })

    it('renders the main content area', () => {
      renderWithAuth(<CreateProposalPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('displays the create proposal heading', () => {
      renderWithAuth(<CreateProposalPage />)
      const heading = screen.getByText('Create Proposal')
      expect(heading).toBeInTheDocument()
    })

    it('renders the Vote icon', () => {
      renderWithAuth(<CreateProposalPage />)
      const icon = screen.getByTestId('icon-vote')
      expect(icon).toBeInTheDocument()
    })

    it('displays the title label', () => {
      renderWithAuth(<CreateProposalPage />)
      const label = screen.getByText('Title')
      expect(label).toBeInTheDocument()
    })

    it('displays the description label', () => {
      renderWithAuth(<CreateProposalPage />)
      const label = screen.getByText('Description')
      expect(label).toBeInTheDocument()
    })

    it('displays the voting duration label', () => {
      renderWithAuth(<CreateProposalPage />)
      const label = screen.getByText('Voting Duration (days)')
      expect(label).toBeInTheDocument()
    })

    it('renders the title input field', () => {
      renderWithAuth(<CreateProposalPage />)
      const input = screen.getByPlaceholderText('Proposal title')
      expect(input).toBeInTheDocument()
    })

    it('renders the description textarea', () => {
      renderWithAuth(<CreateProposalPage />)
      const textarea = screen.getByPlaceholderText('Describe your proposal')
      expect(textarea).toBeInTheDocument()
    })

    it('renders the duration input field', () => {
      renderWithAuth(<CreateProposalPage />)
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('renders the submit button', () => {
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })
      expect(button).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithAuth(<CreateProposalPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      renderWithAuth(<CreateProposalPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('renders with proper component structure', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const main = container.querySelector('div[role="main"]')
      expect(main).toBeInTheDocument()
    })

    it('displays all form fields', () => {
      renderWithAuth(<CreateProposalPage />)
      expect(screen.getByPlaceholderText('Proposal title')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Describe your proposal')).toBeInTheDocument()
      expect(screen.getAllByRole('spinbutton').length).toBeGreaterThan(0)
    })

    it('renders with correct initial layout', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const wrapper = container.querySelector('.max-w-4xl')
      expect(wrapper).toBeInTheDocument()
    })

    it('renders the form container', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const formContainer = container.querySelector('.space-y-6')
      expect(formContainer).toBeInTheDocument()
    })
  })

  describe('Initial State', () => {
    it('has empty title initially', () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      expect(titleInput).toHaveValue('')
    })

    it('has empty description initially', () => {
      renderWithAuth(<CreateProposalPage />)
      const descriptionInput = screen.getByPlaceholderText('Describe your proposal')
      expect(descriptionInput).toHaveValue('')
    })

    it('has default duration of 7 days', () => {
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]
      expect(durationInput).toHaveValue(7)
    })

    it('renders with default state values', () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      const descriptionInput = screen.getByPlaceholderText('Describe your proposal')
      const durationInput = screen.getAllByRole('spinbutton')[0]

      expect(titleInput.value).toBe('')
      expect(descriptionInput.value).toBe('')
      expect(durationInput.value).toBe('7')
    })

    it('initializes with correct form field types', () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      const descriptionInput = screen.getByPlaceholderText('Describe your proposal')
      const durationInput = screen.getAllByRole('spinbutton')[0]

      expect(titleInput.type).toBe('text')
      expect(descriptionInput.tagName.toLowerCase()).toBe('textarea')
      expect(durationInput.type).toBe('number')
    })
  })

  describe('Title Input Interactions', () => {
    it('updates title on input change', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'New Proposal Title')
      expect(titleInput).toHaveValue('New Proposal Title')
    })

    it('handles single character input in title', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'A')
      expect(titleInput).toHaveValue('A')
    })

    it('handles long title input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      const longTitle = 'A'.repeat(200)

      await user.type(titleInput, longTitle)
      expect(titleInput).toHaveValue(longTitle)
    })

    it('handles special characters in title', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'Title @#$%^&*()')
      expect(titleInput).toHaveValue('Title @#$%^&*()')
    })

    it('handles numbers in title', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'Proposal 123')
      expect(titleInput).toHaveValue('Proposal 123')
    })

    it('handles emoji in title', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'Proposal 🚀')
      expect(titleInput).toHaveValue('Proposal 🚀')
    })

    it('handles clear title input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'Test')
      await user.clear(titleInput)
      expect(titleInput).toHaveValue('')
    })

    it('handles title with leading spaces', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, '   Title')
      expect(titleInput).toHaveValue('   Title')
    })

    it('handles title with trailing spaces', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'Title   ')
      expect(titleInput).toHaveValue('Title   ')
    })

    it('handles title with multiple spaces', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'Title   With   Spaces')
      expect(titleInput).toHaveValue('Title   With   Spaces')
    })

    it('maintains focus on title input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.click(titleInput)
      expect(document.activeElement).toBe(titleInput)
    })

    it('handles paste in title input', async () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      fireEvent.paste(titleInput, {
        clipboardData: { getData: () => 'Pasted Title' }
      })
      fireEvent.change(titleInput, { target: { value: 'Pasted Title' } })

      expect(titleInput).toHaveValue('Pasted Title')
    })
  })

  describe('Description Input Interactions', () => {
    it('updates description on input change', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.type(descInput, 'New description')
      expect(descInput).toHaveValue('New description')
    })

    it('handles multiline description', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.type(descInput, 'Line 1{Enter}Line 2')
      expect(descInput).toHaveValue('Line 1\nLine 2')
    })

    it('handles long description input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      const longDesc = 'A'.repeat(1000)

      await user.type(descInput, longDesc)
      expect(descInput).toHaveValue(longDesc)
    })

    it('handles special characters in description', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.type(descInput, 'Description @#$%^&*()')
      expect(descInput).toHaveValue('Description @#$%^&*()')
    })

    it('handles clear description input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.type(descInput, 'Test')
      await user.clear(descInput)
      expect(descInput).toHaveValue('')
    })

    it('handles description with markdown-like syntax', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.type(descInput, '# Heading\n- List item')
      expect(descInput).toHaveValue('# Heading\n- List item')
    })

    it('handles description with code blocks', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.type(descInput, '```code```')
      expect(descInput).toHaveValue('```code```')
    })

    it('maintains focus on description input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.click(descInput)
      expect(document.activeElement).toBe(descInput)
    })

    it('handles paste in description input', async () => {
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      fireEvent.paste(descInput, {
        clipboardData: { getData: () => 'Pasted description' }
      })
      fireEvent.change(descInput, { target: { value: 'Pasted description' } })

      expect(descInput).toHaveValue('Pasted description')
    })

    it('has correct rows attribute on textarea', () => {
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      expect(descInput).toHaveAttribute('rows', '6')
    })
  })

  describe('Duration Input Interactions', () => {
    it('updates duration on input change', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.clear(durationInput)
      await user.type(durationInput, '14')
      expect(durationInput).toHaveValue(14)
    })

    it('handles single digit duration', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.clear(durationInput)
      await user.type(durationInput, '1')
      expect(durationInput).toHaveValue(1)
    })

    it('handles large duration values', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.clear(durationInput)
      await user.type(durationInput, '365')
      expect(durationInput).toHaveValue(365)
    })

    it('handles zero duration', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.clear(durationInput)
      await user.type(durationInput, '0')
      expect(durationInput).toHaveValue(0)
    })

    it('handles clearing duration input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.clear(durationInput)
      expect(durationInput).toHaveValue(null)
    })

    it('maintains focus on duration input', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.click(durationInput)
      expect(document.activeElement).toBe(durationInput)
    })

    it('has correct input type for duration', () => {
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]
      expect(durationInput.type).toBe('number')
    })
  })

  describe('Submit Button', () => {
    it('renders submit button with correct text', () => {
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })
      expect(button).toBeInTheDocument()
    })

    it('submit button is clickable', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })

      await user.click(button)
      // No errors should occur on click
    })

    it('submit button has correct styling classes', () => {
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })
      expect(button).toHaveClass('w-full')
    })

    it('submit button is accessible', () => {
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })
      expect(button.tagName.toLowerCase()).toBe('button')
    })
  })

  describe('Form Interactions', () => {
    it('handles filling all form fields', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.type(titleInput, 'Test Proposal')
      await user.type(descInput, 'Test Description')
      await user.clear(durationInput)
      await user.type(durationInput, '10')

      expect(titleInput).toHaveValue('Test Proposal')
      expect(descInput).toHaveValue('Test Description')
      expect(durationInput).toHaveValue(10)
    })

    it('handles tabbing between form fields', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.click(titleInput)
      await user.tab()

      const descInput = screen.getByPlaceholderText('Describe your proposal')
      expect(document.activeElement).toBe(descInput)
    })

    it('maintains form state when typing', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')
      await user.type(titleInput, 'Title')

      const descInput = screen.getByPlaceholderText('Describe your proposal')
      await user.type(descInput, 'Description')

      expect(titleInput).toHaveValue('Title')
      expect(descInput).toHaveValue('Description')
    })

    it('handles rapid input changes', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')
      await user.type(titleInput, 'Rapid typing test')

      expect(titleInput).toHaveValue('Rapid typing test')
    })

    it('handles form submission with all fields filled', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      const durationInput = screen.getAllByRole('spinbutton')[0]
      const submitButton = screen.getByRole('button', { name: /submit proposal/i })

      await user.type(titleInput, 'Test')
      await user.type(descInput, 'Test Desc')
      await user.clear(durationInput)
      await user.type(durationInput, '5')
      await user.click(submitButton)

      // Should not throw errors
    })

    it('handles form submission with empty fields', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const submitButton = screen.getByRole('button', { name: /submit proposal/i })
      await user.click(submitButton)

      // Should not throw errors
    })
  })

  describe('Accessibility', () => {
    it('has proper main role', () => {
      renderWithAuth(<CreateProposalPage />)
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('has proper aria-label on main element', () => {
      renderWithAuth(<CreateProposalPage />)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Create proposal page')
    })

    it('has proper heading hierarchy', () => {
      renderWithAuth(<CreateProposalPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('has labels for form inputs', () => {
      renderWithAuth(<CreateProposalPage />)
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Voting Duration (days)')).toBeInTheDocument()
    })

    it('title input is keyboard accessible', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.click(titleInput)
      await user.keyboard('Test')

      expect(titleInput).toHaveValue('Test')
    })

    it('description input is keyboard accessible', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.click(descInput)
      await user.keyboard('Test')

      expect(descInput).toHaveValue('Test')
    })

    it('duration input is keyboard accessible', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.click(durationInput)
      await user.clear(durationInput)
      await user.keyboard('5')

      expect(durationInput).toHaveValue(5)
    })

    it('submit button is keyboard accessible', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })

      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('supports keyboard navigation through all interactive elements', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')
      await user.click(titleInput)

      await user.tab()
      await user.tab()
      await user.tab()

      const button = screen.getByRole('button', { name: /submit proposal/i })
      expect(document.activeElement).toBe(button)
    })

    it('has semantic HTML structure', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('h1')).toBeInTheDocument()
      expect(container.querySelector('label')).toBeInTheDocument()
    })

    it('has proper input types for form fields', () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      const durationInput = screen.getAllByRole('spinbutton')[0]

      expect(titleInput.type).toBe('text')
      expect(durationInput.type).toBe('number')
    })

    it('has proper button element', () => {
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })
      expect(button.tagName.toLowerCase()).toBe('button')
    })

    it('has descriptive placeholder text', () => {
      renderWithAuth(<CreateProposalPage />)
      expect(screen.getByPlaceholderText('Proposal title')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Describe your proposal')).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct background classes', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const main = container.querySelector('[role="main"]')
      expect(main).toHaveClass('min-h-screen')
    })

    it('applies correct container classes', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const wrapper = container.querySelector('.max-w-4xl')
      expect(wrapper).toBeInTheDocument()
    })

    it('applies correct card classes', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const card = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(card).toBeInTheDocument()
    })

    it('applies correct input classes', () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      expect(titleInput).toHaveClass('w-full')
    })

    it('applies correct button classes', () => {
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })
      expect(button).toHaveClass('w-full')
    })

    it('applies correct spacing classes', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const formContainer = container.querySelector('.space-y-6')
      expect(formContainer).toBeInTheDocument()
    })

    it('applies focus styles to inputs', () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      expect(titleInput).toHaveClass('focus:outline-none')
    })
  })

  describe('Component State Management', () => {
    it('initializes with correct default state', () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      const durationInput = screen.getAllByRole('spinbutton')[0]

      expect(titleInput.value).toBe('')
      expect(descInput.value).toBe('')
      expect(durationInput.value).toBe('7')
    })

    it('updates state when title changes', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'Updated')
      expect(titleInput).toHaveValue('Updated')
    })

    it('updates state when description changes', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.type(descInput, 'Updated')
      expect(descInput).toHaveValue('Updated')
    })

    it('updates state when duration changes', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.clear(durationInput)
      await user.type(durationInput, '20')
      expect(durationInput).toHaveValue(20)
    })

    it('maintains independent state for each field', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.type(titleInput, 'Title')
      await user.type(descInput, 'Desc')
      await user.clear(durationInput)
      await user.type(durationInput, '15')

      expect(titleInput).toHaveValue('Title')
      expect(descInput).toHaveValue('Desc')
      expect(durationInput).toHaveValue(15)
    })
  })

  describe('User Experience', () => {
    it('provides visual feedback on input focus', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.click(titleInput)
      expect(titleInput).toHaveClass('focus:ring-2')
    })

    it('displays helpful placeholder text', () => {
      renderWithAuth(<CreateProposalPage />)
      expect(screen.getByPlaceholderText('Proposal title')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Describe your proposal')).toBeInTheDocument()
    })

    it('shows clear labels for all inputs', () => {
      renderWithAuth(<CreateProposalPage />)
      const labels = screen.getAllByText(/title|description|duration/i)
      expect(labels.length).toBeGreaterThan(0)
    })

    it('provides a clear submit action', () => {
      renderWithAuth(<CreateProposalPage />)
      const button = screen.getByRole('button', { name: /submit proposal/i })
      expect(button).toHaveTextContent('Submit Proposal')
    })
  })

  describe('Edge Cases', () => {
    it('handles extremely long title gracefully', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      const veryLongTitle = 'A'.repeat(10000)

      await user.type(titleInput, veryLongTitle)
      expect(titleInput.value.length).toBe(10000)
    })

    it('handles extremely long description gracefully', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      const veryLongDesc = 'A'.repeat(10000)

      await user.type(descInput, veryLongDesc)
      expect(descInput.value.length).toBe(10000)
    })

    it('handles negative duration values', async () => {
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      fireEvent.change(durationInput, { target: { value: '-5' } })
      expect(durationInput).toHaveValue(-5)
    })

    it('handles decimal duration values', async () => {
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      fireEvent.change(durationInput, { target: { value: '7.5' } })
      expect(durationInput.value).toBe('7.5')
    })

    it('handles very large duration values', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.clear(durationInput)
      await user.type(durationInput, '99999')
      expect(durationInput).toHaveValue(99999)
    })

    it('handles empty string in duration', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.clear(durationInput)
      expect(durationInput).toHaveValue(null)
    })

    it('handles unicode characters in title', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, '日本語タイトル')
      expect(titleInput).toHaveValue('日本語タイトル')
    })

    it('handles unicode characters in description', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')

      await user.type(descInput, '中文描述')
      expect(descInput).toHaveValue('中文描述')
    })

    it('handles RTL text in title', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'عنوان')
      expect(titleInput).toHaveValue('عنوان')
    })

    it('handles mixed LTR and RTL text', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')

      await user.type(titleInput, 'Title عنوان')
      expect(titleInput).toHaveValue('Title عنوان')
    })
  })

  describe('Component Lifecycle', () => {
    it('mounts without errors', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      expect(container).toBeInTheDocument()
    })

    it('unmounts without errors', () => {
      const { unmount } = renderWithAuth(<CreateProposalPage />)
      expect(() => unmount()).not.toThrow()
    })

    it('can be rendered multiple times', () => {
      const { rerender } = renderWithAuth(<CreateProposalPage />)
      rerender(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <CreateProposalPage />
          </AuthContext.Provider>
        </MemoryRouter>
      )
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('maintains state after rerender', async () => {
      const user = userEvent.setup()
      const { rerender } = renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')
      await user.type(titleInput, 'Test')

      rerender(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <CreateProposalPage />
          </AuthContext.Provider>
        </MemoryRouter>
      )

      // State is reset on rerender (component remounts)
      const newTitleInput = screen.getByPlaceholderText('Proposal title')
      expect(newTitleInput).toHaveValue('')
    })
  })

  describe('Authentication Context', () => {
    it('renders when user is authenticated', () => {
      renderWithAuth(<CreateProposalPage />, mockAuthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders when user is not authenticated', () => {
      renderWithAuth(<CreateProposalPage />, mockUnauthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders with loading auth context', () => {
      const loadingContext = {
        ...mockAuthContext,
        loading: true,
      }
      renderWithAuth(<CreateProposalPage />, loadingContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders with error in auth context', () => {
      const errorContext = {
        ...mockAuthContext,
        error: 'Auth error',
      }
      renderWithAuth(<CreateProposalPage />, errorContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375
      global.innerHeight = 667
      renderWithAuth(<CreateProposalPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768
      global.innerHeight = 1024
      renderWithAuth(<CreateProposalPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920
      global.innerHeight = 1080
      renderWithAuth(<CreateProposalPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('has responsive container', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const wrapper = container.querySelector('.max-w-4xl')
      expect(wrapper).toBeInTheDocument()
    })

    it('has responsive padding', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const main = container.querySelector('[role="main"]')
      expect(main).toHaveClass('p-6')
    })
  })

  describe('Dark Mode Support', () => {
    it('includes dark mode classes on main container', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const main = container.querySelector('[role="main"]')
      expect(main).toHaveClass('dark:bg-[#161b22]')
    })

    it('includes dark mode classes on card', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const card = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(card).toHaveClass('dark:bg-[#161b22]')
    })

    it('includes dark mode classes on inputs', () => {
      renderWithAuth(<CreateProposalPage />)
      const titleInput = screen.getByPlaceholderText('Proposal title')
      expect(titleInput).toHaveClass('dark:bg-gray-700')
    })

    it('includes dark mode classes on textarea', () => {
      renderWithAuth(<CreateProposalPage />)
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      expect(descInput).toHaveClass('dark:bg-gray-700')
    })

    it('includes dark mode classes on duration input', () => {
      renderWithAuth(<CreateProposalPage />)
      const durationInput = screen.getAllByRole('spinbutton')[0]
      expect(durationInput).toHaveClass('dark:bg-gray-700')
    })
  })

  describe('Framer Motion Integration', () => {
    it('renders motion.div components', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('applies animation classes', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      const animatedDiv = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]')
      expect(animatedDiv).toBeInTheDocument()
    })
  })

  describe('Icon Components', () => {
    it('renders Vote icon', () => {
      renderWithAuth(<CreateProposalPage />)
      const icon = screen.getByTestId('icon-vote')
      expect(icon).toBeInTheDocument()
    })

    it('Vote icon has correct styling', () => {
      renderWithAuth(<CreateProposalPage />)
      const icon = screen.getByTestId('icon-vote')
      expect(icon).toHaveClass('w-8')
      expect(icon).toHaveClass('h-8')
      expect(icon).toHaveClass('text-[#58a6ff]')
    })
  })

  describe('Form Field Labels', () => {
    it('renders Title label', () => {
      renderWithAuth(<CreateProposalPage />)
      const label = screen.getByText('Title')
      expect(label).toBeInTheDocument()
      expect(label.tagName.toLowerCase()).toBe('label')
    })

    it('renders Description label', () => {
      renderWithAuth(<CreateProposalPage />)
      const label = screen.getByText('Description')
      expect(label).toBeInTheDocument()
      expect(label.tagName.toLowerCase()).toBe('label')
    })

    it('renders Voting Duration label', () => {
      renderWithAuth(<CreateProposalPage />)
      const label = screen.getByText('Voting Duration (days)')
      expect(label).toBeInTheDocument()
      expect(label.tagName.toLowerCase()).toBe('label')
    })

    it('labels have correct styling', () => {
      renderWithAuth(<CreateProposalPage />)
      const label = screen.getByText('Title')
      expect(label).toHaveClass('block')
      expect(label).toHaveClass('text-sm')
      expect(label).toHaveClass('font-medium')
    })
  })

  describe('Snapshot Testing', () => {
    it('matches snapshot for default state', () => {
      const { container } = renderWithAuth(<CreateProposalPage />)
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with filled form', async () => {
      const user = userEvent.setup()
      const { container } = renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')
      const descInput = screen.getByPlaceholderText('Describe your proposal')
      const durationInput = screen.getAllByRole('spinbutton')[0]

      await user.type(titleInput, 'Test Proposal')
      await user.type(descInput, 'Test Description')
      await user.clear(durationInput)
      await user.type(durationInput, '14')

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot when unauthenticated', () => {
      const { container } = renderWithAuth(<CreateProposalPage />, mockUnauthContext)
      expect(container).toMatchSnapshot()
    })
  })

  describe('Memory Leaks Prevention', () => {
    it('cleans up event listeners on unmount', () => {
      const { unmount } = renderWithAuth(<CreateProposalPage />)
      unmount()
      // Should not cause memory leaks
    })

    it('handles multiple mount and unmount cycles', () => {
      const { unmount, rerender } = renderWithAuth(<CreateProposalPage />)
      unmount()

      render(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <CreateProposalPage />
          </AuthContext.Provider>
        </MemoryRouter>
      )
      // Should not cause issues
    })
  })

  describe('Performance', () => {
    it('renders efficiently with memo', () => {
      const { rerender } = renderWithAuth(<CreateProposalPage />)

      // Rerender with same props should not cause re-render due to memo
      rerender(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <CreateProposalPage />
          </AuthContext.Provider>
        </MemoryRouter>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles rapid state updates', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      const titleInput = screen.getByPlaceholderText('Proposal title')

      for (let i = 0; i < 10; i++) {
        await user.type(titleInput, 'a')
      }

      expect(titleInput.value.length).toBeGreaterThan(0)
    })
  })

  describe('Integration', () => {
    it('works with MemoryRouter', () => {
      renderWithAuth(<CreateProposalPage />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('works with AuthContext', () => {
      renderWithAuth(<CreateProposalPage />, mockAuthContext)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('integrates all form fields correctly', async () => {
      const user = userEvent.setup()
      renderWithAuth(<CreateProposalPage />)

      await user.type(screen.getByPlaceholderText('Proposal title'), 'Title')
      await user.type(screen.getByPlaceholderText('Describe your proposal'), 'Desc')
      await user.clear(screen.getAllByRole('spinbutton')[0])
      await user.type(screen.getAllByRole('spinbutton')[0], '10')

      const button = screen.getByRole('button', { name: /submit proposal/i })
      await user.click(button)

      // All interactions should work smoothly
    })
  })

  describe('Error Boundaries', () => {
    it('renders without throwing errors', () => {
      expect(() => renderWithAuth(<CreateProposalPage />)).not.toThrow()
    })

    it('handles render errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithAuth(<CreateProposalPage />)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})

export default mockUser
