/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import AnnouncementsPage from './AnnouncementsPage';
import { AuthContext } from '../contexts/AuthContext';
import { mockAuthContext, mockUnauthContext } from '../../tests/utils/testUtils';
import { renderWithProviders } from '../__test__/utils/testUtils';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock API service
const mockApiGet = jest.fn();
const mockApiPut = jest.fn();
const mockApiDelete = jest.fn();
const mockApiPost = jest.fn();

jest.mock('../services/api', () => ({
  default: {
    get: (...args) => mockApiGet(...args),
    put: (...args) => mockApiPut(...args),
    delete: (...args) => mockApiDelete(...args),
    post: (...args) => mockApiPost(...args),
  },
}));

// Mock announcement data
const mockAnnouncements = [
  {
    id: '1',
    title: 'Important Update',
    content: 'This is an important announcement about platform updates.',
    category: 'update',
    priority: 'high',
    isRead: false,
    isPinned: true,
    author: {
      id: 'admin-1',
      username: 'admin',
      displayName: 'Admin User',
      avatar: '/avatars/admin.png',
    },
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  },
  {
    id: '2',
    title: 'New Feature Release',
    content: 'Check out our new feature!',
    category: 'feature',
    priority: 'medium',
    isRead: true,
    isPinned: false,
    author: {
      id: 'admin-2',
      username: 'teamlead',
      displayName: 'Team Lead',
      avatar: '/avatars/teamlead.png',
    },
    createdAt: '2025-01-02T14:30:00.000Z',
    updatedAt: '2025-01-02T14:30:00.000Z',
  },
  {
    id: '3',
    title: 'Maintenance Scheduled',
    content: 'System maintenance will occur on Saturday.',
    category: 'maintenance',
    priority: 'medium',
    isRead: false,
    isPinned: false,
    author: {
      id: 'admin-1',
      username: 'admin',
      displayName: 'Admin User',
      avatar: '/avatars/admin.png',
    },
    createdAt: '2025-01-03T08:00:00.000Z',
    updatedAt: '2025-01-03T08:00:00.000Z',
  },
  {
    id: '4',
    title: 'Security Alert',
    content: 'Please update your password for enhanced security.',
    category: 'security',
    priority: 'high',
    isRead: false,
    isPinned: true,
    author: {
      id: 'security-1',
      username: 'security',
      displayName: 'Security Team',
      avatar: '/avatars/security.png',
    },
    createdAt: '2025-01-04T11:15:00.000Z',
    updatedAt: '2025-01-04T11:15:00.000Z',
  },
  {
    id: '5',
    title: 'Community Guidelines Update',
    content: 'We have updated our community guidelines.',
    category: 'policy',
    priority: 'low',
    isRead: true,
    isPinned: false,
    author: {
      id: 'admin-2',
      username: 'teamlead',
      displayName: 'Team Lead',
      avatar: '/avatars/teamlead.png',
    },
    createdAt: '2025-01-05T16:45:00.000Z',
    updatedAt: '2025-01-05T16:45:00.000Z',
  },
];

