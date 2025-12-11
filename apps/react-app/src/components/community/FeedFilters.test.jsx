/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedFilters from './FeedFilters';

// Mock SortControls component
jest.mock('./SortControls', () => {
  return function MockSortControls({ sortBy, timeFilter, onSort, onTimeFilter, showTimeFilter }) {
    return (
      <div data-testid="sort-controls">
        <button onClick={() => onSort?.('hot')} data-testid="sort-hot">Hot</button>
        <button onClick={() => onSort?.('new')} data-testid="sort-new">New</button>
        <button onClick={() => onSort?.('top')} data-testid="sort-top">Top</button>
        <button onClick={() => onSort?.('rising')} data-testid="sort-rising">Rising</button>
        <button onClick={() => onSort?.('controversial')} data-testid="sort-controversial">Controversial</button>
        {showTimeFilter && (
          <div data-testid="time-filter">
            <button onClick={() => onTimeFilter?.('hour')} data-testid="time-hour">Hour</button>
            <button onClick={() => onTimeFilter?.('day')} data-testid="time-day">Day</button>
            <button onClick={() => onTimeFilter?.('week')} data-testid="time-week">Week</button>
            <button onClick={() => onTimeFilter?.('month')} data-testid="time-month">Month</button>
            <button onClick={() => onTimeFilter?.('year')} data-testid="time-year">Year</button>
            <button onClick={() => onTimeFilter?.('all')} data-testid="time-all">All</button>
          </div>
        )}
        <div data-testid="current-sort">{sortBy}</div>
        <div data-testid="current-time">{timeFilter}</div>
      </div>
    );
  };
});

