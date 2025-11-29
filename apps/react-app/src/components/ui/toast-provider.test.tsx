/**
 * Comprehensive Test Suite for CRYB Toast Provider Component
 * Testing provider initialization, useToast hook, toast types, auto-dismiss,
 * manual dismissal, stacking, variants, actions, duration, limits, and accessibility
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from './toast-provider';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      button: mockReact.forwardRef(({ children, ...props }: any, ref: any) => (
        <button ref={ref} {...props}>
          {children}
        </button>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: ({ className }: any) => <span className={className} data-testid="close-icon">X</span>,
  CheckCircle2: ({ className }: any) => <span className={className} data-testid="success-icon">✓</span>,
  AlertCircle: ({ className }: any) => <span className={className} data-testid="error-icon">!</span>,
  AlertTriangle: ({ className }: any) => <span className={className} data-testid="warning-icon">⚠</span>,
  Info: ({ className }: any) => <span className={className} data-testid="info-icon">i</span>,
}));

// Mock react-dom portal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node,
}));

// Test component that uses the useToast hook
function TestComponent() {
  const { toasts, addToast, removeToast, updateToast } = useToast();

  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      <button onClick={() => addToast({ title: 'Test Toast' })}>Add Default</button>
      <button onClick={() => addToast({ title: 'Success', type: 'success' })}>Add Success</button>
      <button onClick={() => addToast({ title: 'Error', type: 'error' })}>Add Error</button>
      <button onClick={() => addToast({ title: 'Warning', type: 'warning' })}>Add Warning</button>
      <button onClick={() => addToast({ title: 'Info', type: 'info' })}>Add Info</button>
      <button onClick={() => addToast({ title: 'With Description', description: 'This is a description' })}>
        Add With Description
      </button>
      <button
        onClick={() =>
          addToast({
            title: 'With Action',
            action: { label: 'Undo', onClick: () => console.log('Undo clicked') },
          })
        }
      >
        Add With Action
      </button>
      <button onClick={() => addToast({ title: 'Custom Duration', duration: 1000 })}>
        Add Custom Duration
      </button>
      <button onClick={() => addToast({ title: 'No Auto Dismiss', duration: 0 })}>
        Add No Auto Dismiss
      </button>
      <button onClick={() => addToast({ title: 'Glass Variant', variant: 'glass' })}>
        Add Glass
      </button>
      <button onClick={() => addToast({ title: 'Gradient Variant', variant: 'gradient' })}>
        Add Gradient
      </button>
      <button onClick={() => addToast({ title: 'Neon Variant', variant: 'neon' })}>
        Add Neon
      </button>
      <button onClick={() => addToast({ title: 'Not Closeable', closeable: false })}>
        Add Not Closeable
      </button>
      <button onClick={() => addToast({ title: 'Custom Icon', icon: <span>🎉</span> })}>
        Add Custom Icon
      </button>
      {toasts.length > 0 && <button onClick={() => removeToast(toasts[0].id)}>Remove First</button>}
      {toasts.length > 0 && (
        <button onClick={() => updateToast(toasts[0].id, { title: 'Updated Title' })}>
          Update First
        </button>
      )}
    </div>
  );
}

describe('ToastProvider Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // ===== PROVIDER INITIALIZATION TESTS =====
  describe('Provider Initialization', () => {
    it('should render children without errors', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child Content</div>
        </ToastProvider>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should initialize with empty toast array', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    });

    it('should provide context to nested components', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByText('Add Default')).toBeInTheDocument();
    });
  });

  // ===== USETOAST HOOK TESTS =====
  describe('useToast Hook', () => {
    it('should throw error when used outside ToastProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });

    it('should provide addToast function', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByText('Add Default')).toBeInTheDocument();
    });

    it('should provide removeToast function', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      expect(screen.getByText('Remove First')).toBeInTheDocument();
    });

    it('should provide updateToast function', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Update First')).toBeInTheDocument();
    });

    it('should provide toasts array', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );
      expect(screen.getByTestId('toast-count')).toBeInTheDocument();
    });
  });

  // ===== ADDING TOASTS TESTS =====
  describe('Adding Toasts', () => {
    it('should add default toast', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    it('should add success toast with icon', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success'));
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });

    it('should add error toast with icon', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Error'));
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('should add warning toast with icon', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Warning'));
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('should add info toast with icon', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Info'));
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('should add toast with description', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add With Description'));
      expect(screen.getByText('With Description')).toBeInTheDocument();
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should generate unique ID for each toast', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      await user.click(screen.getByText('Add Default'));
      expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
    });

    it('should return toast ID when adding toast', async () => {
      const user = userEvent.setup({ delay: null });

      function TestWithId() {
        const { addToast } = useToast();
        const [id, setId] = React.useState<string>('');

        return (
          <div>
            <button onClick={() => setId(addToast({ title: 'Test' }))}>Add</button>
            <div data-testid="toast-id">{id}</div>
          </div>
        );
      }

      render(
        <ToastProvider>
          <TestWithId />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.getByTestId('toast-id')).not.toHaveTextContent('');
    });
  });

  // ===== TOAST AUTO-DISMISS TESTS =====
  describe('Toast Auto-Dismiss', () => {
    it('should auto-dismiss toast after default duration (5000ms)', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
      });
    });

    it('should auto-dismiss toast after custom duration', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Custom Duration'));
      expect(screen.getByText('Custom Duration')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Custom Duration')).not.toBeInTheDocument();
      });
    });

    it('should not auto-dismiss toast when duration is 0', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add No Auto Dismiss'));
      expect(screen.getByText('No Auto Dismiss')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByText('No Auto Dismiss')).toBeInTheDocument();
    });

    it('should not auto-dismiss toast when duration is negative', async () => {
      const user = userEvent.setup({ delay: null });

      function TestNegativeDuration() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ title: 'Never Dismiss', duration: -1 })}>
            Add Negative Duration
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestNegativeDuration />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Negative Duration'));
      expect(screen.getByText('Never Dismiss')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByText('Never Dismiss')).toBeInTheDocument();
    });
  });

  // ===== MANUAL TOAST DISMISSAL TESTS =====
  describe('Manual Toast Dismissal', () => {
    it('should dismiss toast when close button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close notification/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
      });
    });

    it('should dismiss toast using removeToast function', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();

      await user.click(screen.getByText('Remove First'));

      await waitFor(() => {
        expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
      });
    });

    it('should not show close button when closeable is false', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Not Closeable'));
      expect(screen.getByText('Not Closeable')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /close notification/i })).not.toBeInTheDocument();
    });

    it('should show close button by default', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByRole('button', { name: /close notification/i })).toBeInTheDocument();
    });
  });

  // ===== MULTIPLE TOASTS STACKING TESTS =====
  describe('Multiple Toasts Stacking', () => {
    it('should stack multiple toasts', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      await user.click(screen.getByText('Add Success'));
      await user.click(screen.getByText('Add Error'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
    });

    it('should display all toasts simultaneously', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      await user.click(screen.getByText('Add Success'));
      await user.click(screen.getByText('Add Error'));

      expect(screen.getByText('Test Toast')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should dismiss toasts independently', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      await user.click(screen.getByText('Add Success'));

      const closeButtons = screen.getAllByRole('button', { name: /close notification/i });
      await user.click(closeButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
      });
    });

    it('should auto-dismiss multiple toasts at different times', async () => {
      const user = userEvent.setup({ delay: null });

      function TestMultipleDurations() {
        const { addToast } = useToast();
        return (
          <div>
            <button onClick={() => addToast({ title: 'Toast 1', duration: 1000 })}>Add 1s</button>
            <button onClick={() => addToast({ title: 'Toast 2', duration: 2000 })}>Add 2s</button>
          </div>
        );
      }

      render(
        <ToastProvider>
          <TestMultipleDurations />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add 1s'));
      await user.click(screen.getByText('Add 2s'));

      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Toast 2')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
      });
    });
  });

  // ===== TOAST POSITION VARIANTS TESTS =====
  describe('Toast Position Variants', () => {
    it('should render default variant', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    it('should render glass variant', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Glass'));
      expect(screen.getByText('Glass Variant')).toBeInTheDocument();
    });

    it('should render gradient variant', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Gradient'));
      expect(screen.getByText('Gradient Variant')).toBeInTheDocument();
    });

    it('should render neon variant', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Neon'));
      expect(screen.getByText('Neon Variant')).toBeInTheDocument();
    });
  });

  // ===== TOAST WITH ACTIONS TESTS =====
  describe('Toast with Actions', () => {
    it('should render action button', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add With Action'));
      expect(screen.getByText('With Action')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    });

    it('should call action onClick when action button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const mockAction = jest.fn();

      function TestActionClick() {
        const { addToast } = useToast();
        return (
          <button
            onClick={() =>
              addToast({
                title: 'With Action',
                action: { label: 'Click Me', onClick: mockAction },
              })
            }
          >
            Add
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestActionClick />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      const actionButton = screen.getByRole('button', { name: /click me/i });
      await user.click(actionButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should render toast without action button when action is not provided', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();

      // Should only have close button, not action button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1); // Only close button
    });
  });

  // ===== TOAST DURATION CUSTOMIZATION TESTS =====
  describe('Toast Duration Customization', () => {
    it('should use default duration of 5000ms when not specified', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(screen.getByText('Test Toast')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
      });
    });

    it('should respect custom duration', async () => {
      const user = userEvent.setup({ delay: null });

      function TestCustomDuration() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ title: 'Custom', duration: 3000 })}>
            Add 3s
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestCustomDuration />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add 3s'));
      expect(screen.getByText('Custom')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(2999);
      });
      expect(screen.getByText('Custom')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(screen.queryByText('Custom')).not.toBeInTheDocument();
      });
    });

    it('should handle very short durations', async () => {
      const user = userEvent.setup({ delay: null });

      function TestShortDuration() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ title: 'Short', duration: 100 })}>
            Add 100ms
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestShortDuration />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add 100ms'));
      expect(screen.getByText('Short')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.queryByText('Short')).not.toBeInTheDocument();
      });
    });

    it('should handle very long durations', async () => {
      const user = userEvent.setup({ delay: null });

      function TestLongDuration() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ title: 'Long', duration: 30000 })}>
            Add 30s
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestLongDuration />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add 30s'));
      expect(screen.getByText('Long')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(29999);
      });
      expect(screen.getByText('Long')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(screen.queryByText('Long')).not.toBeInTheDocument();
      });
    });
  });

  // ===== TOAST UPDATE TESTS =====
  describe('Toast Update', () => {
    it('should update toast title', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();

      await user.click(screen.getByText('Update First'));
      expect(screen.getByText('Updated Title')).toBeInTheDocument();
      expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
    });

    it('should update toast description', async () => {
      const user = userEvent.setup({ delay: null });

      function TestUpdateDescription() {
        const { toasts, addToast, updateToast } = useToast();
        return (
          <div>
            <button onClick={() => addToast({ title: 'Test', description: 'Original' })}>
              Add
            </button>
            {toasts.length > 0 && (
              <button onClick={() => updateToast(toasts[0].id, { description: 'Updated' })}>
                Update
              </button>
            )}
          </div>
        );
      }

      render(
        <ToastProvider>
          <TestUpdateDescription />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.getByText('Original')).toBeInTheDocument();

      await user.click(screen.getByText('Update'));
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
    });

    it('should update toast type', async () => {
      const user = userEvent.setup({ delay: null });

      function TestUpdateType() {
        const { toasts, addToast, updateToast } = useToast();
        return (
          <div>
            <button onClick={() => addToast({ title: 'Test', type: 'default' })}>
              Add
            </button>
            {toasts.length > 0 && (
              <button onClick={() => updateToast(toasts[0].id, { type: 'success' })}>
                Update
              </button>
            )}
          </div>
        );
      }

      render(
        <ToastProvider>
          <TestUpdateType />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.queryByTestId('success-icon')).not.toBeInTheDocument();

      await user.click(screen.getByText('Update'));
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });
  });

  // ===== CUSTOM ICON TESTS =====
  describe('Custom Icon', () => {
    it('should render custom icon when provided', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Custom Icon'));
      expect(screen.getByText('Custom Icon')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should use custom icon over type icon', async () => {
      const user = userEvent.setup({ delay: null });

      function TestCustomOverType() {
        const { addToast } = useToast();
        return (
          <button
            onClick={() =>
              addToast({
                title: 'Test',
                type: 'success',
                icon: <span data-testid="custom">Custom</span>,
              })
            }
          >
            Add
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestCustomOverType />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.getByTestId('custom')).toBeInTheDocument();
      expect(screen.queryByTestId('success-icon')).not.toBeInTheDocument();
    });

    it('should render without icon when none provided and type is default', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
      expect(screen.queryByTestId('success-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('info-icon')).not.toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have close button with aria-label', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      const closeButton = screen.getByRole('button', { name: /close notification/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });

    it('should be keyboard accessible for closing', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      const closeButton = screen.getByRole('button', { name: /close notification/i });

      closeButton.focus();
      expect(closeButton).toHaveFocus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.queryByText('Test Toast')).not.toBeInTheDocument();
      });
    });

    it('should be keyboard accessible for action buttons', async () => {
      const user = userEvent.setup({ delay: null });
      const mockAction = jest.fn();

      function TestActionKeyboard() {
        const { addToast } = useToast();
        return (
          <button
            onClick={() =>
              addToast({
                title: 'Test',
                action: { label: 'Action', onClick: mockAction },
              })
            }
          >
            Add
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestActionKeyboard />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      const actionButton = screen.getByRole('button', { name: /action/i });

      actionButton.focus();
      await user.keyboard('{Enter}');

      expect(mockAction).toHaveBeenCalled();
    });

    it('should support screen readers with proper semantic structure', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add With Description'));
      expect(screen.getByText('With Description')).toBeInTheDocument();
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should handle focus management properly', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const addButton = screen.getByText('Add Default');
      addButton.focus();
      expect(addButton).toHaveFocus();

      await user.click(addButton);

      // Focus should remain on the add button after toast appears
      expect(addButton).toHaveFocus();
    });
  });

  // ===== VIEWPORT RENDERING TESTS =====
  describe('Viewport Rendering', () => {
    it('should render toast viewport in document body', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    it('should handle SSR gracefully', () => {
      // Mock window as undefined to simulate SSR
      const windowSpy = jest.spyOn(global, 'window', 'get');
      windowSpy.mockImplementation(() => undefined as any);

      render(
        <ToastProvider>
          <div>SSR Content</div>
        </ToastProvider>
      );

      expect(screen.getByText('SSR Content')).toBeInTheDocument();

      windowSpy.mockRestore();
    });
  });

  // ===== EDGE CASES TESTS =====
  describe('Edge Cases', () => {
    it('should handle rapid toast additions', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      await user.click(screen.getByText('Add Success'));
      await user.click(screen.getByText('Add Error'));
      await user.click(screen.getByText('Add Warning'));
      await user.click(screen.getByText('Add Info'));

      expect(screen.getByTestId('toast-count')).toHaveTextContent('5');
    });

    it('should handle toast removal while others remain', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      await user.click(screen.getByText('Add Success'));
      await user.click(screen.getByText('Add Error'));

      const closeButtons = screen.getAllByRole('button', { name: /close notification/i });
      await user.click(closeButtons[1]); // Remove middle toast

      await waitFor(() => {
        expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
      });
    });

    it('should handle empty title and description', async () => {
      const user = userEvent.setup({ delay: null });

      function TestEmpty() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({})}>
            Add Empty
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestEmpty />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Empty'));
      // Toast should still render even without title/description
      expect(screen.getByRole('button', { name: /close notification/i })).toBeInTheDocument();
    });

    it('should handle title without description', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Default'));
      expect(screen.getByText('Test Toast')).toBeInTheDocument();
    });

    it('should handle description without title', async () => {
      const user = userEvent.setup({ delay: null });

      function TestDescriptionOnly() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ description: 'Only description' })}>
            Add
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestDescriptionOnly />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.getByText('Only description')).toBeInTheDocument();
    });

    it('should handle removing non-existent toast gracefully', async () => {
      const user = userEvent.setup({ delay: null });

      function TestRemoveNonExistent() {
        const { removeToast } = useToast();
        return (
          <button onClick={() => removeToast('non-existent-id')}>
            Remove Non-existent
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestRemoveNonExistent />
        </ToastProvider>
      );

      // Should not throw error
      await user.click(screen.getByText('Remove Non-existent'));
    });

    it('should handle updating non-existent toast gracefully', async () => {
      const user = userEvent.setup({ delay: null });

      function TestUpdateNonExistent() {
        const { updateToast } = useToast();
        return (
          <button onClick={() => updateToast('non-existent-id', { title: 'Updated' })}>
            Update Non-existent
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestUpdateNonExistent />
        </ToastProvider>
      );

      // Should not throw error
      await user.click(screen.getByText('Update Non-existent'));
    });
  });

  // ===== TYPE COMBINATIONS TESTS =====
  describe('Type and Variant Combinations', () => {
    it('should handle success type with glass variant', async () => {
      const user = userEvent.setup({ delay: null });

      function TestCombination() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ title: 'Test', type: 'success', variant: 'glass' })}>
            Add
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestCombination />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });

    it('should handle error type with gradient variant', async () => {
      const user = userEvent.setup({ delay: null });

      function TestCombination() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ title: 'Test', type: 'error', variant: 'gradient' })}>
            Add
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestCombination />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('should handle warning type with neon variant', async () => {
      const user = userEvent.setup({ delay: null });

      function TestCombination() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ title: 'Test', type: 'warning', variant: 'neon' })}>
            Add
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestCombination />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('should handle info type with default variant', async () => {
      const user = userEvent.setup({ delay: null });

      function TestCombination() {
        const { addToast } = useToast();
        return (
          <button onClick={() => addToast({ title: 'Test', type: 'info', variant: 'default' })}>
            Add
          </button>
        );
      }

      render(
        <ToastProvider>
          <TestCombination />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add'));
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });
  });
});
