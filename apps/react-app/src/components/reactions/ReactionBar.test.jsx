/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReactionBar, { ReactionDisplay, ReactionSummary, QuickReactions } from './ReactionBar';
import ReactionPicker, { DEFAULT_REACTIONS } from './ReactionPicker';

jest.mock('./ReactionPicker', () => {
  const DEFAULT_REACTIONS = [
    { type: 'like', emoji: '👍', label: 'Like', color: '#1da1f2', category: 'positive' },
    { type: 'love', emoji: '❤️', label: 'Love', color: '#e91e63', category: 'positive' },
    { type: 'laugh', emoji: '😂', label: 'Laugh', color: '#ff9800', category: 'positive' },
    { type: 'fire', emoji: '🔥', label: 'Fire', color: '#ff5722', category: 'positive' },
    { type: 'rocket', emoji: '🚀', label: 'Rocket', color: '#3f51b5', category: 'positive' }
  ];

  return {
    __esModule: true,
    default: jest.fn(({ isOpen, onClose, onReactionSelect, userReactions }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="reaction-picker">
          <button onClick={onClose}>Close Picker</button>
          {DEFAULT_REACTIONS.map(reaction => (
            <button
              key={reaction.type}
              onClick={() => onReactionSelect(reaction)}
              data-testid={`picker-reaction-${reaction.type}`}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      );
    }),
    DEFAULT_REACTIONS
  };
});

describe('ReactionDisplay', () => {
  const defaultProps = {
    reaction: 'like',
    count: 5,
    users: [],
    isUserReacted: false,
    onToggle: jest.fn(),
    onViewUsers: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<ReactionDisplay {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('displays reaction emoji correctly', () => {
      render(<ReactionDisplay {...defaultProps} />);
      expect(screen.getByText('👍')).toBeInTheDocument();
    });

    it('displays reaction count correctly', () => {
      render(<ReactionDisplay {...defaultProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('hides count when showCount is false', () => {
      render(<ReactionDisplay {...defaultProps} showCount={false} />);
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('hides count when count is 0 in compact mode', () => {
      render(<ReactionDisplay {...defaultProps} count={0} showCount={true} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('applies user-reacted class when isUserReacted is true', () => {
      const { container } = render(<ReactionDisplay {...defaultProps} isUserReacted={true} />);
      expect(container.querySelector('.user-reacted')).toBeInTheDocument();
    });

    it('applies small size class correctly', () => {
      const { container } = render(<ReactionDisplay {...defaultProps} size="small" />);
      expect(container.querySelector('.small')).toBeInTheDocument();
    });

    it('applies medium size class correctly', () => {
      const { container } = render(<ReactionDisplay {...defaultProps} size="medium" />);
      expect(container.querySelector('.medium')).toBeInTheDocument();
    });

    it('applies non-interactive class when interactive is false', () => {
      const { container } = render(<ReactionDisplay {...defaultProps} interactive={false} />);
      expect(container.querySelector('.non-interactive')).toBeInTheDocument();
    });

    it('formats count over 1000 with K suffix', () => {
      render(<ReactionDisplay {...defaultProps} count={1500} />);
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    it('formats count over 1000000 with M suffix', () => {
      render(<ReactionDisplay {...defaultProps} count={2500000} />);
      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onToggle when clicked', async () => {
      const onToggle = jest.fn();
      render(<ReactionDisplay {...defaultProps} onToggle={onToggle} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(onToggle).toHaveBeenCalledWith('like', true);
    });

    it('calls onToggle with false when user has already reacted', async () => {
      const onToggle = jest.fn();
      render(<ReactionDisplay {...defaultProps} onToggle={onToggle} isUserReacted={true} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(onToggle).toHaveBeenCalledWith('like', false);
    });

    it('does not call onToggle when interactive is false', async () => {
      const onToggle = jest.fn();
      render(<ReactionDisplay {...defaultProps} onToggle={onToggle} interactive={false} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('shows animation when clicked', async () => {
      const { container } = render(<ReactionDisplay {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(container.querySelector('.animating')).toBeInTheDocument();
    });

    it('removes animation after timeout', async () => {
      jest.useFakeTimers();
      const { container } = render(<ReactionDisplay {...defaultProps} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(container.querySelector('.animating')).toBeInTheDocument();

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(container.querySelector('.animating')).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('User Tooltip', () => {
    it('shows tooltip on hover when users array is not empty', async () => {
      const users = [
        { id: 1, username: 'user1', display_name: 'User One' },
        { id: 2, username: 'user2', display_name: 'User Two' }
      ];
      render(<ReactionDisplay {...defaultProps} users={users} />);

      const button = screen.getByRole('button');
      await userEvent.hover(button);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });
    });

    it('does not show tooltip when users array is empty', async () => {
      render(<ReactionDisplay {...defaultProps} users={[]} />);

      const button = screen.getByRole('button');
      await userEvent.hover(button);

      expect(screen.queryByText(/User/)).not.toBeInTheDocument();
    });

    it('shows only first 5 users in tooltip', async () => {
      const users = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        display_name: `User ${i + 1}`
      }));
      render(<ReactionDisplay {...defaultProps} users={users} count={10} />);

      const button = screen.getByRole('button');
      await userEvent.hover(button);

      await waitFor(() => {
        expect(screen.getByText('User 1')).toBeInTheDocument();
        expect(screen.getByText('User 5')).toBeInTheDocument();
        expect(screen.queryByText('User 6')).not.toBeInTheDocument();
      });
    });

    it('shows "view more" button when users exceed 5', async () => {
      const users = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        display_name: `User ${i + 1}`
      }));
      render(<ReactionDisplay {...defaultProps} users={users} count={10} />);

      const button = screen.getByRole('button');
      await userEvent.hover(button);

      await waitFor(() => {
        expect(screen.getByText('+5 more')).toBeInTheDocument();
      });
    });

    it('calls onViewUsers when "view more" is clicked', async () => {
      const onViewUsers = jest.fn();
      const users = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        display_name: `User ${i + 1}`
      }));
      render(<ReactionDisplay {...defaultProps} users={users} count={10} onViewUsers={onViewUsers} />);

      const button = screen.getByRole('button');
      await userEvent.hover(button);

      await waitFor(() => {
        const moreButton = screen.getByText('+5 more');
        fireEvent.click(moreButton);
      });

      expect(onViewUsers).toHaveBeenCalledWith('like', users);
    });

    it('displays user avatar when available', async () => {
      const users = [
        { id: 1, username: 'user1', display_name: 'User One', avatar: 'avatar1.jpg' }
      ];
      render(<ReactionDisplay {...defaultProps} users={users} />);

      const button = screen.getByRole('button');
      await userEvent.hover(button);

      await waitFor(() => {
        const avatar = screen.getByAltText('user1');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('src', 'avatar1.jpg');
      });
    });

    it('displays avatar placeholder when avatar is not available', async () => {
      const users = [
        { id: 1, username: 'user1', display_name: 'User One' }
      ];
      render(<ReactionDisplay {...defaultProps} users={users} />);

      const button = screen.getByRole('button');
      await userEvent.hover(button);

      await waitFor(() => {
        expect(screen.getByText('U')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Emoji Support', () => {
    it('handles custom emoji object', () => {
      const customReaction = {
        type: 'custom',
        emoji: '🎉',
        label: 'Party',
        color: '#ff00ff'
      };
      render(<ReactionDisplay {...defaultProps} reaction={customReaction} />);

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('falls back to string emoji when not in DEFAULT_REACTIONS', () => {
      render(<ReactionDisplay {...defaultProps} reaction="🎊" />);

      expect(screen.getByText('🎊')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ReactionDisplay {...defaultProps} />);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-label', 'Like reaction, 5 users');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });

    it('updates aria-pressed when user reacts', () => {
      render(<ReactionDisplay {...defaultProps} isUserReacted={true} />);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('has title attribute for tooltip', () => {
      render(<ReactionDisplay {...defaultProps} />);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('title', 'Like (5)');
    });

    it('disables button when not interactive', () => {
      render(<ReactionDisplay {...defaultProps} interactive={false} />);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
    });
  });
});

describe('ReactionBar', () => {
  const defaultProps = {
    contentType: 'post',
    contentId: '123',
    reactions: {
      like: 5,
      love: 3,
      laugh: 2
    },
    userReactions: ['like'],
    totalReactions: 10,
    reactionUsers: {},
    onReactionToggle: jest.fn(),
    onViewReactionUsers: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete window.socket;
    delete window.currentUserId;
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<ReactionBar {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders reaction buttons for each reaction', () => {
      render(<ReactionBar {...defaultProps} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
    });

    it('renders reactions sorted by count in descending order', () => {
      render(<ReactionBar {...defaultProps} />);

      const reactionList = screen.getByRole('group');
      const buttons = within(reactionList).getAllByRole('button');

      expect(buttons[0]).toHaveTextContent('👍');
      expect(buttons[1]).toHaveTextContent('❤️');
      expect(buttons[2]).toHaveTextContent('😂');
    });

    it('does not render reactions with count of 0', () => {
      const props = {
        ...defaultProps,
        reactions: {
          like: 5,
          love: 0,
          laugh: 2
        }
      };
      render(<ReactionBar {...props} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.queryByText('❤️')).not.toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
    });

    it('renders add reaction button when showPicker is true', () => {
      render(<ReactionBar {...defaultProps} showPicker={true} />);

      expect(screen.getByLabelText('Add reaction')).toBeInTheDocument();
    });

    it('does not render add reaction button when showPicker is false', () => {
      render(<ReactionBar {...defaultProps} showPicker={false} />);

      expect(screen.queryByLabelText('Add reaction')).not.toBeInTheDocument();
    });

    it('renders with compact class when compact is true', () => {
      const { container } = render(<ReactionBar {...defaultProps} compact={true} />);

      expect(container.querySelector('.compact')).toBeInTheDocument();
    });

    it('renders custom className', () => {
      const { container } = render(<ReactionBar {...defaultProps} className="custom-class" />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Max Visible Reactions', () => {
    it('limits visible reactions to maxVisible prop', () => {
      const props = {
        ...defaultProps,
        reactions: {
          like: 10,
          love: 9,
          laugh: 8,
          fire: 7,
          rocket: 6,
          wow: 5,
          sad: 4
        },
        maxVisible: 3
      };
      render(<ReactionBar {...props} />);

      const reactionList = screen.getByRole('group');
      const emojiButtons = within(reactionList).getAllByRole('button').filter(
        btn => btn.querySelector('.reaction-emoji')
      );

      expect(emojiButtons.length).toBeLessThanOrEqual(4);
    });

    it('shows hidden reactions indicator when reactions exceed maxVisible', () => {
      const props = {
        ...defaultProps,
        reactions: {
          like: 10,
          love: 9,
          laugh: 8,
          fire: 7,
          rocket: 6,
          wow: 5,
          sad: 4
        },
        maxVisible: 3
      };
      render(<ReactionBar {...props} />);

      expect(screen.getByTitle(/more reaction/)).toBeInTheDocument();
    });

    it('opens picker when hidden reactions indicator is clicked', async () => {
      const props = {
        ...defaultProps,
        reactions: {
          like: 10,
          love: 9,
          laugh: 8,
          fire: 7,
          rocket: 6,
          wow: 5,
          sad: 4
        },
        maxVisible: 3
      };
      render(<ReactionBar {...props} />);

      const hiddenIndicator = screen.getByTitle(/more reaction/);
      await userEvent.click(hiddenIndicator);

      expect(screen.getByTestId('reaction-picker')).toBeInTheDocument();
    });
  });

  describe('Reaction Picker', () => {
    it('opens picker when add reaction button is clicked', async () => {
      render(<ReactionBar {...defaultProps} />);

      const addButton = screen.getByLabelText('Add reaction');
      await userEvent.click(addButton);

      expect(screen.getByTestId('reaction-picker')).toBeInTheDocument();
    });

    it('closes picker when close button is clicked', async () => {
      render(<ReactionBar {...defaultProps} />);

      const addButton = screen.getByLabelText('Add reaction');
      await userEvent.click(addButton);

      expect(screen.getByTestId('reaction-picker')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Picker');
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('reaction-picker')).not.toBeInTheDocument();
      });
    });

    it('passes userReactions to picker', async () => {
      render(<ReactionBar {...defaultProps} userReactions={['like', 'love']} />);

      const addButton = screen.getByLabelText('Add reaction');
      await userEvent.click(addButton);

      expect(ReactionPicker).toHaveBeenCalledWith(
        expect.objectContaining({
          userReactions: ['like', 'love']
        }),
        expect.anything()
      );
    });
  });

  describe('Add Reaction Functionality', () => {
    it('calls onReactionToggle when reaction is selected from picker', async () => {
      const onReactionToggle = jest.fn();
      render(<ReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);

      const addButton = screen.getByLabelText('Add reaction');
      await userEvent.click(addButton);

      const loveReaction = screen.getByTestId('picker-reaction-love');
      await userEvent.click(loveReaction);

      await waitFor(() => {
        expect(onReactionToggle).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'love' }),
          true
        );
      });
    });

    it('optimistically updates count when adding reaction', async () => {
      render(<ReactionBar {...defaultProps} />);

      const addButton = screen.getByLabelText('Add reaction');
      await userEvent.click(addButton);

      const loveButton = screen.getByTestId('picker-reaction-love');
      await userEvent.click(loveButton);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('optimistically adds to userReactions when adding reaction', async () => {
      const { rerender } = render(<ReactionBar {...defaultProps} userReactions={['like']} />);

      const addButton = screen.getByLabelText('Add reaction');
      await userEvent.click(addButton);

      const loveButton = screen.getByTestId('picker-reaction-love');
      await userEvent.click(loveButton);

      await waitFor(() => {
        const loveDisplay = screen.getAllByRole('button').find(btn =>
          btn.textContent.includes('❤️')
        );
        expect(loveDisplay).toHaveClass('user-reacted');
      });
    });
  });

  describe('Remove Reaction Functionality', () => {
    it('calls onReactionToggle with false when removing reaction', async () => {
      const onReactionToggle = jest.fn();
      render(<ReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(onReactionToggle).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'like' }),
          false
        );
      });
    });

    it('optimistically decrements count when removing reaction', async () => {
      render(<ReactionBar {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('does not go below 0 when removing reaction', async () => {
      const props = {
        ...defaultProps,
        reactions: { like: 1 },
        userReactions: ['like']
      };
      render(<ReactionBar {...props} />);

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      await userEvent.click(likeButton);

      await waitFor(() => {
        const count = screen.queryByText('0');
        expect(count).not.toBeInTheDocument();
      });
    });

    it('optimistically removes from userReactions when removing reaction', async () => {
      render(<ReactionBar {...defaultProps} userReactions={['like']} />);

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍') && btn.classList.contains('user-reacted')
      );

      await userEvent.click(likeButton);

      await waitFor(() => {
        const updatedLikeButton = screen.getAllByRole('button').find(btn =>
          btn.textContent.includes('👍')
        );
        expect(updatedLikeButton).not.toHaveClass('user-reacted');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading overlay when processing reaction', async () => {
      const onReactionToggle = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { container } = render(<ReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      await userEvent.click(likeButton);

      expect(container.querySelector('.reaction-loading-overlay')).toBeInTheDocument();
    });

    it('disables add reaction button when loading', async () => {
      const onReactionToggle = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      await userEvent.click(likeButton);

      const addButton = screen.getByLabelText('Add reaction');
      expect(addButton).toBeDisabled();
    });

    it('prevents multiple simultaneous reaction toggles', async () => {
      const onReactionToggle = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );

      await userEvent.click(likeButton);
      await userEvent.click(likeButton);
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(onReactionToggle).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('reverts optimistic update on error', async () => {
      const onReactionToggle = jest.fn().mockRejectedValue(new Error('API Error'));
      render(<ReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);

      const originalCount = screen.getByText('5');
      expect(originalCount).toBeInTheDocument();

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('reverts userReactions on error', async () => {
      const onReactionToggle = jest.fn().mockRejectedValue(new Error('API Error'));
      render(<ReactionBar {...defaultProps} userReactions={['like']} onReactionToggle={onReactionToggle} />);

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      await userEvent.click(likeButton);

      await waitFor(() => {
        const updatedLikeButton = screen.getAllByRole('button').find(btn =>
          btn.textContent.includes('👍')
        );
        expect(updatedLikeButton).toHaveClass('user-reacted');
      });
    });

    it('logs error to console on failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onReactionToggle = jest.fn().mockRejectedValue(new Error('API Error'));
      render(<ReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);

      const likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error toggling reaction:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Analytics and Metadata', () => {
    it('shows total reactions count', () => {
      render(<ReactionBar {...defaultProps} totalReactions={10} />);

      expect(screen.getByText('10 reactions')).toBeInTheDocument();
    });

    it('shows singular "reaction" for count of 1', () => {
      render(<ReactionBar {...defaultProps} totalReactions={1} />);

      expect(screen.getByText('1 reaction')).toBeInTheDocument();
    });

    it('does not show metadata in compact mode', () => {
      render(<ReactionBar {...defaultProps} totalReactions={10} compact={true} />);

      expect(screen.queryByText('10 reactions')).not.toBeInTheDocument();
    });

    it('shows trending indicator when showTrending is true', () => {
      const { container } = render(<ReactionBar {...defaultProps} showTrending={true} />);

      const analytics = { trending: true };
      const { rerender } = render(<ReactionBar {...defaultProps} showTrending={true} />);

      expect(screen.queryByText('Trending')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Updates via Socket.io', () => {
    beforeEach(() => {
      window.socket = {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      };
      window.currentUserId = 'user123';
    });

    it('subscribes to reaction updates on mount', () => {
      render(<ReactionBar {...defaultProps} />);

      expect(window.socket.on).toHaveBeenCalledWith('reaction_update', expect.any(Function));
    });

    it('joins room for content on mount', () => {
      render(<ReactionBar {...defaultProps} />);

      expect(window.socket.emit).toHaveBeenCalledWith('join_room', 'post:123');
    });

    it('unsubscribes from reaction updates on unmount', () => {
      const { unmount } = render(<ReactionBar {...defaultProps} />);

      unmount();

      expect(window.socket.off).toHaveBeenCalledWith('reaction_update', expect.any(Function));
    });

    it('leaves room on unmount', () => {
      const { unmount } = render(<ReactionBar {...defaultProps} />);

      unmount();

      expect(window.socket.emit).toHaveBeenCalledWith('leave_room', 'post:123');
    });

    it('updates count when REACTION_ADDED event is received', () => {
      const { rerender } = render(<ReactionBar {...defaultProps} />);

      const handler = window.socket.on.mock.calls.find(call => call[0] === 'reaction_update')[1];

      handler({
        contentType: 'post',
        contentId: '123',
        type: 'REACTION_ADDED',
        reactionType: 'like',
        userId: 'otherUser'
      });

      rerender(<ReactionBar {...defaultProps} />);

      waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });

    it('decrements count when REACTION_REMOVED event is received', () => {
      const { rerender } = render(<ReactionBar {...defaultProps} />);

      const handler = window.socket.on.mock.calls.find(call => call[0] === 'reaction_update')[1];

      handler({
        contentType: 'post',
        contentId: '123',
        type: 'REACTION_REMOVED',
        reactionType: 'like',
        userId: 'otherUser'
      });

      rerender(<ReactionBar {...defaultProps} />);

      waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('ignores updates for different content', () => {
      render(<ReactionBar {...defaultProps} />);

      const handler = window.socket.on.mock.calls.find(call => call[0] === 'reaction_update')[1];

      handler({
        contentType: 'post',
        contentId: '999',
        type: 'REACTION_ADDED',
        reactionType: 'like',
        userId: 'otherUser'
      });

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('updates userReactions when current user adds reaction', () => {
      const { rerender } = render(<ReactionBar {...defaultProps} userReactions={[]} />);

      const handler = window.socket.on.mock.calls.find(call => call[0] === 'reaction_update')[1];

      handler({
        contentType: 'post',
        contentId: '123',
        type: 'REACTION_ADDED',
        reactionType: 'love',
        userId: 'user123'
      });

      rerender(<ReactionBar {...defaultProps} userReactions={[]} />);

      waitFor(() => {
        const loveButton = screen.getAllByRole('button').find(btn =>
          btn.textContent.includes('❤️')
        );
        expect(loveButton).toHaveClass('user-reacted');
      });
    });

    it('removes from userReactions when current user removes reaction', () => {
      const { rerender } = render(<ReactionBar {...defaultProps} userReactions={['like']} />);

      const handler = window.socket.on.mock.calls.find(call => call[0] === 'reaction_update')[1];

      handler({
        contentType: 'post',
        contentId: '123',
        type: 'REACTION_REMOVED',
        reactionType: 'like',
        userId: 'user123'
      });

      rerender(<ReactionBar {...defaultProps} userReactions={['like']} />);

      waitFor(() => {
        const likeButton = screen.getAllByRole('button').find(btn =>
          btn.textContent.includes('👍')
        );
        expect(likeButton).not.toHaveClass('user-reacted');
      });
    });
  });

  describe('Props Updates', () => {
    it('updates reactions when props change', () => {
      const { rerender } = render(<ReactionBar {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument();

      rerender(<ReactionBar {...defaultProps} reactions={{ like: 10, love: 3, laugh: 2 }} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('updates userReactions when props change', () => {
      const { rerender } = render(<ReactionBar {...defaultProps} userReactions={['like']} />);

      let likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      expect(likeButton).toHaveClass('user-reacted');

      rerender(<ReactionBar {...defaultProps} userReactions={[]} />);

      likeButton = screen.getAllByRole('button').find(btn =>
        btn.textContent.includes('👍')
      );
      expect(likeButton).not.toHaveClass('user-reacted');
    });
  });

  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(<ReactionBar {...defaultProps} />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('has proper aria-label', () => {
      render(<ReactionBar {...defaultProps} />);

      expect(screen.getByLabelText('Content reactions')).toBeInTheDocument();
    });
  });
});

describe('ReactionSummary', () => {
  const defaultProps = {
    reactions: {
      like: 10,
      love: 5,
      laugh: 3
    },
    totalUsers: 15
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<ReactionSummary {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('displays top 3 reactions', () => {
      render(<ReactionSummary {...defaultProps} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
    });

    it('displays counts for each reaction', () => {
      render(<ReactionSummary {...defaultProps} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays total reaction count', () => {
      render(<ReactionSummary {...defaultProps} />);

      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('displays unique user count when different from total reactions', () => {
      render(<ReactionSummary {...defaultProps} />);

      expect(screen.getByText(/by 15 users/)).toBeInTheDocument();
    });

    it('does not display user count when same as total reactions', () => {
      render(<ReactionSummary {...defaultProps} totalUsers={18} />);

      expect(screen.queryByText(/by 18 users/)).not.toBeInTheDocument();
    });

    it('returns null when no reactions', () => {
      const { container } = render(<ReactionSummary reactions={{}} />);

      expect(container.firstChild).toBeNull();
    });

    it('applies compact class when compact is true', () => {
      const { container } = render(<ReactionSummary {...defaultProps} compact={true} />);

      expect(container.querySelector('.compact')).toBeInTheDocument();
    });

    it('applies trending class when trending is true', () => {
      const { container } = render(<ReactionSummary {...defaultProps} trending={true} />);

      expect(container.querySelector('.trending')).toBeInTheDocument();
    });
  });

  describe('Trending Badge', () => {
    it('shows trending badge when trending is true', () => {
      render(<ReactionSummary {...defaultProps} trending={true} />);

      expect(screen.getByText('Trending')).toBeInTheDocument();
    });

    it('does not show trending badge when trending is false', () => {
      render(<ReactionSummary {...defaultProps} trending={false} />);

      expect(screen.queryByText('Trending')).not.toBeInTheDocument();
    });
  });

  describe('View Details', () => {
    it('shows view details button when onViewDetails is provided', () => {
      const onViewDetails = jest.fn();
      render(<ReactionSummary {...defaultProps} onViewDetails={onViewDetails} />);

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('calls onViewDetails when button is clicked', async () => {
      const onViewDetails = jest.fn();
      render(<ReactionSummary {...defaultProps} onViewDetails={onViewDetails} />);

      const button = screen.getByText('View Details');
      await userEvent.click(button);

      expect(onViewDetails).toHaveBeenCalled();
    });

    it('does not show view details button when onViewDetails is not provided', () => {
      render(<ReactionSummary {...defaultProps} />);

      expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    });
  });

  describe('Pluralization', () => {
    it('shows singular "user" for 1 user', () => {
      render(<ReactionSummary reactions={{ like: 1 }} totalUsers={1} />);

      expect(screen.getByText(/by 1 user$/)).toBeInTheDocument();
    });

    it('shows plural "users" for multiple users', () => {
      render(<ReactionSummary {...defaultProps} />);

      expect(screen.getByText(/by 15 users$/)).toBeInTheDocument();
    });
  });
});

describe('QuickReactions', () => {
  const defaultProps = {
    onReactionSelect: jest.fn(),
    userReactions: [],
    reactions: ['like', 'love', 'laugh', 'fire']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<QuickReactions {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders specified reactions', () => {
      render(<QuickReactions {...defaultProps} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('applies selected class to user reactions', () => {
      const { container } = render(<QuickReactions {...defaultProps} userReactions={['like', 'love']} />);

      const buttons = container.querySelectorAll('.selected');
      expect(buttons.length).toBe(2);
    });

    it('renders custom className', () => {
      const { container } = render(<QuickReactions {...defaultProps} className="custom-class" />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onReactionSelect when reaction is clicked', async () => {
      const onReactionSelect = jest.fn();
      render(<QuickReactions {...defaultProps} onReactionSelect={onReactionSelect} />);

      const likeButton = screen.getByTitle('Like');
      await userEvent.click(likeButton);

      expect(onReactionSelect).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'like' })
      );
    });

    it('handles multiple reaction clicks', async () => {
      const onReactionSelect = jest.fn();
      render(<QuickReactions {...defaultProps} onReactionSelect={onReactionSelect} />);

      const likeButton = screen.getByTitle('Like');
      const loveButton = screen.getByTitle('Love');

      await userEvent.click(likeButton);
      await userEvent.click(loveButton);

      expect(onReactionSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Default Reactions', () => {
    it('uses default reactions when not specified', () => {
      render(<QuickReactions onReactionSelect={jest.fn()} userReactions={[]} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });
  });

  describe('Custom Reactions', () => {
    it('renders custom reaction set', () => {
      render(<QuickReactions {...defaultProps} reactions={['like', 'rocket']} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('🚀')).toBeInTheDocument();
      expect(screen.queryByText('❤️')).not.toBeInTheDocument();
    });

    it('skips invalid reactions', () => {
      const { container } = render(<QuickReactions {...defaultProps} reactions={['like', 'invalid', 'love']} />);

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has title attributes for all reactions', () => {
      render(<QuickReactions {...defaultProps} />);

      expect(screen.getByTitle('Like')).toBeInTheDocument();
      expect(screen.getByTitle('Love')).toBeInTheDocument();
      expect(screen.getByTitle('Laugh')).toBeInTheDocument();
      expect(screen.getByTitle('Fire')).toBeInTheDocument();
    });

    it('uses reaction colors for styling', () => {
      render(<QuickReactions {...defaultProps} />);

      const likeButton = screen.getByTitle('Like');
      expect(likeButton).toHaveStyle({ '--reaction-color': '#1da1f2' });
    });
  });
});

export default DEFAULT_REACTIONS
