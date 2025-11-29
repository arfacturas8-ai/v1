import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  HomePageSkeleton,
  CommunitiesPageSkeleton,
  ProfilePageSkeleton,
  PostDetailPageSkeleton,
  SearchPageSkeleton,
  SettingsPageSkeleton,
} from './PageSkeletons';

expect.extend(toHaveNoViolations);

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock skeleton components
jest.mock('./SkeletonGrid', () => ({
  SkeletonFeed: ({ items, showMedia, className }) => (
    <div className={className} data-testid="skeleton-feed" data-items={items} data-show-media={showMedia} />
  ),
  SkeletonGrid: ({ items, columns, type, className }) => (
    <div className={className} data-testid="skeleton-grid" data-items={items} data-columns={columns} data-type={type} />
  ),
  SkeletonList: ({ items, showAvatar, showSecondary, showAction, className }) => (
    <div
      className={className}
      data-testid="skeleton-list"
      data-items={items}
      data-show-avatar={showAvatar}
      data-show-secondary={showSecondary}
      data-show-action={showAction}
    />
  ),
}));

jest.mock('./SkeletonProfile', () => ({
  SkeletonProfile: ({ className }) => <div className={className} data-testid="skeleton-profile" />,
  SkeletonProfileStats: ({ className }) => <div className={className} data-testid="skeleton-profile-stats" />,
  SkeletonProfileActivity: ({ items, className }) => (
    <div className={className} data-testid="skeleton-profile-activity" data-items={items} />
  ),
}));

jest.mock('./SkeletonBase', () => ({
  Skeleton: ({ width, height, rounded, className }) => (
    <div
      className={className}
      data-testid="skeleton"
      data-width={width}
      data-height={height}
      data-rounded={rounded}
    />
  ),
  SkeletonText: ({ lines, spacing, className }) => (
    <div className={className} data-testid="skeleton-text" data-lines={lines} data-spacing={spacing} />
  ),
  SkeletonCircle: ({ size, className }) => (
    <div className={className} data-testid="skeleton-circle" data-size={size} />
  ),
  SkeletonButton: ({ size, className }) => (
    <div className={className} data-testid="skeleton-button" data-size={size} />
  ),
}));

