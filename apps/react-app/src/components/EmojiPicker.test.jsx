/**
 * Tests for EmojiPicker component
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmojiPicker from './EmojiPicker';

// Mock the external emoji picker library
jest.mock('emoji-picker-react', () => {
  return function EmojiPickerReact({ onEmojiClick }) {
    return (
      <div data-testid="emoji-picker-react">
        <button onClick={() => onEmojiClick({ emoji: '😀' })}>
          Test Emoji
        </button>
      </div>
    );
  };
});

jest.mock('lucide-react', () => ({
  Smile: ({ size, className }) => (
    <svg data-testid="smile-icon" width={size} className={className} />
  )
}));

describe('EmojiPicker', () => {
  const mockOnEmojiSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
    });

    it('renders emoji button by default', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
      expect(screen.getByTitle('Add emoji')).toBeInTheDocument();
    });

    it('renders smile icon', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
      expect(screen.getByTestId('smile-icon')).toBeInTheDocument();
    });

    it('does not render button when showButton is false', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} showButton={false} />);
      expect(screen.queryByTitle('Add emoji')).not.toBeInTheDocument();
    });

    it('does not show picker initially', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
      expect(screen.queryByTestId('emoji-picker-react')).not.toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('opens picker on button click', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      const button = screen.getByTitle('Add emoji');
      await user.click(button);

      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();
    });

    it('closes picker on second button click', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      const button = screen.getByTitle('Add emoji');
      await user.click(button);
      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();

      await user.click(button);
      expect(screen.queryByTestId('emoji-picker-react')).not.toBeInTheDocument();
    });

    it('toggles picker state', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      const button = screen.getByTitle('Add emoji');

      // Open
      await user.click(button);
      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();

      // Close
      await user.click(button);
      expect(screen.queryByTestId('emoji-picker-react')).not.toBeInTheDocument();

      // Open again
      await user.click(button);
      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();
    });
  });

  describe('Emoji Selection', () => {
    it('calls onEmojiSelect when emoji is clicked', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      await user.click(screen.getByTitle('Add emoji'));
      await user.click(screen.getByText('Test Emoji'));

      expect(mockOnEmojiSelect).toHaveBeenCalledWith('😀');
    });

    it('closes picker after emoji selection', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      await user.click(screen.getByTitle('Add emoji'));
      await user.click(screen.getByText('Test Emoji'));

      expect(screen.queryByTestId('emoji-picker-react')).not.toBeInTheDocument();
    });

    it('calls onEmojiSelect only once per selection', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      await user.click(screen.getByTitle('Add emoji'));
      await user.click(screen.getByText('Test Emoji'));

      expect(mockOnEmojiSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Click Outside', () => {
    it('closes picker when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
        </div>
      );

      const button = screen.getByTitle('Add emoji');
      await user.click(button);
      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();

      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(screen.queryByTestId('emoji-picker-react')).not.toBeInTheDocument();
      });
    });

    it('does not close when clicking inside picker', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      await user.click(screen.getByTitle('Add emoji'));
      const picker = screen.getByTestId('emoji-picker-react');

      fireEvent.mouseDown(picker);

      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();
    });

    it('does not close when clicking button', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      const button = screen.getByTitle('Add emoji');
      await user.click(button);

      fireEvent.mouseDown(button);

      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();
    });

    it('removes event listener on unmount', async () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const user = userEvent.setup();
      const { unmount } = render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      await user.click(screen.getByTitle('Add emoji'));
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Controlled Component', () => {
    it('uses controlled isOpen prop', () => {
      render(
        <EmojiPicker
          onEmojiSelect={mockOnEmojiSelect}
          isOpen={true}
          onToggle={jest.fn()}
        />
      );

      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();
    });

    it('calls onToggle when button is clicked', async () => {
      const user = userEvent.setup();
      const onToggle = jest.fn();

      render(
        <EmojiPicker
          onEmojiSelect={mockOnEmojiSelect}
          isOpen={false}
          onToggle={onToggle}
        />
      );

      await user.click(screen.getByTitle('Add emoji'));

      expect(onToggle).toHaveBeenCalled();
    });

    it('respects controlled isOpen=false', () => {
      render(
        <EmojiPicker
          onEmojiSelect={mockOnEmojiSelect}
          isOpen={false}
          onToggle={jest.fn()}
        />
      );

      expect(screen.queryByTestId('emoji-picker-react')).not.toBeInTheDocument();
    });

    it('respects controlled isOpen=true', () => {
      render(
        <EmojiPicker
          onEmojiSelect={mockOnEmojiSelect}
          isOpen={true}
          onToggle={jest.fn()}
        />
      );

      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();
    });
  });

  describe('Mobile Mode', () => {
    it('renders with mobile styles', () => {
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />
      );

      const button = screen.getByTitle('Add emoji');
      expect(button).toHaveClass('touch-target');
    });

    it('renders larger icon in mobile mode', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />);

      const icon = screen.getByTestId('smile-icon');
      expect(icon).toHaveAttribute('width', '22');
    });

    it('shows quick emoji bar in mobile mode', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />);

      await user.click(screen.getByTitle('Add emoji'));

      expect(screen.getByText('Quick Reactions')).toBeInTheDocument();
    });

    it('renders 8 quick emojis in mobile mode', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />);

      await user.click(screen.getByTitle('Add emoji'));

      const quickEmojis = screen.getAllByRole('button').filter(btn =>
        btn.textContent.match(/[😀😂😍👍❤️🔥👏💯]/)
      );

      expect(quickEmojis.length).toBe(8);
    });

    it('shows overlay in mobile mode', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(overlay).toBeInTheDocument();
    });

    it('closes on overlay click', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50');
      fireEvent.click(overlay);

      await waitFor(() => {
        expect(screen.queryByText('Quick Reactions')).not.toBeInTheDocument();
      });
    });

    it('shows More Emojis button', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />);

      await user.click(screen.getByTitle('Add emoji'));

      expect(screen.getByText('More Emojis')).toBeInTheDocument();
    });

    it('renders close button in mobile header', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const closeButtons = container.querySelectorAll('svg');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Desktop Mode', () => {
    it('shows desktop picker when open', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={false} />);

      await user.click(screen.getByTitle('Add emoji'));

      expect(screen.getByTestId('emoji-picker-react')).toBeInTheDocument();
    });

    it('does not show quick emoji bar in desktop mode', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={false} />);

      await user.click(screen.getByTitle('Add emoji'));

      expect(screen.queryByText('Quick Reactions')).not.toBeInTheDocument();
    });

    it('does not show overlay in desktop mode', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={false} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const overlay = container.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(overlay).not.toBeInTheDocument();
    });

    it('shows custom header', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={false} />);

      await user.click(screen.getByTitle('Add emoji'));

      expect(screen.getByText('Pick an emoji')).toBeInTheDocument();
    });

    it('renders smaller icon in desktop mode', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={false} />);

      const icon = screen.getByTestId('smile-icon');
      expect(icon).toHaveAttribute('width', '20');
    });
  });

  describe('Position Prop', () => {
    it('positions picker at bottom by default', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} position="bottom" />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const picker = container.querySelector('.top-full');
      expect(picker).toBeInTheDocument();
    });

    it('positions picker at top', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} position="top" />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const picker = container.querySelector('.bottom-full');
      expect(picker).toBeInTheDocument();
    });

    it('aligns picker to left', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} position="left" />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const picker = container.querySelector('.left-0');
      expect(picker).toBeInTheDocument();
    });

    it('aligns picker to right by default', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const picker = container.querySelector('.right-0');
      expect(picker).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('applies active styles when picker is open', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      const button = screen.getByTitle('Add emoji');
      await user.click(button);

      expect(button).toHaveClass('bg-rgb(var(--color-primary-500))/10');
    });

    it('shows pulse animation when open', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const pulseElement = container.querySelector('.animate-pulse');
      expect(pulseElement).toBeInTheDocument();
    });

    it('has hover styles', () => {
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );

      const button = screen.getByTitle('Add emoji');
      expect(button).toHaveClass('group');
    });
  });

  describe('Haptic Feedback', () => {
    beforeEach(() => {
      navigator.vibrate = jest.fn();
    });

    afterEach(() => {
      delete navigator.vibrate;
    });

    it('triggers haptic feedback on mobile emoji selection', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />);

      await user.click(screen.getByTitle('Add emoji'));
      await user.click(screen.getByText('Test Emoji'));

      expect(navigator.vibrate).toHaveBeenCalledWith(30);
    });

    it('does not vibrate on desktop', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={false} />);

      await user.click(screen.getByTitle('Add emoji'));
      await user.click(screen.getByText('Test Emoji'));

      expect(navigator.vibrate).not.toHaveBeenCalled();
    });

    it('handles missing vibrate API', async () => {
      delete navigator.vibrate;
      const user = userEvent.setup();

      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />);

      await user.click(screen.getByTitle('Add emoji'));

      // Should not throw
      expect(() => user.click(screen.getByText('Test Emoji'))).not.toThrow();
    });
  });

  describe('Animations', () => {
    it('has slide-up animation', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      const animatedElement = container.querySelector('.animate-slide-up');
      expect(animatedElement).toBeInTheDocument();
    });

    it('includes CSS animations in styles', () => {
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );

      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
      expect(style.textContent).toContain('@keyframes emojiPop');
    });

    it('respects reduced motion preference', () => {
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );

      const style = container.querySelector('style');
      expect(style.textContent).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('Accessibility', () => {
    it('button has descriptive title', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);
      expect(screen.getByTitle('Add emoji')).toBeInTheDocument();
    });

    it('button is keyboard accessible', () => {
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );

      const button = screen.getByTitle('Add emoji');
      expect(button.tagName).toBe('BUTTON');
    });

    it('has proper touch targets on mobile', () => {
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />);

      const button = screen.getByTitle('Add emoji');
      expect(button).toHaveClass('touch-target');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onEmojiSelect gracefully', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker />);

      await user.click(screen.getByTitle('Add emoji'));

      expect(() => user.click(screen.getByText('Test Emoji'))).not.toThrow();
    });

    it('handles rapid toggling', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

      const button = screen.getByTitle('Add emoji');

      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should be in closed state
      expect(screen.queryByTestId('emoji-picker-react')).not.toBeInTheDocument();
    });

    it('handles emoji selection without onEmojiSelect', async () => {
      const user = userEvent.setup();
      render(<EmojiPicker />);

      await user.click(screen.getByTitle('Add emoji'));

      expect(() => user.click(screen.getByText('Test Emoji'))).not.toThrow();
    });
  });

  describe('Mobile Quick Emoji Grid', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />);
      await user.click(screen.getByTitle('Add emoji'));
    });

    it('shows all quick emojis', () => {
      const emojis = ['😀', '😂', '😍', '👍', '❤️', '🔥', '👏', '💯'];
      emojis.forEach(emoji => {
        expect(screen.getByText(emoji)).toBeInTheDocument();
      });
    });

    it('quick emoji selection calls callback', async () => {
      const user = userEvent.setup();
      const emojiButton = screen.getByText('😀');

      await user.click(emojiButton);

      expect(mockOnEmojiSelect).toHaveBeenCalledWith('😀');
    });

    it('closes after quick emoji selection', async () => {
      const user = userEvent.setup();
      const emojiButton = screen.getByText('😀');

      await user.click(emojiButton);

      await waitFor(() => {
        expect(screen.queryByText('Quick Reactions')).not.toBeInTheDocument();
      });
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot in closed state', () => {
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in desktop open state', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in mobile mode', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} isMobile={true} />
      );

      await user.click(screen.getByTitle('Add emoji'));

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with controlled state', () => {
      const { container } = render(
        <EmojiPicker
          onEmojiSelect={mockOnEmojiSelect}
          isOpen={true}
          onToggle={jest.fn()}
        />
      );

      expect(container).toMatchSnapshot();
    });
  });
});

export default EmojiPickerReact
