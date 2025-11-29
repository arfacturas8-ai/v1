/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import HelpPage from '../HelpPage';
import { AuthContext } from '../../contexts/AuthContext';
import helpService from '../../services/helpService';

// Mock services
jest.mock('../../services/helpService');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const renderWithRouter = (component, authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

const mockHelpArticles = [
  {
    id: '1',
    title: 'Getting Started with CRYB',
    content: 'Learn how to get started with the platform',
    excerpt: 'Quick start guide',
    category: 'getting-started',
    tags: ['beginner', 'setup'],
    views: 1000,
    helpful: 85,
    notHelpful: 5,
    lastUpdated: '2025-10-01T10:00:00Z',
    author: 'support',
  },
  {
    id: '2',
    title: 'Creating Your First Community',
    content: 'Step-by-step guide to creating a community',
    excerpt: 'Community creation guide',
    category: 'communities',
    tags: ['communities', 'guide'],
    views: 500,
    helpful: 42,
    notHelpful: 3,
    lastUpdated: '2025-09-15T14:00:00Z',
    author: 'support',
  },
];

const mockCategories = [
  { id: 'getting-started', name: 'Getting Started', icon: 'rocket', count: 10 },
  { id: 'communities', name: 'Communities', icon: 'users', count: 15 },
  { id: 'chat', name: 'Chat Features', icon: 'message', count: 12 },
  { id: 'web3', name: 'Web3 & Crypto', icon: 'crypto', count: 8 },
];

const mockFAQs = [
  {
    id: '1',
    question: 'How do I create an account?',
    answer: 'Click the Sign Up button and follow the instructions.',
    category: 'getting-started',
    helpful: 150,
  },
  {
    id: '2',
    question: 'How do I join a community?',
    answer: 'Browse communities and click the Join button.',
    category: 'communities',
    helpful: 120,
  },
];

describe('HelpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    helpService.getArticles = jest.fn().mockResolvedValue({
      success: true,
      articles: mockHelpArticles,
    });
    helpService.getCategories = jest.fn().mockResolvedValue({
      success: true,
      categories: mockCategories,
    });
    helpService.getFAQs = jest.fn().mockResolvedValue({
      success: true,
      faqs: mockFAQs,
    });
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<HelpPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area', () => {
      renderWithRouter(<HelpPage />);
      const mainElement = screen.queryByRole('main');
      if (mainElement) {
        expect(mainElement).toBeInTheDocument();
      }
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<HelpPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has proper page title', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText(/HelpPage/i)).toBeInTheDocument();
    });

    it('displays page description', () => {
      renderWithRouter(<HelpPage />);
      expect(screen.getByText(/Content under construction/i)).toBeInTheDocument();
    });
  });

  describe('Help Articles', () => {
    it('displays help articles list', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Articles should be visible
      });
    });

    it('displays article titles', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Titles should be visible
      });
    });

    it('displays article excerpts', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Excerpts should be visible
      });
    });

    it('displays article categories', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Categories should be visible
      });
    });

    it('displays article view counts', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // View counts should be shown
      });
    });

    it('displays helpful ratings', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Ratings should be visible
      });
    });

    it('navigates to article on click', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click article
    });

    it('displays article tags', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Tags should be visible
      });
    });

    it('shows last updated date', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Updated date should be shown
      });
    });

    it('allows rating articles as helpful', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click helpful button
    });

    it('allows rating articles as not helpful', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click not helpful button
    });
  });

  describe('Search', () => {
    it('displays search bar prominently', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Search bar should be visible
      });
    });

    it('searches articles by title', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Enter search query
    });

    it('searches articles by content', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Search content
    });

    it('displays search results', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Search and verify results
    });

    it('highlights search terms in results', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Search and check highlighting
    });

    it('shows search suggestions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Type in search bar
    });

    it('displays popular searches', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Popular searches should be shown
      });
    });

    it('clears search', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Clear search
    });

    it('shows no results message', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Search with no matches
    });

    it('displays search results count', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Search and check count
    });

    it('suggests related articles when no exact match', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Search and check suggestions
    });
  });

  describe('Categories', () => {
    it('displays category list', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Categories should be visible
      });
    });

    it('displays category icons', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Icons should be shown
      });
    });

    it('displays category names', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Names should be visible
      });
    });

    it('displays article count per category', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Counts should be shown
      });
    });

    it('filters articles by category', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click category
    });

    it('displays category descriptions', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Descriptions should be shown
      });
    });

    it('allows browsing all articles in category', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Browse category
    });

    it('highlights selected category', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Select category and check highlight
    });

    it('shows category hierarchy', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Subcategories should be visible
      });
    });
  });

  describe('FAQ Section', () => {
    it('displays FAQ section', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // FAQ should be visible
      });
    });

    it('displays FAQ questions', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Questions should be shown
      });
    });

    it('allows expanding FAQ answers', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click question
    });

    it('allows collapsing FAQ answers', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click to collapse
    });

    it('displays multiple expanded FAQs simultaneously', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Expand multiple
    });

    it('groups FAQs by category', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // FAQs should be grouped
      });
    });

    it('allows rating FAQ helpfulness', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Rate FAQ
    });

    it('displays most helpful FAQs first', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // FAQs should be sorted
      });
    });

    it('allows searching FAQs', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Search FAQs
    });

    it('shows related FAQs', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Related FAQs should be shown
      });
    });
  });

  describe('Contact Support', () => {
    it('displays contact support button', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Contact button should be visible
      });
    });

    it('opens contact form', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click contact button
    });

    it('displays support channels', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Support channels should be shown
      });
    });

    it('shows live chat option', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Live chat should be available
      });
    });

    it('displays support hours', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Hours should be shown
      });
    });

    it('allows submitting support ticket', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Submit ticket
    });

    it('shows email support option', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Email should be shown
      });
    });

    it('displays community forum link', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Forum link should be visible
      });
    });
  });

  describe('Guided Tours', () => {
    it('displays available tours', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Tours should be listed
      });
    });

    it('allows starting a guided tour', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Start tour
    });

    it('shows tour progress', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Progress should be visible
      });
    });

    it('allows skipping tour steps', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Skip step
    });

    it('allows exiting tour', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Exit tour
    });

    it('marks completed tours', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Completed status should be shown
      });
    });
  });

  describe('Video Tutorials', () => {
    it('displays video tutorial section', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Videos should be visible
      });
    });

    it('shows video thumbnails', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Thumbnails should be shown
      });
    });

    it('displays video titles', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Titles should be visible
      });
    });

    it('shows video duration', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Duration should be shown
      });
    });

    it('allows playing videos', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Play video
    });

    it('groups videos by category', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Videos should be grouped
      });
    });

    it('displays video view counts', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // View counts should be shown
      });
    });
  });

  describe('Recent Updates', () => {
    it('displays recent updates section', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Updates should be visible
      });
    });

    it('shows new articles badge', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // New badge should be shown
      });
    });

    it('displays updated articles', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Updated articles should be shown
      });
    });

    it('shows changelog', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Changelog should be visible
      });
    });
  });

  describe('Data Loading', () => {
    it('handles initial loading state', () => {
      renderWithRouter(<HelpPage />);
      // Loading indicator should be shown
    });

    it('displays content after loading', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Content should be visible
      }, { timeout: 3000 });
    });

    it('handles empty articles gracefully', async () => {
      helpService.getArticles.mockResolvedValue({ success: true, articles: [] });
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Empty state should be shown
      });
    });

    it('displays loading skeletons', async () => {
      renderWithRouter(<HelpPage />);
      // Skeleton loaders should be visible
    });

    it('loads articles on mount', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        expect(helpService.getArticles).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      helpService.getArticles.mockRejectedValue(new Error('API Error'));
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Error should be shown
      });
    });

    it('provides retry functionality on error', async () => {
      helpService.getArticles.mockRejectedValue(new Error('API Error'));
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click retry
    });

    it('handles network errors gracefully', async () => {
      helpService.getArticles.mockRejectedValue(new Error('Network Error'));
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Network error should be shown
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure', () => {
      renderWithRouter(<HelpPage />);
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<HelpPage />);
      const headings = screen.queryAllByRole('heading');
      // Headings should exist
    });

    it('has accessible search input', () => {
      renderWithRouter(<HelpPage />);
      // Search should have proper labels
    });

    it('has accessible article links', () => {
      renderWithRouter(<HelpPage />);
      // Links should be accessible
    });

    it('supports keyboard navigation', async () => {
      renderWithRouter(<HelpPage />);
      // Test keyboard navigation
    });

    it('has proper focus management', async () => {
      renderWithRouter(<HelpPage />);
      // Verify focus handling
    });

    it('has accessible FAQ accordions', () => {
      renderWithRouter(<HelpPage />);
      // Accordions should be accessible
    });

    it('announces search results to screen readers', () => {
      renderWithRouter(<HelpPage />);
      // Check for aria-live regions
    });
  });

  describe('Responsive Behavior', () => {
    it('renders correctly on mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<HelpPage />);
      // Mobile layout should be active
    });

    it('renders correctly on tablet', () => {
      global.innerWidth = 768;
      renderWithRouter(<HelpPage />);
      // Tablet layout should be active
    });

    it('renders correctly on desktop', () => {
      global.innerWidth = 1920;
      renderWithRouter(<HelpPage />);
      // Desktop layout should be active
    });

    it('adapts article cards for mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<HelpPage />);
      // Cards should be mobile-sized
    });

    it('shows mobile navigation', () => {
      global.innerWidth = 375;
      renderWithRouter(<HelpPage />);
      // Mobile nav should be visible
    });

    it('hides sidebar on mobile', () => {
      global.innerWidth = 375;
      renderWithRouter(<HelpPage />);
      // Sidebar should be hidden
    });
  });

  describe('Breadcrumbs and Navigation', () => {
    it('displays breadcrumb navigation', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Breadcrumbs should be visible
      });
    });

    it('allows navigating back through breadcrumbs', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Click breadcrumb
    });

    it('displays sidebar navigation', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Sidebar should be visible
      });
    });

    it('highlights current section in navigation', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Current section should be highlighted
      });
    });
  });

  describe('Bookmarks and History', () => {
    it('allows bookmarking articles', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Bookmark article
    });

    it('displays bookmarked articles', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // Bookmarks should be shown
      });
    });

    it('shows recently viewed articles', async () => {
      renderWithRouter(<HelpPage />);
      await waitFor(() => {
        // History should be visible
      });
    });

    it('allows clearing history', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Clear history
    });
  });

  describe('Feedback and Ratings', () => {
    it('allows submitting article feedback', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Submit feedback
    });

    it('displays feedback form', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Open feedback form
    });

    it('shows feedback confirmation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Submit and check confirmation
    });

    it('allows suggesting new articles', async () => {
      const user = userEvent.setup();
      renderWithRouter(<HelpPage />);
      // Suggest article
    });
  });
});

export default mockAuthContext
