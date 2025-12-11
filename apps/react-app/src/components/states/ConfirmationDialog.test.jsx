import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationDialog from './ConfirmationDialog';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, role, ...props }) => (
      <div onClick={onClick} className={className} role={role} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ className }) => <div data-testid="alert-triangle-icon" className={className} />,
  X: ({ className }) => <div data-testid="x-icon" className={className} />,
}));

describe('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('renders with default title', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<ConfirmationDialog {...defaultProps} title="Delete Item" />);
      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('renders with default message', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<ConfirmationDialog {...defaultProps} message="This action cannot be undone." />);
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('renders with backdrop', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('renders close button with icon', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Title and Message Display', () => {
    it('displays title in h3 element', () => {
      render(<ConfirmationDialog {...defaultProps} title="Custom Title" />);
      const title = screen.getByText('Custom Title');
      expect(title.tagName).toBe('H3');
    });

    it('displays message in paragraph element', () => {
      render(<ConfirmationDialog {...defaultProps} message="Custom message" />);
      const message = screen.getByText('Custom message');
      expect(message.tagName).toBe('P');
    });

    it('title has correct id for aria-labelledby', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const title = screen.getByText('Confirm Action');
      expect(title).toHaveAttribute('id', 'dialog-title');
    });

    it('message has correct id for aria-describedby', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const message = screen.getByText('Are you sure you want to proceed?');
      expect(message).toHaveAttribute('id', 'dialog-description');
    });
  });

  describe('Confirm Button', () => {
    it('renders confirm button with default label', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('renders confirm button with custom label', () => {
      render(<ConfirmationDialog {...defaultProps} confirmLabel="Delete" />);
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('confirm button has default variant styling', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton.className).toContain('bg-blue-500');
      expect(confirmButton.className).toContain('hover:bg-blue-600');
    });
  });

  describe('Cancel Button', () => {
    it('renders cancel button with default label', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('renders cancel button with custom label', () => {
      render(<ConfirmationDialog {...defaultProps} cancelLabel="No" />);
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('cancel button has correct styling', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton.className).toContain('bg-gray-700');
      expect(cancelButton.className).toContain('hover:bg-gray-600');
    });
  });

  describe('Variant Styles', () => {
    it('applies default variant styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="default" />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton.className).toContain('bg-blue-500');
    });

    it('applies danger variant styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton.className).toContain('bg-red-500');
      expect(confirmButton.className).toContain('hover:bg-red-600');
    });

    it('applies warning variant styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="warning" />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton.className).toContain('bg-yellow-500');
      expect(confirmButton.className).toContain('hover:bg-yellow-600');
    });

    it('shows alert icon for danger variant', () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('does not show alert icon for default variant', () => {
      render(<ConfirmationDialog {...defaultProps} variant="default" />);
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
    });

    it('does not show alert icon for warning variant', () => {
      render(<ConfirmationDialog {...defaultProps} variant="warning" />);
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
    });

    it('alert icon has correct styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);
      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon.className).toContain('text-red-500');
    });
  });

  describe('Loading States', () => {
    it('disables confirm button when loading', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={true} />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toBeDisabled();
    });

    it('disables cancel button when loading', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={true} />);
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();
    });

    it('shows loading spinner when loading', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} isLoading={true} />);
      const spinner = container.querySelector('.');
      expect(spinner).toBeInTheDocument();
    });

    it('does not show loading spinner when not loading', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} isLoading={false} />);
      const spinner = container.querySelector('.');
      expect(spinner).not.toBeInTheDocument();
    });

    it('loading spinner has correct styling', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} isLoading={true} />);
      const spinner = container.querySelector('.');
      expect(spinner?.className).toContain('rounded-full');
      expect(spinner?.className).toContain('border-b-2');
      expect(spinner?.className).toContain('border-white');
    });

    it('does not call onConfirm when confirm button clicked while loading', () => {
      const onConfirm = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} isLoading={true} />);
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('applies opacity styling to disabled buttons', () => {
      render(<ConfirmationDialog {...defaultProps} isLoading={true} />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(confirmButton.className).toContain('disabled:opacity-50');
      expect(cancelButton.className).toContain('disabled:opacity-50');
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText('Close dialog'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      const { container } = render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when dialog content is clicked', () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByRole('alertdialog'));
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not close when loading and cancel is clicked', async () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} isLoading={true} />);
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('onConfirm receives click event', () => {
      const onConfirm = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(onConfirm).toHaveBeenCalledWith(expect.any(Object));
    });

    it('onClose receives click event from close button', () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText('Close dialog'));
      expect(onClose).toHaveBeenCalledWith(expect.any(Object));
    });

    it('onClose receives click event from cancel button', () => {
      const onClose = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledWith(expect.any(Object));
    });

    it('onClose receives click event from backdrop', () => {
      const onClose = jest.fn();
      const { container } = render(<ConfirmationDialog {...defaultProps} onClose={onClose} />);
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Accessibility', () => {
    it('has role alertdialog', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('has aria-labelledby pointing to title', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
    });

    it('has aria-describedby pointing to description', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    });

    it('close button has accessible label', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('backdrop has aria-hidden attribute', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} />);
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });

    it('icons have aria-hidden attribute', () => {
      render(<ConfirmationDialog {...defaultProps} variant="danger" />);
      expect(screen.getByTestId('alert-triangle-icon')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByTestId('x-icon')).toHaveAttribute('aria-hidden', 'true');
    });

    it('loading spinner has aria-hidden attribute', () => {
      const { container } = render(<ConfirmationDialog {...defaultProps} isLoading={true} />);
      const spinner = container.querySelector('.');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('buttons are keyboard accessible', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(confirmButton).not.toHaveAttribute('tabindex', '-1');
      expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles multiple rapid clicks on confirm button', () => {
      const onConfirm = jest.fn();
      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);
      expect(onConfirm).toHaveBeenCalledTimes(3);
    });

    it('handles transition from closed to open', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      rerender(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('handles transition from open to closed', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('handles loading state change while open', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} isLoading={false} />);
      expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled();
      rerender(<ConfirmationDialog {...defaultProps} isLoading={true} />);
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    });

    it('handles variant change while open', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} variant="default" />);
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
      rerender(<ConfirmationDialog {...defaultProps} variant="danger" />);
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('renders with all custom props', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          title="Custom Title"
          message="Custom message"
          confirmLabel="Yes"
          cancelLabel="No"
          variant="danger"
          isLoading={false}
        />
      );
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('maintains button order (cancel first, confirm second)', () => {
      render(<ConfirmationDialog {...defaultProps} />);
      const buttons = screen.getAllByRole('button').filter(
        btn => btn.textContent === 'Cancel' || btn.textContent === 'Confirm'
      );
      expect(buttons[0].textContent).toBe('Cancel');
      expect(buttons[1].textContent).toBe('Confirm');
    });
  });
});

export default defaultProps
