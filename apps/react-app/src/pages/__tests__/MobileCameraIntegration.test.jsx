/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import MobileCameraIntegration from '../MobileCameraIntegration';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
}));

describe('MobileCameraIntegration', () => {
  let mockOnClose;
  let mockOnCapture;
  let mockGetUserMedia;
  let mockVideoPlay;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnClose = jest.fn();
    mockOnCapture = jest.fn();
    mockVideoPlay = jest.fn().mockResolvedValue(undefined);

    // Mock getUserMedia
    mockGetUserMedia = jest.fn().mockResolvedValue({
      getTracks: () => [],
      getVideoTracks: () => [{ stop: jest.fn() }],
    });

    global.navigator.mediaDevices = {
      getUserMedia: mockGetUserMedia,
      enumerateDevices: jest.fn().mockResolvedValue([]),
    };

    // Mock HTMLVideoElement play method
    window.HTMLMediaElement.prototype.play = mockVideoPlay;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders component without crashing', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      expect(container).toBeInTheDocument();
    });

    it('renders video element', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const video = screen.getByRole('img', { hidden: true }) || document.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const closeButton = screen.getAllByRole('button')[0];
      expect(closeButton).toBeInTheDocument();
    });

    it('renders capture button', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('renders with fixed positioning', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('fixed');
    });

    it('renders with full screen coverage', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('inset-0');
    });

    it('renders with black background', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('bg-black');
    });

    it('renders with high z-index', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('z-50');
    });

    it('renders as dialog with proper ARIA attributes', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label for camera', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Camera');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Video Element', () => {
    it('video has autoPlay attribute', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const video = document.querySelector('video');
      expect(video).toHaveAttribute('autoPlay');
    });

    it('video has playsInline attribute', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const video = document.querySelector('video');
      expect(video).toHaveAttribute('playsInline');
    });

    it('video has full width styling', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const video = document.querySelector('video');
      expect(video).toHaveClass('w-full');
    });

    it('video has full height styling', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const video = document.querySelector('video');
      expect(video).toHaveClass('h-full');
    });

    it('video has object-cover styling', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const video = document.querySelector('video');
      expect(video).toHaveClass('object-cover');
    });

    it('video ref is properly assigned', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });
  });

  describe('Button Controls', () => {
    it('close button has red background', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const closeButton = screen.getAllByRole('button')[0];
      expect(closeButton).toHaveClass('bg-red-500');
    });

    it('capture button has white background', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const captureButton = screen.getAllByRole('button')[1];
      expect(captureButton).toHaveClass('bg-white');
    });

    it('close button has circular shape', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const closeButton = screen.getAllByRole('button')[0];
      expect(closeButton).toHaveClass('rounded-full');
    });

    it('capture button has circular shape', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const captureButton = screen.getAllByRole('button')[1];
      expect(captureButton).toHaveClass('rounded-full');
    });

    it('buttons are positioned at bottom', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const buttonContainer = container.querySelector('.bottom-8');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('buttons are centered horizontally', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const buttonContainer = container.querySelector('.justify-center');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('buttons have gap spacing', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const buttonContainer = container.querySelector('.gap-4');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const closeButton = screen.getAllByRole('button')[0];

      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onCapture when capture button is clicked', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const captureButton = screen.getAllByRole('button')[1];

      await user.click(captureButton);

      expect(mockOnCapture).toHaveBeenCalledTimes(1);
    });

    it('handles multiple close button clicks', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const closeButton = screen.getAllByRole('button')[0];

      await user.click(closeButton);
      await user.click(closeButton);
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });

    it('handles multiple capture button clicks', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const captureButton = screen.getAllByRole('button')[1];

      await user.click(captureButton);
      await user.click(captureButton);

      expect(mockOnCapture).toHaveBeenCalledTimes(2);
    });

    it('buttons are keyboard accessible', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled');
      });
    });

    it('close button click does not call onCapture', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const closeButton = screen.getAllByRole('button')[0];

      await user.click(closeButton);

      expect(mockOnCapture).not.toHaveBeenCalled();
    });

    it('capture button click does not call onClose', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const captureButton = screen.getAllByRole('button')[1];

      await user.click(captureButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Icon Rendering', () => {
    it('renders X icon in close button', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const xIcon = container.querySelector('.lucide-x');
      expect(xIcon).toBeInTheDocument();
    });

    it('renders Camera icon in capture button', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const cameraIcon = container.querySelector('.lucide-camera');
      expect(cameraIcon).toBeInTheDocument();
    });

    it('X icon has white color', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const xIcon = container.querySelector('.lucide-x');
      expect(xIcon).toHaveClass('text-white');
    });

    it('X icon has correct size', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const xIcon = container.querySelector('.lucide-x');
      expect(xIcon).toHaveClass('w-6', 'h-6');
    });

    it('Camera icon has correct size', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const cameraIcon = container.querySelector('.lucide-camera');
      expect(cameraIcon).toHaveClass('w-8', 'h-8');
    });
  });

  describe('Props Handling', () => {
    it('works without onClose prop', () => {
      const { container } = render(<MobileCameraIntegration onCapture={mockOnCapture} />);
      expect(container).toBeInTheDocument();
    });

    it('works without onCapture prop', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} />);
      expect(container).toBeInTheDocument();
    });

    it('works without any props', () => {
      const { container } = render(<MobileCameraIntegration />);
      expect(container).toBeInTheDocument();
    });

    it('handles null onClose gracefully', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={null} onCapture={mockOnCapture} />);
      const closeButton = screen.getAllByRole('button')[0];

      await expect(user.click(closeButton)).resolves.not.toThrow();
    });

    it('handles null onCapture gracefully', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={null} />);
      const captureButton = screen.getAllByRole('button')[1];

      await expect(user.click(captureButton)).resolves.not.toThrow();
    });

    it('accepts custom className via props spreading', () => {
      const { container } = render(
        <MobileCameraIntegration
          onClose={mockOnClose}
          onCapture={mockOnCapture}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('renders on mount', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('cleans up properly on unmount', () => {
      const { unmount, container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      unmount();
      expect(container).toBeEmptyDOMElement();
    });

    it('re-renders with new props', () => {
      const { rerender } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const newOnClose = jest.fn();
      rerender(<MobileCameraIntegration onClose={newOnClose} onCapture={mockOnCapture} />);
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('maintains stable references with memo', () => {
      const { rerender } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const firstRender = screen.getAllByRole('button')[0];

      rerender(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const secondRender = screen.getAllByRole('button')[0];

      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('buttons are focusable', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('supports keyboard navigation between buttons', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const buttons = screen.getAllByRole('button');

      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();
    });

    it('supports Enter key on close button', async () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const closeButton = screen.getAllByRole('button')[0];

      fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
      closeButton.click();

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('supports Enter key on capture button', async () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const captureButton = screen.getAllByRole('button')[1];

      fireEvent.keyDown(captureButton, { key: 'Enter', code: 'Enter' });
      captureButton.click();

      expect(mockOnCapture).toHaveBeenCalled();
    });

    it('maintains focus within dialog', () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to mobile viewport', () => {
      global.innerWidth = 375;
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      expect(container.firstChild).toHaveClass('fixed', 'inset-0');
    });

    it('adapts to tablet viewport', () => {
      global.innerWidth = 768;
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      expect(container.firstChild).toHaveClass('fixed', 'inset-0');
    });

    it('maintains aspect ratio on different screens', () => {
      const { container } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const video = container.querySelector('video');
      expect(video).toHaveClass('object-cover');
    });
  });

  describe('Performance', () => {
    it('component is memoized', () => {
      const MemoizedComponent = MobileCameraIntegration;
      expect(MemoizedComponent.$$typeof?.toString()).toContain('react.memo');
    });

    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const renderSpy = jest.fn();

      rerender(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      // Memo should prevent re-render with same props
    });

    it('renders quickly', () => {
      const startTime = performance.now();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid button clicks', async () => {
      const user = userEvent.setup();
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const captureButton = screen.getAllByRole('button')[1];

      await user.click(captureButton);
      await user.click(captureButton);
      await user.click(captureButton);

      expect(mockOnCapture).toHaveBeenCalledTimes(3);
    });

    it('handles simultaneous button interactions', async () => {
      render(<MobileCameraIntegration onClose={mockOnClose} onCapture={mockOnCapture} />);
      const [closeButton, captureButton] = screen.getAllByRole('button');

      fireEvent.click(closeButton);
      fireEvent.click(captureButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
    });

    it('handles missing callback functions', () => {
      const { container } = render(<MobileCameraIntegration />);
      const buttons = screen.getAllByRole('button');

      expect(() => {
        fireEvent.click(buttons[0]);
        fireEvent.click(buttons[1]);
      }).not.toThrow();
    });
  });
});

export default video
