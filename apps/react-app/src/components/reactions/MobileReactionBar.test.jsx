import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import MobileReactionBar, {
  MobileReactionDisplay,
  MobileQuickReactions,
  MobileReactionSummary
} from './MobileReactionBar';
import { DEFAULT_REACTIONS } from './ReactionPicker';

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
  configurable: true
});

// Mock socket.io
const mockSocketOn = jest.fn();
const mockSocketOff = jest.fn();
const mockSocketEmit = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useFakeTimers();
  mockVibrate.mockClear();
  window.socket = {
    on: mockSocketOn,
    off: mockSocketOff,
    emit: mockSocketEmit
  };
  window.currentUserId = 'user123';
});

afterEach(() => {
  jest.useRealTimers();
  delete window.socket;
  delete window.currentUserId;
});

describe('MobileReactionDisplay', () => {
  const mockReaction = 'like';
  const mockUsers = ['user1', 'user2'];

  describe('Basic rendering', () => {
    test('renders reaction emoji and count', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          users={mockUsers}
        />
      );

      expect(screen.getByRole('img', { name: /like/i })).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('renders with string reaction type', () => {
      render(
        <MobileReactionDisplay
          reaction="love"
          count={10}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('love'));
    });

    test('renders with reaction object', () => {
      const reactionObj = DEFAULT_REACTIONS[0];
      render(
        <MobileReactionDisplay
          reaction={reactionObj}
          count={3}
        />
      );

      expect(screen.getByText(reactionObj.emoji)).toBeInTheDocument();
    });

    test('applies user-reacted class when user has reacted', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          isUserReacted={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('user-reacted');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    test('renders without count when count is 0', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={0}
        />
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    test('applies different size classes', () => {
      const { rerender } = render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          size="small"
        />
      );

      expect(screen.getByRole('button')).toHaveClass('small');

      rerender(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          size="medium"
        />
      );

      expect(screen.getByRole('button')).toHaveClass('medium');
    });

    test('applies non-interactive class when not interactive', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          interactive={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('non-interactive');
      expect(button).toBeDisabled();
    });

    test('renders user indicator when user has reacted', () => {
      const { container } = render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          isUserReacted={true}
        />
      );

      expect(container.querySelector('.user-indicator')).toBeInTheDocument();
    });
  });

  describe('Count formatting', () => {
    test('formats counts in thousands', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={1500}
        />
      );

      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });

    test('formats counts in millions', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={2500000}
        />
      );

      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    test('displays exact count for numbers below 1000', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={999}
        />
      );

      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });

  describe('Touch interactions', () => {
    test('handles short tap to toggle reaction', () => {
      const mockOnToggle = jest.fn();
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      fireEvent.touchEnd(button);

      expect(mockOnToggle).toHaveBeenCalledWith(mockReaction, true);
    });

    test('applies pressed class during touch', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
        />
      );

      const button = screen.getByRole('button');

      fireEvent.touchStart(button);
      expect(button).toHaveClass('pressed');

      fireEvent.touchEnd(button);
      expect(button).not.toHaveClass('pressed');
    });

    test('shows touch feedback indicator when pressed', () => {
      const { container } = render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
        />
      );

      const button = screen.getByRole('button');

      fireEvent.touchStart(button);
      expect(container.querySelector('.touch-feedback')).toBeInTheDocument();
    });

    test('does not trigger actions when not interactive', () => {
      const mockOnToggle = jest.fn();
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          onToggle={mockOnToggle}
          interactive={false}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);

      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    test('handles touch cancel event', () => {
      const mockOnToggle = jest.fn();
      const { container } = render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');

      fireEvent.touchStart(button);
      expect(button).toHaveClass('pressed');

      fireEvent.touchCancel(button);
      expect(button).not.toHaveClass('pressed');
      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe('Long press behavior', () => {
    test('triggers long press after 500ms', () => {
      const mockOnLongPress = jest.fn();
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          users={mockUsers}
          onLongPress={mockOnLongPress}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockOnLongPress).toHaveBeenCalledWith(mockReaction, mockUsers);
    });

    test('does not trigger toggle on long press', () => {
      const mockOnToggle = jest.fn();
      const mockOnLongPress = jest.fn();
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          onToggle={mockOnToggle}
          onLongPress={mockOnLongPress}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      fireEvent.touchEnd(button);

      expect(mockOnLongPress).toHaveBeenCalled();
      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    test('cancels long press if touch ends before 500ms', () => {
      const mockOnLongPress = jest.fn();
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          onLongPress={mockOnLongPress}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      act(() => {
        jest.advanceTimersByTime(400);
      });

      fireEvent.touchEnd(button);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockOnLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Haptic feedback', () => {
    test('triggers vibration on long press', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          onLongPress={jest.fn()}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    test('handles missing vibration API gracefully', () => {
      delete navigator.vibrate;

      const mockOnLongPress = jest.fn();
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          onLongPress={mockOnLongPress}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.touchStart(button);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockOnLongPress).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has proper aria labels', () => {
      render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('5 users'));
    });

    test('has aria-pressed attribute', () => {
      const { rerender } = render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          isUserReacted={false}
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

      rerender(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
          isUserReacted={true}
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });

    test('count has aria-hidden', () => {
      const { container } = render(
        <MobileReactionDisplay
          reaction={mockReaction}
          count={5}
        />
      );

      const countElement = container.querySelector('.reaction-count');
      expect(countElement).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

describe('MobileQuickReactions', () => {
  const defaultReactions = ['like', 'love', 'laugh', 'fire', 'rocket'];

  describe('Rendering', () => {
    test('renders first 4 reactions by default', () => {
      render(
        <MobileQuickReactions
          reactions={defaultReactions}
        />
      );

      const buttons = screen.getAllByRole('button');
      // 4 reactions + 1 expand button
      expect(buttons).toHaveLength(5);
    });

    test('renders expand toggle when more than 4 reactions', () => {
      render(
        <MobileQuickReactions
          reactions={defaultReactions}
        />
      );

      expect(screen.getByRole('button', { name: /show more reactions/i })).toBeInTheDocument();
    });

    test('does not render expand toggle with 4 or fewer reactions', () => {
      render(
        <MobileQuickReactions
          reactions={['like', 'love', 'laugh']}
        />
      );

      expect(screen.queryByRole('button', { name: /show more reactions/i })).not.toBeInTheDocument();
    });

    test('applies custom className', () => {
      const { container } = render(
        <MobileQuickReactions
          reactions={defaultReactions}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('renders with correct group role', () => {
      render(
        <MobileQuickReactions
          reactions={defaultReactions}
        />
      );

      expect(screen.getByRole('group', { name: /quick reactions/i })).toBeInTheDocument();
    });
  });

  describe('Expansion behavior', () => {
    test('expands to show all reactions on toggle', () => {
      render(
        <MobileQuickReactions
          reactions={defaultReactions}
        />
      );

      const expandButton = screen.getByRole('button', { name: /show more reactions/i });
      fireEvent.click(expandButton);

      const reactionButtons = screen.getAllByRole('button').filter(
        btn => btn.getAttribute('aria-label')?.includes('reaction') && !btn.getAttribute('aria-label')?.includes('Show')
      );
      expect(reactionButtons).toHaveLength(5);
    });

    test('collapses to show 4 reactions after expanding', () => {
      render(
        <MobileQuickReactions
          reactions={defaultReactions}
        />
      );

      const expandButton = screen.getByRole('button', { name: /show more reactions/i });

      fireEvent.click(expandButton);
      fireEvent.click(screen.getByRole('button', { name: /show fewer reactions/i }));

      const reactionButtons = screen.getAllByRole('button').filter(
        btn => btn.getAttribute('aria-label')?.includes('reaction') && !btn.getAttribute('aria-label')?.includes('Show')
      );
      expect(reactionButtons).toHaveLength(4);
    });

    test('updates expand button icon and label on toggle', () => {
      render(
        <MobileQuickReactions
          reactions={defaultReactions}
        />
      );

      const expandButton = screen.getByRole('button', { name: /show more reactions/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandButton);

      const collapseButton = screen.getByRole('button', { name: /show fewer reactions/i });
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('applies expanded class when expanded', () => {
      const { container } = render(
        <MobileQuickReactions
          reactions={defaultReactions}
        />
      );

      expect(container.firstChild).not.toHaveClass('expanded');

      fireEvent.click(screen.getByRole('button', { name: /show more reactions/i }));

      expect(container.firstChild).toHaveClass('expanded');
    });
  });

  describe('Reaction selection', () => {
    test('calls onReactionSelect with reaction data', () => {
      const mockOnSelect = jest.fn();
      render(
        <MobileQuickReactions
          reactions={['like']}
          onReactionSelect={mockOnSelect}
        />
      );

      const likeButton = screen.getByRole('button', { name: /like reaction/i });
      fireEvent.click(likeButton);

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'like' })
      );
    });

    test('highlights selected user reactions', () => {
      render(
        <MobileQuickReactions
          reactions={['like', 'love']}
          userReactions={['like']}
        />
      );

      const likeButton = screen.getByRole('button', { name: /like reaction/i });
      expect(likeButton).toHaveClass('selected');
      expect(likeButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('does not highlight non-selected reactions', () => {
      render(
        <MobileQuickReactions
          reactions={['like', 'love']}
          userReactions={['like']}
        />
      );

      const loveButton = screen.getByRole('button', { name: /love reaction/i });
      expect(loveButton).not.toHaveClass('selected');
      expect(loveButton).toHaveAttribute('aria-pressed', 'false');
    });
  });
});

describe('MobileReactionBar', () => {
  const mockProps = {
    contentType: 'post',
    contentId: 'post123',
    reactions: { like: 5, love: 3 },
    userReactions: ['like'],
    totalReactions: 8,
    reactionUsers: {
      like: ['user1', 'user2', 'user3'],
      love: ['user4', 'user5']
    }
  };

  describe('Basic rendering', () => {
    test('renders reaction bar with reactions', () => {
      render(<MobileReactionBar {...mockProps} />);

      expect(screen.getByRole('group', { name: /reactions/i })).toBeInTheDocument();
    });

    test('displays top reactions sorted by count', () => {
      render(<MobileReactionBar {...mockProps} />);

      const buttons = screen.getAllByRole('button').filter(
        btn => btn.className.includes('mobile-reaction-display')
      );

      expect(buttons).toHaveLength(2);
    });

    test('renders add reaction button', () => {
      render(<MobileReactionBar {...mockProps} />);

      expect(screen.getByRole('button', { name: /add reaction/i })).toBeInTheDocument();
    });

    test('applies compact class when compact prop is true', () => {
      const { container } = render(
        <MobileReactionBar {...mockProps} compact={true} />
      );

      expect(container.firstChild).toHaveClass('compact');
    });

    test('applies custom className', () => {
      const { container } = render(
        <MobileReactionBar {...mockProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('shows reaction metadata in non-compact mode', () => {
      render(<MobileReactionBar {...mockProps} compact={false} />);

      expect(screen.getByText(mockProps.totalReactions.toString())).toBeInTheDocument();
    });

    test('hides reaction metadata in compact mode', () => {
      const { container } = render(<MobileReactionBar {...mockProps} compact={true} />);

      expect(container.querySelector('.reaction-metadata')).not.toBeInTheDocument();
    });
  });

  describe('Reaction limiting', () => {
    test('limits visible reactions based on maxVisible prop', () => {
      const manyReactions = {
        like: 10,
        love: 8,
        laugh: 6,
        fire: 4,
        rocket: 2
      };

      render(
        <MobileReactionBar
          {...mockProps}
          reactions={manyReactions}
          totalReactions={30}
          maxVisible={3}
        />
      );

      const reactionButtons = screen.getAllByRole('button').filter(
        btn => btn.className.includes('mobile-reaction-display')
      );

      expect(reactionButtons.length).toBeLessThanOrEqual(3);
    });

    test('shows hidden reactions count when reactions exceed maxVisible', () => {
      const manyReactions = {
        like: 10,
        love: 8,
        laugh: 6,
        fire: 4,
        rocket: 2
      };

      render(
        <MobileReactionBar
          {...mockProps}
          reactions={manyReactions}
          totalReactions={30}
          maxVisible={2}
        />
      );

      expect(screen.getByText('6')).toBeInTheDocument();
    });

    test('does not show hidden count when all reactions are visible', () => {
      render(<MobileReactionBar {...mockProps} maxVisible={5} />);

      expect(screen.queryByText(/more reactions/i)).not.toBeInTheDocument();
    });
  });

  describe('Quick reactions popup', () => {
    test('shows quick reactions on add button click', () => {
      const { container } = render(<MobileReactionBar {...mockProps} />);

      const addButton = screen.getByRole('button', { name: /add reaction/i });
      fireEvent.click(addButton);

      expect(container.querySelector('.quick-reactions-popup')).toBeInTheDocument();
    });

    test('toggles quick reactions popup', () => {
      const { container } = render(<MobileReactionBar {...mockProps} />);

      const addButton = screen.getByRole('button', { name: /add reaction/i });

      fireEvent.click(addButton);
      expect(container.querySelector('.quick-reactions-popup')).toBeInTheDocument();

      fireEvent.click(addButton);
      expect(container.querySelector('.quick-reactions-popup')).not.toBeInTheDocument();
    });

    test('calls onShowPicker instead of showing quick reactions when provided', () => {
      const mockOnShowPicker = jest.fn();
      render(
        <MobileReactionBar
          {...mockProps}
          onShowPicker={mockOnShowPicker}
        />
      );

      const addButton = screen.getByRole('button', { name: /add reaction/i });
      fireEvent.click(addButton);

      expect(mockOnShowPicker).toHaveBeenCalled();
    });

    test('hides quick reactions after selecting a reaction', async () => {
      const { container } = render(<MobileReactionBar {...mockProps} />);

      const addButton = screen.getByRole('button', { name: /add reaction/i });
      fireEvent.click(addButton);

      const quickReaction = screen.getByRole('button', { name: /fire reaction/i });
      fireEvent.click(quickReaction);

      await waitFor(() => {
        expect(container.querySelector('.quick-reactions-popup')).not.toBeInTheDocument();
      });
    });
  });

  describe('Reaction toggling', () => {
    test('calls onReactionToggle when reaction is clicked', () => {
      const mockOnToggle = jest.fn();
      render(
        <MobileReactionBar
          {...mockProps}
          onReactionToggle={mockOnToggle}
        />
      );

      const likeButton = screen.getAllByRole('button').find(
        btn => btn.className.includes('mobile-reaction-display') && btn.className.includes('user-reacted')
      );

      fireEvent.touchStart(likeButton);
      act(() => jest.advanceTimersByTime(100));
      fireEvent.touchEnd(likeButton);

      expect(mockOnToggle).toHaveBeenCalled();
    });

    test('optimistically updates reaction count when adding', async () => {
      const mockOnToggle = jest.fn(() => Promise.resolve());
      render(
        <MobileReactionBar
          {...mockProps}
          reactions={{ like: 5 }}
          userReactions={[]}
          onReactionToggle={mockOnToggle}
        />
      );

      const addButton = screen.getByRole('button', { name: /add reaction/i });
      fireEvent.click(addButton);

      const loveButton = screen.getByRole('button', { name: /love reaction/i });
      fireEvent.click(loveButton);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalled();
      });
    });

    test('optimistically updates reaction count when removing', async () => {
      const mockOnToggle = jest.fn(() => Promise.resolve());
      render(
        <MobileReactionBar
          {...mockProps}
          onReactionToggle={mockOnToggle}
        />
      );

      const likeButton = screen.getAllByRole('button').find(
        btn => btn.className.includes('mobile-reaction-display') && btn.className.includes('user-reacted')
      );

      fireEvent.touchStart(likeButton);
      act(() => jest.advanceTimersByTime(100));
      fireEvent.touchEnd(likeButton);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalled();
      });
    });

    test('reverts optimistic update on error', async () => {
      const mockOnToggle = jest.fn(() => Promise.reject(new Error('Failed')));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <MobileReactionBar
          {...mockProps}
          onReactionToggle={mockOnToggle}
        />
      );

      const addButton = screen.getByRole('button', { name: /add reaction/i });
      fireEvent.click(addButton);

      const fireButton = screen.getByRole('button', { name: /fire reaction/i });
      fireEvent.click(fireButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Real-time updates', () => {
    test('sets up socket listener on mount', () => {
      render(<MobileReactionBar {...mockProps} />);

      expect(mockSocketOn).toHaveBeenCalledWith('reaction_update', expect.any(Function));
    });

    test('removes socket listener on unmount', () => {
      const { unmount } = render(<MobileReactionBar {...mockProps} />);

      unmount();

      expect(mockSocketOff).toHaveBeenCalledWith('reaction_update', expect.any(Function));
    });

    test('updates reaction count on REACTION_ADDED event', () => {
      render(<MobileReactionBar {...mockProps} />);

      const reactionHandler = mockSocketOn.mock.calls[0][1];

      act(() => {
        reactionHandler({
          type: 'REACTION_ADDED',
          contentType: 'post',
          contentId: 'post123',
          reactionType: 'fire',
          userId: 'otherUser'
        });
      });

      expect(screen.getByText(/reactions/i)).toBeInTheDocument();
    });

    test('updates reaction count on REACTION_REMOVED event', () => {
      render(<MobileReactionBar {...mockProps} />);

      const reactionHandler = mockSocketOn.mock.calls[0][1];

      act(() => {
        reactionHandler({
          type: 'REACTION_REMOVED',
          contentType: 'post',
          contentId: 'post123',
          reactionType: 'like',
          userId: 'otherUser'
        });
      });

      expect(screen.getByRole('group', { name: /reactions/i })).toBeInTheDocument();
    });

    test('updates user reactions when current user adds reaction', () => {
      render(<MobileReactionBar {...mockProps} />);

      const reactionHandler = mockSocketOn.mock.calls[0][1];

      act(() => {
        reactionHandler({
          type: 'REACTION_ADDED',
          contentType: 'post',
          contentId: 'post123',
          reactionType: 'love',
          userId: 'user123'
        });
      });

      expect(screen.getByRole('group', { name: /reactions/i })).toBeInTheDocument();
    });

    test('updates user reactions when current user removes reaction', () => {
      render(<MobileReactionBar {...mockProps} />);

      const reactionHandler = mockSocketOn.mock.calls[0][1];

      act(() => {
        reactionHandler({
          type: 'REACTION_REMOVED',
          contentType: 'post',
          contentId: 'post123',
          reactionType: 'like',
          userId: 'user123'
        });
      });

      expect(screen.getByRole('group', { name: /reactions/i })).toBeInTheDocument();
    });

    test('ignores updates for different content', () => {
      render(<MobileReactionBar {...mockProps} />);

      const reactionHandler = mockSocketOn.mock.calls[0][1];

      act(() => {
        reactionHandler({
          type: 'REACTION_ADDED',
          contentType: 'post',
          contentId: 'differentPost',
          reactionType: 'like',
          userId: 'user123'
        });
      });

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('does not set up socket listener when socket is not available', () => {
      delete window.socket;

      render(<MobileReactionBar {...mockProps} />);

      expect(mockSocketOn).not.toHaveBeenCalled();
    });
  });

  describe('Long press to view users', () => {
    test('calls onViewReactionUsers on long press', () => {
      const mockOnViewUsers = jest.fn();
      render(
        <MobileReactionBar
          {...mockProps}
          onViewReactionUsers={mockOnViewUsers}
        />
      );

      const likeButton = screen.getAllByRole('button').find(
        btn => btn.className.includes('mobile-reaction-display')
      );

      fireEvent.touchStart(likeButton);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockOnViewUsers).toHaveBeenCalledWith('like', mockProps.reactionUsers.like);
    });
  });

  describe('Props updates', () => {
    test('updates local state when reactions prop changes', () => {
      const { rerender } = render(<MobileReactionBar {...mockProps} />);

      rerender(
        <MobileReactionBar
          {...mockProps}
          reactions={{ like: 10, love: 5 }}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    test('updates local state when userReactions prop changes', () => {
      const { rerender } = render(<MobileReactionBar {...mockProps} />);

      rerender(
        <MobileReactionBar
          {...mockProps}
          userReactions={['like', 'love']}
        />
      );

      const reactedButtons = screen.getAllByRole('button').filter(
        btn => btn.className.includes('user-reacted')
      );

      expect(reactedButtons.length).toBeGreaterThan(0);
    });
  });
});

describe('MobileReactionSummary', () => {
  const mockReactions = {
    like: 10,
    love: 5,
    laugh: 3
  };

  describe('Rendering', () => {
    test('renders top 3 reactions', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
        />
      );

      const summaryReactions = container.querySelectorAll('.summary-reaction');
      expect(summaryReactions).toHaveLength(3);
    });

    test('displays total reaction count', () => {
      render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
        />
      );

      expect(screen.getByText('18')).toBeInTheDocument();
    });

    test('displays unique users count when different from total reactions', () => {
      render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
        />
      );

      expect(screen.getByText(/15/)).toBeInTheDocument();
    });

    test('does not display unique users when same as total reactions', () => {
      render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={18}
        />
      );

      const uniqueUsers = screen.queryByText(/• 18/);
      expect(uniqueUsers).not.toBeInTheDocument();
    });

    test('shows trending badge when trending is true', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
          trending={true}
        />
      );

      expect(container.querySelector('.trending-badge')).toBeInTheDocument();
    });

    test('does not show trending badge when trending is false', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
          trending={false}
        />
      );

      expect(container.querySelector('.trending-badge')).not.toBeInTheDocument();
    });

    test('renders view details button when onViewDetails provided', () => {
      const mockOnViewDetails = jest.fn();
      render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
          onViewDetails={mockOnViewDetails}
        />
      );

      expect(screen.getByRole('button', { name: /view reaction details/i })).toBeInTheDocument();
    });

    test('does not render view details button when onViewDetails not provided', () => {
      render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
        />
      );

      expect(screen.queryByRole('button', { name: /view reaction details/i })).not.toBeInTheDocument();
    });

    test('calls onViewDetails when button clicked', () => {
      const mockOnViewDetails = jest.fn();
      render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
          onViewDetails={mockOnViewDetails}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /view reaction details/i }));

      expect(mockOnViewDetails).toHaveBeenCalled();
    });

    test('applies custom className', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    test('applies trending class when trending', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={mockReactions}
          totalUsers={15}
          trending={true}
        />
      );

      expect(container.firstChild).toHaveClass('trending');
    });
  });

  describe('Edge cases', () => {
    test('returns null when no reactions', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={{}}
          totalUsers={0}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('returns null when all reaction counts are 0', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={{ like: 0, love: 0 }}
          totalUsers={0}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    test('sorts reactions by count descending', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={{ laugh: 2, like: 10, love: 5 }}
          totalUsers={15}
        />
      );

      const counts = Array.from(container.querySelectorAll('.summary-count')).map(
        el => parseInt(el.textContent)
      );

      expect(counts).toEqual([10, 5, 2]);
    });

    test('handles reactions without matching DEFAULT_REACTIONS', () => {
      const { container } = render(
        <MobileReactionSummary
          reactions={{ customReaction: 5 }}
          totalUsers={5}
        />
      );

      expect(container.querySelector('.summary-reaction')).toBeInTheDocument();
    });
  });
});

export default mockVibrate
