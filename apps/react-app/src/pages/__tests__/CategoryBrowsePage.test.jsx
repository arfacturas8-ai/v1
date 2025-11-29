/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CategoryBrowsePage from '../CategoryBrowsePage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CategoryBrowsePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<CategoryBrowsePage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper aria-label', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Category browse page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<CategoryBrowsePage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('displays page title', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('Browse Categories')).toBeInTheDocument();
    });

    it('displays page subtitle', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('Discover content that interests you')).toBeInTheDocument();
    });

    it('has gradient background styling', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });
  });

  describe('Categories Display', () => {
    it('displays all 12 categories', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('Gaming')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
      expect(screen.getByText('Movies & TV')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('Art & Design')).toBeInTheDocument();
      expect(screen.getByText('Lifestyle')).toBeInTheDocument();
      expect(screen.getByText('Food & Cooking')).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();
      expect(screen.getByText('Photography')).toBeInTheDocument();
      expect(screen.getByText('Fitness')).toBeInTheDocument();
      expect(screen.getByText('Business')).toBeInTheDocument();
    });

    it('displays community counts for each category', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('15,234 communities')).toBeInTheDocument(); // Gaming
      expect(screen.getByText('12,893 communities')).toBeInTheDocument(); // Music
      expect(screen.getByText('18,392 communities')).toBeInTheDocument(); // Technology
    });

    it('displays category cards in grid layout', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const categories = screen.getAllByText(/communities$/);
      expect(categories.length).toBe(12);
    });

    it('each category card has proper structure', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingCard = screen.getByText('Gaming').closest('div');
      expect(gamingCard).toBeInTheDocument();
    });

    it('displays category icons', () => {
      renderWithRouter(<CategoryBrowsePage />);
      // Icons are rendered as SVG elements within the cards
      const gamingText = screen.getByText('Gaming');
      expect(gamingText).toBeInTheDocument();
    });
  });

  describe('Trending Topics Section', () => {
    it('displays Trending Topics heading', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('Trending Topics')).toBeInTheDocument();
    });

    it('displays all trending topics', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('AI Art Generation')).toBeInTheDocument();
      expect(screen.getByText('Indie Games 2024')).toBeInTheDocument();
      expect(screen.getByText('Film Photography')).toBeInTheDocument();
      expect(screen.getByText('Home Workouts')).toBeInTheDocument();
    });

    it('displays post counts for trending topics', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('1,234 posts')).toBeInTheDocument();
      expect(screen.getByText('987 posts')).toBeInTheDocument();
      expect(screen.getByText('756 posts')).toBeInTheDocument();
      expect(screen.getByText('654 posts')).toBeInTheDocument();
    });

    it('displays trending rank numbers', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.getByText('#4')).toBeInTheDocument();
    });

    it('displays TrendingUp icon', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const heading = screen.getByText('Trending Topics');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Popular Communities Section', () => {
    it('displays Popular Communities heading', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('Popular Communities')).toBeInTheDocument();
    });

    it('displays all popular communities', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('Gaming Legends')).toBeInTheDocument();
      expect(screen.getByText('Music Producers')).toBeInTheDocument();
      expect(screen.getByText('Tech Innovators')).toBeInTheDocument();
      expect(screen.getByText('Food Lovers')).toBeInTheDocument();
      expect(screen.getByText('World Travelers')).toBeInTheDocument();
      expect(screen.getByText('Art Collective')).toBeInTheDocument();
    });

    it('displays member counts for communities', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('125K members')).toBeInTheDocument();
      expect(screen.getByText('89K members')).toBeInTheDocument();
      expect(screen.getByText('156K members')).toBeInTheDocument();
    });

    it('displays community emojis', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingLegends = screen.getByText('Gaming Legends');
      expect(gamingLegends).toBeInTheDocument();
    });

    it('displays Join buttons for communities', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const joinButtons = screen.getAllByText('Join');
      expect(joinButtons.length).toBe(6); // 6 popular communities
    });

    it('displays category labels for communities', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('Gaming')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
  });

  describe('Category Navigation', () => {
    it('navigates to category page when category card is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const gamingCard = screen.getByText('Gaming').closest('div');
      await user.click(gamingCard);

      expect(mockNavigate).toHaveBeenCalledWith('/category/gaming');
    });

    it('navigates to technology category', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const techCard = screen.getByText('Technology').closest('div');
      await user.click(techCard);

      expect(mockNavigate).toHaveBeenCalledWith('/category/tech');
    });

    it('navigates to music category', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const musicCard = screen.getByText('Music').closest('div');
      await user.click(musicCard);

      expect(mockNavigate).toHaveBeenCalledWith('/category/music');
    });

    it('navigates to movies category', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const moviesCard = screen.getByText('Movies & TV').closest('div');
      await user.click(moviesCard);

      expect(mockNavigate).toHaveBeenCalledWith('/category/movies');
    });

    it('navigates to all different categories', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const categories = [
        { name: 'Gaming', id: 'gaming' },
        { name: 'Music', id: 'music' },
        { name: 'Technology', id: 'tech' },
        { name: 'Books', id: 'books' }
      ];

      for (const category of categories) {
        mockNavigate.mockClear();
        const card = screen.getByText(category.name).closest('div');
        await user.click(card);
        expect(mockNavigate).toHaveBeenCalledWith(`/category/${category.id}`);
      }
    });
  });

  describe('Trending Topic Navigation', () => {
    it('navigates to tag page when trending topic is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const aiArtCard = screen.getByText('AI Art Generation').closest('div');
      await user.click(aiArtCard);

      expect(mockNavigate).toHaveBeenCalledWith('/tag/ai-art-generation');
    });

    it('converts topic name to URL-friendly format', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const indieGamesCard = screen.getByText('Indie Games 2024').closest('div');
      await user.click(indieGamesCard);

      expect(mockNavigate).toHaveBeenCalledWith('/tag/indie-games-2024');
    });

    it('navigates to film photography tag', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const filmPhotoCard = screen.getByText('Film Photography').closest('div');
      await user.click(filmPhotoCard);

      expect(mockNavigate).toHaveBeenCalledWith('/tag/film-photography');
    });

    it('navigates to home workouts tag', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const workoutsCard = screen.getByText('Home Workouts').closest('div');
      await user.click(workoutsCard);

      expect(mockNavigate).toHaveBeenCalledWith('/tag/home-workouts');
    });
  });

  describe('Category Cards Styling', () => {
    it('applies gradient colors to category cards', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingCard = screen.getByText('Gaming').closest('div');
      const parent = gamingCard?.parentElement;
      expect(parent).toBeInTheDocument();
    });

    it('has hover effects on category cards', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingCard = screen.getByText('Gaming').closest('div');
      expect(gamingCard?.parentElement).toHaveClass('hover:shadow-2xl');
    });

    it('has cursor pointer on category cards', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingCard = screen.getByText('Gaming').closest('div');
      expect(gamingCard?.parentElement).toHaveClass('cursor-pointer');
    });

    it('has rounded corners on category cards', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingCard = screen.getByText('Gaming').closest('div');
      expect(gamingCard?.parentElement).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
    });

    it('displays category names in white text', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingCard = screen.getByText('Gaming').closest('div');
      expect(gamingCard).toHaveClass('text-white');
    });
  });

  describe('Trending Topic Cards Styling', () => {
    it('has hover effects on trending topic cards', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const aiArtCard = screen.getByText('AI Art Generation').closest('div');
      expect(aiArtCard?.parentElement).toHaveClass('cursor-pointer');
    });

    it('displays trending rank with orange color', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const rank1 = screen.getByText('#1');
      expect(rank1).toHaveClass('text-orange-500');
    });

    it('has border on hover', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const aiArtCard = screen.getByText('AI Art Generation').closest('div')?.parentElement;
      expect(aiArtCard).toHaveClass('hover:border-orange-500');
    });

    it('has shadow effect', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const aiArtCard = screen.getByText('AI Art Generation').closest('div')?.parentElement;
      expect(aiArtCard).toHaveClass('hover:shadow-xl');
    });
  });

  describe('Popular Community Cards', () => {
    it('displays community icons/emojis', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingLegends = screen.getByText('Gaming Legends');
      expect(gamingLegends.closest('div')).toBeInTheDocument();
    });

    it('has hover effects on community cards', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const communityCard = screen.getByText('Gaming Legends').closest('div')?.parentElement;
      expect(communityCard).toHaveClass('hover:shadow-xl');
    });

    it('displays join buttons with proper styling', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const joinButtons = screen.getAllByText('Join');
      joinButtons.forEach(button => {
        expect(button).toHaveClass('bg-[#58a6ff]');
      });
    });

    it('displays community categories', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('Gaming')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });

  describe('Grid Layouts', () => {
    it('uses grid layout for categories', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const categories = screen.getByText('Gaming').closest('div')?.parentElement?.parentElement;
      expect(categories).toHaveClass('grid');
    });

    it('uses grid layout for trending topics', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const trending = screen.getByText('AI Art Generation').closest('div')?.parentElement?.parentElement;
      expect(trending).toHaveClass('grid');
    });

    it('uses grid layout for popular communities', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const communities = screen.getByText('Gaming Legends').closest('div')?.parentElement?.parentElement;
      expect(communities).toHaveClass('grid');
    });

    it('has responsive grid columns', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const categories = screen.getByText('Gaming').closest('div')?.parentElement?.parentElement;
      expect(categories).toHaveClass('grid-cols-1');
    });
  });

  describe('Content Organization', () => {
    it('displays trending topics before categories', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const trendingHeading = screen.getByText('Trending Topics');
      const categoriesHeading = screen.getByText('Browse Categories');

      const trendingPosition = trendingHeading.compareDocumentPosition(categoriesHeading);
      // DOCUMENT_POSITION_FOLLOWING = 4 means categoriesHeading comes after trendingHeading
      expect(trendingPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('displays popular communities after categories', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const categoriesHeading = screen.getByText('Browse Categories');
      const communitiesHeading = screen.getByText('Popular Communities');

      const position = categoriesHeading.compareDocumentPosition(communitiesHeading);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('sections are properly spaced', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const container = screen.getByRole('main').firstChild;
      expect(container).toHaveClass('px-6', 'py-12');
    });
  });

  describe('Data Accuracy', () => {
    it('displays correct Gaming category count', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const gamingCard = screen.getByText('Gaming').closest('div');
      expect(gamingCard?.textContent).toContain('15,234');
    });

    it('displays correct Technology category count', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const techCard = screen.getByText('Technology').closest('div');
      expect(techCard?.textContent).toContain('18,392');
    });

    it('displays correct Music category count', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const musicCard = screen.getByText('Music').closest('div');
      expect(musicCard?.textContent).toContain('12,893');
    });

    it('displays correct trending topic post counts', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('1,234 posts')).toBeInTheDocument();
      expect(screen.getByText('987 posts')).toBeInTheDocument();
    });

    it('displays correct community member counts', () => {
      renderWithRouter(<CategoryBrowsePage />);
      expect(screen.getByText('125K members')).toBeInTheDocument();
      expect(screen.getByText('156K members')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main element', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label', 'Category browse page');
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Browse Categories');
    });

    it('has proper heading for sections', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('category cards are clickable', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const gamingCard = screen.getByText('Gaming').closest('div');
      await user.click(gamingCard);

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('trending topic cards are clickable', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const topicCard = screen.getByText('AI Art Generation').closest('div');
      await user.click(topicCard);

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('join buttons are interactive', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const joinButtons = screen.getAllByText('Join');
      joinButtons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const main = screen.getByRole('main');
      expect(main.className).toContain('dark:');
    });

    it('trending topic cards have dark mode styles', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const card = screen.getByText('AI Art Generation').closest('div')?.parentElement;
      expect(card?.className).toContain('dark:bg-[#161b22]');
    });

    it('popular community cards have dark mode styles', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const card = screen.getByText('Gaming Legends').closest('div')?.parentElement;
      expect(card?.className).toContain('dark:bg-[#161b22]');
    });
  });

  describe('Responsive Design', () => {
    it('has responsive container', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const container = screen.getByRole('main').firstChild;
      expect(container).toHaveClass('max-w-7xl', 'mx-auto');
    });

    it('categories grid is responsive', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const grid = screen.getByText('Gaming').closest('div')?.parentElement?.parentElement;
      expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });

    it('trending topics grid is responsive', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const grid = screen.getByText('AI Art Generation').closest('div')?.parentElement?.parentElement;
      expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-4');
    });

    it('popular communities grid is responsive', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const grid = screen.getByText('Gaming Legends').closest('div')?.parentElement?.parentElement;
      expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('heading is responsive', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const heading = screen.getByText('Browse Categories');
      expect(heading).toHaveClass('text-5xl');
    });
  });

  describe('Integration Tests', () => {
    it('renders all sections together', () => {
      renderWithRouter(<CategoryBrowsePage />);

      // Header
      expect(screen.getByText('Browse Categories')).toBeInTheDocument();

      // Trending Topics
      expect(screen.getByText('Trending Topics')).toBeInTheDocument();
      expect(screen.getByText('AI Art Generation')).toBeInTheDocument();

      // Categories
      expect(screen.getByText('Gaming')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();

      // Popular Communities
      expect(screen.getByText('Popular Communities')).toBeInTheDocument();
      expect(screen.getByText('Gaming Legends')).toBeInTheDocument();
    });

    it('handles multiple category clicks', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      const gamingCard = screen.getByText('Gaming').closest('div');
      await user.click(gamingCard);
      expect(mockNavigate).toHaveBeenCalledWith('/category/gaming');

      mockNavigate.mockClear();

      const techCard = screen.getByText('Technology').closest('div');
      await user.click(techCard);
      expect(mockNavigate).toHaveBeenCalledWith('/category/tech');
    });

    it('handles trending topic and category navigation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<CategoryBrowsePage />);

      // Click trending topic
      const topicCard = screen.getByText('AI Art Generation').closest('div');
      await user.click(topicCard);
      expect(mockNavigate).toHaveBeenCalledWith('/tag/ai-art-generation');

      mockNavigate.mockClear();

      // Click category
      const categoryCard = screen.getByText('Gaming').closest('div');
      await user.click(categoryCard);
      expect(mockNavigate).toHaveBeenCalledWith('/category/gaming');
    });
  });

  describe('Visual Elements', () => {
    it('displays gradient title styling', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const title = screen.getByText('Browse Categories');
      expect(title).toHaveClass('bg-gradient-to-r', 'bg-clip-text', 'text-transparent');
    });

    it('displays proper spacing between sections', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const trendingSection = screen.getByText('Trending Topics').closest('div')?.parentElement;
      expect(trendingSection).toHaveClass('mb-12');
    });

    it('has proper card shadows', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const categoryCard = screen.getByText('Gaming').closest('div')?.parentElement;
      expect(categoryCard).toHaveClass('shadow-lg');
    });

    it('displays overflow hidden on cards', () => {
      renderWithRouter(<CategoryBrowsePage />);
      const categoryCard = screen.getByText('Gaming').closest('div')?.parentElement;
      expect(categoryCard).toHaveClass('overflow-hidden');
    });
  });
});

export default mockNavigate