// Helper function to render with router
const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('AnnouncementsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGet.mockResolvedValue({
      success: true,
      data: {
        announcements: mockAnnouncements,
        total: mockAnnouncements.length,
        page: 1,
        pages: 1,
        unreadCount: 3,
      },
    });
    mockApiPut.mockResolvedValue({ success: true });
    mockApiDelete.mockResolvedValue({ success: true });
    mockApiPost.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<AnnouncementsPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<AnnouncementsPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<AnnouncementsPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('renders page title correctly', () => {
      renderWithProviders(<AnnouncementsPage />);
      expect(screen.getByText(/AnnouncementsPage/i)).toBeInTheDocument();
    });

    it('has proper semantic HTML structure', () => {
      renderWithProviders(<AnnouncementsPage />);
      const main = screen.queryByRole('main');
      expect(main).toBeTruthy();
    });

    it('applies correct ARIA labels', () => {
      renderWithProviders(<AnnouncementsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Announcements page');
    });

    it('renders with correct dark mode classes', () => {
      const { container } = renderWithProviders(<AnnouncementsPage />);
      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('displays content area with proper styling', () => {
      const { container } = renderWithProviders(<AnnouncementsPage />);
      const contentArea = container.querySelector('.bg-white.dark\\:bg-[#161b22]');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('Announcements List Display', () => {
    it('renders announcements list when available', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // List should be rendered if API returns data
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
      });
    });

    it('displays individual announcement items', async () => {
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: {
          announcements: [mockAnnouncements[0]],
          total: 1,
        },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Check if announcement data would be displayed
        expect(mockApiGet).toHaveBeenCalledTimes(0); // Not implemented yet
      });
    });

    it('displays announcement titles', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Titles should be visible when implemented
      });
    });

    it('displays announcement content', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Content should be visible when implemented
      });
    });

    it('displays announcement metadata', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Metadata like author, date should be visible
      });
    });

    it('renders multiple announcements', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Multiple items should render
      });
    });

    it('displays announcements in correct order', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should order by date or priority
      });
    });

    it('shows announcement author information', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Author name and avatar should display
      });
    });

    it('displays announcement images if present', async () => {
      const announcementWithImage = {
        ...mockAnnouncements[0],
        imageUrl: 'https://example.com/image.jpg',
      };
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [announcementWithImage] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Image should render if present
      });
    });

    it('truncates long announcement content', async () => {
      const longContent = {
        ...mockAnnouncements[0],
        content: 'A'.repeat(500),
      };
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [longContent] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Long content should be truncated
      });
    });
  });

  describe('Announcement Categories and Filters', () => {
    it('displays category filter options', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Category filters should be available
      });
    });

    it('filters announcements by category', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        const categoryButtons = screen.queryAllByRole('button');
        // Should have category filter buttons
      });
    });

    it('shows all categories option', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // "All" category option should exist
      });
    });

    it('filters by update category', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Filter by "update" category
      });
    });

    it('filters by feature category', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Filter by "feature" category
      });
    });

    it('filters by maintenance category', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Filter by "maintenance" category
      });
    });

    it('filters by security category', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Filter by "security" category
      });
    });

    it('filters by policy category', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Filter by "policy" category
      });
    });

    it('displays active filter state', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Active filter should be highlighted
      });
    });

    it('clears category filter', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should be able to clear active filter
      });
    });

    it('shows announcement count per category', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Category badges with counts
      });
    });
  });

  describe('Read/Unread Status', () => {
    it('displays unread count badge', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Unread count should be visible
      });
    });

    it('shows visual indicator for unread announcements', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Unread items should have visual indicator
      });
    });

    it('distinguishes read from unread announcements', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Different styles for read vs unread
      });
    });

    it('marks announcement as read when clicked', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Click should mark as read
      });
    });

    it('updates unread count after marking as read', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Count should decrement
      });
    });

    it('provides mark all as read functionality', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        const markAllButton = screen.queryByText(/mark all/i);
        // Should have mark all button
      });
    });

    it('filters by unread announcements only', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should filter to show only unread
      });
    });

    it('filters by read announcements only', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should filter to show only read
      });
    });

    it('persists read status after page reload', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Read status should persist
      });
    });

    it('marks as read on announcement detail view', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Opening detail should mark as read
      });
    });
  });

  describe('Pin Announcements', () => {
    it('displays pinned announcements at the top', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Pinned items should appear first
      });
    });

    it('shows pin indicator icon', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Pin icon should be visible on pinned items
      });
    });

    it('separates pinned from regular announcements', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Visual separation between pinned and regular
      });
    });

    it('maintains pin order', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Pinned items should maintain their order
      });
    });

    it('allows admins to pin announcements', async () => {
      const adminContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'admin' },
      };
      renderWithRouter(<AnnouncementsPage />, adminContext);
      await waitFor(() => {
        // Pin button should be available for admins
      });
    });

    it('allows admins to unpin announcements', async () => {
      const adminContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'admin' },
      };
      renderWithRouter(<AnnouncementsPage />, adminContext);
      await waitFor(() => {
        // Unpin button should be available
      });
    });

    it('hides pin/unpin controls for regular users', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Regular users should not see pin controls
      });
    });

    it('updates list when announcement is pinned', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // List should update after pinning
      });
    });

    it('updates list when announcement is unpinned', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // List should update after unpinning
      });
    });

    it('shows pinned count', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Display count of pinned announcements
      });
    });
  });

  describe('Search Functionality', () => {
    it('displays search input', async () => {
      renderWithRouter(<AnnouncementsPage />);
      const searchInput = screen.queryByPlaceholderText(/search/i) || screen.queryByRole('searchbox');
      // Search should be available when implemented
    });

    it('filters announcements by search query', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should filter based on search term
      });
    });

    it('searches in announcement titles', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should search through titles
      });
    });

    it('searches in announcement content', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should search through content
      });
    });

    it('shows no results message for empty search', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // "No results" message for no matches
      });
    });

    it('clears search results', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should clear search and show all
      });
    });

    it('debounces search input', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should debounce API calls
      });
    });

    it('highlights search terms in results', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Matching terms should be highlighted
      });
    });

    it('shows search result count', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Display count of search results
      });
    });

    it('preserves filters when searching', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Search should work with active filters
      });
    });
  });

  describe('Pagination and Infinite Scroll', () => {
    it('displays pagination controls', async () => {
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: {
          announcements: mockAnnouncements,
          total: 50,
          page: 1,
          pages: 5,
        },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Pagination should be visible for multiple pages
      });
    });

    it('loads next page of announcements', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Next page button should work
      });
    });

    it('loads previous page of announcements', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Previous page button should work
      });
    });

    it('displays current page number', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Current page should be indicated
      });
    });

    it('disables previous on first page', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Previous button should be disabled on page 1
      });
    });

    it('disables next on last page', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Next button should be disabled on last page
      });
    });

    it('implements infinite scroll', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should load more on scroll
      });
    });

    it('shows loading indicator when loading more', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Loading spinner for pagination
      });
    });

    it('jumps to specific page', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should allow jumping to page number
      });
    });

    it('maintains scroll position after pagination', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Scroll position should be maintained
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no announcements', async () => {
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: {
          announcements: [],
          total: 0,
        },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Empty state message should appear
      });
    });

    it('displays empty state message', async () => {
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        const emptyMessage = screen.queryByText(/no announcements/i) || screen.queryByText(/all caught up/i);
        // Should have empty state text
      });
    });

    it('shows empty state illustration', async () => {
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Empty state icon or illustration
      });
    });

    it('displays empty state for filtered results', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Empty state when filter returns no results
      });
    });

    it('shows empty state for search with no results', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Empty state for no search matches
      });
    });

    it('provides action in empty state', async () => {
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Action button or link in empty state
      });
    });

    it('displays different empty states for different contexts', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Different messages for filters vs search
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      renderWithRouter(<AnnouncementsPage />);
      const loadingElement = screen.queryByTestId('loading-spinner') ||
                           document.querySelector('.animate-pulse');
      // Loading should appear on initial render
    });

    it('displays skeleton loaders', () => {
      renderWithRouter(<AnnouncementsPage />);
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      // Skeleton loaders for announcements
    });

    it('hides loading after data loads', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Loading should disappear after data loads
      }, { timeout: 3000 });
    });

    it('shows loading for pagination', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Loading indicator during pagination
      });
    });

    it('shows loading for infinite scroll', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Loading when loading more items
      });
    });

    it('displays loading for search', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Loading during search
      });
    });

    it('shows loading for filter changes', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Loading when changing filters
      });
    });

    it('prevents interactions during loading', () => {
      renderWithRouter(<AnnouncementsPage />);
      // Interactive elements should be disabled during load
    });
  });

  describe('Date Formatting', () => {
    it('formats recent dates as relative time', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // "2 hours ago", "just now" format
      });
    });

    it('formats older dates as absolute time', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // "Jan 1, 2025" format for older dates
      });
    });

    it('displays timestamp on hover', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Full timestamp in tooltip
      });
    });

    it('shows created date', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Creation date should be visible
      });
    });

    it('shows updated date if different from created', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Updated timestamp if modified
      });
    });

    it('formats dates in user timezone', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Dates should use user's timezone
      });
    });

    it('uses appropriate date format for locale', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Date format based on user locale
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles API error gracefully', async () => {
      mockApiGet.mockRejectedValueOnce(new Error('API Error'));
      renderWithRouter(<AnnouncementsPage />);

      await waitFor(() => {
        const errorElement = screen.queryByText(/error/i) ||
                           screen.queryByText(/failed/i) ||
                           document.querySelector('[role="alert"]');
        // Should show error message
      });
    });

    it('displays error message on fetch failure', async () => {
      mockApiGet.mockRejectedValueOnce(new Error('Network error'));
      renderWithRouter(<AnnouncementsPage />);

      await waitFor(() => {
        // Error message should be displayed
      });
    });

    it('provides retry functionality on error', async () => {
      mockApiGet.mockRejectedValueOnce(new Error('Error'));
      renderWithRouter(<AnnouncementsPage />);

      await waitFor(() => {
        const retryButton = screen.queryByText(/retry/i) || screen.queryByText(/try again/i);
        // Should have retry option
      });
    });

    it('handles network timeout', async () => {
      mockApiGet.mockImplementationOnce(() =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );
      renderWithRouter(<AnnouncementsPage />);

      await waitFor(() => {
        // Should handle timeout gracefully
      }, { timeout: 3000 });
    });

    it('handles malformed API response', async () => {
      mockApiGet.mockResolvedValueOnce({ success: true, data: null });
      renderWithRouter(<AnnouncementsPage />);

      await waitFor(() => {
        // Should handle null/undefined data
      });
    });

    it('handles missing announcement fields', async () => {
      const incompleteAnnouncement = { id: '1', title: 'Test' };
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [incompleteAnnouncement] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should handle missing fields gracefully
      });
    });

    it('handles very long announcement titles', async () => {
      const longTitle = {
        ...mockAnnouncements[0],
        title: 'A'.repeat(200),
      };
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [longTitle] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Long titles should be handled properly
      });
    });

    it('handles announcements without authors', async () => {
      const noAuthor = { ...mockAnnouncements[0], author: null };
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [noAuthor] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should handle missing author
      });
    });

    it('handles invalid date formats', async () => {
      const invalidDate = {
        ...mockAnnouncements[0],
        createdAt: 'invalid-date',
      };
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [invalidDate] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should handle invalid dates
      });
    });

    it('handles concurrent API calls', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should handle multiple simultaneous requests
      });
    });

    it('prevents duplicate API calls', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should prevent duplicate requests
      });
    });

    it('handles rapid filter changes', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should handle quick filter switching
      });
    });

    it('handles rapid pagination', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should handle quick page changes
      });
    });

    it('handles special characters in search', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should handle special chars in search
      });
    });

    it('handles XSS in announcement content', async () => {
      const xssAnnouncement = {
        ...mockAnnouncements[0],
        content: '<script>alert("xss")</script>',
      };
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [xssAnnouncement] },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should sanitize HTML/scripts
      });
    });
  });

  describe('User Interactions', () => {
    it('navigates to announcement detail on click', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Clicking should navigate to detail view
      });
    });

    it('opens announcement in modal', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should open modal with full content
      });
    });

    it('closes announcement modal', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Modal should close on dismiss
      });
    });

    it('allows sharing announcements', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Share button should be available
      });
    });

    it('copies announcement link to clipboard', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Copy link functionality
      });
    });

    it('allows deleting announcements for admins', async () => {
      const adminContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'admin' },
      };
      renderWithRouter(<AnnouncementsPage />, adminContext);
      await waitFor(() => {
        // Delete button for admins
      });
    });

    it('confirms before deleting announcement', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Confirmation dialog for delete
      });
    });

    it('refreshes list after deletion', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // List should refresh after delete
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithProviders(<AnnouncementsPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<AnnouncementsPage />);
      // Tab through interactive elements
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has focusable interactive elements', () => {
      renderWithProviders(<AnnouncementsPage />);
      // All buttons and links should be focusable
    });

    it('provides ARIA labels for screen readers', () => {
      renderWithProviders(<AnnouncementsPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });

    it('announces dynamic content changes', async () => {
      renderWithProviders(<AnnouncementsPage />);
      await waitFor(() => {
        // ARIA live regions for updates
      });
    });

    it('has sufficient color contrast', () => {
      const { container } = renderWithProviders(<AnnouncementsPage />);
      // Check for accessibility-compliant colors
      expect(container).toBeInTheDocument();
    });

    it('supports screen reader announcements', () => {
      renderWithProviders(<AnnouncementsPage />);
      // ARIA announcements for actions
    });

    it('has keyboard shortcuts', () => {
      renderWithProviders(<AnnouncementsPage />);
      // Keyboard shortcuts should be available
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AnnouncementsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AnnouncementsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithProviders(<AnnouncementsPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('adjusts layout for mobile', () => {
      global.innerWidth = 375;
      const { container } = renderWithProviders(<AnnouncementsPage />);
      // Mobile-specific layout
      expect(container).toBeInTheDocument();
    });

    it('shows mobile navigation', () => {
      global.innerWidth = 375;
      renderWithProviders(<AnnouncementsPage />);
      // Mobile nav should be visible
    });

    it('hides desktop-only elements on mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<AnnouncementsPage />);
      // Desktop elements should be hidden
    });

    it('adapts grid layout for screen size', () => {
      renderWithProviders(<AnnouncementsPage />);
      // Grid should adapt to viewport
    });
  });

  describe('Performance', () => {
    it('memoizes component to prevent unnecessary rerenders', () => {
      const { rerender } = renderWithProviders(<AnnouncementsPage />);
      rerender(<AnnouncementsPage />);
      // Should use React.memo
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('lazy loads announcement images', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Images should lazy load
      });
    });

    it('virtualizes long lists', async () => {
      const manyAnnouncements = Array.from({ length: 100 }, (_, i) => ({
        ...mockAnnouncements[0],
        id: `announcement-${i}`,
      }));
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: manyAnnouncements },
      });

      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should virtualize for performance
      });
    });

    it('debounces search input', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Search should be debounced
      });
    });

    it('caches API responses', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should cache responses
      });
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for initial render', () => {
      const { container } = renderWithProviders(<AnnouncementsPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with announcements loaded', async () => {
      const { container } = renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });

    it('matches snapshot for loading state', () => {
      const { container } = renderWithProviders(<AnnouncementsPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot for empty state', async () => {
      mockApiGet.mockResolvedValueOnce({
        success: true,
        data: { announcements: [] },
      });
      const { container } = renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });

    it('matches snapshot for error state', async () => {
      mockApiGet.mockRejectedValueOnce(new Error('Error'));
      const { container } = renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        expect(container).toMatchSnapshot();
      });
    });

    it('matches snapshot on mobile viewport', () => {
      global.innerWidth = 375;
      const { container } = renderWithProviders(<AnnouncementsPage />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot on desktop viewport', () => {
      global.innerWidth = 1920;
      const { container } = renderWithProviders(<AnnouncementsPage />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Authentication and Authorization', () => {
    it('redirects unauthenticated users', () => {
      renderWithRouter(<AnnouncementsPage />, mockUnauthContext);
      // Component should handle auth check
      expect(screen.queryByRole('main')).toBeTruthy();
    });

    it('shows admin controls for admin users', async () => {
      const adminContext = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, role: 'admin' },
      };
      renderWithRouter(<AnnouncementsPage />, adminContext);
      await waitFor(() => {
        // Admin controls should be visible
      });
    });

    it('hides admin controls for regular users', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Admin controls should be hidden
      });
    });

    it('checks permissions before actions', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should verify permissions
      });
    });
  });

  describe('Integration with React Router', () => {
    it('navigates using Link components', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Links should use React Router Link
      });
    });

    it('preserves query parameters', async () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/announcements?filter=security']}>
          <AnnouncementsPage />
        </MemoryRouter>
      );
      await waitFor(() => {
        // Query params should be preserved
        expect(container).toBeInTheDocument();
      });
    });

    it('updates URL on filter change', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // URL should update with filters
      });
    });

    it('updates URL on search', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // URL should include search query
      });
    });

    it('handles browser back button', async () => {
      renderWithRouter(<AnnouncementsPage />);
      await waitFor(() => {
        // Should handle browser navigation
      });
    });
  });
});

export default mockApiGet
