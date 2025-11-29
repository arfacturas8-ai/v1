/**
 * Tests for GlobalErrorBoundary component
 */
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalErrorBoundary from './GlobalErrorBoundary';

jest.mock('lucide-react', () => ({
  AlertTriangle: ({ size, color }) => <svg data-testid="alert-triangle-icon" width={size} style={{ color }} />,
  RefreshCw: ({ size }) => <svg data-testid="refresh-icon" width={size} />,
  Home: ({ size }) => <svg data-testid="home-icon" width={size} />
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false, error = new Error('Test error') }) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>No error</div>;
};

describe('GlobalErrorBoundary', () => {
  let consoleErrorSpy;
  const originalEnv = import.meta.env;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete window.Sentry;
    delete window.gtag;
    import.meta.env = originalEnv;
  });

  describe('Normal Rendering', () => {
    it('renders without crashing', () => {
      render(
        <GlobalErrorBoundary>
          <div>Test content</div>
        </GlobalErrorBoundary>
      );
    });

    it('renders children when no error', () => {
      render(
        <GlobalErrorBoundary>
          <div>Test content</div>
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('passes through multiple children', () => {
      render(
        <GlobalErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches errors and shows error UI', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('displays error icon', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('shows apology message', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText(/We're sorry, but something unexpected happened/i)).toBeInTheDocument();
    });

    it('logs error to console', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );
    });

    it('shows Try Again button', () => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('shows Reload Page button', () => {
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('shows Go Home button', () => {
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('shows all refresh icons', () => {
      const refreshIcons = screen.getAllByTestId('refresh-icon');
      expect(refreshIcons).toHaveLength(2); // Try Again and Reload
    });

    it('shows home icon', () => {
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    });
  });

  describe('Try Again Functionality', () => {
    it('resets error state on Try Again', () => {
      const { rerender } = render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      rerender(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={false} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('clears error and errorInfo on reset', () => {
      const { rerender } = render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={false} />
        </GlobalErrorBoundary>
      );

      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Reload Functionality', () => {
    it('reloads page on Reload button click', () => {
      const reloadSpy = jest.fn();
      delete window.location;
      window.location = { reload: reloadSpy };

      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      const reloadButton = screen.getByText('Reload Page');
      fireEvent.click(reloadButton);

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('Go Home Functionality', () => {
    it('navigates home on Go Home button click', () => {
      delete window.location;
      window.location = { href: '' };

      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      const homeButton = screen.getByText('Go Home');
      fireEvent.click(homeButton);

      expect(window.location.href).toBe('/');
    });
  });

  describe('Error Count Tracking', () => {
    it('increments error count on subsequent errors', () => {
      const { rerender } = render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Second error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText(/This error has occurred 2 times/i)).toBeInTheDocument();
    });

    it('shows warning after multiple errors', () => {
      const { rerender } = render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Second error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText(/Please try refreshing the page/i)).toBeInTheDocument();
    });

    it('does not show warning on first error', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(screen.queryByText(/This error has occurred/i)).not.toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    beforeEach(() => {
      import.meta.env.DEV = true;
    });

    it('shows error details in development mode', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Detailed error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development Mode):')).toBeInTheDocument();
    });

    it('displays error message in development mode', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Specific error message')} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText(/Specific error message/)).toBeInTheDocument();
    });

    it('shows component stack in development mode', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Component Stack')).toBeInTheDocument();
    });
  });

  describe('Production Mode', () => {
    beforeEach(() => {
      import.meta.env.DEV = false;
    });

    it('hides error details in production mode', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Production error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development Mode):')).not.toBeInTheDocument();
    });

    it('does not show error message in production', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Secret error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.queryByText(/Secret error/)).not.toBeInTheDocument();
    });
  });

  describe('Sentry Integration', () => {
    it('sends error to Sentry when available', () => {
      const sentryCaptureException = jest.fn();
      window.Sentry = {
        captureException: sentryCaptureException
      };

      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(sentryCaptureException).toHaveBeenCalled();
      expect(sentryCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          contexts: expect.objectContaining({
            react: expect.objectContaining({
              componentStack: expect.any(String)
            })
          })
        })
      );
    });

    it('does not crash when Sentry is not available', () => {
      delete window.Sentry;

      expect(() => {
        render(
          <GlobalErrorBoundary>
            <ThrowError shouldThrow={true} />
          </GlobalErrorBoundary>
        );
      }).not.toThrow();
    });
  });

  describe('Analytics Integration', () => {
    it('sends error to gtag when available', () => {
      const gtagSpy = jest.fn();
      window.gtag = gtagSpy;

      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Analytics error')} />
        </GlobalErrorBoundary>
      );

      expect(gtagSpy).toHaveBeenCalledWith('event', 'exception', {
        description: expect.stringContaining('Analytics error'),
        fatal: true
      });
    });

    it('does not crash when gtag is not available', () => {
      delete window.gtag;

      expect(() => {
        render(
          <GlobalErrorBoundary>
            <ThrowError shouldThrow={true} />
          </GlobalErrorBoundary>
        );
      }).not.toThrow();
    });
  });

  describe('UI Styling', () => {
    beforeEach(() => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );
    });

    it('has gradient background', () => {
      const container = screen.getByText('Oops! Something went wrong').closest('div').parentElement.parentElement;
      expect(container).toHaveStyle({
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      });
    });

    it('centers content vertically', () => {
      const container = screen.getByText('Oops! Something went wrong').closest('div').parentElement.parentElement;
      expect(container).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
    });

    it('has white card background', () => {
      const card = screen.getByText('Oops! Something went wrong').closest('div').parentElement;
      expect(card).toHaveStyle({
        background: 'white',
        borderRadius: '16px'
      });
    });
  });

  describe('Contact Support Link', () => {
    it('shows contact support link', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      const contactLink = screen.getByText('contact support');
      expect(contactLink).toBeInTheDocument();
      expect(contactLink.closest('a')).toHaveAttribute('href', '/contact');
    });

    it('includes persistence message', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText(/If this problem persists/i)).toBeInTheDocument();
    });
  });

  describe('Icon Styling', () => {
    it('renders alert icon with correct size', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveAttribute('width', '40');
    });

    it('has red background for icon container', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      const iconContainer = screen.getByTestId('alert-triangle-icon').parentElement;
      expect(iconContainer).toHaveStyle({
        background: '#fee2e2',
        borderRadius: '50%'
      });
    });
  });

  describe('Button Hover Effects', () => {
    beforeEach(() => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );
    });

    it('Try Again button changes on hover', () => {
      const button = screen.getByText('Try Again');

      fireEvent.mouseOver(button);
      expect(button).toHaveStyle({ background: '#2563eb' });

      fireEvent.mouseOut(button);
      expect(button).toHaveStyle({ background: '#3b82f6' });
    });

    it('Reload Page button changes on hover', () => {
      const button = screen.getByText('Reload Page');

      fireEvent.mouseOver(button);
      expect(button).toHaveStyle({ background: '#4b5563' });

      fireEvent.mouseOut(button);
      expect(button).toHaveStyle({ background: '#6b7280' });
    });

    it('Go Home button changes on hover', () => {
      const button = screen.getByText('Go Home');

      fireEvent.mouseOver(button);
      expect(button).toHaveStyle({
        background: '#3b82f6',
        color: 'white'
      });

      fireEvent.mouseOut(button);
      expect(button).toHaveStyle({
        background: 'transparent',
        color: '#3b82f6'
      });
    });
  });

  describe('Error Types', () => {
    it('handles Error objects', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Standard error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('handles TypeError', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new TypeError('Type error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('handles ReferenceError', () => {
      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new ReferenceError('Reference error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('handles custom errors', () => {
      class CustomError extends Error {
        constructor(message) {
          super(message);
          this.name = 'CustomError';
        }
      }

      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new CustomError('Custom error')} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null children', () => {
      render(<GlobalErrorBoundary>{null}</GlobalErrorBoundary>);
      expect(document.body).toBeInTheDocument();
    });

    it('handles undefined error', () => {
      const ThrowUndefined = () => {
        throw undefined;
      };

      render(
        <GlobalErrorBoundary>
          <ThrowUndefined />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('handles string error', () => {
      const ThrowString = () => {
        throw 'String error';
      };

      render(
        <GlobalErrorBoundary>
          <ThrowString />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('handles very long error messages', () => {
      const longError = new Error('A'.repeat(1000));

      render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={longError} />
        </GlobalErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot with error', () => {
      const { container } = render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot without error', () => {
      const { container } = render(
        <GlobalErrorBoundary>
          <div>Content</div>
        </GlobalErrorBoundary>
      );

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with multiple errors', () => {
      const { container, rerender } = render(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} />
        </GlobalErrorBoundary>
      );

      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <GlobalErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Second error')} />
        </GlobalErrorBoundary>
      );

      expect(container).toMatchSnapshot();
    });
  });
});

export default ThrowError
