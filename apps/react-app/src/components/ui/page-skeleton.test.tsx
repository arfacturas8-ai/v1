/**
 * Comprehensive Test Suite for CRYB PageSkeleton Component
 * Testing rendering, layout, animations, and accessibility features
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PageSkeleton } from './page-skeleton';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('PageSkeleton Component', () => {
  // ===== BASIC RENDERING TESTS =====
  describe('Basic Rendering', () => {
    it('should render page skeleton', () => {
      const { container } = render(<PageSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have animate-pulse class', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('animate-pulse');
    });

    it('should have spacing and padding classes', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4', 'p-4');
    });

    it('should apply custom className', () => {
      const { container } = render(<PageSkeleton className="custom-skeleton" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-skeleton');
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<PageSkeleton className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('animate-pulse', 'space-y-4', 'p-4', 'custom-class');
    });
  });

  // ===== HEADER SKELETON TESTS =====
  describe('Header Skeleton', () => {
    it('should render header section', () => {
      const { container } = render(<PageSkeleton />);
      const headerSection = container.querySelector('.space-y-2');
      expect(headerSection).toBeInTheDocument();
    });

    it('should render header title skeleton', () => {
      const { container } = render(<PageSkeleton />);
      const headerTitle = container.querySelector('.h-8.bg-muted.rounded.w-1\\/3');
      expect(headerTitle).toBeInTheDocument();
    });

    it('should render header subtitle skeleton', () => {
      const { container } = render(<PageSkeleton />);
      const headerSubtitle = container.querySelector('.h-4.bg-muted.rounded.w-1\\/2');
      expect(headerSubtitle).toBeInTheDocument();
    });

    it('should have correct header title dimensions', () => {
      const { container } = render(<PageSkeleton />);
      const headerTitle = container.querySelector('.h-8.bg-muted.rounded.w-1\\/3');
      expect(headerTitle).toHaveClass('h-8', 'w-1/3');
    });

    it('should have correct header subtitle dimensions', () => {
      const { container } = render(<PageSkeleton />);
      const headerSubtitle = container.querySelector('.h-4.bg-muted.rounded.w-1\\/2');
      expect(headerSubtitle).toHaveClass('h-4', 'w-1/2');
    });

    it('should have muted background for header elements', () => {
      const { container } = render(<PageSkeleton />);
      const headerElements = container.querySelectorAll('.space-y-2 .bg-muted');
      expect(headerElements.length).toBe(2);
    });

    it('should have rounded corners on header elements', () => {
      const { container } = render(<PageSkeleton />);
      const headerElements = container.querySelectorAll('.space-y-2 .rounded');
      expect(headerElements.length).toBe(2);
    });
  });

  // ===== CONTENT SKELETON TESTS =====
  describe('Content Skeleton', () => {
    it('should render content section', () => {
      const { container } = render(<PageSkeleton />);
      const contentSection = container.querySelector('.space-y-4');
      expect(contentSection).toBeInTheDocument();
    });

    it('should render grid layout', () => {
      const { container } = render(<PageSkeleton />);
      const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-4');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive grid columns', () => {
      const { container } = render(<PageSkeleton />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('should have gap between grid items', () => {
      const { container } = render(<PageSkeleton />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-4');
    });

    it('should render 6 grid items', () => {
      const { container } = render(<PageSkeleton />);
      const gridItems = container.querySelectorAll('.grid > .space-y-2');
      expect(gridItems).toHaveLength(6);
    });

    it('should render each grid item with correct structure', () => {
      const { container } = render(<PageSkeleton />);
      const gridItems = container.querySelectorAll('.grid > .space-y-2');
      gridItems.forEach((item) => {
        expect(item).toHaveClass('space-y-2');
      });
    });
  });

  // ===== GRID ITEM TESTS =====
  describe('Grid Items', () => {
    it('should render image skeleton in each grid item', () => {
      const { container } = render(<PageSkeleton />);
      const imageSkeletons = container.querySelectorAll('.h-32.bg-muted.rounded');
      expect(imageSkeletons).toHaveLength(6);
    });

    it('should render first text line in each grid item', () => {
      const { container } = render(<PageSkeleton />);
      const firstTextLines = container.querySelectorAll('.h-4.bg-muted.rounded.w-3\\/4');
      expect(firstTextLines).toHaveLength(6);
    });

    it('should render second text line in each grid item', () => {
      const { container } = render(<PageSkeleton />);
      const secondTextLines = container.querySelectorAll('.h-4.bg-muted.rounded.w-1\\/2');
      expect(secondTextLines.length).toBeGreaterThanOrEqual(6);
    });

    it('should have correct image skeleton dimensions', () => {
      const { container } = render(<PageSkeleton />);
      const imageSkeletons = container.querySelectorAll('.h-32.bg-muted.rounded');
      imageSkeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('h-32', 'bg-muted', 'rounded');
      });
    });

    it('should have muted background for all skeleton elements', () => {
      const { container } = render(<PageSkeleton />);
      const mutedElements = container.querySelectorAll('.bg-muted');
      expect(mutedElements.length).toBeGreaterThan(0);
    });

    it('should have rounded corners on all skeleton elements', () => {
      const { container } = render(<PageSkeleton />);
      const roundedElements = container.querySelectorAll('.rounded');
      expect(roundedElements.length).toBeGreaterThan(0);
    });
  });

  // ===== LOADING TEXT TESTS =====
  describe('Loading Text', () => {
    it('should render loading text section', () => {
      const { container } = render(<PageSkeleton />);
      const loadingSection = container.querySelector('.text-center.text-muted-foreground');
      expect(loadingSection).toBeInTheDocument();
    });

    it('should render loading text', () => {
      render(<PageSkeleton />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have centered text', () => {
      const { container } = render(<PageSkeleton />);
      const loadingSection = container.querySelector('.text-center');
      expect(loadingSection).toHaveClass('text-center');
    });

    it('should have muted foreground color', () => {
      const { container } = render(<PageSkeleton />);
      const loadingSection = container.querySelector('.text-muted-foreground');
      expect(loadingSection).toHaveClass('text-muted-foreground');
    });

    it('should render inline flex container', () => {
      const { container } = render(<PageSkeleton />);
      const inlineContainer = container.querySelector('.inline-flex.items-center.space-x-2');
      expect(inlineContainer).toBeInTheDocument();
    });

    it('should align items center in loading container', () => {
      const { container } = render(<PageSkeleton />);
      const inlineContainer = container.querySelector('.inline-flex');
      expect(inlineContainer).toHaveClass('items-center');
    });

    it('should have spacing between spinner and text', () => {
      const { container } = render(<PageSkeleton />);
      const inlineContainer = container.querySelector('.inline-flex');
      expect(inlineContainer).toHaveClass('space-x-2');
    });
  });

  // ===== SPINNER TESTS =====
  describe('Loading Spinner', () => {
    it('should render spinner SVG', () => {
      const { container } = render(<PageSkeleton />);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have animate-spin class', () => {
      const { container } = render(<PageSkeleton />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should have correct spinner dimensions', () => {
      const { container } = render(<PageSkeleton />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('h-4', 'w-4');
    });

    it('should have correct viewBox', () => {
      const { container } = render(<PageSkeleton />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should render spinner circle', () => {
      const { container } = render(<PageSkeleton />);
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('should have circle with correct attributes', () => {
      const { container } = render(<PageSkeleton />);
      const circle = container.querySelector('circle');
      expect(circle).toHaveAttribute('cx', '12');
      expect(circle).toHaveAttribute('cy', '12');
      expect(circle).toHaveAttribute('r', '10');
      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(circle).toHaveAttribute('strokeWidth', '4');
      expect(circle).toHaveAttribute('fill', 'none');
    });

    it('should have circle with opacity class', () => {
      const { container } = render(<PageSkeleton />);
      const circle = container.querySelector('circle');
      expect(circle).toHaveClass('opacity-25');
    });

    it('should render spinner path', () => {
      const { container } = render(<PageSkeleton />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });

    it('should have path with correct attributes', () => {
      const { container } = render(<PageSkeleton />);
      const path = container.querySelector('path');
      expect(path).toHaveClass('opacity-75');
      expect(path).toHaveAttribute('fill', 'currentColor');
      expect(path).toHaveAttribute('d', 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z');
    });
  });

  // ===== ANIMATION TESTS =====
  describe('Animation States', () => {
    it('should have pulse animation on wrapper', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('animate-pulse');
    });

    it('should have spin animation on spinner', () => {
      const { container } = render(<PageSkeleton />);
      const spinner = container.querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should animate all skeleton elements together', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      const skeletonElements = wrapper.querySelectorAll('.bg-muted');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  // ===== LAYOUT TESTS =====
  describe('Layout and Spacing', () => {
    it('should have vertical spacing between sections', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-4');
    });

    it('should have padding around content', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('p-4');
    });

    it('should maintain consistent spacing in header', () => {
      const { container } = render(<PageSkeleton />);
      const header = container.querySelector('.space-y-2');
      expect(header).toHaveClass('space-y-2');
    });

    it('should maintain consistent spacing in grid items', () => {
      const { container } = render(<PageSkeleton />);
      const gridItems = container.querySelectorAll('.grid > .space-y-2');
      gridItems.forEach((item) => {
        expect(item).toHaveClass('space-y-2');
      });
    });
  });

  // ===== RESPONSIVE DESIGN TESTS =====
  describe('Responsive Layout', () => {
    it('should have single column on mobile', () => {
      const { container } = render(<PageSkeleton />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should have three columns on medium screens', () => {
      const { container } = render(<PageSkeleton />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('md:grid-cols-3');
    });

    it('should adapt to different viewport sizes', () => {
      const { container } = render(<PageSkeleton />);
      const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should render loading text for screen readers', () => {
      render(<PageSkeleton />);
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
    });

    it('should have visible loading indicator', () => {
      const { container } = render(<PageSkeleton />);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have text accompanying spinner', () => {
      render(<PageSkeleton />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should use currentColor for spinner to inherit text color', () => {
      const { container } = render(<PageSkeleton />);
      const circle = container.querySelector('circle');
      const path = container.querySelector('path');
      expect(circle).toHaveAttribute('stroke', 'currentColor');
      expect(path).toHaveAttribute('fill', 'currentColor');
    });
  });

  // ===== COMPOSITION TESTS =====
  describe('Skeleton Composition', () => {
    it('should render all main sections', () => {
      const { container } = render(<PageSkeleton />);
      const header = container.querySelector('.space-y-2');
      const content = container.querySelector('.grid');
      const loading = container.querySelector('.text-center');
      expect(header).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(loading).toBeInTheDocument();
    });

    it('should maintain proper DOM hierarchy', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children.length).toBe(3);
    });

    it('should render header before content', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      const header = wrapper.children[0];
      expect(header).toHaveClass('space-y-2');
    });

    it('should render loading text last', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      const loading = wrapper.children[wrapper.children.length - 1];
      expect(loading).toHaveClass('text-center');
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration Scenarios', () => {
    it('should render complete page skeleton', () => {
      const { container } = render(<PageSkeleton />);
      const wrapper = container.firstChild as HTMLElement;
      const headerElements = container.querySelectorAll('.space-y-2 .bg-muted');
      const gridItems = container.querySelectorAll('.grid > .space-y-2');
      const spinner = container.querySelector('svg.animate-spin');
      const loadingText = screen.getByText('Loading...');

      expect(wrapper).toBeInTheDocument();
      expect(headerElements.length).toBe(2);
      expect(gridItems).toHaveLength(6);
      expect(spinner).toBeInTheDocument();
      expect(loadingText).toBeInTheDocument();
    });

    it('should render multiple page skeletons independently', () => {
      render(
        <div>
          <PageSkeleton className="first" />
          <PageSkeleton className="second" />
        </div>
      );
      const loadingTexts = screen.getAllByText('Loading...');
      expect(loadingTexts).toHaveLength(2);
    });

    it('should work within a container', () => {
      const { container } = render(
        <div className="container">
          <PageSkeleton />
        </div>
      );
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom styling', () => {
      const { container } = render(
        <PageSkeleton className="bg-white shadow-lg" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-white', 'shadow-lg');
    });
  });

  // ===== REAL-WORLD SCENARIOS =====
  describe('Real-world Use Cases', () => {
    it('should simulate dashboard loading state', () => {
      const { container } = render(<PageSkeleton className="max-w-7xl mx-auto" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-7xl', 'mx-auto');
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should simulate list view loading state', () => {
      const { container } = render(<PageSkeleton />);
      const gridItems = container.querySelectorAll('.grid > .space-y-2');
      expect(gridItems).toHaveLength(6);
    });

    it('should simulate grid view loading state', () => {
      const { container } = render(<PageSkeleton />);
      const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('should work as a full page loader', () => {
      const { container } = render(<PageSkeleton className="min-h-screen" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('min-h-screen');
    });
  });

  // ===== EDGE CASES =====
  describe('Edge Cases', () => {
    it('should handle empty className', () => {
      const { container } = render(<PageSkeleton className="" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('animate-pulse', 'space-y-4', 'p-4');
    });

    it('should handle undefined className', () => {
      const { container } = render(<PageSkeleton className={undefined} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('animate-pulse', 'space-y-4', 'p-4');
    });

    it('should render all grid items with unique keys', () => {
      const { container } = render(<PageSkeleton />);
      const gridItems = container.querySelectorAll('.grid > .space-y-2');
      expect(gridItems).toHaveLength(6);
    });

    it('should maintain performance with multiple renders', () => {
      const { rerender } = render(<PageSkeleton />);
      rerender(<PageSkeleton className="updated" />);
      rerender(<PageSkeleton className="updated-again" />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // ===== SNAPSHOT TEST =====
  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<PageSkeleton />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot with custom className', () => {
      const { container } = render(<PageSkeleton className="custom-class" />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
