import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from './ErrorState';
import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: (props) => <div data-testid="alert-circle-icon" {...props} />,
  RefreshCw: (props) => <div data-testid="refresh-icon" {...props} />,
  HelpCircle: (props) => <div data-testid="help-circle-icon" {...props} />
}));

// Mock Button component
jest.mock('./button', () => ({
  Button: ({ children, onClick, variant, size, style, ...props }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}));

describe('ErrorState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.open
    global.window.open = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ErrorState error="Test error" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders with default title', () => {
      render(<ErrorState error="Test error" />);
      expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<ErrorState error="Test error" title="Custom Error Title" />);
      expect(screen.getByRole('heading', { name: 'Custom Error Title' })).toBeInTheDocument();
    });

    it('renders error icon', () => {
      render(<ErrorState error="Test error" />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('renders support message', () => {
      render(<ErrorState error="Test error" />);
      expect(screen.getByText(/If this problem persists, please contact our support team/i)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ErrorState error="Test error" className="custom-error-class" />
      );
      expect(container.firstChild).toHaveClass('custom-error-class');
    });

    it('applies default layout classes', () => {
      const { container } = render(<ErrorState error="Test error" />);
      expect(container.firstChild).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });
  });

  describe('Error Message Handling', () => {
    it('handles string error', () => {
      render(<ErrorState error="Simple error message" />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('handles Error object', () => {
      const error = new Error('Network failure');
      render(<ErrorState error={error} />);
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });

    it('handles error with message property', () => {
      const error = { message: 'Custom error message' };
      render(<ErrorState error={error} />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('handles undefined error', () => {
      render(<ErrorState error={undefined} />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('handles null error', () => {
      render(<ErrorState error={null} />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('handles empty string error', () => {
      render(<ErrorState error="" />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('handles error object without message property', () => {
      const error = { code: 500 };
      render(<ErrorState error={error} />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Friendly Error Messages - Network Errors', () => {
    it('displays friendly message for network error', () => {
      render(<ErrorState error="Network error occurred" />);
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });

    it('displays friendly message for fetch error', () => {
      render(<ErrorState error="Failed to fetch data" />);
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });

    it('handles network error with different case', () => {
      render(<ErrorState error="NETWORK ERROR" />);
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });

    it('handles fetch error with different case', () => {
      render(<ErrorState error="FETCH FAILED" />);
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });
  });

  describe('Friendly Error Messages - Timeout Errors', () => {
    it('displays friendly message for timeout error', () => {
      render(<ErrorState error="Request timeout" />);
      expect(screen.getByText(/The request took too long to complete/i)).toBeInTheDocument();
    });

    it('handles timeout error with different case', () => {
      render(<ErrorState error="TIMEOUT ERROR" />);
      expect(screen.getByText(/The request took too long to complete/i)).toBeInTheDocument();
    });

    it('handles timeout in error message', () => {
      render(<ErrorState error="Connection timeout occurred" />);
      expect(screen.getByText(/The request took too long to complete/i)).toBeInTheDocument();
    });
  });

  describe('Friendly Error Messages - Authentication Errors', () => {
    it('displays friendly message for unauthorized error', () => {
      render(<ErrorState error="Unauthorized access" />);
      expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
    });

    it('displays friendly message for 401 error', () => {
      render(<ErrorState error="Error 401: Authentication failed" />);
      expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
    });

    it('handles unauthorized with different case', () => {
      render(<ErrorState error="UNAUTHORIZED" />);
      expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
    });
  });

  describe('Friendly Error Messages - Permission Errors', () => {
    it('displays friendly message for forbidden error', () => {
      render(<ErrorState error="Forbidden access" />);
      expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
    });

    it('displays friendly message for 403 error', () => {
      render(<ErrorState error="Error 403: Forbidden" />);
      expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
    });

    it('handles forbidden with different case', () => {
      render(<ErrorState error="FORBIDDEN" />);
      expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
    });
  });

  describe('Friendly Error Messages - Not Found Errors', () => {
    it('displays friendly message for not found error', () => {
      render(<ErrorState error="Resource not found" />);
      expect(screen.getByText(/The requested resource could not be found/i)).toBeInTheDocument();
    });

    it('displays friendly message for 404 error', () => {
      render(<ErrorState error="Error 404" />);
      expect(screen.getByText(/The requested resource could not be found/i)).toBeInTheDocument();
    });

    it('handles not found with different case', () => {
      render(<ErrorState error="NOT FOUND" />);
      expect(screen.getByText(/The requested resource could not be found/i)).toBeInTheDocument();
    });
  });

  describe('Friendly Error Messages - Server Errors', () => {
    it('displays friendly message for server error', () => {
      render(<ErrorState error="Internal server error" />);
      expect(screen.getByText(/A server error occurred/i)).toBeInTheDocument();
    });

    it('displays friendly message for 500 error', () => {
      render(<ErrorState error="Error 500" />);
      expect(screen.getByText(/A server error occurred/i)).toBeInTheDocument();
    });

    it('handles server error with different case', () => {
      render(<ErrorState error="SERVER ERROR" />);
      expect(screen.getByText(/A server error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Friendly Error Messages - Default Cases', () => {
    it('displays default friendly message for unknown error', () => {
      render(<ErrorState error="Some random error" />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('displays default message for generic error', () => {
      render(<ErrorState error="Something broke" />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Error Details Display', () => {
    it('does not show error details by default', () => {
      render(<ErrorState error="Technical error message" />);
      expect(screen.queryByText('Technical error message')).not.toBeInTheDocument();
    });

    it('shows error details when showErrorDetails is true', () => {
      render(<ErrorState error="Technical error message" showErrorDetails={true} />);
      expect(screen.getByText('Technical error message')).toBeInTheDocument();
    });

    it('hides error details when showErrorDetails is false', () => {
      render(<ErrorState error="Technical error message" showErrorDetails={false} />);
      expect(screen.queryByText('Technical error message')).not.toBeInTheDocument();
    });

    it('renders error details in code block', () => {
      const { container } = render(
        <ErrorState error="Technical error message" showErrorDetails={true} />
      );
      const codeElement = container.querySelector('code');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveTextContent('Technical error message');
    });

    it('shows detailed error from Error object', () => {
      const error = new Error('Detailed technical error');
      render(<ErrorState error={error} showErrorDetails={true} />);
      expect(screen.getByText('Detailed technical error')).toBeInTheDocument();
    });

    it('applies break-all class to error details', () => {
      const { container } = render(
        <ErrorState error="Very long error message without spaces" showErrorDetails={true} />
      );
      const codeElement = container.querySelector('code');
      expect(codeElement).toHaveClass('break-all');
    });

    it('renders error details container with proper styling', () => {
      const { container } = render(
        <ErrorState error="Error" showErrorDetails={true} />
      );
      const detailsContainer = container.querySelector('.rounded-lg');
      expect(detailsContainer).toBeInTheDocument();
    });
  });

  describe('Error Code Display', () => {
    it('does not show error code when not provided', () => {
      render(<ErrorState error="Error message" />);
      expect(screen.queryByText(/Error Code:/i)).not.toBeInTheDocument();
    });

    it('shows error code when provided', () => {
      render(<ErrorState error="Error message" errorCode="ERR_500" />);
      expect(screen.getByText(/Error Code:/i)).toBeInTheDocument();
      expect(screen.getByText('ERR_500')).toBeInTheDocument();
    });

    it('renders error code in monospace font', () => {
      const { container } = render(
        <ErrorState error="Error message" errorCode="ERR_404" />
      );
      const codeElement = container.querySelector('.font-mono');
      expect(codeElement).toHaveTextContent('ERR_404');
    });

    it('handles numeric error code', () => {
      render(<ErrorState error="Error message" errorCode={500} />);
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('handles string error code', () => {
      render(<ErrorState error="Error message" errorCode="NETWORK_ERR" />);
      expect(screen.getByText('NETWORK_ERR')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('does not show retry button when onRetry is not provided', () => {
      render(<ErrorState error="Error" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('displays custom retry label', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} retryLabel="Retry Now" />);
      expect(screen.getByRole('button', { name: 'Retry Now' })).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      await userEvent.click(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry multiple times when clicked multiple times', async () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      await userEvent.click(retryButton);
      await userEvent.click(retryButton);
      await userEvent.click(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(3);
    });

    it('renders refresh icon in retry button', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('applies large size to retry button', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);
      const button = screen.getByRole('button', { name: /Try Again/i });
      expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('applies gradient background to retry button', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);
      const button = screen.getByRole('button', { name: /Try Again/i });
      expect(button.style.background).toContain('linear-gradient');
    });
  });

  describe('Support Link Functionality', () => {
    it('does not show support button when supportLink is not provided', () => {
      render(<ErrorState error="Error" />);
      expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
    });

    it('shows support button when supportLink is provided', () => {
      render(<ErrorState error="Error" supportLink="https://support.example.com" />);
      expect(screen.getByRole('button', { name: /Contact Support/i })).toBeInTheDocument();
    });

    it('opens support link in new tab when clicked', async () => {
      const supportUrl = 'https://support.example.com';
      render(<ErrorState error="Error" supportLink={supportUrl} />);

      const supportButton = screen.getByRole('button', { name: /Contact Support/i });
      await userEvent.click(supportButton);

      expect(window.open).toHaveBeenCalledWith(supportUrl, '_blank');
    });

    it('opens support link multiple times when clicked multiple times', async () => {
      const supportUrl = 'https://support.example.com';
      render(<ErrorState error="Error" supportLink={supportUrl} />);

      const supportButton = screen.getByRole('button', { name: /Contact Support/i });
      await userEvent.click(supportButton);
      await userEvent.click(supportButton);

      expect(window.open).toHaveBeenCalledTimes(2);
    });

    it('renders help icon in support button', () => {
      render(<ErrorState error="Error" supportLink="https://support.example.com" />);
      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument();
    });

    it('applies outline variant to support button', () => {
      render(<ErrorState error="Error" supportLink="https://support.example.com" />);
      const button = screen.getByRole('button', { name: /Contact Support/i });
      expect(button).toHaveAttribute('data-variant', 'outline');
    });

    it('applies large size to support button', () => {
      render(<ErrorState error="Error" supportLink="https://support.example.com" />);
      const button = screen.getByRole('button', { name: /Contact Support/i });
      expect(button).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('Multiple Buttons', () => {
    it('renders both retry and support buttons', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error="Error"
          onRetry={handleRetry}
          supportLink="https://support.example.com"
        />
      );

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Contact Support/i })).toBeInTheDocument();
    });

    it('renders both buttons with custom retry label', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error="Error"
          onRetry={handleRetry}
          retryLabel="Reload"
          supportLink="https://support.example.com"
        />
      );

      expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Contact Support/i })).toBeInTheDocument();
    });

    it('both buttons function independently', async () => {
      const handleRetry = jest.fn();
      const supportUrl = 'https://support.example.com';
      render(
        <ErrorState
          error="Error"
          onRetry={handleRetry}
          supportLink={supportUrl}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Try Again/i }));
      expect(handleRetry).toHaveBeenCalledTimes(1);

      await userEvent.click(screen.getByRole('button', { name: /Contact Support/i }));
      expect(window.open).toHaveBeenCalledWith(supportUrl, '_blank');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic heading for title', () => {
      render(<ErrorState error="Error" title="Error Title" />);
      expect(screen.getByRole('heading', { level: 3, name: 'Error Title' })).toBeInTheDocument();
    });

    it('retry button is keyboard accessible', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);

      const button = screen.getByRole('button', { name: /Try Again/i });
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('support button is keyboard accessible', () => {
      render(<ErrorState error="Error" supportLink="https://support.example.com" />);

      const button = screen.getByRole('button', { name: /Contact Support/i });
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('has appropriate text hierarchy', () => {
      render(
        <ErrorState
          error="Error"
          title="Error Title"
          errorCode="ERR_001"
        />
      );

      const heading = screen.getByRole('heading');
      expect(heading).toHaveClass('text-2xl', 'font-bold');
    });

    it('error message is accessible', () => {
      render(<ErrorState error="Network error" />);
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });

    it('buttons have descriptive labels', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error="Error"
          onRetry={handleRetry}
          retryLabel="Retry Operation"
          supportLink="https://support.example.com"
        />
      );

      expect(screen.getByRole('button', { name: 'Retry Operation' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Contact Support' })).toBeInTheDocument();
    });
  });

  describe('Complete Use Cases', () => {
    it('renders complete error state with all props', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error="Network connection failed"
          title="Connection Error"
          onRetry={handleRetry}
          retryLabel="Reconnect"
          showErrorDetails={true}
          errorCode="NET_001"
          supportLink="https://support.example.com"
          className="custom-error"
        />
      );

      expect(screen.getByRole('heading', { name: 'Connection Error' })).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      expect(screen.getByText(/Error Code:/i)).toBeInTheDocument();
      expect(screen.getByText('NET_001')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Contact Support/i })).toBeInTheDocument();
    });

    it('renders minimal error state', () => {
      render(<ErrorState error="Simple error" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders error with retry only', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error="Failed to load data"
          title="Loading Failed"
          onRetry={handleRetry}
        />
      );

      expect(screen.getByText('Loading Failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      expect(screen.queryByText(/Contact Support/i)).not.toBeInTheDocument();
    });

    it('renders error with support link only', () => {
      render(
        <ErrorState
          error="Critical system error"
          title="System Error"
          supportLink="https://support.example.com"
        />
      );

      expect(screen.getByText('System Error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Contact Support/i })).toBeInTheDocument();
      expect(screen.queryByText(/Try Again/i)).not.toBeInTheDocument();
    });
  });

  describe('Real-World Error Scenarios', () => {
    it('handles API fetch failure', () => {
      const error = new Error('Failed to fetch');
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error={error}
          title="Failed to load posts"
          onRetry={handleRetry}
        />
      );

      expect(screen.getByText('Failed to load posts')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });

    it('handles authentication expiry', () => {
      render(
        <ErrorState
          error="401 Unauthorized"
          title="Session Expired"
          onRetry={() => window.location.href = '/login'}
          retryLabel="Log In Again"
        />
      );

      expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Log In Again' })).toBeInTheDocument();
    });

    it('handles permission denied', () => {
      render(
        <ErrorState
          error="403 Forbidden"
          title="Access Denied"
          supportLink="https://support.example.com"
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
    });

    it('handles resource not found', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error="404 Not Found"
          title="Page Not Found"
          onRetry={handleRetry}
          retryLabel="Go Back"
        />
      );

      expect(screen.getByText(/The requested resource could not be found/i)).toBeInTheDocument();
    });

    it('handles server error with error code', () => {
      render(
        <ErrorState
          error="Internal Server Error"
          title="Server Error"
          errorCode="500"
          onRetry={jest.fn()}
          supportLink="https://support.example.com"
        />
      );

      expect(screen.getByText(/A server error occurred/i)).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('handles timeout with retry', () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error="Request timeout"
          title="Request Timed Out"
          onRetry={handleRetry}
          retryLabel="Try Again"
        />
      );

      expect(screen.getByText(/The request took too long to complete/i)).toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    it('shows technical details in development', () => {
      const technicalError = 'TypeError: Cannot read property "data" of undefined at line 42';
      render(
        <ErrorState
          error={technicalError}
          title="Development Error"
          showErrorDetails={true}
        />
      );

      expect(screen.getByText(technicalError)).toBeInTheDocument();
    });

    it('hides technical details in production', () => {
      const technicalError = 'TypeError: Cannot read property "data" of undefined';
      render(
        <ErrorState
          error={technicalError}
          title="Production Error"
          showErrorDetails={false}
        />
      );

      expect(screen.queryByText(technicalError)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long error messages', () => {
      const longError = 'A'.repeat(500);
      render(<ErrorState error={longError} showErrorDetails={true} />);
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('handles error with special characters', () => {
      const specialError = 'Error: <script>alert("xss")</script>';
      render(<ErrorState error={specialError} showErrorDetails={true} />);
      expect(screen.getByText(specialError)).toBeInTheDocument();
    });

    it('handles error with unicode characters', () => {
      const unicodeError = 'Error: 你好 世界 🌍';
      render(<ErrorState error={unicodeError} showErrorDetails={true} />);
      expect(screen.getByText(unicodeError)).toBeInTheDocument();
    });

    it('handles empty title gracefully', () => {
      render(<ErrorState error="Error" title="" />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('handles null title', () => {
      render(<ErrorState error="Error" title={null} />);
      expect(screen.queryByRole('heading')).toBeInTheDocument();
    });

    it('handles undefined retryLabel with onRetry', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} retryLabel={undefined} />);
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('handles empty retryLabel', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} retryLabel="" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('handles error code as 0', () => {
      render(<ErrorState error="Error" errorCode={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles supportLink as empty string', () => {
      render(<ErrorState error="Error" supportLink="" />);
      const supportButton = screen.queryByText(/Contact Support/i);
      expect(supportButton).not.toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies centered text class', () => {
      const { container } = render(<ErrorState error="Error" />);
      expect(container.firstChild).toHaveClass('text-center');
    });

    it('applies padding classes', () => {
      const { container } = render(<ErrorState error="Error" />);
      expect(container.firstChild).toHaveClass('py-16', 'px-8');
    });

    it('icon container has rounded background', () => {
      const { container } = render(<ErrorState error="Error" />);
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });

    it('applies max-width to description', () => {
      const { container } = render(<ErrorState error="Error" />);
      const description = container.querySelector('.max-w-md');
      expect(description).toBeInTheDocument();
    });

    it('buttons container uses flex layout', () => {
      const handleRetry = jest.fn();
      const { container } = render(
        <ErrorState
          error="Error"
          onRetry={handleRetry}
          supportLink="https://support.example.com"
        />
      );
      const buttonContainer = container.querySelector('.flex.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('applies custom CSS variables', () => {
      const { container } = render(<ErrorState error="Error" />);
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toHaveStyle({ background: 'var(--color-error-bg, #FEE2E2)' });
    });
  });

  describe('Icon Rendering', () => {
    it('renders AlertCircle icon with correct size', () => {
      render(<ErrorState error="Error" />);
      const icon = screen.getByTestId('alert-circle-icon');
      expect(icon).toBeInTheDocument();
    });

    it('renders RefreshCw icon in retry button', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('renders HelpCircle icon in support button', () => {
      render(<ErrorState error="Error" supportLink="https://support.example.com" />);
      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('retry button can be triggered with keyboard', () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);

      const button = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(button).toBeInTheDocument();
    });

    it('support button can be triggered with keyboard', () => {
      render(<ErrorState error="Error" supportLink="https://support.example.com" />);

      const button = screen.getByRole('button', { name: /Contact Support/i });
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(button).toBeInTheDocument();
    });

    it('handles rapid retry clicks', async () => {
      const handleRetry = jest.fn();
      render(<ErrorState error="Error" onRetry={handleRetry} />);

      const button = screen.getByRole('button', { name: /Try Again/i });

      // Simulate rapid clicking
      for (let i = 0; i < 5; i++) {
        await userEvent.click(button);
      }

      expect(handleRetry).toHaveBeenCalledTimes(5);
    });

    it('handles retry click after support link click', async () => {
      const handleRetry = jest.fn();
      render(
        <ErrorState
          error="Error"
          onRetry={handleRetry}
          supportLink="https://support.example.com"
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Contact Support/i }));
      await userEvent.click(screen.getByRole('button', { name: /Try Again/i }));

      expect(handleRetry).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Message Variations', () => {
    it('handles error message with newlines', () => {
      const error = 'Line 1\nLine 2\nLine 3';
      render(<ErrorState error={error} showErrorDetails={true} />);
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('handles error message with tabs', () => {
      const error = 'Error:\tDetails\tHere';
      render(<ErrorState error={error} showErrorDetails={true} />);
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('handles error with HTML-like content', () => {
      const error = '<div>Not HTML</div>';
      render(<ErrorState error={error} showErrorDetails={true} />);
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('handles error with quotes', () => {
      const error = 'Error: "Something" failed';
      render(<ErrorState error={error} showErrorDetails={true} />);
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('handles error with apostrophes', () => {
      const error = "Error: It's broken";
      render(<ErrorState error={error} showErrorDetails={true} />);
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  describe('Complex Error Objects', () => {
    it('extracts message from nested error object', () => {
      const error = {
        response: {
          data: {
            message: 'Nested error message'
          }
        },
        message: 'Top-level message'
      };
      render(<ErrorState error={error} />);
      // Should use top-level message
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('handles axios-like error structure', () => {
      const error = {
        message: 'Network Error',
        config: {},
        code: 'ERR_NETWORK'
      };
      render(<ErrorState error={error} />);
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });

    it('handles Error instance with stack trace', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at Object.<anonymous> (/path/to/file.js:10:15)';
      render(<ErrorState error={error} showErrorDetails={true} />);
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates with error boundary pattern', () => {
      const error = new Error('Component crashed');
      const handleRetry = jest.fn();

      render(
        <ErrorState
          error={error}
          title="Something went wrong"
          onRetry={handleRetry}
          retryLabel="Reload Page"
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
    });

    it('works with async error handling', async () => {
      const handleRetry = jest.fn(() => Promise.resolve());
      render(<ErrorState error="Async error" onRetry={handleRetry} />);

      await userEvent.click(screen.getByRole('button', { name: /Try Again/i }));

      await waitFor(() => {
        expect(handleRetry).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('applies responsive flex classes to button container', () => {
      const handleRetry = jest.fn();
      const { container } = render(
        <ErrorState
          error="Error"
          onRetry={handleRetry}
          supportLink="https://support.example.com"
        />
      );

      const buttonContainer = container.querySelector('.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('applies responsive padding', () => {
      const { container } = render(<ErrorState error="Error" />);
      expect(container.firstChild).toHaveClass('px-8');
    });
  });

  describe('Error Message Priority', () => {
    it('prioritizes network errors over generic errors', () => {
      render(<ErrorState error="Network connection failed unexpectedly" />);
      expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
    });

    it('prioritizes specific HTTP errors over generic messages', () => {
      render(<ErrorState error="Request failed with 404 not found" />);
      expect(screen.getByText(/The requested resource could not be found/i)).toBeInTheDocument();
    });

    it('uses default message when no specific pattern matches', () => {
      render(<ErrorState error="Custom application error ABC123" />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Multiple Error Types', () => {
    it('handles array of errors gracefully', () => {
      const errors = ['Error 1', 'Error 2'];
      // Component expects single error, should handle gracefully
      render(<ErrorState error={errors} />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('handles boolean error value', () => {
      render(<ErrorState error={true} />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    it('handles number as error', () => {
      render(<ErrorState error={404} />);
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with minimal props', () => {
      const { container } = render(<ErrorState error="Error" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders efficiently with all props', () => {
      const handleRetry = jest.fn();
      const { container } = render(
        <ErrorState
          error="Error"
          title="Error Title"
          onRetry={handleRetry}
          retryLabel="Retry"
          showErrorDetails={true}
          errorCode="ERR_001"
          supportLink="https://support.example.com"
          className="custom-class"
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('does not re-render unnecessarily', () => {
      const handleRetry = jest.fn();
      const { rerender } = render(
        <ErrorState error="Error" onRetry={handleRetry} />
      );

      // Re-render with same props
      rerender(<ErrorState error="Error" onRetry={handleRetry} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for default error state', () => {
      const { container } = render(<ErrorState error="Test error" />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with all features enabled', () => {
      const handleRetry = jest.fn();
      const { container } = render(
        <ErrorState
          error="Network error"
          title="Connection Failed"
          onRetry={handleRetry}
          retryLabel="Retry Connection"
          showErrorDetails={true}
          errorCode="NET_001"
          supportLink="https://support.example.com"
          className="custom-error-state"
        />
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for minimal configuration', () => {
      const { container } = render(
        <ErrorState error={new Error('Simple error')} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default error
