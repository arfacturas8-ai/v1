import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('renders when open', () => {
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

  it('calls onClose when close button clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /close/i }) ||
                       screen.getByLabelText(/close/i);
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when overlay clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );

    const overlay = document.querySelector('[data-overlay]') ||
                   screen.getByText('Modal Content').parentElement?.parentElement;
    if (overlay) {
      fireEvent.click(overlay);
      expect(handleClose).toHaveBeenCalled();
    }
  });

  it('does not close when clicking inside modal', () => {
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

  it('closes on Escape key press', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalled();
  });

  it('renders title when provided', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('traps focus within modal', async () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <div>
          <button id="btn1">Button 1</button>
          <button id="btn2">Button 2</button>
        </div>
      </Modal>
    );

    await waitFor(() => {
      const firstButton = screen.getByRole('button', { name: /button 1/i });
      expect(document.activeElement).toBe(firstButton);
    });
  });

  it('restores focus on close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open Modal';
    document.body.appendChild(trigger);
    trigger.focus();

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
      expect(document.activeElement).toBe(trigger);
    });

    document.body.removeChild(trigger);
  });

  it('prevents body scroll when open', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
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

    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('has proper ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog', { name: /test modal/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('supports custom size prop', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} size="lg">
        <div>Modal Content</div>
      </Modal>
    );

    const modal = screen.getByText('Modal Content').closest('div');
    expect(modal?.className).toMatch(/lg|large/i);
  });
});

export default handleClose
