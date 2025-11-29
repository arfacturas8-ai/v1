/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from './ForgotPasswordPage';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: ({ size, ...props }) => (
    <svg data-testid="mail-icon" {...props}>
      <title>Mail Icon</title>
    </svg>
  ),
  ArrowLeft: ({ size, ...props }) => (
    <svg data-testid="arrow-left-icon" {...props}>
      <title>Arrow Left Icon</title>
    </svg>
  ),
  CheckCircle: ({ size, color, ...props }) => (
    <svg data-testid="check-circle-icon" {...props}>
      <title>Check Circle Icon</title>
    </svg>
  ),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

const renderWithMemoryRouter = (component, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<ForgotPasswordPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays main content area with proper aria-label', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const main = screen.getByRole('main', { name: /forgot password page/i });
      expect(main).toBeInTheDocument();
    });

    it('displays forgot password heading', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(screen.getByRole('heading', { name: /Forgot Password\?/i })).toBeInTheDocument();
    });

    it('displays descriptive text', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(screen.getByText(/No worries! Enter your email and we'll send you reset instructions/i)).toBeInTheDocument();
    });

    it('renders the form element', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const form = screen.getByRole('form', { hidden: true });
      expect(form).toBeInTheDocument();
    });

    it('renders with correct gradient background', () => {
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      });
    });
  });

  describe('Email Input Field', () => {
    it('displays email input field', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('email input has correct type attribute', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('email input has correct placeholder', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute('placeholder', 'your.email@example.com');
    });

    it('email input has correct id', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute('id', 'email');
    });

    it('displays mail icon', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('mail icon has aria-hidden attribute', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const mailIcon = screen.getByTestId('mail-icon');
      expect(mailIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('email input accepts text input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);

      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('email input starts empty', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveValue('');
    });

    it('email input has proper aria-label', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute('aria-label', 'Email address');
    });

    it('email input is not disabled initially', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).not.toBeDisabled();
    });

    it('email input clears value when cleared', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);

      await user.type(emailInput, 'test@example.com');
      await user.clear(emailInput);
      expect(emailInput).toHaveValue('');
    });
  });

  describe('Submit Button', () => {
    it('displays submit button', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(screen.getByRole('button', { name: /Send reset email/i })).toBeInTheDocument();
    });

    it('submit button shows correct text initially', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const button = screen.getByRole('button', { name: /Send reset email/i });
      expect(button).toHaveTextContent('Send Reset Link');
    });

    it('submit button has type submit', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const button = screen.getByRole('button', { name: /Send reset email/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('submit button is not disabled initially', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const button = screen.getByRole('button', { name: /Send reset email/i });
      expect(button).not.toBeDisabled();
    });

    it('submit button has proper aria-label', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const button = screen.getByRole('button', { name: /Send reset email/i });
      expect(button).toHaveAttribute('aria-label', 'Send reset email');
    });
  });

  describe('Navigation Links', () => {
    it('displays back to login link', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const links = screen.getAllByRole('link', { name: /Back to login page/i });
      expect(links.length).toBeGreaterThan(0);
    });

    it('back to login link has correct href', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const links = screen.getAllByRole('link', { name: /Back to login page/i });
      links.forEach(link => {
        expect(link).toHaveAttribute('href', '/login');
      });
    });

    it('displays create account link', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(screen.getByRole('link', { name: /Create Account/i })).toBeInTheDocument();
    });

    it('create account link has correct href', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const link = screen.getByRole('link', { name: /Create Account/i });
      expect(link).toHaveAttribute('href', '/register');
    });

    it('displays arrow left icons', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const arrowIcons = screen.getAllByTestId('arrow-left-icon');
      expect(arrowIcons.length).toBeGreaterThan(0);
    });

    it('arrow icons have aria-hidden attribute', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const arrowIcons = screen.getAllByTestId('arrow-left-icon');
      arrowIcons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('displays "Don\'t have an account?" text', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(screen.getByText(/Don't have an account\?/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates email without @ symbol', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'invalidemail.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates email without domain', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates email without TLD', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('error message has role alert', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('error message has correct id', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Email is required');
        expect(errorMessage).toHaveAttribute('id', 'email-error');
      });
    });

    it('email input has aria-invalid when error exists', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/i);
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('email input has aria-describedby when error exists', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/i);
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      });
    });

    it('email input changes border color when error exists', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/Email Address/i);
        expect(emailInput).toHaveStyle({ border: '2px solid #ef4444' });
      });
    });

    it('clears previous error when user starts typing', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });

    it('accepts valid email formats', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'valid.email@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('validates email with subdomain', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'user@mail.example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('validates email with plus sign', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'user+tag@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission - Success', () => {
    it('submits form with valid email', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        });
      });
    });

    it('shows loading state during submission', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 100))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('disables submit button during loading', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 100))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('disables email input during loading', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 100))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      expect(emailInput).toBeDisabled();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('changes button aria-label during loading', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 100))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      let submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      submitButton = screen.getByRole('button', { name: /Sending reset email\.\.\./i });
      expect(submitButton).toHaveAttribute('aria-label', 'Sending reset email...');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Success State', () => {
    it('displays success message after submission', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
      });
    });

    it('displays check circle icon in success state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });

    it('displays email address in success message', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
      });
    });

    it('displays instructions about spam folder', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Check your spam folder/i)).toBeInTheDocument();
      });
    });

    it('displays try again button in success state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try sending reset email again/i })).toBeInTheDocument();
      });
    });

    it('try again button returns to form', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      let submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole('button', { name: /Try sending reset email again/i });
      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Forgot Password\?/i })).toBeInTheDocument();
      });
    });

    it('success view has proper aria-label', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('main', { name: /Password reset confirmation/i })).toBeInTheDocument();
      });
    });

    it('displays back to login link in success state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Back to login page/i })).toBeInTheDocument();
      });
    });

    it('check circle icon has aria-hidden in success state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const checkIcon = screen.getByTestId('check-circle-icon');
        expect(checkIcon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('arrow left icon has aria-hidden in success state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const arrowIcon = screen.getByTestId('arrow-left-icon');
        expect(arrowIcon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('form is not visible in success state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Email Address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API returns error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'User not found' }),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    it('displays default error message when API error has no message', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send reset email')).toBeInTheDocument();
      });
    });

    it('displays error message when network request fails', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    it('logs error to console when request fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Network error');

      global.fetch = jest.fn(() => Promise.reject(error));

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Forgot password error:', error);
      });

      consoleErrorSpy.mockRestore();
    });

    it('re-enables form after error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Error' }),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      expect(submitButton).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
    });

    it('clears error message on new submission', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ message: 'Error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Error')).not.toBeInTheDocument();
      });
    });

    it('displays error for rate limiting', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Too many requests. Please try again later.' }),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
      });
    });

    it('displays error for invalid email from server', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid email address' }),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main role', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const heading = screen.getByRole('heading', { name: /Forgot Password\?/i });
      expect(heading.tagName).toBe('H1');
    });

    it('form labels are properly associated with inputs', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute('id', 'email');
    });

    it('buttons have accessible names', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(screen.getByRole('button', { name: /Send reset email/i })).toBeInTheDocument();
    });

    it('links have accessible names', () => {
      renderWithRouter(<ForgotPasswordPage />);
      expect(screen.getAllByRole('link', { name: /Back to login page/i }).length).toBeGreaterThan(0);
      expect(screen.getByRole('link', { name: /Create Account/i })).toBeInTheDocument();
    });

    it('error messages are announced to screen readers', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });

    it('decorative icons have aria-hidden', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const mailIcon = screen.getByTestId('mail-icon');
      expect(mailIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      await user.tab();
      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveFocus();

      await user.tab();
      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      expect(submitButton).toHaveFocus();
    });

    it('form can be submitted with Enter key', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com{Enter}');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('disabled elements have proper cursor styling', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 100))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      expect(emailInput).toHaveStyle({ cursor: 'not-allowed' });
      expect(submitButton).toHaveStyle({ cursor: 'not-allowed' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    it('prevents form submission with Enter in email field when empty', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, '{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('allows user to edit email before submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'wrong@example.com');
      await user.clear(emailInput);
      await user.type(emailInput, 'correct@example.com');

      expect(emailInput).toHaveValue('correct@example.com');
    });

    it('handles rapid form submissions', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 200))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only call fetch once due to disabled state
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('maintains email value during loading', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 100))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      expect(emailInput).toHaveValue('test@example.com');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('handles clicking on link to login page', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const links = screen.getAllByRole('link', { name: /Back to login page/i });
      expect(links[0]).toHaveAttribute('href', '/login');
    });

    it('handles clicking on link to register page', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const link = screen.getByRole('link', { name: /Create Account/i });
      expect(link).toHaveAttribute('href', '/register');
    });
  });

  describe('Edge Cases', () => {
    it('handles email with spaces', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, ' test@example.com ');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('handles very long email addresses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, longEmail);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('handles special characters in email', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'user.name+tag@example.co.uk');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('handles API timeout', async () => {
      global.fetch = jest.fn(() =>
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles malformed API response', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.reject(new Error('Invalid JSON')),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles empty string email submission', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, '   ');
      await user.clear(emailInput);

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('handles email with multiple @ symbols', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('handles email starting with dot', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, '.test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      // Simple regex allows this, so it should attempt to submit
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('handles email ending with dot before @', async () => {
      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test.@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('preserves email value when returning from success state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole('button', { name: /Try sending reset email again/i });
      await user.click(tryAgainButton);

      await waitFor(() => {
        const newEmailInput = screen.getByLabelText(/Email Address/i);
        expect(newEmailInput).toHaveValue('test@example.com');
      });
    });

    it('handles sequential successful submissions', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole('button', { name: /Try sending reset email again/i });
      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Forgot Password\?/i })).toBeInTheDocument();
      });

      const newSubmitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(newSubmitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Visual States', () => {
    it('applies correct styles to email input', () => {
      renderWithRouter(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);

      expect(emailInput).toHaveStyle({
        padding: '14px 14px 14px 44px',
        fontSize: '16px',
        borderRadius: '12px',
      });
    });

    it('changes button appearance during loading', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 100))
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      const loadingButton = screen.getByRole('button', { name: /Sending reset email\.\.\./i });
      expect(loadingButton).toHaveStyle({
        background: '#9ca3af',
        cursor: 'not-allowed',
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('displays gradient background', () => {
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      const mainDiv = container.firstChild;

      expect(mainDiv).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
      });
    });

    it('applies correct styles to card container', () => {
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      const card = container.querySelector('div > div');

      expect(card).toHaveStyle({
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
      });
    });

    it('success state has green circle background', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        const checkIcon = screen.getByTestId('check-circle-icon');
        expect(checkIcon.parentElement).toHaveStyle({
          background: '#10b981',
          borderRadius: '50%',
        });
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile viewport', () => {
      global.innerWidth = 375;
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders correctly on tablet viewport', () => {
      global.innerWidth = 768;
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      expect(container).toBeInTheDocument();
    });

    it('renders correctly on desktop viewport', () => {
      global.innerWidth = 1920;
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      expect(container).toBeInTheDocument();
    });

    it('maintains padding on small screens', () => {
      global.innerWidth = 320;
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({ padding: '20px' });
    });

    it('card has max-width constraint', () => {
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      const card = container.querySelector('div > div');
      expect(card).toHaveStyle({ maxWidth: '480px' });
    });
  });

  describe('Component State Management', () => {
    it('initializes with correct default state', () => {
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveValue('');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      expect(submitButton).not.toBeDisabled();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('manages loading state correctly', async () => {
      let resolvePromise;
      global.fetch = jest.fn(() =>
        new Promise(resolve => {
          resolvePromise = () => resolve({
            ok: true,
            json: () => Promise.resolve({}),
          });
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();

      resolvePromise();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
      });
    });

    it('manages error state correctly', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Test error' }),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Test error');
      });
    });

    it('manages success state correctly', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('main', { name: /Password reset confirmation/i })).toBeInTheDocument();
      });
    });

    it('resets state when returning from success view', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole('button', { name: /Try sending reset email again/i });
      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Forgot Password\?/i })).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('sends correct request format', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        });
      });
    });

    it('uses correct API endpoint', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/forgot-password'),
          expect.any(Object)
        );
      });
    });

    it('sends POST request', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('includes Content-Type header', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });

    it('sends email in request body', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'user@test.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ email: 'user@test.com' }),
          })
        );
      });
    });
  });

  describe('Snapshot Testing', () => {
    it('matches snapshot for initial render', () => {
      const { container } = renderWithRouter(<ForgotPasswordPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for loading state', async () => {
      global.fetch = jest.fn(() =>
        new Promise(() => {}) // Never resolves
      );

      const user = userEvent.setup();
      const { container } = renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for error state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Error message' }),
        })
      );

      const user = userEvent.setup();
      const { container } = renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for success state', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      const user = userEvent.setup();
      const { container } = renderWithRouter(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /Send reset email/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });
});

export default renderWithRouter
