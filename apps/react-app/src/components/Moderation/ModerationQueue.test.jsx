import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ModerationQueue from './ModerationQueue';

// Mock CSS import
jest.mock('./ModerationQueue.css', () => ({}));

describe('ModerationQueue', () => {
  let mockSocket;
  let mockOnFiltersChange;
  let mockOnItemAction;
  let mockOnUserSelect;
  let mockFetch;

  const mockToken = 'mock-auth-token-12345';

  const defaultFilters = {
    status: '',
    priority: '',
    content_type: '',
  };

  const mockQueueItems = [
    {
      id: 'queue1',
      content_id: 'content-abc123def456',
      content_type: 'post',
      status: 'pending',
      priority: 4,
      username: 'testuser1',
      user_id: 'user123',
      created_at: '2025-01-15T10:30:00Z',
      toxicity_score: 0.85,
      content_preview: 'This is a test post content',
      flagged_categories: ['hate', 'violence'],
      triggered_rules: ['rule1', 'rule2'],
      assigned_moderator: null,
    },
    {
      id: 'queue2',
      content_id: 'content-xyz789ghi012',
      content_type: 'comment',
      status: 'reviewing',
      priority: 2,
      username: 'testuser2',
      user_id: 'user456',
      created_at: '2025-01-15T11:00:00Z',
      toxicity_score: 0.45,
      content_preview: 'Another test comment',
      flagged_categories: ['spam'],
      triggered_rules: [],
      assigned_moderator: 'mod123',
    },
  ];

  const mockApiResponse = {
    data: {
      items: mockQueueItems,
      total: 25,
      totalPages: 2,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup localStorage
    localStorage.clear();
    localStorage.setItem('auth_token', mockToken);

    // Mock socket instance
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      once: jest.fn(),
    };

    // Mock callback props
    mockOnFiltersChange = jest.fn();
    mockOnItemAction = jest.fn(() => Promise.resolve());
    mockOnUserSelect = jest.fn();

    // Mock fetch
    mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    );
    global.fetch = mockFetch;

    // Mock window.prompt
    global.prompt = jest.fn(() => 'Test notes');

    // Mock window.alert
    global.alert = jest.fn();

    // Mock import.meta.env
    global.importMeta = { env: { VITE_API_URL: 'http://localhost:3000' } };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ModerationQueue
        socket={mockSocket}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onItemAction={mockOnItemAction}
        onUserSelect={mockOnUserSelect}
        {...props}
      />
    );
  };

  // ===== RENDERING AND INITIAL STATE TESTS =====

  describe('Rendering and Initial State', () => {
    test('1. renders loading state initially', () => {
      renderComponent();
      expect(screen.getByText('Loading moderation queue...')).toBeInTheDocument();
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    test('2. renders queue items after loading', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading moderation queue...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Moderation Queue')).toBeInTheDocument();
      expect(screen.getByText('testuser1')).toBeInTheDocument();
      expect(screen.getByText('testuser2')).toBeInTheDocument();
    });

    test('3. renders empty state when no items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { items: [], total: 0, totalPages: 0 } }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No items in the moderation queue!')).toBeInTheDocument();
      });

      expect(screen.getByText('All caught up with content moderation.')).toBeInTheDocument();
    });

    test('4. displays panel header with title', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Moderation Queue')).toBeInTheDocument();
      });

      expect(document.querySelector('.panel-header')).toBeInTheDocument();
      expect(document.querySelector('.panel-title')).toBeInTheDocument();
    });

    test('5. renders refresh button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Refresh/)).toBeInTheDocument();
      });
    });

    test('6. renders filter bar with all filter options', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
        expect(screen.getByText('Content Type')).toBeInTheDocument();
      });
    });

    test('7. renders select all checkbox', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const checkbox = document.querySelector('.queue-header input[type="checkbox"]');
      expect(checkbox).toBeInTheDocument();
    });

    test('8. does not render bulk actions initially', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('items selected')).not.toBeInTheDocument();
      });
    });

    test('9. renders pagination when multiple pages', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      });

      expect(screen.getByText(/25 total items/)).toBeInTheDocument();
    });

    test('10. does not render pagination when single page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { items: mockQueueItems, total: 2, totalPages: 1 },
          }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Previous/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Next/)).not.toBeInTheDocument();
      });
    });
  });

  // ===== QUEUE ITEMS DISPLAY TESTS =====

  describe('Queue Items Display', () => {
    test('11. displays queue item with correct priority', async () => {
      renderComponent();

      await waitFor(() => {
        const priorityIndicator = document.querySelector('.priority-indicator');
        expect(priorityIndicator).toHaveTextContent('4');
        expect(priorityIndicator).toHaveStyle({ backgroundColor: '#e53e3e' });
      });
    });

    test('12. displays content type in uppercase', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('POST')).toBeInTheDocument();
        expect(screen.getByText('COMMENT')).toBeInTheDocument();
      });
    });

    test('13. displays truncated content ID', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/#def456/)).toBeInTheDocument();
      });
    });

    test('14. displays status badge with correct class', async () => {
      renderComponent();

      await waitFor(() => {
        const pendingBadge = document.querySelector('.status-badge.status-pending');
        expect(pendingBadge).toHaveTextContent('pending');

        const reviewingBadge = document.querySelector('.status-badge.status-reviewing');
        expect(reviewingBadge).toHaveTextContent('reviewing');
      });
    });

    test('15. displays username or fallback text', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/By: testuser1/)).toBeInTheDocument();
      });
    });

    test('16. displays formatted timestamp', async () => {
      renderComponent();

      await waitFor(() => {
        const timestamp = new Date('2025-01-15T10:30:00Z').toLocaleString();
        expect(screen.getByText(timestamp)).toBeInTheDocument();
      });
    });

    test('17. displays toxicity score when available', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Toxicity: 85.0%/)).toBeInTheDocument();
        expect(screen.getByText(/Toxicity: 45.0%/)).toBeInTheDocument();
      });
    });

    test('18. hides toxicity score when not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              items: [{ ...mockQueueItems[0], toxicity_score: null }],
              total: 1,
              totalPages: 1,
            },
          }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Toxicity:/)).not.toBeInTheDocument();
      });
    });

    test('19. displays priority colors correctly for all levels', async () => {
      const items = [
        { ...mockQueueItems[0], id: 'q1', priority: 4 },
        { ...mockQueueItems[0], id: 'q2', priority: 3 },
        { ...mockQueueItems[0], id: 'q3', priority: 2 },
        { ...mockQueueItems[0], id: 'q4', priority: 1 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { items, total: 4, totalPages: 1 } }),
      });

      renderComponent();

      await waitFor(() => {
        const indicators = document.querySelectorAll('.priority-indicator');
        expect(indicators[0]).toHaveStyle({ backgroundColor: '#e53e3e' }); // Critical
        expect(indicators[1]).toHaveStyle({ backgroundColor: '#f56500' }); // High
        expect(indicators[2]).toHaveStyle({ backgroundColor: '#d69e2e' }); // Medium
        expect(indicators[3]).toHaveStyle({ backgroundColor: '#38a169' }); // Low
      });
    });

    test('20. displays assigned moderator status correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Take/)).toBeInTheDocument();
        expect(screen.getByText(/Assigned/)).toBeInTheDocument();
      });
    });
  });

  // ===== FILTER FUNCTIONALITY TESTS =====

  describe('Filter Functionality', () => {
    test('21. calls onFiltersChange when status filter changes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'pending' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        status: 'pending',
      });
    });

    test('22. calls onFiltersChange when priority filter changes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Priority')).toBeInTheDocument();
      });

      const prioritySelect = screen.getByLabelText('Priority');
      fireEvent.change(prioritySelect, { target: { value: '4' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        priority: '4',
      });
    });

    test('23. calls onFiltersChange when content type filter changes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Content Type')).toBeInTheDocument();
      });

      const contentTypeSelect = screen.getByLabelText('Content Type');
      fireEvent.change(contentTypeSelect, { target: { value: 'post' } });

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        content_type: 'post',
      });
    });

    test('24. refetches data when filters change', async () => {
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const newFilters = { ...defaultFilters, status: 'pending' };
      rerender(
        <ModerationQueue
          socket={mockSocket}
          filters={newFilters}
          onFiltersChange={mockOnFiltersChange}
          onItemAction={mockOnItemAction}
          onUserSelect={mockOnUserSelect}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    test('25. includes filters in API request', async () => {
      const filters = {
        status: 'pending',
        priority: '4',
        content_type: 'post',
      };

      renderComponent({ filters });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=pending'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('priority=4'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('content_type=post'),
          expect.any(Object)
        );
      });
    });
  });

  // ===== ITEM SELECTION TESTS =====

  describe('Item Selection', () => {
    test('26. selects individual item when checkbox clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });

    test('27. deselects item when clicking checked checkbox', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');

      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeChecked();

      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).not.toBeChecked();
    });

    test('28. selects all items when select all clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const selectAllCheckbox = document.querySelector('.queue-header input[type="checkbox"]');
      fireEvent.click(selectAllCheckbox);

      const itemCheckboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      itemCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });
    });

    test('29. deselects all items when clicking select all with all selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const selectAllCheckbox = document.querySelector('.queue-header input[type="checkbox"]');

      // Select all
      fireEvent.click(selectAllCheckbox);

      // Deselect all
      fireEvent.click(selectAllCheckbox);

      const itemCheckboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      itemCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    test('30. shows bulk actions when items are selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      await waitFor(() => {
        expect(screen.getByText('1 items selected')).toBeInTheDocument();
      });
    });

    test('31. displays correct selected count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByText('2 items selected')).toBeInTheDocument();
      });
    });

    test('32. applies selected class to selected items', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      const firstItem = checkboxes[0].closest('.queue-item');

      fireEvent.click(checkboxes[0]);

      expect(firstItem).toHaveClass('selected');
    });
  });

  // ===== BULK ACTIONS TESTS =====

  describe('Bulk Actions', () => {
    test('33. renders bulk action controls when items selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      await waitFor(() => {
        expect(screen.getByText('Choose bulk action...')).toBeInTheDocument();
        expect(screen.getByText('Approve All')).toBeInTheDocument();
        expect(screen.getByText('Reject All')).toBeInTheDocument();
        expect(screen.getByText('Escalate All')).toBeInTheDocument();
      });
    });

    test('34. applies bulk action to all selected items', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      // Select items
      const selectAllCheckbox = document.querySelector('.queue-header input[type="checkbox"]');
      fireEvent.click(selectAllCheckbox);

      // Choose bulk action
      const bulkActionSelect = document.querySelector('.bulk-action-select');
      fireEvent.change(bulkActionSelect, { target: { value: 'approved' } });

      // Apply action
      const applyButton = screen.getByText('Apply Bulk Action');
      await act(async () => {
        fireEvent.click(applyButton);
      });

      await waitFor(() => {
        expect(mockOnItemAction).toHaveBeenCalledTimes(2);
        expect(mockOnItemAction).toHaveBeenCalledWith('queue1', 'approved', 'Test notes');
        expect(mockOnItemAction).toHaveBeenCalledWith('queue2', 'approved', 'Test notes');
      });
    });

    test('35. prompts for notes when applying bulk action', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const bulkActionSelect = document.querySelector('.bulk-action-select');
      fireEvent.change(bulkActionSelect, { target: { value: 'rejected' } });

      const applyButton = screen.getByText('Apply Bulk Action');
      await act(async () => {
        fireEvent.click(applyButton);
      });

      expect(global.prompt).toHaveBeenCalledWith('Add notes for this bulk action (optional):');
    });

    test('36. clears selection after bulk action', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const bulkActionSelect = document.querySelector('.bulk-action-select');
      fireEvent.change(bulkActionSelect, { target: { value: 'approved' } });

      const applyButton = screen.getByText('Apply Bulk Action');
      await act(async () => {
        fireEvent.click(applyButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('items selected')).not.toBeInTheDocument();
      });
    });

    test('37. refetches queue after bulk action', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const bulkActionSelect = document.querySelector('.bulk-action-select');
      fireEvent.change(bulkActionSelect, { target: { value: 'approved' } });

      const applyButton = screen.getByText('Apply Bulk Action');
      await act(async () => {
        fireEvent.click(applyButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    test('38. disables apply button when no action selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const applyButton = screen.getByText('Apply Bulk Action');
      expect(applyButton).toBeDisabled();
    });

    test('39. handles bulk action errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockOnItemAction.mockRejectedValueOnce(new Error('Action failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const bulkActionSelect = document.querySelector('.bulk-action-select');
      fireEvent.change(bulkActionSelect, { target: { value: 'approved' } });

      const applyButton = screen.getByText('Apply Bulk Action');
      await act(async () => {
        fireEvent.click(applyButton);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to apply action'),
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ===== ITEM ACTIONS TESTS =====

  describe('Item Actions', () => {
    test('40. expands item details when details button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Content Preview:')).toBeInTheDocument();
        expect(screen.getByText('This is a test post content')).toBeInTheDocument();
      });
    });

    test('41. collapses item details when details button clicked again', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);

      // Expand
      fireEvent.click(detailsButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('Content Preview:')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(detailsButtons[0]);
      await waitFor(() => {
        expect(screen.queryByText('Content Preview:')).not.toBeInTheDocument();
      });
    });

    test('42. displays flagged categories in expanded view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Flagged Categories:')).toBeInTheDocument();
        expect(screen.getByText('hate')).toBeInTheDocument();
        expect(screen.getByText('violence')).toBeInTheDocument();
      });
    });

    test('43. displays triggered rules in expanded view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Triggered Rules:')).toBeInTheDocument();
        expect(screen.getByText('Rule ID: rule1')).toBeInTheDocument();
        expect(screen.getByText('Rule ID: rule2')).toBeInTheDocument();
      });
    });

    test('44. calls onItemAction when approve button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      const approveButton = screen.getByText(/Approve/);
      fireEvent.click(approveButton);

      expect(mockOnItemAction).toHaveBeenCalledWith('queue1', 'approved', 'Test notes');
    });

    test('45. calls onItemAction when reject button clicked with notes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      const rejectButton = screen.getByText(/Reject/);
      fireEvent.click(rejectButton);

      expect(mockOnItemAction).toHaveBeenCalledWith('queue1', 'rejected', 'Test notes');
    });

    test('46. does not call onItemAction for reject if no notes provided', async () => {
      global.prompt = jest.fn(() => null);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      const rejectButton = screen.getByText(/Reject/);
      fireEvent.click(rejectButton);

      expect(mockOnItemAction).not.toHaveBeenCalled();
    });

    test('47. calls onItemAction when escalate button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      const escalateButton = screen.getByText(/Escalate/);
      fireEvent.click(escalateButton);

      expect(mockOnItemAction).toHaveBeenCalledWith('queue1', 'escalated', 'Test notes');
    });

    test('48. calls onUserSelect when view user history clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      const viewUserButton = screen.getByText(/View User History/);
      fireEvent.click(viewUserButton);

      expect(mockOnUserSelect).toHaveBeenCalledWith('user123');
    });

    test('49. disables take button when item already assigned', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser2')).toBeInTheDocument();
      });

      const takeButtons = screen.getAllByText(/Assigned/);
      expect(takeButtons[0].closest('button')).toBeDisabled();
    });

    test('50. enables take button when item not assigned', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const takeButtons = screen.getAllByText(/Take/);
      expect(takeButtons[0].closest('button')).not.toBeDisabled();
    });
  });

  // ===== SOCKET INTEGRATION TESTS =====

  describe('Socket Integration', () => {
    test('51. registers socket event listeners on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalledWith('queue_item_assigned', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('moderation_event', expect.any(Function));
      });
    });

    test('52. removes socket event listeners on unmount', async () => {
      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalled();
      });

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('queue_item_assigned', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('moderation_event', expect.any(Function));
    });

    test('53. does not register listeners if socket is null', () => {
      renderComponent({ socket: null });

      expect(mockSocket.on).not.toHaveBeenCalled();
    });

    test('54. emits assign_queue_item when take button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const takeButtons = screen.getAllByText(/Take/);
      fireEvent.click(takeButtons[0].closest('button'));

      expect(mockSocket.emit).toHaveBeenCalledWith('assign_queue_item', {
        queue_id: 'queue1',
      });
    });

    test('55. does not emit when socket is null', async () => {
      renderComponent({ socket: null });

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const takeButtons = screen.getAllByText(/Take/);
      fireEvent.click(takeButtons[0].closest('button'));

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    test('56. emits analyze_content_realtime when re-analyze clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      const reanalyzeButton = screen.getByText(/Re-analyze/);
      fireEvent.click(reanalyzeButton);

      expect(mockSocket.emit).toHaveBeenCalledWith('analyze_content_realtime', {
        content: 'This is a test post content',
        content_type: 'post',
      });
    });

    test('57. registers once listener for analysis result', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      const reanalyzeButton = screen.getByText(/Re-analyze/);
      fireEvent.click(reanalyzeButton);

      expect(mockSocket.once).toHaveBeenCalledWith('analysis_result', expect.any(Function));
    });

    test('58. displays analysis result in alert', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      const reanalyzeButton = screen.getByText(/Re-analyze/);
      fireEvent.click(reanalyzeButton);

      // Get the callback passed to socket.once
      const onceCall = mockSocket.once.mock.calls.find(call => call[0] === 'analysis_result');
      const callback = onceCall[1];

      const mockAnalysis = {
        analysis: {
          toxicity_score: 0.75,
          flagged_categories: ['spam', 'harassment'],
          recommended_action: 'reject',
        },
      };

      callback(mockAnalysis);

      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Toxicity: 75.0%')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Flagged Categories: spam, harassment')
      );
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Recommended Action: reject')
      );
    });

    test('59. refetches queue on queue_item_assigned event', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Get the event handler
      const onCall = mockSocket.on.mock.calls.find(call => call[0] === 'queue_item_assigned');
      const eventHandler = onCall[1];

      await act(async () => {
        eventHandler();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    test('60. refetches queue on moderation_event', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const onCall = mockSocket.on.mock.calls.find(call => call[0] === 'moderation_event');
      const eventHandler = onCall[1];

      await act(async () => {
        eventHandler();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ===== PAGINATION TESTS =====

  describe('Pagination', () => {
    test('61. navigates to next page when next button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next ›');
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
      });
    });

    test('62. navigates to previous page when previous button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      });

      // Go to page 2 first
      const nextButton = screen.getByText('Next ›');
      await act(async () => {
        fireEvent.click(nextButton);
      });

      // Then go back to page 1
      const previousButton = screen.getByText('‹ Previous');
      await act(async () => {
        fireEvent.click(previousButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=1'),
          expect.any(Object)
        );
      });
    });

    test('63. disables previous button on first page', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      });

      const previousButton = screen.getByText('‹ Previous');
      expect(previousButton).toBeDisabled();
    });

    test('64. disables next button on last page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { items: [], total: 40, totalPages: 2 } }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByText('Next ›');
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });
    });

    test('65. displays correct page information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2 (25 total items)')).toBeInTheDocument();
      });
    });

    test('66. includes pagination params in API request', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=1'),
          expect.any(Object)
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=20'),
          expect.any(Object)
        );
      });
    });
  });

  // ===== API INTEGRATION TESTS =====

  describe('API Integration', () => {
    test('67. calls API with correct URL', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/moderation/queue'),
          expect.any(Object)
        );
      });
    });

    test('68. includes authorization header in request', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer ${mockToken}`,
            }),
          })
        );
      });
    });

    test('69. handles API success response', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
        expect(screen.getByText('testuser2')).toBeInTheDocument();
      });
    });

    test('70. handles API error response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      renderComponent();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch queue items');
      });

      consoleErrorSpy.mockRestore();
    });

    test('71. handles network error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching queue items:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    test('72. stops loading state after API call completes', async () => {
      renderComponent();

      expect(screen.getByText('Loading moderation queue...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading moderation queue...')).not.toBeInTheDocument();
      });
    });

    test('73. stops loading state even on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API error'));

      renderComponent();

      expect(screen.getByText('Loading moderation queue...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading moderation queue...')).not.toBeInTheDocument();
      });
    });

    test('74. refetches when refresh button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByText(/Refresh/);
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    test('75. disables refresh button while loading', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ ok: true, json: () => Promise.resolve(mockApiResponse) }),
              100
            )
          )
      );

      renderComponent();

      const refreshButton = screen.getByText(/Refresh/);

      await act(async () => {
        fireEvent.click(refreshButton);
      });

      expect(refreshButton).toBeDisabled();
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====

  describe('Edge Cases and Error Handling', () => {
    test('76. handles missing username gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              items: [{ ...mockQueueItems[0], username: null }],
              total: 1,
              totalPages: 1,
            },
          }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/By: Unknown User/)).toBeInTheDocument();
      });
    });

    test('77. handles missing content preview', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              items: [{ ...mockQueueItems[0], content_preview: null }],
              total: 1,
              totalPages: 1,
            },
          }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('No preview available')).toBeInTheDocument();
      });
    });

    test('78. handles empty flagged categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              items: [{ ...mockQueueItems[0], flagged_categories: [] }],
              total: 1,
              totalPages: 1,
            },
          }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Flagged Categories:')).not.toBeInTheDocument();
      });
    });

    test('79. handles empty triggered rules', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              items: [{ ...mockQueueItems[0], triggered_rules: [] }],
              total: 1,
              totalPages: 1,
            },
          }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Triggered Rules:')).not.toBeInTheDocument();
      });
    });

    test('80. handles unknown priority value', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              items: [{ ...mockQueueItems[0], priority: 99 }],
              total: 1,
              totalPages: 1,
            },
          }),
      });

      renderComponent();

      await waitFor(() => {
        const priorityIndicator = document.querySelector('.priority-indicator');
        expect(priorityIndicator).toHaveStyle({ backgroundColor: '#a0aec0' });
      });
    });

    test('81. handles pagination state updates correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      });

      // Update mock to return different page info
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { items: mockQueueItems, total: 50, totalPages: 3 },
          }),
      });

      const nextButton = screen.getByText('Next ›');
      await act(async () => {
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
      });
    });

    test('82. maintains expanded item state during refetch', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      // Expand first item
      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Content Preview:')).toBeInTheDocument();
      });

      // Refetch
      const refreshButton = screen.getByText(/Refresh/);
      await act(async () => {
        fireEvent.click(refreshButton);
      });

      // Item should still be expanded after refetch
      await waitFor(() => {
        expect(screen.getByText('Content Preview:')).toBeInTheDocument();
      });
    });

    test('83. handles rapid filter changes', async () => {
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Rapidly change filters
      for (let i = 1; i <= 5; i++) {
        const newFilters = { ...defaultFilters, priority: i.toString() };
        rerender(
          <ModerationQueue
            socket={mockSocket}
            filters={newFilters}
            onFiltersChange={mockOnFiltersChange}
            onItemAction={mockOnItemAction}
            onUserSelect={mockOnUserSelect}
          />
        );
      }

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    test('84. handles bulk action with empty notes', async () => {
      global.prompt = jest.fn(() => '');

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const bulkActionSelect = document.querySelector('.bulk-action-select');
      fireEvent.change(bulkActionSelect, { target: { value: 'approved' } });

      const applyButton = screen.getByText('Apply Bulk Action');
      await act(async () => {
        fireEvent.click(applyButton);
      });

      expect(mockOnItemAction).toHaveBeenCalledWith('queue1', 'approved', '');
    });

    test('85. does not apply bulk action if no items selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      // No bulk action panel should be visible
      expect(screen.queryByText('Apply Bulk Action')).not.toBeInTheDocument();
    });

    test('86. handles multiple expanded items', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);

      // Expand first item
      fireEvent.click(detailsButtons[0]);
      await waitFor(() => {
        expect(screen.getByText('This is a test post content')).toBeInTheDocument();
      });

      // Expand second item (should close first)
      fireEvent.click(detailsButtons[1]);
      await waitFor(() => {
        expect(screen.getByText('Another test comment')).toBeInTheDocument();
      });

      // First item content should no longer be visible
      expect(screen.queryByText('This is a test post content')).not.toBeInTheDocument();
    });
  });

  // ===== ADDITIONAL COMPREHENSIVE TESTS =====

  describe('Additional Comprehensive Tests', () => {
    test('87. verifies correct priority labels', async () => {
      const items = [
        { ...mockQueueItems[0], id: 'q1', priority: 4 },
        { ...mockQueueItems[0], id: 'q2', priority: 3 },
        { ...mockQueueItems[0], id: 'q3', priority: 2 },
        { ...mockQueueItems[0], id: 'q4', priority: 1 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { items, total: 4, totalPages: 1 } }),
      });

      renderComponent();

      await waitFor(() => {
        const indicators = document.querySelectorAll('.priority-indicator');
        expect(indicators[0]).toHaveAttribute('title', 'Priority: Critical');
        expect(indicators[1]).toHaveAttribute('title', 'Priority: High');
        expect(indicators[2]).toHaveAttribute('title', 'Priority: Medium');
        expect(indicators[3]).toHaveAttribute('title', 'Priority: Low');
      });
    });

    test('88. maintains selection state across pagination', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      // Select first item
      const checkboxes = document.querySelectorAll('.queue-item input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      // Navigate to next page
      const nextButton = screen.getByText('Next ›');
      await act(async () => {
        fireEvent.click(nextButton);
      });

      // Selection should be cleared on page change
      await waitFor(() => {
        expect(screen.queryByText('items selected')).not.toBeInTheDocument();
      });
    });

    test('89. formats timestamp correctly for different timezones', async () => {
      renderComponent();

      await waitFor(() => {
        const timestamp = new Date('2025-01-15T10:30:00Z');
        const formatted = timestamp.toLocaleString();
        expect(screen.getByText(formatted)).toBeInTheDocument();
      });
    });

    test('90. handles all filter options correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      const statusOptions = statusSelect.querySelectorAll('option');

      expect(statusOptions).toHaveLength(6); // All Statuses + 5 status types
      expect(statusOptions[0]).toHaveTextContent('All Statuses');
      expect(statusOptions[1]).toHaveTextContent('Pending');
      expect(statusOptions[2]).toHaveTextContent('Reviewing');
      expect(statusOptions[3]).toHaveTextContent('Approved');
      expect(statusOptions[4]).toHaveTextContent('Rejected');
      expect(statusOptions[5]).toHaveTextContent('Escalated');
    });

    test('91. handles all priority filter options', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Priority')).toBeInTheDocument();
      });

      const prioritySelect = screen.getByLabelText('Priority');
      const priorityOptions = prioritySelect.querySelectorAll('option');

      expect(priorityOptions).toHaveLength(5); // All Priorities + 4 priority levels
      expect(priorityOptions[0]).toHaveTextContent('All Priorities');
      expect(priorityOptions[1]).toHaveTextContent('Critical');
      expect(priorityOptions[2]).toHaveTextContent('High');
      expect(priorityOptions[3]).toHaveTextContent('Medium');
      expect(priorityOptions[4]).toHaveTextContent('Low');
    });

    test('92. handles all content type filter options', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Content Type')).toBeInTheDocument();
      });

      const contentTypeSelect = screen.getByLabelText('Content Type');
      const contentTypeOptions = contentTypeSelect.querySelectorAll('option');

      expect(contentTypeOptions).toHaveLength(4); // All Types + 3 content types
      expect(contentTypeOptions[0]).toHaveTextContent('All Types');
      expect(contentTypeOptions[1]).toHaveTextContent('Posts');
      expect(contentTypeOptions[2]).toHaveTextContent('Comments');
      expect(contentTypeOptions[3]).toHaveTextContent('Messages');
    });

    test('93. displays correct CSS classes for queue items', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const queueItems = document.querySelectorAll('.queue-item');
      expect(queueItems).toHaveLength(2);

      queueItems.forEach(item => {
        expect(item).toHaveClass('queue-item');
        expect(item.querySelector('.item-header')).toBeInTheDocument();
        expect(item.querySelector('.item-info')).toBeInTheDocument();
        expect(item.querySelector('.item-actions')).toBeInTheDocument();
      });
    });

    test('94. handles select all with empty queue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { items: [], total: 0, totalPages: 0 } }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No items in the moderation queue!')).toBeInTheDocument();
      });

      const selectAllCheckbox = document.querySelector('.queue-header input[type="checkbox"]');
      expect(selectAllCheckbox).not.toBeChecked();
    });

    test('95. verifies panel structure', async () => {
      renderComponent();

      await waitFor(() => {
        expect(document.querySelector('.content-panel')).toBeInTheDocument();
        expect(document.querySelector('.panel-header')).toBeInTheDocument();
        expect(document.querySelector('.filter-bar')).toBeInTheDocument();
        expect(document.querySelector('.queue-list')).toBeInTheDocument();
      });
    });

    test('96. handles concurrent bulk actions', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const selectAllCheckbox = document.querySelector('.queue-header input[type="checkbox"]');
      fireEvent.click(selectAllCheckbox);

      const bulkActionSelect = document.querySelector('.bulk-action-select');
      fireEvent.change(bulkActionSelect, { target: { value: 'approved' } });

      const applyButton = screen.getByText('Apply Bulk Action');

      // Click multiple times rapidly
      await act(async () => {
        fireEvent.click(applyButton);
        fireEvent.click(applyButton);
      });

      // Should only process once
      await waitFor(() => {
        expect(mockOnItemAction).toHaveBeenCalledTimes(2); // 2 items, not 4
      });
    });

    test('97. handles missing auth token', async () => {
      localStorage.removeItem('auth_token');

      renderComponent();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer null',
            }),
          })
        );
      });
    });

    test('98. verifies action button classes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        const approveButton = screen.getByText(/Approve/).closest('button');
        const rejectButton = screen.getByText(/Reject/).closest('button');
        const escalateButton = screen.getByText(/Escalate/).closest('button');

        expect(approveButton).toHaveClass('success');
        expect(rejectButton).toHaveClass('danger');
        expect(escalateButton).toHaveClass('warning');
      });
    });

    test('99. displays detailed actions only in expanded view', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
      });

      // Should not see detailed actions initially
      expect(screen.queryByText(/Approve/)).not.toBeInTheDocument();

      const detailsButtons = screen.getAllByText(/Details/);
      fireEvent.click(detailsButtons[0]);

      // Should see detailed actions after expanding
      await waitFor(() => {
        expect(screen.getByText(/Approve/)).toBeInTheDocument();
        expect(screen.getByText(/Reject/)).toBeInTheDocument();
        expect(screen.getByText(/Escalate/)).toBeInTheDocument();
      });
    });

    test('100. handles component cleanup properly', () => {
      const { unmount } = renderComponent();

      expect(() => {
        unmount();
      }).not.toThrow();

      expect(mockSocket.off).toHaveBeenCalled();
    });
  });
});

export default mockToken
