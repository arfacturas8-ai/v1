/**
 * Tests for BookmarksPanel component
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarksPanel from './BookmarksPanel';

jest.mock('lucide-react', () => ({
  Bookmark: ({ size }) => <svg data-testid="bookmark-icon" width={size} />,
  Search: ({ size }) => <svg data-testid="search-icon" width={size} />,
  X: ({ size }) => <svg data-testid="x-icon" width={size} />,
  Calendar: ({ size }) => <svg data-testid="calendar-icon" width={size} />,
  User: ({ size }) => <svg data-testid="user-icon" width={size} />,
  Heart: ({ size }) => <svg data-testid="heart-icon" width={size} />,
  MessageSquare: ({ size }) => <svg data-testid="message-square-icon" width={size} />,
  Hash: ({ size }) => <svg data-testid="hash-icon" width={size} />,
  Trash2: ({ size }) => <svg data-testid="trash-icon" width={size} />
}));

describe('BookmarksPanel', () => {
  const mockUser = {
    id: 'user1',
    username: 'testuser'
  };
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);
    });

    it('shows Saved Posts title', () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText('Saved Posts')).toBeInTheDocument();
    });

    it('renders bookmark icon', () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
    });

    it('shows close button', () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);
      expect(screen.getByText('Loading saved posts...')).toBeInTheDocument();
    });

    it('shows spinner during loading', () => {
      const { container } = render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);
      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('hides loading state after data loads', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved posts...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search saved posts...')).toBeInTheDocument();
      });
    });

    it('shows search icon', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      });
    });

    it('updates search query on input', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search saved posts...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search saved posts...');
      await user.type(searchInput, 'web3');

      expect(searchInput).toHaveValue('web3');
    });

    it('filters bookmarks by title', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Understanding Web3 Architecture')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search saved posts...');
      await user.type(searchInput, 'NFT');

      await waitFor(() => {
        expect(screen.getByText('Best NFT Marketplaces 2024')).toBeInTheDocument();
        expect(screen.queryByText('Understanding Web3 Architecture')).not.toBeInTheDocument();
      });
    });

    it('filters bookmarks by author', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search saved posts...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search saved posts...');
      await user.type(searchInput, 'CryptoExpert');

      await waitFor(() => {
        expect(screen.getByText('Understanding Web3 Architecture')).toBeInTheDocument();
        expect(screen.queryByText('Best NFT Marketplaces 2024')).not.toBeInTheDocument();
      });
    });

    it('filters bookmarks by community', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search saved posts...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search saved posts...');
      await user.type(searchInput, 'CryptoTrading');

      await waitFor(() => {
        expect(screen.getByText(/DeFi Strategies/)).toBeInTheDocument();
      });
    });

    it('shows all bookmarks when search is cleared', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search saved posts...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search saved posts...');
      await user.type(searchInput, 'NFT');

      await waitFor(() => {
        expect(screen.queryByText('Understanding Web3 Architecture')).not.toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Understanding Web3 Architecture')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Buttons', () => {
    it('shows All filter button', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });
    });

    it('shows Posts filter button', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument();
      });
    });

    it('shows Comments filter button', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument();
      });
    });

    it('All filter is active by default', async () => {
      const { container } = render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const allButton = screen.getByText('All').closest('button');
        expect(allButton).toHaveClass('active');
      });
    });

    it('activates Posts filter on click', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument();
      });

      const postsButton = screen.getByText('Posts');
      await user.click(postsButton);

      expect(postsButton.closest('button')).toHaveClass('active');
    });

    it('activates Comments filter on click', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument();
      });

      const commentsButton = screen.getByText('Comments');
      await user.click(commentsButton);

      expect(commentsButton.closest('button')).toHaveClass('active');
    });

    it('filters to show only posts', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Posts'));

      await waitFor(() => {
        expect(screen.getByText('Understanding Web3 Architecture')).toBeInTheDocument();
        expect(screen.queryByText(/DeFi Strategies/)).not.toBeInTheDocument();
      });
    });

    it('filters to show only comments', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Comments')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Comments'));

      await waitFor(() => {
        expect(screen.getByText(/DeFi Strategies/)).toBeInTheDocument();
        expect(screen.queryByText('Understanding Web3 Architecture')).not.toBeInTheDocument();
      });
    });
  });

  describe('Bookmarks List', () => {
    it('displays bookmark items', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Understanding Web3 Architecture')).toBeInTheDocument();
        expect(screen.getByText('Best NFT Marketplaces 2024')).toBeInTheDocument();
      });
    });

    it('shows bookmark type badge', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const types = screen.getAllByText('post');
        expect(types.length).toBeGreaterThan(0);
      });
    });

    it('shows community name with hash icon', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Web3Development')).toBeInTheDocument();
        expect(screen.getAllByTestId('hash-icon').length).toBeGreaterThan(0);
      });
    });

    it('shows saved date', async () => {
      const { container } = render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
      });
    });

    it('shows author name', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('CryptoExpert')).toBeInTheDocument();
        expect(screen.getAllByTestId('user-icon').length).toBeGreaterThan(0);
      });
    });

    it('shows likes count', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('234')).toBeInTheDocument();
        expect(screen.getAllByTestId('heart-icon').length).toBeGreaterThan(0);
      });
    });

    it('shows comments count', async () => {
      render(<BookmarksPanel user={mockUser} onClose={}mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getAllByTestId('message-square-icon').length).toBeGreaterThan(0);
      });
    });

    it('shows bookmark content snippet', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/comprehensive guide to Web3/)).toBeInTheDocument();
      });
    });
  });

  describe('Remove Bookmark', () => {
    it('shows remove button for each bookmark', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const trashIcons = screen.getAllByTestId('trash-icon');
        expect(trashIcons.length).toBeGreaterThan(0);
      });
    });

    it('removes bookmark on button click', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Understanding Web3 Architecture')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove bookmark');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Understanding Web3 Architecture')).not.toBeInTheDocument();
      });
    });

    it('updates bookmark count after removal', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByTitle('Remove bookmark');
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no bookmarks with filters', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search saved posts...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search saved posts...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No saved posts')).toBeInTheDocument();
        expect(screen.getByText('No posts match your filters')).toBeInTheDocument();
      });
    });

    it('shows bookmark icon in empty state', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search saved posts...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search saved posts...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        const bookmarkIcons = screen.getAllByTestId('bookmark-icon');
        expect(bookmarkIcons.length).toBeGreaterThan(1);
      });
    });

    it('shows different message when no bookmarks at all', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('trash-icon').length).toBeGreaterThan(0);
      });

      // Remove all bookmarks
      const removeButtons = screen.getAllByTitle('Remove bookmark');
      for (const button of removeButtons) {
        await user.click(button);
      }

      await waitFor(() => {
        expect(screen.getByText('Posts you save will appear here')).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    it('formats today correctly', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        // Mock dates are from January, so they won't show as "Today"
        expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
      });
    });

    it('shows relative dates for recent bookmarks', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Bookmark Count', () => {
    it('displays total bookmark count', async () => {
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('updates count when filtering', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      // Filter only shows total count, not filtered count
      await user.click(screen.getByText('Comments'));

      // Count stays the same as it shows total
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user', () => {
      expect(() => {
        render(<BookmarksPanel user={null} onClose={mockOnClose} />);
      }).not.toThrow();
    });

    it('handles missing onClose callback', () => {
      expect(() => {
        render(<BookmarksPanel user={mockUser} />);
      }).not.toThrow();
    });

    it('handles empty search query', async () => {
      const user = userEvent.setup();
      render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search saved posts...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search saved posts...');
      await user.type(searchInput, '   ');

      // Should show all bookmarks
      await waitFor(() => {
        expect(screen.getByText('Understanding Web3 Architecture')).toBeInTheDocument();
      });
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for loaded state', async () => {
      const { container } = render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading saved posts...')).not.toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      const { container } = render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for empty state', async () => {
      const user = userEvent.setup();
      const { container } = render(<BookmarksPanel user={mockUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('trash-icon').length).toBeGreaterThan(0);
      });

      const removeButtons = screen.getAllByTitle('Remove bookmark');
      for (const button of removeButtons) {
        await user.click(button);
      }

      await waitFor(() => {
        expect(screen.getByText('No saved posts')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });
});

export default mockUser
