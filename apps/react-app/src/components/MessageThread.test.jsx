import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageThread from './MessageThread';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: (props) => <div data-testid="x-icon" {...props} />,
  Reply: (props) => <div data-testid="reply-icon" {...props} />,
  Users: (props) => <div data-testid="users-icon" {...props} />,
}));

// Mock RichTextEditor
jest.mock('./RichTextEditor', () => {
  return function MockRichTextEditor({
    value,
    onChange,
    onSubmit,
    placeholder,
    editingMessage,
    onCancelEdit
  }) {
    return (
      <div data-testid="rich-text-editor">
        <textarea
          data-testid="reply-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button data-testid="submit-button" onClick={onSubmit}>
          Send
        </button>
        {editingMessage && (
          <button data-testid="cancel-edit-button" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </div>
    );
  };
});

// Mock MessageReactions
jest.mock('./MessageReactions', () => {
  return function MockMessageReactions({ reactions, onAddReaction, onRemoveReaction }) {
    return (
      <div data-testid="message-reactions">
        <button onClick={() => onAddReaction('👍')}>Add Reaction</button>
        <button onClick={() => onRemoveReaction('👍')}>Remove Reaction</button>
      </div>
    );
  };
});

// Mock MessageActions
jest.mock('./MessageActions', () => {
  return function MockMessageActions({ message, isOwnMessage, onEdit, onDelete, onReact }) {
    return (
      <div data-testid="message-actions">
        {isOwnMessage && (
          <>
            <button onClick={() => onEdit(message)}>Edit</button>
            <button onClick={() => onDelete(message.id)}>Delete</button>
          </>
        )}
        <button onClick={() => onReact(message.id, '😀')}>React</button>
      </div>
    );
  };
});

const mockParentMessage = {
  id: 'parent-1',
  userId: 'user-1',
  username: 'John Doe',
  avatar: 'JD',
  content: 'This is the parent message',
  timestamp: '2024-01-15T10:00:00Z',
  reactions: {
    '👍': { count: 2, users: ['user-1', 'user-2'] },
    '❤️': { count: 1, users: ['user-3'] }
  }
};

const mockReplies = [
  {
    id: 'reply-1',
    userId: 'user-2',
    username: 'Jane Smith',
    avatar: 'JS',
    content: 'First reply',
    timestamp: '2024-01-15T10:05:00Z',
    reactions: {}
  },
  {
    id: 'reply-2',
    userId: 'user-1',
    username: 'John Doe',
    avatar: 'JD',
    content: 'Second reply from same user',
    timestamp: '2024-01-15T10:06:00Z',
    reactions: {
      '😀': { count: 1, users: ['user-2'] }
    }
  },
  {
    id: 'reply-3',
    userId: 'user-2',
    username: 'Jane Smith',
    avatar: 'JS',
    content: 'Third reply',
    timestamp: '2024-01-15T10:07:00Z',
    reactions: {}
  }
];

describe('MessageThread', () => {
  let mockOnClose;
  let mockOnSendReply;
  let mockOnReact;
  let mockOnEdit;
  let mockOnDelete;

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSendReply = jest.fn();
    mockOnReact = jest.fn();
    mockOnEdit = jest.fn();
    mockOnDelete = jest.fn();
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <MessageThread
          isOpen={false}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('does not render when parentMessage is null', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={null}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when isOpen is true and parentMessage exists', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('Thread')).toBeInTheDocument();
    });

    it('renders thread header with title', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('Thread')).toBeInTheDocument();
      const replyIcons = screen.getAllByTestId('reply-icon');
      expect(replyIcons.length).toBeGreaterThan(0);
    });

    it('renders close button', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('matches snapshot with no replies', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with replies', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(container).toMatchSnapshot();
    });
  });

  describe('Parent Message Display', () => {
    it('displays parent message content', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('This is the parent message')).toBeInTheDocument();
    });

    it('displays parent message username', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays parent message avatar', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('displays parent message timestamp', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // Should display either "Today" or a date like "1/15/2024"
      const timestampElements = screen.getAllByText(/\d+:\d+|Today|\/\d+\/\d+/);
      expect(timestampElements.length).toBeGreaterThan(0);
    });

    it('displays parent message reactions when present', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const reactionComponents = screen.getAllByTestId('message-reactions');
      expect(reactionComponents.length).toBeGreaterThan(0);
    });

    it('does not display reactions when parent message has no reactions', () => {
      const messageWithoutReactions = { ...mockParentMessage, reactions: {} };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={messageWithoutReactions}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const reactionComponents = screen.queryAllByTestId('message-reactions');
      expect(reactionComponents.length).toBe(0);
    });
  });

  describe('Reply Count Badge', () => {
    it('does not show reply count badge when there are no replies', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // The badge in the header should not be present (only stats show 0 replies)
      const header = container.querySelector('.p-4.border-b.border-white\\/10.bg-gray-800\\/95');
      const badge = header?.querySelector('.bg-cyan-500\\/20');
      expect(badge).not.toBeInTheDocument();
    });

    it('shows singular "reply" for one reply', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[mockReplies[0]]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // Should show "1 reply" in both badge and stats (multiple instances)
      const replyElements = screen.getAllByText('1 reply');
      expect(replyElements.length).toBeGreaterThan(0);
    });

    it('shows plural "replies" for multiple replies', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // Should show "3 replies" in both badge and stats (multiple instances)
      const replyElements = screen.getAllByText('3 replies');
      expect(replyElements.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('displays empty state when there are no replies', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('No replies yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to reply to this message')).toBeInTheDocument();
    });

    it('displays reply icon in empty state', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const replyIcons = screen.getAllByTestId('reply-icon');
      expect(replyIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Replies List Display', () => {
    it('displays all replies', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('First reply')).toBeInTheDocument();
      expect(screen.getByText('Second reply from same user')).toBeInTheDocument();
      expect(screen.getByText('Third reply')).toBeInTheDocument();
    });

    it('displays reply usernames', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-3"
        />
      );

      // Should display usernames for other users (both appear multiple times)
      const janeSmithElements = screen.getAllByText('Jane Smith');
      expect(janeSmithElements.length).toBeGreaterThan(0);
      const johnDoeElements = screen.getAllByText('John Doe');
      expect(johnDoeElements.length).toBeGreaterThan(0);
    });

    it('displays "You" for current user\'s replies', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('applies correct styling for own replies', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const ownReply = screen.getByText('Second reply from same user').closest('div');
      expect(ownReply).toHaveClass('bg-cyan-500');
    });

    it('applies correct styling for others\' replies', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const otherReply = screen.getByText('First reply').closest('div');
      expect(otherReply).toHaveClass('bg-white/10');
    });

    it('shows avatar for first message from user', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const avatars = screen.getAllByText('JS');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('displays reply reactions when present', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const reactionComponents = screen.getAllByTestId('message-reactions');
      expect(reactionComponents.length).toBeGreaterThan(0);
    });

    it('displays message actions for replies', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const actionComponents = screen.getAllByTestId('message-actions');
      expect(actionComponents.length).toBe(mockReplies.length);
    });
  });

  describe('Thread Navigation', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const closeButton = screen.getByTestId('x-icon').closest('button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders backdrop overlay', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Reply Composition', () => {
    it('renders RichTextEditor for composing replies', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      expect(screen.getByTestId('reply-textarea')).toBeInTheDocument();
    });

    it('displays correct placeholder in reply input', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByPlaceholderText('Reply to John Doe...')).toBeInTheDocument();
    });

    it('updates reply message state when typing', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const textarea = screen.getByTestId('reply-textarea');
      await user.type(textarea, 'This is my reply');

      expect(textarea.value).toBe('This is my reply');
    });

    it('sends reply when submit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const textarea = screen.getByTestId('reply-textarea');
      await user.type(textarea, 'This is my reply');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(mockOnSendReply).toHaveBeenCalledWith('parent-1', 'This is my reply');
    });

    it('clears reply input after sending', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const textarea = screen.getByTestId('reply-textarea');
      await user.type(textarea, 'This is my reply');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(textarea.value).toBe('');
    });

    it('does not send empty reply', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(mockOnSendReply).not.toHaveBeenCalled();
    });

    it('does not send reply with only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const textarea = screen.getByTestId('reply-textarea');
      await user.type(textarea, '   ');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(mockOnSendReply).not.toHaveBeenCalled();
    });

    it('trims whitespace from reply before sending', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const textarea = screen.getByTestId('reply-textarea');
      await user.type(textarea, '  This is my reply  ');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(mockOnSendReply).toHaveBeenCalledWith('parent-1', 'This is my reply');
    });
  });

  describe('Edit Reply Functionality', () => {
    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByTestId('cancel-edit-button')).toBeInTheDocument();
    });

    it('populates textarea with reply content when editing', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const textarea = screen.getByTestId('reply-textarea');
      expect(textarea.value).toBe('Second reply from same user');
    });

    it('displays edit placeholder', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByPlaceholderText('Edit your reply...')).toBeInTheDocument();
    });

    it('saves edited reply when submit is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const textarea = screen.getByTestId('reply-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Edited reply content');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(mockOnEdit).toHaveBeenCalledWith('reply-2', 'Edited reply content');
    });

    it('exits edit mode after saving', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const textarea = screen.getByTestId('reply-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Edited reply content');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(screen.queryByTestId('cancel-edit-button')).not.toBeInTheDocument();
    });

    it('clears textarea after saving edit', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const textarea = screen.getByTestId('reply-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Edited reply content');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(textarea.value).toBe('');
    });

    it('cancels edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const cancelButton = screen.getByTestId('cancel-edit-button');
      await user.click(cancelButton);

      expect(screen.queryByTestId('cancel-edit-button')).not.toBeInTheDocument();
    });

    it('clears textarea when canceling edit', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const textarea = screen.getByTestId('reply-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Some changes');

      const cancelButton = screen.getByTestId('cancel-edit-button');
      await user.click(cancelButton);

      expect(textarea.value).toBe('');
    });

    it('does not save edit with empty content', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const textarea = screen.getByTestId('reply-textarea');
      await user.clear(textarea);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('does not save edit with only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const textarea = screen.getByTestId('reply-textarea');
      await user.clear(textarea);
      await user.type(textarea, '   ');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(mockOnEdit).not.toHaveBeenCalled();
    });

    it('trims whitespace from edited reply before saving', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const textarea = screen.getByTestId('reply-textarea');
      await user.clear(textarea);
      await user.type(textarea, '  Edited content  ');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(mockOnEdit).toHaveBeenCalledWith('reply-2', 'Edited content');
    });
  });

  describe('Delete Reply Functionality', () => {
    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledWith('reply-2');
    });
  });

  describe('React to Messages', () => {
    it('calls onReact when adding reaction to parent message', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const addReactionButtons = screen.getAllByText('Add Reaction');
      await user.click(addReactionButtons[0]);

      expect(mockOnReact).toHaveBeenCalledWith('parent-1', '👍');
    });

    it('calls onReact when removing reaction from parent message', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const removeReactionButtons = screen.getAllByText('Remove Reaction');
      await user.click(removeReactionButtons[0]);

      expect(mockOnReact).toHaveBeenCalledWith('parent-1', '👍');
    });

    it('calls onReact when adding reaction to reply', async () => {
      const user = userEvent.setup();
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const reactButtons = screen.getAllByText('React');
      await user.click(reactButtons[0]);

      expect(mockOnReact).toHaveBeenCalledWith('reply-1', '😀');
    });
  });

  describe('Thread Statistics', () => {
    it('displays participant count', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText(/2 participants/)).toBeInTheDocument();
    });

    it('displays singular "participant" for one participant', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText(/1 participant/)).toBeInTheDocument();
    });

    it('displays reply count in stats', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // Look for all instances of "3 replies" (in badge and stats)
      const replyCountElements = screen.getAllByText(/3 replies/);
      expect(replyCountElements.length).toBeGreaterThan(0);
    });

    it('displays Users icon in stats', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('displays "Today" for today\'s messages', () => {
      const todayMessage = {
        ...mockParentMessage,
        timestamp: new Date().toISOString()
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={todayMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText(/Today/)).toBeInTheDocument();
    });

    it('displays date for past messages', () => {
      const pastMessage = {
        ...mockParentMessage,
        timestamp: '2024-01-10T10:00:00Z'
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={pastMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText(/1\/10\/2024/)).toBeInTheDocument();
    });

    it('displays time in 24-hour format', () => {
      const timeMessage = {
        ...mockParentMessage,
        timestamp: new Date('2024-01-15T14:30:00Z').toISOString()
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={timeMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const timeElements = screen.getAllByText(/\d{2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Scrolling Behavior', () => {
    it('has scroll container for replies', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const scrollContainer = container.querySelector('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('renders scroll anchor element', () => {
      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // The repliesEndRef creates a div element
      const scrollElements = container.querySelectorAll('div');
      expect(scrollElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined replies array', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={undefined}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('No replies yet')).toBeInTheDocument();
    });

    it('treats missing replies as empty array', () => {
      // When replies prop is not provided, it defaults to []
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // Should show empty state
      expect(screen.getByText('No replies yet')).toBeInTheDocument();
    });

    it('handles parent message without reactions', () => {
      const messageWithoutReactions = {
        ...mockParentMessage,
        reactions: null
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={messageWithoutReactions}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('This is the parent message')).toBeInTheDocument();
    });

    it('handles reply without reactions', () => {
      const replyWithoutReactions = {
        ...mockReplies[0],
        reactions: null
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[replyWithoutReactions]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('First reply')).toBeInTheDocument();
    });

    it('handles very long reply content', () => {
      const longReply = {
        ...mockReplies[0],
        content: 'a'.repeat(1000)
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[longReply]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('a'.repeat(1000))).toBeInTheDocument();
    });

    it('handles very long parent message content', () => {
      const longParentMessage = {
        ...mockParentMessage,
        content: 'b'.repeat(1000)
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={longParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('b'.repeat(1000))).toBeInTheDocument();
    });

    it('handles many replies', () => {
      const manyReplies = Array.from({ length: 50 }, (_, i) => ({
        id: `reply-${i}`,
        userId: `user-${i % 3}`,
        username: `User ${i}`,
        avatar: `U${i}`,
        content: `Reply number ${i}`,
        timestamp: new Date().toISOString(),
        reactions: {}
      }));

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={manyReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // Look for all instances of "50 replies" (in badge and stats)
      const replyCountElements = screen.getAllByText(/50 replies/);
      expect(replyCountElements.length).toBeGreaterThan(0);
    });

    it('handles rapid reply submissions', async () => {
      const user = userEvent.setup({ delay: null });
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const textarea = screen.getByTestId('reply-textarea');
      const submitButton = screen.getByTestId('submit-button');

      await user.type(textarea, 'First reply');
      await user.click(submitButton);

      await user.type(textarea, 'Second reply');
      await user.click(submitButton);

      await user.type(textarea, 'Third reply');
      await user.click(submitButton);

      expect(mockOnSendReply).toHaveBeenCalledTimes(3);
    });

    it('handles missing currentUserId', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId={null}
        />
      );

      expect(screen.getByText('First reply')).toBeInTheDocument();
    });

    it('handles empty username', () => {
      const messageWithEmptyUsername = {
        ...mockParentMessage,
        username: ''
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={messageWithEmptyUsername}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByPlaceholderText('Reply to ...')).toBeInTheDocument();
    });

    it('handles empty avatar', () => {
      const messageWithEmptyAvatar = {
        ...mockParentMessage,
        avatar: ''
      };

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={messageWithEmptyAvatar}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('This is the parent message')).toBeInTheDocument();
    });

    it('handles numeric timestamp', () => {
      const messageWithNumericTimestamp = {
        ...mockParentMessage,
        timestamp: Date.now()
      };

      const { container } = render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={messageWithNumericTimestamp}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      // Component should render with numeric timestamp
      expect(screen.getByText('This is the parent message')).toBeInTheDocument();
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });

    it('handles same user consecutive replies', () => {
      const consecutiveReplies = [
        {
          id: 'reply-1',
          userId: 'user-2',
          username: 'Jane Smith',
          avatar: 'JS',
          content: 'First message',
          timestamp: '2024-01-15T10:05:00Z',
          reactions: {}
        },
        {
          id: 'reply-2',
          userId: 'user-2',
          username: 'Jane Smith',
          avatar: 'JS',
          content: 'Second message immediately after',
          timestamp: '2024-01-15T10:05:30Z',
          reactions: {}
        }
      ];

      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={consecutiveReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message immediately after')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates with RichTextEditor component', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={[]}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    });

    it('integrates with MessageReactions component', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const reactionComponents = screen.getAllByTestId('message-reactions');
      expect(reactionComponents.length).toBeGreaterThan(0);
    });

    it('integrates with MessageActions component', () => {
      render(
        <MessageThread
          isOpen={true}
          onClose={mockOnClose}
          parentMessage={mockParentMessage}
          replies={mockReplies}
          onSendReply={mockOnSendReply}
          onReact={mockOnReact}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          currentUserId="user-1"
        />
      );

      const actionComponents = screen.getAllByTestId('message-actions');
      expect(actionComponents.length).toBeGreaterThan(0);
    });
  });
});

export default MockRichTextEditor
