import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './Modal';

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

describe('Modal', () => {
  beforeEach(() => {
    // Clean up the DOM before each test
    document.body.innerHTML = '';
    // Reset body overflow
    document.body.style.overflow = '';
    // Reset mock
    mockConfirm.mockReset();
    mockConfirm.mockReturnValue(true);
  });

  afterEach(() => {
    // Cleanup after each test
    document.body.style.overflow = '';
  });

  describe('Basic Rendering', () => {
    it('renders without crashing when open', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <Modal isOpen={false} onClose={jest.fn()}>
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('renders null when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders children correctly', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>First Child</div>
          <div>Second Child</div>
        </Modal>
      );
      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
    });

    it('renders with complex children structure', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <ModalHeader>
            <ModalTitle>Test Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Test Body</ModalBody>
          <ModalFooter>Test Footer</ModalFooter>
        </Modal>
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Body')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });

    it('renders as portal to document.body', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Portal Content</div>
        </Modal>
      );
      const modalContent = screen.getByText('Portal Content');
      expect(modalContent.closest('body')).toBe(document.body);
    });
  });

  describe('Close Button', () => {
    it('renders close button by default', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} showCloseButton={false}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('does not render close button when preventClose is true', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} preventClose={true}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('does not render close button when both showCloseButton false and preventClose true', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} showCloseButton={false} preventClose={true}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('close button has correct ARIA label', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });

    it('close button is a button element', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton.tagName).toBe('BUTTON');
    });

    it('renders close button with X icon', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByLabelText('Close modal');
      const svg = closeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Backdrop Click', () => {
    it('closes modal on backdrop click by default', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking modal content', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <div>Modal Content</div>
        </Modal>
      );
      const content = screen.getByText('Modal Content');
      fireEvent.click(content);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not close on backdrop click when closeOnBackdropClick is false', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnBackdropClick={false}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('respects closeOnBackdropClick when true', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnBackdropClick={true}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on backdrop click when preventClose is true', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} preventClose={true}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('backdrop has aria-hidden attribute', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Escape Key', () => {
    it('closes modal on Escape key by default', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when closeOnEscape is false', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnEscape={false}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('respects closeOnEscape when true', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnEscape={true}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when preventClose is true', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} preventClose={true}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does not respond to other keys', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'a' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('only closes on Escape when modal is open', () => {
      const handleClose = jest.fn();
      const { rerender } = render(
        <Modal isOpen={false} onClose={handleClose}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();

      rerender(
        <Modal isOpen={true} onClose={handleClose}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus Management', () => {
    it('focuses first focusable element when opened', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>
            <button>First Button</button>
            <button>Second Button</button>
          </div>
        </Modal>
      );

      await waitFor(() => {
        // First focusable element is the close button
        const closeButton = screen.getByLabelText('Close modal');
        expect(document.activeElement).toBe(closeButton);
      }, { timeout: 500 });
    });

    it('focuses close button if no other focusable elements', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Just text content</div>
        </Modal>
      );

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close modal');
        expect(document.activeElement).toBe(closeButton);
      });
    });

    it('traps focus within modal', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>
            <button>Content Button 1</button>
            <button>Content Button 2</button>
          </div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      const firstButton = screen.getByText('Content Button 1');
      const lastButton = screen.getByText('Content Button 2');

      await waitFor(() => {
        expect(document.activeElement).toBe(closeButton);
      }, { timeout: 500 });

      // Tab forward from last element should cycle to first (close button)
      lastButton.focus();
      const modalContent = document.querySelector('[tabindex="-1"]');
      fireEvent.keyDown(modalContent, { key: 'Tab', shiftKey: false });

      await waitFor(() => {
        expect(document.activeElement).toBe(closeButton);
      }, { timeout: 500 });
    });

    it('traps focus backward with Shift+Tab', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>
            <button>Content Button 1</button>
            <button>Content Button 2</button>
          </div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      const firstButton = screen.getByText('Content Button 1');
      const lastButton = screen.getByText('Content Button 2');

      await waitFor(() => {
        closeButton.focus();
      }, { timeout: 500 });

      // Shift+Tab from first element (close button) should cycle to last
      const modalContent = document.querySelector('[tabindex="-1"]');
      fireEvent.keyDown(modalContent, { key: 'Tab', shiftKey: true });

      await waitFor(() => {
        expect(document.activeElement).toBe(lastButton);
      }, { timeout: 500 });
    });

    it('stores previously focused element', () => {
      const button = document.createElement('button');
      button.textContent = 'Trigger';
      document.body.appendChild(button);
      button.focus();

      expect(document.activeElement).toBe(button);

      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Modal</div>
        </Modal>
      );

      document.body.removeChild(button);
    });

    it('restores focus to previous element on close', async () => {
      const button = document.createElement('button');
      button.textContent = 'Trigger';
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Modal Content</div>
        </Modal>
      );

      rerender(
        <Modal isOpen={false} onClose={jest.fn()}>
          <div>Modal Content</div>
        </Modal>
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });

      document.body.removeChild(button);
    });

    it('handles Tab key only, ignores other keys', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>
            <button>Button</button>
          </div>
        </Modal>
      );

      const modal = screen.getByRole('dialog');
      fireEvent.keyDown(modal, { key: 'Enter' });
      fireEvent.keyDown(modal, { key: 'Space' });
      fireEvent.keyDown(modal, { key: 'a' });

      // Should not cause any errors
      expect(modal).toBeInTheDocument();
    });

    it('finds all focusable elements including links, inputs, selects, textareas', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>
            <a href="#test">Link</a>
            <input type="text" />
            <select><option>Option</option></select>
            <textarea />
            <button>Button</button>
          </div>
        </Modal>
      );

      await waitFor(() => {
        // First focusable element is the close button
        const closeButton = screen.getByLabelText('Close modal');
        expect(document.activeElement).toBe(closeButton);
      }, { timeout: 500 });
    });

    it('excludes elements with tabindex="-1"', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>
            <button tabIndex={-1}>Excluded</button>
            <button>Included</button>
          </div>
        </Modal>
      );

      await waitFor(() => {
        // First focusable element is the close button, not the excluded button
        const closeButton = screen.getByLabelText('Close modal');
        expect(document.activeElement).toBe(closeButton);
      }, { timeout: 500 });

      // Verify that the excluded button is not in the focus cycle
      const excludedButton = screen.getByText('Excluded');
      expect(excludedButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when modal opens', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does not lock body scroll when modal is closed', () => {
      render(
        <Modal isOpen={false} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('restores body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('updates body scroll when isOpen changes', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('');

      rerender(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Sizes', () => {
    it('applies small size class', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} size="sm">
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveClass('max-w-md');
    });

    it('applies medium size class (default)', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveClass('max-w-lg');
    });

    it('applies medium size class explicitly', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} size="md">
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveClass('max-w-lg');
    });

    it('applies large size class', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} size="lg">
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveClass('max-w-2xl');
    });

    it('applies extra large size class', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} size="xl">
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveClass('max-w-4xl');
    });

    it('applies full size class', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} size="full">
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveClass('max-w-full');
    });

    it('changes size dynamically', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={jest.fn()} size="sm">
          <div>Content</div>
        </Modal>
      );

      let modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveClass('max-w-md');

      rerender(
        <Modal isOpen={true} onClose={jest.fn()} size="xl">
          <div>Content</div>
        </Modal>
      );

      modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveClass('max-w-4xl');
    });
  });

  describe('PreventClose', () => {
    it('prevents close when preventClose is true', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} preventClose={true}>
          <div>Content</div>
        </Modal>
      );

      // Try to close via escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();

      // Try to close via backdrop
      const backdrop = screen.getByRole('dialog').previousSibling;
      fireEvent.click(backdrop);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('hides close button when preventClose is true', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} preventClose={true}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('allows close when preventClose is false', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} preventClose={false}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('can toggle preventClose', async () => {
      const handleClose = jest.fn();
      const { rerender } = render(
        <Modal isOpen={true} onClose={handleClose} preventClose={false} closeOnEscape={false}>
          <div>Content</div>
        </Modal>
      );

      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);

      handleClose.mockClear();

      rerender(
        <Modal isOpen={true} onClose={handleClose} preventClose={true} closeOnEscape={false}>
          <div>Content</div>
        </Modal>
      );

      const newBackdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(newBackdrop);
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Unsaved Changes', () => {
    it('shows confirmation when hasUnsavedChanges is true', () => {
      const handleClose = jest.fn();
      mockConfirm.mockReturnValue(true);

      render(
        <Modal isOpen={true} onClose={handleClose} hasUnsavedChanges={true}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockConfirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to close?');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when confirmation is cancelled', () => {
      const handleClose = jest.fn();
      mockConfirm.mockReturnValue(false);

      render(
        <Modal isOpen={true} onClose={handleClose} hasUnsavedChanges={true}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('uses custom confirmation message', () => {
      mockConfirm.mockReturnValue(true);

      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          hasUnsavedChanges={true}
          confirmCloseMessage="Custom message"
        >
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockConfirm).toHaveBeenCalledWith('Custom message');
    });

    it('does not show confirmation when hasUnsavedChanges is false', () => {
      const handleClose = jest.fn();

      render(
        <Modal isOpen={true} onClose={handleClose} hasUnsavedChanges={false}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation on backdrop click with unsaved changes', () => {
      const handleClose = jest.fn();
      mockConfirm.mockReturnValue(true);

      render(
        <Modal isOpen={true} onClose={handleClose} hasUnsavedChanges={true}>
          <div>Content</div>
        </Modal>
      );

      const backdrop = document.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop);

      expect(mockConfirm).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation on Escape key with unsaved changes', () => {
      const handleClose = jest.fn();
      mockConfirm.mockReturnValue(true);

      render(
        <Modal isOpen={true} onClose={handleClose} hasUnsavedChanges={true}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockConfirm).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('preventClose overrides unsaved changes confirmation', () => {
      const handleClose = jest.fn();

      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          hasUnsavedChanges={true}
          preventClose={true}
        >
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to modal', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} className="custom-modal">
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('custom-modal');
    });

    it('preserves default classes with custom className', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} className="custom-modal">
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('bg-bg-secondary');
      expect(modalContent.className).toContain('rounded-lg');
      expect(modalContent.className).toContain('custom-modal');
    });

    it('supports multiple custom classes', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} className="class1 class2 class3">
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('class1');
      expect(modalContent.className).toContain('class2');
      expect(modalContent.className).toContain('class3');
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('backdrop has aria-hidden="true"', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('modal content has tabIndex="-1"', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent).toHaveAttribute('tabIndex', '-1');
    });

    it('modal has focus outline styles', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('focus:outline-none');
    });
  });

  describe('Styling', () => {
    it('has fixed positioning', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const container = screen.getByRole('dialog');
      expect(container.className).toContain('fixed');
      expect(container.className).toContain('inset-0');
    });

    it('has correct z-index', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const container = screen.getByRole('dialog');
      expect(container.className).toContain('z-[1050]');
    });

    it('has backdrop blur', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop.className).toContain('backdrop-blur-sm');
    });

    it('has background color', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('bg-bg-secondary');
    });

    it('has border', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('border-border');
    });

    it('has rounded corners', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('rounded-lg');
    });

    it('has shadow', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('shadow-2xl');
    });

    it('has max height constraint', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('max-h-[90vh]');
    });

    it('has overflow scroll', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      expect(modalContent.className).toContain('overflow-y-auto');
    });

    it('has animation classes', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );
      const modalContent = document.querySelector('[tabindex="-1"]');
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(modalContent.className).toContain('animate-zoom-in');
      expect(backdrop.className).toContain('animate-fade-in');
    });
  });

  describe('Edge Cases', () => {
    it('handles onClose being undefined', () => {
      expect(() => {
        render(
          <Modal isOpen={true}>
            <div>Content</div>
          </Modal>
        );
      }).not.toThrow();
    });

    it('handles children being undefined', () => {
      render(<Modal isOpen={true} onClose={jest.fn()} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles children being null', () => {
      render(<Modal isOpen={true} onClose={jest.fn()}>{null}</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles multiple modals', () => {
      render(
        <>
          <Modal isOpen={true} onClose={jest.fn()}>
            <div>First Modal</div>
          </Modal>
          <Modal isOpen={true} onClose={jest.fn()}>
            <div>Second Modal</div>
          </Modal>
        </>
      );
      expect(screen.getByText('First Modal')).toBeInTheDocument();
      expect(screen.getByText('Second Modal')).toBeInTheDocument();
    });

    it('handles rapid open/close', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );

      for (let i = 0; i < 5; i++) {
        rerender(
          <Modal isOpen={true} onClose={jest.fn()}>
            <div>Content</div>
          </Modal>
        );
        rerender(
          <Modal isOpen={false} onClose={jest.fn()}>
            <div>Content</div>
          </Modal>
        );
      }

      expect(document.body.style.overflow).toBe('');
    });

    it('handles no focusable elements gracefully', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} showCloseButton={false}>
          <div>No focusable content</div>
        </Modal>
      );

      // Should not throw error
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <div>Content</div>
        </Modal>
      );

      const handleClose = jest.fn();
      unmount();

      // These should not cause errors after unmount
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });
  });
});

