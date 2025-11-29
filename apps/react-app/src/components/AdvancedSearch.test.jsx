import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdvancedSearch from './AdvancedSearch';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: (props) => <div data-testid="search-icon" {...props} />,
  X: (props) => <div data-testid="x-icon" {...props} />,
  Filter: (props) => <div data-testid="filter-icon" {...props} />,
  ChevronDown: (props) => <div data-testid="chevron-down-icon" {...props} />,
  ChevronUp: (props) => <div data-testid="chevron-up-icon" {...props} />,
  TrendingUp: (props) => <div data-testid="trending-up-icon" {...props} />,
  Clock: (props) => <div data-testid="clock-icon" {...props} />,
  User: (props) => <div data-testid="user-icon" {...props} />,
  Users: (props) => <div data-testid="users-icon" {...props} />,
  MessageSquare: (props) => <div data-testid="message-square-icon" {...props} />,
  Image: (props) => <div data-testid="image-icon" {...props} />,
  Video: (props) => <div data-testid="video-icon" {...props} />,
  Link2: (props) => <div data-testid="link2-icon" {...props} />,
  Calendar: (props) => <div data-testid="calendar-icon" {...props} />,
  ArrowUpDown: (props) => <div data-testid="arrow-up-down-icon" {...props} />,
  Award: (props) => <div data-testid="award-icon" {...props} />,
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((text) => text),
}));

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('AdvancedSearch', () => {
  let mockOnSearch;
  let mockOnClose;

  beforeEach(() => {
    mockOnSearch = jest.fn();
    mockOnClose = jest.fn();
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    localStorage.clear();
  });

  describe('Rendering and UI', () => {
    it('renders the search input', () => {
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('renders filters button', () => {
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    });

    it('renders close button when onClose provided', () => {
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} onClose={mockOnClose} />);
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('does not render close button when onClose not provided', () => {
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('matches snapshot', () => {
      const { container } = renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Search Input', () => {
    it('accepts text input', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test query');

      expect(input).toHaveValue('test query');
    });

    it('clears input when clear button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test query');
      expect(input).toHaveValue('test query');

      const clearButton = screen.getByTestId('x-icon').closest('button');
      await user.click(clearButton);

      expect(input).toHaveValue('');
    });

    it('shows suggestions dropdown when typing', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
      });
    });

    it('debounces search suggestions', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 't');

      // Should not show suggestions immediately
      expect(screen.queryByText(/suggestions/i)).not.toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Still not after 300ms
      expect(screen.queryByText(/suggestions/i)).not.toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should show after 500ms total
      await waitFor(() => {
        expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
      });
    });

    it('triggers search on Enter key', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test query{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test query',
        })
      );
    });

    it('does not trigger search on Enter if query is empty', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, '{Enter}');

      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('uses initialQuery prop', () => {
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} initialQuery="initial search" />);
      const input = screen.getByPlaceholderText(/search/i);
      expect(input).toHaveValue('initial search');
    });
  });

  describe('Search Suggestions', () => {
    it('displays trending searches', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'crypto');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText(/trending searches/i)).toBeInTheDocument();
      });
    });

    it('highlights matching text in suggestions', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'nft');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        const highlighted = screen.getAllByText((content, element) => {
          return element?.tagName.toLowerCase() === 'mark';
        });
        expect(highlighted.length).toBeGreaterThan(0);
      });
    });

    it('selects suggestion on click', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'crypto');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText(/cryptocurrency basics/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/cryptocurrency basics/i));

      expect(input).toHaveValue('cryptocurrency basics');
    });

    it('closes suggestions on click outside', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
      });

      await user.click(document.body);

      await waitFor(() => {
        expect(screen.queryByText(/suggestions/i)).not.toBeInTheDocument();
      });
    });

    it('closes suggestions when input is cleared', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText(/suggestions/i)).toBeInTheDocument();
      });

      await user.clear(input);

      await waitFor(() => {
        expect(screen.queryByText(/suggestions/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Recent Searches', () => {
    it('displays recent searches from localStorage', async () => {
      localStorage.setItem('recentSearches', JSON.stringify(['web3', 'nft', 'defi']));

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.click(input);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByText('web3')).toBeInTheDocument();
        expect(screen.getByText('nft')).toBeInTheDocument();
        expect(screen.getByText('defi')).toBeInTheDocument();
      });
    });

    it('saves search to recent searches', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'new search{Enter}');

      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      expect(recentSearches).toContain('new search');
    });

    it('limits recent searches to 10 items', async () => {
      const existingSearches = Array.from({ length: 10 }, (_, i) => `search${i}`);
      localStorage.setItem('recentSearches', JSON.stringify(existingSearches));

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'new search{Enter}');

      const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      expect(recentSearches).toHaveLength(10);
      expect(recentSearches[0]).toBe('new search');
    });

    it('handles localStorage errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });

      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      // Should not throw
      expect(mockOnSearch).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      Storage.prototype.setItem = jest.fn();
    });
  });

  describe('Advanced Filters', () => {
    it('toggles filters panel', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');

      // Open filters
      await user.click(filterButton);
      expect(screen.getByText(/filter by/i)).toBeInTheDocument();

      // Close filters
      await user.click(filterButton);
      await waitFor(() => {
        expect(screen.queryByText(/filter by/i)).not.toBeInTheDocument();
      });
    });

    it('renders all filter options', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      expect(screen.getByText(/type/i)).toBeInTheDocument();
      expect(screen.getByText(/date range/i)).toBeInTheDocument();
      expect(screen.getByText(/sort by/i)).toBeInTheDocument();
      expect(screen.getByText(/community/i)).toBeInTheDocument();
      expect(screen.getByText(/author/i)).toBeInTheDocument();
      expect(screen.getByText(/karma/i)).toBeInTheDocument();
      expect(screen.getByText(/has media/i)).toBeInTheDocument();
    });

    it('filters by type', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const postsCheckbox = screen.getByLabelText(/posts/i);
      await user.click(postsCheckbox);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            type: expect.arrayContaining(['posts']),
          }),
        })
      );
    });

    it('filters by date range', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const dateSelect = screen.getByLabelText(/date range/i);
      await user.selectOptions(dateSelect, 'week');

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            dateRange: 'week',
          }),
        })
      );
    });

    it('filters by sort option', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const sortSelect = screen.getByLabelText(/sort by/i);
      await user.selectOptions(sortSelect, 'top');

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            sort: 'top',
          }),
        })
      );
    });

    it('filters by community', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const communityInput = screen.getByPlaceholderText(/community name/i);
      await user.type(communityInput, 'technology');

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            community: 'technology',
          }),
        })
      );
    });

    it('filters by author', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const authorInput = screen.getByPlaceholderText(/username/i);
      await user.type(authorInput, 'testuser');

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            author: 'testuser',
          }),
        })
      );
    });

    it('filters by minimum karma', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const karmaInput = screen.getByLabelText(/minimum karma/i);
      await user.type(karmaInput, '100');

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            minKarma: 100,
          }),
        })
      );
    });

    it('filters by media type', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const imageCheckbox = screen.getByLabelText(/images/i);
      await user.click(imageCheckbox);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            hasMedia: expect.arrayContaining(['image']),
          }),
        })
      );
    });

    it('applies multiple filters simultaneously', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const postsCheckbox = screen.getByLabelText(/posts/i);
      await user.click(postsCheckbox);

      const dateSelect = screen.getByLabelText(/date range/i);
      await user.selectOptions(dateSelect, 'month');

      const sortSelect = screen.getByLabelText(/sort by/i);
      await user.selectOptions(sortSelect, 'top');

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          filters: expect.objectContaining({
            type: expect.arrayContaining(['posts']),
            dateRange: 'month',
            sort: 'top',
          }),
        })
      );
    });

    it('clears all filters', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const filterButton = screen.getByTestId('filter-icon').closest('button');
      await user.click(filterButton);

      const postsCheckbox = screen.getByLabelText(/posts/i);
      await user.click(postsCheckbox);

      const clearButton = screen.getByText(/clear filters/i);
      await user.click(clearButton);

      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, 'test{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            type: [],
          }),
        })
      );
    });
  });

  describe('Search Results', () => {
    it('displays search results', () => {
      const mockResults = {
        posts: [
          {
            id: '1',
            title: 'Test Post',
            content: 'Test content',
            author: 'testuser',
            community: 'technology',
            karma: 100,
            createdAt: new Date().toISOString(),
          },
        ],
        users: [],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      expect(screen.getByText('Test Post')).toBeInTheDocument();
    });

    it('displays post results with metadata', () => {
      const mockResults = {
        posts: [
          {
            id: '1',
            title: 'Test Post',
            content: 'Test content',
            author: 'testuser',
            community: 'technology',
            karma: 150,
            comments: 25,
            createdAt: new Date().toISOString(),
          },
        ],
        users: [],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      expect(screen.getByText('Test Post')).toBeInTheDocument();
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
      expect(screen.getByText(/technology/i)).toBeInTheDocument();
      expect(screen.getByText(/150/i)).toBeInTheDocument();
      expect(screen.getByText(/25/i)).toBeInTheDocument();
    });

    it('displays user results', () => {
      const mockResults = {
        posts: [],
        users: [
          {
            id: '1',
            username: 'testuser',
            bio: 'Test bio',
            karma: 500,
            followers: 100,
          },
        ],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
      expect(screen.getByText(/500/i)).toBeInTheDocument();
    });

    it('displays community results', () => {
      const mockResults = {
        posts: [],
        users: [],
        communities: [
          {
            id: '1',
            name: 'technology',
            description: 'Tech community',
            members: 1000,
          },
        ],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      expect(screen.getByText('technology')).toBeInTheDocument();
      expect(screen.getByText('Tech community')).toBeInTheDocument();
      expect(screen.getByText(/1000/i)).toBeInTheDocument();
    });

    it('displays mixed results', () => {
      const mockResults = {
        posts: [
          {
            id: '1',
            title: 'Test Post',
            content: 'Test content',
            author: 'testuser',
            community: 'technology',
            karma: 100,
            createdAt: new Date().toISOString(),
          },
        ],
        users: [
          {
            id: '1',
            username: 'testuser',
            bio: 'Test bio',
            karma: 500,
          },
        ],
        communities: [
          {
            id: '1',
            name: 'technology',
            description: 'Tech community',
            members: 1000,
          },
        ],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      expect(screen.getByText('Test Post')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('technology')).toBeInTheDocument();
    });

    it('displays empty state when no results', () => {
      const mockResults = {
        posts: [],
        users: [],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });

    it('displays loading state', () => {
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} isLoading={true} />);
      expect(screen.getByText(/searching/i)).toBeInTheDocument();
    });
  });

  describe('Facets and Stats', () => {
    it('displays result counts by category', () => {
      const mockResults = {
        posts: [{ id: '1', title: 'Post 1', author: 'user1', community: 'tech', karma: 10, createdAt: new Date().toISOString() }],
        users: [{ id: '1', username: 'user1', karma: 10 }],
        communities: [{ id: '1', name: 'tech', members: 100 }],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      expect(screen.getByText(/1 post/i)).toBeInTheDocument();
      expect(screen.getByText(/1 user/i)).toBeInTheDocument();
      expect(screen.getByText(/1 community/i)).toBeInTheDocument();
    });

    it('filters results by category', async () => {
      const user = userEvent.setup({ delay: null });
      const mockResults = {
        posts: [{ id: '1', title: 'Post 1', author: 'user1', community: 'tech', karma: 10, createdAt: new Date().toISOString() }],
        users: [{ id: '1', username: 'user1', karma: 10 }],
        communities: [{ id: '1', name: 'tech', members: 100 }],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      const usersTab = screen.getByText(/users/i).closest('button');
      await user.click(usersTab);

      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.queryByText('Post 1')).not.toBeInTheDocument();
    });
  });

  describe('Load More', () => {
    it('displays load more button when hasMore is true', () => {
      const mockResults = {
        posts: [{ id: '1', title: 'Post 1', author: 'user1', community: 'tech', karma: 10, createdAt: new Date().toISOString() }],
        users: [],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch
          onSearch={mockOnSearch}
          results={mockResults}
          hasMore={true}
          onLoadMore={jest.fn()}
        />
      );

      expect(screen.getByText(/load more/i)).toBeInTheDocument();
    });

    it('does not display load more when hasMore is false', () => {
      const mockResults = {
        posts: [{ id: '1', title: 'Post 1', author: 'user1', community: 'tech', karma: 10, createdAt: new Date().toISOString() }],
        users: [],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch
          onSearch={mockOnSearch}
          results={mockResults}
          hasMore={false}
        />
      );

      expect(screen.queryByText(/load more/i)).not.toBeInTheDocument();
    });

    it('calls onLoadMore when load more clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const mockOnLoadMore = jest.fn();
      const mockResults = {
        posts: [{ id: '1', title: 'Post 1', author: 'user1', community: 'tech', karma: 10, createdAt: new Date().toISOString() }],
        users: [],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch
          onSearch={mockOnSearch}
          results={mockResults}
          hasMore={true}
          onLoadMore={mockOnLoadMore}
        />
      );

      await user.click(screen.getByText(/load more/i));
      expect(mockOnLoadMore).toHaveBeenCalled();
    });

    it('disables load more button when loading', () => {
      const mockResults = {
        posts: [{ id: '1', title: 'Post 1', author: 'user1', community: 'tech', karma: 10, createdAt: new Date().toISOString() }],
        users: [],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch
          onSearch={mockOnSearch}
          results={mockResults}
          hasMore={true}
          isLoadingMore={true}
          onLoadMore={jest.fn()}
        />
      );

      expect(screen.getByText(/loading/i)).toBeDisabled();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} onClose={mockOnClose} />);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes on Escape key', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} onClose={mockOnClose} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long search queries', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const longQuery = 'a'.repeat(1000);
      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, `${longQuery}{Enter}`);

      expect(mockOnSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: longQuery,
        })
      );
    });

    it('handles special characters in search', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      const specialQuery = '<script>alert("test")</script>';
      const input = screen.getByPlaceholderText(/search/i);
      await user.type(input, `${specialQuery}{Enter}`);

      expect(mockOnSearch).toHaveBeenCalled();
    });

    it('handles empty results gracefully', () => {
      renderWithRouter(
        <AdvancedSearch
          onSearch={mockOnSearch}
          results={{ posts: [], users: [], communities: [] }}
        />
      );

      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });

    it('handles missing result properties', () => {
      const mockResults = {
        posts: [
          {
            id: '1',
            title: 'Incomplete Post',
            // Missing other properties
          },
        ],
        users: [],
        communities: [],
      };

      renderWithRouter(
        <AdvancedSearch onSearch={mockOnSearch} results={mockResults} />
      );

      expect(screen.getByText('Incomplete Post')).toBeInTheDocument();
    });

    it('cleans up timers on unmount', () => {
      const { unmount } = renderWithRouter(<AdvancedSearch onSearch={mockOnSearch} />);

      unmount();

      // Should not throw when advancing timers after unmount
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
    });
  });
});

export default renderWithRouter
