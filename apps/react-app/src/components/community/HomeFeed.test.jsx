/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeFeed from './HomeFeed';
import CommunityFeed from './CommunityFeed';

jest.mock('./CommunityFeed', () => {
  return jest.fn(({ feedType, initialSortBy, initialTimeFilter }) => (
    <div data-testid="community-feed">
      <span data-testid="feed-type">{feedType}</span>
      <span data-testid="sort-by">{initialSortBy}</span>
      <span data-testid="time-filter">{initialTimeFilter}</span>
    </div>
  ));
});

describe('HomeFeed', () => {
  const mockUserWithCommunities = {
    id: 'user-1',
    username: 'testuser',
    joinedCommunities: [
      { id: 'c1', name: 'gaming', icon: '/icon1.png', members: 5000 },
      { id: 'c2', name: 'music', icon: null, members: 3000 },
      { id: 'c3', name: 'art', icon: '/icon3.png', members: 2000 },
      { id: 'c4', name: 'tech', icon: '/icon4.png', members: 10000 },
      { id: 'c5', name: 'fitness', icon: null, members: 1500 },
      { id: 'c6', name: 'food', icon: '/icon6.png', members: 4000 }
    ]
  };

  const mockUserWithoutCommunities = {
    id: 'user-2',
    username: 'newuser',
    joinedCommunities: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      expect(container).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByTestId('community-feed')).toBeInTheDocument();
    });

    it('renders without user prop', () => {
      expect(() => render(<HomeFeed />)).not.toThrow();
    });

    it('renders with null user', () => {
      expect(() => render(<HomeFeed user={null} />)).not.toThrow();
    });

    it('renders main feed content area', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      expect(container.querySelector('.feed-content')).toBeInTheDocument();
    });
  });

  describe('Feed Navigation Tabs', () => {
    it('renders all three feed type tabs', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('home tab is active by default', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const homeButton = screen.getByText('Home').closest('button');
      expect(homeButton).toHaveClass('active');
    });

    it('switches to popular feed when popular tab clicked', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const popularButton = screen.getByText('Popular').closest('button');

      await userEvent.click(popularButton);

      expect(popularButton).toHaveClass('active');
      expect(screen.getByTestId('feed-type')).toHaveTextContent('popular');
    });

    it('switches to all feed when all tab clicked', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const allButton = screen.getByText('All').closest('button');

      await userEvent.click(allButton);

      expect(allButton).toHaveClass('active');
      expect(screen.getByTestId('feed-type')).toHaveTextContent('all');
    });

    it('only one tab is active at a time', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Popular').closest('button'));

      expect(screen.getByText('Popular').closest('button')).toHaveClass('active');
      expect(screen.getByText('Home').closest('button')).not.toHaveClass('active');
      expect(screen.getByText('All').closest('button')).not.toHaveClass('active');
    });

    it('displays correct title attributes for feed tabs', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      const homeButton = screen.getByText('Home').closest('button');
      const popularButton = screen.getByText('Popular').closest('button');
      const allButton = screen.getByText('All').closest('button');

      expect(homeButton).toHaveAttribute('title', "Posts from communities you've joined");
      expect(popularButton).toHaveAttribute('title', 'Trending posts from all communities');
      expect(allButton).toHaveAttribute('title', 'All posts from every community');
    });

    it('renders icons for each feed type', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const feedTabs = container.querySelectorAll('.feed-tab');

      feedTabs.forEach(tab => {
        expect(tab.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('Sort Controls', () => {
    it('renders all four sort buttons', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('Hot')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
      expect(screen.getByText('Top')).toBeInTheDocument();
      expect(screen.getByText('Rising')).toBeInTheDocument();
    });

    it('hot sort is active by default', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const hotButton = screen.getByText('Hot').closest('button');
      expect(hotButton).toHaveClass('active');
    });

    it('switches to new sort when clicked', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const newButton = screen.getByText('New').closest('button');

      await userEvent.click(newButton);

      expect(newButton).toHaveClass('active');
      expect(screen.getByTestId('sort-by')).toHaveTextContent('new');
    });

    it('switches to top sort when clicked', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const topButton = screen.getByText('Top').closest('button');

      await userEvent.click(topButton);

      expect(topButton).toHaveClass('active');
      expect(screen.getByTestId('sort-by')).toHaveTextContent('top');
    });

    it('switches to rising sort when clicked', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const risingButton = screen.getByText('Rising').closest('button');

      await userEvent.click(risingButton);

      expect(risingButton).toHaveClass('active');
      expect(screen.getByTestId('sort-by')).toHaveTextContent('rising');
    });

    it('only one sort button is active at a time', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('New').closest('button'));

      expect(screen.getByText('New').closest('button')).toHaveClass('active');
      expect(screen.getByText('Hot').closest('button')).not.toHaveClass('active');
      expect(screen.getByText('Top').closest('button')).not.toHaveClass('active');
      expect(screen.getByText('Rising').closest('button')).not.toHaveClass('active');
    });

    it('displays correct title attributes for sort buttons', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      expect(screen.getByText('Hot').closest('button')).toHaveAttribute('title', 'Rising posts');
      expect(screen.getByText('New').closest('button')).toHaveAttribute('title', 'Newest posts');
      expect(screen.getByText('Top').closest('button')).toHaveAttribute('title', 'Highest voted');
      expect(screen.getByText('Rising').closest('button')).toHaveAttribute('title', 'Quickly gaining votes');
    });

    it('renders icons for each sort button', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const sortButtons = container.querySelectorAll('.sort-btn');

      sortButtons.forEach(button => {
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('renders sort label', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('Sort:')).toBeInTheDocument();
    });
  });

  describe('Time Filter Controls', () => {
    it('does not show time filter by default', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.queryByText('Time:')).not.toBeInTheDocument();
    });

    it('shows time filter when top sort is selected', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));

      expect(screen.getByText('Time:')).toBeInTheDocument();
    });

    it('hides time filter when switching from top to other sort', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));
      expect(screen.getByText('Time:')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Hot').closest('button'));
      expect(screen.queryByText('Time:')).not.toBeInTheDocument();
    });

    it('renders all time filter options', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      const options = Array.from(select.querySelectorAll('option'));
      expect(options).toHaveLength(6);
      expect(options.map(o => o.value)).toEqual(['hour', 'day', 'week', 'month', 'year', 'all']);
    });

    it('day is selected by default', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('day');
    });

    it('changes time filter when option selected', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'week');

      expect(screen.getByTestId('time-filter')).toHaveTextContent('week');
    });

    it('updates feed when time filter changes', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'month');

      expect(screen.getByTestId('time-filter')).toHaveTextContent('month');
    });

    it('displays correct option labels', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));

      expect(screen.getByText('Hour')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Year')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });
  });

  describe('Feed Info Bar - Home', () => {
    it('shows info bar for home feed', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText(/Showing posts from your/)).toBeInTheDocument();
    });

    it('displays joined communities count', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText(/6 joined communities/)).toBeInTheDocument();
    });

    it('shows message when user has no joined communities', () => {
      render(<HomeFeed user={mockUserWithoutCommunities} />);
      expect(screen.getByText('Join communities to see posts in your home feed')).toBeInTheDocument();
    });

    it('shows browse communities button when no joined communities', () => {
      render(<HomeFeed user={mockUserWithoutCommunities} />);
      expect(screen.getByText('Browse Communities')).toBeInTheDocument();
    });

    it('does not show browse button when user has joined communities', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const buttons = screen.queryAllByText('Browse Communities');
      const infoBarButton = buttons.find(el => el.closest('.feed-info'));
      expect(infoBarButton).toBeUndefined();
    });

    it('hides home info bar when switching to popular', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Popular').closest('button'));

      expect(screen.queryByText(/Showing posts from your/)).not.toBeInTheDocument();
    });

    it('hides home info bar when switching to all', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('All').closest('button'));

      expect(screen.queryByText(/Showing posts from your/)).not.toBeInTheDocument();
    });
  });

  describe('Feed Info Bar - Popular', () => {
    it('shows popular info bar when popular tab selected', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Popular').closest('button'));

      expect(screen.getByText('Popular posts from communities with high engagement')).toBeInTheDocument();
    });

    it('does not show popular info by default', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.queryByText('Popular posts from communities with high engagement')).not.toBeInTheDocument();
    });
  });

  describe('Feed Info Bar - All', () => {
    it('shows all info bar when all tab selected', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('All').closest('button'));

      expect(screen.getByText('All posts from every community on CRYB')).toBeInTheDocument();
    });

    it('does not show all info by default', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.queryByText('All posts from every community on CRYB')).not.toBeInTheDocument();
    });
  });

  describe('CommunityFeed Integration', () => {
    it('passes feedType to CommunityFeed', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByTestId('feed-type')).toHaveTextContent('home');
    });

    it('passes sortBy to CommunityFeed', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByTestId('sort-by')).toHaveTextContent('hot');
    });

    it('passes timeFilter to CommunityFeed', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByTestId('time-filter')).toHaveTextContent('day');
    });

    it('updates CommunityFeed when feedType changes', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Popular').closest('button'));

      expect(screen.getByTestId('feed-type')).toHaveTextContent('popular');
    });

    it('updates CommunityFeed when sortBy changes', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('New').closest('button'));

      expect(screen.getByTestId('sort-by')).toHaveTextContent('new');
    });

    it('updates CommunityFeed when timeFilter changes', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'week');

      expect(screen.getByTestId('time-filter')).toHaveTextContent('week');
    });

    it('applies main-feed className to CommunityFeed', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(CommunityFeed).toHaveBeenCalledWith(
        expect.objectContaining({ className: 'main-feed' }),
        expect.anything()
      );
    });
  });

  describe('Quick Actions Sidebar', () => {
    it('renders quick actions sidebar', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      expect(container.querySelector('.feed-sidebar')).toBeInTheDocument();
    });

    it('renders quick actions section', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('renders create post button in sidebar', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const sidebar = screen.getByText('Quick Actions').closest('.sidebar-section');
      const createButton = sidebar.querySelector('button');
      expect(createButton).toHaveTextContent('Create Post');
    });

    it('renders browse communities button in sidebar', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const buttons = screen.getAllByText('Browse Communities');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('create post button has primary class', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const createButtons = container.querySelectorAll('.action-btn.primary');
      expect(createButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Your Communities Sidebar Section', () => {
    it('shows your communities section when user has joined communities', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('Your Communities')).toBeInTheDocument();
    });

    it('does not show your communities section when user has no communities', () => {
      render(<HomeFeed user={mockUserWithoutCommunities} />);
      expect(screen.queryByText('Your Communities')).not.toBeInTheDocument();
    });

    it('displays up to 5 communities', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const shortcuts = container.querySelectorAll('.community-shortcut');
      expect(shortcuts).toHaveLength(5);
    });

    it('displays community names with c/ prefix', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('c/gaming')).toBeInTheDocument();
      expect(screen.getByText('c/music')).toBeInTheDocument();
    });

    it('displays member counts', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('5000 members')).toBeInTheDocument();
      expect(screen.getByText('3000 members')).toBeInTheDocument();
    });

    it('displays community icon when available', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const icons = container.querySelectorAll('.community-icon img');
      expect(icons.length).toBeGreaterThan(0);
      expect(icons[0]).toHaveAttribute('src', '/icon1.png');
    });

    it('displays default icon when community has no icon', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const defaultIcons = container.querySelectorAll('.default-icon');
      expect(defaultIcons.length).toBeGreaterThan(0);
    });

    it('displays first letter of community name in default icon', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const defaultIcons = Array.from(container.querySelectorAll('.default-icon'));
      const musicIcon = defaultIcons.find(icon => icon.textContent === 'M');
      expect(musicIcon).toBeInTheDocument();
    });

    it('shows see more button when user has more than 5 communities', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('View all 6 communities')).toBeInTheDocument();
    });

    it('does not show see more button when user has 5 or fewer communities', () => {
      const userWithFewCommunities = {
        ...mockUserWithCommunities,
        joinedCommunities: mockUserWithCommunities.joinedCommunities.slice(0, 4)
      };
      render(<HomeFeed user={userWithFewCommunities} />);
      expect(screen.queryByText(/View all/)).not.toBeInTheDocument();
    });
  });

  describe('Trending Topics Sidebar Section', () => {
    it('renders trending topics section', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('Trending Topics')).toBeInTheDocument();
    });

    it('displays all trending topic tags', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      expect(screen.getByText('#cryptocurrency')).toBeInTheDocument();
      expect(screen.getByText('#webdevelopment')).toBeInTheDocument();
      expect(screen.getByText('#gaming')).toBeInTheDocument();
      expect(screen.getByText('#digitalart')).toBeInTheDocument();
      expect(screen.getByText('#music')).toBeInTheDocument();
    });

    it('renders topic tags as buttons', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const topicButtons = container.querySelectorAll('.topic-tag');
      expect(topicButtons).toHaveLength(5);
    });
  });

  describe('State Management', () => {
    it('maintains feedType state across interactions', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Popular').closest('button'));
      expect(screen.getByTestId('feed-type')).toHaveTextContent('popular');

      await userEvent.click(screen.getByText('New').closest('button'));
      expect(screen.getByTestId('feed-type')).toHaveTextContent('popular');
    });

    it('maintains sortBy state across feed type changes', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('New').closest('button'));
      expect(screen.getByTestId('sort-by')).toHaveTextContent('new');

      await userEvent.click(screen.getByText('Popular').closest('button'));
      expect(screen.getByTestId('sort-by')).toHaveTextContent('new');
    });

    it('maintains timeFilter state across sort changes', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));
      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, 'week');

      await userEvent.click(screen.getByText('Hot').closest('button'));
      await userEvent.click(screen.getByText('Top').closest('button'));

      expect(screen.getByRole('combobox')).toHaveValue('week');
    });
  });

  describe('Accessibility', () => {
    it('feed navigation buttons have proper structure', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('sort buttons have descriptive titles', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      const hotButton = screen.getByText('Hot').closest('button');
      expect(hotButton).toHaveAttribute('title');
    });

    it('time filter select is accessible', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);
      await userEvent.click(screen.getByText('Top').closest('button'));

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('community shortcut buttons are clickable', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const shortcuts = container.querySelectorAll('.community-shortcut');
      shortcuts.forEach(shortcut => {
        expect(shortcut.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles user with undefined joinedCommunities', () => {
      const userWithoutArray = { id: 'user-3', username: 'testuser' };
      expect(() => render(<HomeFeed user={userWithoutArray} />)).not.toThrow();
    });

    it('handles user with null joinedCommunities', () => {
      const userWithNull = { id: 'user-4', username: 'testuser', joinedCommunities: null };
      expect(() => render(<HomeFeed user={userWithNull} />)).not.toThrow();
    });

    it('handles community without icon gracefully', () => {
      expect(() => render(<HomeFeed user={mockUserWithCommunities} />)).not.toThrow();
    });

    it('handles community with empty name', () => {
      const userWithEmptyName = {
        ...mockUserWithCommunities,
        joinedCommunities: [{ id: 'c1', name: '', members: 100 }]
      };
      expect(() => render(<HomeFeed user={userWithEmptyName} />)).not.toThrow();
    });

    it('handles rapid feed type switching', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Popular').closest('button'));
      await userEvent.click(screen.getByText('All').closest('button'));
      await userEvent.click(screen.getByText('Home').closest('button'));

      expect(screen.getByTestId('feed-type')).toHaveTextContent('home');
    });

    it('handles rapid sort switching', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('New').closest('button'));
      await userEvent.click(screen.getByText('Top').closest('button'));
      await userEvent.click(screen.getByText('Rising').closest('button'));

      expect(screen.getByTestId('sort-by')).toHaveTextContent('rising');
    });

    it('handles rapid time filter changes', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Top').closest('button'));
      const select = screen.getByRole('combobox');

      await userEvent.selectOptions(select, 'hour');
      await userEvent.selectOptions(select, 'week');
      await userEvent.selectOptions(select, 'month');

      expect(screen.getByTestId('time-filter')).toHaveTextContent('month');
    });
  });

  describe('Layout and Structure', () => {
    it('renders header section', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      expect(container.querySelector('.home-feed-header')).toBeInTheDocument();
    });

    it('renders feed controls section', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      expect(container.querySelector('.feed-controls')).toBeInTheDocument();
    });

    it('renders sort controls container', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      expect(container.querySelector('.sort-controls')).toBeInTheDocument();
    });

    it('sidebar sections have proper structure', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      const sections = container.querySelectorAll('.sidebar-section');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('main container has home-feed class', () => {
      const { container } = render(<HomeFeed user={mockUserWithCommunities} />);
      expect(container.querySelector('.home-feed')).toBeInTheDocument();
    });
  });

  describe('Component Props and Data Flow', () => {
    it('CommunityFeed receives correct initial props', () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      expect(CommunityFeed).toHaveBeenCalledWith(
        expect.objectContaining({
          feedType: 'home',
          initialSortBy: 'hot',
          initialTimeFilter: 'day',
          className: 'main-feed'
        }),
        expect.anything()
      );
    });

    it('CommunityFeed props update when state changes', async () => {
      render(<HomeFeed user={mockUserWithCommunities} />);

      await userEvent.click(screen.getByText('Popular').closest('button'));
      await userEvent.click(screen.getByText('New').closest('button'));

      expect(CommunityFeed).toHaveBeenLastCalledWith(
        expect.objectContaining({
          feedType: 'popular',
          initialSortBy: 'new',
          initialTimeFilter: 'day'
        }),
        expect.anything()
      );
    });
  });

export default mockUserWithCommunities
