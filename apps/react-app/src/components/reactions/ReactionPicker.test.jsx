import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ReactionPicker, { QuickReactionBar, ReactionButton, DEFAULT_REACTIONS } from './ReactionPicker';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Heart: () => <div data-testid="icon-heart">Heart</div>,
  Laugh: () => <div data-testid="icon-laugh">Laugh</div>,
  ThumbsUp: () => <div data-testid="icon-thumbs-up">ThumbsUp</div>,
  ThumbsDown: () => <div data-testid="icon-thumbs-down">ThumbsDown</div>,
  Fire: () => <div data-testid="icon-fire">Fire</div>,
  Rocket: () => <div data-testid="icon-rocket">Rocket</div>,
  Eye: () => <div data-testid="icon-eye">Eye</div>,
  Brain: () => <div data-testid="icon-brain">Brain</div>,
  Angry: () => <div data-testid="icon-angry">Angry</div>,
  Frown: () => <div data-testid="icon-frown">Frown</div>,
  Plus: ({ size }) => <div data-testid="icon-plus" data-size={size}>Plus</div>,
  Search: ({ size }) => <div data-testid="icon-search" data-size={size}>Search</div>,
  Star: () => <div data-testid="icon-star">Star</div>,
  Clock: () => <div data-testid="icon-clock">Clock</div>,
}));

// Mock CSS imports
jest.mock('./ReactionPicker.css', () => ({}));

describe('ReactionButton', () => {
  const mockReaction = {
    type: 'like',
    emoji: '👍',
    label: 'Like',
    color: '#1da1f2',
    category: 'positive'
  };

  it('should render reaction button with emoji', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  it('should render reaction button with label by default', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    expect(screen.getByText('Like')).toBeInTheDocument();
  });

  it('should hide label when showLabel is false', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} showLabel={false} />);

    expect(screen.queryByText('Like')).not.toBeInTheDocument();
  });

  it('should hide label for small size', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} size="small" />);

    expect(screen.queryByText('Like')).not.toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockReaction);
  });

  it('should apply selected class when isSelected is true', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} isSelected={true} />);

    expect(screen.getByRole('button')).toHaveClass('selected');
  });

  it('should apply size class', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} size="large" />);

    expect(screen.getByRole('button')).toHaveClass('large');
  });

  it('should set title attribute', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    expect(screen.getByRole('button')).toHaveAttribute('title', 'Like');
  });

  it('should apply custom color CSS variable', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ '--reaction-color': '#1da1f2' });
  });

  it('should update hover scale on mouse enter', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);

    expect(button).toHaveStyle({ '--reaction-hover-scale': '1.2' });
  });

  it('should reset hover scale on mouse leave', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(button).toHaveStyle({ '--reaction-hover-scale': '1' });
  });

  it('should apply pressed class temporarily on click', () => {
    jest.useFakeTimers();
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toHaveClass('pressed');

    jest.advanceTimersByTime(150);
    expect(button).not.toHaveClass('pressed');

    jest.useRealTimers();
  });

  it('should render ripple effect when pressed', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button').querySelector('.reaction-ripple')).toBeInTheDocument();
  });

  it('should render glow effect when hovered', () => {
    const onSelect = jest.fn();
    render(<ReactionButton reaction={mockReaction} onSelect={onSelect} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);

    const glow = button.querySelector('.reaction-glow');
    expect(glow).toBeInTheDocument();
    expect(glow).toHaveStyle({ backgroundColor: '#1da1f2' });
  });
});

