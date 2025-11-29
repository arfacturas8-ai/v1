/**
 * CRYB Platform - Comprehensive RegisterPage Test Suite
 * 80+ tests covering all functionality, validation, and accessibility
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

jest.mock('lucide-react', () => ({
  Mail: () => <svg data-testid="mail-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
  Eye: () => <svg data-testid="eye-icon" />,
  EyeOff: () => <svg data-testid="eye-off-icon" />,
  User: () => <svg data-testid="user-icon" />,
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  Sparkles: () => <svg data-testid="sparkles-icon" />,
  Check: () => <svg data-testid="check-icon" />,
}));

// Mock AuthContext
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  signup: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper to render with router and auth context
const renderWithProviders = (authValue = mockAuthContext) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <RegisterPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('RegisterPage - Page Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders();
    expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument();
  });

  it('has proper page role and aria-label', () => {
    renderWithProviders();
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Registration page');
  });

  it('displays the CRYB logo/icon', () => {
    renderWithProviders();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('displays the tagline "Join CRYB and start connecting"', () => {
    renderWithProviders();
    expect(screen.getByText(/Join CRYB and start connecting/i)).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('displays animated background elements', () => {
    renderWithProviders();
    const backgrounds = screen.getAllByRole('main')[0].querySelectorAll('[aria-hidden="true"]');
    expect(backgrounds.length).toBeGreaterThan(0);
  });
});

describe('RegisterPage - Username Input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders username input field', () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('type', 'text');
  });

  it('has username icon', () => {
    renderWithProviders();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('has placeholder text', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText(/Choose a username/i)).toBeInTheDocument();
  });

  it('has username hint text', () => {
    renderWithProviders();
    expect(screen.getByText(/At least 3 characters/i)).toBeInTheDocument();
  });

  it('accepts text input for username', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    await userEvent.type(usernameInput, 'testuser');
    expect(usernameInput).toHaveValue('testuser');
  });

  it('has required attribute on username field', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Username$/i)).toBeRequired();
  });

  it('has minLength attribute of 3', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Username$/i)).toHaveAttribute('minLength', '3');
  });

  it('has autocomplete attribute', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Username$/i)).toHaveAttribute('autoComplete', 'username');
  });

  it('shows validation error for username less than 3 characters', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'ab');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('clears error when username is corrected', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);

    await userEvent.type(usernameInput, 'ab');
    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, 'validuser');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('has aria-invalid attribute when username error exists', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'ab');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

describe('RegisterPage - Email Input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email input field', () => {
    renderWithProviders();
    const emailInput = screen.getByLabelText(/^Email$/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('has email icon', () => {
    renderWithProviders();
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('has placeholder text', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  it('accepts email input', async () => {
    renderWithProviders();
    const emailInput = screen.getByLabelText(/^Email$/i);
    await userEvent.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('has required attribute on email field', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Email$/i)).toBeRequired();
  });

  it('has autocomplete attribute', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Email$/i)).toHaveAttribute('autoComplete', 'email');
  });

  it('validates invalid email format', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('accepts valid email formats', async () => {
    renderWithProviders();
    const emailInput = screen.getByLabelText(/^Email$/i);

    await userEvent.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'user.name+tag@example.co.uk');
    expect(emailInput).toHaveValue('user.name+tag@example.co.uk');
  });

  it('has aria-invalid attribute when email error exists', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'invalid');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

describe('RegisterPage - Password Input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders password input field', () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('has lock icon', () => {
    renderWithProviders();
    const lockIcons = screen.getAllByTestId('lock-icon');
    expect(lockIcons.length).toBeGreaterThan(0);
  });

  it('has placeholder text', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText(/Create a strong password/i)).toBeInTheDocument();
  });

  it('accepts password input', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'SecurePass123!');
    expect(passwordInput).toHaveValue('SecurePass123!');
  });

  it('has required attribute on password field', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Password$/i)).toBeRequired();
  });

  it('has minLength attribute of 8', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Password$/i)).toHaveAttribute('minLength', '8');
  });

  it('has autocomplete attribute', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Password$/i)).toHaveAttribute('autoComplete', 'new-password');
  });

  it('validates password minimum length', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'short');
    await userEvent.type(confirmPasswordInput, 'short');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('has aria-describedby linking to password strength', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Password$/i)).toHaveAttribute('aria-describedby', 'password-strength');
  });
});

describe('RegisterPage - Password Strength Indicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not show strength indicator when password is empty', () => {
    renderWithProviders();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows weak indicator for short passwords', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'weak');

    await waitFor(() => {
      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });
  });

  it('shows weak indicator for passwords under 8 characters', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'Pass1!');

    await waitFor(() => {
      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });
  });

  it('shows medium indicator for moderate passwords', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'Password123');

    await waitFor(() => {
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });
  });

  it('shows strong indicator for strong passwords', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'StrongPassword123!');

    await waitFor(() => {
      expect(screen.getByText(/Strong/i)).toBeInTheDocument();
    });
  });

  it('has role="status" and aria-live="polite" for accessibility', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'password');

    await waitFor(() => {
      const strengthIndicator = screen.getByRole('status');
      expect(strengthIndicator).toHaveAttribute('aria-live', 'polite');
    });
  });

  it('shows recommendation text', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'password');

    await waitFor(() => {
      expect(screen.getByText(/At least 8 characters recommended/i)).toBeInTheDocument();
    });
  });

  it('calculates strength based on length', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);

    await userEvent.type(passwordInput, 'abcdefgh');
    await waitFor(() => {
      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });

    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'abcdefghijklm');
    await waitFor(() => {
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });
  });

  it('calculates strength based on mixed case', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'Password12345');

    await waitFor(() => {
      const strengthText = screen.getByText(/Medium|Strong/i);
      expect(strengthText).toBeInTheDocument();
    });
  });

  it('calculates strength based on numbers', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'password123');

    await waitFor(() => {
      expect(screen.getByText(/Weak|Medium/i)).toBeInTheDocument();
    });
  });

  it('calculates strength based on special characters', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    await userEvent.type(passwordInput, 'Password123!@#');

    await waitFor(() => {
      expect(screen.getByText(/Strong/i)).toBeInTheDocument();
    });
  });

  it('updates strength indicator dynamically as user types', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);

    await userEvent.type(passwordInput, 'pass');
    await waitFor(() => {
      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });

    await userEvent.type(passwordInput, 'word123!');
    await waitFor(() => {
      expect(screen.getByText(/Medium|Weak/i)).toBeInTheDocument();
    });
  });
});

describe('RegisterPage - Confirm Password Input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders confirm password input field', () => {
    renderWithProviders();
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('has placeholder text', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
  });

  it('accepts password input', async () => {
    renderWithProviders();
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    await userEvent.type(confirmPasswordInput, 'SecurePass123!');
    expect(confirmPasswordInput).toHaveValue('SecurePass123!');
  });

  it('has required attribute', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeRequired();
  });

  it('has autocomplete attribute', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/Confirm Password/i)).toHaveAttribute('autoComplete', 'new-password');
  });

  it('validates password match', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'DifferentPassword123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('has aria-invalid attribute when passwords do not match', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Different123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

describe('RegisterPage - Password Visibility Toggles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has toggle button for password field', () => {
    renderWithProviders();
    const toggleButtons = screen.getAllByRole('button', { name: /password/i });
    expect(toggleButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('toggles password visibility when clicked', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const toggleButton = screen.getByRole('button', { name: /Show password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  it('has accessible label for password toggle', () => {
    renderWithProviders();
    expect(screen.getByRole('button', { name: /Show password/i })).toBeInTheDocument();
  });

  it('changes toggle button label when password is visible', async () => {
    renderWithProviders();
    const toggleButton = screen.getByRole('button', { name: /Show password/i });

    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Hide password/i })).toBeInTheDocument();
    });
  });

  it('toggles confirm password visibility when clicked', async () => {
    renderWithProviders();
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const toggleButton = screen.getByRole('button', { name: /Show confirm password/i });

    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  it('has accessible label for confirm password toggle', () => {
    renderWithProviders();
    expect(screen.getByRole('button', { name: /Show confirm password/i })).toBeInTheDocument();
  });

  it('shows eye icon when password is hidden', () => {
    renderWithProviders();
    expect(screen.getAllByTestId('eye-icon').length).toBeGreaterThan(0);
  });

  it('shows eye-off icon when password is visible', async () => {
    renderWithProviders();
    const toggleButton = screen.getByRole('button', { name: /Show password/i });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getAllByTestId('eye-off-icon').length).toBeGreaterThan(0);
    });
  });
});

describe('RegisterPage - Terms of Service Checkbox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders terms checkbox', () => {
    renderWithProviders();
    const checkbox = screen.getByLabelText(/I agree to the/i);
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('has required attribute', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/I agree to the/i)).toBeRequired();
  });

  it('is unchecked by default', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/I agree to the/i)).not.toBeChecked();
  });

  it('can be checked', async () => {
    renderWithProviders();
    const checkbox = screen.getByLabelText(/I agree to the/i);
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('can be unchecked after being checked', async () => {
    renderWithProviders();
    const checkbox = screen.getByLabelText(/I agree to the/i);
    await userEvent.click(checkbox);
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('displays Terms of Service link', () => {
    renderWithProviders();
    const termsLink = screen.getByRole('link', { name: /Terms of Service/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  it('displays Privacy Policy link', () => {
    renderWithProviders();
    const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('validates terms acceptance on submit', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/accept the Terms of Service/i)).toBeInTheDocument();
    });
  });

  it('has aria-invalid attribute when terms not accepted', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(termsCheckbox).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

describe('RegisterPage - Register Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders register button', () => {
    renderWithProviders();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('has submit type', () => {
    renderWithProviders();
    const button = screen.getByRole('button', { name: /Create account/i });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('has arrow icon when not loading', () => {
    renderWithProviders();
    expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
  });

  it('shows "Creating account..." text when loading', async () => {
    const signupMock = jest.fn(() => new Promise(() => {}));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Creating account.../i)).toBeInTheDocument();
    });
  });

  it('is disabled when loading', async () => {
    const signupMock = jest.fn(() => new Promise(() => {}));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creating account.../i })).toBeDisabled();
    });
  });

  it('has aria-label attribute', () => {
    renderWithProviders();
    const button = screen.getByRole('button', { name: /Create account/i });
    expect(button).toHaveAttribute('aria-label', 'Create your account');
  });
});

describe('RegisterPage - Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates all required fields are filled', async () => {
    renderWithProviders();
    const submitButton = screen.getByRole('button', { name: /Create account/i });
    await userEvent.click(submitButton);

    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);

    expect(usernameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(confirmPasswordInput).toBeRequired();
    expect(termsCheckbox).toBeRequired();
  });

  it('clears error message when user starts typing', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'ab');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
    });

    await userEvent.type(usernameInput, 'c');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('performs validation in correct order', async () => {
    renderWithProviders();
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    // Test username validation first
    await userEvent.type(screen.getByLabelText(/^Username$/i), 'ab');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });
});

describe('RegisterPage - Registration Submission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls signup with correct parameters', async () => {
    const signupMock = jest.fn().mockResolvedValue({});
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalledWith('test@example.com', 'Password123!', 'testuser');
    });
  });

  it('prevents default form submission', async () => {
    const signupMock = jest.fn().mockResolvedValue({});
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    const form = screen.getByRole('button', { name: /Create account/i }).closest('form');
    const preventDefaultSpy = jest.fn();

    form.addEventListener('submit', preventDefaultSpy);

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalled();
    });
  });

  it('does not submit if validation fails', async () => {
    const signupMock = jest.fn().mockResolvedValue({});
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'ab');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
    });

    expect(signupMock).not.toHaveBeenCalled();
  });
});

describe('RegisterPage - Success Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to /home on successful registration', async () => {
    const signupMock = jest.fn().mockResolvedValue({});
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });
  });

  it('uses replace: true to prevent back navigation to registration', async () => {
    const signupMock = jest.fn().mockResolvedValue({});
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });
  });
});

describe('RegisterPage - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays error message on registration failure', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error('Registration failed'));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
    });
  });

  it('displays username taken error', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error('Username already taken'));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'existinguser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Username already taken/i)).toBeInTheDocument();
    });
  });

  it('displays email exists error', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error('Email already exists'));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'existing@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });

  it('displays generic error when error message is not provided', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error());
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Registration failed. Please try again./i)).toBeInTheDocument();
    });
  });

  it('error message has role="alert"', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error('Test error'));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('error message has aria-live="assertive"', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error('Test error'));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  it('resets loading state after error', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error('Test error'));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create account/i })).not.toBeDisabled();
    });
  });
});

describe('RegisterPage - Loading States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state during registration', async () => {
    const signupMock = jest.fn(() => new Promise(() => {}));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Creating account.../i)).toBeInTheDocument();
    });
  });

  it('disables button during loading', async () => {
    const signupMock = jest.fn(() => new Promise(() => {}));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creating account.../i })).toBeDisabled();
    });
  });

  it('button has aria-busy attribute when loading', async () => {
    const signupMock = jest.fn(() => new Promise(() => {}));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Creating account.../i });
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  it('redirects authenticated users immediately', () => {
    renderWithProviders({
      ...mockAuthContext,
      isAuthenticated: true,
      loading: false,
    });

    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
  });

  it('does not redirect if auth is still loading', () => {
    renderWithProviders({
      ...mockAuthContext,
      isAuthenticated: true,
      loading: true,
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('RegisterPage - Login Link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays login link', () => {
    renderWithProviders();
    expect(screen.getByText(/Already have an account?/i)).toBeInTheDocument();
  });

  it('login link navigates to /login', () => {
    renderWithProviders();
    const loginLink = screen.getByRole('link', { name: /Sign in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('has proper styling for login link', () => {
    renderWithProviders();
    const loginLink = screen.getByRole('link', { name: /Sign in/i });
    expect(loginLink).toHaveClass('text-[#58a6ff]');
  });
});

describe('RegisterPage - Navigation Links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays back to home link', () => {
    renderWithProviders();
    expect(screen.getByRole('link', { name: /Back to home/i })).toBeInTheDocument();
  });

  it('back to home link navigates to /', () => {
    renderWithProviders();
    const homeLink = screen.getByRole('link', { name: /Back to home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('displays divider with "or" text', () => {
    renderWithProviders();
    expect(screen.getByText(/^or$/i)).toBeInTheDocument();
  });
});

describe('RegisterPage - Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('all form fields have labels', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('all required fields have aria-required', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/^Username$/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/^Email$/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/^Password$/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/Confirm Password/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/I agree to the/i)).toHaveAttribute('aria-required', 'true');
  });

  it('all icons have aria-hidden', () => {
    renderWithProviders();
    const icons = screen.getAllByRole('img', { hidden: true });
    icons.forEach(icon => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('password visibility buttons have accessible labels', () => {
    renderWithProviders();
    expect(screen.getByRole('button', { name: /Show password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show confirm password/i })).toBeInTheDocument();
  });

  it('form has proper heading hierarchy', () => {
    renderWithProviders();
    const heading = screen.getByRole('heading', { name: /Create your account/i });
    expect(heading.tagName).toBe('H1');
  });

  it('username field has aria-describedby for hint', () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    expect(usernameInput).toHaveAttribute('aria-describedby', 'username-hint');
    expect(screen.getByText(/At least 3 characters/i)).toHaveAttribute('id', 'username-hint');
  });

  it('error messages are announced with aria-live', async () => {
    const signupMock = jest.fn().mockRejectedValue(new Error('Test error'));
    renderWithProviders({ ...mockAuthContext, signup: signupMock });

    await userEvent.type(screen.getByLabelText(/^Username$/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/^Email$/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
    await userEvent.click(screen.getByLabelText(/I agree to the/i));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  it('decorative background has aria-hidden', () => {
    renderWithProviders();
    const main = screen.getByRole('main');
    const backgrounds = main.querySelectorAll('[aria-hidden="true"]');
    expect(backgrounds.length).toBeGreaterThan(0);
  });
});

describe('RegisterPage - Real-time Validation Feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates password strength in real-time', async () => {
    renderWithProviders();
    const passwordInput = screen.getByLabelText(/^Password$/i);

    await userEvent.type(passwordInput, 'weak');
    await waitFor(() => {
      expect(screen.getByText(/Weak/i)).toBeInTheDocument();
    });

    await userEvent.type(passwordInput, 'Password123!');
    await waitFor(() => {
      expect(screen.getByText(/Strong|Medium/i)).toBeInTheDocument();
    });
  });

  it('clears errors when user modifies input', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'ab');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');
    await userEvent.click(termsCheckbox);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
    });

    await userEvent.type(usernameInput, 'c');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows appropriate aria-invalid states during validation', async () => {
    renderWithProviders();
    const usernameInput = screen.getByLabelText(/^Username$/i);
    const emailInput = screen.getByLabelText(/^Email$/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const submitButton = screen.getByRole('button', { name: /Create account/i });

    await userEvent.type(usernameInput, 'ab');
    await userEvent.type(emailInput, 'invalid');
    await userEvent.type(passwordInput, 'short');
    await userEvent.type(confirmPasswordInput, 'different');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

export default mockAuthContext
