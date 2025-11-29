/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import ContactPage from '../ContactPage';

describe('ContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Prevent random errors
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<ContactPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<ContactPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders page heading', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('heading', { name: /Contact Us/i })).toBeInTheDocument();
    });

    it('renders page description', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByText(/Have a question or need help/i)).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<ContactPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper aria-label on main element', () => {
      renderWithProviders(<ContactPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveAttribute('aria-label', 'Contact page');
    });
  });

  describe('Form Fields Rendering', () => {
    it('renders name input field', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    });

    it('renders email input field', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    });

    it('renders subject dropdown', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByLabelText(/^Subject/i)).toBeInTheDocument();
    });

    it('renders message textarea', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByLabelText(/^Message/i)).toBeInTheDocument();
    });

    it('displays required field indicators', () => {
      renderWithProviders(<ContactPage />);
      const requiredMarkers = screen.getAllByText('*');
      expect(requiredMarkers.length).toBeGreaterThan(0);
    });

    it('shows character counter for message', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByText(/0\/1000 characters/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
    });

    it('renders help center link', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('link', { name: /Visit Help Center/i })).toBeInTheDocument();
    });
  });

  describe('Subject Categories', () => {
    it('displays default subject option', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('option', { name: /Select a subject/i })).toBeInTheDocument();
    });

    it('displays General Question option', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('option', { name: /General Question/i })).toBeInTheDocument();
    });

    it('displays Technical Support option', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('option', { name: /Technical Support/i })).toBeInTheDocument();
    });

    it('displays Account Issues option', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('option', { name: /Account Issues/i })).toBeInTheDocument();
    });

    it('displays Community Guidelines option', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('option', { name: /Community Guidelines/i })).toBeInTheDocument();
    });

    it('displays Billing & Payments option', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('option', { name: /Billing & Payments/i })).toBeInTheDocument();
    });

    it('displays Other option', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('option', { name: /^Other$/i })).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in name field', async () => {
      renderWithProviders(<ContactPage />);
      const nameInput = screen.getByLabelText(/Your Name/i);
      await userEvent.type(nameInput, 'John Doe');
      expect(nameInput).toHaveValue('John Doe');
    });

    it('allows typing in email field', async () => {
      renderWithProviders(<ContactPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      await userEvent.type(emailInput, 'john@example.com');
      expect(emailInput).toHaveValue('john@example.com');
    });

    it('allows selecting subject', async () => {
      renderWithProviders(<ContactPage />);
      const subjectSelect = screen.getByLabelText(/^Subject/i);
      await userEvent.selectOptions(subjectSelect, 'technical');
      expect(subjectSelect).toHaveValue('technical');
    });

    it('allows typing in message field', async () => {
      renderWithProviders(<ContactPage />);
      const messageInput = screen.getByLabelText(/^Message/i);
      await userEvent.type(messageInput, 'This is a test message');
      expect(messageInput).toHaveValue('This is a test message');
    });

    it('updates character counter when typing message', async () => {
      renderWithProviders(<ContactPage />);
      const messageInput = screen.getByLabelText(/^Message/i);
      await userEvent.type(messageInput, 'Hello');
      expect(screen.getByText(/5\/1000 characters/i)).toBeInTheDocument();
    });
  });

  describe('Name Validation', () => {
    it('shows error for empty name', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for name less than 2 characters', async () => {
      renderWithProviders(<ContactPage />);
      const nameInput = screen.getByLabelText(/Your Name/i);
      await userEvent.type(nameInput, 'A');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('accepts valid name', async () => {
      renderWithProviders(<ContactPage />);
      const nameInput = screen.getByLabelText(/Your Name/i);
      await userEvent.type(nameInput, 'John Doe');

      expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
    });

    it('clears name error when user starts typing', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Your Name/i);
      await userEvent.type(nameInput, 'J');

      await waitFor(() => {
        expect(screen.queryByText(/Name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Email Validation', () => {
    it('shows error for empty email', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid email format', async () => {
      renderWithProviders(<ContactPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email is invalid/i)).toBeInTheDocument();
      });
    });

    it('accepts valid email format', async () => {
      renderWithProviders(<ContactPage />);
      const emailInput = screen.getByLabelText(/Email Address/i);
      await userEvent.type(emailInput, 'john@example.com');

      expect(screen.queryByText(/Email is invalid/i)).not.toBeInTheDocument();
    });

    it('clears email error when user starts typing', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/Email Address/i);
      await userEvent.type(emailInput, 'a');

      await waitFor(() => {
        expect(screen.queryByText(/Email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Subject Validation', () => {
    it('shows error for unselected subject', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select a subject/i)).toBeInTheDocument();
      });
    });

    it('accepts selected subject', async () => {
      renderWithProviders(<ContactPage />);
      const subjectSelect = screen.getByLabelText(/^Subject/i);
      await userEvent.selectOptions(subjectSelect, 'general');

      expect(screen.queryByText(/Please select a subject/i)).not.toBeInTheDocument();
    });

    it('clears subject error when user selects option', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select a subject/i)).toBeInTheDocument();
      });

      const subjectSelect = screen.getByLabelText(/^Subject/i);
      await userEvent.selectOptions(subjectSelect, 'technical');

      await waitFor(() => {
        expect(screen.queryByText(/Please select a subject/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Message Validation', () => {
    it('shows error for empty message', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message is required/i)).toBeInTheDocument();
      });
    });

    it('shows error for message less than 10 characters', async () => {
      renderWithProviders(<ContactPage />);
      const messageInput = screen.getByLabelText(/^Message/i);
      await userEvent.type(messageInput, 'Short');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('shows error for message exceeding 1000 characters', async () => {
      renderWithProviders(<ContactPage />);
      const messageInput = screen.getByLabelText(/^Message/i);
      const longMessage = 'a'.repeat(1001);
      await userEvent.type(messageInput, longMessage);

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message must not exceed 1000 characters/i)).toBeInTheDocument();
      });
    });

    it('accepts valid message length', async () => {
      renderWithProviders(<ContactPage />);
      const messageInput = screen.getByLabelText(/^Message/i);
      await userEvent.type(messageInput, 'This is a valid message with enough characters');

      expect(screen.queryByText(/Message must be at least 10 characters/i)).not.toBeInTheDocument();
    });

    it('clears message error when user starts typing', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message is required/i)).toBeInTheDocument();
      });

      const messageInput = screen.getByLabelText(/^Message/i);
      await userEvent.type(messageInput, 'Hello');

      await waitFor(() => {
        expect(screen.queryByText(/Message is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('validates all fields on submit', async () => {
      renderWithProviders(<ContactPage />);
      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Please select a subject/i)).toBeInTheDocument();
        expect(screen.getByText(/Message is required/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      renderWithProviders(<ContactPage />);

      const nameInput = screen.getByLabelText(/Your Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const subjectSelect = screen.getByLabelText(/^Subject/i);
      const messageInput = screen.getByLabelText(/^Message/i);

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.selectOptions(subjectSelect, 'general');
      await userEvent.type(messageInput, 'This is a test message with enough characters');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Sending.../i)).toBeInTheDocument();
    });

    it('disables form fields during submission', async () => {
      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      expect(screen.getByLabelText(/Your Name/i)).toBeDisabled();
      expect(screen.getByLabelText(/Email Address/i)).toBeDisabled();
      expect(screen.getByLabelText(/^Subject/i)).toBeDisabled();
      expect(screen.getByLabelText(/^Message/i)).toBeDisabled();
    });

    it('clears form after successful submission', async () => {
      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      const submitButton = screen.getByRole('button', { name: /Send Message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('displays success message', async () => {
      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(screen.getByText(/Message Sent!/i)).toBeInTheDocument();
      });
    });

    it('shows success icon', async () => {
      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(screen.getByText(/Thank you for contacting us/i)).toBeInTheDocument();
      });
    });

    it('displays back to home link', async () => {
      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument();
      });
    });

    it('displays send another message button', async () => {
      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Send Another Message/i })).toBeInTheDocument();
      });
    });

    it('returns to form when clicking send another message', async () => {
      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Send Another Message/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Send Another Message/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Contact Us/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays submission error message', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.05); // Force error

      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument();
      });
    });

    it('keeps form data on submission error', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.05); // Force error

      renderWithProviders(<ContactPage />);

      await userEvent.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await userEvent.selectOptions(screen.getByLabelText(/^Subject/i), 'general');
      await userEvent.type(screen.getByLabelText(/^Message/i), 'This is a test message');

      fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Your Name/i)).toHaveValue('John Doe');
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<ContactPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<ContactPage />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('has accessible form labels', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Message/i)).toBeInTheDocument();
    });

    it('displays error messages with proper styling', async () => {
      renderWithProviders(<ContactPage />);
      fireEvent.click(screen.getByRole('button', { name: /Send Message/i }));

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/required/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('displays back to home link', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument();
    });

    it('displays help center link', () => {
      renderWithProviders(<ContactPage />);
      expect(screen.getByRole('link', { name: /Visit Help Center/i })).toBeInTheDocument();
    });
  });
});

export default mainElement