describe('PageSkeletons', () => {
  describe('HomePageSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = render(<HomePageSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<HomePageSkeleton className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render with default background classes', () => {
      const { container } = render(<HomePageSkeleton />);
      expect(container.firstChild).toHaveClass('min-h-screen', 'bg-gray-50', 'dark:bg-gray-950');
    });

    it('should render hero section with title and text', () => {
      render(<HomePageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const textSkeletons = screen.getAllByTestId('skeleton-text');

      expect(skeletons.length).toBeGreaterThan(0);
      expect(textSkeletons.length).toBeGreaterThan(0);
    });

    it('should render hero title with correct dimensions', () => {
      render(<HomePageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const heroTitle = skeletons.find(el => el.getAttribute('data-width') === '300px' && el.getAttribute('data-height') === '3rem');

      expect(heroTitle).toBeInTheDocument();
    });

    it('should render hero text with 2 lines', () => {
      render(<HomePageSkeleton />);
      const textSkeletons = screen.getAllByTestId('skeleton-text');
      const heroText = textSkeletons.find(el => el.getAttribute('data-lines') === '2');

      expect(heroText).toBeInTheDocument();
    });

    it('should render 4 stats cards', () => {
      const { container } = render(<HomePageSkeleton />);
      const statsGrid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');

      expect(statsGrid).toBeInTheDocument();
      expect(statsGrid.children.length).toBe(4);
    });

    it('should render stats cards with correct structure', () => {
      render(<HomePageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const statValue = skeletons.find(el => el.getAttribute('data-width') === '60px' && el.getAttribute('data-height') === '2.5rem');
      const statLabel = skeletons.find(el => el.getAttribute('data-width') === '100px' && el.getAttribute('data-height') === '1rem');

      expect(statValue).toBeInTheDocument();
      expect(statLabel).toBeInTheDocument();
    });

    it('should render featured communities section', () => {
      render(<HomePageSkeleton />);
      const gridSkeleton = screen.getByTestId('skeleton-grid');

      expect(gridSkeleton).toBeInTheDocument();
      expect(gridSkeleton).toHaveAttribute('data-items', '6');
      expect(gridSkeleton).toHaveAttribute('data-columns', '3');
      expect(gridSkeleton).toHaveAttribute('data-type', 'community');
    });

    it('should render trending posts feed', () => {
      render(<HomePageSkeleton />);
      const feedSkeleton = screen.getByTestId('skeleton-feed');

      expect(feedSkeleton).toBeInTheDocument();
      expect(feedSkeleton).toHaveAttribute('data-items', '5');
      expect(feedSkeleton).toHaveAttribute('data-show-media', 'true');
    });

    it('should have proper layout structure', () => {
      const { container } = render(<HomePageSkeleton />);
      const maxWContainer = container.querySelector('.max-w-7xl.mx-auto');

      expect(maxWContainer).toBeInTheDocument();
    });

    it('should be accessible', async () => {
      const { container } = render(<HomePageSkeleton />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });

  describe('CommunitiesPageSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = render(<CommunitiesPageSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CommunitiesPageSkeleton className="test-class" />);
      expect(container.firstChild).toHaveClass('test-class');
    });

    it('should render page header section', () => {
      render(<CommunitiesPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const titleSkeleton = skeletons.find(el => el.getAttribute('data-width') === '250px' && el.getAttribute('data-height') === '2.5rem');
      const descSkeleton = skeletons.find(el => el.getAttribute('data-width') === '350px' && el.getAttribute('data-height') === '1rem');

      expect(titleSkeleton).toBeInTheDocument();
      expect(descSkeleton).toBeInTheDocument();
    });

    it('should render header button', () => {
      render(<CommunitiesPageSkeleton />);
      const buttons = screen.getAllByTestId('skeleton-button');
      const headerButton = buttons.find(el => el.getAttribute('data-size') === 'lg');

      expect(headerButton).toBeInTheDocument();
    });

    it('should render 3 filter buttons', () => {
      render(<CommunitiesPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const searchFilter = skeletons.find(el => el.getAttribute('data-width') === '200px' && el.getAttribute('data-height') === '40px');
      const filters = skeletons.filter(el => el.getAttribute('data-width') === '150px' && el.getAttribute('data-height') === '40px');

      expect(searchFilter).toBeInTheDocument();
      expect(filters.length).toBeGreaterThanOrEqual(2);
    });

    it('should render filters with rounded corners', () => {
      render(<CommunitiesPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const roundedFilter = skeletons.find(el => el.getAttribute('data-rounded') === 'lg');

      expect(roundedFilter).toBeInTheDocument();
    });

    it('should render communities grid with 12 items', () => {
      render(<CommunitiesPageSkeleton />);
      const gridSkeleton = screen.getByTestId('skeleton-grid');

      expect(gridSkeleton).toHaveAttribute('data-items', '12');
      expect(gridSkeleton).toHaveAttribute('data-columns', '3');
      expect(gridSkeleton).toHaveAttribute('data-type', 'community');
    });

    it('should have max-width container', () => {
      const { container } = render(<CommunitiesPageSkeleton />);
      const maxWContainer = container.querySelector('.max-w-7xl');

      expect(maxWContainer).toBeInTheDocument();
    });

    it('should be accessible', async () => {
      const { container } = render(<CommunitiesPageSkeleton />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });

  describe('ProfilePageSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = render(<ProfilePageSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<ProfilePageSkeleton className="profile-class" />);
      expect(container.firstChild).toHaveClass('profile-class');
    });

    it('should render profile header', () => {
      render(<ProfilePageSkeleton />);
      const profileSkeleton = screen.getByTestId('skeleton-profile');

      expect(profileSkeleton).toBeInTheDocument();
    });

    it('should render profile stats in sidebar', () => {
      render(<ProfilePageSkeleton />);
      const statsSkeleton = screen.getByTestId('skeleton-profile-stats');

      expect(statsSkeleton).toBeInTheDocument();
    });

    it('should render profile activity with 8 items', () => {
      render(<ProfilePageSkeleton />);
      const activitySkeleton = screen.getByTestId('skeleton-profile-activity');

      expect(activitySkeleton).toBeInTheDocument();
      expect(activitySkeleton).toHaveAttribute('data-items', '8');
    });

    it('should render sidebar info section', () => {
      render(<ProfilePageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const sectionTitle = skeletons.find(el => el.getAttribute('data-width') === '120px' && el.getAttribute('data-height') === '1.25rem');

      expect(sectionTitle).toBeInTheDocument();
    });

    it('should render 4 info items in sidebar', () => {
      const { container } = render(<ProfilePageSkeleton />);
      const sidebarSection = container.querySelector('.bg-white.dark\\:bg-gray-900.rounded-xl .space-y-3');

      expect(sidebarSection).toBeInTheDocument();
      expect(sidebarSection.children.length).toBe(4);
    });

    it('should render info items with circles', () => {
      render(<ProfilePageSkeleton />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const xsCircles = circles.filter(el => el.getAttribute('data-size') === 'xs');

      expect(xsCircles.length).toBeGreaterThanOrEqual(4);
    });

    it('should have grid layout for content', () => {
      const { container } = render(<ProfilePageSkeleton />);
      const grid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');

      expect(grid).toBeInTheDocument();
    });

    it('should have max-width container', () => {
      const { container } = render(<ProfilePageSkeleton />);
      const maxWContainer = container.querySelector('.max-w-5xl');

      expect(maxWContainer).toBeInTheDocument();
    });

    it('should be accessible', async () => {
      const { container } = render(<ProfilePageSkeleton />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });

  describe('PostDetailPageSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = render(<PostDetailPageSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<PostDetailPageSkeleton className="post-class" />);
      expect(container.firstChild).toHaveClass('post-class');
    });

    it('should render post author section', () => {
      render(<PostDetailPageSkeleton />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const authorAvatar = circles.find(el => el.getAttribute('data-size') === 'md');

      expect(authorAvatar).toBeInTheDocument();
    });

    it('should render post author info', () => {
      render(<PostDetailPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const authorName = skeletons.find(el => el.getAttribute('data-width') === '150px' && el.getAttribute('data-height') === '1rem');
      const authorMeta = skeletons.find(el => el.getAttribute('data-width') === '200px' && el.getAttribute('data-height') === '0.875rem');

      expect(authorName).toBeInTheDocument();
      expect(authorMeta).toBeInTheDocument();
    });

    it('should render post title', () => {
      render(<PostDetailPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const title = skeletons.find(el => el.getAttribute('data-width') === '100%' && el.getAttribute('data-height') === '2rem');

      expect(title).toBeInTheDocument();
    });

    it('should render post content with 5 lines', () => {
      render(<PostDetailPageSkeleton />);
      const textSkeletons = screen.getAllByTestId('skeleton-text');
      const content = textSkeletons.find(el => el.getAttribute('data-lines') === '5' && el.getAttribute('data-spacing') === 'sm');

      expect(content).toBeInTheDocument();
    });

    it('should render post image', () => {
      render(<PostDetailPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const image = skeletons.find(el => el.getAttribute('data-width') === '100%' && el.getAttribute('data-height') === '400px');

      expect(image).toBeInTheDocument();
    });

    it('should render post action buttons', () => {
      render(<PostDetailPageSkeleton />);
      const buttons = screen.getAllByTestId('skeleton-button');
      const smallButtons = buttons.filter(el => el.getAttribute('data-size') === 'sm');

      expect(smallButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('should render post action icons', () => {
      render(<PostDetailPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const icons = skeletons.filter(el => el.getAttribute('data-width') === '24px' && el.getAttribute('data-height') === '24px');

      expect(icons.length).toBeGreaterThanOrEqual(3);
    });

    it('should render comments section title', () => {
      render(<PostDetailPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const commentsTitle = skeletons.find(el => el.getAttribute('data-width') === '150px' && el.getAttribute('data-height') === '1.5rem');

      expect(commentsTitle).toBeInTheDocument();
    });

    it('should render 5 comments', () => {
      const { container } = render(<PostDetailPageSkeleton />);
      const commentsContainer = container.querySelector('.space-y-6');
      const comments = commentsContainer?.querySelectorAll('.flex.gap-3');

      expect(comments?.length).toBe(5);
    });

    it('should render comment author avatars', () => {
      render(<PostDetailPageSkeleton />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const commentAvatars = circles.filter(el => el.getAttribute('data-size') === 'sm');

      expect(commentAvatars.length).toBeGreaterThanOrEqual(5);
    });

    it('should render comment text with 2 lines', () => {
      render(<PostDetailPageSkeleton />);
      const textSkeletons = screen.getAllByTestId('skeleton-text');
      const commentText = textSkeletons.filter(el => el.getAttribute('data-lines') === '2' && el.getAttribute('data-spacing') === 'xs');

      expect(commentText.length).toBeGreaterThanOrEqual(1);
    });

    it('should render comment actions', () => {
      render(<PostDetailPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const actions = skeletons.filter(el => el.getAttribute('data-width') === '60px' && el.getAttribute('data-height') === '0.875rem');

      expect(actions.length).toBeGreaterThanOrEqual(2);
    });

    it('should have max-width container', () => {
      const { container } = render(<PostDetailPageSkeleton />);
      const maxWContainer = container.querySelector('.max-w-4xl');

      expect(maxWContainer).toBeInTheDocument();
    });

    it('should be accessible', async () => {
      const { container } = render(<PostDetailPageSkeleton />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });

  describe('SearchPageSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = render(<SearchPageSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<SearchPageSkeleton className="search-class" />);
      expect(container.firstChild).toHaveClass('search-class');
    });

    it('should render search bar', () => {
      render(<SearchPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const searchBar = skeletons.find(el => el.getAttribute('data-width') === '100%' && el.getAttribute('data-height') === '56px');

      expect(searchBar).toBeInTheDocument();
    });

    it('should render search bar with rounded corners', () => {
      render(<SearchPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const searchBar = skeletons.find(el => el.getAttribute('data-rounded') === 'xl');

      expect(searchBar).toBeInTheDocument();
    });

    it('should render filter pills', () => {
      render(<SearchPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const pills = skeletons.filter(el => el.getAttribute('data-rounded') === 'full');

      expect(pills.length).toBeGreaterThanOrEqual(3);
    });

    it('should render filter pills with correct dimensions', () => {
      render(<SearchPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const pill1 = skeletons.find(el => el.getAttribute('data-width') === '100px' && el.getAttribute('data-height') === '32px');
      const pill2 = skeletons.find(el => el.getAttribute('data-width') === '120px' && el.getAttribute('data-height') === '32px');
      const pill3 = skeletons.find(el => el.getAttribute('data-width') === '90px' && el.getAttribute('data-height') === '32px');

      expect(pill1).toBeInTheDocument();
      expect(pill2).toBeInTheDocument();
      expect(pill3).toBeInTheDocument();
    });

    it('should render results title', () => {
      render(<SearchPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const resultsTitle = skeletons.find(el => el.getAttribute('data-width') === '200px' && el.getAttribute('data-height') === '1.5rem');

      expect(resultsTitle).toBeInTheDocument();
    });

    it('should render results list with 10 items', () => {
      render(<SearchPageSkeleton />);
      const listSkeleton = screen.getByTestId('skeleton-list');

      expect(listSkeleton).toHaveAttribute('data-items', '10');
      expect(listSkeleton).toHaveAttribute('data-show-avatar', 'true');
      expect(listSkeleton).toHaveAttribute('data-show-secondary', 'true');
      expect(listSkeleton).toHaveAttribute('data-show-action', 'true');
    });

    it('should have max-width container', () => {
      const { container } = render(<SearchPageSkeleton />);
      const maxWContainer = container.querySelector('.max-w-7xl');

      expect(maxWContainer).toBeInTheDocument();
    });

    it('should be accessible', async () => {
      const { container } = render(<SearchPageSkeleton />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });

  describe('SettingsPageSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = render(<SettingsPageSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<SettingsPageSkeleton className="settings-class" />);
      expect(container.firstChild).toHaveClass('settings-class');
    });

    it('should render page title', () => {
      render(<SettingsPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const title = skeletons.find(el => el.getAttribute('data-width') === '200px' && el.getAttribute('data-height') === '2.5rem');

      expect(title).toBeInTheDocument();
    });

    it('should render page description', () => {
      render(<SettingsPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const description = skeletons.find(el => el.getAttribute('data-width') === '300px' && el.getAttribute('data-height') === '1rem');

      expect(description).toBeInTheDocument();
    });

    it('should render sidebar with 6 menu items', () => {
      const { container } = render(<SettingsPageSkeleton />);
      const sidebar = container.querySelector('.lg\\:col-span-1 .space-y-2');

      expect(sidebar).toBeInTheDocument();
      expect(sidebar.children.length).toBe(6);
    });

    it('should render sidebar menu items with correct dimensions', () => {
      render(<SettingsPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const menuItems = skeletons.filter(el => el.getAttribute('data-width') === '100%' && el.getAttribute('data-height') === '40px');

      expect(menuItems.length).toBeGreaterThanOrEqual(6);
    });

    it('should render 3 settings sections', () => {
      const { container } = render(<SettingsPageSkeleton />);
      const sections = container.querySelectorAll('.lg\\:col-span-3 > .bg-white');

      expect(sections.length).toBe(3);
    });

    it('should render section titles', () => {
      render(<SettingsPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const sectionTitles = skeletons.filter(el => el.getAttribute('data-width') === '200px' && el.getAttribute('data-height') === '1.5rem');

      expect(sectionTitles.length).toBeGreaterThanOrEqual(3);
    });

    it('should render 3 form fields per section', () => {
      const { container } = render(<SettingsPageSkeleton />);
      const section = container.querySelector('.lg\\:col-span-3 .space-y-4');

      expect(section).toBeInTheDocument();
      expect(section.children.length).toBe(3);
    });

    it('should render form field labels', () => {
      render(<SettingsPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const labels = skeletons.filter(el => el.getAttribute('data-width') === '150px' && el.getAttribute('data-height') === '1rem');

      expect(labels.length).toBeGreaterThanOrEqual(3);
    });

    it('should render form field inputs', () => {
      render(<SettingsPageSkeleton />);
      const skeletons = screen.getAllByTestId('skeleton');
      const inputs = skeletons.filter(el => el.getAttribute('data-width') === '100%' && el.getAttribute('data-height') === '40px');

      expect(inputs.length).toBeGreaterThanOrEqual(9);
    });

    it('should have grid layout', () => {
      const { container } = render(<SettingsPageSkeleton />);
      const grid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-4');

      expect(grid).toBeInTheDocument();
    });

    it('should have max-width container', () => {
      const { container } = render(<SettingsPageSkeleton />);
      const maxWContainer = container.querySelector('.max-w-5xl');

      expect(maxWContainer).toBeInTheDocument();
    });

    it('should be accessible', async () => {
      const { container } = render(<SettingsPageSkeleton />);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });

  describe('Common Features', () => {
    it('all page skeletons should have min-h-screen', () => {
      const pages = [
        <HomePageSkeleton />,
        <CommunitiesPageSkeleton />,
        <ProfilePageSkeleton />,
        <PostDetailPageSkeleton />,
        <SearchPageSkeleton />,
        <SettingsPageSkeleton />,
      ];

      pages.forEach((page) => {
        const { container } = render(page);
        expect(container.firstChild).toHaveClass('min-h-screen');
      });
    });

    it('all page skeletons should support dark mode', () => {
      const pages = [
        <HomePageSkeleton />,
        <CommunitiesPageSkeleton />,
        <ProfilePageSkeleton />,
        <PostDetailPageSkeleton />,
        <SearchPageSkeleton />,
        <SettingsPageSkeleton />,
      ];

      pages.forEach((page) => {
        const { container } = render(page);
        expect(container.firstChild).toHaveClass('dark:bg-gray-950');
      });
    });

    it('all page skeletons should have proper spacing', () => {
      const pages = [
        <HomePageSkeleton />,
        <CommunitiesPageSkeleton />,
        <ProfilePageSkeleton />,
        <PostDetailPageSkeleton />,
        <SearchPageSkeleton />,
        <SettingsPageSkeleton />,
      ];

      pages.forEach((page) => {
        const { container } = render(page);
        const innerContainer = container.querySelector('[class*="px-"]');
        expect(innerContainer).toBeInTheDocument();
      });
    });
  });
});

export default skeletons
