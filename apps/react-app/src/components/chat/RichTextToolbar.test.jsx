/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RichTextToolbar from './RichTextToolbar';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bold: ({ size }) => <span data-testid="bold-icon" data-size={size}>Bold</span>,
  Italic: ({ size }) => <span data-testid="italic-icon" data-size={size}>Italic</span>,
  Underline: ({ size }) => <span data-testid="underline-icon" data-size={size}>Underline</span>,
  Code: ({ size }) => <span data-testid="code-icon" data-size={size}>Code</span>,
  Link: ({ size }) => <span data-testid="link-icon" data-size={size}>Link</span>,
  AtSign: ({ size }) => <span data-testid="atsign-icon" data-size={size}>AtSign</span>,
  Hash: ({ size }) => <span data-testid="hash-icon" data-size={size}>Hash</span>,
  Quote: ({ size }) => <span data-testid="quote-icon" data-size={size}>Quote</span>,
}));

describe('RichTextToolbar', () => {
  const defaultProps = {
    onFormat: jest.fn(),
    isMobile: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders toolbar container with correct classes', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} />);
      const toolbar = container.firstChild;
      expect(toolbar).toHaveClass('flex', 'items-center', 'gap-1', 'p-2');
    });

    it('renders all format buttons', () => {
      render(<RichTextToolbar {...defaultProps} />);

      expect(screen.getByTestId('bold-icon')).toBeInTheDocument();
      expect(screen.getByTestId('italic-icon')).toBeInTheDocument();
      expect(screen.getByTestId('underline-icon')).toBeInTheDocument();
      expect(screen.getByTestId('code-icon')).toBeInTheDocument();
      expect(screen.getByTestId('quote-icon')).toBeInTheDocument();
      expect(screen.getByTestId('link-icon')).toBeInTheDocument();
      expect(screen.getByTestId('atsign-icon')).toBeInTheDocument();
      expect(screen.getByTestId('hash-icon')).toBeInTheDocument();
    });

    it('renders code block button', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const codeBlockButton = screen.getByTitle(/Code Block/);
      expect(codeBlockButton).toBeInTheDocument();
    });

    it('renders with correct inline styles', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} />);
      const toolbar = container.firstChild;
      expect(toolbar).toHaveStyle({
        background: 'rgba(21, 21, 23, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.06)',
      });
    });

    it('returns null when isMobile is true', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} isMobile={true} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders separators after specific button groups', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} />);
      const separators = container.querySelectorAll('.w-px.h-6');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Format Buttons - Bold', () => {
    it('renders bold button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      expect(boldButton).toBeInTheDocument();
    });

    it('calls onFormat with bold action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      fireEvent.click(boldButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
      expect(onFormat).toHaveBeenCalledWith(expect.any(Function));
    });

    it('bold action wraps text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      fireEvent.click(boldButton);

      const boldAction = onFormat.mock.calls[0][0];
      expect(boldAction('selected text')).toBe('**selected text**');
    });

    it('bold action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      fireEvent.click(boldButton);

      const boldAction = onFormat.mock.calls[0][0];
      expect(boldAction()).toBe('**bold text**');
    });

    it('bold button prevents default event behavior', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
      fireEvent.click(boldButton, event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Format Buttons - Italic', () => {
    it('renders italic button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const italicButton = screen.getByTitle('Italic (Ctrl+I)');
      expect(italicButton).toBeInTheDocument();
    });

    it('calls onFormat with italic action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const italicButton = screen.getByTitle('Italic (Ctrl+I)');
      fireEvent.click(italicButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
    });

    it('italic action wraps text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const italicButton = screen.getByTitle('Italic (Ctrl+I)');
      fireEvent.click(italicButton);

      const italicAction = onFormat.mock.calls[0][0];
      expect(italicAction('selected text')).toBe('*selected text*');
    });

    it('italic action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const italicButton = screen.getByTitle('Italic (Ctrl+I)');
      fireEvent.click(italicButton);

      const italicAction = onFormat.mock.calls[0][0];
      expect(italicAction()).toBe('*italic text*');
    });
  });

  describe('Format Buttons - Underline', () => {
    it('renders underline button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const underlineButton = screen.getByTitle('Underline (Ctrl+U)');
      expect(underlineButton).toBeInTheDocument();
    });

    it('calls onFormat with underline action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const underlineButton = screen.getByTitle('Underline (Ctrl+U)');
      fireEvent.click(underlineButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
    });

    it('underline action wraps text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const underlineButton = screen.getByTitle('Underline (Ctrl+U)');
      fireEvent.click(underlineButton);

      const underlineAction = onFormat.mock.calls[0][0];
      expect(underlineAction('selected text')).toBe('__selected text__');
    });

    it('underline action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const underlineButton = screen.getByTitle('Underline (Ctrl+U)');
      fireEvent.click(underlineButton);

      const underlineAction = onFormat.mock.calls[0][0];
      expect(underlineAction()).toBe('__underlined text__');
    });
  });

  describe('Format Buttons - Inline Code', () => {
    it('renders inline code button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const codeButton = screen.getByTitle('Inline Code (Ctrl+`)');
      expect(codeButton).toBeInTheDocument();
    });

    it('calls onFormat with code action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const codeButton = screen.getByTitle('Inline Code (Ctrl+`)');
      fireEvent.click(codeButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
    });

    it('code action wraps text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const codeButton = screen.getByTitle('Inline Code (Ctrl+`)');
      fireEvent.click(codeButton);

      const codeAction = onFormat.mock.calls[0][0];
      expect(codeAction('selected text')).toBe('`selected text`');
    });

    it('code action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const codeButton = screen.getByTitle('Inline Code (Ctrl+`)');
      fireEvent.click(codeButton);

      const codeAction = onFormat.mock.calls[0][0];
      expect(codeAction()).toBe('`code`');
    });
  });

  describe('Format Buttons - Quote', () => {
    it('renders quote button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const quoteButton = screen.getByTitle('Quote (Ctrl+Shift+.)');
      expect(quoteButton).toBeInTheDocument();
    });

    it('calls onFormat with quote action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const quoteButton = screen.getByTitle('Quote (Ctrl+Shift+.)');
      fireEvent.click(quoteButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
    });

    it('quote action formats text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const quoteButton = screen.getByTitle('Quote (Ctrl+Shift+.)');
      fireEvent.click(quoteButton);

      const quoteAction = onFormat.mock.calls[0][0];
      expect(quoteAction('selected text')).toBe('> selected text');
    });

    it('quote action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const quoteButton = screen.getByTitle('Quote (Ctrl+Shift+.)');
      fireEvent.click(quoteButton);

      const quoteAction = onFormat.mock.calls[0][0];
      expect(quoteAction()).toBe('> quoted text');
    });
  });

  describe('Format Buttons - Link', () => {
    it('renders link button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const linkButton = screen.getByTitle('Link (Ctrl+K)');
      expect(linkButton).toBeInTheDocument();
    });

    it('calls onFormat with link action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const linkButton = screen.getByTitle('Link (Ctrl+K)');
      fireEvent.click(linkButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
    });

    it('link action formats text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const linkButton = screen.getByTitle('Link (Ctrl+K)');
      fireEvent.click(linkButton);

      const linkAction = onFormat.mock.calls[0][0];
      expect(linkAction('selected text')).toBe('[selected text](url)');
    });

    it('link action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const linkButton = screen.getByTitle('Link (Ctrl+K)');
      fireEvent.click(linkButton);

      const linkAction = onFormat.mock.calls[0][0];
      expect(linkAction()).toBe('[link text](url)');
    });
  });

  describe('Format Buttons - Mention', () => {
    it('renders mention button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const mentionButton = screen.getByTitle('Mention (@)');
      expect(mentionButton).toBeInTheDocument();
    });

    it('calls onFormat with mention action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const mentionButton = screen.getByTitle('Mention (@)');
      fireEvent.click(mentionButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
    });

    it('mention action formats text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const mentionButton = screen.getByTitle('Mention (@)');
      fireEvent.click(mentionButton);

      const mentionAction = onFormat.mock.calls[0][0];
      expect(mentionAction('john')).toBe('@john');
    });

    it('mention action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const mentionButton = screen.getByTitle('Mention (@)');
      fireEvent.click(mentionButton);

      const mentionAction = onFormat.mock.calls[0][0];
      expect(mentionAction()).toBe('@username');
    });
  });

  describe('Format Buttons - Channel', () => {
    it('renders channel button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const channelButton = screen.getByTitle('Channel (#)');
      expect(channelButton).toBeInTheDocument();
    });

    it('calls onFormat with channel action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const channelButton = screen.getByTitle('Channel (#)');
      fireEvent.click(channelButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
    });

    it('channel action formats text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const channelButton = screen.getByTitle('Channel (#)');
      fireEvent.click(channelButton);

      const channelAction = onFormat.mock.calls[0][0];
      expect(channelAction('general')).toBe('#general');
    });

    it('channel action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const channelButton = screen.getByTitle('Channel (#)');
      fireEvent.click(channelButton);

      const channelAction = onFormat.mock.calls[0][0];
      expect(channelAction()).toBe('#channel');
    });
  });

  describe('Format Buttons - Code Block', () => {
    it('renders code block button with correct title', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const codeBlockButton = screen.getByTitle('Code Block (Ctrl+Shift+`)');
      expect(codeBlockButton).toBeInTheDocument();
    });

    it('calls onFormat with code block action when clicked', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const codeBlockButton = screen.getByTitle('Code Block (Ctrl+Shift+`)');
      fireEvent.click(codeBlockButton);

      expect(onFormat).toHaveBeenCalledTimes(1);
    });

    it('code block action formats text correctly with selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const codeBlockButton = screen.getByTitle('Code Block (Ctrl+Shift+`)');
      fireEvent.click(codeBlockButton);

      const codeBlockAction = onFormat.mock.calls[0][0];
      expect(codeBlockAction('function test() {}')).toBe('```\nfunction test() {}\n```');
    });

    it('code block action provides default text when no selection', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const codeBlockButton = screen.getByTitle('Code Block (Ctrl+Shift+`)');
      fireEvent.click(codeBlockButton);

      const codeBlockAction = onFormat.mock.calls[0][0];
      expect(codeBlockAction()).toBe('```\ncode block\n```');
    });

    it('code block button prevents default event behavior', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const codeBlockButton = screen.getByTitle('Code Block (Ctrl+Shift+`)');
      const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
      fireEvent.click(codeBlockButton, mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('code block button has correct visual structure', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const codeBlockButton = screen.getByTitle('Code Block (Ctrl+Shift+`)');

      const codeBlockDiv = codeBlockButton.querySelector('.flex.flex-col.items-center');
      expect(codeBlockDiv).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('all buttons have type="button" attribute', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('buttons stop event propagation', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      };

      fireEvent.click(boldButton, mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('handles multiple sequential button clicks', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      const italicButton = screen.getByTitle('Italic (Ctrl+I)');

      fireEvent.click(boldButton);
      fireEvent.click(italicButton);
      fireEvent.click(boldButton);

      expect(onFormat).toHaveBeenCalledTimes(3);
    });

    it('does not call onFormat when onFormat is undefined', () => {
      render(<RichTextToolbar isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      expect(() => fireEvent.click(boldButton)).not.toThrow();
    });

    it('does not call onFormat when onFormat is null', () => {
      render(<RichTextToolbar onFormat={null} isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      expect(() => fireEvent.click(boldButton)).not.toThrow();
    });
  });

  describe('Tooltips', () => {
    it('renders tooltips for all format buttons', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} />);
      const tooltips = container.querySelectorAll('.absolute.bottom-full');

      // 8 format buttons + 1 code block button = 9 tooltips
      expect(tooltips.length).toBe(9);
    });

    it('tooltip shows label and shortcut for bold button', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} />);
      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      const tooltip = boldButton.querySelector('.absolute.bottom-full');

      expect(tooltip).toBeInTheDocument();
      expect(tooltip.textContent).toContain('Bold');
      expect(tooltip.textContent).toContain('Ctrl+B');
    });

    it('tooltip has pointer-events-none class', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} />);
      const tooltips = container.querySelectorAll('.absolute.bottom-full');

      tooltips.forEach(tooltip => {
        expect(tooltip).toHaveClass('pointer-events-none');
      });
    });

    it('tooltips have opacity-0 by default', () => {
      const { container } = render(<RichTextToolbar {...defaultProps} />);
      const tooltips = container.querySelectorAll('.absolute.bottom-full');

      tooltips.forEach(tooltip => {
        expect(tooltip).toHaveClass('opacity-0');
      });
    });
  });

  describe('Button Styling', () => {
    it('all buttons have hover effects', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveClass('hover:bg-elevated');
      });
    });

    it('all buttons have transition classes', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveClass('transition-all');
      });
    });

    it('all buttons have rounded corners', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveClass('rounded-lg');
      });
    });

    it('all buttons have group class for hover effects', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveClass('group');
      });
    });
  });

  describe('Icons', () => {
    it('all icons render with size 16', () => {
      render(<RichTextToolbar {...defaultProps} />);

      expect(screen.getByTestId('bold-icon')).toHaveAttribute('data-size', '16');
      expect(screen.getByTestId('italic-icon')).toHaveAttribute('data-size', '16');
      expect(screen.getByTestId('underline-icon')).toHaveAttribute('data-size', '16');
      expect(screen.getByTestId('code-icon')).toHaveAttribute('data-size', '16');
      expect(screen.getByTestId('quote-icon')).toHaveAttribute('data-size', '16');
      expect(screen.getByTestId('link-icon')).toHaveAttribute('data-size', '16');
      expect(screen.getByTestId('atsign-icon')).toHaveAttribute('data-size', '16');
      expect(screen.getByTestId('hash-icon')).toHaveAttribute('data-size', '16');
    });
  });

  describe('Mobile Behavior', () => {
    it('does not render when isMobile is true', () => {
      const { container } = render(<RichTextToolbar onFormat={jest.fn()} isMobile={true} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when isMobile is false', () => {
      const { container } = render(<RichTextToolbar onFormat={jest.fn()} isMobile={false} />);
      expect(container.firstChild).not.toBeNull();
    });

    it('renders when isMobile is undefined', () => {
      const { container } = render(<RichTextToolbar onFormat={jest.fn()} />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing props gracefully', () => {
      expect(() => render(<RichTextToolbar />)).not.toThrow();
    });

    it('handles undefined onFormat prop', () => {
      const { container } = render(<RichTextToolbar isMobile={false} />);
      expect(container).toBeInTheDocument();
    });

    it('handles clicks when onFormat is not a function', () => {
      render(<RichTextToolbar onFormat="not a function" isMobile={false} />);
      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      expect(() => fireEvent.click(boldButton)).not.toThrow();
    });

    it('handles empty string selection in format actions', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      fireEvent.click(boldButton);

      const boldAction = onFormat.mock.calls[0][0];
      expect(boldAction('')).toBe('**bold text**');
    });

    it('handles whitespace-only selection in format actions', () => {
      const onFormat = jest.fn();
      render(<RichTextToolbar onFormat={onFormat} isMobile={false} />);

      const italicButton = screen.getByTitle('Italic (Ctrl+I)');
      fireEvent.click(italicButton);

      const italicAction = onFormat.mock.calls[0][0];
      expect(italicAction('   ')).toBe('*   *');
    });
  });

  describe('Accessibility', () => {
    it('all buttons have title attributes for accessibility', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button).toHaveAttribute('title');
      });
    });

    it('buttons are keyboard accessible', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('maintains proper button semantics', () => {
      render(<RichTextToolbar {...defaultProps} />);
      const buttons = screen.getAllByRole('button');

      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});

export default defaultProps
