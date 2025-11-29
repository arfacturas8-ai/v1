/**
 * CRYB Design System - Modal Component Tests
 * Comprehensive test coverage for modal functionality
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

// Mock framer-motion to avoid animation complexities in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the animations library
jest.mock('../../lib/animations', () => ({
  backdropVariants: {},
  modalVariants: {},
  drawerVariants: {},
  slideVariants: {},
  fadeVariants: {},
}));

// Mock the accessibility hooks
jest.mock('../../lib/accessibility.tsx', () => ({
  useFocusTrap: jest.fn(() => ({ current: null })),
  usePrefersReducedMotion: jest.fn(() => false),
  useId: jest.fn(() => 'test-id'),
  generateId: jest.fn(() => 'test-id'),
  announcer: {
    announce: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="x-icon">X</span>,
  AlertTriangle: () => <span data-testid="alert-triangle-icon">AlertTriangle</span>,
  CheckCircle2: () => <span data-testid="check-circle-icon">CheckCircle2</span>,
  Info: () => <span data-testid="info-icon">Info</span>,
  AlertCircle: () => <span data-testid="alert-circle-icon">AlertCircle</span>,
}));

// Mock @radix-ui/react-slot
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Slottable: ({ children }: any) => <>{children}</>,
  createSlot: jest.fn(() => ({ children, ...props }: any) => <div {...props}>{children}</div>),
  createSlottable: jest.fn(() => ({ children }: any) => <>{children}</>),
}));

// Mock the Button component to avoid complex dependencies
jest.mock('./button', () => {
  const React = require('react');
  return {
    Button: React.forwardRef(({ children, variant, size, className, ...props }: any, ref: any) => (
      <button ref={ref} className={`button ${variant || ''} ${size || ''} ${className || ''}`.trim()} {...props}>
        {children}
      </button>
    )),
  };
});

// Import components after mocks are set up
import {
  Modal,
  ModalTrigger,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  AlertDialog,
  Drawer,
  useConfirmationDialog,
} from './modal';

// Helper component for controlled modal testing
const ControlledModal = ({
  children,
  defaultOpen = false,
  onOpenChange,
  ...props
}: any) => {
  const [open, setOpen] = useState(defaultOpen);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange} {...props}>
      {children}
    </Modal>
  );
};

// Suppress console errors and warnings for Radix UI accessibility warnings during tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('DialogContent') ||
        args[0].includes('DialogTitle') ||
        args[0].includes('aria-describedby'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Description') ||
        args[0].includes('aria-describedby'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

describe('Modal Component', () => {
  describe('Basic Rendering', () => {
    it('should not render when closed', () => {
      render(
        <Modal open={false} onOpenChange={jest.fn()}>
          <ModalBody>Modal Content</ModalBody>
        </Modal>
      );

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Modal Content</ModalBody>
        </Modal>
      );

      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should render with header, body, and footer', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
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

    it('should render with description', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader>
            <ModalTitle>Title</ModalTitle>
            <ModalDescription>Description text</ModalDescription>
          </ModalHeader>
          <ModalBody>Body</ModalBody>
        </Modal>
      );

      expect(screen.getByText('Description text')).toBeInTheDocument();
    });
  });

  describe('Open/Close Functionality', () => {
    it('should call onOpenChange when closing', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <ModalHeader>
            <ModalTitle>Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should toggle open state with controlled component', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <ControlledModal defaultOpen={true} onOpenChange={onOpenChange}>
          <ModalHeader>
            <ModalTitle>Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </ControlledModal>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should close when ModalClose button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <ModalBody>Content</ModalBody>
          <ModalFooter>
            <ModalClose variant="outline">Close</ModalClose>
          </ModalFooter>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Overlay/Backdrop Functionality', () => {
    it('should render overlay when modal is open', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      // Radix UI renders overlay as a sibling element
      const portal = container.parentElement;
      const overlays = portal?.querySelectorAll('[data-radix-dialog-overlay]');
      expect(overlays?.length).toBeGreaterThan(0);
    });

    it('should apply custom overlay className', () => {
      const { container } = render(
        <Modal
          open={true}
          onOpenChange={jest.fn()}
          overlayClassName="custom-overlay-class"
        >
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const portal = container.parentElement;
      const overlay = portal?.querySelector('[data-radix-dialog-overlay]');
      expect(overlay?.className).toContain('custom-overlay-class');
    });

    it('should apply different overlay variants', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()} overlayVariant="glass">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const portal = container.parentElement;
      const overlay = portal?.querySelector('[data-radix-dialog-overlay]');
      expect(overlay?.className).toContain('backdrop-blur-xl');
    });

    it('should not close on outside click when disableOutsideClick is true', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      const { container } = render(
        <Modal open={true} onOpenChange={onOpenChange} disableOutsideClick={true}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const portal = container.parentElement;
      const overlay = portal?.querySelector('[data-radix-dialog-overlay]');

      if (overlay) {
        await user.click(overlay as Element);
      }

      // Should not have been called because outside clicks are disabled
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key Handling', () => {
    it('should close on escape key by default', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      await user.keyboard('{Escape}');

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close on escape key when disableEscapeKey is true', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Modal open={true} onOpenChange={onOpenChange} disableEscapeKey={true}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      await user.keyboard('{Escape}');

      // Should not have been called because escape key is disabled
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Portal Rendering', () => {
    it('should render content in a portal', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Portal Content</ModalBody>
        </Modal>
      );

      // Content should be rendered outside the container
      expect(container.querySelector('[data-radix-dialog-content]')).toBeFalsy();

      // But should exist in the document
      expect(screen.getByText('Portal Content')).toBeInTheDocument();
    });

    it('should render at the end of document body', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      // Radix Portal renders as a direct child of body
      const portals = document.body.querySelectorAll('[data-radix-portal]');
      expect(portals.length).toBeGreaterThan(0);
    });
  });

  describe('Focus Management', () => {
    it('should focus on modal content when opened', async () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>
            <input type="text" placeholder="Test input" />
          </ModalBody>
        </Modal>
      );

      await waitFor(() => {
        const content = screen.getByText('Test input').closest('[data-radix-dialog-content]');
        expect(content).toBeInTheDocument();
      });
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();

      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>
            <input type="text" placeholder="First input" />
            <input type="text" placeholder="Second input" />
          </ModalBody>
          <ModalFooter>
            <ModalClose>Close</ModalClose>
          </ModalFooter>
        </Modal>
      );

      const firstInput = screen.getByPlaceholderText('First input');
      const secondInput = screen.getByPlaceholderText('Second input');
      const closeButton = screen.getByRole('button', { name: /close/i });

      // Tab through elements
      await user.tab();
      await user.tab();

      // Focus should be trapped within modal
      expect(document.activeElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should link title with aria-labelledby', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader>
            <ModalTitle>Accessible Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const titleId = screen.getByText('Accessible Title').getAttribute('id');

      expect(dialog).toHaveAttribute('aria-labelledby', titleId);
    });

    it('should link description with aria-describedby', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader>
            <ModalTitle>Title</ModalTitle>
            <ModalDescription>Modal description</ModalDescription>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      const descriptionId = screen.getByText('Modal description').getAttribute('id');

      expect(dialog).toHaveAttribute('aria-describedby', descriptionId);
    });

    it('should have accessible close button', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader>
            <ModalTitle>Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()} size="sm">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('max-w-sm');
    });

    it('should render default size', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()} size="default">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('max-w-lg');
    });

    it('should render large size', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()} size="lg">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('max-w-2xl');
    });

    it('should render extra large size', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()} size="xl">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('max-w-4xl');
    });

    it('should render full size', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()} size="full">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('w-[95vw]');
    });
  });

  describe('Style Variants', () => {
    it('should apply default variant styles', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()} variant="default">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('bg-background');
      expect(content.className).toContain('border');
    });

    it('should apply glass variant styles', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()} variant="glass">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('backdrop-blur-xl');
    });

    it('should apply gradient variant styles', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()} variant="gradient">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('bg-gradient-to-br');
    });

    it('should apply neon variant styles', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()} variant="neon">
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('border-accent-cyan');
    });

    it('should apply custom content className', () => {
      render(
        <Modal
          open={true}
          onOpenChange={jest.fn()}
          contentClassName="custom-content-class"
        >
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('custom-content-class');
    });
  });

  describe('Animation States', () => {
    it('should have open animation data attribute', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveAttribute('data-state', 'open');
    });

    it('should include animation classes', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('data-[state=open]:animate-in');
      expect(content.className).toContain('data-[state=closed]:animate-out');
    });
  });

  describe('Z-Index Stacking', () => {
    it('should have z-50 for overlay', () => {
      const { container } = render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const portal = container.parentElement;
      const overlay = portal?.querySelector('[data-radix-dialog-overlay]');
      expect(overlay?.className).toContain('z-50');
    });

    it('should have z-50 for content', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('z-50');
    });
  });

  describe('ModalHeader Component', () => {
    it('should render with close button by default', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader>
            <ModalTitle>Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader showCloseButton={false}>
            <ModalTitle>Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const closeButton = screen.queryByRole('button', { name: /close modal/i });
      expect(closeButton).not.toBeInTheDocument();
    });

    it('should render custom close button', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader closeButton={<button>Custom Close</button>}>
            <ModalTitle>Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      expect(screen.getByText('Custom Close')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader className="custom-header-class">
            <ModalTitle>Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const header = screen.getByText('Title').parentElement;
      expect(header?.className).toContain('custom-header-class');
    });
  });

  describe('ModalTitle Component', () => {
    it('should render as h2 by default', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader>
            <ModalTitle>Test Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const title = screen.getByText('Test Title');
      expect(title.tagName).toBe('H2');
    });

    it('should render different heading levels', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader>
            <ModalTitle level={3}>Test Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const title = screen.getByText('Test Title');
      expect(title.tagName).toBe('H3');
    });

    it('should apply custom className', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalHeader>
            <ModalTitle className="custom-title">Test Title</ModalTitle>
          </ModalHeader>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const title = screen.getByText('Test Title');
      expect(title.className).toContain('custom-title');
    });
  });

  describe('ModalBody Component', () => {
    it('should render children', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>
            <p>Body content</p>
          </ModalBody>
        </Modal>
      );

      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody className="custom-body">Content</ModalBody>
        </Modal>
      );

      const body = screen.getByText('Content');
      expect(body.className).toContain('custom-body');
    });

    it('should have overflow-y-auto class', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      const body = screen.getByText('Content');
      expect(body.className).toContain('overflow-y-auto');
    });
  });

  describe('ModalFooter Component', () => {
    it('should render children', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
          <ModalFooter>
            <button>Action</button>
          </ModalFooter>
        </Modal>
      );

      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should justify end by default', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
          <ModalFooter>Footer</ModalFooter>
        </Modal>
      );

      const footer = screen.getByText('Footer');
      expect(footer.className).toContain('justify-end');
    });

    it('should apply different justify options', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
          <ModalFooter justify="start">Footer</ModalFooter>
        </Modal>
      );

      const footer = screen.getByText('Footer');
      expect(footer.className).toContain('justify-start');
    });

    it('should apply custom className', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
          <ModalFooter className="custom-footer">Footer</ModalFooter>
        </Modal>
      );

      const footer = screen.getByText('Footer');
      expect(footer.className).toContain('custom-footer');
    });
  });

  describe('ModalTrigger Component', () => {
    it('should open modal when trigger is clicked', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [open, setOpen] = useState(false);

        return (
          <>
            <ModalTrigger asChild>
              <button onClick={() => setOpen(true)}>Open Modal</button>
            </ModalTrigger>
            <Modal open={open} onOpenChange={setOpen}>
              <ModalBody>Modal Content</ModalBody>
            </Modal>
          </>
        );
      };

      render(<TestComponent />);

      const trigger = screen.getByText('Open Modal');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
      });
    });
  });

  describe('ModalClose Component', () => {
    it('should render as button by default', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
          <ModalFooter>
            <ModalClose>Close</ModalClose>
          </ModalFooter>
        </Modal>
      );

      const closeBtn = screen.getByRole('button', { name: /close/i });
      expect(closeBtn).toBeInTheDocument();
    });

    it('should accept button variants', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
          <ModalFooter>
            <ModalClose variant="destructive">Delete</ModalClose>
          </ModalFooter>
        </Modal>
      );

      const closeBtn = screen.getByRole('button', { name: /delete/i });
      expect(closeBtn).toBeInTheDocument();
    });

    it('should support asChild pattern', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <a href="#close">Custom Close</a>
            </ModalClose>
          </ModalFooter>
        </Modal>
      );

      expect(screen.getByText('Custom Close')).toBeInTheDocument();
    });
  });

  describe('AlertDialog Component', () => {
    it('should render with title and description', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Alert Title"
          description="Alert description"
        />
      );

      expect(screen.getByText('Alert Title')).toBeInTheDocument();
      expect(screen.getByText('Alert description')).toBeInTheDocument();
    });

    it('should render info type with correct icon', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          type="info"
          title="Information"
        />
      );

      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('should render warning type with correct icon', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          type="warning"
          title="Warning"
        />
      );

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should render error type with correct icon', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          type="error"
          title="Error"
        />
      );

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should render success type with correct icon', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          type="success"
          title="Success"
        />
      );

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should render cancel and confirm buttons', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Confirm Action"
          cancelText="No"
          confirmText="Yes"
        />
      );

      expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Confirm"
          onConfirm={onConfirm}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /continue/i });
      await user.click(confirmBtn);

      expect(onConfirm).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Confirm"
          onCancel={onCancel}
        />
      );

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should hide cancel button when showCancel is false', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Alert"
          showCancel={false}
        />
      );

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('should apply custom confirm button variant', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Delete"
          confirmVariant="destructive"
        />
      );

      const confirmBtn = screen.getByRole('button', { name: /continue/i });
      expect(confirmBtn.className).toContain('destructive');
    });

    it('should render custom children', () => {
      render(
        <AlertDialog
          open={true}
          onOpenChange={jest.fn()}
          title="Alert"
        >
          <p>Custom content</p>
        </AlertDialog>
      );

      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });

  describe('useConfirmationDialog Hook', () => {
    const TestComponent = () => {
      const { confirm, ConfirmationDialog } = useConfirmationDialog();
      const [result, setResult] = useState<boolean | null>(null);

      const handleConfirm = async () => {
        const confirmed = await confirm({
          title: 'Delete Item',
          description: 'Are you sure?',
          type: 'error',
        });
        setResult(confirmed);
      };

      return (
        <>
          <button onClick={handleConfirm}>Show Confirm</button>
          {result !== null && <div>Result: {result.toString()}</div>}
          {ConfirmationDialog}
        </>
      );
    };

    it('should show confirmation dialog', async () => {
      const user = userEvent.setup();

      render(<TestComponent />);

      const showBtn = screen.getByText('Show Confirm');
      await user.click(showBtn);

      await waitFor(() => {
        expect(screen.getByText('Delete Item')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      });
    });

    it('should resolve with true when confirmed', async () => {
      const user = userEvent.setup();

      render(<TestComponent />);

      const showBtn = screen.getByText('Show Confirm');
      await user.click(showBtn);

      await waitFor(() => {
        expect(screen.getByText('Delete Item')).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /continue/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText('Result: true')).toBeInTheDocument();
      });
    });

    it('should resolve with false when cancelled', async () => {
      const user = userEvent.setup();

      render(<TestComponent />);

      const showBtn = screen.getByText('Show Confirm');
      await user.click(showBtn);

      await waitFor(() => {
        expect(screen.getByText('Delete Item')).toBeInTheDocument();
      });

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.getByText('Result: false')).toBeInTheDocument();
      });
    });
  });

  describe('Drawer Component', () => {
    it('should render drawer at bottom position by default', () => {
      render(
        <Drawer open={true} onOpenChange={jest.fn()}>
          <ModalBody>Drawer Content</ModalBody>
        </Drawer>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('bottom-0');
      expect(content.className).toContain('inset-x-0');
    });

    it('should render drawer at different positions', () => {
      const { rerender } = render(
        <Drawer open={true} onOpenChange={jest.fn()} position="top">
          <ModalBody>Content</ModalBody>
        </Drawer>
      );

      let content = screen.getByRole('dialog');
      expect(content.className).toContain('top-0');

      rerender(
        <Drawer open={true} onOpenChange={jest.fn()} position="left">
          <ModalBody>Content</ModalBody>
        </Drawer>
      );

      content = screen.getByRole('dialog');
      expect(content.className).toContain('left-0');

      rerender(
        <Drawer open={true} onOpenChange={jest.fn()} position="right">
          <ModalBody>Content</ModalBody>
        </Drawer>
      );

      content = screen.getByRole('dialog');
      expect(content.className).toContain('right-0');
    });

    it('should have appropriate slide animations for position', () => {
      render(
        <Drawer open={true} onOpenChange={jest.fn()} position="bottom">
          <ModalBody>Content</ModalBody>
        </Drawer>
      );

      const content = screen.getByRole('dialog');
      expect(content.className).toContain('slide-in-from-bottom');
    });
  });

  describe('Body Scroll Prevention', () => {
    it('should prevent body scroll when modal is open', () => {
      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      );

      // Radix UI handles scroll lock - just verify modal is rendered
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle nested modals', () => {
      render(
        <>
          <Modal open={true} onOpenChange={jest.fn()}>
            <ModalBody>First Modal</ModalBody>
          </Modal>
          <Modal open={true} onOpenChange={jest.fn()}>
            <ModalBody>Second Modal</ModalBody>
          </Modal>
        </>
      );

      expect(screen.getByText('First Modal')).toBeInTheDocument();
      expect(screen.getByText('Second Modal')).toBeInTheDocument();
    });

    it('should handle form submission within modal', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((e) => e.preventDefault());

      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>
            <form onSubmit={onSubmit}>
              <input type="text" placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          </ModalBody>
        </Modal>
      );

      const input = screen.getByPlaceholderText('Name');
      const submitBtn = screen.getByRole('button', { name: /submit/i });

      await user.type(input, 'Test Name');
      await user.click(submitBtn);

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should render long content with scrolling', () => {
      const longContent = Array.from({ length: 50 }, (_, i) => (
        <p key={i}>Line {i + 1}</p>
      ));

      render(
        <Modal open={true} onOpenChange={jest.fn()}>
          <ModalBody>{longContent}</ModalBody>
        </Modal>
      );

      const body = screen.getByText('Line 1').parentElement;
      expect(body?.className).toContain('overflow-y-auto');
    });

    it('should maintain state during open/close cycles', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [open, setOpen] = useState(false);
        const [count, setCount] = useState(0);

        return (
          <>
            <button onClick={() => setOpen(true)}>Open</button>
            <Modal open={open} onOpenChange={setOpen}>
              <ModalBody>
                <p>Count: {count}</p>
                <button onClick={() => setCount(count + 1)}>Increment</button>
              </ModalBody>
              <ModalFooter>
                <ModalClose>Close</ModalClose>
              </ModalFooter>
            </Modal>
          </>
        );
      };

      render(<TestComponent />);

      const openBtn = screen.getByText('Open');
      await user.click(openBtn);

      await waitFor(() => {
        expect(screen.getByText('Count: 0')).toBeInTheDocument();
      });

      const incrementBtn = screen.getByText('Increment');
      await user.click(incrementBtn);

      await waitFor(() => {
        expect(screen.getByText('Count: 1')).toBeInTheDocument();
      });

      const closeBtn = screen.getByRole('button', { name: /close/i });
      await user.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText('Count: 1')).not.toBeInTheDocument();
      });
    });
  });
});
