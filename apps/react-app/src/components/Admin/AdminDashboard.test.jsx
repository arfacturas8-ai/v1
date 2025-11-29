/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from './AdminDashboard';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: ({ size, ...props }) => <div data-testid="shield-icon" {...props} />,
  Users: ({ size, ...props }) => <div data-testid="users-icon" {...props} />,
  FileText: ({ size, ...props }) => <div data-testid="filetext-icon" {...props} />,
  AlertTriangle: ({ size, ...props }) => <div data-testid="alerttriangle-icon" {...props} />,
  BarChart3: ({ size, ...props }) => <div data-testid="barchart3-icon" {...props} />,
  Settings: ({ size, ...props }) => <div data-testid="settings-icon" {...props} />,
  Ban: ({ size, ...props }) => <div data-testid="ban-icon" {...props} />,
  CheckCircle: ({ size, ...props }) => <div data-testid="checkcircle-icon" {...props} />,
  Clock: ({ size, ...props }) => <div data-testid="clock-icon" {...props} />,
  TrendingUp: ({ size, ...props }) => <div data-testid="trendingup-icon" {...props} />,
  MessageSquare: ({ size, ...props }) => <div data-testid="messagesquare-icon" {...props} />,
  Flag: ({ size, ...props }) => <div data-testid="flag-icon" {...props} />,
  Activity: ({ size, ...props }) => <div data-testid="activity-icon" {...props} />,
  Database: ({ size, ...props }) => <div data-testid="database-icon" {...props} />,
  Cpu: ({ size, ...props }) => <div data-testid="cpu-icon" {...props} />,
  DollarSign: ({ size, ...props }) => <div data-testid="dollarsign-icon" {...props} />,
  Eye: ({ size, ...props }) => <div data-testid="eye-icon" {...props} />,
  UserX: ({ size, ...props }) => <div data-testid="userx-icon" {...props} />,
  Trash2: ({ size, ...props }) => <div data-testid="trash2-icon" {...props} />,
  RefreshCw: ({ size, ...props }) => <div data-testid="refreshcw-icon" {...props} />,
  X: ({ size, ...props }) => <div data-testid="x-icon" {...props} />,
}));

// Mock useConfirmationDialog hook
const mockConfirm = jest.fn();
const mockConfirmationDialog = <div data-testid="confirmation-dialog">Confirmation Dialog</div>;

jest.mock('../ui/modal', () => ({
  useConfirmationDialog: () => ({
    confirm: mockConfirm,
    ConfirmationDialog: mockConfirmationDialog,
  }),
}));

// Mock CSS import
jest.mock('./AdminDashboard.css', () => ({}));

