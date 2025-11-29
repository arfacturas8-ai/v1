import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportingSystem from './ReportingSystem.jsx';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('ReportingSystem', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    contentId: 'content-123',
    contentType: 'post',
    reportedUserId: 'user-456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-auth-token');
    global.fetch.mockClear();
    // Mock alert
    global.alert = jest.fn();
    // Mock console.error
    global.console.error = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Basic Rendering Tests
  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <ReportingSystem {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders the modal when isOpen is true', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText('Report Content')).toBeInTheDocument();
    });

    it('renders the close button', () => {
      render(<ReportingSystem {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('renders the form with all sections', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText('What type of issue are you reporting?')).toBeInTheDocument();
      expect(screen.getByText('Please provide additional details *')).toBeInTheDocument();
      expect(screen.getByText('Evidence (Optional)')).toBeInTheDocument();
    });

    it('renders the disclaimer', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/Filing false reports may result in action against your account/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Report/i })).toBeInTheDocument();
    });
  });

  // Category Selection Tests
  describe('Report Categories', () => {
    it('renders all report categories', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText('Harassment & Bullying')).toBeInTheDocument();
      expect(screen.getByText('Hate Speech')).toBeInTheDocument();
      expect(screen.getByText('Violence & Threats')).toBeInTheDocument();
      expect(screen.getByText('Sexual Content')).toBeInTheDocument();
      expect(screen.getByText('Spam & Scams')).toBeInTheDocument();
      expect(screen.getByText('Misinformation')).toBeInTheDocument();
      expect(screen.getByText('Copyright Violation')).toBeInTheDocument();
      expect(screen.getByText('Privacy Violation')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('allows selecting a category', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });

      fireEvent.click(harassmentRadio);

      await waitFor(() => {
        expect(harassmentRadio).toBeChecked();
      });
    });

    it('displays subcategories when a category is selected', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });

      fireEvent.click(harassmentRadio);

      await waitFor(() => {
        expect(screen.getByText('More specifically, what is the issue?')).toBeInTheDocument();
      });
    });

    it('resets subcategory when category changes', async () => {
      render(<ReportingSystem {...defaultProps} />);

      // Select harassment category
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      await waitFor(() => {
        expect(screen.getByText('Targeted Harassment')).toBeInTheDocument();
      });

      // Select a subcategory
      const subcategoryRadio = screen.getByRole('radio', { name: /Targeted Harassment/i });
      fireEvent.click(subcategoryRadio);

      // Change to different category
      const hateSpeechRadio = screen.getByRole('radio', { name: /Hate Speech/i });
      fireEvent.click(hateSpeechRadio);

      await waitFor(() => {
        expect(subcategoryRadio).not.toBeInTheDocument();
      });
    });

    it('displays harassment subcategories correctly', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      await waitFor(() => {
        expect(screen.getByText('Targeted Harassment')).toBeInTheDocument();
        expect(screen.getByText('Cyberbullying')).toBeInTheDocument();
        expect(screen.getByText('Doxxing/Personal Info Sharing')).toBeInTheDocument();
        expect(screen.getByText('Stalking')).toBeInTheDocument();
        expect(screen.getByText('Impersonation')).toBeInTheDocument();
      });
    });

    it('displays hate speech subcategories correctly', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const hateSpeechRadio = screen.getByRole('radio', { name: /Hate Speech/i });
      fireEvent.click(hateSpeechRadio);

      await waitFor(() => {
        expect(screen.getByText('Racial Discrimination')).toBeInTheDocument();
        expect(screen.getByText('Religious Intolerance')).toBeInTheDocument();
        expect(screen.getByText('Gender Discrimination')).toBeInTheDocument();
        expect(screen.getByText('Sexuality/LGBTQ+ Discrimination')).toBeInTheDocument();
        expect(screen.getByText('Disability Discrimination')).toBeInTheDocument();
      });
    });

    it('displays violence subcategories correctly', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const violenceRadio = screen.getByRole('radio', { name: /Violence & Threats/i });
      fireEvent.click(violenceRadio);

      await waitFor(() => {
        expect(screen.getByText('Threats of Violence')).toBeInTheDocument();
        expect(screen.getByText('Graphic Violence')).toBeInTheDocument();
        expect(screen.getByText('Self-Harm Content')).toBeInTheDocument();
        expect(screen.getByText('Dangerous Organizations')).toBeInTheDocument();
        expect(screen.getByText('Terrorism/Extremism')).toBeInTheDocument();
      });
    });

    it('displays sexual content subcategories correctly', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const sexualContentRadio = screen.getByRole('radio', { name: /Sexual Content/i });
      fireEvent.click(sexualContentRadio);

      await waitFor(() => {
        expect(screen.getByText('Explicit Sexual Content')).toBeInTheDocument();
        expect(screen.getByText('Non-Consensual Content')).toBeInTheDocument();
        expect(screen.getByText('Sexual Exploitation')).toBeInTheDocument();
        expect(screen.getByText('Inappropriate Sexual Behavior')).toBeInTheDocument();
      });
    });
  });

  // Validation Tests
  describe('Validation', () => {
    it('requires category to be selected', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const categoryRadio = screen.getAllByRole('radio', { name: /Harassment & Bullying/i })[0];
      expect(categoryRadio).toBeRequired();
    });

    it('requires description to be filled', () => {
      render(<ReportingSystem {...defaultProps} />);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      expect(descriptionTextarea).toBeRequired();
    });

    it('enforces minimum description length of 10 characters', () => {
      render(<ReportingSystem {...defaultProps} />);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      expect(descriptionTextarea).toHaveAttribute('minLength', '10');
    });

    it('enforces maximum description length of 1000 characters', () => {
      render(<ReportingSystem {...defaultProps} />);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      expect(descriptionTextarea).toHaveAttribute('maxLength', '1000');
    });

    it('displays character count for description', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText('0/1000 characters')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);

      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });

      await waitFor(() => {
        expect(screen.getByText('16/1000 characters')).toBeInTheDocument();
      });
    });

    it('disables submit button when category is not selected', () => {
      render(<ReportingSystem {...defaultProps} />);
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when description is empty', async () => {
      render(<ReportingSystem {...defaultProps} />);

      // Select category
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when form is valid', async () => {
      render(<ReportingSystem {...defaultProps} />);

      // Select category
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      // Fill description
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a valid description' } });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Submit Report/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('validates evidence URL format', () => {
      render(<ReportingSystem {...defaultProps} />);
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      expect(evidenceInput).toHaveAttribute('type', 'url');
    });
  });

  // Evidence Management Tests
  describe('Evidence Management', () => {
    it('allows adding evidence URLs', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('https://example.com/evidence1.jpg')).toBeInTheDocument();
      });
    });

    it('clears input after adding evidence', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(evidenceInput).toHaveValue('');
      });
    });

    it('prevents adding duplicate evidence URLs', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      // Add first URL
      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      // Try to add same URL again
      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const links = screen.getAllByText('https://example.com/evidence1.jpg');
        expect(links).toHaveLength(1);
      });
    });

    it('prevents adding empty evidence URLs', () => {
      render(<ReportingSystem {...defaultProps} />);
      const addButton = screen.getByRole('button', { name: /Add/i });
      expect(addButton).toBeDisabled();
    });

    it('allows removing evidence URLs', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      // Add evidence
      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('https://example.com/evidence1.jpg')).toBeInTheDocument();
      });

      // Remove evidence
      const removeButton = screen.getByLabelText('Remove evidence');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('https://example.com/evidence1.jpg')).not.toBeInTheDocument();
      });
    });

    it('displays multiple evidence URLs', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      // Add first evidence
      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      // Add second evidence
      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence2.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('https://example.com/evidence1.jpg')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/evidence2.jpg')).toBeInTheDocument();
      });
    });

    it('displays "Added Evidence" heading when evidence is added', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Added Evidence:')).toBeInTheDocument();
      });
    });

    it('evidence links open in new tab', async () => {
      render(<ReportingSystem {...defaultProps} />);
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /https:\/\/example.com\/evidence1.jpg/i });
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  // Form Submission Tests
  describe('Report Submission Flow', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, reportId: 'report-123' }),
      });
    });

    it('submits report with correct data', async () => {
      render(<ReportingSystem {...defaultProps} />);

      // Select category
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      await waitFor(() => {
        expect(screen.getByText('Targeted Harassment')).toBeInTheDocument();
      });

      // Select subcategory
      const subcategoryRadio = screen.getByRole('radio', { name: /Targeted Harassment/i });
      fireEvent.click(subcategoryRadio);

      // Fill description
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This user is harassing me repeatedly' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/moderation/reports'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-auth-token',
            },
            body: JSON.stringify({
              reported_user_id: 'user-456',
              content_id: 'content-123',
              content_type: 'post',
              category: 'harassment',
              subcategory: 'targeted_harassment',
              description: 'This user is harassing me repeatedly',
              evidence_urls: [],
            }),
          })
        );
      });
    });

    it('includes evidence URLs in submission', async () => {
      render(<ReportingSystem {...defaultProps} />);

      // Select category
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      // Fill description
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This user is harassing me repeatedly' } });

      // Add evidence
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });
      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/moderation/reports'),
          expect.objectContaining({
            body: expect.stringContaining('https://example.com/evidence1.jpg'),
          })
        );
      });
    });

    it('displays loading state during submission', async () => {
      global.fetch.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(<ReportingSystem {...defaultProps} />);

      // Fill form
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    });

    it('displays success message on successful submission', async () => {
      render(<ReportingSystem {...defaultProps} />);

      // Fill and submit form
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Report submitted successfully. Thank you for helping keep our community safe.'
        );
      });
    });

    it('closes modal after successful submission', async () => {
      render(<ReportingSystem {...defaultProps} />);

      // Fill and submit form
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles API error responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid report data' }),
      });

      render(<ReportingSystem {...defaultProps} />);

      // Fill and submit form
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to submit report: Invalid report data');
      });
    });

    it('handles network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<ReportingSystem {...defaultProps} />);

      // Fill and submit form
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to submit report. Please try again.');
        expect(global.console.error).toHaveBeenCalledWith('Error submitting report:', expect.any(Error));
      });
    });

    it('does not close modal on submission failure', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<ReportingSystem {...defaultProps} />);

      // Fill and submit form
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('re-enables form after failed submission', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<ReportingSystem {...defaultProps} />);

      // Fill and submit form
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });

      // Form should be re-enabled
      expect(submitButton).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Cancel/i })).not.toBeDisabled();
    });
  });

  // Modal Interaction Tests
  describe('Modal Interaction', () => {
    it('closes modal when close button is clicked', () => {
      render(<ReportingSystem {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when cancel button is clicked', () => {
      render(<ReportingSystem {...defaultProps} />);
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when clicking overlay', () => {
      render(<ReportingSystem {...defaultProps} />);
      const overlays = document.querySelectorAll('.report-modal-overlay');
      expect(overlays.length).toBeGreaterThan(0);
      fireEvent.click(overlays[0]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close modal when clicking inside modal', () => {
      render(<ReportingSystem {...defaultProps} />);
      const modal = screen.getByText('Report Content').parentElement;
      fireEvent.click(modal);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('prevents event propagation when clicking inside modal', () => {
      render(<ReportingSystem {...defaultProps} />);
      const modal = screen.getByText('Report Content').parentElement;
      const event = new MouseEvent('click', { bubbles: true });
      const stopPropagation = jest.spyOn(event, 'stopPropagation');

      modal.dispatchEvent(event);

      expect(stopPropagation).toHaveBeenCalled();
    });
  });

  // Form Reset Tests
  describe('Form Reset', () => {
    it('resets form when modal opens', async () => {
      const { rerender } = render(<ReportingSystem {...defaultProps} isOpen={false} />);

      // Open modal and fill form
      rerender(<ReportingSystem {...defaultProps} isOpen={true} />);

      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });

      // Close and reopen modal
      rerender(<ReportingSystem {...defaultProps} isOpen={false} />);
      rerender(<ReportingSystem {...defaultProps} isOpen={true} />);

      // Form should be reset
      const newDescriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      expect(newDescriptionTextarea).toHaveValue('');
    });

    it('clears evidence URLs when modal reopens', async () => {
      const { rerender } = render(<ReportingSystem {...defaultProps} />);

      // Add evidence
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });
      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('https://example.com/evidence1.jpg')).toBeInTheDocument();
      });

      // Close and reopen
      rerender(<ReportingSystem {...defaultProps} isOpen={false} />);
      rerender(<ReportingSystem {...defaultProps} isOpen={true} />);

      // Evidence should be cleared
      expect(screen.queryByText('https://example.com/evidence1.jpg')).not.toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
      expect(screen.getByLabelText(/Please provide additional details/i)).toBeInTheDocument();
    });

    it('textarea has accessible description', () => {
      render(<ReportingSystem {...defaultProps} />);
      expect(screen.getByText(/Help us understand the issue/i)).toBeInTheDocument();
    });

    it('remove evidence buttons have aria-label', async () => {
      render(<ReportingSystem {...defaultProps} />);

      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });
      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/evidence1.jpg' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        const removeButton = screen.getByLabelText('Remove evidence');
        expect(removeButton).toBeInTheDocument();
      });
    });

    it('all form inputs have proper labels', () => {
      render(<ReportingSystem {...defaultProps} />);
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      expect(screen.getByLabelText(/Please provide additional details/i)).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('handles API error without error message', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<ReportingSystem {...defaultProps} />);

      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to submit report: Unknown error');
      });
    });

    it('handles whitespace-only description', () => {
      render(<ReportingSystem {...defaultProps} />);

      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: '   ' } });

      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      expect(submitButton).toBeDisabled();
    });

    it('handles missing auth token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(<ReportingSystem {...defaultProps} />);

      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer null',
            }),
          })
        );
      });
    });

    it('trims whitespace from evidence URLs', async () => {
      render(<ReportingSystem {...defaultProps} />);

      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      fireEvent.change(evidenceInput, { target: { value: '  https://example.com/evidence1.jpg  ' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('https://example.com/evidence1.jpg')).toBeInTheDocument();
      });
    });

    it('handles different content types', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<ReportingSystem {...defaultProps} contentType="comment" />);

      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"content_type":"comment"'),
          })
        );
      });
    });

    it('submits report without subcategory', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<ReportingSystem {...defaultProps} />);

      // Select category but not subcategory
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, { target: { value: 'This is a test report' } });
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('"subcategory":""'),
          })
        );
      });
    });
  });

  // Integration Tests
  describe('Integration Tests', () => {
    it('completes full report flow with all fields', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, reportId: 'report-123' }),
      });

      render(<ReportingSystem {...defaultProps} />);

      // Select category
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      await waitFor(() => {
        expect(screen.getByText('Targeted Harassment')).toBeInTheDocument();
      });

      // Select subcategory
      const subcategoryRadio = screen.getByRole('radio', { name: /Cyberbullying/i });
      fireEvent.click(subcategoryRadio);

      // Fill description
      const descriptionTextarea = screen.getByPlaceholderText(/Describe the specific behavior/i);
      fireEvent.change(descriptionTextarea, {
        target: { value: 'This user has been sending threatening messages and posting harmful content about me on multiple occasions.' }
      });

      // Add evidence
      const evidenceInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
      const addButton = screen.getByRole('button', { name: /Add/i });

      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/screenshot1.png' } });
      fireEvent.click(addButton);

      fireEvent.change(evidenceInput, { target: { value: 'https://example.com/screenshot2.png' } });
      fireEvent.click(addButton);

      // Submit
      const submitButton = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/moderation/reports'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              reported_user_id: 'user-456',
              content_id: 'content-123',
              content_type: 'post',
              category: 'harassment',
              subcategory: 'cyberbullying',
              description: 'This user has been sending threatening messages and posting harmful content about me on multiple occasions.',
              evidence_urls: ['https://example.com/screenshot1.png', 'https://example.com/screenshot2.png'],
            }),
          })
        );
        expect(global.alert).toHaveBeenCalledWith(
          'Report submitted successfully. Thank you for helping keep our community safe.'
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles category change workflow', async () => {
      render(<ReportingSystem {...defaultProps} />);

      // Select first category
      const harassmentRadio = screen.getByRole('radio', { name: /Harassment & Bullying/i });
      fireEvent.click(harassmentRadio);

      await waitFor(() => {
        expect(screen.getByText('Cyberbullying')).toBeInTheDocument();
      });

      // Select subcategory
      const subcategoryRadio = screen.getByRole('radio', { name: /Cyberbullying/i });
      fireEvent.click(subcategoryRadio);

      // Change to different category
      const spamRadio = screen.getByRole('radio', { name: /Spam & Scams/i });
      fireEvent.click(spamRadio);

      await waitFor(() => {
        // Old subcategories should be gone
        expect(screen.queryByText('Cyberbullying')).not.toBeInTheDocument();
        // New subcategories should appear
        expect(screen.getByText('Repetitive/Duplicate Content')).toBeInTheDocument();
      });
    });
  });
});

export default mockLocalStorage
