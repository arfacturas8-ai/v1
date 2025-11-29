import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from './ErrorState';

jest.mock('lucide-react', () => ({
  AlertCircle: ({ className, 'aria-hidden': ariaHidden }) => (
    <svg
      data-testid="alert-circle-icon"
      className={className}
      aria-hidden={ariaHidden}
    />
  ),
  RefreshCw: ({ className, 'aria-hidden': ariaHidden }) => (
    <svg
      data-testid="refresh-icon"
      className={className}
      aria-hidden={ariaHidden}
    />
  ),
  HelpCircle: ({ className, 'aria-hidden': ariaHidden }) => (
    <svg
      data-testid="help-circle-icon"
      className={className}
      aria-hidden={ariaHidden}
    />
  ),
}));

describe('ErrorState', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ErrorState />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders with default error message when no error prop provided', () => {
      render(<ErrorState />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders the error heading', () => {
      render(<ErrorState />);
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('renders the error heading as h3 element', () => {
      render(<ErrorState />);
      const heading = screen.getByText('Oops! Something went wrong');
      expect(heading.tagName).toBe('H3');
    });

    it('renders the alert circle icon', () => {
      render(<ErrorState />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('applies correct styling to the alert circle icon', () => {
      render(<ErrorState />);
      const icon = screen.getByTestId('alert-circle-icon');
      expect(icon).toHaveClass('h-16', 'w-16', 'text-red-500', 'mb-4');
    });

    it('sets alert circle icon as aria-hidden', () => {
      render(<ErrorState />);
      const icon = screen.getByTestId('alert-circle-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies role="alert" to container', () => {
      render(<ErrorState />);
      const container = screen.getByRole('alert');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Error Messages', () => {
    it('displays custom error message', () => {
      render(<ErrorState error="Network connection failed" />);
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('displays 404 error message', () => {
      const error404 = 'The page you are looking for does not exist';
      render(<ErrorState error={error404} />);
      expect(screen.getByText(error404)).toBeInTheDocument();
    });

    it('displays 500 error message', () => {
      const error500 = 'Internal server error. Please try again later.';
      render(<ErrorState error={error500} />);
      expect(screen.getByText(error500)).toBeInTheDocument();
    });

    it('displays network error message', () => {
      const networkError = 'Unable to connect to the server';
      render(<ErrorState error={networkError} />);
      expect(screen.getByText(networkError)).toBeInTheDocument();
    });

    it('displays authentication error message', () => {
      const authError = 'Your session has expired. Please log in again.';
      render(<ErrorState error={authError} />);
      expect(screen.getByText(authError)).toBeInTheDocument();
    });

    it('displays timeout error message', () => {
      const timeoutError = 'Request timed out. Please try again.';
      render(<ErrorState error={timeoutError} />);
      expect(screen.getByText(timeoutError)).toBeInTheDocument();
    });

    it('applies correct styling to error message', () => {
      render(<ErrorState error="Test error" />);
      const errorMessage = screen.getByText('Test error');
      expect(errorMessage).toHaveClass('text-gray-400', 'mb-6', 'max-w-md');
    });

    it('renders error message as paragraph element', () => {
      render(<ErrorState error="Test error" />);
      const errorMessage = screen.getByText('Test error');
      expect(errorMessage.tagName).toBe('P');
    });
  });

  describe('Error ID Display', () => {
    it('displays error ID when provided', () => {
      render(<ErrorState errorId="ERR-12345" />);
      expect(screen.getByText('Error ID: ERR-12345')).toBeInTheDocument();
    });

    it('does not display error ID when not provided', () => {
      render(<ErrorState />);
      expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument();
    });

    it('displays numeric error ID', () => {
      render(<ErrorState errorId="500" />);
      expect(screen.getByText('Error ID: 500')).toBeInTheDocument();
    });

    it('displays UUID error ID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      render(<ErrorState errorId={uuid} />);
      expect(screen.getByText(`Error ID: ${uuid}`)).toBeInTheDocument();
    });

    it('applies correct styling to error ID', () => {
      render(<ErrorState errorId="ERR-123" />);
      const errorId = screen.getByText('Error ID: ERR-123');
      expect(errorId).toHaveClass('mt-4', 'text-xs', 'text-gray-600');
    });
  });

  describe('Retry Button', () => {
    it('displays retry button when onRetry is provided', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);
      expect(screen.getByRole('button', { name: 'Retry action' })).toBeInTheDocument();
    });

    it('does not display retry button when onRetry is not provided', () => {
      render(<ErrorState />);
      expect(screen.queryByRole('button', { name: 'Retry action' })).not.toBeInTheDocument();
    });

    it('displays "Try Again" text on retry button', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('displays refresh icon on retry button', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Retry action' });
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry multiple times when clicked multiple times', async () => {
      const user = userEvent.setup();
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Retry action' });
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(3);
    });

    it('applies correct styling to retry button', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);
      const retryButton = screen.getByRole('button', { name: 'Retry action' });
      expect(retryButton).toHaveClass(
        'px-6',
        'py-3',
        'bg-blue-500',
        'hover:bg-blue-600',
        'rounded-lg',
        'font-medium',
        'transition-colors',
        'flex',
        'items-center',
        'gap-2'
      );
    });

    it('sets refresh icon as aria-hidden in retry button', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);
      const icon = screen.getByTestId('refresh-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies correct styling to refresh icon', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);
      const icon = screen.getByTestId('refresh-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Support/Help Link', () => {
    it('displays help link by default', () => {
      render(<ErrorState />);
      expect(screen.getByRole('link', { name: 'Get help from support' })).toBeInTheDocument();
    });

    it('displays help link when showSupport is true', () => {
      render(<ErrorState showSupport={true} />);
      expect(screen.getByRole('link', { name: 'Get help from support' })).toBeInTheDocument();
    });

    it('does not display help link when showSupport is false', () => {
      render(<ErrorState showSupport={false} />);
      expect(screen.queryByRole('link', { name: 'Get help from support' })).not.toBeInTheDocument();
    });

    it('links to /help page', () => {
      render(<ErrorState />);
      const helpLink = screen.getByRole('link', { name: 'Get help from support' });
      expect(helpLink).toHaveAttribute('href', '/help');
    });

    it('displays "Get Help" text on support link', () => {
      render(<ErrorState />);
      expect(screen.getByText('Get Help')).toBeInTheDocument();
    });

    it('displays help circle icon on support link', () => {
      render(<ErrorState />);
      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument();
    });

    it('applies correct styling to help link', () => {
      render(<ErrorState />);
      const helpLink = screen.getByRole('link', { name: 'Get help from support' });
      expect(helpLink).toHaveClass(
        'px-6',
        'py-3',
        'bg-gray-700',
        'hover:bg-gray-600',
        'rounded-lg',
        'font-medium',
        'transition-colors',
        'flex',
        'items-center',
        'gap-2'
      );
    });

    it('sets help circle icon as aria-hidden', () => {
      render(<ErrorState />);
      const icon = screen.getByTestId('help-circle-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies correct styling to help circle icon', () => {
      render(<ErrorState />);
      const icon = screen.getByTestId('help-circle-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Combined Scenarios', () => {
    it('displays both retry button and help link together', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} showSupport={true} />);

      expect(screen.getByRole('button', { name: 'Retry action' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Get help from support' })).toBeInTheDocument();
    });

    it('displays only retry button when showSupport is false', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} showSupport={false} />);

      expect(screen.getByRole('button', { name: 'Retry action' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Get help from support' })).not.toBeInTheDocument();
    });

    it('displays only help link when no onRetry provided', () => {
      render(<ErrorState showSupport={true} />);

      expect(screen.queryByRole('button', { name: 'Retry action' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Get help from support' })).toBeInTheDocument();
    });

    it('displays no action buttons when both are disabled', () => {
      render(<ErrorState showSupport={false} />);

      expect(screen.queryByRole('button', { name: 'Retry action' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Get help from support' })).not.toBeInTheDocument();
    });

    it('renders complete error state with all props', () => {
      const mockRetry = jest.fn();
      render(
        <ErrorState
          error="Complete error message"
          onRetry={mockRetry}
          showSupport={true}
          errorId="ERR-FULL-123"
        />
      );

      expect(screen.getByText('Complete error message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry action' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Get help from support' })).toBeInTheDocument();
      expect(screen.getByText('Error ID: ERR-FULL-123')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role for error state', () => {
      render(<ErrorState />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has aria-label on retry button', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);
      const retryButton = screen.getByRole('button', { name: 'Retry action' });
      expect(retryButton).toHaveAttribute('aria-label', 'Retry action');
    });

    it('has aria-label on help link', () => {
      render(<ErrorState />);
      const helpLink = screen.getByRole('link', { name: 'Get help from support' });
      expect(helpLink).toHaveAttribute('aria-label', 'Get help from support');
    });

    it('hides decorative icons from screen readers', () => {
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);

      const alertIcon = screen.getByTestId('alert-circle-icon');
      const refreshIcon = screen.getByTestId('refresh-icon');
      const helpIcon = screen.getByTestId('help-circle-icon');

      expect(alertIcon).toHaveAttribute('aria-hidden', 'true');
      expect(refreshIcon).toHaveAttribute('aria-hidden', 'true');
      expect(helpIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('is keyboard accessible for retry button', async () => {
      const user = userEvent.setup();
      const mockRetry = jest.fn();
      render(<ErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Retry action' });
      retryButton.focus();

      expect(retryButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('is keyboard accessible for help link', () => {
      render(<ErrorState />);

      const helpLink = screen.getByRole('link', { name: 'Get help from support' });
      helpLink.focus();

      expect(helpLink).toHaveFocus();
    });

    it('error message is accessible to screen readers', () => {
      render(<ErrorState error="Accessible error message" />);
      const errorText = screen.getByText('Accessible error message');

      expect(errorText).toBeVisible();
    });

    it('maintains semantic HTML structure', () => {
      const mockRetry = jest.fn();
      const { container } = render(
        <ErrorState
          error="Test error"
          onRetry={mockRetry}
          errorId="ERR-123"
        />
      );

      expect(container.querySelector('div[role="alert"]')).toBeInTheDocument();
      expect(container.querySelector('h3')).toBeInTheDocument();
      expect(container.querySelectorAll('p')).toHaveLength(2);
      expect(container.querySelector('button')).toBeInTheDocument();
      expect(container.querySelector('a')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct container styling', () => {
      const { container } = render(<ErrorState />);
      const alertContainer = container.querySelector('div[role="alert"]');
      expect(alertContainer).toHaveClass(
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'p-8',
        'text-center'
      );
    });

    it('applies correct heading styling', () => {
      render(<ErrorState />);
      const heading = screen.getByText('Oops! Something went wrong');
      expect(heading).toHaveClass('text-xl', 'font-semibold', 'text-white', 'mb-2');
    });

    it('button container has correct gap styling', () => {
      const mockRetry = jest.fn();
      const { container } = render(<ErrorState onRetry={mockRetry} />);
      const buttonContainer = container.querySelector('.flex.gap-4');
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass('flex', 'gap-4');
    });
  });
});

export default heading
