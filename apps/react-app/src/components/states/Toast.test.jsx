import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast, ToastContainer } from './Toast';
import '@testing-library/jest-dom';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, ...restProps } = props;
      return <div {...restProps}>{children}</div>;
    }
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle2: () => <svg data-testid="check-circle-icon" />,
  AlertCircle: () => <svg data-testid="alert-circle-icon" />,
  Info: () => <svg data-testid="info-icon" />,
  X: () => <svg data-testid="x-icon" />
}));

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the toast component', () => {
      render(<Toast message="Test message" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should display the provided message', () => {
      render(<Toast message="Hello World" />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should render with default info type', () => {
      render(<Toast message="Default toast" />);
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('should have aria-live attribute set to polite', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('should render icon with aria-hidden attribute', () => {
      render(<Toast message="Test" type="success" />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Toast Types', () => {
    it('should render success toast with correct icon', () => {
      render(<Toast message="Success" type="success" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should render error toast with correct icon', () => {
      render(<Toast message="Error" type="error" />);
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should render info toast with correct icon', () => {
      render(<Toast message="Info" type="info" />);
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('should apply success color classes', () => {
      render(<Toast message="Success" type="success" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-green-500/10', 'border-green-500', 'text-green-500');
    });

    it('should apply error color classes', () => {
      render(<Toast message="Error" type="error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-500/10', 'border-red-500', 'text-red-500');
    });

    it('should apply info color classes', () => {
      render(<Toast message="Info" type="info" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-500/10', 'border-blue-500', 'text-blue-500');
    });
  });

  describe('Position Variants', () => {
    it('should position toast at top-right', () => {
      render(<Toast message="Test" position="top-right" />);
      expect(screen.getByRole('alert')).toHaveClass('top-4', 'right-4');
    });

    it('should position toast at top-left', () => {
      render(<Toast message="Test" position="top-left" />);
      expect(screen.getByRole('alert')).toHaveClass('top-4', 'left-4');
    });

    it('should position toast at bottom-right', () => {
      render(<Toast message="Test" position="bottom-right" />);
      expect(screen.getByRole('alert')).toHaveClass('bottom-4', 'right-4');
    });

    it('should position toast at bottom-left', () => {
      render(<Toast message="Test" position="bottom-left" />);
      expect(screen.getByRole('alert')).toHaveClass('bottom-4', 'left-4');
    });

    it('should position toast at top-center', () => {
      render(<Toast message="Test" position="top-center" />);
      expect(screen.getByRole('alert')).toHaveClass('top-4', 'left-1/2', '-translate-x-1/2');
    });

    it('should position toast at bottom-center', () => {
      render(<Toast message="Test" position="bottom-center" />);
      expect(screen.getByRole('alert')).toHaveClass('bottom-4', 'left-1/2', '-translate-x-1/2');
    });

    it('should default to top-right position', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('top-4', 'right-4');
    });
  });

  describe('Auto-Dismiss Timer', () => {
    it('should auto-dismiss after default duration', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" onClose={onClose} />);

      jest.advanceTimersByTime(5000);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after custom duration', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={3000} onClose={onClose} />);

      jest.advanceTimersByTime(3000);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not auto-dismiss if duration is 0', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={0} onClose={onClose} />);

      jest.advanceTimersByTime(10000);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not auto-dismiss if duration is null', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={null} onClose={onClose} />);

      jest.advanceTimersByTime(10000);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose before duration expires', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" duration={5000} onClose={onClose} />);

      jest.advanceTimersByTime(4999);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should clear timer on unmount', () => {
      const onClose = jest.fn();
      const { unmount } = render(<Toast message="Test" duration={5000} onClose={onClose} />);

      unmount();
      jest.advanceTimersByTime(5000);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should reset timer when duration changes', () => {
      const onClose = jest.fn();
      const { rerender } = render(<Toast message="Test" duration={5000} onClose={onClose} />);

      jest.advanceTimersByTime(3000);

      rerender(<Toast message="Test" duration={2000} onClose={onClose} />);

      jest.advanceTimersByTime(2000);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should reset timer when onClose changes', () => {
      const onClose1 = jest.fn();
      const onClose2 = jest.fn();
      const { rerender } = render(<Toast message="Test" duration={5000} onClose={onClose1} />);

      jest.advanceTimersByTime(3000);

      rerender(<Toast message="Test" duration={5000} onClose={onClose2} />);

      jest.advanceTimersByTime(5000);

      expect(onClose1).not.toHaveBeenCalled();
      expect(onClose2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Dismiss', () => {
    it('should render close button when onClose is provided', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" onClose={onClose} />);

      expect(screen.getByRole('button', { name: /close notification/i })).toBeInTheDocument();
    });

    it('should not render close button when onClose is not provided', () => {
      render(<Toast message="Test" />);

      expect(screen.queryByRole('button', { name: /close notification/i })).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = jest.fn();
      render(<Toast message="Test" onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /close notification/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should have proper aria-label on close button', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close notification/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });

    it('should render X icon in close button', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" onClose={onClose} />);

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('should have X icon with aria-hidden attribute', () => {
      const onClose = jest.fn();
      render(<Toast message="Test" onClose={onClose} />);

      const xIcon = screen.getByTestId('x-icon');
      expect(xIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Styling and Layout', () => {
    it('should have fixed positioning', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('fixed');
    });

    it('should have z-50 for proper layering', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('z-50');
    });

    it('should have flex layout with items-center', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('flex', 'items-center');
    });

    it('should have gap between elements', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('gap-3');
    });

    it('should have padding classes', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('px-4', 'py-3');
    });

    it('should have rounded corners', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('rounded-lg');
    });

    it('should have border styling', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('border');
    });

    it('should have background color', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('bg-gray-900');
    });

    it('should have shadow', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('shadow-lg');
    });

    it('should have max-width constraint', () => {
      render(<Toast message="Test" />);
      expect(screen.getByRole('alert')).toHaveClass('max-w-md');
    });
  });

  describe('Message Display', () => {
    it('should display short messages', () => {
      render(<Toast message="OK" />);
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should display long messages', () => {
      const longMessage = 'This is a very long message that should still be displayed properly in the toast notification component';
      render(<Toast message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should display messages with special characters', () => {
      render(<Toast message="Error: File not found!" />);
      expect(screen.getByText('Error: File not found!')).toBeInTheDocument();
    });

    it('should display messages with numbers', () => {
      render(<Toast message="Updated 42 items" />);
      expect(screen.getByText('Updated 42 items')).toBeInTheDocument();
    });

    it('should have proper text styling', () => {
      render(<Toast message="Test" />);
      const messageElement = screen.getByText('Test');
      expect(messageElement).toHaveClass('text-white', 'text-sm', 'flex-1');
    });
  });
});

describe('ToastContainer Component', () => {
  it('should render empty container when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} removeToast={jest.fn()} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should render single toast', () => {
    const toasts = [{ id: '1', message: 'Toast 1', type: 'info' }];
    render(<ToastContainer toasts={toasts} removeToast={jest.fn()} />);

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'Toast 1', type: 'success' },
      { id: '2', message: 'Toast 2', type: 'error' },
      { id: '3', message: 'Toast 3', type: 'info' }
    ];
    render(<ToastContainer toasts={toasts} removeToast={jest.fn()} />);

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
  });

  it('should pass correct props to each toast', () => {
    const toasts = [
      { id: '1', message: 'Success message', type: 'success', duration: 3000 }
    ];
    render(<ToastContainer toasts={toasts} removeToast={jest.fn()} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
  });

  it('should call removeToast with correct id when toast is closed', async () => {
    const user = userEvent.setup({ delay: null });
    const removeToast = jest.fn();
    const toasts = [{ id: 'test-id', message: 'Test', type: 'info' }];
    render(<ToastContainer toasts={toasts} removeToast={removeToast} />);

    await user.click(screen.getByRole('button', { name: /close notification/i }));

    expect(removeToast).toHaveBeenCalledWith('test-id');
  });

  it('should handle different toast types in container', () => {
    const toasts = [
      { id: '1', message: 'Success', type: 'success' },
      { id: '2', message: 'Error', type: 'error' }
    ];
    render(<ToastContainer toasts={toasts} removeToast={jest.fn()} />);

    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('should render toasts with unique keys', () => {
    const toasts = [
      { id: 'unique-1', message: 'Toast 1', type: 'info' },
      { id: 'unique-2', message: 'Toast 2', type: 'info' }
    ];
    const { container } = render(<ToastContainer toasts={toasts} removeToast={jest.fn()} />);

    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts).toHaveLength(2);
  });

  it('should handle empty toast array gracefully', () => {
    const { container } = render(<ToastContainer toasts={[]} removeToast={jest.fn()} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should pass position prop to individual toasts', () => {
    const toasts = [
      { id: '1', message: 'Test', type: 'info', position: 'bottom-left' }
    ];
    render(<ToastContainer toasts={toasts} removeToast={jest.fn()} />);

    expect(screen.getByRole('alert')).toHaveClass('bottom-4', 'left-4');
  });

  it('should handle toast updates', () => {
    const { rerender } = render(
      <ToastContainer
        toasts={[{ id: '1', message: 'First', type: 'info' }]}
        removeToast={jest.fn()}
      />
    );

    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(
      <ToastContainer
        toasts={[
          { id: '1', message: 'First', type: 'info' },
          { id: '2', message: 'Second', type: 'success' }
        ]}
        removeToast={jest.fn()}
      />
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});

export default icon