describe('AdminDashboard', () => {
  const mockAdminUser = {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    isAdmin: true,
  };

  const mockNonAdminUser = {
    id: 2,
    username: 'user',
    email: 'user@test.com',
    isAdmin: false,
  };

  const mockStats = {
    totalUsers: 5000,
    activeUsers: 1200,
    totalPosts: 8500,
    totalComments: 15000,
    reportedContent: 25,
    pendingReports: 8,
    bannedUsers: 45,
    serverHealth: 'healthy',
  };

  const mockReports = [
    {
      id: 1,
      type: 'spam',
      reason: 'Spam content',
      content: 'This is spam content that needs moderation',
      contentId: 123,
      contentType: 'post',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      type: 'harassment',
      reason: 'Harassment',
      content: 'Inappropriate harassment content',
      contentId: 456,
      contentType: 'comment',
      createdAt: '2024-01-16T11:00:00Z',
    },
  ];

  const mockUsers = [
    {
      id: 1,
      username: 'testuser1',
      email: 'test1@test.com',
      avatar: '/avatar1.png',
      createdAt: '2023-01-15T10:00:00Z',
      postCount: 25,
      reportCount: 0,
      status: 'active',
    },
    {
      id: 2,
      username: 'testuser2',
      email: 'test2@test.com',
      avatar: null,
      createdAt: '2023-06-20T14:00:00Z',
      postCount: 10,
      reportCount: 2,
      status: 'active',
    },
  ];

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.alert = jest.fn();
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== AUTHORIZATION TESTS =====
  describe('Admin Authorization', () => {
    it('renders unauthorized message for non-admin users', () => {
      render(<AdminDashboard user={mockNonAdminUser} onClose={mockOnClose} />);

      expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access the admin dashboard.")).toBeInTheDocument();
    });

    it('shows unauthorized message when user is null', () => {
      render(<AdminDashboard user={null} onClose={mockOnClose} />);

      expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
    });

    it('shows unauthorized message when user isAdmin is false', () => {
      render(<AdminDashboard user={{ ...mockAdminUser, isAdmin: false }} onClose={mockOnClose} />);

      expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
    });

    it('calls onClose when Go Back button is clicked in unauthorized state', () => {
      render(<AdminDashboard user={mockNonAdminUser} onClose={mockOnClose} />);

      const goBackButton = screen.getByText('Go Back');
      fireEvent.click(goBackButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('renders dashboard for admin users', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });
  });

  // ===== INITIAL RENDERING TESTS =====
  describe('Component Rendering', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });
    });

    it('renders without crashing for admin user', async () => {
      const { container } = render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('renders admin dashboard header', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });

    it('renders close button in header', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: '' });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const closeButtons = screen.getAllByTestId('x-icon');
        fireEvent.click(closeButtons[0].closest('button'));
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders confirmation dialog', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
    });
  });

  // ===== TAB NAVIGATION TESTS =====
  describe('Tab Navigation', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });
    });

    it('renders all tabs', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Moderation')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
        expect(screen.getByText('Content')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('has Overview tab active by default', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const overviewTab = screen.getByText('Overview').closest('button');
        expect(overviewTab).toHaveClass('active');
      });
    });

    it('switches to Moderation tab when clicked', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const moderationTab = screen.getByText('Moderation');
        fireEvent.click(moderationTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Content Reports')).toBeInTheDocument();
      });
    });

    it('switches to Users tab when clicked', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const usersTab = screen.getByText('Users');
        fireEvent.click(usersTab);
      });

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('switches to Content tab when clicked', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const contentTab = screen.getByText('Content');
        fireEvent.click(contentTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Content Management')).toBeInTheDocument();
      });
    });

    it('switches to Analytics tab when clicked', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const analyticsTab = screen.getByText('Analytics');
        fireEvent.click(analyticsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
      });
    });

    it('switches to Settings tab when clicked', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const settingsTab = screen.getByText('Settings');
        fireEvent.click(settingsTab);
      });

      await waitFor(() => {
        expect(screen.getByText('Platform Configuration')).toBeInTheDocument();
      });
    });
  });

  // ===== OVERVIEW TAB TESTS =====
  describe('Overview Tab', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });
    });

    it('displays total users stat', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('5,000')).toBeInTheDocument();
        expect(screen.getByText('Total Users')).toBeInTheDocument();
      });
    });

    it('displays active users stat', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('1,200')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
      });
    });

    it('displays total posts stat', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('8,500')).toBeInTheDocument();
        expect(screen.getByText('Total Posts')).toBeInTheDocument();
      });
    });

    it('displays pending reports stat', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('Pending Reports')).toBeInTheDocument();
      });
    });

    it('displays stat change indicators', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('+12% this week')).toBeInTheDocument();
        expect(screen.getByText('+5% today')).toBeInTheDocument();
        expect(screen.getByText('+234 today')).toBeInTheDocument();
      });
    });

    it('displays user growth chart placeholder', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('User Growth')).toBeInTheDocument();
        expect(screen.getByText('Chart visualization here')).toBeInTheDocument();
      });
    });

    it('displays content activity chart placeholder', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Content Activity')).toBeInTheDocument();
        expect(screen.getByText('Activity metrics here')).toBeInTheDocument();
      });
    });

    it('displays system health section', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
        expect(screen.getByText('API Server')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Redis Cache')).toBeInTheDocument();
        expect(screen.getByText('CDN (High Load)')).toBeInTheDocument();
      });
    });
  });

  // ===== DATA FETCHING TESTS =====
  describe('Data Fetching', () => {
    it('fetches admin analytics on mount', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/analytics', {
          headers: {
            'Authorization': 'Bearer test-token',
          },
        });
      });
    });

    it('fetches reports when switching to moderation tab', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const moderationTab = screen.getByText('Moderation');
        fireEvent.click(moderationTab);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/moderation/reports', {
          headers: {
            'Authorization': 'Bearer test-token',
          },
        });
      });
    });

    it('fetches users when switching to users tab', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const usersTab = screen.getByText('Users');
        fireEvent.click(usersTab);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/users', {
          headers: {
            'Authorization': 'Bearer test-token',
          },
        });
      });
    });

    it('handles failed analytics fetch gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      global.fetch.mockRejectedValue(new Error('Network error'));

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch admin data:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles non-ok response for analytics', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('handles non-ok response for reports', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: false,
            status: 403,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const moderationTab = screen.getByText('Moderation');
        fireEvent.click(moderationTab);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/moderation/reports', expect.any(Object));
      });
    });

    it('handles non-ok response for users', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: false,
            status: 403,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        const usersTab = screen.getByText('Users');
        fireEvent.click(usersTab);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/users', expect.any(Object));
      });
    });
  });

  // ===== LOADING STATE TESTS =====
  describe('Loading States', () => {
    it('shows loading state on initial render', () => {
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      expect(screen.getByText('Loading admin data...')).toBeInTheDocument();
    });

    it('hides loading state after data loads', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading admin data...')).not.toBeInTheDocument();
      });
    });

    it('shows loading spinner', () => {
      global.fetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  // ===== MODERATION TAB TESTS =====
  describe('Moderation Tab', () => {
    beforeEach(() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });
    });

    it('displays content reports header', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Content Reports')).toBeInTheDocument();
      });
    });

    it('displays refresh button', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('refetches data when refresh button is clicked', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/admin/moderation/reports', expect.any(Object));
    });

    it('displays reports list', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Spam content')).toBeInTheDocument();
        expect(screen.getByText('Harassment')).toBeInTheDocument();
      });
    });

    it('displays report type and date', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('spam')).toBeInTheDocument();
        expect(screen.getByText('harassment')).toBeInTheDocument();
      });
    });

    it('displays report content preview', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText(/This is spam content that needs moderation.../)).toBeInTheDocument();
      });
    });

    it('displays empty state when no reports', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('No pending reports')).toBeInTheDocument();
      });
    });

    it('displays view button for each report', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        expect(viewButtons.length).toBe(mockReports.length);
      });
    });

    it('displays delete button for each report', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons.length).toBe(mockReports.length);
      });
    });

    it('displays dismiss button for each report', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const dismissButtons = screen.getAllByText('Dismiss');
        expect(dismissButtons.length).toBe(mockReports.length);
      });
    });
  });

  // ===== REPORT ACTIONS TESTS =====
  describe('Report Actions', () => {
    beforeEach(() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });
    });

    it('calls delete content API when delete button clicked', async () => {
      const deleteResponse = { ok: true };
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/admin/content/')) {
          return Promise.resolve(deleteResponse);
        }
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/content/post/123',
          expect.objectContaining({
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer test-token',
            },
          })
        );
      });
    });

    it('shows success alert after deleting content', async () => {
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/admin/content/')) {
          return Promise.resolve({ ok: true });
        }
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Content deleted successfully');
      });
    });

    it('handles delete content error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/content/')) {
          return Promise.reject(new Error('Delete failed'));
        }
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete content:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('calls resolve report API when dismiss button clicked', async () => {
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/admin/moderation/reports/') && options?.method === 'POST') {
          return Promise.resolve({ ok: true });
        }
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const dismissButtons = screen.getAllByText('Dismiss');
        fireEvent.click(dismissButtons[0]);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/moderation/reports/1/resolve',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'dismiss' }),
          })
        );
      });
    });

    it('handles resolve report error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/admin/moderation/reports/') && options?.method === 'POST') {
          return Promise.reject(new Error('Resolve failed'));
        }
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: mockReports }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        const dismissButtons = screen.getAllByText('Dismiss');
        fireEvent.click(dismissButtons[0]);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to resolve report:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ===== USERS TAB TESTS =====
  describe('Users Tab', () => {
    beforeEach(() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });
    });

    it('displays user management header', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('displays user filter dropdown', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });
    });

    it('displays all filter options', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        expect(screen.getByText('All Users')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Banned')).toBeInTheDocument();
        expect(screen.getByText('New (7 days)')).toBeInTheDocument();
      });
    });

    it('displays users table', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('displays table headers', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('Joined')).toBeInTheDocument();
        expect(screen.getByText('Posts')).toBeInTheDocument();
        expect(screen.getByText('Reports')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('displays user data in table', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        expect(screen.getByText('testuser1')).toBeInTheDocument();
        expect(screen.getByText('testuser2')).toBeInTheDocument();
        expect(screen.getByText('test1@test.com')).toBeInTheDocument();
        expect(screen.getByText('test2@test.com')).toBeInTheDocument();
      });
    });

    it('displays user post counts', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(within(table).getByText('25')).toBeInTheDocument();
        expect(within(table).getByText('10')).toBeInTheDocument();
      });
    });

    it('displays user report counts', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const table = screen.getByRole('table');
        const reportCounts = within(table).getAllByText(/^[0-2]$/);
        expect(reportCounts.length).toBeGreaterThan(0);
      });
    });

    it('displays user avatars', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('displays default avatar when user has none', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        const defaultAvatar = images.find(img => img.getAttribute('src')?.includes('default-avatar'));
        expect(defaultAvatar).toBeInTheDocument();
      });
    });

    it('displays action buttons for each user', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const eyeIcons = screen.getAllByTestId('eye-icon');
        const banIcons = screen.getAllByTestId('ban-icon');
        const userXIcons = screen.getAllByTestId('userx-icon');

        expect(eyeIcons.length).toBe(mockUsers.length);
        expect(banIcons.length).toBe(mockUsers.length);
        expect(userXIcons.length).toBe(mockUsers.length);
      });
    });
  });

  // ===== USER ACTIONS TESTS =====
  describe('User Actions', () => {
    beforeEach(() => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/users') && !url.includes('/ban')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });
      mockConfirm.mockResolvedValue(true);
    });

    it('shows confirmation dialog when banning user', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const banIcons = screen.getAllByTestId('ban-icon');
        fireEvent.click(banIcons[0].closest('button'));
      });

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith({
          type: 'error',
          title: 'Ban User',
          description: 'Are you sure you want to ban this user? This will immediately restrict their access to the platform.',
          confirmText: 'Ban User',
          confirmVariant: 'destructive',
        });
      });
    });

    it('calls ban API when user confirms', async () => {
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/admin/users/') && url.includes('/ban')) {
          return Promise.resolve({ ok: true });
        }
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const banIcons = screen.getAllByTestId('ban-icon');
        fireEvent.click(banIcons[0].closest('button'));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/1/ban',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ duration: 'permanent' }),
          })
        );
      });
    });

    it('does not call ban API when user cancels', async () => {
      mockConfirm.mockResolvedValue(false);

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const banIcons = screen.getAllByTestId('ban-icon');
        fireEvent.click(banIcons[0].closest('button'));
      });

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled();
      });

      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/ban'),
        expect.any(Object)
      );
    });

    it('shows success alert after banning user', async () => {
      global.fetch.mockImplementation((url, options) => {
        if (url.includes('/api/admin/users/') && url.includes('/ban')) {
          return Promise.resolve({ ok: true });
        }
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const banIcons = screen.getAllByTestId('ban-icon');
        fireEvent.click(banIcons[0].closest('button'));
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('User banned successfully');
      });
    });

    it('handles ban user error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/users/') && url.includes('/ban')) {
          return Promise.reject(new Error('Ban failed'));
        }
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: mockUsers }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const banIcons = screen.getAllByTestId('ban-icon');
        fireEvent.click(banIcons[0].closest('button'));
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to ban user:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ===== CONTENT TAB TESTS =====
  describe('Content Tab', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });
    });

    it('displays content management header', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'));
      });

      await waitFor(() => {
        expect(screen.getByText('Content Management')).toBeInTheDocument();
      });
    });

    it('displays content tabs', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'));
      });

      await waitFor(() => {
        expect(screen.getByText('All Content')).toBeInTheDocument();
        expect(screen.getByText('Posts')).toBeInTheDocument();
        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByText('Flagged')).toBeInTheDocument();
      });
    });

    it('displays search input', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'));
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search content...');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('displays type filter', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'));
      });

      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument();
        expect(screen.getByText('Messages')).toBeInTheDocument();
      });
    });

    it('displays status filter', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'));
      });

      await waitFor(() => {
        expect(screen.getByText('All Status')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('Removed')).toBeInTheDocument();
      });
    });

    it('displays empty state', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'));
      });

      await waitFor(() => {
        expect(screen.getByText('No content found matching your filters')).toBeInTheDocument();
      });
    });

    it('displays bulk action buttons', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'));
      });

      await waitFor(() => {
        expect(screen.getByText('Approve Selected')).toBeInTheDocument();
        expect(screen.getByText('Remove Selected')).toBeInTheDocument();
      });
    });

    it('bulk action buttons are disabled by default', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Content'));
      });

      await waitFor(() => {
        const approveButton = screen.getByText('Approve Selected').closest('button');
        const removeButton = screen.getByText('Remove Selected').closest('button');

        expect(approveButton).toBeDisabled();
        expect(removeButton).toBeDisabled();
      });
    });
  });

  // ===== ANALYTICS TAB TESTS =====
  describe('Analytics Tab', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });
    });

    it('displays platform analytics header', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
      });
    });

    it('displays engagement rate metric', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
        expect(screen.getByText('68.5%')).toBeInTheDocument();
      });
    });

    it('displays session duration metric', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('Avg. Session Duration')).toBeInTheDocument();
        expect(screen.getByText('12m 34s')).toBeInTheDocument();
      });
    });

    it('displays daily active users metric', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('Daily Active Users')).toBeInTheDocument();
        expect(screen.getByText('4,892')).toBeInTheDocument();
      });
    });

    it('displays content created metric', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('Content Created Today')).toBeInTheDocument();
        expect(screen.getByText('1,247')).toBeInTheDocument();
      });
    });

    it('displays content breakdown', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('Posts: 234')).toBeInTheDocument();
        expect(screen.getByText('Comments: 1,013')).toBeInTheDocument();
      });
    });

    it('displays top communities section', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('Top Communities')).toBeInTheDocument();
        expect(screen.getByText('CryptoTrading')).toBeInTheDocument();
        expect(screen.getByText('Web3Development')).toBeInTheDocument();
        expect(screen.getByText('Gaming')).toBeInTheDocument();
      });
    });

    it('displays community member counts', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('12.4k members')).toBeInTheDocument();
        expect(screen.getByText('8.2k members')).toBeInTheDocument();
        expect(screen.getByText('6.8k members')).toBeInTheDocument();
      });
    });

    it('displays server performance section', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        expect(screen.getByText('Server Performance')).toBeInTheDocument();
        expect(screen.getByText('CPU Usage')).toBeInTheDocument();
        expect(screen.getByText('Memory')).toBeInTheDocument();
        expect(screen.getByText('Storage')).toBeInTheDocument();
      });
    });

    it('displays performance percentages', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        const performanceValues = screen.getAllByText(/^(45|62|38)%$/);
        expect(performanceValues.length).toBe(3);
      });
    });
  });

  // ===== SETTINGS TAB TESTS =====
  describe('Settings Tab', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });
    });

    it('displays platform configuration header', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        expect(screen.getByText('Platform Configuration')).toBeInTheDocument();
      });
    });

    it('displays general settings section', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        expect(screen.getByText('General Settings')).toBeInTheDocument();
        expect(screen.getByText('Platform Name')).toBeInTheDocument();
        expect(screen.getByText('Allow New Registrations')).toBeInTheDocument();
        expect(screen.getByText('Require Email Verification')).toBeInTheDocument();
      });
    });

    it('displays platform name input with default value', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        const input = screen.getByDisplayValue('CRYB');
        expect(input).toBeInTheDocument();
      });
    });

    it('displays content moderation settings', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        expect(screen.getByText('Content Moderation')).toBeInTheDocument();
        expect(screen.getByText('Auto-Moderation')).toBeInTheDocument();
        expect(screen.getByText('Require Post Approval')).toBeInTheDocument();
        expect(screen.getByText('Profanity Filter')).toBeInTheDocument();
      });
    });

    it('displays user settings section', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        expect(screen.getByText('User Settings')).toBeInTheDocument();
        expect(screen.getByText('Default User Role')).toBeInTheDocument();
        expect(screen.getByText('Max Upload Size (MB)')).toBeInTheDocument();
      });
    });

    it('displays security settings section', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Enable Two-Factor Auth')).toBeInTheDocument();
        expect(screen.getByText('Session Timeout (minutes)')).toBeInTheDocument();
      });
    });

    it('displays settings action buttons', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
        expect(screen.getByText('Save Settings')).toBeInTheDocument();
      });
    });

    it('allows changing platform name', async () => {
      const user = userEvent.setup();

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(async () => {
        const input = screen.getByDisplayValue('CRYB');
        await user.clear(input);
        await user.type(input, 'NewPlatform');
        expect(input).toHaveValue('NewPlatform');
      });
    });

    it('displays checkboxes for boolean settings', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it('displays max upload size input with default value', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        const input = screen.getByDisplayValue('10');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'number');
      });
    });

    it('displays session timeout input with default value', async () => {
      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Settings'));
      });

      await waitFor(() => {
        const input = screen.getByDisplayValue('30');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'number');
      });
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====
  describe('Edge Cases', () => {
    it('handles undefined user prop', () => {
      render(<AdminDashboard user={undefined} onClose={mockOnClose} />);
      expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
    });

    it('handles missing onClose prop', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });

      const { container } = render(<AdminDashboard user={mockAdminUser} />);

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });

    it('handles empty stats data', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
      });
    });

    it('handles empty reports array', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('No pending reports')).toBeInTheDocument();
      });
    });

    it('handles empty users array', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });

    it('handles missing localStorage token', async () => {
      localStorage.removeItem('token');

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/analytics', {
          headers: {
            'Authorization': 'Bearer null',
          },
        });
      });
    });

    it('handles report with missing content', async () => {
      const reportWithoutContent = {
        ...mockReports[0],
        content: null,
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/moderation/reports')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reports: [reportWithoutContent] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Moderation'));
      });

      await waitFor(() => {
        expect(screen.getByText('Spam content')).toBeInTheDocument();
      });
    });

    it('handles user with zero post count', async () => {
      const userWithNoPosts = {
        ...mockUsers[0],
        postCount: 0,
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/admin/users')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ users: [userWithNoPosts] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: mockStats }),
        });
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Users'));
      });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(within(table).getByText('0')).toBeInTheDocument();
      });
    });

    it('refetches data when switching between tabs', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ stats: mockStats }),
      });

      render(<AdminDashboard user={mockAdminUser} onClose={mockOnClose} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Analytics'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Overview'));
      });

      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 tab switches
    });
  });
});

export default mockConfirm
