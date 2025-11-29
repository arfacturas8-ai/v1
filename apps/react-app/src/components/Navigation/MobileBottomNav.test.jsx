import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MobileBottomNav from './MobileBottomNav';

const renderWithRouter = (component, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {component}
    </MemoryRouter>
  );
};

describe('MobileBottomNav', () => {
  describe('Bottom Nav Rendering', () => {
    it('should render the navigation container', () => {
      renderWithRouter(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render with fixed positioning classes', () => {
      renderWithRouter(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });

    it('should render with proper z-index', () => {
      renderWithRouter(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('z-40');
    });

    it('should render with border styling', () => {
      renderWithRouter(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('border-t', 'border-border');
    });

    it('should render with backdrop blur styling', () => {
      renderWithRouter(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('backdrop-blur');
    });

    it('should hide on large screens', () => {
      renderWithRouter(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('lg:hidden');
    });
  });

  describe('Nav Items Display', () => {
    it('should render all 5 navigation items', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
    });

    it('should render Home navigation item', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should render Explore navigation item', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByText('Explore')).toBeInTheDocument();
    });

    it('should render Create navigation item', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should render Messages navigation item', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    it('should render Profile navigation item', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should render items in a 5-column grid', () => {
      renderWithRouter(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      const grid = nav.querySelector('.grid-cols-5');
      expect(grid).toBeInTheDocument();
    });

    it('should render with correct height', () => {
      renderWithRouter(<MobileBottomNav />);
      const nav = screen.getByRole('navigation');
      const grid = nav.querySelector('.h-16');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Active Tab Highlighting', () => {
    it('should highlight Home tab when on home route', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('text-primary');
    });

    it('should highlight Explore tab when on communities route', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/communities' });
      const exploreLink = screen.getByText('Explore').closest('a');
      expect(exploreLink).toHaveClass('text-primary');
    });

    it('should highlight Create tab when on create route', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/create' });
      const createLink = screen.getByText('Create').closest('a');
      expect(createLink).toHaveClass('text-primary');
    });

    it('should highlight Messages tab when on chat route', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/chat' });
      const messagesLink = screen.getByText('Messages').closest('a');
      expect(messagesLink).toHaveClass('text-primary');
    });

    it('should highlight Profile tab when on profile route', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/profile' });
      const profileLink = screen.getByText('Profile').closest('a');
      expect(profileLink).toHaveClass('text-primary');
    });

    it('should apply tertiary text color to inactive tabs', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const exploreLink = screen.getByText('Explore').closest('a');
      expect(exploreLink).toHaveClass('text-text-tertiary');
    });

    it('should highlight tab for nested routes', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home/feed' });
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveClass('text-primary');
    });

    it('should show active indicator for home route', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const indicator = homeLink.querySelector('.bg-primary.rounded-t-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should show active indicator for communities route', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/communities' });
      const exploreLink = screen.getByText('Explore').closest('a');
      const indicator = exploreLink.querySelector('.bg-primary.rounded-t-full');
      expect(indicator).toBeInTheDocument();
    });

    it('should not show active indicator for inactive tabs', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const exploreLink = screen.getByText('Explore').closest('a');
      const indicator = exploreLink.querySelector('.bg-primary.rounded-t-full');
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon for each navigation item', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const svg = link.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should render icons with correct size', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const svg = link.querySelector('svg');
        expect(svg).toHaveClass('h-5', 'w-5');
      });
    });

    it('should scale up icon for active tab', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const icon = homeLink.querySelector('svg');
      expect(icon).toHaveClass('scale-110');
    });

    it('should not scale icon for inactive tabs', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const exploreLink = screen.getByText('Explore').closest('a');
      const icon = exploreLink.querySelector('svg');
      expect(icon).not.toHaveClass('scale-110');
    });

    it('should apply transition to icons', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const icon = link.querySelector('svg');
        expect(icon).toHaveClass('transition-all');
      });
    });
  });

  describe('Tab Switching', () => {
    it('should link to home path', () => {
      renderWithRouter(<MobileBottomNav />);
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('href', '/home');
    });

    it('should link to communities path', () => {
      renderWithRouter(<MobileBottomNav />);
      const exploreLink = screen.getByText('Explore').closest('a');
      expect(exploreLink).toHaveAttribute('href', '/communities');
    });

    it('should link to create path', () => {
      renderWithRouter(<MobileBottomNav />);
      const createLink = screen.getByText('Create').closest('a');
      expect(createLink).toHaveAttribute('href', '/create');
    });

    it('should link to chat path', () => {
      renderWithRouter(<MobileBottomNav />);
      const messagesLink = screen.getByText('Messages').closest('a');
      expect(messagesLink).toHaveAttribute('href', '/chat');
    });

    it('should link to profile path', () => {
      renderWithRouter(<MobileBottomNav />);
      const profileLink = screen.getByText('Profile').closest('a');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });

  describe('Layout and Styling', () => {
    it('should render each item with flexbox layout', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('flex', 'flex-col');
      });
    });

    it('should center items horizontally and vertically', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('items-center', 'justify-center');
      });
    });

    it('should apply gap between icon and label', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('gap-1');
      });
    });

    it('should render labels with small font size', () => {
      renderWithRouter(<MobileBottomNav />);
      const labels = ['Home', 'Explore', 'Create', 'Messages', 'Profile'];
      labels.forEach(label => {
        const element = screen.getByText(label);
        expect(element).toHaveClass('text-[10px]');
      });
    });

    it('should render labels with medium font weight', () => {
      renderWithRouter(<MobileBottomNav />);
      const labels = ['Home', 'Explore', 'Create', 'Messages', 'Profile'];
      labels.forEach(label => {
        const element = screen.getByText(label);
        expect(element).toHaveClass('font-medium');
      });
    });

    it('should apply transition to links', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('transition-colors');
      });
    });

    it('should apply hover styles to inactive tabs', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const exploreLink = screen.getByText('Explore').closest('a');
      expect(exploreLink).toHaveClass('hover:text-text-primary');
    });
  });

  describe('Active Indicator', () => {
    it('should position indicator absolutely', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const indicator = homeLink.querySelector('.absolute');
      expect(indicator).toBeInTheDocument();
    });

    it('should position indicator at bottom', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const indicator = homeLink.querySelector('.bottom-0');
      expect(indicator).toBeInTheDocument();
    });

    it('should center indicator horizontally', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const indicator = homeLink.querySelector('.left-1\\/2.-translate-x-1\\/2');
      expect(indicator).toBeInTheDocument();
    });

    it('should render indicator with correct width', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const indicator = homeLink.querySelector('.w-12');
      expect(indicator).toBeInTheDocument();
    });

    it('should render indicator with correct height', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const indicator = homeLink.querySelector('.h-1');
      expect(indicator).toBeInTheDocument();
    });

    it('should render indicator with primary color', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const indicator = homeLink.querySelector('.bg-primary');
      expect(indicator).toBeInTheDocument();
    });

    it('should render indicator with rounded top', () => {
      renderWithRouter(<MobileBottomNav />, { route: '/home' });
      const homeLink = screen.getByText('Home').closest('a');
      const indicator = homeLink.querySelector('.rounded-t-full');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render navigation as semantic nav element', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render items as links', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(5);
    });

    it('should have descriptive text labels for each link', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link.tagName).toBe('A');
      });
    });

    it('should maintain proper tab order', () => {
      renderWithRouter(<MobileBottomNav />);
      const links = screen.getAllByRole('link');
      const hrefs = ['/home', '/communities', '/create', '/chat', '/profile'];
      links.forEach((link, index) => {
        expect(link).toHaveAttribute('href', hrefs[index]);
      });
    });
  });
});

export default renderWithRouter
