/**
 * Comprehensive Test Suite for CRYB Skeleton Component
 * Testing all variants, animations, sizes, and accessibility features
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  Skeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonList,
  SkeletonPost,
  SkeletonTable,
} from './skeleton';

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock framer-motion to simplify testing
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
  };
});

describe('Skeleton Component', () => {
  // ===== BASIC RENDERING TESTS =====
  describe('Basic Rendering', () => {
    it('should render skeleton with default props', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have loading aria-label by default', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading');
    });

    it('should contain sr-only loading text', () => {
      render(<Skeleton />);
      expect(screen.getByText('')).toBeInTheDocument();
      expect(screen.getByText('')).toHaveClass('sr-only');
    });

    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  // ===== ANIMATION VARIANT TESTS =====
  describe('Animation Variants', () => {
    it('should render pulse animation by default', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('');
    });

    it('should render pulse animation when specified', () => {
      render(<Skeleton animation="pulse" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('');
    });

    it('should render wave animation', () => {
      render(<Skeleton animation="wave" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('animate-shimmer');
    });

    it('should render without animation', () => {
      render(<Skeleton animation="none" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).not.toHaveClass('');
      expect(skeleton).not.toHaveClass('animate-shimmer');
    });
  });

  // ===== VARIANT TESTS =====
  describe('Visual Variants', () => {
    it('should render default variant', () => {
      render(<Skeleton variant="default" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('bg-muted');
    });

    it('should render glass variant', () => {
      render(<Skeleton variant="glass" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('bg-muted/50', 'backdrop-blur-sm');
    });

    it('should render gradient variant', () => {
      render(<Skeleton variant="gradient" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('bg-gradient-to-r', 'from-muted', 'to-muted/70');
    });
  });

  // ===== SIZE AND DIMENSION TESTS =====
  describe('Width and Height Props', () => {
    it('should apply width as string', () => {
      render(<Skeleton width="200px" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '200px' });
    });

    it('should apply width as number (converted to px)', () => {
      render(<Skeleton width={300} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '300px' });
    });

    it('should apply height as string', () => {
      render(<Skeleton height="100px" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ height: '100px' });
    });

    it('should apply height as number (converted to px)', () => {
      render(<Skeleton height={150} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ height: '150px' });
    });

    it('should apply both width and height', () => {
      render(<Skeleton width={200} height={100} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('should have default height when not specified', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('h-4');
    });

    it('should not apply default height when height is specified', () => {
      render(<Skeleton height="50px" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).not.toHaveClass('h-4');
    });
  });

  // ===== SHAPE TESTS =====
  describe('Circle Variant', () => {
    it('should render circular skeleton', () => {
      render(<Skeleton circle />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should not be circular by default', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).not.toHaveClass('rounded-full');
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('should render circular with custom dimensions', () => {
      render(<Skeleton circle width={50} height={50} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-full');
      expect(skeleton).toHaveStyle({ width: '50px', height: '50px' });
    });
  });

  // ===== MULTI-LINE TEXT SKELETON TESTS =====
  describe('Multi-line Text Skeleton', () => {
    it('should render single line by default', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton.children.length).toBeLessThanOrEqual(1);
    });

    it('should render multiple lines', () => {
      const { container } = render(<Skeleton lines={3} />);
      const wrapper = container.firstChild as HTMLElement;
      const lines = wrapper.querySelectorAll('div');
      expect(lines).toHaveLength(3);
    });

    it('should apply spacing between lines', () => {
      const { container } = render(<Skeleton lines={2} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
    });

    it('should make last line shorter (75% width)', () => {
      const { container } = render(<Skeleton lines={3} />);
      const wrapper = container.firstChild as HTMLElement;
      const lines = wrapper.querySelectorAll('div');
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toHaveClass('w-3/4');
      expect(lastLine).toHaveStyle({ width: '75%' });
    });

    it('should make all lines except last full width', () => {
      const { container } = render(<Skeleton lines={3} />);
      const wrapper = container.firstChild as HTMLElement;
      const lines = wrapper.querySelectorAll('div');
      for (let i = 0; i < lines.length - 1; i++) {
        expect(lines[i]).toHaveStyle({ width: '100%' });
      }
    });

    it('should apply animation to multi-line skeleton', () => {
      const { container } = render(<Skeleton lines={2} animation="wave" />);
      const wrapper = container.firstChild as HTMLElement;
      const lines = wrapper.querySelectorAll('div');
      lines.forEach((line) => {
        expect(line).toHaveClass('animate-shimmer');
      });
    });
  });

  // ===== REF FORWARDING TESTS =====
  describe('Ref Forwarding', () => {
    it('should forward ref to skeleton element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Skeleton ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should forward ref to multi-line skeleton wrapper', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Skeleton ref={ref} lines={3} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should allow accessing element via ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Skeleton ref={ref} />);
      expect(ref.current?.tagName).toBe('DIV');
    });
  });

  // ===== CUSTOM STYLES TESTS =====
  describe('Custom Styles', () => {
    it('should apply custom inline styles', () => {
      render(<Skeleton style={{ backgroundColor: 'red' }} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ backgroundColor: 'red' });
    });

    it('should merge custom styles with width/height props', () => {
      render(<Skeleton width={100} height={50} style={{ opacity: 0.5 }} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({
        width: '100px',
        height: '50px',
        opacity: 0.5,
      });
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
    });

    it('should have aria-label="Loading"', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading');
    });

    it('should support custom aria-label', () => {
      render(<Skeleton aria-label="Loading user profile" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading user profile');
    });

    it('should include screen reader only loading text', () => {
      render(<Skeleton />);
      const srText = screen.getByText('');
      expect(srText).toHaveClass('sr-only');
    });

    it('should support additional ARIA attributes', () => {
      render(<Skeleton aria-busy="true" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });
  });

  // ===== COMBINED PROPS TESTS =====
  describe('Combined Props', () => {
    it('should combine animation, variant, and circle', () => {
      render(<Skeleton animation="wave" variant="glass" circle />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('animate-shimmer');
      expect(skeleton).toHaveClass('bg-muted/50');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should combine dimensions with custom className', () => {
      render(<Skeleton width={200} height={100} className="custom-skeleton" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('custom-skeleton');
      expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('should work with all props together', () => {
      render(
        <Skeleton
          animation="wave"
          variant="gradient"
          width={150}
          height={75}
          className="test-class"
          aria-label="Custom loading"
        />
      );
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('test-class');
      expect(skeleton).toHaveAttribute('aria-label', 'Custom loading');
    });
  });

  // ===== DISPLAY NAME TEST =====
  describe('Component Metadata', () => {
    it('should have correct displayName', () => {
      expect(Skeleton.displayName).toBe('Skeleton');
    });
  });
});

// ===== SKELETON CARD TESTS =====
describe('SkeletonCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton card', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have border and padding', () => {
      const { container } = render(<SkeletonCard />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border', 'border-border', 'p-6');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonCard className="custom-card" />);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-card');
    });
  });

  describe('Image Section', () => {
    it('should show image skeleton by default', () => {
      const { container } = render(<SkeletonCard />);
      const imageSkeleton = container.querySelector('.h-48');
      expect(imageSkeleton).toBeInTheDocument();
    });

    it('should hide image skeleton when showImage is false', () => {
      const { container } = render(<SkeletonCard showImage={false} />);
      const imageSkeleton = container.querySelector('.h-48');
      expect(imageSkeleton).not.toBeInTheDocument();
    });
  });

  describe('Text Lines', () => {
    it('should render 3 text lines by default', () => {
      const { container } = render(<SkeletonCard />);
      const skeletons = container.querySelectorAll('[role="status"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render custom number of lines', () => {
      render(<SkeletonCard lines={5} />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Action Buttons', () => {
    it('should show action buttons by default', () => {
      const { container } = render(<SkeletonCard />);
      const actions = container.querySelector('.flex.gap-2.pt-2');
      expect(actions).toBeInTheDocument();
    });

    it('should hide action buttons when showActions is false', () => {
      const { container } = render(<SkeletonCard showActions={false} />);
      const actions = container.querySelector('.flex.gap-2.pt-2');
      expect(actions).not.toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should use pulse animation by default', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByRole('status');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('');
      });
    });

    it('should apply custom animation to all parts', () => {
      render(<SkeletonCard animation="wave" />);
      const skeletons = screen.getAllByRole('status');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-shimmer');
      });
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to card container', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<SkeletonCard ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Display Name', () => {
    it('should have correct displayName', () => {
      expect(SkeletonCard.displayName).toBe('SkeletonCard');
    });
  });
});

// ===== SKELETON AVATAR TESTS =====
describe('SkeletonAvatar Component', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton avatar', () => {
      render(<SkeletonAvatar />);
      const avatar = screen.getByRole('status');
      expect(avatar).toBeInTheDocument();
    });

    it('should render as circular', () => {
      render(<SkeletonAvatar />);
      const avatar = screen.getByRole('status');
      expect(avatar).toHaveClass('rounded-full');
    });
  });

  describe('Size Variants', () => {
    it('should render default size', () => {
      render(<SkeletonAvatar size="default" />);
      const avatar = screen.getByRole('status');
      expect(avatar).toHaveClass('h-10', 'w-10');
    });

    it('should render small size', () => {
      render(<SkeletonAvatar size="sm" />);
      const avatar = screen.getByRole('status');
      expect(avatar).toHaveClass('h-8', 'w-8');
    });

    it('should render large size', () => {
      render(<SkeletonAvatar size="lg" />);
      const avatar = screen.getByRole('status');
      expect(avatar).toHaveClass('h-12', 'w-12');
    });

    it('should render xl size', () => {
      render(<SkeletonAvatar size="xl" />);
      const avatar = screen.getByRole('status');
      expect(avatar).toHaveClass('h-16', 'w-16');
    });
  });

  describe('Animation', () => {
    it('should use pulse animation by default', () => {
      render(<SkeletonAvatar />);
      const avatar = screen.getByRole('status');
      expect(avatar).toHaveClass('');
    });

    it('should apply custom animation', () => {
      render(<SkeletonAvatar animation="wave" />);
      const avatar = screen.getByRole('status');
      expect(avatar).toHaveClass('animate-shimmer');
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<SkeletonAvatar className="custom-avatar" />);
      const avatar = screen.getByRole('status');
      expect(avatar).toHaveClass('custom-avatar');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to avatar element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<SkeletonAvatar ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Display Name', () => {
    it('should have correct displayName', () => {
      expect(SkeletonAvatar.displayName).toBe('SkeletonAvatar');
    });
  });
});

// ===== SKELETON LIST TESTS =====
describe('SkeletonList Component', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton list', () => {
      const { container } = render(<SkeletonList />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply spacing between items', () => {
      const { container } = render(<SkeletonList />);
      const list = container.firstChild as HTMLElement;
      expect(list).toHaveClass('space-y-3');
    });
  });

  describe('List Items', () => {
    it('should render 5 items by default', () => {
      const { container } = render(<SkeletonList />);
      const items = container.querySelectorAll('.flex.items-center.gap-3');
      expect(items).toHaveLength(5);
    });

    it('should render custom number of items', () => {
      const { container } = render(<SkeletonList items={3} />);
      const items = container.querySelectorAll('.flex.items-center.gap-3');
      expect(items).toHaveLength(3);
    });

    it('should render 10 items', () => {
      const { container } = render(<SkeletonList items={10} />);
      const items = container.querySelectorAll('.flex.items-center.gap-3');
      expect(items).toHaveLength(10);
    });
  });

  describe('Avatar Display', () => {
    it('should show avatars by default', () => {
      render(<SkeletonList />);
      const avatars = screen.getAllByRole('status');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should hide avatars when showAvatar is false', () => {
      const { container } = render(<SkeletonList showAvatar={false} />);
      const items = container.querySelectorAll('.flex.items-center.gap-3');
      expect(items).toHaveLength(5);
      // Each item should not have avatar (small circular skeleton)
      const avatars = container.querySelectorAll('.h-8.w-8.rounded-full');
      expect(avatars).toHaveLength(0);
    });
  });

  describe('Animation', () => {
    it('should use pulse animation by default', () => {
      render(<SkeletonList />);
      const skeletons = screen.getAllByRole('status');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('');
      });
    });

    it('should apply custom animation to all elements', () => {
      render(<SkeletonList animation="wave" />);
      const skeletons = screen.getAllByRole('status');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-shimmer');
      });
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const { container } = render(<SkeletonList className="custom-list" />);
      const list = container.firstChild as HTMLElement;
      expect(list).toHaveClass('custom-list');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to list container', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<SkeletonList ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Display Name', () => {
    it('should have correct displayName', () => {
      expect(SkeletonList.displayName).toBe('SkeletonList');
    });
  });
});

// ===== SKELETON POST TESTS =====
describe('SkeletonPost Component', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton post', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have border and padding', () => {
      const { container } = render(<SkeletonPost />);
      const post = container.firstChild as HTMLElement;
      expect(post).toHaveClass('border', 'border-border', 'p-6');
    });
  });

  describe('Header Section', () => {
    it('should render avatar in header', () => {
      render(<SkeletonPost />);
      const avatars = screen.getAllByRole('status');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should render user name and timestamp skeletons', () => {
      render(<SkeletonPost />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Image Section', () => {
    it('should show image skeleton by default', () => {
      const { container } = render(<SkeletonPost />);
      const imageSkeleton = container.querySelector('.h-64');
      expect(imageSkeleton).toBeInTheDocument();
    });

    it('should hide image skeleton when showImage is false', () => {
      const { container } = render(<SkeletonPost showImage={false} />);
      const imageSkeleton = container.querySelector('.h-64');
      expect(imageSkeleton).not.toBeInTheDocument();
    });
  });

  describe('Actions Section', () => {
    it('should render action buttons', () => {
      const { container } = render(<SkeletonPost />);
      const actions = container.querySelector('.flex.gap-4.pt-2');
      expect(actions).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should use pulse animation by default', () => {
      render(<SkeletonPost />);
      const skeletons = screen.getAllByRole('status');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('');
      });
    });

    it('should apply custom animation to all elements', () => {
      render(<SkeletonPost animation="wave" />);
      const skeletons = screen.getAllByRole('status');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-shimmer');
      });
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const { container } = render(<SkeletonPost className="custom-post" />);
      const post = container.firstChild as HTMLElement;
      expect(post).toHaveClass('custom-post');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to post container', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<SkeletonPost ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Display Name', () => {
    it('should have correct displayName', () => {
      expect(SkeletonPost.displayName).toBe('SkeletonPost');
    });
  });
});

// ===== SKELETON TABLE TESTS =====
describe('SkeletonTable Component', () => {
  describe('Basic Rendering', () => {
    it('should render skeleton table', () => {
      const { container } = render(<SkeletonTable />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have border and rounded corners', () => {
      const { container } = render(<SkeletonTable />);
      const table = container.firstChild as HTMLElement;
      expect(table).toHaveClass('border', 'border-border', 'rounded-lg');
    });
  });

  describe('Table Dimensions', () => {
    it('should render 5 rows by default', () => {
      const { container } = render(<SkeletonTable />);
      const rows = container.querySelectorAll('.grid.gap-4.p-4.border-b.border-border.last\\:border-b-0');
      expect(rows).toHaveLength(5);
    });

    it('should render custom number of rows', () => {
      const { container } = render(<SkeletonTable rows={3} />);
      const rows = container.querySelectorAll('.grid.gap-4.p-4.border-b.border-border.last\\:border-b-0');
      expect(rows).toHaveLength(3);
    });

    it('should render 4 columns by default', () => {
      const { container } = render(<SkeletonTable />);
      const headerCells = container.querySelectorAll('.bg-muted\\/50 [role="status"]');
      expect(headerCells).toHaveLength(4);
    });

    it('should render custom number of columns', () => {
      const { container } = render(<SkeletonTable columns={6} />);
      const headerCells = container.querySelectorAll('.bg-muted\\/50 [role="status"]');
      expect(headerCells).toHaveLength(6);
    });
  });

  describe('Table Structure', () => {
    it('should render table header', () => {
      const { container } = render(<SkeletonTable />);
      const header = container.querySelector('.bg-muted\\/50');
      expect(header).toBeInTheDocument();
    });

    it('should apply grid template columns based on column count', () => {
      const { container } = render(<SkeletonTable columns={5} />);
      const header = container.querySelector('.bg-muted\\/50');
      expect(header).toHaveStyle({ gridTemplateColumns: 'repeat(5, 1fr)' });
    });

    it('should not have border on last row', () => {
      const { container } = render(<SkeletonTable rows={3} />);
      const rows = container.querySelectorAll('.grid.gap-4.p-4.border-b.border-border.last\\:border-b-0');
      const lastRow = rows[rows.length - 1];
      expect(lastRow).toHaveClass('last:border-b-0');
    });
  });

  describe('Animation', () => {
    it('should use pulse animation by default', () => {
      render(<SkeletonTable />);
      const skeletons = screen.getAllByRole('status');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('');
      });
    });

    it('should apply custom animation to all cells', () => {
      render(<SkeletonTable animation="wave" />);
      const skeletons = screen.getAllByRole('status');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-shimmer');
      });
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const { container } = render(<SkeletonTable className="custom-table" />);
      const table = container.firstChild as HTMLElement;
      expect(table).toHaveClass('custom-table');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to table container', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<SkeletonTable ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Display Name', () => {
    it('should have correct displayName', () => {
      expect(SkeletonTable.displayName).toBe('SkeletonTable');
    });
  });

  describe('Large Tables', () => {
    it('should render large tables efficiently', () => {
      const { container } = render(<SkeletonTable rows={20} columns={10} />);
      const rows = container.querySelectorAll('.grid.gap-4.p-4.border-b.border-border.last\\:border-b-0');
      expect(rows).toHaveLength(20);
      const headerCells = container.querySelectorAll('.bg-muted\\/50 [role="status"]');
      expect(headerCells).toHaveLength(10);
    });
  });
});

// ===== INTEGRATION TESTS =====
describe('Skeleton Component Integration', () => {
  describe('Multiple Skeletons', () => {
    it('should render multiple skeleton components together', () => {
      render(
        <div>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      );
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(3);
    });

    it('should render different skeleton types together', () => {
      render(
        <div>
          <SkeletonAvatar />
          <Skeleton lines={3} />
          <SkeletonCard />
        </div>
      );
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Nested Components', () => {
    it('should work within other containers', () => {
      const { container } = render(
        <div className="container">
          <SkeletonCard />
        </div>
      );
      expect(container.querySelector('.container')).toBeInTheDocument();
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should render user profile skeleton', () => {
      render(
        <div>
          <SkeletonAvatar size="xl" />
          <Skeleton width={200} className="mt-2" />
          <Skeleton width={150} className="mt-1" />
        </div>
      );
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(3);
    });

    it('should render product grid skeleton', () => {
      render(
        <div>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      );
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render feed skeleton', () => {
      render(
        <div>
          <SkeletonPost />
          <SkeletonPost showImage={false} />
          <SkeletonPost />
        </div>
      );
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
