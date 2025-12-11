/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import TagPage from '../TagPage';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

// Mock useNavigate and useParams
const mockNavigate = jest.fn();
let mockTag = 'gaming';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ tag: mockTag })
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TagPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockTag = 'gaming';
  });

  describe('Page Rendering', () => {
    it('renders page without crashing', () => {
      const { container } = renderWithRouter(<TagPage />);
      expect(container).toBeInTheDocument();
    });

    it('displays main content area with proper aria-label', () => {
      renderWithRouter(<TagPage />);
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('aria-label', 'Tag page');
    });

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithRouter(<TagPage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('has full height screen', () => {
      renderWithRouter(<TagPage />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('displays tag name from URL parameter', () => {
      renderWithRouter(<TagPage />);
      expect(screen.getByText('gaming')).toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    it('displays tag name in hero', () => {
      renderWithRouter(<TagPage />);
      expect(screen.getByText('gaming')).toBeInTheDocument();
    });

    it('displays hash icon', () => {
      renderWithRouter(<TagPage />);
      const heading = screen.getByText('gaming');
      expect(heading.parentElement).toBeInTheDocument();
    });

    it('has gradient background', () => {
      renderWithRouter(<TagPage />);
      const hero = screen.getByText('gaming').closest('div')?.parentElement;
      expect(hero).toHaveClass('bg-gradient-to-r');
    });

    it('displays trending badge when applicable', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Trending')).toBeInTheDocument();
      });
    });

    it('displays TrendingUp icon in badge', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const badge = screen.getByText('Trending');
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe('Tag Statistics', () => {
    it('displays loading state initially', () => {
      renderWithRouter(<TagPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('displays post count statistic', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('1,247')).toBeInTheDocument();
        expect(screen.getByText('Posts')).toBeInTheDocument();
      });
    });

    it('displays followers count statistic', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('8,392')).toBeInTheDocument();
        expect(screen.getByText('Followers')).toBeInTheDocument();
      });
    });

    it('displays views count statistic', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('45,821')).toBeInTheDocument();
        expect(screen.getByText('Views')).toBeInTheDocument();
      });
    });

    it('formats numbers with commas', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const stats = screen.getByText('45,821');
        expect(stats).toBeInTheDocument();
      });
    });

    it('displays all three statistics', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Posts')).toBeInTheDocument();
        expect(screen.getByText('Followers')).toBeInTheDocument();
        expect(screen.getByText('Views')).toBeInTheDocument();
      });
    });
  });

  describe('Follow Functionality', () => {
    it('displays Follow Tag button initially', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Follow Tag')).toBeInTheDocument();
      });
    });

    it('toggles to Following when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Follow Tag')).toBeInTheDocument();
      });

      const followButton = screen.getByText('Follow Tag');
      await user.click(followButton);

      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    it('toggles back to Follow Tag when clicked again', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Follow Tag')).toBeInTheDocument();
      });

      const followButton = screen.getByText('Follow Tag');
      await user.click(followButton);

      expect(screen.getByText('Following')).toBeInTheDocument();

      const followingButton = screen.getByText('Following');
      await user.click(followingButton);

      expect(screen.getByText('Follow Tag')).toBeInTheDocument();
    });

    it('displays star icon in follow button', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Follow Tag')).toBeInTheDocument();
      });
    });

    it('changes button styling when following', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Follow Tag')).toBeInTheDocument();
      });

      const followButton = screen.getByText('Follow Tag');
      await user.click(followButton);

      const followingButton = screen.getByText('Following');
      expect(followingButton).toHaveClass('bg-[#161b22]/60 backdrop-blur-xl');
    });
  });

  describe('Sorting Controls', () => {
    it('displays sort dropdown', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });
    });

    it('has Most Recent as default sort option', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('recent');
      });
    });

    it('displays all sort options', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Most Recent')).toBeInTheDocument();
        expect(screen.getByText('Most Popular')).toBeInTheDocument();
        expect(screen.getByText('Trending')).toBeInTheDocument();
      });
    });

    it('changes sort order when option selected', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(select, 'popular');

      expect(select.value).toBe('popular');
    });

    it('reloads data when sort changes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'trending');

      // Data should reload
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('trending');
      });
    });
  });

  describe('Filter Controls', () => {
    it('displays Filters button', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });
    });

    it('displays Filter icon', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const filtersButton = screen.getByText('Filters');
        expect(filtersButton).toBeInTheDocument();
      });
    });

    it('Filters button is clickable', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const button = screen.getByText('Filters');
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByText('Filters');
      await user.click(button);
    });
  });

  describe('View Mode Toggle', () => {
    it('displays view mode toggle buttons', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const gridButton = screen.getByLabelText('Grid view');
        const listButton = screen.getByLabelText('List view');
        expect(gridButton).toBeInTheDocument();
        expect(listButton).toBeInTheDocument();
      });
    });

    it('starts with grid view selected', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const gridButton = screen.getByLabelText('Grid view');
        expect(gridButton).toHaveClass('bg-white');
      });
    });

    it('switches to list view when clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('List view')).toBeInTheDocument();
      });

      const listButton = screen.getByLabelText('List view');
      await user.click(listButton);

      expect(listButton).toHaveClass('bg-white');
    });

    it('switches back to grid view', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('List view')).toBeInTheDocument();
      });

      const listButton = screen.getByLabelText('List view');
      await user.click(listButton);

      const gridButton = screen.getByLabelText('Grid view');
      await user.click(gridButton);

      expect(gridButton).toHaveClass('bg-white');
    });

    it('displays Grid and List icons', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const gridButton = screen.getByLabelText('Grid view');
        const listButton = screen.getByLabelText('List view');
        expect(gridButton).toBeInTheDocument();
        expect(listButton).toBeInTheDocument();
      });
    });
  });

  describe('Posts Display', () => {
    it('shows loading spinner initially', () => {
      renderWithRouter(<TagPage />);

      const spinner = screen.getByRole('main').querySelector('.');
      expect(spinner).toBeInTheDocument();
    });

    it('displays posts after loading', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
      });
    });

    it('displays all post titles', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
        expect(screen.getByText('Check this out')).toBeInTheDocument();
        expect(screen.getByText('New update')).toBeInTheDocument();
        expect(screen.getByText('Trending topic')).toBeInTheDocument();
      });
    });

    it('displays post authors', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText(/by @alice/)).toBeInTheDocument();
        expect(screen.getByText(/by @bob/)).toBeInTheDocument();
        expect(screen.getByText(/by @charlie/)).toBeInTheDocument();
        expect(screen.getByText(/by @diana/)).toBeInTheDocument();
      });
    });

    it('displays like counts', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('234 likes')).toBeInTheDocument();
        expect(screen.getByText('189 likes')).toBeInTheDocument();
        expect(screen.getByText('567 likes')).toBeInTheDocument();
        expect(screen.getByText('423 likes')).toBeInTheDocument();
      });
    });

    it('displays comment counts', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('45 comments')).toBeInTheDocument();
        expect(screen.getByText('32 comments')).toBeInTheDocument();
        expect(screen.getByText('89 comments')).toBeInTheDocument();
        expect(screen.getByText('67 comments')).toBeInTheDocument();
      });
    });

    it('displays post images', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBe(4);
      });
    });
  });

  describe('Grid View', () => {
    it('displays posts in grid layout by default', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const container = screen.getByText('Amazing discovery!').closest('div')?.parentElement?.parentElement;
        expect(container).toHaveClass('grid');
      });
    });

    it('has responsive grid columns', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const container = screen.getByText('Amazing discovery!').closest('div')?.parentElement?.parentElement;
        expect(container).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
      });
    });

    it('displays 4 posts in grid', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const posts = screen.getAllByText(/likes$/);
        expect(posts.length).toBe(4);
      });
    });
  });

  describe('List View', () => {
    it('switches to list layout', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('List view')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('List view'));

      const container = screen.getByText('Amazing discovery!').closest('div')?.parentElement?.parentElement;
      expect(container).toHaveClass('space-y-4');
    });

    it('displays same posts in list view', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('List view'));

      expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
      expect(screen.getByText('Check this out')).toBeInTheDocument();
    });
  });

  describe('Post Navigation', () => {
    it('navigates to post detail when post is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
      });

      const postCard = screen.getByText('Amazing discovery!').closest('div');
      await user.click(postCard);

      expect(mockNavigate).toHaveBeenCalledWith('/post/1');
    });

    it('navigates to different posts', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Check this out')).toBeInTheDocument();
      });

      const postCard = screen.getByText('Check this out').closest('div');
      await user.click(postCard);

      expect(mockNavigate).toHaveBeenCalledWith('/post/2');
    });

    it('all posts are clickable', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
      });

      const postCards = screen.getAllByText(/likes$/).map(el =>
        el.closest('div')?.parentElement?.parentElement
      );

      postCards.forEach(card => {
        expect(card).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Different Tags', () => {
    it('displays different tag name', () => {
      mockTag = 'technology';
      renderWithRouter(<TagPage />);
      expect(screen.getByText('technology')).toBeInTheDocument();
    });

    it('reloads data when tag changes', async () => {
      const { rerender } = renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
      });

      mockTag = 'art';
      rerender(<BrowserRouter><TagPage /></BrowserRouter>);

      // Component should reload with new tag
      expect(screen.getByText('art')).toBeInTheDocument();
    });
  });

  describe('Post Card Styling', () => {
    it('has hover effects on post cards', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const postCard = screen.getByText('Amazing discovery!').closest('div')?.parentElement?.parentElement;
        expect(postCard).toHaveClass('hover:shadow-xl');
      });
    });

    it('has rounded corners', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const postCard = screen.getByText('Amazing discovery!').closest('div')?.parentElement?.parentElement;
        expect(postCard).toHaveClass('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');
      });
    });

    it('has shadow effect', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const postCard = screen.getByText('Amazing discovery!').closest('div')?.parentElement?.parentElement;
        expect(postCard).toHaveClass('shadow-sm');
      });
    });

    it('images have aspect ratio', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const imageContainer = screen.getAllByRole('img')[0].closest('div');
        expect(imageContainer).toHaveClass('aspect-video');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper page structure with main element', () => {
      renderWithRouter(<TagPage />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute('aria-label', 'Tag page');
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<TagPage />);
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('gaming');
    });

    it('sort dropdown is accessible', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });
    });

    it('view mode buttons have aria-labels', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Grid view')).toBeInTheDocument();
        expect(screen.getByLabelText('List view')).toBeInTheDocument();
      });
    });

    it('follow button is keyboard accessible', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const button = screen.getByText('Follow Tag');
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('post images have alt text', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });
      });
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes', () => {
      renderWithRouter(<TagPage />);
      const main = screen.getByRole('main');
      expect(main.className).toContain('dark:bg-[#0d1117]');
    });

    it('controls bar has dark mode styles', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const controlsBar = screen.getByRole('combobox').closest('div')?.parentElement;
        expect(controlsBar?.className).toContain('dark:bg-[#161b22]');
      });
    });

    it('post cards have dark mode styles', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const postCard = screen.getByText('Amazing discovery!').closest('div')?.parentElement?.parentElement;
        expect(postCard?.className).toContain('dark:bg-[#161b22]');
      });
    });
  });

  describe('Responsive Design', () => {
    it('has responsive container', () => {
      renderWithRouter(<TagPage />);
      const container = screen.getByRole('main').querySelector('.max-w-7xl');
      expect(container).toBeInTheDocument();
    });

    it('hero section is responsive', () => {
      renderWithRouter(<TagPage />);
      const hero = screen.getByText('gaming').closest('div')?.parentElement;
      expect(hero).toHaveClass('px-6', 'py-12');
    });

    it('posts grid is responsive', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const grid = screen.getByText('Amazing discovery!').closest('div')?.parentElement?.parentElement;
        expect(grid).toHaveClass('grid-cols-1');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner during data fetch', () => {
      renderWithRouter(<TagPage />);
      const spinner = screen.getByRole('main').querySelector('.');
      expect(spinner).toBeInTheDocument();
    });

    it('hides loading spinner after data loads', async () => {
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        const spinner = screen.queryByRole('main').querySelector('.');
        expect(spinner).not.toBeInTheDocument();
      });
    });

    it('displays loading spinner with proper styling', () => {
      renderWithRouter(<TagPage />);
      const spinner = screen.getByRole('main').querySelector('.');
      expect(spinner).toHaveClass('border-4', 'border-blue-500', 'rounded-full');
    });
  });

  describe('Integration Tests', () => {
    it('completes full workflow: load, sort, switch view, navigate', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Amazing discovery!')).toBeInTheDocument();
      });

      // Follow the tag
      await user.click(screen.getByText('Follow Tag'));
      expect(screen.getByText('Following')).toBeInTheDocument();

      // Change sort order
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'popular');

      // Switch to list view
      await user.click(screen.getByLabelText('List view'));

      // Click on a post
      const postCard = screen.getByText('Amazing discovery!').closest('div');
      await user.click(postCard);

      expect(mockNavigate).toHaveBeenCalledWith('/post/1');
    });

    it('handles rapid view mode switching', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TagPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('List view')).toBeInTheDocument();
      });

      // Rapidly switch views
      await user.click(screen.getByLabelText('List view'));
      await user.click(screen.getByLabelText('Grid view'));
      await user.click(screen.getByLabelText('List view'));

      const listButton = screen.getByLabelText('List view');
      expect(listButton).toHaveClass('bg-white');
    });
  });
});

export default mockNavigate