describe('FeedFilters', () => {
  const defaultProps = {
    feedType: 'home',
    communityName: null,
    sortBy: 'hot',
    timeFilter: 'day',
    onSort: jest.fn(),
    onTimeFilter: jest.fn(),
    onRefresh: jest.fn(),
    refreshing: false,
    className: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<FeedFilters {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders with correct structure', () => {
      const { container } = render(<FeedFilters {...defaultProps} />);
      expect(container.querySelector('.feed-filters')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<FeedFilters {...defaultProps} className="custom-class" />);
      expect(container.querySelector('.feed-filters.custom-class')).toBeInTheDocument();
    });

    it('renders SortControls component', () => {
      render(<FeedFilters {...defaultProps} />);
      expect(screen.getByTestId('sort-controls')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      const { container } = render(<FeedFilters {...defaultProps} />);
      expect(container.querySelector('.feed-filters')).toBeInTheDocument();
      expect(screen.getByTestId('sort-controls')).toBeInTheDocument();
    });
  });

  describe('Feed Type - Home', () => {
    it('displays "Home Feed" title for home feed type', () => {
      render(<FeedFilters {...defaultProps} feedType="home" />);
      expect(screen.getByText('Home Feed')).toBeInTheDocument();
    });

    it('displays home feed description', () => {
      render(<FeedFilters {...defaultProps} feedType="home" />);
      expect(screen.getByText("Posts from communities you've joined")).toBeInTheDocument();
    });

    it('does not display community stats for home feed', () => {
      render(<FeedFilters {...defaultProps} feedType="home" />);
      expect(screen.queryByText(/members/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/online/i)).not.toBeInTheDocument();
    });

    it('shows generic submit link for home feed', () => {
      render(<FeedFilters {...defaultProps} feedType="home" />);
      const createPostLink = screen.getByText('Create Post').closest('a');
      expect(createPostLink).toHaveAttribute('href', '/submit');
    });
  });

  describe('Feed Type - Popular', () => {
    it('displays "Popular" title for popular feed type', () => {
      render(<FeedFilters {...defaultProps} feedType="popular" />);
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('displays popular feed description', () => {
      render(<FeedFilters {...defaultProps} feedType="popular" />);
      expect(screen.getByText('The most active posts on CRYB')).toBeInTheDocument();
    });

    it('does not display community stats for popular feed', () => {
      render(<FeedFilters {...defaultProps} feedType="popular" />);
      expect(screen.queryByText(/members/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/online/i)).not.toBeInTheDocument();
    });
  });

  describe('Feed Type - Community', () => {
    it('displays community name as title', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      expect(screen.getByText('c/gaming')).toBeInTheDocument();
    });

    it('displays community feed description', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      expect(screen.getByText('Posts from c/gaming')).toBeInTheDocument();
    });

    it('displays community stats section', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      expect(screen.getByText('25.4K members')).toBeInTheDocument();
      expect(screen.getByText('847 online')).toBeInTheDocument();
      expect(screen.getByText('Created 2019')).toBeInTheDocument();
    });

    it('shows community-specific submit link', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      const createPostLink = screen.getByText('Create Post').closest('a');
      expect(createPostLink).toHaveAttribute('href', '/c/gaming/submit');
    });

    it('handles different community names', () => {
      const { rerender } = render(
        <FeedFilters {...defaultProps} feedType="community" communityName="technology" />
      );
      expect(screen.getByText('c/technology')).toBeInTheDocument();

      rerender(<FeedFilters {...defaultProps} feedType="community" communityName="sports" />);
      expect(screen.getByText('c/sports')).toBeInTheDocument();
    });
  });

  describe('Feed Type - Default', () => {
    it('displays "Posts" title for unknown feed type', () => {
      render(<FeedFilters {...defaultProps} feedType="unknown" />);
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });

    it('does not display description for unknown feed type', () => {
      const { container } = render(<FeedFilters {...defaultProps} feedType="unknown" />);
      const title = screen.getByText('Posts');
      const nextElement = title.nextElementSibling;
      expect(nextElement).toBeNull();
    });
  });

  describe('Refresh Button', () => {
    it('renders refresh button when onRefresh is provided', () => {
      render(<FeedFilters {...defaultProps} onRefresh={jest.fn()} />);
      expect(screen.getByRole('button', { name: /refresh feed/i })).toBeInTheDocument();
    });

    it('does not render refresh button when onRefresh is not provided', () => {
      render(<FeedFilters {...defaultProps} onRefresh={null} />);
      expect(screen.queryByRole('button', { name: /refresh feed/i })).not.toBeInTheDocument();
    });

    it('calls onRefresh when clicked', async () => {
      const onRefresh = jest.fn();
      render(<FeedFilters {...defaultProps} onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      await userEvent.click(refreshButton);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('displays "Refresh" text when not refreshing', () => {
      render(<FeedFilters {...defaultProps} refreshing={false} />);
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('displays "Refreshing..." text when refreshing', () => {
      render(<FeedFilters {...defaultProps} refreshing={true} />);
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('is disabled when refreshing', () => {
      render(<FeedFilters {...defaultProps} refreshing={true} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      expect(refreshButton).toBeDisabled();
    });

    it('is not disabled when not refreshing', () => {
      render(<FeedFilters {...defaultProps} refreshing={false} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      expect(refreshButton).not.toBeDisabled();
    });

    it('has  class when refreshing', () => {
      const { container } = render(<FeedFilters {...defaultProps} refreshing={true} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      expect(refreshButton.classList.contains('')).toBe(true);
    });

    it('has  class on SVG when refreshing', () => {
      const { container } = render(<FeedFilters {...defaultProps} refreshing={true} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      const svg = refreshButton.querySelector('svg');
      expect(svg.classList.contains('')).toBe(true);
    });

    it('does not have  class on SVG when not refreshing', () => {
      const { container } = render(<FeedFilters {...defaultProps} refreshing={false} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      const svg = refreshButton.querySelector('svg');
      expect(svg.classList.contains('')).toBe(false);
    });
  });

  describe('Create Post Button', () => {
    it('renders create post button on desktop', () => {
      render(<FeedFilters {...defaultProps} />);
      expect(screen.getByText('Create Post')).toBeInTheDocument();
    });

    it('has correct href for home feed', () => {
      render(<FeedFilters {...defaultProps} feedType="home" />);
      const link = screen.getByText('Create Post').closest('a');
      expect(link).toHaveAttribute('href', '/submit');
    });

    it('has correct href for popular feed', () => {
      render(<FeedFilters {...defaultProps} feedType="popular" />);
      const link = screen.getByText('Create Post').closest('a');
      expect(link).toHaveAttribute('href', '/submit');
    });

    it('has correct href for community feed', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      const link = screen.getByText('Create Post').closest('a');
      expect(link).toHaveAttribute('href', '/c/gaming/submit');
    });

    it('has correct href for default feed', () => {
      render(<FeedFilters {...defaultProps} feedType="other" />);
      const link = screen.getByText('Create Post').closest('a');
      expect(link).toHaveAttribute('href', '/submit');
    });

    it('contains plus icon SVG', () => {
      const { container } = render(<FeedFilters {...defaultProps} />);
      const link = screen.getByText('Create Post').closest('a');
      const svg = link.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has btn-primary class', () => {
      render(<FeedFilters {...defaultProps} />);
      const link = screen.getByText('Create Post').closest('a');
      expect(link.classList.contains('btn-primary')).toBe(true);
    });
  });

  describe('Sort Controls Integration', () => {
    it('passes sortBy prop to SortControls', () => {
      render(<FeedFilters {...defaultProps} sortBy="new" />);
      expect(screen.getByTestId('current-sort')).toHaveTextContent('new');
    });

    it('passes timeFilter prop to SortControls', () => {
      render(<FeedFilters {...defaultProps} timeFilter="week" />);
      expect(screen.getByTestId('current-time')).toHaveTextContent('week');
    });

    it('calls onSort when sort is changed', async () => {
      const onSort = jest.fn();
      render(<FeedFilters {...defaultProps} onSort={onSort} />);

      await userEvent.click(screen.getByTestId('sort-new'));

      expect(onSort).toHaveBeenCalledWith('new');
    });

    it('calls onTimeFilter when time filter is changed', async () => {
      const onTimeFilter = jest.fn();
      render(<FeedFilters {...defaultProps} sortBy="top" onTimeFilter={onTimeFilter} />);

      await userEvent.click(screen.getByTestId('time-week'));

      expect(onTimeFilter).toHaveBeenCalledWith('week');
    });

    it('shows time filter when sortBy is "top"', () => {
      render(<FeedFilters {...defaultProps} sortBy="top" />);
      expect(screen.getByTestId('time-filter')).toBeInTheDocument();
    });

    it('shows time filter when sortBy is "controversial"', () => {
      render(<FeedFilters {...defaultProps} sortBy="controversial" />);
      expect(screen.getByTestId('time-filter')).toBeInTheDocument();
    });

    it('does not show time filter when sortBy is "hot"', () => {
      render(<FeedFilters {...defaultProps} sortBy="hot" />);
      expect(screen.queryByTestId('time-filter')).not.toBeInTheDocument();
    });

    it('does not show time filter when sortBy is "new"', () => {
      render(<FeedFilters {...defaultProps} sortBy="new" />);
      expect(screen.queryByTestId('time-filter')).not.toBeInTheDocument();
    });

    it('does not show time filter when sortBy is "rising"', () => {
      render(<FeedFilters {...defaultProps} sortBy="rising" />);
      expect(screen.queryByTestId('time-filter')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<FeedFilters {...defaultProps} feedType="home" />);
      const heading = screen.getByText('Home Feed');
      expect(heading.tagName).toBe('H1');
    });

    it('refresh button has aria-label', () => {
      render(<FeedFilters {...defaultProps} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      expect(refreshButton).toHaveAttribute('aria-label', 'Refresh feed');
    });

    it('has descriptive text for feed type', () => {
      render(<FeedFilters {...defaultProps} feedType="home" />);
      expect(screen.getByText("Posts from communities you've joined")).toBeInTheDocument();
    });

    it('maintains focus after refresh button click', async () => {
      const onRefresh = jest.fn();
      render(<FeedFilters {...defaultProps} onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      refreshButton.focus();
      await userEvent.click(refreshButton);

      // Button should still be in the document and focusable
      expect(refreshButton).toBeInTheDocument();
    });

    it('create post link is accessible', () => {
      render(<FeedFilters {...defaultProps} />);
      const link = screen.getByText('Create Post').closest('a');
      expect(link).toHaveAttribute('href');
      expect(link.textContent).toBeTruthy();
    });
  });

  describe('Community Stats Display', () => {
    it('displays member count with correct formatting', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      expect(screen.getByText('25.4K members')).toBeInTheDocument();
    });

    it('displays online count', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      expect(screen.getByText('847 online')).toBeInTheDocument();
    });

    it('displays creation year', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      expect(screen.getByText('Created 2019')).toBeInTheDocument();
    });

    it('shows online indicator with pulse animation', () => {
      const { container } = render(
        <FeedFilters {...defaultProps} feedType="community" communityName="gaming" />
      );
      const onlineIndicator = container.querySelector('.');
      expect(onlineIndicator).toBeInTheDocument();
      expect(onlineIndicator.classList.contains('bg-success')).toBe(true);
    });

    it('includes icons for all stats', () => {
      const { container } = render(
        <FeedFilters {...defaultProps} feedType="community" communityName="gaming" />
      );
      const svgs = container.querySelectorAll('svg');
      // Should have multiple SVGs: refresh button, create post, and community stats icons
      expect(svgs.length).toBeGreaterThan(3);
    });
  });

  describe('Responsive Layout', () => {
    it('has hidden class on create post button for mobile', () => {
      const { container } = render(<FeedFilters {...defaultProps} />);
      const createPostContainer = screen.getByText('Create Post').closest('div');
      expect(createPostContainer.classList.contains('hidden')).toBe(true);
      expect(createPostContainer.classList.contains('md:flex')).toBe(true);
    });

    it('has hidden class on refresh text for small screens', () => {
      render(<FeedFilters {...defaultProps} />);
      const refreshText = screen.getByText('Refresh');
      expect(refreshText.classList.contains('hidden')).toBe(true);
      expect(refreshText.classList.contains('sm:inline')).toBe(true);
    });

    it('displays refresh icon on all screen sizes', () => {
      const { container } = render(<FeedFilters {...defaultProps} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      const svg = refreshButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null communityName gracefully', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName={null} />);
      expect(screen.getByText('c/null')).toBeInTheDocument();
    });

    it('handles undefined communityName gracefully', () => {
      render(<FeedFilters {...defaultProps} feedType="community" communityName={undefined} />);
      expect(screen.getByText('c/undefined')).toBeInTheDocument();
    });

    it('handles missing onSort callback', async () => {
      render(<FeedFilters {...defaultProps} onSort={null} />);
      expect(() => screen.getByTestId('sort-controls')).not.toThrow();
    });

    it('handles missing onTimeFilter callback', async () => {
      render(<FeedFilters {...defaultProps} onTimeFilter={null} />);
      expect(() => screen.getByTestId('sort-controls')).not.toThrow();
    });

    it('handles empty className', () => {
      const { container } = render(<FeedFilters {...defaultProps} className="" />);
      expect(container.querySelector('.feed-filters')).toBeInTheDocument();
    });

    it('handles default refreshing value', () => {
      const { refreshing, ...propsWithoutRefreshing } = defaultProps;
      render(<FeedFilters {...propsWithoutRefreshing} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      expect(refreshButton).not.toBeDisabled();
    });

    it('renders without errors when all optional props are missing', () => {
      render(
        <FeedFilters
          feedType="home"
          communityName={null}
          sortBy="hot"
          timeFilter="day"
          onSort={jest.fn()}
          onTimeFilter={jest.fn()}
        />
      );
      expect(screen.getByText('Home Feed')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('applies correct styling classes to feed header', () => {
      const { container } = render(<FeedFilters {...defaultProps} />);
      const header = container.querySelector('.flex.items-center.justify-between.mb-lg');
      expect(header).toBeInTheDocument();
    });

    it('applies correct styling to title', () => {
      const { container } = render(<FeedFilters {...defaultProps} feedType="home" />);
      const title = screen.getByText('Home Feed');
      expect(title.classList.contains('text-2xl')).toBe(true);
      expect(title.classList.contains('md:text-3xl')).toBe(true);
      expect(title.classList.contains('font-bold')).toBe(true);
      expect(title.classList.contains('text-primary')).toBe(true);
    });

    it('applies correct styling to description', () => {
      const { container } = render(<FeedFilters {...defaultProps} feedType="home" />);
      const description = screen.getByText("Posts from communities you've joined");
      expect(description.classList.contains('text-sm')).toBe(true);
      expect(description.classList.contains('text-muted')).toBe(true);
    });

    it('applies correct styling to community stats', () => {
      const { container } = render(
        <FeedFilters {...defaultProps} feedType="community" communityName="gaming" />
      );
      const stats = container.querySelector('.flex.items-center.gap-md.text-xs.text-muted.mt-md');
      expect(stats).toBeInTheDocument();
    });

    it('applies btn-ghost class to refresh button', () => {
      render(<FeedFilters {...defaultProps} />);
      const refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      expect(refreshButton.classList.contains('btn-ghost')).toBe(true);
    });
  });

  describe('Multiple Sort Options', () => {
    it('handles switching between all sort options', async () => {
      const onSort = jest.fn();
      render(<FeedFilters {...defaultProps} onSort={onSort} />);

      await userEvent.click(screen.getByTestId('sort-hot'));
      expect(onSort).toHaveBeenCalledWith('hot');

      await userEvent.click(screen.getByTestId('sort-new'));
      expect(onSort).toHaveBeenCalledWith('new');

      await userEvent.click(screen.getByTestId('sort-top'));
      expect(onSort).toHaveBeenCalledWith('top');

      await userEvent.click(screen.getByTestId('sort-rising'));
      expect(onSort).toHaveBeenCalledWith('rising');

      await userEvent.click(screen.getByTestId('sort-controversial'));
      expect(onSort).toHaveBeenCalledWith('controversial');
    });

    it('handles switching between all time filter options', async () => {
      const onTimeFilter = jest.fn();
      render(<FeedFilters {...defaultProps} sortBy="top" onTimeFilter={onTimeFilter} />);

      await userEvent.click(screen.getByTestId('time-hour'));
      expect(onTimeFilter).toHaveBeenCalledWith('hour');

      await userEvent.click(screen.getByTestId('time-day'));
      expect(onTimeFilter).toHaveBeenCalledWith('day');

      await userEvent.click(screen.getByTestId('time-week'));
      expect(onTimeFilter).toHaveBeenCalledWith('week');

      await userEvent.click(screen.getByTestId('time-month'));
      expect(onTimeFilter).toHaveBeenCalledWith('month');

      await userEvent.click(screen.getByTestId('time-year'));
      expect(onTimeFilter).toHaveBeenCalledWith('year');

      await userEvent.click(screen.getByTestId('time-all'));
      expect(onTimeFilter).toHaveBeenCalledWith('all');
    });
  });

  describe('Component Updates', () => {
    it('updates title when feedType changes', () => {
      const { rerender } = render(<FeedFilters {...defaultProps} feedType="home" />);
      expect(screen.getByText('Home Feed')).toBeInTheDocument();

      rerender(<FeedFilters {...defaultProps} feedType="popular" />);
      expect(screen.getByText('Popular')).toBeInTheDocument();
    });

    it('updates create post link when community changes', () => {
      const { rerender } = render(
        <FeedFilters {...defaultProps} feedType="community" communityName="gaming" />
      );
      let link = screen.getByText('Create Post').closest('a');
      expect(link).toHaveAttribute('href', '/c/gaming/submit');

      rerender(<FeedFilters {...defaultProps} feedType="community" communityName="technology" />);
      link = screen.getByText('Create Post').closest('a');
      expect(link).toHaveAttribute('href', '/c/technology/submit');
    });

    it('updates refresh button state when refreshing changes', () => {
      const { rerender } = render(<FeedFilters {...defaultProps} refreshing={false} />);
      let refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      expect(refreshButton).not.toBeDisabled();
      expect(screen.getByText('Refresh')).toBeInTheDocument();

      rerender(<FeedFilters {...defaultProps} refreshing={true} />);
      refreshButton = screen.getByRole('button', { name: /refresh feed/i });
      expect(refreshButton).toBeDisabled();
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('adds/removes community stats when feedType changes', () => {
      const { rerender } = render(<FeedFilters {...defaultProps} feedType="home" />);
      expect(screen.queryByText(/members/i)).not.toBeInTheDocument();

      rerender(<FeedFilters {...defaultProps} feedType="community" communityName="gaming" />);
      expect(screen.getByText('25.4K members')).toBeInTheDocument();
    });
  });
});

export default MockSortControls
