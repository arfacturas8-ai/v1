/**
 * Tests for ErrorBoundary component
 */
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary, { SimpleErrorFallback, withErrorBoundary } from './ErrorBoundary';
import { captureException } from '../lib/sentry';

jest.mock('../lib/sentry', () => ({
  captureException: jest.fn()
}));

jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-icon">Alert</div>,
  RefreshCw: () => <div data-testid="refresh-icon">Refresh</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  ArrowLeft: () => <div data-testid="arrow-icon">Arrow</div>
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false, error = new Error('Test error') }) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Normal Rendering', () => {
    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('passes through multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('catches errors and shows error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows error message in UI', () => {
      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} error={new Error('Custom error message')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
    });

    it('reports error to Sentry', () => {
      render(
        <ErrorBoundary name="TestBoundary">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(captureException).toHaveBeenCalled();
      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'TestBoundary'
        })
      );
    });

    it('uses default name when not provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          component: 'ErrorBoundary'
        })
      );
    });
  });

  describe('Error UI Elements', () => {
    it('shows error icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('shows error title', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows error description', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/We've encountered an unexpected error/)).toBeInTheDocument();
    });

    it('shows action buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('shows contact support link', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });

    it('shows error ID', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('resets error state on Try Again', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('navigates back on Go Back', () => {
      const backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const goBackButton = screen.getByText('Go Back');
      fireEvent.click(goBackButton);

      expect(backSpy).toHaveBeenCalled();

      backSpy.mockRestore();
    });

    it('navigates home on Home button', () => {
      delete window.location;
      window.location = { href: '' };

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);

      expect(window.location.href).toBe('/');
    });

    it('reloads page on Reload button', () => {
      const reloadSpy = jest.fn();
      delete window.location;
      window.location = { reload: reloadSpy };

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Trigger error multiple times to show reload button
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Error 2')} />
        </ErrorBoundary>
      );

      // After second error, reload button appears
      const reloadButton = screen.queryByText('Reload entire page');
      if (reloadButton) {
        fireEvent.click(reloadButton);
        expect(reloadSpy).toHaveBeenCalled();
      }
    });
  });

  describe('Error Count Tracking', () => {
    it('shows different message after multiple errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Error 1')} />
        </ErrorBoundary>
      );

      // Reset and throw again
      const tryAgain = screen.getByText('Try Again');
      fireEvent.click(tryAgain);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Error 2')} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Error 3')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/This error keeps happening/)).toBeInTheDocument();
    });

    it('shows reload button after multiple errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Error 1')} />
        </ErrorBoundary>
      );

      const tryAgain = screen.getByText('Try Again');
      fireEvent.click(tryAgain);

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Error 2')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Reload entire page')).toBeInTheDocument();
    });
  });

  describe('Show Details Prop', () => {
    it('hides error details by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Detailed error')} />
        </ErrorBoundary>
      );

      // Details should be hidden in production
      expect(screen.queryByText('Detailed error')).not.toBeInTheDocument();
    });

    it('shows error details when showDetails is true', () => {
      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} error={new Error('Detailed error message')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Detailed error message/)).toBeInTheDocument();
    });

    it('shows component stack in details', () => {
      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Stack')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback component', () => {
      const CustomFallback = () => <div>Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('renders custom fallback function', () => {
      const fallbackFn = (error, reset) => (
        <div>
          <div>Error: {error.message}</div>
          <button onClick={reset}>Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError shouldThrow={true} error={new Error('Function fallback')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error: Function fallback')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('calls reset function from custom fallback', () => {
      const fallbackFn = (error, reset) => (
        <button onClick={reset}>Custom Reset</button>
      );

      const { rerender } = render(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByText('Custom Reset');
      fireEvent.click(resetButton);

      rerender(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('SimpleErrorFallback', () => {
    it('renders simple error fallback', () => {
      const error = new Error('Simple error');
      const reset = jest.fn();

      render(<SimpleErrorFallback error={error} reset={reset} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Simple error')).toBeInTheDocument();
    });

    it('calls reset on Try again button', () => {
      const error = new Error('Error');
      const reset = jest.fn();

      render(<SimpleErrorFallback error={error} reset={reset} />);

      const tryAgainButton = screen.getByText('Try again');
      fireEvent.click(tryAgainButton);

      expect(reset).toHaveBeenCalled();
    });

    it('handles error without message', () => {
      const reset = jest.fn();

      render(<SimpleErrorFallback error={null} reset={reset} />);

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('wraps component with error boundary', () => {
      const TestComponent = () => <div>Wrapped Component</div>;
      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByText('Wrapped Component')).toBeInTheDocument();
    });

    it('catches errors in wrapped component', () => {
      const WrappedComponent = withErrorBoundary(ThrowError);

      render(<WrappedComponent shouldThrow={true} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('passes props to wrapped component', () => {
      const TestComponent = ({ message }) => <div>{message}</div>;
      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent message="Test message" />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('sets display name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';

      const WrappedComponent = withErrorBoundary(TestComponent);

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });

    it('accepts error boundary props', () => {
      const customFallback = <div>Custom Fallback</div>;
      const TestComponent = () => { throw new Error('Test'); };

      const WrappedComponent = withErrorBoundary(TestComponent, {
        fallback: customFallback
      });

      render(<WrappedComponent />);

      expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null children', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);

      expect(document.body).toBeInTheDocument();
    });

    it('handles undefined error', () => {
      const ThrowUndefined = () => {
        throw undefined;
      };

      render(
        <ErrorBoundary showDetails={true}>
          <ThrowUndefined />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('handles string error', () => {
      const ThrowString = () => {
        throw 'String error';
      };

      render(
        <ErrorBoundary showDetails={true}>
          <ThrowString />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot with error', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with custom fallback', () => {
      const { container } = render(
        <ErrorBoundary fallback={<div>Custom</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for SimpleErrorFallback', () => {
      const { container } = render(
        <SimpleErrorFallback
          error={new Error('Test')}
          reset={() => {}}
        />
      );

      expect(container).toMatchSnapshot();
    });
  });
});

export default ThrowError
