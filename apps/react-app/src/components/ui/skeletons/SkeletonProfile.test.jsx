import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SkeletonProfile,
  SkeletonProfileHeader,
  SkeletonProfileStats,
  SkeletonProfileActivity,
  SkeletonProfileBadges,
} from './SkeletonProfile';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, initial, animate, transition, variants, role, ...props }) => (
      <div
        className={className}
        style={style}
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        data-variants={JSON.stringify(variants)}
        role={role}
        {...props}
      >
        {children}
      </div>
    ),
  },
}));

// Mock SkeletonBase components
vi.mock('./SkeletonBase', () => ({
  Skeleton: ({ width, height, className, rounded, role, ...props }) => (
    <div
      data-testid="skeleton"
      data-width={width}
      data-height={height}
      data-rounded={rounded}
      className={className}
      role={role || 'status'}
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only"></span>
    </div>
  ),
  SkeletonText: ({ lines, spacing, className, lastLineWidth }) => (
    <div
      data-testid="skeleton-text"
      data-lines={lines}
      data-spacing={spacing}
      data-last-line-width={lastLineWidth}
      className={className}
    >
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} data-testid="skeleton-text-line" />
      ))}
    </div>
  ),
  SkeletonCircle: ({ size, className }) => (
    <div
      data-testid="skeleton-circle"
      data-size={size}
      className={className}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only"></span>
    </div>
  ),
  SkeletonButton: ({ size, className }) => (
    <div
      data-testid="skeleton-button"
      data-size={size}
      className={className}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only"></span>
    </div>
  ),
  SkeletonImage: ({ aspectRatio, rounded, className }) => (
    <div
      data-testid="skeleton-image"
      data-aspect-ratio={aspectRatio}
      data-rounded={rounded}
      className={className}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only"></span>
    </div>
  ),
}));

