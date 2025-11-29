/**
 * CRYB Platform - SkeletonList Component Tests
 * Comprehensive test suite for the SkeletonList component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkeletonList } from './SkeletonList';
import { cn } from '../../../lib/utils';

// Mock the cn utility
jest.mock('../../../lib/utils', () => ({
  cn: jest.fn((...args) => args.filter(Boolean).join(' '))
}));

describe('SkeletonList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Default Variant', () => {
    it('should render with default count of 3 items', () => {
      const { container } = render(<SkeletonList />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(3);
    });

    it('should render with custom count', () => {
      const { container } = render(<SkeletonList count={5} />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(5);
    });

    it('should render with count of 1', () => {
      const { container } = render(<SkeletonList count={1} />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(1);
    });

    it('should render with count of 10', () => {
      const { container } = render(<SkeletonList count={10} />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(10);
    });

    it('should render wrapper with space-y-3 class', () => {
      const { container } = render(<SkeletonList />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-3');
    });

    it('should apply custom className to wrapper', () => {
      const { container } = render(<SkeletonList className="custom-wrapper" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-3', 'custom-wrapper');
    });

    it('should apply custom itemClassName to items', () => {
      const { container } = render(<SkeletonList itemClassName="custom-item" />);
      const items = container.querySelectorAll('.flex.items-center');
      items.forEach(item => {
        expect(item).toHaveClass('custom-item');
      });
    });

    it('should render avatar skeleton with correct dimensions', () => {
      const { container } = render(<SkeletonList />);
      const avatars = container.querySelectorAll('.flex-shrink-0.w-12.h-12');
      expect(avatars).toHaveLength(3);
    });

    it('should render avatar with rounded class', () => {
      const { container } = render(<SkeletonList />);
      const avatars = container.querySelectorAll('.flex-shrink-0.w-12.h-12');
      avatars.forEach(avatar => {
        expect(avatar).toHaveClass('rounded');
      });
    });

    it('should render avatar with shimmer animation', () => {
      const { container } = render(<SkeletonList />);
      const avatars = container.querySelectorAll('.flex-shrink-0.w-12.h-12');
      avatars.forEach(avatar => {
        expect(avatar).toHaveClass('animate-shimmer');
      });
    });

    it('should render content area with two lines', () => {
      const { container } = render(<SkeletonList />);
      const items = container.querySelectorAll('.flex.items-center');
      items.forEach(item => {
        const contentLines = item.querySelectorAll('.flex-1.space-y-2 > div');
        expect(contentLines).toHaveLength(2);
      });
    });

    it('should render first content line with h-4 height', () => {
      const { container } = render(<SkeletonList />);
      const firstLines = container.querySelectorAll('.flex-1.space-y-2 > div:first-child');
      firstLines.forEach(line => {
        expect(line).toHaveClass('h-4');
      });
    });

    it('should render second content line with h-3 height', () => {
      const { container } = render(<SkeletonList />);
      const secondLines = container.querySelectorAll('.flex-1.space-y-2 > div:last-child');
      secondLines.forEach(line => {
        expect(line).toHaveClass('h-3');
      });
    });

    it('should render all skeleton elements with bg-bg-tertiary', () => {
      const { container } = render(<SkeletonList />);
      const skeletonElements = container.querySelectorAll('.bg-bg-tertiary');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('should render all skeleton elements with animate-shimmer', () => {
      const { container } = render(<SkeletonList />);
      const animatedElements = container.querySelectorAll('.animate-shimmer');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Message Variant', () => {
    it('should render message variant with correct structure', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-4');
    });

    it('should render message variant with default count', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const items = container.querySelectorAll('.flex.gap-3');
      expect(items).toHaveLength(3);
    });

    it('should render message variant with custom count', () => {
      const { container } = render(<SkeletonList variant="message" count={7} />);
      const items = container.querySelectorAll('.flex.gap-3');
      expect(items).toHaveLength(7);
    });

    it('should render message avatar with correct size', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const avatars = container.querySelectorAll('.flex-shrink-0.w-10.h-10');
      expect(avatars).toHaveLength(3);
    });

    it('should render message avatar with rounded-full class', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const avatars = container.querySelectorAll('.flex-shrink-0.w-10.h-10');
      avatars.forEach(avatar => {
        expect(avatar).toHaveClass('rounded-full');
      });
    });

    it('should render message content with three lines', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const items = container.querySelectorAll('.flex.gap-3');
      items.forEach(item => {
        const contentLines = item.querySelectorAll('.flex-1.space-y-2 > div');
        expect(contentLines).toHaveLength(3);
      });
    });

    it('should render message first line with fixed width', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const firstLines = container.querySelectorAll('.flex-1.space-y-2 > div:first-child');
      firstLines.forEach(line => {
        expect(line).toHaveClass('w-32');
      });
    });

    it('should render message second line with full width', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const items = container.querySelectorAll('.flex.gap-3');
      items.forEach(item => {
        const secondLine = item.querySelectorAll('.flex-1.space-y-2 > div')[1];
        expect(secondLine).toHaveClass('w-full');
      });
    });

    it('should render message third line with 2/3 width', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const items = container.querySelectorAll('.flex.gap-3');
      items.forEach(item => {
        const thirdLine = item.querySelectorAll('.flex-1.space-y-2 > div')[2];
        expect(thirdLine).toHaveClass('w-2/3');
      });
    });

    it('should apply custom className to message variant wrapper', () => {
      const { container } = render(<SkeletonList variant="message" className="custom-msg" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-4', 'custom-msg');
    });

    it('should apply custom itemClassName to message variant items', () => {
      const { container } = render(<SkeletonList variant="message" itemClassName="custom-msg-item" />);
      const items = container.querySelectorAll('.flex.gap-3');
      items.forEach(item => {
        expect(item).toHaveClass('custom-msg-item');
      });
    });
  });

  describe('Post Variant', () => {
    it('should render post variant with correct structure', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-6');
    });

    it('should render post variant with default count', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const items = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6');
      expect(items).toHaveLength(3);
    });

    it('should render post variant with custom count', () => {
      const { container } = render(<SkeletonList variant="post" count={4} />);
      const items = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6');
      expect(items).toHaveLength(4);
    });

    it('should render post items with border', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const items = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6');
      items.forEach(item => {
        expect(item).toHaveClass('border', 'border-border');
      });
    });

    it('should render post avatar with size 12', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const avatars = container.querySelectorAll('.flex-shrink-0.w-12.h-12.rounded-full');
      expect(avatars).toHaveLength(3);
    });

    it('should render post header with two lines', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const posts = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6');
      posts.forEach(post => {
        const headerLines = post.querySelectorAll('.flex.gap-3.mb-4 .flex-1.space-y-2 > div');
        expect(headerLines).toHaveLength(2);
      });
    });

    it('should render post content with three lines', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const posts = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6');
      posts.forEach(post => {
        const contentLines = post.querySelectorAll('.space-y-2.mb-4 > div');
        expect(contentLines).toHaveLength(3);
      });
    });

    it('should render post image placeholder', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const images = container.querySelectorAll('.h-48.bg-bg-tertiary.rounded-lg');
      expect(images).toHaveLength(3);
    });

    it('should render post actions with three buttons', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const posts = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6');
      posts.forEach(post => {
        const actions = post.querySelectorAll('.flex.gap-4 > div');
        expect(actions).toHaveLength(3);
      });
    });

    it('should render post action buttons with h-8 height', () => {
      const { container } = render(<SkeletonList variant="post" />);
      const actionButtons = container.querySelectorAll('.flex.gap-4 > div.h-8');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('should apply custom className to post variant wrapper', () => {
      const { container } = render(<SkeletonList variant="post" className="custom-post" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-6', 'custom-post');
    });

    it('should apply custom itemClassName to post variant items', () => {
      const { container } = render(<SkeletonList variant="post" itemClassName="custom-post-item" />);
      const items = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6');
      items.forEach(item => {
        expect(item).toHaveClass('custom-post-item');
      });
    });
  });

  describe('Table Variant', () => {
    it('should render table variant with correct structure', () => {
      const { container } = render(<SkeletonList variant="table" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-2');
    });

    it('should render table variant with default count plus header', () => {
      const { container } = render(<SkeletonList variant="table" />);
      const rows = container.querySelectorAll('.grid.grid-cols-4');
      expect(rows).toHaveLength(4); // 1 header + 3 body rows
    });

    it('should render table variant with custom count plus header', () => {
      const { container } = render(<SkeletonList variant="table" count={6} />);
      const rows = container.querySelectorAll('.grid.grid-cols-4');
      expect(rows).toHaveLength(7); // 1 header + 6 body rows
    });

    it('should render table header row', () => {
      const { container } = render(<SkeletonList variant="table" />);
      const headerRow = container.querySelector('.grid.grid-cols-4.gap-4.p-4.border-b.border-border');
      expect(headerRow).toBeInTheDocument();
    });

    it('should render table header with 4 columns', () => {
      const { container } = render(<SkeletonList variant="table" />);
      const allRows = container.querySelectorAll('.grid.grid-cols-4');
      const headerRow = allRows[0];
      const headerCells = headerRow.querySelectorAll('.h-4');
      expect(headerCells).toHaveLength(4);
    });

    it('should render table body rows with 4 columns each', () => {
      const { container } = render(<SkeletonList variant="table" />);
      const allRows = container.querySelectorAll('.grid.grid-cols-4');
      const bodyRows = Array.from(allRows).slice(1);
      bodyRows.forEach(row => {
        const cells = row.querySelectorAll('.h-3');
        expect(cells).toHaveLength(4);
      });
    });

    it('should render table header cells with h-4 height', () => {
      const { container } = render(<SkeletonList variant="table" />);
      const allRows = container.querySelectorAll('.grid.grid-cols-4');
      const headerRow = allRows[0];
      const headerCells = headerRow.querySelectorAll('div');
      headerCells.forEach(cell => {
        expect(cell).toHaveClass('h-4');
      });
    });

    it('should render table body cells with h-3 height', () => {
      const { container } = render(<SkeletonList variant="table" />);
      const allRows = container.querySelectorAll('.grid.grid-cols-4');
      const bodyRows = Array.from(allRows).slice(1);
      bodyRows.forEach(row => {
        const cells = row.querySelectorAll('div');
        cells.forEach(cell => {
          expect(cell).toHaveClass('h-3');
        });
      });
    });

    it('should render all table rows with border-bottom', () => {
      const { container } = render(<SkeletonList variant="table" />);
      const rows = container.querySelectorAll('.grid.grid-cols-4');
      rows.forEach(row => {
        expect(row).toHaveClass('border-b', 'border-border');
      });
    });

    it('should apply custom className to table variant wrapper', () => {
      const { container } = render(<SkeletonList variant="table" className="custom-table" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-2', 'custom-table');
    });
  });

  describe('Animation Classes', () => {
    it('should apply animate-shimmer to all skeleton elements in default variant', () => {
      const { container } = render(<SkeletonList />);
      const animatedElements = container.querySelectorAll('.animate-shimmer');
      expect(animatedElements.length).toBe(9); // 3 items * (1 avatar + 2 lines)
    });

    it('should apply animate-shimmer to all skeleton elements in message variant', () => {
      const { container } = render(<SkeletonList variant="message" />);
      const animatedElements = container.querySelectorAll('.animate-shimmer');
      expect(animatedElements.length).toBe(12); // 3 items * (1 avatar + 3 lines)
    });

    it('should apply animate-shimmer to all skeleton elements in post variant', () => {
      const { container } = render(<SkeletonList variant="post" count={1} />);
      const animatedElements = container.querySelectorAll('.animate-shimmer');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('should apply animate-shimmer to all skeleton elements in table variant', () => {
      const { container } = render(<SkeletonList variant="table" count={1} />);
      const animatedElements = container.querySelectorAll('.animate-shimmer');
      expect(animatedElements.length).toBe(8); // 4 header cells + 4 body cells
    });
  });

  describe('Edge Cases', () => {
    it('should handle count of 0', () => {
      const { container } = render(<SkeletonList count={0} />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(0);
    });

    it('should handle large count values', () => {
      const { container } = render(<SkeletonList count={50} />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(50);
    });

    it('should handle undefined variant as default', () => {
      const { container } = render(<SkeletonList variant={undefined} />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(3);
    });

    it('should handle unknown variant as default', () => {
      const { container } = render(<SkeletonList variant="unknown" />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(3);
    });

    it('should handle empty className', () => {
      const { container } = render(<SkeletonList className="" />);
      const wrapper = container.firstChild;
      expect(wrapper).toBeInTheDocument();
    });

    it('should handle empty itemClassName', () => {
      const { container } = render(<SkeletonList itemClassName="" />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should handle multiple custom classes', () => {
      const { container } = render(<SkeletonList className="class1 class2 class3" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('class1', 'class2', 'class3');
    });
  });

  describe('Accessibility', () => {
    it('should render valid HTML structure', () => {
      const { container } = render(<SkeletonList />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not have any interactive elements', () => {
      const { container } = render(<SkeletonList />);
      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      const inputs = container.querySelectorAll('input');
      expect(buttons).toHaveLength(0);
      expect(links).toHaveLength(0);
      expect(inputs).toHaveLength(0);
    });

    it('should render consistent structure for all items in default variant', () => {
      const { container } = render(<SkeletonList count={5} />);
      const items = container.querySelectorAll('.flex.items-center');
      const firstItemHTML = items[0].innerHTML;
      items.forEach(item => {
        expect(item.innerHTML).toBe(firstItemHTML);
      });
    });

    it('should render consistent structure for all items in message variant', () => {
      const { container } = render(<SkeletonList variant="message" count={5} />);
      const items = container.querySelectorAll('.flex.gap-3');
      const firstItemHTML = items[0].innerHTML;
      items.forEach(item => {
        expect(item.innerHTML).toBe(firstItemHTML);
      });
    });

    it('should render consistent structure for all items in post variant', () => {
      const { container } = render(<SkeletonList variant="post" count={5} />);
      const items = container.querySelectorAll('.bg-bg-secondary.rounded-lg.p-6');
      const firstItemHTML = items[0].innerHTML;
      items.forEach(item => {
        expect(item.innerHTML).toBe(firstItemHTML);
      });
    });
  });

  describe('cn Utility Integration', () => {
    it('should call cn utility for wrapper className', () => {
      render(<SkeletonList className="custom" />);
      expect(cn).toHaveBeenCalledWith('space-y-3', 'custom');
    });

    it('should call cn utility for itemClassName', () => {
      render(<SkeletonList itemClassName="custom-item" />);
      expect(cn).toHaveBeenCalledWith(
        'flex items-center gap-3 p-4 bg-bg-secondary rounded-lg border border-border',
        'custom-item'
      );
    });

    it('should call cn utility for message variant wrapper', () => {
      render(<SkeletonList variant="message" className="custom-msg" />);
      expect(cn).toHaveBeenCalledWith('space-y-4', 'custom-msg');
    });

    it('should call cn utility for post variant wrapper', () => {
      render(<SkeletonList variant="post" className="custom-post" />);
      expect(cn).toHaveBeenCalledWith('space-y-6', 'custom-post');
    });

    it('should call cn utility for table variant wrapper', () => {
      render(<SkeletonList variant="table" className="custom-table" />);
      expect(cn).toHaveBeenCalledWith('space-y-2', 'custom-table');
    });
  });
});

export default items
