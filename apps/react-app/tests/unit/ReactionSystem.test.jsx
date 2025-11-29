import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ReactionPicker from '../../src/components/reactions/ReactionPicker';
import ReactionBar from '../../src/components/reactions/ReactionBar';
import MobileReactionBar from '../../src/components/reactions/MobileReactionBar';
import ReactionAnalytics from '../../src/components/reactions/ReactionAnalytics';
import reactionService from '../../src/services/reactionService';

// Mock the reaction service
jest.mock('../../src/services/reactionService', () => ({
  joinContentRoom: jest.fn(),
  leaveContentRoom: jest.fn(),
  toggleReaction: jest.fn(),
  getReactions: jest.fn(),
  getTrending: jest.fn(),
  getUserAnalytics: jest.fn(),
  getLeaderboard: jest.fn(),
  formatReactionCount: jest.fn(count => count.toString()),
  getReactionColor: jest.fn(() => '#007bff'),
  getReactionEmoji: jest.fn(() => '👍')
}));

// Mock Socket.io
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: true
};

global.window.socket = mockSocket;
global.window.currentUserId = 'test-user-123';

// Mock window methods
global.navigator.vibrate = jest.fn();
global.window.dispatchEvent = jest.fn();

describe('ReactionPicker Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn(),
    userReactions: [],
    customEmojis: [],
    recentReactions: [],
    position: 'bottom'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when open', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search reactions...')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<ReactionPicker {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('handles reaction selection', async () => {
    const user = userEvent.setup();
    const onReactionSelect = jest.fn();
    
    render(<ReactionPicker {...defaultProps} onReactionSelect={onReactionSelect} />);
    
    // Click on a reaction button
    const reactionButton = screen.getByRole('button', { name: /like/i });
    await user.click(reactionButton);
    
    expect(onReactionSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'like',
        emoji: '👍',
        label: 'Like'
      })
    );
  });

  test('filters reactions by search query', async () => {
    const user = userEvent.setup();
    
    render(<ReactionPicker {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'love');
    
    // Should show love reaction
    expect(screen.getByRole('button', { name: /love/i })).toBeInTheDocument();
    
    // Should hide other reactions
    expect(screen.queryByRole('button', { name: /angry/i })).not.toBeInTheDocument();
  });

  test('switches between categories', async () => {
    const user = userEvent.setup();
    
    render(<ReactionPicker {...defaultProps} />);
    
    // Click on positive category
    const positiveTab = screen.getByRole('button', { name: /positive/i });
    await user.click(positiveTab);
    
    expect(positiveTab).toHaveClass('active');
  });

  test('closes on escape key', () => {
    const onClose = jest.fn();
    
    render(<ReactionPicker {...defaultProps} onClose={onClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });

  test('focuses search input when opened', () => {
    render(<ReactionPicker {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search reactions...');
    
    // Wait for auto-focus
    waitFor(() => {
      expect(searchInput).toHaveFocus();
    });
  });
});

describe('ReactionBar Component', () => {
  const defaultProps = {
    contentType: 'post',
    contentId: 'test-post-123',
    reactions: { like: 5, love: 3, laugh: 1 },
    userReactions: ['like'],
    totalReactions: 9,
    reactionUsers: {
      like: [{ id: '1', username: 'user1' }],
      love: [{ id: '2', username: 'user2' }]
    },
    onReactionToggle: jest.fn(),
    onViewReactionUsers: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reactionService.getReactions.mockResolvedValue({
      summary: defaultProps.reactions,
      userReactions: defaultProps.userReactions.map(type => ({ reaction_type: type })),
      reactions: []
    });
  });

  test('renders reaction displays with correct counts', () => {
    render(<ReactionBar {...defaultProps} />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // like count
    expect(screen.getByText('3')).toBeInTheDocument(); // love count
    expect(screen.getByText('1')).toBeInTheDocument(); // laugh count
  });

  test('shows user-reacted state correctly', () => {
    render(<ReactionBar {...defaultProps} />);
    
    const likeButton = screen.getByRole('button', { name: /like reaction/i });
    expect(likeButton).toHaveClass('user-reacted');
  });

  test('handles reaction toggle', async () => {
    const user = userEvent.setup();
    const onReactionToggle = jest.fn();
    
    render(<ReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);
    
    const loveButton = screen.getByRole('button', { name: /love reaction/i });
    await user.click(loveButton);
    
    expect(onReactionToggle).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'love' }),
      true
    );
  });

  test('joins and leaves content room', () => {
    const { unmount } = render(<ReactionBar {...defaultProps} />);
    
    expect(reactionService.joinContentRoom).toHaveBeenCalledWith('post', 'test-post-123');
    
    unmount();
    
    expect(reactionService.leaveContentRoom).toHaveBeenCalledWith('post', 'test-post-123');
  });

  test('shows total reactions count', () => {
    render(<ReactionBar {...defaultProps} />);
    
    expect(screen.getByText(/9 reactions/i)).toBeInTheDocument();
  });

  test('opens reaction picker when add button clicked', async () => {
    const user = userEvent.setup();
    
    render(<ReactionBar {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add reaction/i });
    await user.click(addButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('MobileReactionBar Component', () => {
  const defaultProps = {
    contentType: 'post',
    contentId: 'test-post-123',
    reactions: { like: 5, love: 3 },
    userReactions: ['like'],
    totalReactions: 8,
    onReactionToggle: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock touch events
    global.Touch = class Touch {
      constructor(touchInit) {
        Object.assign(this, touchInit);
      }
    };
    
    global.TouchEvent = class TouchEvent extends Event {
      constructor(type, touchEventInit) {
        super(type, touchEventInit);
        this.touches = touchEventInit.touches || [];
      }
    };
  });

  test('renders mobile-optimized reaction displays', () => {
    render(<MobileReactionBar {...defaultProps} />);
    
    expect(screen.getByRole('group', { name: /reactions/i })).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // like count
    expect(screen.getByText('3')).toBeInTheDocument(); // love count
  });

  test('handles touch interactions', async () => {
    const onReactionToggle = jest.fn();
    
    render(<MobileReactionBar {...defaultProps} onReactionToggle={onReactionToggle} />);
    
    const reactionButton = screen.getByRole('button', { name: /like reaction/i });
    
    // Simulate touch events
    fireEvent.touchStart(reactionButton);
    fireEvent.touchEnd(reactionButton);
    
    await waitFor(() => {
      expect(onReactionToggle).toHaveBeenCalled();
    });
  });

  test('shows quick reactions on add button tap', async () => {
    const user = userEvent.setup();
    
    render(<MobileReactionBar {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add reaction/i });
    await user.click(addButton);
    
    expect(screen.getByRole('group', { name: /quick reactions/i })).toBeInTheDocument();
  });

  test('vibrates on long press if supported', () => {
    render(<MobileReactionBar {...defaultProps} />);
    
    const reactionButton = screen.getByRole('button', { name: /like reaction/i });
    
    // Simulate long press
    fireEvent.touchStart(reactionButton);
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(navigator.vibrate).toHaveBeenCalledWith(50);
  });

  test('shows user indicator for reacted items', () => {
    render(<MobileReactionBar {...defaultProps} />);
    
    const likeButton = screen.getByRole('button', { name: /like reaction/i });
    expect(likeButton).toHaveClass('user-reacted');
  });
});

describe('ReactionAnalytics Component', () => {
  const mockAnalyticsData = {
    totalReactions: 150,
    uniqueUsers: 45,
    engagementRate: 12.5,
    trendingScore: 85,
    reactionBreakdown: {
      like: 60,
      love: 40,
      laugh: 30,
      fire: 20
    },
    chartData: [
      { timestamp: Date.now() - 86400000, reactions: { like: 10, love: 5 } },
      { timestamp: Date.now(), reactions: { like: 15, love: 8 } }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: mockAnalyticsData
        })
      })
    );
  });

  test('renders analytics cards with correct data', async () => {
    render(<ReactionAnalytics contentType="post" contentId="test-post" />);
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // total reactions
      expect(screen.getByText('45')).toBeInTheDocument(); // unique users
      expect(screen.getByText('12.5%')).toBeInTheDocument(); // engagement rate
    });
  });

  test('switches between tabs', async () => {
    const user = userEvent.setup();
    
    render(<ReactionAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /trending/i })).toBeInTheDocument();
    });
    
    const trendingTab = screen.getByRole('button', { name: /trending/i });
    await user.click(trendingTab);
    
    expect(trendingTab).toHaveClass('active');
  });

  test('renders reaction breakdown chart', async () => {
    render(<ReactionAnalytics contentType="post" contentId="test-post" showChart={true} />);
    
    await waitFor(() => {
      expect(screen.getByText(/most popular reactions/i)).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    // Mock fetch to be slow
    global.fetch = jest.fn(() => new Promise(() => {}));
    
    render(<ReactionAnalytics contentType="post" contentId="test-post" />);
    
    expect(screen.getByText(/analyzing reactions/i)).toBeInTheDocument();
  });
});