describe('SkeletonProfile', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<SkeletonProfile />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<SkeletonProfile className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render all major sections', () => {
      render(<SkeletonProfile />);

      const images = screen.getAllByTestId('skeleton-image');
      const circles = screen.getAllByTestId('skeleton-circle');
      const buttons = screen.getAllByTestId('skeleton-button');

      expect(images.length).toBeGreaterThan(0);
      expect(circles.length).toBeGreaterThan(0);
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Banner Placeholder', () => {
    it('should render cover image skeleton', () => {
      render(<SkeletonProfile />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toBeInTheDocument();
    });

    it('should render cover image with ultrawide aspect ratio', () => {
      render(<SkeletonProfile />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toHaveAttribute('data-aspect-ratio', 'ultrawide');
    });

    it('should render cover image with no rounding', () => {
      render(<SkeletonProfile />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toHaveAttribute('data-rounded', 'none');
    });

    it('should render cover image with full width class', () => {
      render(<SkeletonProfile />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toHaveClass('w-full');
    });
  });

  describe('Avatar Placeholder', () => {
    it('should render avatar circle skeleton', () => {
      render(<SkeletonProfile />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should render avatar with 3xl size', () => {
      render(<SkeletonProfile />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const avatar = circles.find(circle => circle.getAttribute('data-size') === '3xl');
      expect(avatar).toBeInTheDocument();
    });

    it('should render avatar with border classes', () => {
      render(<SkeletonProfile />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const avatar = circles.find(circle =>
        circle.className.includes('border-4') &&
        circle.className.includes('border-white')
      );
      expect(avatar).toBeInTheDocument();
    });

    it('should position avatar absolutely', () => {
      const { container } = render(<SkeletonProfile />);
      const avatarContainer = container.querySelector('.absolute.-bottom-16.left-6');
      expect(avatarContainer).toBeInTheDocument();
    });
  });

  describe('Username and Bio Lines', () => {
    it('should render username skeleton', () => {
      render(<SkeletonProfile />);
      const skeletons = screen.getAllByTestId('skeleton');
      const username = skeletons.find(s => s.getAttribute('data-width') === '200px');
      expect(username).toBeInTheDocument();
    });

    it('should render username with correct height', () => {
      render(<SkeletonProfile />);
      const skeletons = screen.getAllByTestId('skeleton');
      const username = skeletons.find(s =>
        s.getAttribute('data-width') === '200px' &&
        s.getAttribute('data-height') === '2rem'
      );
      expect(username).toBeInTheDocument();
    });

    it('should render handle/subtitle skeleton', () => {
      render(<SkeletonProfile />);
      const skeletons = screen.getAllByTestId('skeleton');
      const handle = skeletons.find(s => s.getAttribute('data-width') === '150px');
      expect(handle).toBeInTheDocument();
    });

    it('should render bio text skeleton', () => {
      render(<SkeletonProfile />);
      const bioText = screen.getByTestId('skeleton-text');
      expect(bioText).toBeInTheDocument();
    });

    it('should render bio with 3 lines', () => {
      render(<SkeletonProfile />);
      const bioText = screen.getByTestId('skeleton-text');
      expect(bioText).toHaveAttribute('data-lines', '3');
    });

    it('should render bio with small spacing', () => {
      render(<SkeletonProfile />);
      const bioText = screen.getByTestId('skeleton-text');
      expect(bioText).toHaveAttribute('data-spacing', 'sm');
    });
  });

  describe('Stats Placeholders', () => {
    it('should render metadata icons and text', () => {
      render(<SkeletonProfile />);
      const skeletons = screen.getAllByTestId('skeleton');
      const icons = skeletons.filter(s =>
        s.getAttribute('data-width') === '20px' &&
        s.getAttribute('data-height') === '20px'
      );
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });

    it('should render metadata text placeholders', () => {
      render(<SkeletonProfile />);
      const skeletons = screen.getAllByTestId('skeleton');
      const metadata = skeletons.filter(s =>
        s.getAttribute('data-width') === '100px' ||
        s.getAttribute('data-width') === '120px'
      );
      expect(metadata.length).toBeGreaterThan(0);
    });

    it('should render stats row with multiple items', () => {
      render(<SkeletonProfile />);
      const skeletons = screen.getAllByTestId('skeleton');
      const stats = skeletons.filter(s =>
        s.getAttribute('data-width') === '80px' ||
        s.getAttribute('data-width') === '100px' ||
        s.getAttribute('data-width') === '90px'
      );
      expect(stats.length).toBeGreaterThanOrEqual(3);
    });

    it('should render metadata with rounded corners', () => {
      render(<SkeletonProfile />);
      const skeletons = screen.getAllByTestId('skeleton');
      const icons = skeletons.filter(s => s.getAttribute('data-rounded') === 'sm');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Action Buttons Area', () => {
    it('should render action buttons', () => {
      render(<SkeletonProfile />);
      const buttons = screen.getAllByTestId('skeleton-button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should render buttons with medium size', () => {
      render(<SkeletonProfile />);
      const buttons = screen.getAllByTestId('skeleton-button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('data-size', 'md');
      });
    });

    it('should render buttons in a flex container', () => {
      const { container } = render(<SkeletonProfile />);
      const buttonContainer = container.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Tabs Skeleton', () => {
    it('should render tabs section', () => {
      const { container } = render(<SkeletonProfile />);
      const tabsContainer = container.querySelector('.border-b.border-gray-200');
      expect(tabsContainer).toBeInTheDocument();
    });

    it('should render 4 tab placeholders', () => {
      render(<SkeletonProfile />);
      const skeletons = screen.getAllByTestId('skeleton');
      const tabs = skeletons.filter(s =>
        s.getAttribute('data-width') === '80px' &&
        s.getAttribute('data-height') === '40px'
      );
      expect(tabs.length).toBe(4);
    });

    it('should render tabs in a flex container with gap', () => {
      const { container } = render(<SkeletonProfile />);
      const tabsContainer = container.querySelector('.flex.gap-8');
      expect(tabsContainer).toBeInTheDocument();
    });

    it('should render tabs with dark mode border class', () => {
      const { container } = render(<SkeletonProfile />);
      const tabsContainer = container.querySelector('.dark\\:border-gray-800');
      expect(tabsContainer).toBeInTheDocument();
    });
  });

  describe('Animation Effects', () => {
    it('should have initial opacity animation', () => {
      const { container } = render(<SkeletonProfile />);
      const root = container.firstChild;
      const initial = JSON.parse(root.getAttribute('data-initial'));
      expect(initial.opacity).toBe(0);
    });

    it('should animate to full opacity', () => {
      const { container } = render(<SkeletonProfile />);
      const root = container.firstChild;
      const animate = JSON.parse(root.getAttribute('data-animate'));
      expect(animate.opacity).toBe(1);
    });

    it('should have transition duration', () => {
      const { container } = render(<SkeletonProfile />);
      const root = container.firstChild;
      const transition = JSON.parse(root.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      render(<SkeletonProfile />);
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('should have accessible labels', () => {
      render(<SkeletonProfile />);
      const labels = screen.getAllByLabelText('Loading');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should have screen reader text', () => {
      const { container } = render(<SkeletonProfile />);
      const srText = container.querySelectorAll('.sr-only');
      expect(srText.length).toBeGreaterThan(0);
    });
  });
});

describe('SkeletonProfileHeader', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<SkeletonProfileHeader />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<SkeletonProfileHeader className="custom-header" />);
      expect(container.firstChild).toHaveClass('custom-header');
    });

    it('should render with card styling', () => {
      const { container } = render(<SkeletonProfileHeader />);
      expect(container.firstChild).toHaveClass('bg-white');
      expect(container.firstChild).toHaveClass('rounded-xl');
      expect(container.firstChild).toHaveClass('border');
    });
  });

  describe('Compact Mode', () => {
    it('should render in normal mode by default', () => {
      render(<SkeletonProfileHeader />);
      const circle = screen.getByTestId('skeleton-circle');
      expect(circle).toHaveAttribute('data-size', '2xl');
    });

    it('should render in compact mode when prop is true', () => {
      render(<SkeletonProfileHeader compact={true} />);
      const circle = screen.getByTestId('skeleton-circle');
      expect(circle).toHaveAttribute('data-size', 'lg');
    });

    it('should render smaller username in compact mode', () => {
      render(<SkeletonProfileHeader compact={true} />);
      const skeletons = screen.getAllByTestId('skeleton');
      const username = skeletons.find(s => s.getAttribute('data-height') === '1.25rem');
      expect(username).toBeInTheDocument();
    });

    it('should render larger username in normal mode', () => {
      render(<SkeletonProfileHeader compact={false} />);
      const skeletons = screen.getAllByTestId('skeleton');
      const username = skeletons.find(s => s.getAttribute('data-height') === '1.5rem');
      expect(username).toBeInTheDocument();
    });

    it('should not render bio in compact mode', () => {
      render(<SkeletonProfileHeader compact={true} />);
      const bioText = screen.queryByTestId('skeleton-text');
      expect(bioText).not.toBeInTheDocument();
    });

    it('should render bio in normal mode', () => {
      render(<SkeletonProfileHeader compact={false} />);
      const bioText = screen.getByTestId('skeleton-text');
      expect(bioText).toBeInTheDocument();
    });

    it('should not render metadata stats in compact mode', () => {
      const { container } = render(<SkeletonProfileHeader compact={true} />);
      const skeletons = screen.getAllByTestId('skeleton');
      const stats = skeletons.filter(s =>
        s.getAttribute('data-width') === '100px' &&
        s.getAttribute('data-height') === '1rem'
      );
      expect(stats.length).toBe(0);
    });

    it('should render metadata stats in normal mode', () => {
      render(<SkeletonProfileHeader compact={false} />);
      const skeletons = screen.getAllByTestId('skeleton');
      const stats = skeletons.filter(s => s.getAttribute('data-height') === '1rem');
      expect(stats.length).toBeGreaterThan(0);
    });
  });

  describe('Avatar and Content', () => {
    it('should render avatar circle', () => {
      render(<SkeletonProfileHeader />);
      expect(screen.getByTestId('skeleton-circle')).toBeInTheDocument();
    });

    it('should render username placeholder', () => {
      render(<SkeletonProfileHeader />);
      const skeletons = screen.getAllByTestId('skeleton');
      const username = skeletons.find(s => s.getAttribute('data-width') === '60%');
      expect(username).toBeInTheDocument();
    });

    it('should render handle placeholder', () => {
      render(<SkeletonProfileHeader />);
      const skeletons = screen.getAllByTestId('skeleton');
      const handle = skeletons.find(s => s.getAttribute('data-width') === '40%');
      expect(handle).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<SkeletonProfileHeader />);
      const buttons = screen.getAllByTestId('skeleton-button');
      expect(buttons.length).toBe(2);
    });

    it('should render bio with 2 lines in normal mode', () => {
      render(<SkeletonProfileHeader compact={false} />);
      const bioText = screen.getByTestId('skeleton-text');
      expect(bioText).toHaveAttribute('data-lines', '2');
    });
  });

  describe('Layout Structure', () => {
    it('should have flex layout for avatar and content', () => {
      const { container } = render(<SkeletonProfileHeader />);
      const layout = container.querySelector('.flex.items-start.gap-4');
      expect(layout).toBeInTheDocument();
    });

    it('should have flex layout for buttons', () => {
      const { container } = render(<SkeletonProfileHeader />);
      const buttonContainer = container.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Animation Effects', () => {
    it('should have initial opacity and y position', () => {
      const { container } = render(<SkeletonProfileHeader />);
      const root = container.firstChild;
      const initial = JSON.parse(root.getAttribute('data-initial'));
      expect(initial.opacity).toBe(0);
      expect(initial.y).toBe(20);
    });

    it('should animate to final position', () => {
      const { container } = render(<SkeletonProfileHeader />);
      const root = container.firstChild;
      const animate = JSON.parse(root.getAttribute('data-animate'));
      expect(animate.opacity).toBe(1);
      expect(animate.y).toBe(0);
    });

    it('should have 0.3s transition duration', () => {
      const { container } = render(<SkeletonProfileHeader />);
      const root = container.firstChild;
      const transition = JSON.parse(root.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.3);
    });
  });
});

describe('SkeletonProfileStats', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<SkeletonProfileStats />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<SkeletonProfileStats className="custom-stats" />);
      expect(container.firstChild).toHaveClass('custom-stats');
    });

    it('should render with card styling', () => {
      const { container } = render(<SkeletonProfileStats />);
      expect(container.firstChild).toHaveClass('bg-white');
      expect(container.firstChild).toHaveClass('rounded-xl');
    });
  });

  describe('Stats Structure', () => {
    it('should render title skeleton', () => {
      render(<SkeletonProfileStats />);
      const skeletons = screen.getAllByTestId('skeleton');
      const title = skeletons.find(s =>
        s.getAttribute('data-width') === '150px' &&
        s.getAttribute('data-height') === '1.25rem'
      );
      expect(title).toBeInTheDocument();
    });

    it('should render 4 stat items', () => {
      render(<SkeletonProfileStats />);
      const skeletons = screen.getAllByTestId('skeleton');
      const statValues = skeletons.filter(s =>
        s.getAttribute('data-width') === '60px' &&
        s.getAttribute('data-height') === '2rem'
      );
      expect(statValues.length).toBe(4);
    });

    it('should render stat labels', () => {
      render(<SkeletonProfileStats />);
      const skeletons = screen.getAllByTestId('skeleton');
      const labels = skeletons.filter(s =>
        s.getAttribute('data-width') === '80px' &&
        s.getAttribute('data-height') === '0.875rem'
      );
      expect(labels.length).toBe(4);
    });

    it('should have grid layout', () => {
      const { container } = render(<SkeletonProfileStats />);
      const grid = container.querySelector('.grid.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive md columns', () => {
      const { container } = render(<SkeletonProfileStats />);
      const grid = container.querySelector('.md\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Animation Effects', () => {
    it('should have initial animation state', () => {
      const { container } = render(<SkeletonProfileStats />);
      const root = container.firstChild;
      const initial = JSON.parse(root.getAttribute('data-initial'));
      expect(initial.opacity).toBe(0);
      expect(initial.y).toBe(20);
    });

    it('should have animation delay', () => {
      const { container } = render(<SkeletonProfileStats />);
      const root = container.firstChild;
      const transition = JSON.parse(root.getAttribute('data-transition'));
      expect(transition.delay).toBe(0.1);
    });
  });
});

describe('SkeletonProfileActivity', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<SkeletonProfileActivity />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<SkeletonProfileActivity className="custom-activity" />);
      expect(container.firstChild).toHaveClass('custom-activity');
    });

    it('should render with card styling', () => {
      const { container } = render(<SkeletonProfileActivity />);
      expect(container.firstChild).toHaveClass('bg-white');
      expect(container.firstChild).toHaveClass('rounded-xl');
    });
  });

  describe('Activity Items', () => {
    it('should render default 5 items', () => {
      render(<SkeletonProfileActivity />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBe(5);
    });

    it('should render custom number of items', () => {
      render(<SkeletonProfileActivity items={3} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBe(3);
    });

    it('should render 10 items when specified', () => {
      render(<SkeletonProfileActivity items={10} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBe(10);
    });

    it('should render avatar for each item', () => {
      render(<SkeletonProfileActivity items={5} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      circles.forEach(circle => {
        expect(circle).toHaveAttribute('data-size', 'xs');
      });
    });

    it('should render text content for each item', () => {
      render(<SkeletonProfileActivity items={3} />);
      const texts = screen.getAllByTestId('skeleton-text');
      expect(texts.length).toBe(3);
    });

    it('should render 2 lines of text per item', () => {
      render(<SkeletonProfileActivity items={2} />);
      const texts = screen.getAllByTestId('skeleton-text');
      texts.forEach(text => {
        expect(text).toHaveAttribute('data-lines', '2');
      });
    });

    it('should render text with extra small spacing', () => {
      render(<SkeletonProfileActivity items={2} />);
      const texts = screen.getAllByTestId('skeleton-text');
      texts.forEach(text => {
        expect(text).toHaveAttribute('data-spacing', 'xs');
      });
    });

    it('should render metadata for each item', () => {
      render(<SkeletonProfileActivity items={2} />);
      const skeletons = screen.getAllByTestId('skeleton');
      const metadata = skeletons.filter(s =>
        s.getAttribute('data-height') === '0.875rem'
      );
      expect(metadata.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Header Section', () => {
    it('should render header with title', () => {
      const { container } = render(<SkeletonProfileActivity />);
      const header = container.querySelector('.p-4.border-b');
      expect(header).toBeInTheDocument();
    });

    it('should render title skeleton', () => {
      render(<SkeletonProfileActivity />);
      const skeletons = screen.getAllByTestId('skeleton');
      const title = skeletons.find(s =>
        s.getAttribute('data-width') === '120px' &&
        s.getAttribute('data-height') === '1.25rem'
      );
      expect(title).toBeInTheDocument();
    });
  });

  describe('Animation Effects', () => {
    it('should have animation delay of 0.2', () => {
      const { container } = render(<SkeletonProfileActivity />);
      const root = container.firstChild;
      const transition = JSON.parse(root.getAttribute('data-transition'));
      expect(transition.delay).toBe(0.2);
    });

    it('should animate from bottom', () => {
      const { container } = render(<SkeletonProfileActivity />);
      const root = container.firstChild;
      const initial = JSON.parse(root.getAttribute('data-initial'));
      expect(initial.y).toBe(20);
    });
  });
});

describe('SkeletonProfileBadges', () => {
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<SkeletonProfileBadges />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(<SkeletonProfileBadges className="custom-badges" />);
      expect(container.firstChild).toHaveClass('custom-badges');
    });

    it('should render with card styling', () => {
      const { container } = render(<SkeletonProfileBadges />);
      expect(container.firstChild).toHaveClass('bg-white');
      expect(container.firstChild).toHaveClass('rounded-xl');
    });
  });

  describe('Badge Items', () => {
    it('should render default 6 badges', () => {
      render(<SkeletonProfileBadges />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBe(6);
    });

    it('should render custom number of badges', () => {
      render(<SkeletonProfileBadges count={4} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBe(4);
    });

    it('should render 12 badges when specified', () => {
      render(<SkeletonProfileBadges count={12} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBe(12);
    });

    it('should render badge icons with large size', () => {
      render(<SkeletonProfileBadges count={6} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      circles.forEach(circle => {
        expect(circle).toHaveAttribute('data-size', 'lg');
      });
    });

    it('should render badge labels', () => {
      render(<SkeletonProfileBadges count={3} />);
      const skeletons = screen.getAllByTestId('skeleton');
      const labels = skeletons.filter(s =>
        s.getAttribute('data-width') === '60px' &&
        s.getAttribute('data-height') === '0.75rem'
      );
      expect(labels.length).toBe(3);
    });

    it('should have grid layout', () => {
      const { container } = render(<SkeletonProfileBadges />);
      const grid = container.querySelector('.grid.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive md columns', () => {
      const { container } = render(<SkeletonProfileBadges />);
      const grid = container.querySelector('.md\\:grid-cols-6');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Header Section', () => {
    it('should render title skeleton', () => {
      render(<SkeletonProfileBadges />);
      const skeletons = screen.getAllByTestId('skeleton');
      const title = skeletons.find(s =>
        s.getAttribute('data-width') === '100px' &&
        s.getAttribute('data-height') === '1.25rem'
      );
      expect(title).toBeInTheDocument();
    });
  });

  describe('Animation Effects', () => {
    it('should have animation delay of 0.15', () => {
      const { container } = render(<SkeletonProfileBadges />);
      const root = container.firstChild;
      const transition = JSON.parse(root.getAttribute('data-transition'));
      expect(transition.delay).toBe(0.15);
    });

    it('should animate with opacity and position', () => {
      const { container } = render(<SkeletonProfileBadges />);
      const root = container.firstChild;
      const initial = JSON.parse(root.getAttribute('data-initial'));
      const animate = JSON.parse(root.getAttribute('data-animate'));

      expect(initial.opacity).toBe(0);
      expect(initial.y).toBe(20);
      expect(animate.opacity).toBe(1);
      expect(animate.y).toBe(0);
    });

    it('should have 0.3s transition duration', () => {
      const { container } = render(<SkeletonProfileBadges />);
      const root = container.firstChild;
      const transition = JSON.parse(root.getAttribute('data-transition'));
      expect(transition.duration).toBe(0.3);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible status roles', () => {
      render(<SkeletonProfileBadges count={3} />);
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('should have loading labels', () => {
      render(<SkeletonProfileBadges count={2} />);
      const labels = screen.getAllByLabelText('Loading');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should have screen reader text', () => {
      const { container } = render(<SkeletonProfileBadges />);
      const srText = container.querySelectorAll('.sr-only');
      expect(srText.length).toBeGreaterThan(0);
    });
  });
});

export default images
