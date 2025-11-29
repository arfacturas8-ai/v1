import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageReactions from './MessageReactions';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Plus: (props) => <div data-testid="plus-icon" {...props} />,
}));

const mockReactions = {
  '👍': { count: 5, users: ['user1', 'user2', 'user3', 'user4', 'user5'] },
  '❤️': { count: 3, users: ['user1', 'user6', 'user7'] },
  '😂': { count: 1, users: ['user8'] },
};

describe('MessageReactions', () => {
  let mockOnAddReaction;
  let mockOnRemoveReaction;

  beforeEach(() => {
    mockOnAddReaction = jest.fn();
    mockOnRemoveReaction = jest.fn();
  });

  describe('Rendering', () => {
    it('renders nothing when reactions are empty', () => {
      const { container } = render(
        <MessageReactions
          reactions={{}}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders reaction buttons', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('😂')).toBeInTheDocument();
    });

    it('displays reaction counts', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders add reaction button', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('matches snapshot', () => {
      const { container } = render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('User Reactions', () => {
    it('highlights reactions from current user', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      const thumbsUpButton = screen.getByText('👍').closest('button');
      expect(thumbsUpButton).toHaveClass('bg-cyan-500/20');
      expect(thumbsUpButton).toHaveClass('text-cyan-400');
    });

    it('does not highlight reactions from other users', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user9"
        />
      );

      const thumbsUpButton = screen.getByText('👍').closest('button');
      expect(thumbsUpButton).toHaveClass('bg-white/10');
      expect(thumbsUpButton).toHaveClass('text-white/70');
    });

    it('removes reaction when user has already reacted', async () => {
      const user = userEvent.setup();
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      await user.click(screen.getByText('👍'));

      expect(mockOnRemoveReaction).toHaveBeenCalledWith('👍');
      expect(mockOnAddReaction).not.toHaveBeenCalled();
    });

    it('adds reaction when user has not reacted', async () => {
      const user = userEvent.setup();
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user9"
        />
      );

      await user.click(screen.getByText('👍'));

      expect(mockOnAddReaction).toHaveBeenCalledWith('👍');
      expect(mockOnRemoveReaction).not.toHaveBeenCalled();
    });
  });

  describe('Add Reaction', () => {
    it('calls onAddReaction when plus button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      await user.click(screen.getByTestId('plus-icon').closest('button'));

      expect(mockOnAddReaction).toHaveBeenCalled();
    });

    it('calls onAddReaction with no arguments', async () => {
      const user = userEvent.setup();
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      await user.click(screen.getByTestId('plus-icon').closest('button'));

      expect(mockOnAddReaction).toHaveBeenCalledWith();
    });
  });

  describe('Tooltips', () => {
    it('shows reaction count in title', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      const thumbsUpButton = screen.getByText('👍').closest('button');
      expect(thumbsUpButton).toHaveAttribute('title', '5 reactions');
    });

    it('shows singular form for one reaction', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      const laughButton = screen.getByText('😂').closest('button');
      expect(laughButton).toHaveAttribute('title', '1 reaction');
    });

    it('shows add reaction tooltip', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      const addButton = screen.getByTestId('plus-icon').closest('button');
      expect(addButton).toHaveAttribute('title', 'Add reaction');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty reactions object', () => {
      const { container } = render(
        <MessageReactions
          reactions={{}}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles undefined reactions', () => {
      const { container } = render(
        <MessageReactions
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('handles reaction with no users array', () => {
      const brokenReactions = {
        '👍': { count: 1, users: [] },
      };

      render(
        <MessageReactions
          reactions={brokenReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      expect(screen.getByText('👍')).toBeInTheDocument();
    });

    it('handles multiple reactions from same user', async () => {
      const user = userEvent.setup();
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      await user.click(screen.getByText('👍'));
      await user.click(screen.getByText('❤️'));

      expect(mockOnRemoveReaction).toHaveBeenCalledTimes(2);
    });

    it('handles very large reaction counts', () => {
      const largeReactions = {
        '👍': { count: 999, users: Array(999).fill('user') },
      };

      render(
        <MessageReactions
          reactions={largeReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('handles special emoji characters', () => {
      const specialReactions = {
        '🔥': { count: 1, users: ['user1'] },
        '💯': { count: 1, users: ['user2'] },
        '🚀': { count: 1, users: ['user3'] },
      };

      render(
        <MessageReactions
          reactions={specialReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('💯')).toBeInTheDocument();
      expect(screen.getByText('🚀')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies active styling for user reactions', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user1"
        />
      );

      const thumbsUpButton = screen.getByText('👍').closest('button');
      expect(thumbsUpButton).toHaveClass('border-cyan-400/30');
      expect(thumbsUpButton).toHaveClass('glow-sm');
    });

    it('applies inactive styling for non-user reactions', () => {
      render(
        <MessageReactions
          reactions={mockReactions}
          onAddReaction={mockOnAddReaction}
          onRemoveReaction={mockOnRemoveReaction}
          currentUserId="user9"
        />
      );

      const thumbsUpButton = screen.getByText('👍').closest('button');
      expect(thumbsUpButton).toHaveClass('border-white/20');
      expect(thumbsUpButton).toHaveClass('hover:bg-white/20');
    });
  });
});

export default mockReactions
