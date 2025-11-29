/**
 * CRYB Platform - LoginPage Comprehensive Test Suite
 * Tests for LoginPage component with full coverage
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { AuthContext } from '../../contexts/AuthContext';
import webAuthnService from '../../services/webAuthnService';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: ({ className, ...props }) => <svg data-testid="mail-icon" className={className} {...props} />,
  Lock: ({ className, ...props }) => <svg data-testid="lock-icon" className={className} {...props} />,
  Eye: ({ className, ...props }) => <svg data-testid="eye-icon" className={className} {...props} />,
  EyeOff: ({ className, ...props }) => <svg data-testid="eye-off-icon" className={className} {...props} />,
  ArrowRight: ({ className, ...props }) => <svg data-testid="arrow-right-icon" className={className} {...props} />,
  Sparkles: ({ className, ...props }) => <svg data-testid="sparkles-icon" className={className} {...props} />,
  Fingerprint: ({ className, ...props }) => <svg data-testid="fingerprint-icon" className={className} {...props} />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock services
jest.mock('../../services/webAuthnService');

// Mock navigate
const mockNavigate = jest.fn();
const mockLocation = { state: null };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const renderWithRouter = (authValue = mockAuthContext, initialEntries = ['/login']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={authValue}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('LoginPage - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    webAuthnService.isSupported = jest.fn().mockReturnValue(true);
    webAuthnService.authenticate = jest.fn();
    localStorage.clear();
    mockNavigate.mockClear();
    mockLocation.state = null;
  });

  // ==================== Page Rendering ====================
  describe('Page Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders the login page heading', () => {
      renderWithRouter();
      expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    });

    it('displays the platform tagline', () => {
      renderWithRouter();
      expect(screen.getByText(/Sign in to continue to CRYB/i)).toBeInTheDocument();
    });

    it('renders the logo icon', () => {
      renderWithRouter();
      expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper page structure with main landmark', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Login page');
    });
  });

  // ==================== Email Input ====================
  describe('Email/Username Input', () => {
    it('displays email input field', () => {
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('email input has correct type attribute', () => {
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('email input has placeholder text', () => {
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
    });

    it('email input has autocomplete attribute', () => {
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });

    it('allows typing in email field', async () => {
      const user = userEvent.setup();
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);

      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('displays email icon in input field', () => {
      renderWithRouter();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('clears error when typing in email field', async () => {
      const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== Password Input ====================
  describe('Password Input', () => {
    it('displays password input field', () => {
      renderWithRouter();
      const passwordInput = screen.getByLabelText(/^Password$/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('password input has correct type attribute', () => {
      renderWithRouter();
      const passwordInput = screen.getByLabelText(/^Password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('password input has placeholder text', () => {
      renderWithRouter();
      const passwordInput = screen.getByLabelText(/^Password$/i);
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password');
    });

    it('password input has autocomplete attribute', () => {
      renderWithRouter();
      const passwordInput = screen.getByLabelText(/^Password$/i);
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('allows typing in password field', async () => {
      const user = userEvent.setup();
      renderWithRouter();
      const passwordInput = screen.getByLabelText(/^Password$/i);

      await user.type(passwordInput, 'mypassword123');
      expect(passwordInput).toHaveValue('mypassword123');
    });

    it('displays lock icon in password field', () => {
      renderWithRouter();
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });

    it('clears error when typing in password field', async () => {
      const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== Password Visibility Toggle ====================
  describe('Password Visibility Toggle', () => {
    it('displays password visibility toggle button', () => {
      renderWithRouter();
      const toggleButton = screen.getByRole('button', { name: /Show password/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('shows Eye icon when password is hidden', () => {
      renderWithRouter();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('toggles password visibility when clicked', async () => {
      renderWithRouter();
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const toggleButton = screen.getByRole('button', { name: /Show password/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text');
      });
    });

    it('shows EyeOff icon when password is visible', async () => {
      renderWithRouter();
      const toggleButton = screen.getByRole('button', { name: /Show password/i });

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
      });
    });

    it('updates aria-label when toggling password visibility', async () => {
      renderWithRouter();
      const toggleButton = screen.getByRole('button', { name: /Show password/i });

      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Hide password/i })).toBeInTheDocument();
      });
    });

    it('can toggle password visibility multiple times', async () => {
      renderWithRouter();
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const toggleButton = screen.getByRole('button', { name: /Show password/i });

      fireEvent.click(toggleButton);
      await waitFor(() => expect(passwordInput).toHaveAttribute('type', 'text'));

      fireEvent.click(toggleButton);
      await waitFor(() => expect(passwordInput).toHaveAttribute('type', 'password'));

      fireEvent.click(toggleButton);
      await waitFor(() => expect(passwordInput).toHaveAttribute('type', 'text'));
    });
  });

  // ==================== Remember Me Checkbox ====================
  describe('Remember Me Checkbox', () => {
    it('displays remember me checkbox', () => {
      renderWithRouter();
      expect(screen.getByLabelText(/Remember me/i)).toBeInTheDocument();
    });

    it('remember me checkbox is unchecked by default', () => {
      renderWithRouter();
      const checkbox = screen.getByLabelText(/Remember me/i);
      expect(checkbox).not.toBeChecked();
    });

    it('allows checking the remember me checkbox', async () => {
      const user = userEvent.setup();
      renderWithRouter();
      const checkbox = screen.getByLabelText(/Remember me/i);

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('allows unchecking the remember me checkbox', async () => {
      const user = userEvent.setup();
      renderWithRouter();
      const checkbox = screen.getByLabelText(/Remember me/i);

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  // ==================== Login Button ====================
  describe('Login Button', () => {
    it('displays sign in button', () => {
      renderWithRouter();
      expect(screen.getByRole('button', { name: /Sign in to your account/i })).toBeInTheDocument();
    });

    it('sign in button has correct text', () => {
      renderWithRouter();
      const button = screen.getByRole('button', { name: /Sign in to your account/i });
      expect(button).toHaveTextContent('Sign in');
    });

    it('displays arrow icon in sign in button', () => {
      renderWithRouter();
      expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
    });

    it('sign in button is enabled by default', () => {
      renderWithRouter();
      const button = screen.getByRole('button', { name: /Sign in to your account/i });
      expect(button).not.toBeDisabled();
    });
  });

  // ==================== Form Validation ====================
  describe('Form Validation', () => {
    it('email field is required', () => {
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toBeRequired();
      expect(emailInput).toHaveAttribute('aria-required', 'true');
    });

    it('password field is required', () => {
      renderWithRouter();
      const passwordInput = screen.getByLabelText(/^Password$/i);
      expect(passwordInput).toBeRequired();
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });

    it('validates email format with HTML5 validation', () => {
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('sets aria-invalid on error', async () => {
      const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('sets aria-invalid to false when no error', () => {
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);

      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
    });
  });

  // ==================== Login Submission ====================
  describe('Login Submission', () => {
    it('handles form submission with valid credentials', async () => {
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('calls login function only once on submit', async () => {
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(loginMock).toHaveBeenCalledTimes(1);
      });
    });

    it('prevents default form submission', async () => {
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const form = emailInput.closest('form');

      const preventDefaultSpy = jest.fn();
      form.addEventListener('submit', preventDefaultSpy);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.submit(form);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  // ==================== Success Handling ====================
  describe('Success Handling', () => {
    it('redirects to home on successful login', async () => {
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
      });
    });

    it('redirects to previous location if provided', async () => {
      mockLocation.state = { from: { pathname: '/profile' } };
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
      });
    });

    it('uses replace navigation on successful login', async () => {
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.any(String), { replace: true });
      });
    });
  });

  // ==================== Error Handling ====================
  describe('Error Handling', () => {
    it('displays error message on login failure', async () => {
      const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('displays error in alert role element', async () => {
      const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('displays default error message when error has no message', async () => {
      const loginMock = jest.fn().mockRejectedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Login failed. Please check your credentials./i)).toBeInTheDocument();
      });
    });

    it('handles network error gracefully', async () => {
      const loginMock = jest.fn().mockRejectedValue(new Error('Network error'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('clears previous error on new submission', async () => {
      const loginMock = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockRejectedValueOnce(new Error('Second error'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/First error/i)).toBeInTheDocument();
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/First error/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Second error/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== Loading States ====================
  describe('Loading States', () => {
    it('shows loading state during login', async () => {
      const loginMock = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Signing in.../i)).toBeInTheDocument();
      });
    });

    it('disables submit button during login', async () => {
      const loginMock = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('restores button state after login completes', async () => {
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(loginMock).toHaveBeenCalled();
      });
    });

    it('hides arrow icon during loading', async () => {
      const loginMock = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('arrow-right-icon')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== Forgot Password Link ====================
  describe('Forgot Password Link', () => {
    it('displays forgot password link', () => {
      renderWithRouter();
      expect(screen.getByRole('link', { name: /Forgot password/i })).toBeInTheDocument();
    });

    it('forgot password link points to correct route', () => {
      renderWithRouter();
      const link = screen.getByRole('link', { name: /Forgot password/i });
      expect(link).toHaveAttribute('href', '/password-reset');
    });
  });

  // ==================== Sign Up Link ====================
  describe('Sign Up Link', () => {
    it('displays sign up link', () => {
      renderWithRouter();
      expect(screen.getByRole('link', { name: /Sign up for free/i })).toBeInTheDocument();
    });

    it('sign up link points to correct route', () => {
      renderWithRouter();
      const link = screen.getByRole('link', { name: /Sign up for free/i });
      expect(link).toHaveAttribute('href', '/register');
    });

    it('displays sign up prompt text', () => {
      renderWithRouter();
      expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
    });
  });

  // ==================== Passkey Authentication (WebAuthn) ====================
  describe('Passkey Authentication', () => {
    it('shows passkey login button when supported', () => {
      webAuthnService.isSupported.mockReturnValue(true);
      renderWithRouter();
      expect(screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i })).toBeInTheDocument();
    });

    it('hides passkey button when not supported', () => {
      webAuthnService.isSupported.mockReturnValue(false);
      renderWithRouter();
      expect(screen.queryByRole('button', { name: /Sign in with Passkey biometric authentication/i })).not.toBeInTheDocument();
    });

    it('displays fingerprint icon in passkey button', () => {
      webAuthnService.isSupported.mockReturnValue(true);
      renderWithRouter();
      expect(screen.getByTestId('fingerprint-icon')).toBeInTheDocument();
    });

    it('handles passkey authentication success', async () => {
      webAuthnService.isSupported.mockReturnValue(true);
      webAuthnService.authenticate.mockResolvedValue({
        success: true,
        token: 'mock-passkey-token',
      });
      renderWithRouter();

      const passkeyButton = screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i });
      fireEvent.click(passkeyButton);

      await waitFor(() => {
        expect(webAuthnService.authenticate).toHaveBeenCalled();
        expect(localStorage.getItem('token')).toBe('mock-passkey-token');
        expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
      });
    });

    it('handles passkey authentication failure', async () => {
      webAuthnService.isSupported.mockReturnValue(true);
      webAuthnService.authenticate.mockResolvedValue({
        success: false,
        error: 'Passkey verification failed',
      });
      renderWithRouter();

      const passkeyButton = screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i });
      fireEvent.click(passkeyButton);

      await waitFor(() => {
        expect(screen.getByText(/Passkey verification failed/i)).toBeInTheDocument();
      });
    });

    it('handles passkey authentication exception', async () => {
      webAuthnService.isSupported.mockReturnValue(true);
      webAuthnService.authenticate.mockRejectedValue(new Error('WebAuthn error'));
      renderWithRouter();

      const passkeyButton = screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i });
      fireEvent.click(passkeyButton);

      await waitFor(() => {
        expect(screen.getByText(/Passkey authentication failed. Please try regular login./i)).toBeInTheDocument();
      });
    });

    it('shows loading state during passkey authentication', async () => {
      webAuthnService.isSupported.mockReturnValue(true);
      webAuthnService.authenticate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithRouter();

      const passkeyButton = screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i });
      fireEvent.click(passkeyButton);

      await waitFor(() => {
        expect(screen.getByText(/Authenticating.../i)).toBeInTheDocument();
      });
    });

    it('disables passkey button during passkey authentication', async () => {
      webAuthnService.isSupported.mockReturnValue(true);
      webAuthnService.authenticate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithRouter();

      const passkeyButton = screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i });
      fireEvent.click(passkeyButton);

      await waitFor(() => {
        expect(passkeyButton).toBeDisabled();
      });
    });

    it('disables regular login during passkey authentication', async () => {
      webAuthnService.isSupported.mockReturnValue(true);
      webAuthnService.authenticate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderWithRouter();

      const passkeyButton = screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i });
      const loginButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.click(passkeyButton);

      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });
    });

    it('redirects to previous location after passkey success', async () => {
      mockLocation.state = { from: { pathname: '/settings' } };
      webAuthnService.isSupported.mockReturnValue(true);
      webAuthnService.authenticate.mockResolvedValue({
        success: true,
        token: 'mock-passkey-token',
      });
      renderWithRouter();

      const passkeyButton = screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i });
      fireEvent.click(passkeyButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true });
      });
    });

    it('clears error when starting passkey authentication', async () => {
      webAuthnService.isSupported.mockReturnValue(true);
      const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      // First trigger a regular login error
      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });

      // Now try passkey authentication
      webAuthnService.authenticate.mockResolvedValue({
        success: true,
        token: 'mock-token',
      });

      const passkeyButton = screen.getByRole('button', { name: /Sign in with Passkey biometric authentication/i });
      fireEvent.click(passkeyButton);

      await waitFor(() => {
        expect(screen.queryByText(/Invalid credentials/i)).not.toBeInTheDocument();
      });
    });
  });

  // ==================== Already Logged In Redirect ====================
  describe('Already Logged In Redirect', () => {
    it('redirects to home if already authenticated', async () => {
      renderWithRouter({ ...mockAuthContext, isAuthenticated: true, loading: false });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
      });
    });

    it('redirects to previous location if already authenticated', async () => {
      mockLocation.state = { from: { pathname: '/dashboard' } };
      renderWithRouter({ ...mockAuthContext, isAuthenticated: true, loading: false });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('does not redirect while auth is loading', () => {
      renderWithRouter({ ...mockAuthContext, isAuthenticated: false, loading: true });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect when not authenticated', () => {
      renderWithRouter({ ...mockAuthContext, isAuthenticated: false, loading: false });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ==================== Enter Key Submission ====================
  describe('Enter Key Submission', () => {
    it('submits form when Enter is pressed in email field', async () => {
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const form = emailInput.closest('form');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.keyDown(emailInput, { key: 'Enter', code: 'Enter' });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('submits form when Enter is pressed in password field', async () => {
      const loginMock = jest.fn().mockResolvedValue({});
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const form = passwordInput.closest('form');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  // ==================== Accessibility ====================
  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithRouter();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remember me/i)).toBeInTheDocument();
    });

    it('all form inputs have associated labels', () => {
      renderWithRouter();
      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    it('has proper ARIA labels on buttons', () => {
      renderWithRouter();
      expect(screen.getByRole('button', { name: /Sign in to your account/i })).toHaveAttribute('aria-label');
    });

    it('icons have aria-hidden attribute', () => {
      renderWithRouter();
      // Check that SVG icons have aria-hidden
      expect(screen.getByTestId('mail-icon')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('lock-icon')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('eye-icon')).toHaveAttribute('aria-hidden', 'true');
    });

    it('error message has proper ARIA attributes', async () => {
      const loginMock = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      renderWithRouter({ ...mockAuthContext, login: loginMock });

      const emailInput = screen.getByLabelText(/Email/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitButton = screen.getByRole('button', { name: /Sign in to your account/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter();
      const heading = screen.getByRole('heading', { name: /Welcome back/i });
      expect(heading.tagName).toBe('H1');
    });

    it('password toggle button has descriptive aria-label', () => {
      renderWithRouter();
      const toggleButton = screen.getByRole('button', { name: /Show password/i });
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
    });
  });

  // ==================== Additional Features ====================
  describe('Additional Features', () => {
    it('displays back to home link', () => {
      renderWithRouter();
      expect(screen.getByRole('link', { name: /Back to home/i })).toBeInTheDocument();
    });

    it('back to home link points to root path', () => {
      renderWithRouter();
      const link = screen.getByRole('link', { name: /Back to home/i });
      expect(link).toHaveAttribute('href', '/');
    });

    it('displays divider between login methods', () => {
      webAuthnService.isSupported = jest.fn().mockReturnValue(true);
      renderWithRouter();
      const dividers = screen.getAllByText(/^or$/i);
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('displays section dividers on page', () => {
      webAuthnService.isSupported = jest.fn().mockReturnValue(false);
      renderWithRouter();
      const dividers = screen.getAllByText(/^or$/i);
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  // ==================== Page Metadata ====================
  describe('Page Metadata', () => {
    it('has proper main landmark role', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('main landmark has descriptive aria-label', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Login page');
    });

    it('has semantic HTML structure', () => {
      renderWithRouter();
      const main = screen.getByRole('main');
      const heading = screen.getByRole('heading', { name: /Welcome back/i });

      expect(main).toContainElement(heading);
    });
  });
});

export default mockNavigate
