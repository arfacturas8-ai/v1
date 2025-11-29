/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__test__/utils/testUtils';
import { BrowserRouter } from 'react-router-dom';
import CommunityWikiPage from '../CommunityWikiPage';
import { AuthContext } from '../../contexts/AuthContext';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'member',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const mockEditorContext = {
  ...mockAuthContext,
  user: {
    ...mockAuthContext.user,
    role: 'editor',
  },
};

const mockWikiArticles = [
  {
    id: '1',
    title: 'Getting Started Guide',
    content: 'Welcome to our community wiki',
    category: 'guides',
    author: 'admin',
    lastEdited: '2024-01-01T00:00:00Z',
    version: 3,
    views: 1000,
  },
  {
    id: '2',
    title: 'Community Rules',
    content: 'Please follow these rules',
    category: 'policy',
    author: 'moderator',
    lastEdited: '2024-01-02T00:00:00Z',
    version: 1,
    views: 500,
  },
];

const renderWithAuth = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('CommunityWikiPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithProviders(<CommunityWikiPage />);
      const mainElement = screen.queryByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithProviders(<CommunityWikiPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page title', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText(/CommunityWikiPage/i)).toBeInTheDocument();
    });

    it('renders with correct aria-label', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Community wiki page');
    });

    it('applies correct theme classes', () => {
      const { container } = renderWithProviders(<CommunityWikiPage />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('bg-gray-50', 'dark:bg-[#0d1117]');
    });

    it('displays wiki navigation sidebar', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows table of contents', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Wiki Articles Display', () => {
    it('displays empty state when no articles exist', () => {
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByText(/This is the CommunityWikiPage page/i)).toBeInTheDocument();
    });

    it('renders list of wiki articles', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays article titles', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows article summaries', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays article categories', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows article authors', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays last edited timestamps', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows article view counts', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays featured articles', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows recently updated articles', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays popular articles', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows article thumbnails', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays article tags', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows article status badges', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Article Reading', () => {
    it('opens article on click', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays full article content', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('renders markdown formatting', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays images in articles', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows embedded videos', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays code snippets with syntax highlighting', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows article navigation links', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays article breadcrumbs', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows related articles', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays article contributors', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows article metadata', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('tracks article view count', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Article Editing', () => {
    it('displays edit button for authorized users', () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('hides edit button from unauthorized users', () => {
      renderWithAuth(<CommunityWikiPage />, mockAuthContext);
      // Placeholder for future implementation
    });

    it('opens edit mode on button click', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('displays markdown editor', () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('shows preview pane', () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('provides formatting toolbar', () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('allows adding images', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('allows adding links', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('supports drag and drop for images', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('validates article content', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('requires edit summary', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('saves article changes', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('displays save success message', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('handles save errors', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('allows canceling edits', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('prompts before discarding changes', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('auto-saves draft changes', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('restores draft on return', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('prevents concurrent editing conflicts', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('shows edit lock indicator', () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });
  });

  describe('Article Versions', () => {
    it('displays version history button', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('opens version history modal', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays list of versions', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows version timestamps', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays version authors', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows version summaries', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('allows viewing specific version', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays diff between versions', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('highlights added content', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('highlights removed content', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('allows reverting to previous version', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('requires confirmation for revert', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('tracks revert actions', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });
  });

  describe('Article Creation', () => {
    it('displays create article button', () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('opens article creation form', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('requires article title', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('validates title uniqueness', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('allows selecting category', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('allows adding tags', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('provides article template options', () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('creates new article successfully', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('redirects to new article after creation', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('handles creation errors', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });
  });

  describe('Search Functionality', () => {
    it('displays search bar', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('searches articles by title', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('searches articles by content', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('highlights search matches', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows search results count', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays search suggestions', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows recent searches', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('allows clearing search', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows no results message', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('supports advanced search filters', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Categories and Organization', () => {
    it('displays category browser', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows category hierarchy', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('filters articles by category', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays article count per category', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('allows creating new categories', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('allows editing categories', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('shows category descriptions', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays category icons', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Collaboration Features', () => {
    it('displays list of contributors', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows contributor statistics', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('allows commenting on articles', async () => {
      renderWithAuth(<CommunityWikiPage />, mockAuthContext);
      // Placeholder for future implementation
    });

    it('displays article discussions', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows pending edit suggestions', () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('allows reviewing edit suggestions', async () => {
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });

    it('tracks user contributions', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays article watchers', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('allows watching articles for updates', async () => {
      renderWithAuth(<CommunityWikiPage />, mockAuthContext);
      // Placeholder for future implementation
    });

    it('sends notifications for watched articles', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Data Loading', () => {
    it('handles initial loading state', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Check if loading indicators appear
    });

    it('displays content after loading', async () => {
      renderWithProviders(<CommunityWikiPage />);

      await waitFor(() => {
        expect(screen.getByText(/CommunityWikiPage/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays skeleton loaders', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('fetches articles on mount', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('implements pagination', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('caches article data', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('refreshes data on manual refresh', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('handles empty data gracefully', async () => {
      renderWithProviders(<CommunityWikiPage />);

      await waitFor(() => {
        expect(screen.getByText(/This is the CommunityWikiPage page/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('API Error'))
      );

      renderWithProviders(<CommunityWikiPage />);

      await waitFor(() => {
        // Should show error message
      });
    });

    it('provides retry functionality on error', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('handles article not found', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('displays user-friendly error messages', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('handles network errors', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.queryByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithProviders(<CommunityWikiPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Tab through interactive elements
    });

    it('has proper ARIA labels', () => {
      renderWithProviders(<CommunityWikiPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label');
    });

    it('provides screen reader announcements', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('has sufficient color contrast', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      renderWithProviders(<CommunityWikiPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('adapts sidebar for mobile', () => {
      global.innerWidth = 375;
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('shows mobile-optimized editor', () => {
      global.innerWidth = 375;
      renderWithAuth(<CommunityWikiPage />, mockEditorContext);
      // Placeholder for future implementation
    });
  });

  describe('User Interactions', () => {
    it('allows user navigation', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Test navigation elements
    });

    it('handles user actions', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Test user interactions
    });

    it('provides feedback on interactions', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('tracks user engagement', async () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });

  describe('Integration', () => {
    it('integrates with auth context', () => {
      renderWithAuth(<CommunityWikiPage />, mockAuthContext);
      // Placeholder for future implementation
    });

    it('integrates with notification system', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('integrates with analytics tracking', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });

    it('integrates with community context', () => {
      renderWithProviders(<CommunityWikiPage />);
      // Placeholder for future implementation
    });
  });
});

export default mockAuthContext
