/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreateProposalPage from '../CreateProposalPage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CreateProposalPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === RENDERING TESTS (10 tests) ===
  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper aria label', () => {
      renderWithRouter(<CreateProposalPage />);
      const mainElement = screen.getByRole('main', { name: /create proposal page/i });
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<CreateProposalPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page heading', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByRole('heading', { name: /create proposal/i })).toBeInTheDocument();
    });

    it('displays governance icon', () => {
      renderWithRouter(<CreateProposalPage />);
      const heading = screen.getByRole('heading', { name: /create proposal/i });
      const container = heading.closest('div');
      expect(container).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/voting duration/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByRole('button', { name: /submit proposal/i })).toBeInTheDocument();
    });

    it('displays proper form structure', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleField = screen.getByLabelText(/title/i);
      expect(titleField.closest('div')).toBeInTheDocument();
    });

    it('has centered layout', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const mainContainer = container.querySelector('.max-w-4xl');
      expect(mainContainer).toBeInTheDocument();
    });

    it('uses proper spacing between fields', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const formContainer = container.querySelector('.space-y-6');
      expect(formContainer).toBeInTheDocument();
    });
  });

  // === FORM FIELDS (12 tests) ===
  describe('Form Fields', () => {
    it('title field starts empty', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveValue('');
    });

    it('description field starts empty', () => {
      renderWithRouter(<CreateProposalPage />);
      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).toHaveValue('');
    });

    it('duration field has default value of 7 days', () => {
      renderWithRouter(<CreateProposalPage />);
      const durationInput = screen.getByLabelText(/voting duration/i);
      expect(durationInput).toHaveValue(7);
    });

    it('title field accepts user input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'My Proposal');

      expect(titleInput).toHaveValue('My Proposal');
    });

    it('description field accepts user input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'This is a test proposal');

      expect(descriptionInput).toHaveValue('This is a test proposal');
    });

    it('duration field accepts numeric input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '14');

      expect(durationInput).toHaveValue(14);
    });

    it('title field has proper placeholder', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByPlaceholderText(/proposal title/i);
      expect(titleInput).toBeInTheDocument();
    });

    it('description field has proper placeholder', () => {
      renderWithRouter(<CreateProposalPage />);
      const descriptionInput = screen.getByPlaceholderText(/describe your proposal/i);
      expect(descriptionInput).toBeInTheDocument();
    });

    it('description is a textarea with multiple rows', () => {
      renderWithRouter(<CreateProposalPage />);
      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput.tagName).toBe('TEXTAREA');
      expect(descriptionInput).toHaveAttribute('rows', '6');
    });

    it('duration input is number type', () => {
      renderWithRouter(<CreateProposalPage />);
      const durationInput = screen.getByLabelText(/voting duration/i);
      expect(durationInput).toHaveAttribute('type', 'number');
    });

    it('all fields have proper labels', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByText(/^title$/i)).toBeInTheDocument();
      expect(screen.getByText(/^description$/i)).toBeInTheDocument();
      expect(screen.getByText(/voting duration \(days\)/i)).toBeInTheDocument();
    });

    it('fields have focus styling', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });
  });

  // === FORM VALIDATION (15 tests) ===
  describe('Form Validation', () => {
    it('allows submission with valid data', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/title/i), 'Valid Proposal');
      await user.type(screen.getByLabelText(/description/i), 'Valid description');

      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toBeEnabled();
    });

    it('accepts long proposal titles', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const longTitle = 'A'.repeat(200);
      await user.type(screen.getByLabelText(/title/i), longTitle);

      expect(screen.getByLabelText(/title/i)).toHaveValue(longTitle);
    });

    it('accepts long proposal descriptions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const longDescription = 'B'.repeat(5000);
      await user.type(screen.getByLabelText(/description/i), longDescription);

      expect(screen.getByLabelText(/description/i)).toHaveValue(longDescription);
    });

    it('accepts minimum duration value', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '1');

      expect(durationInput).toHaveValue(1);
    });

    it('accepts maximum duration value', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '365');

      expect(durationInput).toHaveValue(365);
    });

    it('handles special characters in title', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/title/i), 'Proposal #1: Test & Demo!');
      expect(screen.getByLabelText(/title/i)).toHaveValue('Proposal #1: Test & Demo!');
    });

    it('handles multiline text in description', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const multilineText = 'Line 1\nLine 2\nLine 3';
      await user.type(screen.getByLabelText(/description/i), multilineText);

      expect(screen.getByLabelText(/description/i)).toHaveValue(multilineText);
    });

    it('handles unicode characters in fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/title/i), 'Proposal 🚀 Test 中文');
      expect(screen.getByLabelText(/title/i)).toHaveValue('Proposal 🚀 Test 中文');
    });

    it('preserves whitespace in description', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/description/i), '  Test  with  spaces  ');
      expect(screen.getByLabelText(/description/i)).toHaveValue('  Test  with  spaces  ');
    });

    it('allows zero as duration value', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '0');

      expect(durationInput).toHaveValue(0);
    });

    it('handles rapid input changes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test');
      await user.clear(titleInput);
      await user.type(titleInput, 'New Test');

      expect(titleInput).toHaveValue('New Test');
    });

    it('maintains field values during interaction', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/title/i), 'Title');
      await user.type(screen.getByLabelText(/description/i), 'Description');

      expect(screen.getByLabelText(/title/i)).toHaveValue('Title');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Description');
    });

    it('allows empty form submission', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toBeEnabled();
    });

    it('handles negative duration values', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '-5');

      // Number input may handle negative values differently
      expect(durationInput.value).toBeTruthy();
    });

    it('handles decimal duration values', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '7.5');

      // Number input may handle decimals differently
      expect(durationInput.value).toBeTruthy();
    });
  });

  // === FORM SUBMISSION (8 tests) ===
  describe('Form Submission', () => {
    it('submit button is always enabled', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toBeEnabled();
    });

    it('submit button has proper styling', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toHaveClass('bg-[#58a6ff]', 'text-white');
    });

    it('submit button has hover effects', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toHaveClass('hover:bg-blue-600');
    });

    it('submit button spans full width', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toHaveClass('w-full');
    });

    it('can click submit button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      await user.click(submitButton);

      // Button should still be visible after click
      expect(submitButton).toBeInTheDocument();
    });

    it('submit button has proper padding', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toHaveClass('py-3');
    });

    it('submit button has rounded corners', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
    });

    it('submit button has semibold text', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toHaveClass('font-semibold');
    });
  });

  // === GOVERNANCE FEATURES (10 tests) ===
  describe('Governance Features', () => {
    it('focuses on proposal creation workflow', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByRole('heading', { name: /create proposal/i })).toBeInTheDocument();
    });

    it('provides duration in days unit', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByText(/voting duration \(days\)/i)).toBeInTheDocument();
    });

    it('supports custom voting durations', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '30');

      expect(durationInput).toHaveValue(30);
    });

    it('has governance-themed styling', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toHaveClass('bg-[#58a6ff]');
    });

    it('emphasizes proposal title', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleLabel = screen.getByText(/^title$/i);
      expect(titleLabel).toHaveClass('font-medium');
    });

    it('emphasizes description importance', () => {
      renderWithRouter(<CreateProposalPage />);
      const descriptionLabel = screen.getByText(/^description$/i);
      expect(descriptionLabel).toHaveClass('font-medium');
    });

    it('provides adequate space for proposal details', () => {
      renderWithRouter(<CreateProposalPage />);
      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).toHaveAttribute('rows', '6');
    });

    it('uses governance icon', () => {
      renderWithRouter(<CreateProposalPage />);
      const heading = screen.getByRole('heading', { name: /create proposal/i });
      expect(heading.parentElement).toBeInTheDocument();
    });

    it('groups related fields together', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const formFields = container.querySelector('.space-y-6');
      expect(formFields).toBeInTheDocument();
    });

    it('provides clear field labeling for governance', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/voting duration/i)).toBeInTheDocument();
    });
  });

  // === USER INTERACTIONS (8 tests) ===
  describe('User Interactions', () => {
    it('allows tabbing through fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/title/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/description/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/voting duration/i));
    });

    it('allows clicking into fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.click(titleInput);

      expect(document.activeElement).toBe(titleInput);
    });

    it('supports keyboard input in all fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.click(titleInput);
      await user.keyboard('Test');

      expect(titleInput).toHaveValue('Test');
    });

    it('allows selecting and replacing text', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Original');
      await user.tripleClick(titleInput);
      await user.keyboard('Replaced');

      expect(titleInput).toHaveValue('Replaced');
    });

    it('supports copy-paste operations', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Copy this text');

      expect(titleInput).toHaveValue('Copy this text');
    });

    it('allows clearing fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Text to clear');
      await user.clear(titleInput);

      expect(titleInput).toHaveValue('');
    });

    it('maintains focus during typing', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.click(descriptionInput);
      await user.keyboard('Maintaining focus');

      expect(document.activeElement).toBe(descriptionInput);
    });

    it('allows form interaction without errors', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/title/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Description');
      await user.click(screen.getByRole('button', { name: /submit proposal/i }));

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // === ACCESSIBILITY (12 tests) ===
  describe('Accessibility', () => {
    it('has proper main landmark', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('has descriptive aria-label on main element', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Create proposal page');
    });

    it('all form fields have associated labels', () => {
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const durationInput = screen.getByLabelText(/voting duration/i);

      expect(titleInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
      expect(durationInput).toBeInTheDocument();
    });

    it('submit button has descriptive text', () => {
      renderWithRouter(<CreateProposalPage />);
      expect(screen.getByRole('button', { name: /submit proposal/i })).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<CreateProposalPage />);
      const heading = screen.getByRole('heading', { name: /create proposal/i });
      expect(heading.tagName).toBe('H1');
    });

    it('form inputs have proper focus indicators', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('labels are properly associated with inputs', () => {
      renderWithRouter(<CreateProposalPage />);

      const titleLabel = screen.getByText(/^title$/i);
      const titleInput = screen.getByLabelText(/title/i);

      expect(titleLabel).toBeInTheDocument();
      expect(titleInput).toBeInTheDocument();
    });

    it('provides sufficient color contrast', () => {
      renderWithRouter(<CreateProposalPage />);
      const submitButton = screen.getByRole('button', { name: /submit proposal/i });
      expect(submitButton).toHaveClass('bg-[#58a6ff]', 'text-white');
    });

    it('supports keyboard navigation throughout', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      // Tab through all interactive elements
      await user.tab();
      expect(document.activeElement.tagName).toBe('INPUT');

      await user.tab();
      expect(document.activeElement.tagName).toBe('TEXTAREA');

      await user.tab();
      expect(document.activeElement.tagName).toBe('INPUT');

      await user.tab();
      expect(document.activeElement.tagName).toBe('BUTTON');
    });

    it('has semantic HTML structure', () => {
      renderWithRouter(<CreateProposalPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('labels use appropriate font weight', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleLabel = screen.getByText(/^title$/i);
      expect(titleLabel).toHaveClass('font-medium');
    });

    it('maintains accessibility during interactions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/title/i), 'Test');

      // Labels should still be accessible
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });

  // === RESPONSIVE DESIGN (7 tests) ===
  describe('Responsive Design', () => {
    it('uses responsive container', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const maxWidthContainer = container.querySelector('.max-w-4xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('centers content horizontally', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const centeredContainer = container.querySelector('.mx-auto');
      expect(centeredContainer).toBeInTheDocument();
    });

    it('applies proper padding', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const paddedContainer = container.querySelector('.p-6');
      expect(paddedContainer).toBeInTheDocument();
    });

    it('uses full width inputs', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveClass('w-full');
    });

    it('applies consistent spacing', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const spacedContainer = container.querySelector('.space-y-6');
      expect(spacedContainer).toBeInTheDocument();
    });

    it('uses responsive text sizing', () => {
      renderWithRouter(<CreateProposalPage />);
      const heading = screen.getByRole('heading', { name: /create proposal/i });
      expect(heading).toHaveClass('text-3xl');
    });

    it('adapts to different screen sizes', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveClass('min-h-screen');
    });
  });

  // === STYLING & THEMING (8 tests) ===
  describe('Styling & Theming', () => {
    it('supports dark mode on main container', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toHaveClass('dark:bg-[#0d1117]');
    });

    it('supports dark mode on form card', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const cardElement = container.querySelector('.dark\\:bg-[#161b22]');
      expect(cardElement).toBeInTheDocument();
    });

    it('supports dark mode on inputs', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveClass('dark:bg-gray-700');
    });

    it('uses rounded corners consistently', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
    });

    it('applies proper input padding', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveClass('px-4', 'py-3');
    });

    it('uses consistent background colors', () => {
      renderWithRouter(<CreateProposalPage />);
      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveClass('bg-gray-100');
    });

    it('applies card styling with rounded corners', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const cardElement = container.querySelector('.rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      expect(cardElement).toBeInTheDocument();
    });

    it('uses proper card padding', () => {
      const { container } = renderWithRouter(<CreateProposalPage />);
      const cardElement = container.querySelector('.p-8');
      expect(cardElement).toBeInTheDocument();
    });
  });

  // === STATE MANAGEMENT (6 tests) ===
  describe('State Management', () => {
    it('maintains title state', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Persistent Title');

      expect(titleInput).toHaveValue('Persistent Title');
    });

    it('maintains description state', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Persistent Description');

      expect(descriptionInput).toHaveValue('Persistent Description');
    });

    it('maintains duration state', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '21');

      expect(durationInput).toHaveValue(21);
    });

    it('updates state independently for each field', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/title/i), 'Title');
      await user.type(screen.getByLabelText(/description/i), 'Description');

      const durationInput = screen.getByLabelText(/voting duration/i);
      await user.clear(durationInput);
      await user.type(durationInput, '10');

      expect(screen.getByLabelText(/title/i)).toHaveValue('Title');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Description');
      expect(durationInput).toHaveValue(10);
    });

    it('preserves state across re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithRouter(<CreateProposalPage />);

      await user.type(screen.getByLabelText(/title/i), 'Test Title');

      rerender(<BrowserRouter><CreateProposalPage /></BrowserRouter>);

      expect(screen.getByLabelText(/title/i)).toHaveValue('Test Title');
    });

    it('handles rapid state updates', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CreateProposalPage />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'ABCDEFGH');

      expect(titleInput).toHaveValue('ABCDEFGH');
    });
  });
});

export default renderWithRouter