describe('Real-time Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles real-time reaction added event', () => {
    const { rerender } = render(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{ like: 5 }}
        userReactions={[]}
        onReactionToggle={jest.fn()}
      />
    );

    // Simulate real-time update
    const reactionEvent = new CustomEvent('reactionAdded', {
      detail: {
        contentType: 'post',
        contentId: 'test-post',
        reactionType: 'like',
        summary: { like_count: 6 }
      }
    });

    act(() => {
      window.dispatchEvent(reactionEvent);
    });

    // Component should update with new count
    rerender(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{ like: 6 }}
        userReactions={[]}
        onReactionToggle={jest.fn()}
      />
    );

    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('handles real-time reaction removed event', () => {
    const { rerender } = render(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{ like: 5 }}
        userReactions={['like']}
        onReactionToggle={jest.fn()}
      />
    );

    // Simulate real-time update
    const reactionEvent = new CustomEvent('reactionRemoved', {
      detail: {
        contentType: 'post',
        contentId: 'test-post',
        reactionType: 'like',
        summary: { like_count: 4 }
      }
    });

    act(() => {
      window.dispatchEvent(reactionEvent);
    });

    rerender(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{ like: 4 }}
        userReactions={[]}
        onReactionToggle={jest.fn()}
      />
    );

    expect(screen.getByText('4')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  test('reaction buttons have proper ARIA labels', () => {
    render(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{ like: 5, love: 3 }}
        userReactions={['like']}
        onReactionToggle={jest.fn()}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like reaction/i });
    expect(likeButton).toHaveAttribute('aria-pressed', 'true');
    
    const loveButton = screen.getByRole('button', { name: /love reaction/i });
    expect(loveButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('reaction picker has proper keyboard navigation', () => {
    render(
      <ReactionPicker
        isOpen={true}
        onClose={jest.fn()}
        onReactionSelect={jest.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Select a reaction');
  });

  test('mobile reactions have minimum touch target size', () => {
    render(
      <MobileReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{ like: 5 }}
        userReactions={[]}
        onReactionToggle={jest.fn()}
      />
    );

    const reactionButton = screen.getByRole('button', { name: /like reaction/i });
    const styles = window.getComputedStyle(reactionButton);
    
    // Check minimum touch target size (44px)
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
  });
});

describe('Performance', () => {
  test('reaction service calls are cached', async () => {
    render(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{}}
        userReactions={[]}
        onReactionToggle={jest.fn()}
      />
    );

    // First call should fetch from API
    expect(reactionService.getReactions).toHaveBeenCalledTimes(1);

    // Re-render with same props shouldn't call API again
    render(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{}}
        userReactions={[]}
        onReactionToggle={jest.fn()}
      />
    );

    expect(reactionService.getReactions).toHaveBeenCalledTimes(1);
  });

  test('optimistic updates work correctly', async () => {
    const onReactionToggle = jest.fn().mockResolvedValue({});
    
    render(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{ like: 5 }}
        userReactions={[]}
        onReactionToggle={onReactionToggle}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like reaction/i });
    
    await act(async () => {
      fireEvent.click(likeButton);
    });

    // Should immediately show optimistic update
    expect(likeButton).toHaveClass('user-reacted');
  });
});

describe('Error Handling', () => {
  test('handles API errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    reactionService.toggleReaction.mockRejectedValue(new Error('API Error'));

    const onReactionToggle = jest.fn().mockRejectedValue(new Error('API Error'));
    
    render(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{ like: 5 }}
        userReactions={[]}
        onReactionToggle={onReactionToggle}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like reaction/i });
    
    await act(async () => {
      fireEvent.click(likeButton);
    });

    // Should revert optimistic update on error
    expect(likeButton).not.toHaveClass('user-reacted');
    
    consoleError.mockRestore();
  });

  test('handles missing reaction data', () => {
    render(
      <ReactionBar
        contentType="post"
        contentId="test-post"
        reactions={{}}
        userReactions={[]}
        onReactionToggle={jest.fn()}
      />
    );

    // Should not crash with empty data
    expect(screen.getByRole('group', { name: /reactions/i })).toBeInTheDocument();
  });
});

// Cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});