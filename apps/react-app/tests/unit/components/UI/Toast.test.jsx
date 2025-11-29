/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Toast from '@/components/UI/Toast';

describe('Toast Component', () => {
  const defaultProps = {
    message: 'Test toast message',
    type: 'info',
    isVisible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders toast with message', () => {
    render(<Toast {...defaultProps} />);
    
    expect(screen.getByText('Test toast message')).toBeInTheDocument();
  });

  test('renders different toast types with correct styling', () => {
    const types = ['success', 'error', 'warning', 'info'];
    
    types.forEach(type => {
      const { rerender } = render(<Toast {...defaultProps} type={type} />);
      
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass(`toast-${type}`);
      
      rerender(<div />); // Clear for next iteration
    });
  });

  test('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Toast {...defaultProps} />);
    
    const closeButton = screen.getByTestId('toast-close');
    await user.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('auto-dismisses after specified duration', () => {
    render(<Toast {...defaultProps} duration={3000} />);
    
    jest.advanceTimersByTime(3000);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('does not auto-dismiss when duration is 0', () => {
    render(<Toast {...defaultProps} duration={0} />);
    
    jest.advanceTimersByTime(5000);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  test('pauses auto-dismiss on hover', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Toast {...defaultProps} duration={3000} />);
    
    const toast = screen.getByTestId('toast');
    
    // Start hover before timer completes
    jest.advanceTimersByTime(1000);
    await user.hover(toast);
    
    // Advance past original duration
    jest.advanceTimersByTime(3000);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
    
    // Unhover and advance
    await user.unhover(toast);
    jest.advanceTimersByTime(2000);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('renders with action button', async () => {
    const actionSpy = jest.fn();
    const user = userEvent.setup({ delay: null });
    
    render(
      <Toast 
        {...defaultProps} 
        action={{ 
          label: 'Undo', 
          onClick: actionSpy 
        }} 
      />
    );
    
    const actionButton = screen.getByText('Undo');
    expect(actionButton).toBeInTheDocument();
    
    await user.click(actionButton);
    expect(actionSpy).toHaveBeenCalledTimes(1);
  });

  test('renders with progress bar when showProgress is true', () => {
    render(<Toast {...defaultProps} duration={3000} showProgress />);
    
    const progressBar = screen.getByTestId('toast-progress');
    expect(progressBar).toBeInTheDocument();
  });

  test('updates progress bar during countdown', () => {
    render(<Toast {...defaultProps} duration={3000} showProgress />);
    
    const progressBar = screen.getByTestId('toast-progress');
    
    // Initial state
    expect(progressBar).toHaveStyle('width: 100%');
    
    // Halfway through
    jest.advanceTimersByTime(1500);
    expect(progressBar).toHaveStyle('width: 50%');
  });

  test('handles keyboard navigation', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Toast {...defaultProps} />);
    
    const closeButton = screen.getByTestId('toast-close');
    closeButton.focus();
    
    // Enter key should close toast
    await user.keyboard('{Enter}');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('supports custom icons', () => {
    const CustomIcon = () => <span data-testid="custom-icon">🎉</span>;
    
    render(<Toast {...defaultProps} icon={<CustomIcon />} />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  test('renders multiline messages correctly', () => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';
    
    render(<Toast {...defaultProps} message={multilineMessage} />);
    
    const messageElement = screen.getByText(/Line 1/);
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.innerHTML).toContain('<br>');
  });

  test('handles long messages with truncation', () => {
    const longMessage = 'A'.repeat(200);
    
    render(<Toast {...defaultProps} message={longMessage} maxLength={100} />);
    
    const messageElement = screen.getByText(/A{97}\.{3}/);
    expect(messageElement).toBeInTheDocument();
  });

  test('animates in and out correctly', async () => {
    const { rerender } = render(<Toast {...defaultProps} isVisible={false} />);
    
    const toast = screen.queryByTestId('toast');
    expect(toast).not.toBeInTheDocument();
    
    rerender(<Toast {...defaultProps} isVisible={true} />);
    
    await waitFor(() => {
      const visibleToast = screen.getByTestId('toast');
      expect(visibleToast).toHaveClass('animate-slide-in');
    });
  });

  test('is accessible with proper ARIA attributes', () => {
    render(<Toast {...defaultProps} />);
    
    const toast = screen.getByTestId('toast');
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  test('handles touch gestures for mobile dismissal', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Toast {...defaultProps} />);
    
    const toast = screen.getByTestId('toast');
    
    // Simulate swipe gesture
    fireEvent.touchStart(toast, {
      touches: [{ clientX: 0, clientY: 0 }]
    });
    
    fireEvent.touchMove(toast, {
      touches: [{ clientX: 100, clientY: 0 }]
    });
    
    fireEvent.touchEnd(toast);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('stacks multiple toasts correctly', () => {
    const { rerender } = render(
      <div>
        <Toast {...defaultProps} id="toast-1" />
        <Toast {...defaultProps} id="toast-2" message="Second toast" />
      </div>
    );
    
    const toasts = screen.getAllByTestId('toast');
    expect(toasts).toHaveLength(2);
    
    // Check stacking order
    expect(toasts[0]).toHaveStyle('z-index: 1000');
    expect(toasts[1]).toHaveStyle('z-index: 1001');
  });

  test('performance - memoizes properly', () => {
    const renderSpy = jest.fn();
    const MemoToast = React.memo(() => {
      renderSpy();
      return <Toast {...defaultProps} />;
    });

    const { rerender } = render(<MemoToast />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender(<MemoToast />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});