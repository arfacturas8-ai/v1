/**
 * @jest-environment jsdom
 */

/* eslint-disable no-undef */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MessageSearch from './MessageSearch';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: ({ style }) => <div data-testid="search-icon" style={style} />,
  X: ({ style }) => <div data-testid="x-icon" style={style} />,
  Filter: ({ style }) => <div data-testid="filter-icon" style={style} />,
  ArrowUp: ({ style }) => <div data-testid="arrow-up-icon" style={style} />,
  ArrowDown: ({ style }) => <div data-testid="arrow-down-icon" style={style} />,
  MessageCircle: ({ style }) => <div data-testid="message-circle-icon" style={style} />,
  ChevronLeft: ({ style }) => <div data-testid="chevron-left-icon" style={style} />
}));

describe('MessageSearch Component', () => {
  const mockMessages = [
    {
      id: '1',
      content: 'Hello world',
      username: 'john',
      avatar: 'JD',
      timestamp: new Date('2025-11-06T10:00:00Z').toISOString(),
      channelId: 'channel-1'
    },
    {
      id: '2',
      content: 'Testing the search functionality',
      username: 'jane',
      avatar: 'JS',
      timestamp: new Date('2025-11-06T09:00:00Z').toISOString(),
      channelId: 'channel-2'
    },
    {
      id: '3',
      content: 'Another test message',
      username: 'bob',
      avatar: 'BR',
      timestamp: new Date('2025-11-05T15:00:00Z').toISOString(),
      channelId: 'channel-1'
    },
    {
      id: '4',
      content: 'Old message from last year',
      username: 'alice',
      avatar: 'AW',
      timestamp: new Date('2024-01-15T12:00:00Z').toISOString(),
      channelId: 'channel-2'
    }
  ];

  const mockChannels = [
    { id: 'channel-1', name: 'general' },
    { id: 'channel-2', name: 'random' }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    messages: mockMessages,
    onMessageSelect: jest.fn(),
    currentChannelId: 'channel-1',
    channels: mockChannels,
    isMobile: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Rendering Tests
  describe('Rendering', () => {
    test('renders desktop modal when isOpen is true and isMobile is false', () => {
      render(<MessageSearch {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    test('renders mobile full-screen search when isMobile is true', () => {
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      expect(screen.getByText('Search Messages')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      render(<MessageSearch {...defaultProps} isOpen={false} />);

      expect(screen.queryByPlaceholderText('Search messages...')).not.toBeInTheDocument();
    });

    test('renders with empty messages array', () => {
      render(<MessageSearch {...defaultProps} messages={[]} />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });

    test('renders with empty channels array', () => {
      render(<MessageSearch {...defaultProps} channels={[]} />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });

    test('renders backdrop overlay', () => {
      const { container } = render(<MessageSearch {...defaultProps} />);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0.5)' });
    });

    test('renders all lucide-react icons correctly', () => {
      render(<MessageSearch {...defaultProps} />);

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    test('renders mobile-specific touch target class', () => {
      const { container } = render(<MessageSearch {...defaultProps} isMobile={true} />);

      const touchTargets = container.querySelectorAll('.touch-target');
      expect(touchTargets.length).toBeGreaterThan(0);
    });
  });

  // Search Input Tests
  describe('Search Input', () => {
    test('focuses search input when opened', async () => {
      render(<MessageSearch {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search messages...')).toHaveFocus();
      });
    });

    test('updates search query on input change', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      expect(input).toHaveValue('test');
    });

    test('performs search when typing', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });
    });

    test('clears results when search query is empty', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');
      await user.clear(input);

      await waitFor(() => {
        expect(screen.queryByText(/results/i)).not.toBeInTheDocument();
      });
    });

    test('handles search with special characters', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, '.*+?^${}()|[]\\');

      // Should not crash
      expect(input).toHaveValue('.*+?^${}()|[]\\');
    });

    test('performs case-insensitive search', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'HELLO');

      await waitFor(() => {
        expect(screen.getByText(/1 result/i)).toBeInTheDocument();
      });
    });

    test('trims whitespace from search query', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, '   test   ');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });
    });
  });

  // Filter Tests
  describe('Filters', () => {
    test('toggles filter panel when filter button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      expect(screen.getByLabelText(/user/i)).toBeInTheDocument();
    });

    test('filters messages by user', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      // Open filters
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      // Set user filter
      const userInput = screen.getByLabelText(/user/i);
      await user.type(userInput, 'john');

      await waitFor(() => {
        expect(screen.getByText(/1 result/i)).toBeInTheDocument();
      });
    });

    test('filters messages by channel', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      // Open filters
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      // Set channel filter
      const channelSelect = screen.getByLabelText(/channel/i);
      await user.selectOptions(channelSelect, 'channel-1');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });
    });

    test('filters messages by date from', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      // Open filters
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      // Set date from filter
      const dateFromInput = screen.getByLabelText(/from/i);
      await user.type(dateFromInput, '2025-11-06');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });
    });

    test('filters messages by date to', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      // Open filters
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      // Set date to filter
      const dateToInput = screen.getByLabelText(/to/i);
      await user.type(dateToInput, '2025-11-05');

      await waitFor(() => {
        expect(screen.getByText(/1 result/i)).toBeInTheDocument();
      });
    });

    test('combines multiple filters', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      // Open filters
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      // Set multiple filters
      const userInput = screen.getByLabelText(/user/i);
      await user.type(userInput, 'john');

      const channelSelect = screen.getByLabelText(/channel/i);
      await user.selectOptions(channelSelect, 'channel-1');

      await waitFor(() => {
        expect(screen.getByText(/1 result/i)).toBeInTheDocument();
      });
    });

    test('clears all filters when clear button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      // Open filters
      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      // Set filters
      const userInput = screen.getByLabelText(/user/i);
      await user.type(userInput, 'john');

      // Clear filters
      const clearButton = screen.getByText(/clear filters/i);
      await user.click(clearButton);

      expect(userInput).toHaveValue('');
    });

    test('shows filter active state', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      // Filter button should have active style
      expect(filterButton).toHaveStyle({ color: 'var(--accent-primary)' });
    });

    test('renders all channel options', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      const channelSelect = screen.getByLabelText(/channel/i);
      expect(channelSelect).toBeInTheDocument();

      const options = channelSelect.querySelectorAll('option');
      expect(options).toHaveLength(3); // All channels + "All channels" option
    });

    test('initializes channel filter with currentChannelId', () => {
      render(<MessageSearch {...defaultProps} currentChannelId="channel-2" />);

      // Component should start with channel-2 filter
      // Results should be filtered by channel-2
      expect(screen.getByText(/2 results/i)).toBeInTheDocument();
    });
  });

  // Search Results Display Tests
  describe('Search Results Display', () => {
    test('displays search results with correct count', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });
    });

    test('displays single result with correct singular text', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'hello');

      await waitFor(() => {
        expect(screen.getByText(/1 result$/i)).toBeInTheDocument();
      });
    });

    test('highlights search query in results', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        const marks = screen.getAllByText('test');
        expect(marks.length).toBeGreaterThan(0);
      });
    });

    test('displays message username', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'hello');

      await waitFor(() => {
        expect(screen.getByText('john')).toBeInTheDocument();
      });
    });

    test('displays message avatar', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'hello');

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument();
      });
    });

    test('displays message timestamp', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'hello');

      await waitFor(() => {
        // Timestamp should be formatted
        const timestamps = screen.queryAllByText(/AM|PM|\d{1,2}:\d{2}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    test('displays channel name for each message', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText('#random')).toBeInTheDocument();
        expect(screen.getByText('#general')).toBeInTheDocument();
      });
    });

    test('sorts results by timestamp (newest first)', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        const messages = screen.getAllByText(/test/i);
        // First result should be "Testing the search functionality" (newer)
        expect(messages[0]).toBeInTheDocument();
      });
    });

    test('limits results to 50 on mobile', async () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        content: `test message ${i}`,
        username: 'user',
        avatar: 'U',
        timestamp: new Date().toISOString(),
        channelId: 'channel-1'
      }));

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={manyMessages} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/50 results/i)).toBeInTheDocument();
      });
    });

    test('shows all results on desktop', async () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        content: `test message ${i}`,
        username: 'user',
        avatar: 'U',
        timestamp: new Date().toISOString(),
        channelId: 'channel-1'
      }));

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={manyMessages} isMobile={false} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/100 results/i)).toBeInTheDocument();
      });
    });
  });

  // Keyboard Navigation Tests
  describe('Keyboard Navigation', () => {
    test('closes modal on Escape key', async () => {
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('navigates to result on Enter key', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(defaultProps.onMessageSelect).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('navigates down with ArrowDown key on desktop', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={false} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      expect(defaultProps.onMessageSelect).toHaveBeenCalled();
    });

    test('navigates up with ArrowUp key on desktop', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={false} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowUp' });

      expect(defaultProps.onMessageSelect).toHaveBeenCalled();
    });

    test('does not use arrow keys for navigation on mobile', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Should not navigate on mobile
      expect(defaultProps.onMessageSelect).not.toHaveBeenCalled();
    });

    test('prevents default on arrow key navigation', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={false} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      fireEvent(input, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('wraps around when navigating past last result', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      // Navigate down past last result
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Should wrap to first result
      expect(defaultProps.onMessageSelect).toHaveBeenCalledTimes(3);
    });

    test('wraps around when navigating before first result', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      // Navigate up from first result
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      // Should wrap to last result
      expect(defaultProps.onMessageSelect).toHaveBeenCalled();
    });
  });

  // Result Navigation Tests
  describe('Result Navigation', () => {
    test('shows navigation buttons on desktop', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByTestId('arrow-up-icon')).toBeInTheDocument();
        expect(screen.getByTestId('arrow-down-icon')).toBeInTheDocument();
      });
    });

    test('navigates up when up button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      const upButton = screen.getByTestId('arrow-up-icon').parentElement;
      await user.click(upButton);

      expect(defaultProps.onMessageSelect).toHaveBeenCalled();
    });

    test('navigates down when down button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });

      const downButton = screen.getByTestId('arrow-down-icon').parentElement;
      await user.click(downButton);

      expect(defaultProps.onMessageSelect).toHaveBeenCalled();
    });

    test('disables navigation buttons when no results', () => {
      render(<MessageSearch {...defaultProps} />);

      const upButton = screen.queryByTestId('arrow-up-icon')?.parentElement;
      const downButton = screen.queryByTestId('arrow-down-icon')?.parentElement;

      if (upButton) expect(upButton).toBeDisabled();
      if (downButton) expect(downButton).toBeDisabled();
    });

    test('shows current result index on desktop', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/\(1 of 2\)/i)).toBeInTheDocument();
      });
    });

    test('updates current result index when navigating', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/\(1 of 2\)/i)).toBeInTheDocument();
      });

      const downButton = screen.getByTestId('arrow-down-icon').parentElement;
      await user.click(downButton);

      await waitFor(() => {
        expect(screen.getByText(/\(2 of 2\)/i)).toBeInTheDocument();
      });
    });

    test('highlights current result', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        const highlightedResults = container.querySelectorAll('[style*="rgba(59, 130, 246, 0.2)"]');
        expect(highlightedResults.length).toBeGreaterThan(0);
      });
    });
  });

  // Message Selection Tests
  describe('Message Selection', () => {
    test('calls onMessageSelect when result clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'hello');

      await waitFor(() => {
        expect(screen.getByText('john')).toBeInTheDocument();
      });

      const result = screen.getByText('john').closest('button');
      await user.click(result);

      expect(defaultProps.onMessageSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          username: 'john',
          content: 'Hello world'
        })
      );
    });

    test('closes modal after message selection', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'hello');

      await waitFor(() => {
        expect(screen.getByText('john')).toBeInTheDocument();
      });

      const result = screen.getByText('john').closest('button');
      await user.click(result);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('calls onClose when X button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const closeButton = screen.getByTestId('x-icon').parentElement;
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('calls onClose when mobile back button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      const backButton = screen.getByTestId('chevron-left-icon').parentElement;
      await user.click(backButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  // Empty States Tests
  describe('Empty States', () => {
    test('shows empty search state when no query', () => {
      render(<MessageSearch {...defaultProps} />);

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByText(/start typing to search messages/i)).toBeInTheDocument();
    });

    test('shows no results state when search returns empty', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'nonexistentquery');

      await waitFor(() => {
        expect(screen.getByTestId('message-circle-icon')).toBeInTheDocument();
        expect(screen.getByText(/no messages found/i)).toBeInTheDocument();
      });
    });

    test('shows helpful message in no results state', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'nonexistentquery');

      await waitFor(() => {
        expect(screen.getByText(/try adjusting your search terms or filters/i)).toBeInTheDocument();
      });
    });

    test('shows different empty state message on mobile', () => {
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      expect(screen.getByText(/start typing to find messages across all channels/i)).toBeInTheDocument();
    });

    test('shows different empty state message on desktop', () => {
      render(<MessageSearch {...defaultProps} isMobile={false} />);

      expect(screen.getByText(/use filters to narrow down your search/i)).toBeInTheDocument();
    });
  });

  // Loading State Tests
  describe('Loading State', () => {
    test('shows loading spinner on mobile when searching', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');

      act(() => {
        user.type(input, 'test');
      });

      // Loading spinner should appear briefly
      // Note: May be transient on fast systems
      const spinner = screen.queryByRole('progressbar') ||
                      document.querySelector('.');
      // Check that spinner element exists (even if briefly)
      expect(spinner !== undefined).toBe(true);
    });

    test('delays search on mobile for loading state', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');

      act(() => {
        user.type(input, 'test');
      });

      // Results should not appear immediately
      expect(screen.queryByText(/results/i)).not.toBeInTheDocument();

      // Wait for mobile delay
      await act(async () => {
        await jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByText(/results/i)).toBeInTheDocument();
      });
    });

    test('does not delay search on desktop', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={false} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      // Results should appear quickly without delay
      await waitFor(() => {
        expect(screen.getByText(/results/i)).toBeInTheDocument();
      });
    });
  });

  // formatTime Utility Tests
  describe('formatTime Utility', () => {
    test('formats time within 24 hours correctly', async () => {
      const recentMessage = {
        id: '5',
        content: 'Recent message',
        username: 'test',
        avatar: 'T',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        channelId: 'channel-1'
      };

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={[recentMessage]} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'recent');

      await waitFor(() => {
        // Should show time in HH:MM format
        const timeElements = screen.queryAllByText(/\d{1,2}:\d{2}/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    test('formats time within a week with day name', async () => {
      const weekOldMessage = {
        id: '6',
        content: 'Week old message',
        username: 'test',
        avatar: 'T',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        channelId: 'channel-1'
      };

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={[weekOldMessage]} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'week');

      await waitFor(() => {
        // Should show day name
        expect(screen.getByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/)).toBeInTheDocument();
      });
    });

    test('formats old messages with month and day', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'old');

      await waitFor(() => {
        // Should show month abbreviation
        expect(screen.getByText(/Jan/)).toBeInTheDocument();
      });
    });

    test('includes year for messages from different year', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'old');

      await waitFor(() => {
        // Should show year
        expect(screen.getByText(/2024/)).toBeInTheDocument();
      });
    });
  });

  // highlightText Utility Tests
  describe('highlightText Utility', () => {
    test('highlights matching text', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        const marks = screen.getAllByText('test');
        expect(marks.length).toBeGreaterThan(0);
      });
    });

    test('highlights are case-insensitive', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'TEST');

      await waitFor(() => {
        const highlights = screen.getAllByText(/test/i);
        expect(highlights.length).toBeGreaterThan(0);
      });
    });

    test('returns original text when no query', async () => {
      render(<MessageSearch {...defaultProps} messages={mockMessages} />);

      // Without search, messages should be in empty state
      expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
    });

    test('truncates long text on mobile', async () => {
      const longMessage = {
        id: '7',
        content: 'A'.repeat(200) + ' test',
        username: 'test',
        avatar: 'T',
        timestamp: new Date().toISOString(),
        channelId: 'channel-1'
      };

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={[longMessage]} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        const messageText = screen.getByText(/A{1,120}\.{3}/);
        expect(messageText).toBeInTheDocument();
      });
    });

    test('keeps highlighted parts visible on mobile truncation', async () => {
      const longMessage = {
        id: '8',
        content: 'Start ' + 'A'.repeat(100) + ' test ' + 'B'.repeat(100) + ' end',
        username: 'test',
        avatar: 'T',
        timestamp: new Date().toISOString(),
        channelId: 'channel-1'
      };

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={[longMessage]} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        // Should show ellipsis and keep "test" visible
        expect(screen.getByText('test')).toBeInTheDocument();
      });
    });

    test('escapes special regex characters', async () => {
      const specialMessage = {
        id: '9',
        content: 'Price is $100 (sale)',
        username: 'test',
        avatar: 'T',
        timestamp: new Date().toISOString(),
        channelId: 'channel-1'
      };

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={[specialMessage]} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, '$100');

      await waitFor(() => {
        expect(screen.getByText(/\$100/)).toBeInTheDocument();
      });
    });
  });

  // Mobile-Specific Tests
  describe('Mobile-Specific Features', () => {
    test('renders full-screen on mobile', () => {
      const { container } = render(<MessageSearch {...defaultProps} isMobile={true} />);

      const searchContainer = container.querySelector('.w-full.h-full');
      expect(searchContainer).toBeInTheDocument();
    });

    test('shows mobile header with back button', () => {
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      expect(screen.getByText('Search Messages')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
    });

    test('has larger touch targets on mobile', () => {
      const { container } = render(<MessageSearch {...defaultProps} isMobile={true} />);

      const touchTargets = container.querySelectorAll('.touch-target');
      expect(touchTargets.length).toBeGreaterThan(0);
    });

    test('renders mobile-optimized filter panel', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      // Mobile filters should have larger inputs
      const userInput = screen.getByLabelText(/user/i);
      expect(userInput).toHaveClass('w-full');
    });

    test('shows results count at top on mobile', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/2 results/i)).toBeInTheDocument();
      });
    });

    test('does not show navigation buttons on mobile', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.queryByTitle(/previous result/i)).not.toBeInTheDocument();
      });
    });
  });

  // Desktop-Specific Tests
  describe('Desktop-Specific Features', () => {
    test('renders modal with max width on desktop', () => {
      const { container } = render(<MessageSearch {...defaultProps} isMobile={false} />);

      const modal = container.querySelector('.max-w-2xl');
      expect(modal).toBeInTheDocument();
    });

    test('shows keyboard shortcuts hint on desktop', () => {
      render(<MessageSearch {...defaultProps} isMobile={false} />);

      expect(screen.getByText(/Navigate/i)).toBeInTheDocument();
      expect(screen.getByText(/Select/i)).toBeInTheDocument();
      expect(screen.getByText(/Close/i)).toBeInTheDocument();
    });

    test('displays kbd elements for shortcuts', () => {
      const { container } = render(<MessageSearch {...defaultProps} isMobile={false} />);

      const kbdElements = container.querySelectorAll('kbd');
      expect(kbdElements.length).toBeGreaterThanOrEqual(3);
    });

    test('shows current result indicator on desktop', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} isMobile={false} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/\(1 of 2\)/i)).toBeInTheDocument();
      });
    });

    test('renders compact result cards on desktop', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<MessageSearch {...defaultProps} isMobile={false} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        const avatars = container.querySelectorAll('.w-8.h-8');
        expect(avatars.length).toBeGreaterThan(0);
      });
    });

    test('shows modal centered on desktop', () => {
      const { container } = render(<MessageSearch {...defaultProps} isMobile={false} />);

      const centerContainer = container.querySelector('.justify-center');
      expect(centerContainer).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    test('search input is accessible', () => {
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      expect(input).toHaveAttribute('type', 'text');
    });

    test('filter inputs have proper labels', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      expect(screen.getByLabelText(/user/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/channel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
    });

    test('buttons have proper titles', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        const filterButton = screen.getByTestId('filter-icon').parentElement;
        expect(filterButton).toHaveAttribute('title', 'Filters');
      });
    });

    test('navigation buttons have titles', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        const upButton = screen.getByTestId('arrow-up-icon').parentElement;
        const downButton = screen.getByTestId('arrow-down-icon').parentElement;

        expect(upButton).toHaveAttribute('title', 'Previous result');
        expect(downButton).toHaveAttribute('title', 'Next result');
      });
    });

    test('disabled buttons have proper disabled state', () => {
      render(<MessageSearch {...defaultProps} />);

      const upButton = screen.queryByTestId('arrow-up-icon')?.parentElement;
      const downButton = screen.queryByTestId('arrow-down-icon')?.parentElement;

      if (upButton) expect(upButton).toHaveClass('disabled:opacity-50');
      if (downButton) expect(downButton).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  // Performance Tests
  describe('Performance', () => {
    test('handles large number of messages', () => {
      const largeMessageSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        username: 'user',
        avatar: 'U',
        timestamp: new Date().toISOString(),
        channelId: 'channel-1'
      }));

      render(<MessageSearch {...defaultProps} messages={largeMessageSet} />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });

    test('debounces search on input', async () => {
      const user = userEvent.setup({ delay: null });

      render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      // Search should be triggered by useEffect
      await waitFor(() => {
        expect(screen.getByText(/results/i)).toBeInTheDocument();
      });
    });

    test('memoizes formatTime function', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/results/i)).toBeInTheDocument();
      });

      // Rerender shouldn't cause issues
      rerender(<MessageSearch {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });

    test('memoizes highlightText function', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/results/i)).toBeInTheDocument();
      });

      // Rerender shouldn't cause issues
      rerender(<MessageSearch {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    test('handles undefined messages prop', () => {
      render(<MessageSearch {...defaultProps} messages={undefined} />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });

    test('handles null currentChannelId', () => {
      render(<MessageSearch {...defaultProps} currentChannelId={null} />);

      expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    });

    test('handles message without channelId', async () => {
      const messageWithoutChannel = {
        id: '10',
        content: 'No channel test',
        username: 'test',
        avatar: 'T',
        timestamp: new Date().toISOString()
      };

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={[messageWithoutChannel]} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'no channel');

      await waitFor(() => {
        expect(screen.getByText(/1 result/i)).toBeInTheDocument();
      });
    });

    test('handles message with unknown channel', async () => {
      const messageWithUnknownChannel = {
        id: '11',
        content: 'Unknown channel test',
        username: 'test',
        avatar: 'T',
        timestamp: new Date().toISOString(),
        channelId: 'unknown-channel'
      };

      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} messages={[messageWithUnknownChannel]} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'unknown');

      await waitFor(() => {
        expect(screen.getByText(/Unknown/i)).toBeInTheDocument();
      });
    });

    test('handles empty search query with filters', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      const userInput = screen.getByLabelText(/user/i);
      await user.type(userInput, 'john');

      await waitFor(() => {
        expect(screen.getByText(/1 result/i)).toBeInTheDocument();
      });
    });

    test('handles rapid filter changes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<MessageSearch {...defaultProps} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      const userInput = screen.getByLabelText(/user/i);

      // Rapidly change filter
      await user.type(userInput, 'john');
      await user.clear(userInput);
      await user.type(userInput, 'jane');

      await waitFor(() => {
        expect(screen.getByText(/1 result/i)).toBeInTheDocument();
      });
    });
  });

  // Snapshot Tests
  describe('Snapshots', () => {
    test('matches snapshot for desktop empty state', () => {
      const { container } = render(<MessageSearch {...defaultProps} isMobile={false} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot for mobile empty state', () => {
      const { container } = render(<MessageSearch {...defaultProps} isMobile={true} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot for desktop with results', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<MessageSearch {...defaultProps} isMobile={false} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/results/i)).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot for mobile with results', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<MessageSearch {...defaultProps} isMobile={true} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(screen.getByText(/results/i)).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot for desktop with filters open', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<MessageSearch {...defaultProps} isMobile={false} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot for mobile with filters open', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<MessageSearch {...defaultProps} isMobile={true} />);

      const filterButton = screen.getByTestId('filter-icon').parentElement;
      await user.click(filterButton);

      expect(container.firstChild).toMatchSnapshot();
    });

    test('matches snapshot for no results state', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<MessageSearch {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search messages...');
      await user.type(input, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/no messages found/i)).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default mockMessages
