import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ValidationDisplay, { ValidationIndicator, PostCompletionIndicator } from './ValidationDisplay';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ size, className, title }) => (
    <svg data-testid="alert-triangle-icon" data-size={size} className={className} title={title} />
  ),
  AlertCircle: ({ size, className, title }) => (
    <svg data-testid="alert-circle-icon" data-size={size} className={className} title={title} />
  ),
  CheckCircle: ({ size, className, title }) => (
    <svg data-testid="check-circle-icon" data-size={size} className={className} title={title} />
  ),
  Info: ({ size, className }) => (
    <svg data-testid="info-icon" data-size={size} className={className} />
  ),
  ChevronDown: ({ size }) => (
    <svg data-testid="chevron-down-icon" data-size={size} />
  ),
  ChevronUp: ({ size }) => (
    <svg data-testid="chevron-up-icon" data-size={size} />
  ),
  HelpCircle: ({ size }) => (
    <svg data-testid="help-circle-icon" data-size={size} />
  ),
}));

describe('ValidationDisplay', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing with valid props', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { errorCount: 0, warningCount: 0 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('All Good!')).toBeInTheDocument();
    });

    it('returns null when validation is null', () => {
      const { container } = render(<ValidationDisplay validation={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when validation is undefined', () => {
      const { container } = render(<ValidationDisplay validation={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when no errors, warnings and showSummary is false', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: {}
      };
      const { container } = render(<ValidationDisplay validation={validation} showSummary={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('applies custom className', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      const { container } = render(<ValidationDisplay validation={validation} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Error Display', () => {
    it('displays error state correctly', () => {
      const validation = {
        errors: { title: ['Title is required'] },
        warnings: [],
        summary: { errorCount: 1, warningCount: 0 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    });

    it('displays multiple errors', () => {
      const validation = {
        errors: {
          title: ['Title is required'],
          content: ['Content is too short']
        },
        warnings: [],
        summary: { errorCount: 2 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    it('displays single error count correctly', () => {
      const validation = {
        errors: { title: ['Title is required'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('1 error')).toBeInTheDocument();
    });

    it('shows error icon', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('applies error styling classes', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const displayDiv = container.querySelector('.validation-display');
      expect(displayDiv).toHaveClass('bg-error/10');
      expect(displayDiv).toHaveClass('border-error/30');
    });

    it('displays errors from multiple fields', () => {
      const validation = {
        errors: {
          title: ['Title error 1', 'Title error 2'],
          content: ['Content error']
        },
        warnings: [],
        summary: { errorCount: 3 }
      };
      render(<ValidationDisplay validation={validation} />);

      // Expand to see details
      const expandButton = screen.getByTitle('Expand details');
      fireEvent.click(expandButton);

      expect(screen.getByText('Title error 1')).toBeInTheDocument();
      expect(screen.getByText('Title error 2')).toBeInTheDocument();
      expect(screen.getByText('Content error')).toBeInTheDocument();
    });
  });

  describe('Warning Display', () => {
    it('displays warning state correctly', () => {
      const validation = {
        errors: {},
        warnings: ['This might be spam'],
        summary: { errorCount: 0, warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('Validation Warnings')).toBeInTheDocument();
    });

    it('displays multiple warnings count', () => {
      const validation = {
        errors: {},
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'],
        summary: { warningCount: 3 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('3 warnings')).toBeInTheDocument();
    });

    it('displays single warning count correctly', () => {
      const validation = {
        errors: {},
        warnings: ['Warning'],
        summary: { warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('1 warning')).toBeInTheDocument();
    });

    it('shows warning icon', () => {
      const validation = {
        errors: {},
        warnings: ['Warning'],
        summary: { warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('applies warning styling classes', () => {
      const validation = {
        errors: {},
        warnings: ['Warning'],
        summary: { warningCount: 1 }
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const displayDiv = container.querySelector('.validation-display');
      expect(displayDiv).toHaveClass('bg-warning/10');
      expect(displayDiv).toHaveClass('border-warning/30');
    });
  });

  describe('Success State', () => {
    it('displays success state when no errors or warnings', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { errorCount: 0, warningCount: 0 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('All Good!')).toBeInTheDocument();
    });

    it('shows success icon', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('applies success styling classes', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: {}
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const displayDiv = container.querySelector('.validation-display');
      expect(displayDiv).toHaveClass('bg-success/10');
      expect(displayDiv).toHaveClass('border-success/30');
    });
  });

  describe('Mixed Errors and Warnings', () => {
    it('displays both errors and warnings count', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: ['Warning'],
        summary: { errorCount: 1, warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText(/1 error, 1 warning/)).toBeInTheDocument();
    });

    it('prioritizes error state over warnings', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: ['Warning'],
        summary: { errorCount: 1, warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    });

    it('shows both errors and warnings in expanded view', () => {
      const validation = {
        errors: { field: ['Error message'] },
        warnings: ['Warning message'],
        summary: { errorCount: 1, warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      fireEvent.click(expandButton);

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  describe('Field-Specific Validation', () => {
    it('displays errors for specific field', () => {
      const validation = {
        errors: {
          title: ['Title is required'],
          content: ['Content is required']
        },
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} field="title" />);
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.queryByText('Content is required')).not.toBeInTheDocument();
    });

    it('returns null when field has no errors', () => {
      const validation = {
        errors: { title: ['Title error'] },
        warnings: [],
        summary: {}
      };
      const { container } = render(<ValidationDisplay validation={validation} field="content" />);
      expect(container.firstChild).toBeNull();
    });

    it('displays multiple errors for a field', () => {
      const validation = {
        errors: {
          title: ['Error 1', 'Error 2', 'Error 3']
        },
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} field="title" />);
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Error 3')).toBeInTheDocument();
    });

    it('displays field warnings', () => {
      const validation = {
        errors: {},
        warnings: [
          { field: 'title', message: 'Title warning' },
          { field: 'content', message: 'Content warning' }
        ],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} field="title" />);
      expect(screen.getByText('Title warning')).toBeInTheDocument();
      expect(screen.queryByText('Content warning')).not.toBeInTheDocument();
    });

    it('displays both errors and warnings for field', () => {
      const validation = {
        errors: { title: ['Title error'] },
        warnings: [{ field: 'title', message: 'Title warning' }],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} field="title" />);
      expect(screen.getByText('Title error')).toBeInTheDocument();
      expect(screen.getByText('Title warning')).toBeInTheDocument();
    });

    it('applies field validation className', () => {
      const validation = {
        errors: { title: ['Error'] },
        warnings: [],
        summary: {}
      };
      const { container } = render(
        <ValidationDisplay validation={validation} field="title" className="field-class" />
      );
      expect(container.firstChild).toHaveClass('validation-field');
      expect(container.firstChild).toHaveClass('field-class');
    });

    it('handles empty errors array for field', () => {
      const validation = {
        errors: { title: [] },
        warnings: [],
        summary: {}
      };
      const { container } = render(<ValidationDisplay validation={validation} field="title" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Compact Mode', () => {
    it('renders compact display', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      const { container } = render(<ValidationDisplay validation={validation} compact />);
      expect(container.firstChild).toHaveClass('inline-flex');
    });

    it('displays error count in compact mode', () => {
      const validation = {
        errors: { field1: ['Error'], field2: ['Error'] },
        warnings: [],
        summary: { errorCount: 2 }
      };
      render(<ValidationDisplay validation={validation} compact />);
      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    it('displays warning count in compact mode', () => {
      const validation = {
        errors: {},
        warnings: ['Warning 1', 'Warning 2'],
        summary: { warningCount: 2 }
      };
      render(<ValidationDisplay validation={validation} compact />);
      expect(screen.getByText('2 warnings')).toBeInTheDocument();
    });

    it('displays both counts in compact mode', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: ['Warning'],
        summary: { errorCount: 1, warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} compact />);
      expect(screen.getByText(/1 error, 1 warning/)).toBeInTheDocument();
    });

    it('does not auto-expand in compact mode', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 },
        hasErrors: true
      };
      render(<ValidationDisplay validation={validation} compact />);
      expect(screen.queryByTitle('Collapse details')).not.toBeInTheDocument();
    });

    it('shows appropriate icon in compact mode', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} compact />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('shows expand button when there are errors', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByTitle('Expand details')).toBeInTheDocument();
    });

    it('expands to show error details when clicked', async () => {
      const validation = {
        errors: { field: ['Error message'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      await userEvent.click(expandButton);

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByTitle('Collapse details')).toBeInTheDocument();
    });

    it('collapses when collapse button clicked', async () => {
      const validation = {
        errors: { field: ['Error message'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      await userEvent.click(expandButton);

      const collapseButton = screen.getByTitle('Collapse details');
      await userEvent.click(collapseButton);

      expect(screen.getByTitle('Expand details')).toBeInTheDocument();
    });

    it('auto-expands when there are errors', async () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 },
        hasErrors: true
      };

      await waitFor(() => {
        render(<ValidationDisplay validation={validation} />);
        expect(screen.getByTitle('Collapse details')).toBeInTheDocument();
      });
    });

    it('does not auto-expand in compact mode even with errors', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 },
        hasErrors: true
      };
      render(<ValidationDisplay validation={validation} compact />);
      expect(screen.queryByTitle('Collapse details')).not.toBeInTheDocument();
    });

    it('hides expand button when showDetails is false', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} showDetails={false} />);
      expect(screen.queryByTitle('Expand details')).not.toBeInTheDocument();
    });

    it('toggles icon between chevron-down and chevron-up', async () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();

      const expandButton = screen.getByTitle('Expand details');
      await userEvent.click(expandButton);

      expect(screen.getByTestId('chevron-up-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('chevron-down-icon')).not.toBeInTheDocument();
    });
  });

  describe('Help Section', () => {
    it('shows help button', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByTitle('Validation help')).toBeInTheDocument();
    });

    it('toggles help section when help button clicked', async () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText('Validation Help')).toBeInTheDocument();
    });

    it('hides help section when help button clicked again', async () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);
      await userEvent.click(helpButton);

      expect(screen.queryByText('Validation Help')).not.toBeInTheDocument();
    });

    it('displays title-related help tips', async () => {
      const validation = {
        errors: { title: ['Title is required'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/Make your title descriptive/)).toBeInTheDocument();
    });

    it('displays content-related help tips', async () => {
      const validation = {
        errors: { content: ['Content is required'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/Add meaningful content/)).toBeInTheDocument();
    });

    it('displays URL-related help tips', async () => {
      const validation = {
        errors: { url: ['URL is invalid'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/Ensure your URL is valid/)).toBeInTheDocument();
    });

    it('displays poll-related help tips', async () => {
      const validation = {
        errors: { poll: ['Poll needs more options'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/Polls need at least 2 unique options/)).toBeInTheDocument();
    });

    it('displays community-related help tips', async () => {
      const validation = {
        errors: { community: ['Community is required'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/Select a community/)).toBeInTheDocument();
    });

    it('displays profanity warning tips', async () => {
      const validation = {
        errors: {},
        warnings: ['Content contains profanity'],
        summary: { warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/reviewing your language/)).toBeInTheDocument();
    });

    it('displays spam warning tips', async () => {
      const validation = {
        errors: {},
        warnings: ['Possible spam detected'],
        summary: { warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/Avoid repetitive content/)).toBeInTheDocument();
    });

    it('displays formatting warning tips', async () => {
      const validation = {
        errors: {},
        warnings: ['Excessive formatting'],
        summary: { warningCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/Use formatting sparingly/)).toBeInTheDocument();
    });

    it('displays general tips when no specific errors', async () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} />);

      const helpButton = screen.getByTitle('Validation help');
      await userEvent.click(helpButton);

      expect(screen.getByText(/Write clear, engaging content/)).toBeInTheDocument();
    });
  });

  describe('Readiness Score', () => {
    it('displays readiness score when available', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 75 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText(/Readiness: 75%/)).toBeInTheDocument();
    });

    it('displays readiness progress bar', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 85 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('Post Readiness')).toBeInTheDocument();
    });

    it('applies success color for high readiness score', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 85 }
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const progressBar = container.querySelector('.bg-success');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies warning color for medium readiness score', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 65 }
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const progressBar = container.querySelector('.bg-warning');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies error color for low readiness score', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 45 }
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const progressBar = container.querySelector('.bg-error');
      expect(progressBar).toBeInTheDocument();
    });

    it('sets correct progress bar width', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 60 }
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const progressBar = container.querySelector('.h-2.rounded-full.transition-all');
      expect(progressBar).toHaveStyle({ width: '60%' });
    });

    it('does not show readiness score when showSummary is false', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 75 }
      };
      render(<ValidationDisplay validation={validation} showSummary={false} />);
      expect(screen.queryByText('Post Readiness')).not.toBeInTheDocument();
    });

    it('does not show readiness bar when score is undefined', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { errorCount: 0 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.queryByText('Post Readiness')).not.toBeInTheDocument();
    });
  });

  describe('Summary Display', () => {
    it('shows summary when showSummary is true', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1, warningCount: 0 }
      };
      render(<ValidationDisplay validation={validation} showSummary />);
      expect(screen.getByText('1 error')).toBeInTheDocument();
    });

    it('hides summary details when showSummary is false', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1, warningCount: 0 }
      };
      const { container } = render(<ValidationDisplay validation={validation} showSummary={false} />);
      const summaryText = container.querySelector('.text-sm.text-secondary');
      expect(summaryText).not.toBeInTheDocument();
    });

    it('displays error count in summary', () => {
      const validation = {
        errors: { field1: ['Error 1'], field2: ['Error 2'] },
        warnings: [],
        summary: { errorCount: 2, warningCount: 0 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    it('displays warning count in summary', () => {
      const validation = {
        errors: {},
        warnings: ['Warning 1', 'Warning 2'],
        summary: { errorCount: 0, warningCount: 2 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('2 warnings')).toBeInTheDocument();
    });
  });

  describe('Error Details Section', () => {
    it('displays errors section when expanded', async () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      await userEvent.click(expandButton);

      expect(screen.getByText('Errors (1)')).toBeInTheDocument();
    });

    it('displays warnings section when expanded', async () => {
      const validation = {
        errors: {},
        warnings: ['Warning 1', 'Warning 2'],
        summary: { warningCount: 2 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      await userEvent.click(expandButton);

      expect(screen.getByText('Warnings (2)')).toBeInTheDocument();
    });

    it('displays all error messages in expanded view', async () => {
      const validation = {
        errors: {
          field1: ['Error 1'],
          field2: ['Error 2', 'Error 3']
        },
        warnings: [],
        summary: { errorCount: 3 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      await userEvent.click(expandButton);

      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
      expect(screen.getByText('Error 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty errors object', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('All Good!')).toBeInTheDocument();
    });

    it('handles undefined errors', () => {
      const validation = {
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('All Good!')).toBeInTheDocument();
    });

    it('handles undefined warnings', () => {
      const validation = {
        errors: {},
        summary: {}
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('All Good!')).toBeInTheDocument();
    });

    it('handles undefined summary', () => {
      const validation = {
        errors: {},
        warnings: []
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByText('All Good!')).toBeInTheDocument();
    });

    it('handles field that does not exist in errors', () => {
      const validation = {
        errors: { title: ['Error'] },
        warnings: [],
        summary: {}
      };
      const { container } = render(<ValidationDisplay validation={validation} field="nonexistent" />);
      expect(container.firstChild).toBeNull();
    });

    it('handles null field value', () => {
      const validation = {
        errors: { title: ['Error'] },
        warnings: [],
        summary: {}
      };
      render(<ValidationDisplay validation={validation} field={null} />);
      expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    });

    it('handles warnings as string array', () => {
      const validation = {
        errors: {},
        warnings: ['Warning 1', 'Warning 2'],
        summary: { warningCount: 2 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      fireEvent.click(expandButton);

      expect(screen.getByText('Warning 1')).toBeInTheDocument();
      expect(screen.getByText('Warning 2')).toBeInTheDocument();
    });

    it('handles zero readiness score', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 0 }
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const progressBar = container.querySelector('.h-2.rounded-full.transition-all');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('handles 100 readiness score', () => {
      const validation = {
        errors: {},
        warnings: [],
        summary: { readinessScore: 100 }
      };
      const { container } = render(<ValidationDisplay validation={validation} />);
      const progressBar = container.querySelector('.h-2.rounded-full.transition-all');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Accessibility', () => {
    it('has proper button labels', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      expect(screen.getByTitle('Expand details')).toBeInTheDocument();
      expect(screen.getByTitle('Validation help')).toBeInTheDocument();
    });

    it('updates expand button label on toggle', async () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      await userEvent.click(expandButton);

      expect(screen.getByTitle('Collapse details')).toBeInTheDocument();
      expect(screen.queryByTitle('Expand details')).not.toBeInTheDocument();
    });

    it('displays icons with appropriate attributes', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toBeInTheDocument();
    });

    it('provides semantic structure for errors', async () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: [],
        summary: { errorCount: 1 }
      };
      render(<ValidationDisplay validation={validation} />);

      const expandButton = screen.getByTitle('Expand details');
      await userEvent.click(expandButton);

      expect(screen.getByText('Errors (1)')).toBeInTheDocument();
    });
  });
});

describe('ValidationIndicator', () => {
  describe('Basic Rendering', () => {
    it('returns null when validation is null', () => {
      const { container } = render(<ValidationIndicator validation={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when validation is undefined', () => {
      const { container } = render(<ValidationIndicator validation={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('shows success icon when no errors or warnings', () => {
      const validation = {
        errors: {},
        warnings: []
      };
      render(<ValidationIndicator validation={validation} />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('shows error icon when there are errors', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: []
      };
      render(<ValidationIndicator validation={validation} />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('shows warning icon when there are warnings', () => {
      const validation = {
        errors: {},
        warnings: ['Warning']
      };
      render(<ValidationIndicator validation={validation} />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('prioritizes errors over warnings', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: ['Warning']
      };
      render(<ValidationIndicator validation={validation} />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-circle-icon')).not.toBeInTheDocument();
    });
  });

  describe('Field-Specific Indicators', () => {
    it('shows indicator for specific field errors', () => {
      const validation = {
        errors: {
          title: ['Title error'],
          content: ['Content error']
        },
        warnings: []
      };
      render(<ValidationIndicator validation={validation} field="title" />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('shows success when field has no errors', () => {
      const validation = {
        errors: { title: ['Error'] },
        warnings: []
      };
      render(<ValidationIndicator validation={validation} field="content" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('handles empty errors array for field', () => {
      const validation = {
        errors: { title: [] },
        warnings: []
      };
      render(<ValidationIndicator validation={validation} field="title" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size by default', () => {
      const validation = {
        errors: {},
        warnings: []
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveAttribute('data-size', '14');
    });

    it('renders small size when specified', () => {
      const validation = {
        errors: {},
        warnings: []
      };
      render(<ValidationIndicator validation={validation} size="sm" />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveAttribute('data-size', '14');
    });

    it('renders larger size when specified', () => {
      const validation = {
        errors: {},
        warnings: []
      };
      render(<ValidationIndicator validation={validation} size="md" />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveAttribute('data-size', '16');
    });
  });

  describe('Icon Titles', () => {
    it('shows "Valid" title for success state', () => {
      const validation = {
        errors: {},
        warnings: []
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveAttribute('title', 'Valid');
    });

    it('shows error count in title', () => {
      const validation = {
        errors: { field1: ['Error'], field2: ['Error'] },
        warnings: []
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveAttribute('title', '2 errors');
    });

    it('shows single error title', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: []
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveAttribute('title', '1 error');
    });

    it('shows warning count in title', () => {
      const validation = {
        errors: {},
        warnings: ['Warning 1', 'Warning 2']
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('alert-circle-icon');
      expect(icon).toHaveAttribute('title', '2 warnings');
    });

    it('shows single warning title', () => {
      const validation = {
        errors: {},
        warnings: ['Warning']
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('alert-circle-icon');
      expect(icon).toHaveAttribute('title', '1 warning');
    });
  });

  describe('CSS Classes', () => {
    it('applies success class', () => {
      const validation = {
        errors: {},
        warnings: []
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveClass('text-success');
    });

    it('applies error class', () => {
      const validation = {
        errors: { field: ['Error'] },
        warnings: []
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveClass('text-error');
    });

    it('applies warning class', () => {
      const validation = {
        errors: {},
        warnings: ['Warning']
      };
      render(<ValidationIndicator validation={validation} />);
      const icon = screen.getByTestId('alert-circle-icon');
      expect(icon).toHaveClass('text-warning');
    });
  });
});

describe('PostCompletionIndicator', () => {
  describe('Basic Rendering', () => {
    it('returns null when validation is null', () => {
      const { container } = render(<PostCompletionIndicator validation={null} postData={{}} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when validation.summary is undefined', () => {
      const validation = { errors: {} };
      const { container } = render(<PostCompletionIndicator validation={validation} postData={{}} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when validation.summary exists', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false }
      };
      const postData = {};
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('50% ready')).toBeInTheDocument();
    });
  });

  describe('Step Tracking', () => {
    it('marks title step as completed when title exists', () => {
      const validation = {
        summary: { readinessScore: 20, hasErrors: false }
      };
      const postData = { title: 'My Title' };
      const { container } = render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(container.querySelector('.h-1\\.5')).toBeInTheDocument();
    });

    it('marks content step as completed for text posts', () => {
      const validation = {
        summary: { readinessScore: 40, hasErrors: false }
      };
      const postData = { type: 'text', content: 'Content here' };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('40% ready')).toBeInTheDocument();
    });

    it('marks community step as completed when communityId exists', () => {
      const validation = {
        summary: { readinessScore: 60, hasErrors: false }
      };
      const postData = { communityId: '123' };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('60% ready')).toBeInTheDocument();
    });

    it('marks media step as completed for image posts with attachments', () => {
      const validation = {
        summary: { readinessScore: 80, hasErrors: false }
      };
      const postData = { type: 'image', attachments: ['image.jpg'] };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('80% ready')).toBeInTheDocument();
    });

    it('marks media step as completed for video posts with attachments', () => {
      const validation = {
        summary: { readinessScore: 80, hasErrors: false }
      };
      const postData = { type: 'video', attachments: ['video.mp4'] };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('80% ready')).toBeInTheDocument();
    });

    it('marks validation step as completed when no errors', () => {
      const validation = {
        summary: { readinessScore: 100, hasErrors: false }
      };
      const postData = { title: 'Title', communityId: '123' };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('100% ready')).toBeInTheDocument();
    });

    it('does not mark validation step as completed when errors exist', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: true }
      };
      const postData = {};
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('50% ready')).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('displays completion fraction', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false }
      };
      const postData = { title: 'Title', communityId: '123' };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      // With title and community completed, plus validation (3/5)
      expect(screen.getByText(/\/5/)).toBeInTheDocument();
    });

    it('displays readiness score', () => {
      const validation = {
        summary: { readinessScore: 75, hasErrors: false }
      };
      const postData = {};
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('75% ready')).toBeInTheDocument();
    });

    it('renders progress bar', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false }
      };
      const postData = {};
      const { container } = render(<PostCompletionIndicator validation={validation} postData={postData} />);
      const progressBar = container.querySelector('.w-16.bg-bg-tertiary');
      expect(progressBar).toBeInTheDocument();
    });

    it('includes ValidationIndicator component', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false },
        errors: {},
        warnings: []
      };
      const postData = {};
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Post Types', () => {
    it('handles text post type', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false }
      };
      const postData = { type: 'text', content: 'Content' };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('50% ready')).toBeInTheDocument();
    });

    it('handles image post type', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false }
      };
      const postData = { type: 'image' };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('50% ready')).toBeInTheDocument();
    });

    it('handles video post type', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false }
      };
      const postData = { type: 'video' };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('50% ready')).toBeInTheDocument();
    });

    it('handles undefined post type', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false }
      };
      const postData = {};
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('50% ready')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty postData', () => {
      const validation = {
        summary: { readinessScore: 0, hasErrors: true }
      };
      const postData = {};
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('0% ready')).toBeInTheDocument();
    });

    it('handles null postData', () => {
      const validation = {
        summary: { readinessScore: 0, hasErrors: true }
      };
      render(<PostCompletionIndicator validation={validation} postData={null} />);
      expect(screen.getByText('0% ready')).toBeInTheDocument();
    });

    it('handles undefined postData', () => {
      const validation = {
        summary: { readinessScore: 0, hasErrors: true }
      };
      render(<PostCompletionIndicator validation={validation} postData={undefined} />);
      expect(screen.getByText('0% ready')).toBeInTheDocument();
    });

    it('handles empty attachments array', () => {
      const validation = {
        summary: { readinessScore: 50, hasErrors: false }
      };
      const postData = { type: 'image', attachments: [] };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('50% ready')).toBeInTheDocument();
    });

    it('handles zero readiness score', () => {
      const validation = {
        summary: { readinessScore: 0, hasErrors: true }
      };
      const postData = {};
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('0% ready')).toBeInTheDocument();
    });

    it('handles 100% readiness score', () => {
      const validation = {
        summary: { readinessScore: 100, hasErrors: false }
      };
      const postData = {
        title: 'Title',
        content: 'Content',
        communityId: '123',
        type: 'text'
      };
      render(<PostCompletionIndicator validation={validation} postData={postData} />);
      expect(screen.getByText('100% ready')).toBeInTheDocument();
    });
  });
});

export default validation
