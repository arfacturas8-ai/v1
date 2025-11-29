import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageActions from './MessageActions';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MoreHorizontal: (props) => <div data-testid="more-horizontal-icon" {...props} />,
  Edit: (props) => <div data-testid="edit-icon" {...props} />,
  Trash2: (props) => <div data-testid="trash2-icon" {...props} />,
  Reply: (props) => <div data-testid="reply-icon" {...props} />,
  Smile: (props) => <div data-testid="smile-icon" {...props} />,
  Copy: (props) => <div data-testid="copy-icon" {...props} />,
  Pin: (props) => <div data-testid="pin-icon" {...props} />,
}));

// Mock EmojiPicker
jest.mock('./EmojiPicker', () => {
  return function MockEmojiPicker({ onEmojiSelect }) {
    return (
      <div data-testid="emoji-picker">
        <button onClick={() => onEmojiSelect('😀')}>😀</button>
        <button onClick={() => onEmojiSelect('😂')}>😂</button>
      </div>
    );
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

const mockMessage = {
  id: 'msg1',
  content: 'Test message content',
  author: 'testuser',
  timestamp: new Date().toISOString(),
};

describe('MessageActions', () => {
  let mockOnEdit;
  let mockOnDelete;
  let mockOnReply;
  let mockOnReact;
  let mockOnCopy;
  let mockOnPin;

  beforeEach(() => {
    mockOnEdit = jest.fn();
    mockOnDelete = jest.fn();
    mockOnReply = jest.fn();
    mockOnReact = jest.fn();
    mockOnCopy = jest.fn();
    mockOnPin = jest.fn();
    navigator.clipboard.writeText.mockClear();
  });

  describe('Rendering', () => {
    it('renders quick action buttons', () => {
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByTestId('smile-icon')).toBeInTheDocument();
      expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
      expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('matches snapshot', () => {
      const { container } = render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Quick Reactions', () => {
    it('triggers thumbs up reaction', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByText('👍'));

      expect(mockOnReact).toHaveBeenCalledWith(mockMessage.id, '👍');
    });

    it('triggers heart reaction', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByText('❤️'));

      expect(mockOnReact).toHaveBeenCalledWith(mockMessage.id, '❤️');
    });

    it('opens emoji picker on smile button click', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('smile-icon').closest('button'));

      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    });

    it('closes emoji picker on second click', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      const smileButton = screen.getByTestId('smile-icon').closest('button');
      await user.click(smileButton);
      expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();

      await user.click(smileButton);
      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    });

    it('triggers reaction from emoji picker', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('smile-icon').closest('button'));
      await user.click(screen.getByText('😀'));

      expect(mockOnReact).toHaveBeenCalledWith(mockMessage.id, '😀');
    });

    it('closes emoji picker after selecting emoji', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('smile-icon').closest('button'));
      await user.click(screen.getByText('😀'));

      expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    });
  });

  describe('Reply Action', () => {
    it('triggers reply from quick actions', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('reply-icon').closest('button'));

      expect(mockOnReply).toHaveBeenCalledWith(mockMessage);
    });

    it('triggers reply from context menu', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Reply'));

      expect(mockOnReply).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('Context Menu', () => {
    it('opens context menu on more button click', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      expect(screen.getByText('Reply')).toBeInTheDocument();
      expect(screen.getByText('Copy Message')).toBeInTheDocument();
    });

    it('closes context menu on second click', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      const moreButton = screen.getByTestId('more-horizontal-icon').closest('button');
      await user.click(moreButton);
      expect(screen.getByText('Reply')).toBeInTheDocument();

      await user.click(moreButton);
      expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    });

    it('shows edit and delete for own messages', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      expect(screen.getByText('Edit Message')).toBeInTheDocument();
      expect(screen.getByText('Delete Message')).toBeInTheDocument();
    });

    it('does not show edit and delete for others messages', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      expect(screen.queryByText('Edit Message')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete Message')).not.toBeInTheDocument();
    });

    it('shows pin option for others messages', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
          onPin={mockOnPin}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      expect(screen.getByText('Pin Message')).toBeInTheDocument();
    });

    it('does not show pin option for own messages', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
          onPin={mockOnPin}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      expect(screen.queryByText('Pin Message')).not.toBeInTheDocument();
    });

    it('closes menu after selecting an action', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Reply'));

      expect(screen.queryByText('Copy Message')).not.toBeInTheDocument();
    });
  });

  describe('Copy Action', () => {
    it('copies message to clipboard', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
          onCopy={mockOnCopy}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Copy Message'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockMessage.content);
    });

    it('calls onCopy callback if provided', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
          onCopy={mockOnCopy}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Copy Message'));

      expect(mockOnCopy).toHaveBeenCalled();
    });

    it('does not fail if onCopy not provided', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Copy Message'));

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Edit Action', () => {
    it('triggers edit for own message', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Edit Message'));

      expect(mockOnEdit).toHaveBeenCalledWith(mockMessage);
    });

    it('closes menu after edit', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Edit Message'));

      expect(screen.queryByText('Edit Message')).not.toBeInTheDocument();
    });
  });

  describe('Delete Action', () => {
    it('triggers delete for own message', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Delete Message'));

      expect(mockOnDelete).toHaveBeenCalledWith(mockMessage.id);
    });

    it('closes menu after delete', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Delete Message'));

      expect(screen.queryByText('Delete Message')).not.toBeInTheDocument();
    });

    it('displays delete with red styling', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      const deleteButton = screen.getByText('Delete Message').closest('button');
      expect(deleteButton).toHaveClass('text-red-400');
    });
  });

  describe('Pin Action', () => {
    it('triggers pin for others message', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
          onPin={mockOnPin}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Pin Message'));

      expect(mockOnPin).toHaveBeenCalledWith(mockMessage.id);
    });
  });

  describe('Click Outside', () => {
    it('closes menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <MessageActions
            message={mockMessage}
            isOwnMessage={true}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onReply={mockOnReply}
            onReact={mockOnReact}
          />
          <div data-testid="outside">Outside</div>
        </div>
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      expect(screen.getByText('Reply')).toBeInTheDocument();

      await user.click(screen.getByTestId('outside'));

      await waitFor(() => {
        expect(screen.queryByText('Reply')).not.toBeInTheDocument();
      });
    });

    it('does not close menu when clicking inside', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      const menu = screen.getByText('Reply').closest('div');
      fireEvent.mouseDown(menu);

      expect(screen.getByText('Reply')).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', async () => {
      const { unmount } = render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Icons Display', () => {
    it('displays all quick action icons', () => {
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      expect(screen.getByTestId('smile-icon')).toBeInTheDocument();
      expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
      expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();
    });

    it('displays context menu icons', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash2-icon')).toBeInTheDocument();
    });

    it('displays pin icon for others message', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
          onPin={mockOnPin}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));

      expect(screen.getByTestId('pin-icon')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles message with no content', async () => {
      const user = userEvent.setup();
      const emptyMessage = { ...mockMessage, content: '' };

      render(
        <MessageActions
          message={emptyMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Copy Message'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    });

    it('handles very long message content', async () => {
      const user = userEvent.setup();
      const longMessage = { ...mockMessage, content: 'a'.repeat(10000) };

      render(
        <MessageActions
          message={longMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('more-horizontal-icon').closest('button'));
      await user.click(screen.getByText('Copy Message'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(longMessage.content);
    });

    it('handles rapid menu toggling', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={true}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      const moreButton = screen.getByTestId('more-horizontal-icon').closest('button');

      await user.click(moreButton);
      await user.click(moreButton);
      await user.click(moreButton);
      await user.click(moreButton);

      // Should be open after 4 clicks
      expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    });

    it('handles multiple emoji selections', async () => {
      const user = userEvent.setup();
      render(
        <MessageActions
          message={mockMessage}
          isOwnMessage={false}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onReply={mockOnReply}
          onReact={mockOnReact}
        />
      );

      await user.click(screen.getByTestId('smile-icon').closest('button'));
      await user.click(screen.getByText('😀'));

      await user.click(screen.getByTestId('smile-icon').closest('button'));
      await user.click(screen.getByText('😂'));

      expect(mockOnReact).toHaveBeenCalledTimes(2);
      expect(mockOnReact).toHaveBeenNthCalledWith(1, mockMessage.id, '😀');
      expect(mockOnReact).toHaveBeenNthCalledWith(2, mockMessage.id, '😂');
    });
  });
});

export default MockEmojiPicker
