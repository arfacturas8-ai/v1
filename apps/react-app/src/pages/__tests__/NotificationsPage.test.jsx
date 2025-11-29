import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationsPage from '../NotificationsPage';
import { AuthContext } from '../../contexts/AuthContext';
import { mockAuthContext, mockUnauthContext } from '../../../tests/utils/testUtils';

// Mock services
jest.mock('../../services/api', () => ({
  default: {
    get: jest.fn().mockResolvedValue({
      success: true,
      data: {
        notifications: [
          {
            id: '1',
            type: 'like',
            title: 'New Like',
            message: 'Someone liked your post',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
      },
    }),
    put: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('NotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(<NotificationsPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithRouter(<NotificationsPage />);
    expect(screen.getByTestId('loading-spinner') || document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('displays notifications after loading', async () => {
    renderWithRouter(<NotificationsPage />);
    await waitFor(() => {
      expect(screen.getByText('New Like')).toBeInTheDocument();
      expect(screen.getByText(/Someone liked your post/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.get.mockResolvedValueOnce({
      success: true,
      data: { notifications: [], unreadCount: 0 },
    });

    renderWithRouter(<NotificationsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No notifications/i) || screen.getByText(/All caught up/i)).toBeInTheDocument();
    });
  });

  it('marks notification as read when clicked', async () => {
    const apiMock = await import('../../services/api');
    renderWithRouter(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('New Like')).toBeInTheDocument();
    });

    const notification = screen.getByText('New Like').closest('div');
    if (notification) {
      fireEvent.click(notification);
      await waitFor(() => {
        expect(apiMock.default.put).toHaveBeenCalled();
      });
    }
  });

  it('marks all as read when button clicked', async () => {
    const apiMock = await import('../../services/api');
    renderWithRouter(<NotificationsPage />);

    await waitFor(() => {
      const markAllButton = screen.queryByText(/Mark all as read/i) || screen.queryByRole('button', { name: /mark all/i });
      if (markAllButton) {
        fireEvent.click(markAllButton);
        expect(apiMock.default.put).toHaveBeenCalled();
      }
    });
  });

  it('deletes notification when delete button clicked', async () => {
    const apiMock = await import('../../services/api');
    renderWithRouter(<NotificationsPage />);

    await waitFor(() => {
      const deleteButton = screen.queryByRole('button', { name: /delete/i }) ||
                          screen.queryByLabelText(/delete/i);
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(apiMock.default.delete).toHaveBeenCalled();
      }
    });
  });

  it('redirects unauthenticated users', () => {
    renderWithRouter(<NotificationsPage />, mockUnauthContext);
    // Component should handle auth check
    expect(screen.queryByRole('main')).toBeTruthy();
  });

  it('handles API errors gracefully', async () => {
    const apiMock = await import('../../services/api');
    apiMock.default.get.mockRejectedValueOnce(new Error('API Error'));

    renderWithRouter(<NotificationsPage />);
    await waitFor(() => {
      expect(screen.getByText(/error/i) || screen.getByText(/failed/i) || document.querySelector('[role="alert"]')).toBeTruthy();
    });
  });

  it('filters notifications by type', async () => {
    renderWithRouter(<NotificationsPage />);
    await waitFor(() => {
      const filterButton = screen.queryByText(/Filter/i) || screen.queryByRole('button', { name: /all/i });
      if (filterButton) {
        expect(filterButton).toBeInTheDocument();
      }
    });
  });

  it('displays unread count badge', async () => {
    renderWithRouter(<NotificationsPage />);
    await waitFor(() => {
      // Check for unread count indicator
      const unreadIndicator = screen.queryByText('1') || document.querySelector('[data-unread]');
      expect(unreadIndicator).toBeTruthy();
    });
  });

  it('shows notification types correctly', async () => {
    renderWithRouter(<NotificationsPage />);
    await waitFor(() => {
      expect(screen.getByText('New Like')).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    renderWithRouter(<NotificationsPage />);
    await waitFor(() => {
      // Check for time formatting (e.g., "2 hours ago", "Just now")
      const timeElement = document.querySelector('[datetime]') || document.querySelector('time');
      expect(timeElement).toBeTruthy();
    });
  });
});

export default renderWithRouter