describe('ModalHeader', () => {
  it('renders children correctly', () => {
    render(<ModalHeader>Header Content</ModalHeader>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    const { container } = render(<ModalHeader>Header</ModalHeader>);
    const header = container.firstChild;
    expect(header.className).toMatch(/px-6/);
    expect(header.className).toMatch(/py-4/);
    expect(header.className).toMatch(/border-b/);
    expect(header.className).toMatch(/border-border/);
  });

  it('supports custom className', () => {
    const { container } = render(
      <ModalHeader className="custom-header">Header</ModalHeader>
    );
    const header = container.firstChild;
    expect(header).toHaveClass('custom-header');
  });

  it('renders with ModalTitle', () => {
    render(
      <ModalHeader>
        <ModalTitle>Title</ModalTitle>
      </ModalHeader>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <ModalHeader>
        <div>Child 1</div>
        <div>Child 2</div>
      </ModalHeader>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('preserves default classes with custom className', () => {
    const { container } = render(
      <ModalHeader className="custom">Header</ModalHeader>
    );
    const header = container.firstChild;
    expect(header.className).toMatch(/px-6/);
    expect(header).toHaveClass('custom');
  });
});

describe('ModalTitle', () => {
  it('renders children correctly', () => {
    render(<ModalTitle>Title Text</ModalTitle>);
    expect(screen.getByText('Title Text')).toBeInTheDocument();
  });

  it('renders as h2 element', () => {
    render(<ModalTitle>Title</ModalTitle>);
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H2');
  });

  it('applies default styles', () => {
    render(<ModalTitle>Title</ModalTitle>);
    const title = screen.getByText('Title');
    expect(title.className).toMatch(/text-2xl/);
    expect(title.className).toMatch(/font-semibold/);
    expect(title.className).toMatch(/text-text-primary/);
  });

  it('supports custom className', () => {
    render(<ModalTitle className="custom-title">Title</ModalTitle>);
    const title = screen.getByText('Title');
    expect(title).toHaveClass('custom-title');
  });

  it('preserves default classes with custom className', () => {
    render(<ModalTitle className="custom">Title</ModalTitle>);
    const title = screen.getByText('Title');
    expect(title.className).toMatch(/text-2xl/);
    expect(title).toHaveClass('custom');
  });

  it('renders complex children', () => {
    render(
      <ModalTitle>
        <span>Part 1</span> <strong>Part 2</strong>
      </ModalTitle>
    );
    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();
  });
});

describe('ModalBody', () => {
  it('renders children correctly', () => {
    render(<ModalBody>Body Content</ModalBody>);
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    const { container } = render(<ModalBody>Body</ModalBody>);
    const body = container.firstChild;
    expect(body.className).toMatch(/px-6/);
    expect(body.className).toMatch(/py-4/);
  });

  it('supports custom className', () => {
    const { container } = render(
      <ModalBody className="custom-body">Body</ModalBody>
    );
    const body = container.firstChild;
    expect(body).toHaveClass('custom-body');
  });

  it('renders multiple children', () => {
    render(
      <ModalBody>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </ModalBody>
    );
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });

  it('preserves default classes with custom className', () => {
    const { container } = render(
      <ModalBody className="custom">Body</ModalBody>
    );
    const body = container.firstChild;
    expect(body.className).toMatch(/px-6/);
    expect(body).toHaveClass('custom');
  });

  it('renders complex content', () => {
    render(
      <ModalBody>
        <form>
          <input type="text" placeholder="Field" />
          <button>Submit</button>
        </form>
      </ModalBody>
    );
    expect(screen.getByPlaceholderText('Field')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});

describe('ModalFooter', () => {
  it('renders children correctly', () => {
    render(<ModalFooter>Footer Content</ModalFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('applies default styles', () => {
    const { container } = render(<ModalFooter>Footer</ModalFooter>);
    const footer = container.firstChild;
    expect(footer.className).toMatch(/px-6/);
    expect(footer.className).toMatch(/py-4/);
    expect(footer.className).toMatch(/border-t/);
    expect(footer.className).toMatch(/border-border/);
    expect(footer.className).toMatch(/flex/);
    expect(footer.className).toMatch(/items-center/);
    expect(footer.className).toMatch(/justify-end/);
    expect(footer.className).toMatch(/gap-3/);
  });

  it('supports custom className', () => {
    const { container } = render(
      <ModalFooter className="custom-footer">Footer</ModalFooter>
    );
    const footer = container.firstChild;
    expect(footer).toHaveClass('custom-footer');
  });

  it('renders buttons in footer', () => {
    render(
      <ModalFooter>
        <button>Cancel</button>
        <button>Confirm</button>
      </ModalFooter>
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('preserves default classes with custom className', () => {
    const { container } = render(
      <ModalFooter className="custom">Footer</ModalFooter>
    );
    const footer = container.firstChild;
    expect(footer.className).toMatch(/px-6/);
    expect(footer.className).toMatch(/flex/);
    expect(footer).toHaveClass('custom');
  });

  it('arranges children with gap', () => {
    const { container } = render(
      <ModalFooter>
        <button>Button 1</button>
        <button>Button 2</button>
      </ModalFooter>
    );
    const footer = container.firstChild;
    expect(footer.className).toMatch(/gap-3/);
  });
});

describe('Integration Tests', () => {
  it('renders complete modal with all subcomponents', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <ModalHeader>
          <ModalTitle>Complete Modal</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p>This is the body content</p>
        </ModalBody>
        <ModalFooter>
          <button>Cancel</button>
          <button>Save</button>
        </ModalFooter>
      </Modal>
    );

    expect(screen.getByText('Complete Modal')).toBeInTheDocument();
    expect(screen.getByText('This is the body content')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('handles form submission in modal', async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());

    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>Form Modal</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <input type="text" placeholder="Name" />
          </ModalBody>
          <ModalFooter>
            <button type="submit">Submit</button>
          </ModalFooter>
        </form>
      </Modal>
    );

    const input = screen.getByPlaceholderText('Name');
    await userEvent.type(input, 'John Doe');

    const submitButton = screen.getByText('Submit');
    await userEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('handles close from footer button', () => {
    const handleClose = jest.fn();

    render(
      <Modal isOpen={true} onClose={handleClose}>
        <ModalHeader>
          <ModalTitle>Modal</ModalTitle>
        </ModalHeader>
        <ModalBody>Content</ModalBody>
        <ModalFooter>
          <button onClick={handleClose}>Close</button>
        </ModalFooter>
      </Modal>
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('maintains proper focus order with all subcomponents', async () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <ModalHeader>
          <ModalTitle>Modal</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <input type="text" placeholder="First" />
          <input type="text" placeholder="Second" />
        </ModalBody>
        <ModalFooter>
          <button>Cancel</button>
          <button>OK</button>
        </ModalFooter>
      </Modal>
    );

    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close modal');
      expect(document.activeElement).toBe(closeButton);
    });
  });

  it('applies consistent styling across subcomponents', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <ModalHeader>
          <ModalTitle>Title</ModalTitle>
        </ModalHeader>
        <ModalBody>Body</ModalBody>
        <ModalFooter>Footer</ModalFooter>
      </Modal>
    );

    const header = screen.getByText('Title').parentElement;
    const body = screen.getByText('Body');
    const footer = screen.getByText('Footer');

    // All should have consistent horizontal padding
    expect(header.className).toMatch(/px-6/);
    expect(body.className).toMatch(/px-6/);
    expect(footer.className).toMatch(/px-6/);
  });
});

export default mockConfirm
