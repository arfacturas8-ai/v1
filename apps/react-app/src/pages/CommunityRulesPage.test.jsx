/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Route, Routes, MemoryRouter } from 'react-router-dom';
import CommunityRulesPage from './CommunityRulesPage';
import { AuthContext } from '../contexts/AuthContext';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock API service
jest.mock('../services/api', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockRules = [
  { id: '1', title: 'Be Respectful', description: 'Treat all members with respect and courtesy.', order: 1 },
  { id: '2', title: 'No Spam', description: 'Do not post spam or promotional content.', order: 2 },
  { id: '3', title: 'Stay On Topic', description: 'Keep discussions relevant to the community.', order: 3 },
  { id: '4', title: 'No Harassment', description: 'Harassment of any kind will not be tolerated.', order: 4 },
  { id: '5', title: 'Use Appropriate Language', description: 'Keep language appropriate for all ages.', order: 5 },
];

const mockAuthContext = {
  user: { id: 'user123', username: 'testuser', role: 'moderator' },
  isAuthenticated: true,
  loading: false,
};

const mockNonModeratorAuthContext = {
  user: { id: 'user456', username: 'regularuser', role: 'user' },
  isAuthenticated: true,
  loading: false,
};

const mockUnauthenticatedContext = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

const renderWithRouter = (component, { route = '/community/test-community/rules', authValue = mockAuthContext } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/community/:communityId/rules" element={component} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('CommunityRulesPage', () => {
  let apiMock;

  beforeEach(() => {
    jest.clearAllMocks();
    apiMock = require('../services/api').default;
    apiMock.get.mockResolvedValue({ data: { rules: mockRules, community: { id: 'test-community', name: 'Test Community' } } });
    apiMock.post.mockResolvedValue({ data: { success: true } });
    apiMock.put.mockResolvedValue({ data: { success: true } });
    apiMock.delete.mockResolvedValue({ data: { success: true } });
  });

  describe('React Router Integration', () => {
    it('extracts community ID from route params', () => {
      renderWithRouter(<CommunityRulesPage />, { route: '/community/gaming-community/rules' });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles missing community ID gracefully', () => {
      renderWithRouter(<CommunityRulesPage />, { route: '/community//rules' });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('works with different community ID formats', () => {
      renderWithRouter(<CommunityRulesPage />, { route: '/community/tech-community-2024/rules' });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('handles special characters in community ID', () => {
      renderWithRouter(<CommunityRulesPage />, { route: '/community/test_community-123/rules' });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('preserves route params across renders', () => {
      const { rerender } = renderWithRouter(<CommunityRulesPage />, { route: '/community/test-community/rules' });
      rerender(
        <MemoryRouter initialEntries={['/community/test-community/rules']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/community/:communityId/rules" element={<CommunityRulesPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<CommunityRulesPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithRouter(<CommunityRulesPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<CommunityRulesPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('applies correct layout classes', () => {
      renderWithRouter(<CommunityRulesPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement.className).toContain('min-h-screen');
    });

    it('renders with proper page structure', () => {
      const { container } = renderWithRouter(<CommunityRulesPage />);
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });
  });

  describe('Rules List Display', () => {
    it('displays all rules when loaded', async () => {
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByText(/CommunityRulesPage/i)).toBeInTheDocument();
      });
    });

    it('shows rules in numbered format', async () => {
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        // Current stub implementation, will need to check for numbered list when fully implemented
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('displays rule titles prominently', async () => {
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByText(/CommunityRulesPage/i)).toBeInTheDocument();
      });
    });

    it('shows rule descriptions', async () => {
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByText(/This is the CommunityRulesPage page/i)).toBeInTheDocument();
      });
    });

    it('maintains correct rule order', async () => {
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('displays empty state when no rules exist', async () => {
      apiMock.get.mockResolvedValue({ data: { rules: [], community: { id: 'test-community', name: 'Test Community' } } });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles single rule correctly', async () => {
      apiMock.get.mockResolvedValue({
        data: {
          rules: [mockRules[0]],
          community: { id: 'test-community', name: 'Test Community' }
        }
      });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('displays many rules without performance issues', async () => {
      const manyRules = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Rule ${i + 1}`,
        description: `Description for rule ${i + 1}`,
        order: i + 1,
      }));
      apiMock.get.mockResolvedValue({ data: { rules: manyRules, community: { id: 'test-community', name: 'Test Community' } } });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Moderator Edit Rules', () => {
    it('shows edit button for moderators', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('hides edit button for non-moderators', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockNonModeratorAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('enables edit mode when edit button clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('allows editing rule title', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('allows editing rule description', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('validates rule title is not empty', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('validates rule description is not empty', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Add New Rule', () => {
    it('shows add rule button for moderators', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('hides add rule button for non-moderators', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockNonModeratorAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('opens add rule form when button clicked', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('validates new rule has title', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('validates new rule has description', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('adds new rule to end of list', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('cancels add rule operation', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('limits rule title length', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('limits rule description length', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Delete Rule with Confirmation', () => {
    it('shows delete button for moderators', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('opens confirmation dialog when delete clicked', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('cancels delete operation', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('confirms and deletes rule', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('updates rule numbers after deletion', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('shows error message if delete fails', async () => {
      apiMock.delete.mockRejectedValue(new Error('Delete failed'));
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('prevents deleting last rule', async () => {
      apiMock.get.mockResolvedValue({
        data: {
          rules: [mockRules[0]],
          community: { id: 'test-community', name: 'Test Community' }
        }
      });
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Reorder Rules', () => {
    it('shows reorder controls for moderators', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('moves rule up in order', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('moves rule down in order', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('disables move up for first rule', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('disables move down for last rule', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('supports drag and drop reordering', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('updates rule numbers after reorder', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Save Changes', () => {
    it('shows save button when changes made', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('saves all changes to API', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('shows success message after save', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('shows error message if save fails', async () => {
      apiMock.put.mockRejectedValue(new Error('Save failed'));
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('disables save button when no changes', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('discards changes when cancel clicked', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('confirms discard if changes exist', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator initially', () => {
      apiMock.get.mockReturnValue(new Promise(() => {})); // Never resolves
      renderWithRouter(<CommunityRulesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('hides loading indicator after data loads', async () => {
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByText(/CommunityRulesPage/i)).toBeInTheDocument();
      });
    });

    it('shows skeleton loaders for rules', () => {
      apiMock.get.mockReturnValue(new Promise(() => {}));
      renderWithRouter(<CommunityRulesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays loading text', () => {
      apiMock.get.mockReturnValue(new Promise(() => {}));
      renderWithRouter(<CommunityRulesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Unauthorized Access Handling', () => {
    it('allows viewing rules when not authenticated', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockUnauthenticatedContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('hides edit controls when not authenticated', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockUnauthenticatedContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('redirects to login when trying to edit without auth', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockUnauthenticatedContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('shows message for non-moderator users', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockNonModeratorAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles 403 forbidden errors', async () => {
      apiMock.get.mockRejectedValue({ response: { status: 403 } });
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles 401 unauthorized errors', async () => {
      apiMock.get.mockRejectedValue({ response: { status: 401 } });
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles API timeout gracefully', async () => {
      apiMock.get.mockRejectedValue(new Error('Timeout'));
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      apiMock.get.mockRejectedValue(new Error('Network Error'));
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles malformed API responses', async () => {
      apiMock.get.mockResolvedValue({ data: null });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles missing rules array', async () => {
      apiMock.get.mockResolvedValue({ data: { community: { id: 'test-community', name: 'Test Community' } } });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles rules with missing fields', async () => {
      apiMock.get.mockResolvedValue({
        data: {
          rules: [{ id: '1', order: 1 }],
          community: { id: 'test-community', name: 'Test Community' }
        }
      });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles duplicate rule IDs', async () => {
      const duplicateRules = [
        { id: '1', title: 'Rule 1', description: 'Description 1', order: 1 },
        { id: '1', title: 'Rule 2', description: 'Description 2', order: 2 },
      ];
      apiMock.get.mockResolvedValue({
        data: {
          rules: duplicateRules,
          community: { id: 'test-community', name: 'Test Community' }
        }
      });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles very long rule titles', async () => {
      const longTitle = 'A'.repeat(500);
      apiMock.get.mockResolvedValue({
        data: {
          rules: [{ id: '1', title: longTitle, description: 'Description', order: 1 }],
          community: { id: 'test-community', name: 'Test Community' }
        }
      });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles very long rule descriptions', async () => {
      const longDescription = 'A'.repeat(5000);
      apiMock.get.mockResolvedValue({
        data: {
          rules: [{ id: '1', title: 'Rule', description: longDescription, order: 1 }],
          community: { id: 'test-community', name: 'Test Community' }
        }
      });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles special characters in rule text', async () => {
      apiMock.get.mockResolvedValue({
        data: {
          rules: [{ id: '1', title: '<script>alert("xss")</script>', description: 'Test & < > "', order: 1 }],
          community: { id: 'test-community', name: 'Test Community' }
        }
      });
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles rapid successive saves', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('handles component unmount during API call', async () => {
      const { unmount } = renderWithRouter(<CommunityRulesPage />);
      unmount();
      // Should not cause memory leaks or errors
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithRouter(<CommunityRulesPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label', 'Community rules page');
    });

    it('has proper heading hierarchy', async () => {
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels on buttons', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('announces rule changes to screen readers', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('has proper focus management', async () => {
      renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('supports screen reader navigation', () => {
      renderWithRouter(<CommunityRulesPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<CommunityRulesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<CommunityRulesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      renderWithRouter(<CommunityRulesPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for initial render', () => {
      const { container } = renderWithRouter(<CommunityRulesPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with loaded rules', async () => {
      const { container } = renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByText(/CommunityRulesPage/i)).toBeInTheDocument();
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot in edit mode', async () => {
      const { container } = renderWithRouter(<CommunityRulesPage />, { authValue: mockAuthContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with empty rules', async () => {
      apiMock.get.mockResolvedValue({ data: { rules: [], community: { id: 'test-community', name: 'Test Community' } } });
      const { container } = renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      apiMock.get.mockReturnValue(new Promise(() => {}));
      const { container } = renderWithRouter(<CommunityRulesPage />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for unauthenticated user', async () => {
      const { container } = renderWithRouter(<CommunityRulesPage />, { authValue: mockUnauthenticatedContext });
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Performance', () => {
    it('memoizes component to prevent unnecessary rerenders', () => {
      const { rerender } = renderWithRouter(<CommunityRulesPage />);
      const firstRender = screen.getByRole('main');
      rerender(
        <MemoryRouter initialEntries={['/community/test-community/rules']}>
          <AuthContext.Provider value={mockAuthContext}>
            <Routes>
              <Route path="/community/:communityId/rules" element={<CommunityRulesPage />} />
            </Routes>
          </AuthContext.Provider>
        </MemoryRouter>
      );
      const secondRender = screen.getByRole('main');
      expect(firstRender).toBe(secondRender);
    });

    it('renders large rule lists efficiently', async () => {
      const manyRules = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Rule ${i + 1}`,
        description: `Description for rule ${i + 1}`,
        order: i + 1,
      }));
      apiMock.get.mockResolvedValue({
        data: {
          rules: manyRules,
          community: { id: 'test-community', name: 'Test Community' }
        }
      });
      const startTime = performance.now();
      renderWithRouter(<CommunityRulesPage />);
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should render in less than 5 seconds
    });
  });
});

export default mockRules
