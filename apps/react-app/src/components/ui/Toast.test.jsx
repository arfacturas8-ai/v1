import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast, { ToastContainer } from './Toast';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: ({ className, ...props }) => (
    <svg data-testid="icon-x" className={className} {...props} />
  ),
  CheckCircle: ({ className, ...props }) => (
    <svg data-testid="icon-check-circle" className={className} {...props} />
  ),
  AlertCircle: ({ className, ...props }) => (
    <svg data-testid="icon-alert-circle" className={className} {...props} />
  ),
  Info: ({ className, ...props }) => (
    <svg data-testid="icon-info" className={className} {...props} />
  ),
  AlertTriangle: ({ className, ...props }) => (
    <svg data-testid="icon-alert-triangle" className={className} {...props} />
  ),
}));

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Toast id="1" message="Test message" onClose={jest.fn()} />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with title and message', () => {
      render(
        <Toast
          id="1"
          title="Test Title"
          message="Test message"
          onClose={jest.fn()}
        />
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders with only title', () => {
      render(<Toast id="1" title="Test Title" onClose={jest.fn()} />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders with only message', () => {
      render(<Toast id="1" message="Test message" onClose={jest.fn()} />);
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders without title and message', () => {
      const { container } = render(<Toast id="1" onClose={jest.fn()} />);
      expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });

    it('applies custom className', () => {
      const { container } = render(
        <Toast
          id="1"
          message="Test"
          onClose={jest.fn()}
          className="custom-class"
        />
      );
      const toastContent = container.querySelector('.custom-class');
      expect(toastContent).toBeInTheDocument();
    });
  });

  describe('Toast Types', () => {
    it('renders success type with correct icon', () => {
      const { container } = render(
        <Toast id="1" message="Success" type="success" onClose={jest.fn()} />
      );
      expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument();
      const toastElement = container.querySelector('.text-success');
      expect(toastElement).toBeInTheDocument();
    });

    it('renders error type with correct icon', () => {
      const { container } = render(
        <Toast id="1" message="Error" type="error" onClose={jest.fn()} />
      );
      expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
      const toastElement = container.querySelector('.text-error');
      expect(toastElement).toBeInTheDocument();
    });

    it('renders warning type with correct icon', () => {
      const { container } = render(
        <Toast id="1" message="Warning" type="warning" onClose={jest.fn()} />
      );
      expect(screen.getByTestId('icon-alert-triangle')).toBeInTheDocument();
      const toastElement = container.querySelector('.text-warning');
      expect(toastElement).toBeInTheDocument();
    });

    it('renders info type with correct icon (default)', () => {
      const { container } = render(
        <Toast id="1" message="Info" type="info" onClose={jest.fn()} />
      );
      expect(screen.getByTestId('icon-info')).toBeInTheDocument();
      const toastElement = container.querySelector('.text-info');
      expect(toastElement).toBeInTheDocument();
    });

    it('defaults to info type when not specified', () => {
      const { container } = render(
        <Toast id="1" message="Default" onClose={jest.fn()} />
      );
      expect(screen.getByTestId('icon-info')).toBeInTheDocument();
    });

    it('icon has aria-hidden attribute', () => {
      render(<Toast id="1" message="Test" type="success" onClose={jest.fn()} />);
      const icon = screen.getByTestId('icon-check-circle');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Positions', () => {
    it('applies top-right position (default)', () => {
      const { container } = render(
        <Toast id="1" message="Test" onClose={jest.fn()} />
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/top-lg.*right-lg/);
    });

    it('applies top-left position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="top-left" onClose={jest.fn()} />
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/top-lg.*left-lg/);
    });

    it('applies top-center position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="top-center" onClose={jest.fn()} />
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/top-lg.*left-1\/2/);
      expect(alert?.className).toMatch(/-translate-x-1\/2/);
    });

    it('applies bottom-left position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="bottom-left" onClose={jest.fn()} />
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/bottom-lg.*left-lg/);
    });

    it('applies bottom-center position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="bottom-center" onClose={jest.fn()} />
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/bottom-lg.*left-1\/2/);
      expect(alert?.className).toMatch(/-translate-x-1\/2/);
    });

    it('applies bottom-right position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="bottom-right" onClose={jest.fn()} />
      );
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/bottom-lg.*right-lg/);
    });
  });

  describe('Manual Dismiss', () => {
    it('renders close button when closable is true (default)', () => {
      render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });

    it('does not render close button when closable is false', () => {
      render(<Toast id="1" message="Test" closable={false} onClose={jest.fn()} />);
      expect(screen.queryByLabelText('Close notification')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" onClose={handleClose} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).toHaveBeenCalledWith('1');
    });

    it('does not call onClose immediately', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" onClose={handleClose} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('calls onClose after animation duration', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" onClose={handleClose} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(handleClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(handleClose).toHaveBeenCalledWith('1');
    });

    it('close button has proper accessibility attributes', () => {
      render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });

    it('does not close multiple times when clicked rapidly', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" onClose={handleClose} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Handling', () => {
    it('closes on Escape key when closable is true', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).toHaveBeenCalledWith('1');
    });

    it('does not close on Escape when closable is false', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" closable={false} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not close on other keys', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('removes event listener on unmount', () => {
      const handleClose = jest.fn();
      const { unmount } = render(<Toast id="1" message="Test" onClose={handleClose} />);

      unmount();

      fireEvent.keyDown(document, { key: 'Escape' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Auto-Dismiss', () => {
    it('auto-closes after default duration (5000ms)', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" onClose={handleClose} />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).toHaveBeenCalledWith('1');
    });

    it('auto-closes after custom duration', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" duration={3000} onClose={handleClose} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).toHaveBeenCalledWith('1');
    });

    it('does not auto-close when autoClose is false', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" autoClose={false} onClose={handleClose} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not auto-close when duration is 0', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" duration={0} onClose={handleClose} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not auto-close when duration is negative', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" duration={-1} onClose={handleClose} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Pause on Hover', () => {
    it('pauses auto-close on mouse enter', () => {
      const handleClose = jest.fn();
      const { container } = render(
        <Toast id="1" message="Test" duration={1000} onClose={handleClose} />
      );

      const toastContent = container.querySelector('.bg-bg-secondary');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      fireEvent.mouseEnter(toastContent);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('resumes auto-close on mouse leave', () => {
      const handleClose = jest.fn();
      const { container } = render(
        <Toast id="1" message="Test" duration={1000} onClose={handleClose} />
      );

      const toastContent = container.querySelector('.bg-bg-secondary');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      fireEvent.mouseEnter(toastContent);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      fireEvent.mouseLeave(toastContent);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).toHaveBeenCalledWith('1');
    });

    it('does not pause when autoClose is false', () => {
      const handleClose = jest.fn();
      const { container } = render(
        <Toast id="1" message="Test" autoClose={false} onClose={handleClose} />
      );

      const toastContent = container.querySelector('.bg-bg-secondary');
      fireEvent.mouseEnter(toastContent);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Progress Bar', () => {
    it('shows progress bar when autoClose is true', () => {
      const { container } = render(
        <Toast id="1" message="Test" autoClose={true} duration={5000} onClose={jest.fn()} />
      );

      const progressBar = container.querySelector('.h-1');
      expect(progressBar).toBeInTheDocument();
    });

    it('does not show progress bar when autoClose is false', () => {
      const { container } = render(
        <Toast id="1" message="Test" autoClose={false} onClose={jest.fn()} />
      );

      const progressBar = container.querySelector('.h-1');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('does not show progress bar when duration is 0', () => {
      const { container } = render(
        <Toast id="1" message="Test" autoClose={true} duration={0} onClose={jest.fn()} />
      );

      const progressBar = container.querySelector('.h-1');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('progress bar starts at 100%', () => {
      const { container } = render(
        <Toast id="1" message="Test" duration={1000} onClose={jest.fn()} />
      );

      act(() => {
        jest.advanceTimersByTime(50);
      });

      const progressInner = container.querySelector('.h-full');
      expect(progressInner).toHaveStyle({ width: '100%' });
    });

    it('progress bar decreases over time', () => {
      const { container } = render(
        <Toast id="1" message="Test" duration={1000} onClose={jest.fn()} />
      );

      act(() => {
        jest.advanceTimersByTime(50);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const progressInner = container.querySelector('.h-full');
      const width = progressInner?.style.width;
      expect(width).not.toBe('100%');
      expect(width).not.toBe('0%');
    });

    it('progress bar color matches toast type - success', () => {
      const { container } = render(
        <Toast id="1" message="Test" type="success" duration={1000} onClose={jest.fn()} />
      );

      const progressInner = container.querySelector('.bg-success');
      expect(progressInner).toBeInTheDocument();
    });

    it('progress bar color matches toast type - error', () => {
      const { container } = render(
        <Toast id="1" message="Test" type="error" duration={1000} onClose={jest.fn()} />
      );

      const progressInner = container.querySelector('.bg-error');
      expect(progressInner).toBeInTheDocument();
    });

    it('progress bar color matches toast type - warning', () => {
      const { container } = render(
        <Toast id="1" message="Test" type="warning" duration={1000} onClose={jest.fn()} />
      );

      const progressInner = container.querySelector('.bg-warning');
      expect(progressInner).toBeInTheDocument();
    });

    it('progress bar color matches toast type - info', () => {
      const { container } = render(
        <Toast id="1" message="Test" type="info" duration={1000} onClose={jest.fn()} />
      );

      const progressInner = container.querySelector('.bg-info');
      expect(progressInner).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('renders action button when provided', () => {
      const handleAction = jest.fn();
      render(
        <Toast
          id="1"
          message="Test"
          action={{ label: 'Undo', onClick: handleAction }}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('calls action onClick when clicked', () => {
      const handleAction = jest.fn();
      render(
        <Toast
          id="1"
          message="Test"
          action={{ label: 'Retry', onClick: handleAction }}
          onClose={jest.fn()}
        />
      );

      const actionButton = screen.getByText('Retry');
      fireEvent.click(actionButton);

      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('does not render action button when not provided', () => {
      render(<Toast id="1" message="Test" onClose={jest.fn()} />);

      const buttons = screen.queryAllByRole('button');
      // Only close button should exist
      expect(buttons.length).toBe(1);
    });

    it('action button has proper focus styles', () => {
      const handleAction = jest.fn();
      render(
        <Toast
          id="1"
          message="Test"
          action={{ label: 'Action', onClick: handleAction }}
          onClose={jest.fn()}
        />
      );

      const actionButton = screen.getByText('Action');
      expect(actionButton.className).toMatch(/focus:outline-none/);
      expect(actionButton.className).toMatch(/focus:ring-2/);
    });
  });

  describe('Animations', () => {
    it('initially has opacity-0 class', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/opacity-0/);
    });

    it('becomes visible after initial delay', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);

      act(() => {
        jest.advanceTimersByTime(50);
      });

      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/opacity-100/);
    });

    it('applies slide-in animation for top-right position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="top-right" onClose={jest.fn()} />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/translate-x-full/);
    });

    it('applies slide-in animation for top-left position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="top-left" onClose={jest.fn()} />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/-translate-x-full/);
    });

    it('applies slide-in animation for top-center position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="top-center" onClose={jest.fn()} />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/-translate-y-full/);
    });

    it('applies slide-in animation for bottom-center position', () => {
      const { container } = render(
        <Toast id="1" message="Test" position="bottom-center" onClose={jest.fn()} />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/translate-y-full/);
    });

    it('applies exit animation when closing', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/opacity-0/);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onClose gracefully', () => {
      render(<Toast id="1" message="Test" />);

      const closeButton = screen.getByLabelText('Close notification');
      expect(() => fireEvent.click(closeButton)).not.toThrow();
    });

    it('handles auto-close with missing onClose', () => {
      render(<Toast id="1" message="Test" duration={1000} />);

      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1300);
        });
      }).not.toThrow();
    });

    it('handles very short durations', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" duration={10} onClose={handleClose} />);

      act(() => {
        jest.advanceTimersByTime(110);
      });

      expect(handleClose).toHaveBeenCalled();
    });

    it('handles very long durations', () => {
      const handleClose = jest.fn();
      render(<Toast id="1" message="Test" duration={1000000} onClose={handleClose} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('handles empty string message', () => {
      render(<Toast id="1" message="" onClose={jest.fn()} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles empty string title', () => {
      render(<Toast id="1" title="" message="Test" onClose={jest.fn()} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('handles long text content', () => {
      const longText = 'A'.repeat(500);
      render(<Toast id="1" message={longText} onClose={jest.fn()} />);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('handles special characters in text', () => {
      render(
        <Toast
          id="1"
          title="<script>alert('xss')</script>"
          message="&nbsp;&lt;&gt;"
          onClose={jest.fn()}
        />
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles numeric id', () => {
      const handleClose = jest.fn();
      render(<Toast id={123} message="Test" onClose={handleClose} />);

      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(handleClose).toHaveBeenCalledWith(123);
    });

    it('cleans up timers on unmount', () => {
      const { unmount } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      unmount();
      expect(() => jest.runAllTimers()).not.toThrow();
    });
  });

  describe('Styling and Layout', () => {
    it('has fixed positioning', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/fixed/);
    });

    it('has high z-index', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/z-50/);
    });

    it('has max-width constraint', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const alert = container.querySelector('[role="alert"]');
      expect(alert?.className).toMatch(/max-w-sm/);
    });

    it('applies rounded corners', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const toastContent = container.querySelector('.rounded-lg');
      expect(toastContent).toBeInTheDocument();
    });

    it('applies shadow', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const toastContent = container.querySelector('.shadow-lg');
      expect(toastContent).toBeInTheDocument();
    });

    it('has hover effect on shadow', () => {
      const { container } = render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const toastContent = container.querySelector('.hover\\:shadow-xl');
      expect(toastContent).toBeInTheDocument();
    });

    it('uses flexbox layout for content', () => {
      const { container } = render(
        <Toast id="1" title="Title" message="Message" onClose={jest.fn()} />
      );
      const flexContainer = container.querySelector('.flex.items-start');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('close button has accessible label', () => {
      render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
    });

    it('icons have aria-hidden attribute', () => {
      render(<Toast id="1" message="Test" type="success" onClose={jest.fn()} />);
      const icon = screen.getByTestId('icon-check-circle');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('maintains semantic structure with title as h3', () => {
      render(<Toast id="1" title="Important" message="Test" onClose={jest.fn()} />);
      const title = screen.getByText('Important');
      expect(title.tagName).toBe('H3');
    });

    it('message is in paragraph element', () => {
      render(<Toast id="1" message="Test message" onClose={jest.fn()} />);
      const message = screen.getByText('Test message');
      expect(message.tagName).toBe('P');
    });

    it('has focus styles on close button', () => {
      render(<Toast id="1" message="Test" onClose={jest.fn()} />);
      const closeButton = screen.getByLabelText('Close notification');
      expect(closeButton.className).toMatch(/focus:outline-none/);
      expect(closeButton.className).toMatch(/focus:ring-2/);
    });
  });
});

describe('ToastContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing with empty toasts', () => {
      render(<ToastContainer toasts={[]} />);
      expect(document.body).toBeInTheDocument();
    });

    it('returns null when toasts is null', () => {
      const { container } = render(<ToastContainer toasts={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when toasts is undefined', () => {
      const { container } = render(<ToastContainer toasts={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when toasts array is empty', () => {
      const { container } = render(<ToastContainer toasts={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders single toast', () => {
      const toasts = [
        { id: '1', message: 'Test toast', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);
      expect(screen.getByText('Test toast')).toBeInTheDocument();
    });

    it('renders multiple toasts', () => {
      const toasts = [
        { id: '1', message: 'First toast', onClose: jest.fn() },
        { id: '2', message: 'Second toast', onClose: jest.fn() },
        { id: '3', message: 'Third toast', onClose: jest.fn() },
      ];
      render(<ToastContainer toasts={toasts} />);
      expect(screen.getByText('First toast')).toBeInTheDocument();
      expect(screen.getByText('Second toast')).toBeInTheDocument();
      expect(screen.getByText('Third toast')).toBeInTheDocument();
    });
  });

  describe('Portal Behavior', () => {
    it('renders toasts in portal to document.body', () => {
      const toasts = [
        { id: '1', message: 'Portal test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      // Check if toast is rendered in body, not in the React root
      const toastInBody = document.body.querySelector('[role="alert"]');
      expect(toastInBody).toBeInTheDocument();
    });

    it('portal container has pointer-events-none', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      const portalContainer = document.body.querySelector('.pointer-events-none');
      expect(portalContainer).toBeInTheDocument();
    });

    it('toasts have pointer-events-auto', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      const toastWrapper = document.body.querySelector('.pointer-events-auto');
      expect(toastWrapper).toBeInTheDocument();
    });

    it('portal container has high z-index', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      const portalContainer = document.body.querySelector('.z-50');
      expect(portalContainer).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('positions toasts at top by default', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      const container = document.body.querySelector('.top-0');
      expect(container).toBeInTheDocument();
    });

    it('positions toasts at top when position is top-right', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} position="top-right" />);

      const container = document.body.querySelector('.top-0.right-0');
      expect(container).toBeInTheDocument();
    });

    it('positions toasts at top when position is top-left', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} position="top-left" />);

      const container = document.body.querySelector('.top-0.left-0');
      expect(container).toBeInTheDocument();
    });

    it('positions toasts at top center when position is top-center', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} position="top-center" />);

      const container = document.body.querySelector('.top-0.left-1\\/2');
      expect(container).toBeInTheDocument();
    });

    it('positions toasts at bottom when position is bottom-right', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} position="bottom-right" />);

      const container = document.body.querySelector('.bottom-0.right-0');
      expect(container).toBeInTheDocument();
    });

    it('positions toasts at bottom when position is bottom-left', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} position="bottom-left" />);

      const container = document.body.querySelector('.bottom-0.left-0');
      expect(container).toBeInTheDocument();
    });

    it('positions toasts at bottom center when position is bottom-center', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} position="bottom-center" />);

      const container = document.body.querySelector('.bottom-0.left-1\\/2');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Stacking', () => {
    it('stacks toasts vertically with gap', () => {
      const toasts = [
        { id: '1', message: 'First', onClose: jest.fn() },
        { id: '2', message: 'Second', onClose: jest.fn() },
      ];
      render(<ToastContainer toasts={toasts} />);

      const stackContainer = document.body.querySelector('.flex-col.gap-sm');
      expect(stackContainer).toBeInTheDocument();
    });

    it('renders toasts in order', () => {
      const toasts = [
        { id: '1', message: 'First', onClose: jest.fn() },
        { id: '2', message: 'Second', onClose: jest.fn() },
        { id: '3', message: 'Third', onClose: jest.fn() },
      ];
      render(<ToastContainer toasts={toasts} />);

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(3);
    });

    it('each toast has unique key', () => {
      const toasts = [
        { id: '1', message: 'First', onClose: jest.fn() },
        { id: '2', message: 'Second', onClose: jest.fn() },
      ];

      const { container } = render(<ToastContainer toasts={toasts} />);
      const wrappers = document.body.querySelectorAll('.pointer-events-auto');
      expect(wrappers).toHaveLength(2);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className to container', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} className="custom-toast-container" />);

      const container = document.body.querySelector('.custom-toast-container');
      expect(container).toBeInTheDocument();
    });

    it('applies padding to container', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      const container = document.body.querySelector('.p-lg');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Toast Props Forwarding', () => {
    it('forwards all toast props correctly', () => {
      const toasts = [
        {
          id: '1',
          title: 'Test Title',
          message: 'Test Message',
          type: 'success',
          duration: 3000,
          position: 'top-right',
          closable: true,
          onClose: jest.fn(),
        }
      ];
      render(<ToastContainer toasts={toasts} />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Message')).toBeInTheDocument();
      expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument();
    });

    it('forwards action prop to toast', () => {
      const handleAction = jest.fn();
      const toasts = [
        {
          id: '1',
          message: 'Test',
          action: { label: 'Undo', onClick: handleAction },
          onClose: jest.fn(),
        }
      ];
      render(<ToastContainer toasts={toasts} />);

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('forwards custom className to individual toasts', () => {
      const toasts = [
        {
          id: '1',
          message: 'Test',
          className: 'custom-toast',
          onClose: jest.fn(),
        }
      ];
      render(<ToastContainer toasts={toasts} />);

      const customToast = document.body.querySelector('.custom-toast');
      expect(customToast).toBeInTheDocument();
    });
  });

  describe('Multiple Toast Types', () => {
    it('renders toasts with different types', () => {
      const toasts = [
        { id: '1', message: 'Success', type: 'success', onClose: jest.fn() },
        { id: '2', message: 'Error', type: 'error', onClose: jest.fn() },
        { id: '3', message: 'Warning', type: 'warning', onClose: jest.fn() },
        { id: '4', message: 'Info', type: 'info', onClose: jest.fn() },
      ];
      render(<ToastContainer toasts={toasts} />);

      expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument();
      expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
      expect(screen.getByTestId('icon-alert-triangle')).toBeInTheDocument();
      expect(screen.getByTestId('icon-info')).toBeInTheDocument();
    });

    it('handles mixed configurations', () => {
      const toasts = [
        { id: '1', title: 'Title Only', onClose: jest.fn() },
        { id: '2', message: 'Message Only', onClose: jest.fn() },
        { id: '3', title: 'Both', message: 'Content', onClose: jest.fn() },
      ];
      render(<ToastContainer toasts={toasts} />);

      expect(screen.getByText('Title Only')).toBeInTheDocument();
      expect(screen.getByText('Message Only')).toBeInTheDocument();
      expect(screen.getByText('Both')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles toast with missing id', () => {
      const toasts = [
        { message: 'No ID', onClose: jest.fn() }
      ];
      expect(() => render(<ToastContainer toasts={toasts} />)).not.toThrow();
    });

    it('handles toasts with duplicate ids', () => {
      const toasts = [
        { id: '1', message: 'First', onClose: jest.fn() },
        { id: '1', message: 'Second', onClose: jest.fn() },
      ];
      render(<ToastContainer toasts={toasts} />);

      // Should still render both despite duplicate keys
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('handles empty toast objects', () => {
      const toasts = [
        { id: '1', onClose: jest.fn() }
      ];
      expect(() => render(<ToastContainer toasts={toasts} />)).not.toThrow();
    });

    it('handles very large number of toasts', () => {
      const toasts = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        message: `Toast ${i}`,
        onClose: jest.fn(),
      }));
      render(<ToastContainer toasts={toasts} />);

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(50);
    });

    it('updates when toasts array changes', () => {
      const { rerender } = render(
        <ToastContainer toasts={[
          { id: '1', message: 'First', onClose: jest.fn() }
        ]} />
      );

      expect(screen.getByText('First')).toBeInTheDocument();

      rerender(
        <ToastContainer toasts={[
          { id: '1', message: 'First', onClose: jest.fn() },
          { id: '2', message: 'Second', onClose: jest.fn() },
        ]} />
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('removes toasts when array is cleared', () => {
      const { rerender } = render(
        <ToastContainer toasts={[
          { id: '1', message: 'Test', onClose: jest.fn() }
        ]} />
      );

      expect(screen.getByText('Test')).toBeInTheDocument();

      rerender(<ToastContainer toasts={[]} />);

      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('container has full viewport coverage', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      const container = document.body.querySelector('.inset-0');
      expect(container).toBeInTheDocument();
    });

    it('container is positioned fixed', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      const container = document.body.querySelector('.fixed.inset-0');
      expect(container).toBeInTheDocument();
    });

    it('uses flexbox for toast stacking', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      render(<ToastContainer toasts={toasts} />);

      const stackContainer = document.body.querySelector('.flex.flex-col');
      expect(stackContainer).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('only renders when toasts change', () => {
      const toasts = [
        { id: '1', message: 'Test', onClose: jest.fn() }
      ];
      const { rerender } = render(<ToastContainer toasts={toasts} />);

      const firstRender = screen.getByText('Test');

      rerender(<ToastContainer toasts={toasts} position="top-right" />);

      const secondRender = screen.getByText('Test');
      expect(secondRender).toBe(firstRender);
    });
  });
});

describe('Toast Integration Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '<div id="root"></div>';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('handles complete toast lifecycle', () => {
    const handleClose = jest.fn();
    const toasts = [
      { id: '1', message: 'Lifecycle test', duration: 1000, onClose: handleClose }
    ];

    render(<ToastContainer toasts={toasts} />);

    // Initial render
    expect(screen.getByText('Lifecycle test')).toBeInTheDocument();

    // Wait for auto-close
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(handleClose).toHaveBeenCalledWith('1');
  });

  it('handles manual close during auto-close countdown', () => {
    const handleClose = jest.fn();
    const toasts = [
      { id: '1', message: 'Manual close test', duration: 5000, onClose: handleClose }
    ];

    render(<ToastContainer toasts={toasts} />);

    // Wait halfway through auto-close
    act(() => {
      jest.advanceTimersByTime(2500);
    });

    // Manually close
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('handles multiple toasts closing independently', () => {
    const handleClose1 = jest.fn();
    const handleClose2 = jest.fn();
    const toasts = [
      { id: '1', message: 'First', duration: 1000, onClose: handleClose1 },
      { id: '2', message: 'Second', duration: 2000, onClose: handleClose2 },
    ];

    render(<ToastContainer toasts={toasts} />);

    // First toast closes
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(handleClose1).toHaveBeenCalledWith('1');
    expect(handleClose2).not.toHaveBeenCalled();

    // Second toast closes
    act(() => {
      jest.advanceTimersByTime(700);
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(handleClose2).toHaveBeenCalledWith('2');
  });

  it('handles toast with action button and auto-close', () => {
    const handleAction = jest.fn();
    const handleClose = jest.fn();
    const toasts = [
      {
        id: '1',
        message: 'Action test',
        duration: 2000,
        action: { label: 'Undo', onClick: handleAction },
        onClose: handleClose,
      }
    ];

    render(<ToastContainer toasts={toasts} />);

    // Click action
    const actionButton = screen.getByText('Undo');
    fireEvent.click(actionButton);

    expect(handleAction).toHaveBeenCalled();

    // Should still auto-close
    act(() => {
      jest.advanceTimersByTime(2300);
    });

    expect(handleClose).toHaveBeenCalled();
  });
});

export default alert
