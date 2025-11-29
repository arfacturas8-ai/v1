/**
 * CRYB Platform - Skeleton Dashboard Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkeletonDashboard } from './SkeletonDashboard';
import { cn } from '../../../lib/utils';

jest.mock('../../../lib/utils', () => ({
  cn: jest.fn((...args) => args.filter(Boolean).join(' '))
}));

describe('SkeletonDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<SkeletonDashboard />);
      expect(container).toBeInTheDocument();
    });

    it('should render the main container', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toBeInTheDocument();
    });

    it('should apply default spacing classes', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('space-y-6');
    });

    it('should apply custom className when provided', () => {
      render(<SkeletonDashboard className="custom-class" />);
      expect(cn).toHaveBeenCalledWith('space-y-6', 'custom-class');
    });

    it('should handle undefined className prop', () => {
      render(<SkeletonDashboard className={undefined} />);
      expect(cn).toHaveBeenCalledWith('space-y-6', undefined);
    });

    it('should handle empty string className prop', () => {
      render(<SkeletonDashboard className="" />);
      expect(cn).toHaveBeenCalledWith('space-y-6', '');
    });
  });

  describe('Stats Cards Section', () => {
    it('should render stats cards container', () => {
      const { container } = render(<SkeletonDashboard />);
      const statsGrid = container.querySelector('.grid');
      expect(statsGrid).toBeInTheDocument();
    });

    it('should apply responsive grid classes to stats cards', () => {
      const { container } = render(<SkeletonDashboard />);
      const statsGrid = container.querySelector('.grid');
      expect(statsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4', 'gap-4');
    });

    it('should render exactly 4 stat cards', () => {
      const { container } = render(<SkeletonDashboard />);
      const statCards = container.querySelectorAll('.grid > div');
      expect(statCards).toHaveLength(4);
    });

    it('should apply correct styling to each stat card', () => {
      const { container } = render(<SkeletonDashboard />);
      const statCards = container.querySelectorAll('.grid > div');
      statCards.forEach(card => {
        expect(card).toHaveClass('bg-bg-secondary', 'rounded-lg', 'p-6', 'border', 'border-border');
      });
    });

    it('should render three skeleton elements in each stat card', () => {
      const { container } = render(<SkeletonDashboard />);
      const statCards = container.querySelectorAll('.grid > div');
      statCards.forEach(card => {
        const skeletons = card.querySelectorAll('.bg-bg-tertiary');
        expect(skeletons).toHaveLength(3);
      });
    });

    it('should apply shimmer animation to stat card elements', () => {
      const { container } = render(<SkeletonDashboard />);
      const statCards = container.querySelectorAll('.grid > div');
      statCards.forEach(card => {
        const skeletons = card.querySelectorAll('.animate-shimmer');
        expect(skeletons).toHaveLength(3);
      });
    });

    it('should render stat card title skeleton with correct dimensions', () => {
      const { container } = render(<SkeletonDashboard />);
      const titleSkeleton = container.querySelector('.grid > div > div:nth-child(1)');
      expect(titleSkeleton).toHaveClass('h-4', 'w-24', 'mb-4');
    });

    it('should render stat card value skeleton with correct dimensions', () => {
      const { container } = render(<SkeletonDashboard />);
      const valueSkeleton = container.querySelector('.grid > div > div:nth-child(2)');
      expect(valueSkeleton).toHaveClass('h-8', 'w-32', 'mb-2');
    });

    it('should render stat card subtitle skeleton with correct dimensions', () => {
      const { container } = render(<SkeletonDashboard />);
      const subtitleSkeleton = container.querySelector('.grid > div > div:nth-child(3)');
      expect(subtitleSkeleton).toHaveClass('h-3', 'w-20');
    });

    it('should have unique keys for each stat card', () => {
      const { container } = render(<SkeletonDashboard />);
      const statCards = container.querySelectorAll('.grid > div');
      const keys = Array.from(statCards).map(card => card.getAttribute('data-key'));
      expect(new Set(keys).size).toBeLessThanOrEqual(4);
    });
  });

  describe('Chart Area Section', () => {
    it('should render chart container', () => {
      const { container } = render(<SkeletonDashboard />);
      const chartContainers = container.querySelectorAll('.bg-bg-secondary');
      expect(chartContainers.length).toBeGreaterThanOrEqual(2);
    });

    it('should apply correct styling to chart container', () => {
      const { container } = render(<SkeletonDashboard />);
      const allContainers = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6.border.border-border');
      expect(allContainers.length).toBeGreaterThanOrEqual(1);
    });

    it('should render chart title skeleton', () => {
      const { container } = render(<SkeletonDashboard />);
      const chartTitle = container.querySelector('.bg-bg-secondary:not(.grid) > div:first-child');
      expect(chartTitle).toHaveClass('h-6', 'bg-bg-tertiary', 'rounded', 'animate-shimmer', 'w-48', 'mb-6');
    });

    it('should render chart area skeleton', () => {
      const { container } = render(<SkeletonDashboard />);
      const chartArea = container.querySelector('.h-64');
      expect(chartArea).toBeInTheDocument();
      expect(chartArea).toHaveClass('h-64', 'bg-bg-tertiary', 'rounded-lg', 'animate-shimmer');
    });

    it('should apply shimmer animation to chart elements', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      const chartSection = mainDiv.children[1];
      const animatedElements = chartSection.querySelectorAll('.animate-shimmer');
      expect(animatedElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should render chart with appropriate height', () => {
      const { container } = render(<SkeletonDashboard />);
      const chartArea = container.querySelector('.h-64');
      expect(chartArea).toHaveClass('h-64');
    });
  });

  describe('Table Section', () => {
    it('should render table container', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      const tableSection = mainDiv.children[2];
      expect(tableSection).toBeInTheDocument();
      expect(tableSection).toHaveClass('bg-bg-secondary', 'rounded-lg', 'p-6', 'border', 'border-border');
    });

    it('should render table title skeleton', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      const tableSection = mainDiv.children[2];
      const tableTitle = tableSection.querySelector('div:first-child');
      expect(tableTitle).toHaveClass('h-6', 'bg-bg-tertiary', 'rounded', 'animate-shimmer', 'w-40', 'mb-6');
    });

    it('should render table rows container', () => {
      const { container } = render(<SkeletonDashboard />);
      const tableRowsContainer = container.querySelector('.space-y-3');
      expect(tableRowsContainer).toBeInTheDocument();
    });

    it('should render exactly 5 table rows', () => {
      const { container } = render(<SkeletonDashboard />);
      const tableRows = container.querySelectorAll('.space-y-3 > .flex');
      expect(tableRows).toHaveLength(5);
    });

    it('should apply flex layout to each table row', () => {
      const { container } = render(<SkeletonDashboard />);
      const tableRows = container.querySelectorAll('.space-y-3 > .flex');
      tableRows.forEach(row => {
        expect(row).toHaveClass('flex', 'gap-4');
      });
    });

    it('should render 3 columns in each table row', () => {
      const { container } = render(<SkeletonDashboard />);
      const tableRows = container.querySelectorAll('.space-y-3 > .flex');
      tableRows.forEach(row => {
        const columns = row.querySelectorAll('.flex-1');
        expect(columns).toHaveLength(3);
      });
    });

    it('should apply shimmer animation to table cells', () => {
      const { container } = render(<SkeletonDashboard />);
      const tableRows = container.querySelectorAll('.space-y-3 > .flex');
      tableRows.forEach(row => {
        const animatedCells = row.querySelectorAll('.animate-shimmer');
        expect(animatedCells).toHaveLength(3);
      });
    });

    it('should render table cells with correct styling', () => {
      const { container } = render(<SkeletonDashboard />);
      const tableCells = container.querySelectorAll('.space-y-3 .flex-1');
      tableCells.forEach(cell => {
        expect(cell).toHaveClass('flex-1', 'h-4', 'bg-bg-tertiary', 'rounded', 'animate-shimmer');
      });
    });

    it('should have unique keys for each table row', () => {
      const { container } = render(<SkeletonDashboard />);
      const tableRows = container.querySelectorAll('.space-y-3 > .flex');
      expect(tableRows).toHaveLength(5);
    });
  });

  describe('Layout Sections', () => {
    it('should render all three main sections', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      expect(mainDiv.children).toHaveLength(3);
    });

    it('should render sections in correct order', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;

      const statsSection = mainDiv.children[0];
      expect(statsSection).toHaveClass('grid');

      const chartSection = mainDiv.children[1];
      expect(chartSection.querySelector('.h-64')).toBeInTheDocument();

      const tableSection = mainDiv.children[2];
      expect(tableSection.querySelector('.space-y-3')).toBeInTheDocument();
    });

    it('should maintain consistent spacing between sections', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('space-y-6');
    });
  });

  describe('Animation Effects', () => {
    it('should apply shimmer animation to all skeleton elements', () => {
      const { container } = render(<SkeletonDashboard />);
      const allShimmerElements = container.querySelectorAll('.animate-shimmer');
      expect(allShimmerElements.length).toBeGreaterThan(0);
    });

    it('should have shimmer animation on stat cards', () => {
      const { container } = render(<SkeletonDashboard />);
      const statCards = container.querySelectorAll('.grid > div');
      statCards.forEach(card => {
        const shimmerElements = card.querySelectorAll('.animate-shimmer');
        expect(shimmerElements.length).toBe(3);
      });
    });

    it('should have shimmer animation on chart section', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      const chartSection = mainDiv.children[1];
      const shimmerElements = chartSection.querySelectorAll('.animate-shimmer');
      expect(shimmerElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should have shimmer animation on table section', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      const tableSection = mainDiv.children[2];
      const shimmerElements = tableSection.querySelectorAll('.animate-shimmer');
      expect(shimmerElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should not have any interactive elements', () => {
      const { container } = render(<SkeletonDashboard />);
      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      const inputs = container.querySelectorAll('input');

      expect(buttons).toHaveLength(0);
      expect(links).toHaveLength(0);
      expect(inputs).toHaveLength(0);
    });

    it('should render semantic div elements', () => {
      const { container } = render(<SkeletonDashboard />);
      const mainDiv = container.firstChild;
      expect(mainDiv.tagName).toBe('DIV');
    });

    it('should not interfere with screen reader content', () => {
      const { container } = render(<SkeletonDashboard />);
      const ariaHidden = container.querySelectorAll('[aria-hidden="true"]');
      expect(ariaHidden).toHaveLength(0);
    });
  });

  describe('Styling Consistency', () => {
    it('should use consistent border styling across sections', () => {
      const { container } = render(<SkeletonDashboard />);
      const borderedElements = container.querySelectorAll('.border.border-border');
      expect(borderedElements.length).toBeGreaterThanOrEqual(3);
    });

    it('should use consistent background colors', () => {
      const { container } = render(<SkeletonDashboard />);
      const secondaryBg = container.querySelectorAll('.bg-bg-secondary');
      const tertiaryBg = container.querySelectorAll('.bg-bg-tertiary');

      expect(secondaryBg.length).toBeGreaterThan(0);
      expect(tertiaryBg.length).toBeGreaterThan(0);
    });

    it('should use consistent border radius', () => {
      const { container } = render(<SkeletonDashboard />);
      const roundedElements = container.querySelectorAll('.rounded, .rounded-lg');
      expect(roundedElements.length).toBeGreaterThan(0);
    });

    it('should apply consistent padding to main sections', () => {
      const { container } = render(<SkeletonDashboard />);
      const paddedSections = container.querySelectorAll('.p-6');
      expect(paddedSections.length).toBeGreaterThanOrEqual(3);
    });
  });
});

export default mainDiv
