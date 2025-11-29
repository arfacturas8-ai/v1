/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageActions from './MessageActions';

describe('MessageActions', () => {
  const mockMessage = {
    id: 'msg-123',
    content: 'Test message content',
    userId: 'user-1',
    timestamp: Date.now()
  };

  const defaultProps = {
    message: mockMessage,
    isOwnMessage: false,
    onReply: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onReact: jest.fn(),
    onPin: jest.fn(),
    onCopy: jest.fn(),
    className: '',
    position: 'top-right'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders main action bar with correct styling', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const actionBar = container.querySelector('.flex.items-center');
      expect(actionBar).toBeInTheDocument();
      expect(actionBar).toHaveClass('rounded-xl');
    });

    it('renders three quick reaction buttons', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const reactionButtons = container.querySelectorAll('button span.text-lg');
      expect(reactionButtons).toHaveLength(3);
    });

    it('displays correct quick reactions emojis', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const reactionButtons = container.querySelectorAll('button span.text-lg');
      expect(reactionButtons[0]).toHaveTextContent('👍');
      expect(reactionButtons[1]).toHaveTextContent('❤️');
      expect(reactionButtons[2]).toHaveTextContent('😂');
    });

    it('renders reply button', () => {
      render(<MessageActions {...defaultProps} />);
      const replyButton = screen.getByTitle('Reply to message');
      expect(replyButton).toBeInTheDocument();
    });

    it('renders more actions button', () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');
      expect(moreButton).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <MessageActions {...defaultProps} className="custom-class" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('does not render dropdown initially', () => {
      render(<MessageActions {...defaultProps} />);
      expect(screen.queryByText('Copy Message')).not.toBeInTheDocument();
    });
  });

  describe('Position Classes', () => {
    it('applies top-right position classes by default', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('top-0', 'right-0', '-translate-y-full', 'translate-x-4');
    });

    it('applies top-left position classes', () => {
      const { container } = render(
        <MessageActions {...defaultProps} position="top-left" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('top-0', 'left-0', '-translate-y-full', '-translate-x-4');
    });

    it('applies bottom-right position classes', () => {
      const { container } = render(
        <MessageActions {...defaultProps} position="bottom-right" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bottom-0', 'right-0', 'translate-y-full', 'translate-x-4');
    });

    it('applies bottom-left position classes', () => {
      const { container } = render(
        <MessageActions {...defaultProps} position="bottom-left" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('bottom-0', 'left-0', 'translate-y-full', '-translate-x-4');
    });

    it('falls back to default position for invalid value', () => {
      const { container } = render(
        <MessageActions {...defaultProps} position="invalid" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('top-0', 'right-0', '-translate-y-full', 'translate-x-4');
    });
  });

  describe('Quick Reactions', () => {
    it('calls onReact with thumbs up emoji', async () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const thumbsUpButton = container.querySelectorAll('button span.text-lg')[0].parentElement;

      await userEvent.click(thumbsUpButton);

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-123', '👍');
    });

    it('calls onReact with heart emoji', async () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const heartButton = container.querySelectorAll('button span.text-lg')[1].parentElement;

      await userEvent.click(heartButton);

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-123', '❤️');
    });

    it('calls onReact with laugh emoji', async () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const laughButton = container.querySelectorAll('button span.text-lg')[2].parentElement;

      await userEvent.click(laughButton);

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-123', '😂');
    });

    it('has proper title attributes on quick reactions', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const buttons = container.querySelectorAll('button[title^="React with"]');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Reply Action', () => {
    it('calls onReply with message when reply button clicked', async () => {
      render(<MessageActions {...defaultProps} />);
      const replyButton = screen.getByTitle('Reply to message');

      await userEvent.click(replyButton);

      expect(defaultProps.onReply).toHaveBeenCalledWith(mockMessage);
      expect(defaultProps.onReply).toHaveBeenCalledTimes(1);
    });

    it('does not open dropdown when reply is clicked', async () => {
      render(<MessageActions {...defaultProps} />);
      const replyButton = screen.getByTitle('Reply to message');

      await userEvent.click(replyButton);

      expect(screen.queryByText('Copy Message')).not.toBeInTheDocument();
    });
  });

  describe('More Actions Dropdown', () => {
    it('opens dropdown when more actions button clicked', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      expect(screen.getByText('Copy Message')).toBeInTheDocument();
      expect(screen.getByText('Pin Message')).toBeInTheDocument();
    });

    it('closes dropdown when more actions button clicked again', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      expect(screen.getByText('Copy Message')).toBeInTheDocument();

      await userEvent.click(moreButton);
      expect(screen.queryByText('Copy Message')).not.toBeInTheDocument();
    });

    it('shows additional reactions in dropdown', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      expect(screen.getByText('React')).toBeInTheDocument();
      const { container } = render(<MessageActions {...defaultProps} />);
      await userEvent.click(screen.getAllByTitle('More actions')[1]);
      const additionalEmojis = screen.getAllByRole('button');
      const emojiButtons = additionalEmojis.filter(btn =>
        btn.textContent.match(/😮|😢|😠/)
      );
      expect(emojiButtons.length).toBeGreaterThan(0);
    });

    it('closes dropdown when clicking overlay', async () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      expect(screen.getByText('Copy Message')).toBeInTheDocument();

      const overlay = container.querySelector('.fixed.inset-0');
      fireEvent.click(overlay);

      await waitFor(() => {
        expect(screen.queryByText('Copy Message')).not.toBeInTheDocument();
      });
    });

    it('renders overlay when dropdown is open', async () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('does not render overlay when dropdown is closed', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Copy Message Action', () => {
    it('calls onCopy with message content', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const copyButton = screen.getByText('Copy Message');
      await userEvent.click(copyButton);

      expect(defaultProps.onCopy).toHaveBeenCalledWith('Test message content');
    });

    it('closes dropdown after copying', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const copyButton = screen.getByText('Copy Message');
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.queryByText('Copy Message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Pin Message Action', () => {
    it('calls onPin with message', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const pinButton = screen.getByText('Pin Message');
      await userEvent.click(pinButton);

      expect(defaultProps.onPin).toHaveBeenCalledWith(mockMessage);
    });

    it('closes dropdown after pinning', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const pinButton = screen.getByText('Pin Message');
      await userEvent.click(pinButton);

      await waitFor(() => {
        expect(screen.queryByText('Pin Message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Message Action', () => {
    it('does not show edit button when not own message', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={false} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      expect(screen.queryByText('Edit Message')).not.toBeInTheDocument();
    });

    it('shows edit button when own message', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      expect(screen.getByText('Edit Message')).toBeInTheDocument();
    });

    it('calls onEdit with message when edit clicked', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const editButton = screen.getByText('Edit Message');
      await userEvent.click(editButton);

      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockMessage);
    });

    it('closes dropdown after editing', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const editButton = screen.getByText('Edit Message');
      await userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.queryByText('Edit Message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete Message Action', () => {
    it('does not show delete button when not own message', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={false} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      expect(screen.queryByText('Delete Message')).not.toBeInTheDocument();
    });

    it('shows delete button when own message', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      expect(screen.getByText('Delete Message')).toBeInTheDocument();
    });

    it('calls onDelete with message when delete clicked', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const deleteButton = screen.getByText('Delete Message');
      await userEvent.click(deleteButton);

      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockMessage);
    });

    it('closes dropdown after deleting', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const deleteButton = screen.getByText('Delete Message');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Message')).not.toBeInTheDocument();
      });
    });

    it('displays delete button with error styling', async () => {
      const { container } = render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const deleteButton = screen.getByText('Delete Message');

      expect(deleteButton.parentElement).toHaveClass('hover:text-error');
    });
  });

  describe('Additional Reactions in Dropdown', () => {
    it('renders additional emoji reactions', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      const { container } = render(<MessageActions {...defaultProps} />);
      await userEvent.click(screen.getAllByTitle('More actions')[1]);
      const emojiSection = screen.getByText('React').parentElement;
      expect(emojiSection).toBeInTheDocument();
    });

    it('calls onReact when additional emoji clicked', async () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      const surprisedButton = screen.getByTitle('React with Surprised');
      await userEvent.click(surprisedButton);

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-123', '😮');
    });

    it('calls onReact for sad emoji', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      const sadButton = screen.getByTitle('React with Sad');
      await userEvent.click(sadButton);

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-123', '😢');
    });

    it('calls onReact for angry emoji', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      const angryButton = screen.getByTitle('React with Angry');
      await userEvent.click(angryButton);

      expect(defaultProps.onReact).toHaveBeenCalledWith('msg-123', '😠');
    });

    it('closes dropdown after additional reaction', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      const surprisedButton = screen.getByTitle('React with Surprised');
      await userEvent.click(surprisedButton);

      await waitFor(() => {
        expect(screen.queryByText('React')).not.toBeInTheDocument();
      });
    });
  });

  describe('Permissions and Ownership', () => {
    it('shows both edit and delete for own message', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      expect(screen.getByText('Edit Message')).toBeInTheDocument();
      expect(screen.getByText('Delete Message')).toBeInTheDocument();
    });

    it('shows divider before own message actions', async () => {
      const { container } = render(<MessageActions {...defaultProps} isOwnMessage={true} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      const dividers = container.querySelectorAll('.border-t');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('does not show divider when not own message', async () => {
      render(<MessageActions {...defaultProps} isOwnMessage={false} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);

      expect(screen.queryByText('Edit Message')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete Message')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional props gracefully', () => {
      const minimalProps = {
        message: mockMessage,
        isOwnMessage: false,
        onReply: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onReact: jest.fn(),
        onPin: jest.fn(),
        onCopy: jest.fn()
      };

      expect(() => render(<MessageActions {...minimalProps} />)).not.toThrow();
    });

    it('handles message with empty content', async () => {
      const emptyMessage = { ...mockMessage, content: '' };
      render(<MessageActions {...defaultProps} message={emptyMessage} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      const copyButton = screen.getByText('Copy Message');
      await userEvent.click(copyButton);

      expect(defaultProps.onCopy).toHaveBeenCalledWith('');
    });

    it('handles message with no id', () => {
      const noIdMessage = { content: 'Test', userId: 'user-1' };
      expect(() =>
        render(<MessageActions {...defaultProps} message={noIdMessage} />)
      ).not.toThrow();
    });

    it('handles rapid button clicks', async () => {
      render(<MessageActions {...defaultProps} />);
      const replyButton = screen.getByTitle('Reply to message');

      await userEvent.click(replyButton);
      await userEvent.click(replyButton);
      await userEvent.click(replyButton);

      expect(defaultProps.onReply).toHaveBeenCalledTimes(3);
    });

    it('handles rapid dropdown toggle', async () => {
      render(<MessageActions {...defaultProps} />);
      const moreButton = screen.getByTitle('More actions');

      await userEvent.click(moreButton);
      await userEvent.click(moreButton);
      await userEvent.click(moreButton);

      expect(screen.getByText('Copy Message')).toBeInTheDocument();
    });
  });

  describe('Styling and Animation', () => {
    it('applies backdrop blur styling', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const actionBar = container.querySelector('.backdrop-blur-sm');
      expect(actionBar).toBeInTheDocument();
    });

    it('applies shadow styling', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const actionBar = container.querySelector('.shadow-xl');
      expect(actionBar).toBeInTheDocument();
    });

    it('includes animation styles', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const style = container.querySelector('style');
      expect(style?.textContent).toContain('@keyframes actionPop');
    });

    it('applies z-index for proper layering', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('z-10');
    });

    it('applies absolute positioning', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('absolute');
    });
  });

  describe('Interaction States', () => {
    it('applies hover state classes to buttons', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.className).toContain('hover:');
      });
    });

    it('shows transition classes on interactive elements', () => {
      const { container } = render(<MessageActions {...defaultProps} />);
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.className).toContain('transition');
      });
    });
  });
});

export default mockMessage