describe('QuickReactionBar', () => {
  const mockReactions = DEFAULT_REACTIONS.slice(0, 8);
  const mockOnReactionSelect = jest.fn();

  it('should render first 6 reactions', () => {
    render(
      <QuickReactionBar
        reactions={mockReactions}
        userReactions={[]}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    const buttons = screen.getAllByRole('button').filter(btn => !btn.classList.contains('more-reactions-btn'));
    expect(buttons).toHaveLength(6);
  });

  it('should render more reactions button', () => {
    render(
      <QuickReactionBar
        reactions={mockReactions}
        userReactions={[]}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    expect(screen.getByTitle('More reactions')).toBeInTheDocument();
  });

  it('should mark selected reactions', () => {
    render(
      <QuickReactionBar
        reactions={mockReactions}
        userReactions={['like', 'love']}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    const buttons = screen.getAllByRole('button').filter(btn => !btn.classList.contains('more-reactions-btn'));
    const selectedButtons = buttons.filter(btn => btn.classList.contains('selected'));
    expect(selectedButtons).toHaveLength(2);
  });

  it('should call onReactionSelect when reaction is clicked', () => {
    render(
      <QuickReactionBar
        reactions={mockReactions}
        userReactions={[]}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    const firstButton = screen.getAllByRole('button').filter(btn => !btn.classList.contains('more-reactions-btn'))[0];
    fireEvent.click(firstButton);

    expect(mockOnReactionSelect).toHaveBeenCalledWith(mockReactions[0]);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <QuickReactionBar
        reactions={mockReactions}
        userReactions={[]}
        onReactionSelect={mockOnReactionSelect}
        className="custom-class"
      />
    );

    expect(container.querySelector('.quick-reaction-bar')).toHaveClass('custom-class');
  });

  it('should render reactions with small size', () => {
    render(
      <QuickReactionBar
        reactions={mockReactions}
        userReactions={[]}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    const buttons = screen.getAllByRole('button').filter(btn => !btn.classList.contains('more-reactions-btn'));
    buttons.forEach(button => {
      expect(button).toHaveClass('small');
    });
  });

  it('should not show labels for reactions', () => {
    render(
      <QuickReactionBar
        reactions={mockReactions}
        userReactions={[]}
        onReactionSelect={mockOnReactionSelect}
      />
    );

    mockReactions.slice(0, 6).forEach(reaction => {
      expect(screen.queryByText(reaction.label)).not.toBeInTheDocument();
    });
  });
});

describe('ReactionPicker - Rendering', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn(),
    userReactions: [],
    customEmojis: [],
    recentReactions: []
  };

  it('should render nothing when isOpen is false', () => {
    const { container } = render(<ReactionPicker {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render picker when isOpen is true', () => {
    render(<ReactionPicker {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render with aria-label', () => {
    render(<ReactionPicker {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Select a reaction');
  });

  it('should apply custom className', () => {
    const { container } = render(<ReactionPicker {...defaultProps} className="custom-picker" />);
    expect(container.querySelector('.reaction-picker-overlay')).toHaveClass('custom-picker');
  });

  it('should render search input', () => {
    render(<ReactionPicker {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search reactions...')).toBeInTheDocument();
  });

  it('should render search icon', () => {
    render(<ReactionPicker {...defaultProps} />);
    expect(screen.getByTestId('icon-search')).toBeInTheDocument();
  });

  it('should render category tabs', () => {
    render(<ReactionPicker {...defaultProps} />);
    expect(screen.getByText('Recently Used')).toBeInTheDocument();
    expect(screen.getByText('Positive')).toBeInTheDocument();
    expect(screen.getByText('Negative')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('should render keyboard shortcuts in footer', () => {
    render(<ReactionPicker {...defaultProps} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.getByText('Navigate')).toBeInTheDocument();
  });

  it('should render background particles', () => {
    const { container } = render(<ReactionPicker {...defaultProps} />);
    const particles = container.querySelectorAll('.background-particle');
    expect(particles).toHaveLength(5);
  });
});

describe('ReactionPicker - Positioning', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should apply bottom position by default', () => {
    render(<ReactionPicker {...defaultProps} />);
    expect(screen.getByRole('dialog')).toHaveClass('position-bottom');
  });

  it('should apply top position', () => {
    render(<ReactionPicker {...defaultProps} position="top" />);
    expect(screen.getByRole('dialog')).toHaveClass('position-top');
  });

  it('should apply left position', () => {
    render(<ReactionPicker {...defaultProps} position="left" />);
    expect(screen.getByRole('dialog')).toHaveClass('position-left');
  });

  it('should apply right position', () => {
    render(<ReactionPicker {...defaultProps} position="right" />);
    expect(screen.getByRole('dialog')).toHaveClass('position-right');
  });

  it('should fallback to bottom position for invalid position', () => {
    render(<ReactionPicker {...defaultProps} position="invalid" />);
    expect(screen.getByRole('dialog')).toHaveClass('position-bottom');
  });
});

describe('ReactionPicker - Categories', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should start with recent category active', () => {
    render(<ReactionPicker {...defaultProps} />);
    const recentTab = screen.getByText('Recently Used').closest('button');
    expect(recentTab).toHaveClass('active');
  });

  it('should switch to positive category', () => {
    render(<ReactionPicker {...defaultProps} />);
    const positiveTab = screen.getByText('Positive').closest('button');
    fireEvent.click(positiveTab);
    expect(positiveTab).toHaveClass('active');
  });

  it('should switch to negative category', () => {
    render(<ReactionPicker {...defaultProps} />);
    const negativeTab = screen.getByText('Negative').closest('button');
    fireEvent.click(negativeTab);
    expect(negativeTab).toHaveClass('active');
  });

  it('should switch to neutral category', () => {
    render(<ReactionPicker {...defaultProps} />);
    const neutralTab = screen.getByText('Neutral').closest('button');
    fireEvent.click(neutralTab);
    expect(neutralTab).toHaveClass('active');
  });

  it('should switch to custom category', () => {
    render(<ReactionPicker {...defaultProps} />);
    const customTab = screen.getByText('Custom').closest('button');
    fireEvent.click(customTab);
    expect(customTab).toHaveClass('active');
  });

  it('should render category icons', () => {
    render(<ReactionPicker {...defaultProps} />);
    expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
    expect(screen.getByTestId('icon-heart')).toBeInTheDocument();
    expect(screen.getByTestId('icon-frown')).toBeInTheDocument();
    expect(screen.getByTestId('icon-brain')).toBeInTheDocument();
    expect(screen.getByTestId('icon-star')).toBeInTheDocument();
  });

  it('should filter reactions by positive category', () => {
    render(<ReactionPicker {...defaultProps} />);
    fireEvent.click(screen.getByText('Positive').closest('button'));

    const positiveReactions = DEFAULT_REACTIONS.filter(r => r.category === 'positive');
    positiveReactions.forEach(reaction => {
      expect(screen.getByText(reaction.label)).toBeInTheDocument();
    });
  });

  it('should filter reactions by negative category', () => {
    render(<ReactionPicker {...defaultProps} />);
    fireEvent.click(screen.getByText('Negative').closest('button'));

    const negativeReactions = DEFAULT_REACTIONS.filter(r => r.category === 'negative');
    negativeReactions.forEach(reaction => {
      expect(screen.getByText(reaction.label)).toBeInTheDocument();
    });
  });

  it('should filter reactions by neutral category', () => {
    render(<ReactionPicker {...defaultProps} />);
    fireEvent.click(screen.getByText('Neutral').closest('button'));

    const neutralReactions = DEFAULT_REACTIONS.filter(r => r.category === 'neutral');
    neutralReactions.forEach(reaction => {
      expect(screen.getByText(reaction.label)).toBeInTheDocument();
    });
  });
});

describe('ReactionPicker - Search Functionality', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should filter reactions by label search', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'like');

    expect(screen.getByText('Like')).toBeInTheDocument();
  });

  it('should filter reactions case-insensitively', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'LOVE');

    expect(screen.getByText('Love')).toBeInTheDocument();
  });

  it('should show no reactions message when no matches found', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No reactions found')).toBeInTheDocument();
  });

  it('should show clear search button when no matches found', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('Clear search')).toBeInTheDocument();
  });

  it('should clear search when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'nonexistent');

    fireEvent.click(screen.getByText('Clear search'));

    expect(searchInput).toHaveValue('');
  });

  it('should filter by emoji character', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, '👍');

    expect(screen.getByText('Like')).toBeInTheDocument();
  });

  it('should update filtered reactions when category changes', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'sad');

    fireEvent.click(screen.getByText('Negative').closest('button'));

    expect(screen.getByText('Sad')).toBeInTheDocument();
  });

  it('should focus search input when picker opens', async () => {
    jest.useFakeTimers();

    const { rerender } = render(<ReactionPicker {...defaultProps} isOpen={false} />);

    rerender(<ReactionPicker {...defaultProps} isOpen={true} />);

    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search reactions...')).toHaveFocus();
    });

    jest.useRealTimers();
  });
});

