import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuccessState } from './SuccessState';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

jest.mock('lucide-react', () => ({
  CheckCircle2: (props) => <svg data-testid="check-circle-icon" {...props} />,
}));

describe('SuccessState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<SuccessState />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render with default title', () => {
      render(<SuccessState />);
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });

    it('should render with default message', () => {
      render(<SuccessState />);
      expect(screen.getByText('Your action was completed successfully')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<SuccessState title="Payment Successful" />);
      expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<SuccessState message="Your payment has been processed" />);
      expect(screen.getByText('Your payment has been processed')).toBeInTheDocument();
    });

    it('should render with both custom title and message', () => {
      render(
        <SuccessState
          title="Account Created"
          message="Welcome to our platform"
        />
      );
      expect(screen.getByText('Account Created')).toBeInTheDocument();
      expect(screen.getByText('Welcome to our platform')).toBeInTheDocument();
    });
  });

  describe('Success Icon', () => {
    it('should render the success icon', () => {
      render(<SuccessState />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should have correct icon styling classes', () => {
      render(<SuccessState />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveClass('h-16', 'w-16', 'text-green-500', 'mb-4');
    });

    it('should have aria-hidden on icon', () => {
      render(<SuccessState />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Action Button', () => {
    it('should render action button when actionLabel and onAction are provided', () => {
      const mockAction = jest.fn();
      render(<SuccessState actionLabel="Continue" onAction={mockAction} />);
      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    });

    it('should not render action button when actionLabel is missing', () => {
      const mockAction = jest.fn();
      render(<SuccessState onAction={mockAction} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render action button when onAction is missing', () => {
      render(<SuccessState actionLabel="Continue" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onAction when button is clicked', async () => {
      const mockAction = jest.fn();
      const user = userEvent.setup({ delay: null });
      render(<SuccessState actionLabel="Continue" onAction={mockAction} />);

      await user.click(screen.getByRole('button', { name: 'Continue' }));
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should have correct button styling', () => {
      const mockAction = jest.fn();
      render(<SuccessState actionLabel="Continue" onAction={mockAction} />);
      const button = screen.getByRole('button', { name: 'Continue' });
      expect(button).toHaveClass(
        'px-6',
        'py-3',
        'bg-green-500',
        'hover:bg-green-600',
        'rounded-lg',
        'font-medium',
        'transition-colors'
      );
    });

    it('should display the action label as button text', () => {
      const mockAction = jest.fn();
      render(<SuccessState actionLabel="Go to Dashboard" onAction={mockAction} />);
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });

    it('should have aria-label attribute on button', () => {
      const mockAction = jest.fn();
      render(<SuccessState actionLabel="Continue" onAction={mockAction} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Continue');
    });

    it('should support multiple clicks on action button', async () => {
      const mockAction = jest.fn();
      const user = userEvent.setup({ delay: null });
      render(<SuccessState actionLabel="Continue" onAction={mockAction} />);
      const button = screen.getByRole('button', { name: 'Continue' });

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Auto-hide Functionality', () => {
    it('should call onAction after autoHideDuration', () => {
      const mockAction = jest.fn();
      render(<SuccessState onAction={mockAction} autoHideDuration={3000} />);

      expect(mockAction).not.toHaveBeenCalled();
      jest.advanceTimersByTime(3000);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not set timer when autoHideDuration is not provided', () => {
      const mockAction = jest.fn();
      render(<SuccessState onAction={mockAction} />);

      jest.advanceTimersByTime(10000);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should not set timer when onAction is not provided', () => {
      const mockAction = jest.fn();
      render(<SuccessState autoHideDuration={3000} />);

      jest.advanceTimersByTime(3000);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should not trigger before duration completes', () => {
      const mockAction = jest.fn();
      render(<SuccessState onAction={mockAction} autoHideDuration={5000} />);

      jest.advanceTimersByTime(4999);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should cleanup timer on unmount', () => {
      const mockAction = jest.fn();
      const { unmount } = render(
        <SuccessState onAction={mockAction} autoHideDuration={3000} />
      );

      unmount();
      jest.advanceTimersByTime(3000);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should handle autoHideDuration of 0', () => {
      const mockAction = jest.fn();
      render(<SuccessState onAction={mockAction} autoHideDuration={0} />);

      jest.advanceTimersByTime(0);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should reset timer when autoHideDuration changes', () => {
      const mockAction = jest.fn();
      const { rerender } = render(
        <SuccessState onAction={mockAction} autoHideDuration={3000} />
      );

      jest.advanceTimersByTime(2000);

      rerender(<SuccessState onAction={mockAction} autoHideDuration={5000} />);

      jest.advanceTimersByTime(3000);
      expect(mockAction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2000);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should reset timer when onAction changes', () => {
      const mockAction1 = jest.fn();
      const mockAction2 = jest.fn();
      const { rerender } = render(
        <SuccessState onAction={mockAction1} autoHideDuration={3000} />
      );

      jest.advanceTimersByTime(2000);

      rerender(<SuccessState onAction={mockAction2} autoHideDuration={3000} />);

      jest.advanceTimersByTime(1000);
      expect(mockAction1).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2000);
      expect(mockAction2).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid autoHideDuration', () => {
      const mockAction = jest.fn();
      render(<SuccessState onAction={mockAction} autoHideDuration={100} />);

      jest.advanceTimersByTime(100);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should handle long autoHideDuration', () => {
      const mockAction = jest.fn();
      render(<SuccessState onAction={mockAction} autoHideDuration={60000} />);

      jest.advanceTimersByTime(59999);
      expect(mockAction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<SuccessState />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      render(<SuccessState />);
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should have semantic heading for title', () => {
      render(<SuccessState title="Success!" />);
      expect(screen.getByRole('heading', { level: 3, name: 'Success!' })).toBeInTheDocument();
    });

    it('should have accessible button when action is provided', () => {
      const mockAction = jest.fn();
      render(<SuccessState actionLabel="Continue" onAction={mockAction} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName('Continue');
    });

    it('should hide decorative icon from screen readers', () => {
      render(<SuccessState />);
      const icon = screen.getByTestId('check-circle-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Layout and Styling', () => {
    it('should have centered layout classes', () => {
      render(<SuccessState />);
      const container = screen.getByRole('status');
      expect(container).toHaveClass(
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'p-8',
        'text-center'
      );
    });

    it('should style title with correct classes', () => {
      render(<SuccessState title="Success!" />);
      const title = screen.getByText('Success!');
      expect(title).toHaveClass('text-xl', 'font-semibold', 'text-white', 'mb-2');
    });

    it('should style message with correct classes', () => {
      render(<SuccessState message="Test message" />);
      const message = screen.getByText('Test message');
      expect(message).toHaveClass('text-gray-400', 'mb-6', 'max-w-md');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string title', () => {
      render(<SuccessState title="" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle empty string message', () => {
      render(<SuccessState message="" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(200);
      render(<SuccessState title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long message', () => {
      const longMessage = 'B'.repeat(500);
      render(<SuccessState message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      render(<SuccessState title="Success! 🎉 <>&" />);
      expect(screen.getByText('Success! 🎉 <>&')).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      render(<SuccessState message="Test & verify <script> tags" />);
      expect(screen.getByText('Test & verify <script> tags')).toBeInTheDocument();
    });

    it('should handle null actionLabel gracefully', () => {
      const mockAction = jest.fn();
      render(<SuccessState actionLabel={null} onAction={mockAction} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should handle undefined props gracefully', () => {
      render(
        <SuccessState
          title={undefined}
          message={undefined}
          actionLabel={undefined}
          onAction={undefined}
          autoHideDuration={undefined}
        />
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

export default icon