describe('ReactionPicker - Recent Reactions', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should display custom recent reactions when provided', () => {
    const recentReactions = [
      { type: 'fire', emoji: '🔥', label: 'Fire', color: '#ff5722', category: 'positive' },
      { type: 'rocket', emoji: '🚀', label: 'Rocket', color: '#3f51b5', category: 'positive' }
    ];

    render(<ReactionPicker {...defaultProps} recentReactions={recentReactions} />);

    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Rocket')).toBeInTheDocument();
  });

  it('should show default reactions when no recent reactions provided', () => {
    render(<ReactionPicker {...defaultProps} recentReactions={[]} />);

    const firstTwelve = DEFAULT_REACTIONS.slice(0, 12);
    expect(screen.getByText(firstTwelve[0].label)).toBeInTheDocument();
  });

  it('should show recent category by default', () => {
    render(<ReactionPicker {...defaultProps} />);

    const recentTab = screen.getByText('Recently Used').closest('button');
    expect(recentTab).toHaveClass('active');
  });
});

describe('ReactionPicker - Emoji Selection', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should call onReactionSelect when reaction is clicked', () => {
    const onReactionSelect = jest.fn();
    render(<ReactionPicker {...defaultProps} onReactionSelect={onReactionSelect} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));
    fireEvent.click(screen.getByText('Like'));

    expect(onReactionSelect).toHaveBeenCalled();
  });

  it('should close picker after selection', () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    render(<ReactionPicker {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));
    fireEvent.click(screen.getByText('Like'));

    jest.advanceTimersByTime(200);

    expect(onClose).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should pass correct reaction object to onReactionSelect', () => {
    const onReactionSelect = jest.fn();
    render(<ReactionPicker {...defaultProps} onReactionSelect={onReactionSelect} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));
    fireEvent.click(screen.getByText('Like'));

    expect(onReactionSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'like',
        emoji: '👍',
        label: 'Like'
      })
    );
  });

  it('should mark selected reactions', () => {
    render(<ReactionPicker {...defaultProps} userReactions={['like']} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    const likeButton = screen.getByText('Like').closest('button');
    expect(likeButton).toHaveClass('selected');
  });

  it('should apply animating class when reaction is selected', () => {
    render(<ReactionPicker {...defaultProps} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    const reactionGridItem = screen.getByText('Like').closest('.reaction-grid-item');
    fireEvent.click(screen.getByText('Like'));

    expect(reactionGridItem).toHaveClass('animating');
  });

  it('should handle multiple selected reactions', () => {
    render(<ReactionPicker {...defaultProps} userReactions={['like', 'love', 'fire']} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    const selectedButtons = screen.getAllByRole('button').filter(btn => btn.classList.contains('selected'));
    expect(selectedButtons.length).toBeGreaterThan(0);
  });
});

describe('ReactionPicker - Custom Emoji Support', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should display custom emojis in custom category', () => {
    const customEmojis = [
      { type: 'custom1', emoji: '🎉', label: 'Party', color: '#ff0000', category: 'custom' },
      { type: 'custom2', emoji: '🎊', label: 'Celebration', color: '#00ff00', category: 'custom' }
    ];

    render(<ReactionPicker {...defaultProps} customEmojis={customEmojis} />);

    fireEvent.click(screen.getByText('Custom').closest('button'));

    expect(screen.getByText('Party')).toBeInTheDocument();
    expect(screen.getByText('Celebration')).toBeInTheDocument();
  });

  it('should show add custom emoji button when no custom emojis', () => {
    render(<ReactionPicker {...defaultProps} customEmojis={[]} />);

    fireEvent.click(screen.getByText('Custom').closest('button'));

    expect(screen.getByText('Add Custom Emoji')).toBeInTheDocument();
  });

  it('should not show add custom emoji button in other categories', () => {
    render(<ReactionPicker {...defaultProps} customEmojis={[]} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    expect(screen.queryByText('Add Custom Emoji')).not.toBeInTheDocument();
  });

  it('should handle custom emoji selection', () => {
    const onReactionSelect = jest.fn();
    const customEmojis = [
      { type: 'custom1', emoji: '🎉', label: 'Party', color: '#ff0000', category: 'custom' }
    ];

    render(<ReactionPicker {...defaultProps} customEmojis={customEmojis} onReactionSelect={onReactionSelect} />);

    fireEvent.click(screen.getByText('Custom').closest('button'));
    fireEvent.click(screen.getByText('Party'));

    expect(onReactionSelect).toHaveBeenCalledWith(customEmojis[0]);
  });

  it('should filter custom emojis by search', async () => {
    const user = userEvent.setup();
    const customEmojis = [
      { type: 'custom1', emoji: '🎉', label: 'Party', color: '#ff0000', category: 'custom' },
      { type: 'custom2', emoji: '🎊', label: 'Celebration', color: '#00ff00', category: 'custom' }
    ];

    render(<ReactionPicker {...defaultProps} customEmojis={customEmojis} />);

    fireEvent.click(screen.getByText('Custom').closest('button'));

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'party');

    expect(screen.getByText('Party')).toBeInTheDocument();
    expect(screen.queryByText('Celebration')).not.toBeInTheDocument();
  });
});

describe('ReactionPicker - Keyboard Navigation', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should close picker on Escape key', () => {
    const onClose = jest.fn();
    render(<ReactionPicker {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('should prevent default on Tab key', () => {
    render(<ReactionPicker {...defaultProps} />);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not handle keyboard events when picker is closed', () => {
    const onClose = jest.fn();
    render(<ReactionPicker {...defaultProps} isOpen={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should render keyboard shortcuts hints', () => {
    render(<ReactionPicker {...defaultProps} />);

    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });
});

describe('ReactionPicker - Outside Click', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should close picker when clicking outside', () => {
    const onClose = jest.fn();
    render(<ReactionPicker {...defaultProps} onClose={onClose} />);

    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalled();
  });

  it('should not close when clicking inside picker', () => {
    const onClose = jest.fn();
    render(<ReactionPicker {...defaultProps} onClose={onClose} />);

    const picker = screen.getByRole('dialog');
    fireEvent.mouseDown(picker);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not add event listener when picker is closed', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    render(<ReactionPicker {...defaultProps} isOpen={false} />);

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('mousedown', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('should clean up event listener when picker closes', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { rerender } = render(<ReactionPicker {...defaultProps} isOpen={true} />);
    rerender(<ReactionPicker {...defaultProps} isOpen={false} />);

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});

describe('ReactionPicker - Hover Effects', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should show tooltip on reaction hover', () => {
    render(<ReactionPicker {...defaultProps} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    const reactionGridItem = screen.getByText('Like').closest('.reaction-grid-item');
    fireEvent.mouseEnter(reactionGridItem);

    const tooltip = reactionGridItem.querySelector('.reaction-tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('should hide tooltip on reaction mouse leave', () => {
    render(<ReactionPicker {...defaultProps} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    const reactionGridItem = screen.getByText('Like').closest('.reaction-grid-item');
    fireEvent.mouseEnter(reactionGridItem);
    fireEvent.mouseLeave(reactionGridItem);

    const tooltip = reactionGridItem.querySelector('.reaction-tooltip');
    expect(tooltip).not.toBeInTheDocument();
  });

  it('should show emoji in tooltip', () => {
    render(<ReactionPicker {...defaultProps} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    const reactionGridItem = screen.getByText('Like').closest('.reaction-grid-item');
    fireEvent.mouseEnter(reactionGridItem);

    const tooltip = reactionGridItem.querySelector('.reaction-tooltip');
    expect(tooltip.querySelector('.tooltip-emoji')).toBeInTheDocument();
  });

  it('should show label in tooltip', () => {
    render(<ReactionPicker {...defaultProps} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    const reactionGridItem = screen.getByText('Like').closest('.reaction-grid-item');
    fireEvent.mouseEnter(reactionGridItem);

    const tooltip = reactionGridItem.querySelector('.reaction-tooltip');
    expect(tooltip.querySelector('.tooltip-label')).toHaveTextContent('Like');
  });

  it('should show usage count in tooltip when available', () => {
    const recentReactions = [
      { type: 'like', emoji: '👍', label: 'Like', color: '#1da1f2', category: 'positive', usage_count: 42 }
    ];

    render(<ReactionPicker {...defaultProps} recentReactions={recentReactions} />);

    const reactionGridItem = screen.getByText('Like').closest('.reaction-grid-item');
    fireEvent.mouseEnter(reactionGridItem);

    expect(screen.getByText('Used 42 times')).toBeInTheDocument();
  });
});

describe('ReactionPicker - Grid Layout', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should render reaction grid', () => {
    const { container } = render(<ReactionPicker {...defaultProps} />);
    expect(container.querySelector('.reaction-grid')).toBeInTheDocument();
  });

  it('should render reaction grid items', () => {
    const { container } = render(<ReactionPicker {...defaultProps} />);

    const gridItems = container.querySelectorAll('.reaction-grid-item');
    expect(gridItems.length).toBeGreaterThan(0);
  });

  it('should render reactions with unique keys', () => {
    render(<ReactionPicker {...defaultProps} />);

    fireEvent.click(screen.getByText('Positive').closest('button'));

    const positiveReactions = DEFAULT_REACTIONS.filter(r => r.category === 'positive');
    positiveReactions.forEach(reaction => {
      expect(screen.getByText(reaction.label)).toBeInTheDocument();
    });
  });

  it('should handle reactions with id field', () => {
    const customEmojis = [
      { id: 'unique-id-1', emoji: '🎉', label: 'Party', color: '#ff0000', category: 'custom' }
    ];

    render(<ReactionPicker {...defaultProps} customEmojis={customEmojis} />);

    fireEvent.click(screen.getByText('Custom').closest('button'));

    expect(screen.getByText('Party')).toBeInTheDocument();
  });
});

describe('ReactionPicker - Background Effects', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should render background effects container', () => {
    const { container } = render(<ReactionPicker {...defaultProps} />);
    expect(container.querySelector('.picker-background-effects')).toBeInTheDocument();
  });

  it('should render 5 background particles', () => {
    const { container } = render(<ReactionPicker {...defaultProps} />);
    const particles = container.querySelectorAll('.background-particle');
    expect(particles).toHaveLength(5);
  });

  it('should apply random CSS variables to particles', () => {
    const { container } = render(<ReactionPicker {...defaultProps} />);
    const particles = container.querySelectorAll('.background-particle');

    particles.forEach(particle => {
      expect(particle).toHaveStyle({ '--delay': expect.any(String) });
      expect(particle).toHaveStyle({ '--x': expect.any(String) });
      expect(particle).toHaveStyle({ '--y': expect.any(String) });
    });
  });
});

describe('ReactionPicker - Empty States', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onReactionSelect: jest.fn()
  };

  it('should show no reactions message for empty custom category', () => {
    render(<ReactionPicker {...defaultProps} customEmojis={[]} />);

    fireEvent.click(screen.getByText('Custom').closest('button'));

    expect(screen.getByText('Add Custom Emoji')).toBeInTheDocument();
  });

  it('should show no reactions message for search with no results', async () => {
    const user = userEvent.setup();
    render(<ReactionPicker {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search reactions...');
    await user.type(searchInput, 'xyz123nonexistent');

    expect(screen.getByText('No reactions found')).toBeInTheDocument();
  });
});

export default mockReaction
