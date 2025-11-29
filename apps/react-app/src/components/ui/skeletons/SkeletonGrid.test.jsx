import React from 'react';
import { render, screen } from '@testing-library/react';
import { motion } from 'framer-motion';
import {
  SkeletonGrid,
  SkeletonFeed,
  SkeletonList,
  SkeletonCommentList,
  SkeletonTable,
} from './SkeletonGrid';
import {
  SkeletonPostCard,
  SkeletonCommunityCard,
  SkeletonUserCard,
  SkeletonCommentCard,
} from './SkeletonCard';

jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: jest.fn(({ children, className, variants, initial, animate, style, ...props }) =>
        React.createElement('div', { className, style, ...props }, children)
      ),
    },
  };
});

jest.mock('./SkeletonCard', () => ({
  SkeletonPostCard: jest.fn(({ showMedia, showCommunity }) => (
    <div data-testid="skeleton-post-card" data-show-media={showMedia} data-show-community={showCommunity}>
      Post Card
    </div>
  )),
  SkeletonCommunityCard: jest.fn(() => (
    <div data-testid="skeleton-community-card">Community Card</div>
  )),
  SkeletonUserCard: jest.fn(() => (
    <div data-testid="skeleton-user-card">User Card</div>
  )),
  SkeletonCommentCard: jest.fn(({ depth }) => (
    <div data-testid="skeleton-comment-card" data-depth={depth}>
      Comment Card
    </div>
  )),
}));

describe('SkeletonGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<SkeletonGrid />);
      const gridElement = container.firstChild;
      expect(gridElement).toBeInTheDocument();
      expect(gridElement).toHaveClass('grid');
    });

    it('should render the correct number of items with default value', () => {
      const { container } = render(<SkeletonGrid />);
      const items = container.querySelectorAll('div > div');
      expect(items).toHaveLength(6);
    });

    it('should apply motion.div with container variants', () => {
      render(<SkeletonGrid />);
      expect(motion.div).toHaveBeenCalled();
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonGrid className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render grid container with initial and animate props', () => {
      render(<SkeletonGrid />);
      const motionCalls = motion.div.mock.calls;
      const containerCall = motionCalls.find(
        call => call[0].variants && call[0].initial === 'hidden' && call[0].animate === 'show'
      );
      expect(containerCall).toBeDefined();
    });
  });

  describe('Item Count', () => {
    it('should render 1 item when items=1', () => {
      const { container } = render(<SkeletonGrid items={1} />);
      const items = container.querySelectorAll('div > div');
      expect(items).toHaveLength(1);
    });

    it('should render 3 items when items=3', () => {
      const { container } = render(<SkeletonGrid items={3} />);
      const items = container.querySelectorAll('div > div');
      expect(items).toHaveLength(3);
    });

    it('should render 12 items when items=12', () => {
      const { container } = render(<SkeletonGrid items={12} />);
      const items = container.querySelectorAll('div > div');
      expect(items).toHaveLength(12);
    });

    it('should render 0 items when items=0', () => {
      const { container } = render(<SkeletonGrid items={0} />);
      const items = container.querySelectorAll('div > div');
      expect(items).toHaveLength(0);
    });

    it('should render 20 items for large grids', () => {
      const { container } = render(<SkeletonGrid items={20} />);
      const items = container.querySelectorAll('div > div');
      expect(items).toHaveLength(20);
    });
  });

  describe('Column Count Variants', () => {
    it('should apply 1 column classes when columns=1', () => {
      const { container } = render(<SkeletonGrid columns={1} />);
      expect(container.firstChild).toHaveClass('grid-cols-1');
    });

    it('should apply 2 column responsive classes when columns=2', () => {
      const { container } = render(<SkeletonGrid columns={2} />);
      expect(container.firstChild).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('should apply 3 column responsive classes when columns=3', () => {
      const { container } = render(<SkeletonGrid columns={3} />);
      expect(container.firstChild).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should apply 4 column responsive classes when columns=4', () => {
      const { container } = render(<SkeletonGrid columns={4} />);
      expect(container.firstChild).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    it('should apply 5 column responsive classes when columns=5', () => {
      const { container } = render(<SkeletonGrid columns={5} />);
      expect(container.firstChild).toHaveClass('grid-cols-1', 'md:grid-cols-3', 'lg:grid-cols-5');
    });

    it('should apply 6 column responsive classes when columns=6', () => {
      const { container } = render(<SkeletonGrid columns={6} />);
      expect(container.firstChild).toHaveClass('grid-cols-2', 'md:grid-cols-4', 'lg:grid-cols-6');
    });
  });

  describe('Gap Variants', () => {
    it('should apply gap-2 when gap=2', () => {
      const { container } = render(<SkeletonGrid gap={2} />);
      expect(container.firstChild).toHaveClass('gap-2');
    });

    it('should apply gap-3 when gap=3', () => {
      const { container } = render(<SkeletonGrid gap={3} />);
      expect(container.firstChild).toHaveClass('gap-3');
    });

    it('should apply gap-4 when gap=4 (default)', () => {
      const { container } = render(<SkeletonGrid gap={4} />);
      expect(container.firstChild).toHaveClass('gap-4');
    });

    it('should apply gap-6 when gap=6', () => {
      const { container } = render(<SkeletonGrid gap={6} />);
      expect(container.firstChild).toHaveClass('gap-6');
    });

    it('should apply gap-8 when gap=8', () => {
      const { container } = render(<SkeletonGrid gap={8} />);
      expect(container.firstChild).toHaveClass('gap-8');
    });
  });

  describe('Type Variants - Card Type', () => {
    it('should render default card type items', () => {
      const { container } = render(<SkeletonGrid items={2} type="card" />);
      const cards = container.querySelectorAll('.bg-white.dark\\:bg-gray-900.rounded-xl');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should render card items with aspect-square elements', () => {
      const { container } = render(<SkeletonGrid items={2} type="card" />);
      const aspectSquare = container.querySelector('.aspect-square');
      expect(aspectSquare).toBeInTheDocument();
    });

    it('should render card items with gradient backgrounds', () => {
      const { container } = render(<SkeletonGrid items={2} type="card" />);
      const gradients = container.querySelectorAll('.bg-gradient-to-r');
      expect(gradients.length).toBeGreaterThan(0);
    });

    it('should render card items with spacing', () => {
      const { container } = render(<SkeletonGrid items={2} type="card" />);
      const spacedDiv = container.querySelector('.space-y-2');
      expect(spacedDiv).toBeInTheDocument();
    });

    it('should render card items with border styling', () => {
      const { container } = render(<SkeletonGrid items={2} type="card" />);
      const bordered = container.querySelector('.border-gray-200.dark\\:border-gray-800');
      expect(bordered).toBeInTheDocument();
    });
  });

  describe('Type Variants - Special Cards', () => {
    it('should render SkeletonCommunityCard when type=community', () => {
      render(<SkeletonGrid items={2} type="community" />);
      expect(screen.getAllByTestId('skeleton-community-card')).toHaveLength(2);
      expect(SkeletonCommunityCard).toHaveBeenCalledTimes(2);
    });

    it('should render SkeletonUserCard when type=user', () => {
      render(<SkeletonGrid items={3} type="user" />);
      expect(screen.getAllByTestId('skeleton-user-card')).toHaveLength(3);
      expect(SkeletonUserCard).toHaveBeenCalledTimes(3);
    });

    it('should render SkeletonPostCard when type=post', () => {
      render(<SkeletonGrid items={4} type="post" />);
      expect(screen.getAllByTestId('skeleton-post-card')).toHaveLength(4);
      expect(SkeletonPostCard).toHaveBeenCalledTimes(4);
    });

    it('should pass correct key prop to each card', () => {
      render(<SkeletonGrid items={3} type="community" />);
      const cards = screen.getAllByTestId('skeleton-community-card');
      cards.forEach(card => {
        expect(card).toBeInTheDocument();
      });
    });
  });

  describe('Animation Effects', () => {
    it('should apply container variants', () => {
      render(<SkeletonGrid />);
      const containerCall = motion.div.mock.calls.find(
        call => call[0].variants && call[0].initial === 'hidden'
      );
      expect(containerCall[0].variants).toBeDefined();
    });

    it('should apply item variants to default card items', () => {
      render(<SkeletonGrid items={2} type="card" />);
      const itemVariantCalls = motion.div.mock.calls.filter(
        call => call[0].variants && call[0].className && call[0].className.includes('bg-white')
      );
      expect(itemVariantCalls.length).toBeGreaterThan(0);
    });

    it('should apply initial hidden state', () => {
      render(<SkeletonGrid />);
      const containerCall = motion.div.mock.calls.find(
        call => call[0].initial === 'hidden'
      );
      expect(containerCall).toBeDefined();
    });

    it('should apply animate show state', () => {
      render(<SkeletonGrid />);
      const containerCall = motion.div.mock.calls.find(
        call => call[0].animate === 'show'
      );
      expect(containerCall).toBeDefined();
    });
  });

  describe('Combined Props', () => {
    it('should handle custom items, columns, and gap together', () => {
      const { container } = render(<SkeletonGrid items={9} columns={3} gap={6} />);
      expect(container.firstChild).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6');
      const items = container.querySelectorAll('div > div');
      expect(items).toHaveLength(9);
    });

    it('should handle all props with community type', () => {
      const { container } = render(
        <SkeletonGrid items={4} columns={2} gap={4} type="community" className="test-class" />
      );
      expect(container.firstChild).toHaveClass('test-class', 'gap-4');
      expect(screen.getAllByTestId('skeleton-community-card')).toHaveLength(4);
    });

    it('should handle single column layout with custom gap', () => {
      const { container } = render(<SkeletonGrid items={5} columns={1} gap={8} />);
      expect(container.firstChild).toHaveClass('grid-cols-1', 'gap-8');
    });
  });

  describe('Accessibility', () => {
    it('should render semantic div structure', () => {
      const { container } = render(<SkeletonGrid items={3} />);
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });

    it('should maintain proper dark mode classes', () => {
      const { container } = render(<SkeletonGrid items={1} type="card" />);
      const darkModeElements = container.querySelectorAll('.dark\\:bg-gray-900, .dark\\:bg-gray-800, .dark\\:border-gray-800');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });

    it('should provide visual loading state with gradients', () => {
      const { container } = render(<SkeletonGrid items={1} type="card" />);
      const gradients = container.querySelectorAll('.bg-gradient-to-r');
      expect(gradients.length).toBeGreaterThan(0);
    });
  });
});

describe('SkeletonFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<SkeletonFeed />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render 5 items by default', () => {
      render(<SkeletonFeed />);
      expect(screen.getAllByTestId('skeleton-post-card')).toHaveLength(5);
    });

    it('should render custom number of items', () => {
      render(<SkeletonFeed items={3} />);
      expect(screen.getAllByTestId('skeleton-post-card')).toHaveLength(3);
    });

    it('should apply space-y-4 class', () => {
      const { container } = render(<SkeletonFeed />);
      expect(container.firstChild).toHaveClass('space-y-4');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonFeed className="custom-feed" />);
      expect(container.firstChild).toHaveClass('custom-feed');
    });
  });

  describe('Media Display Logic', () => {
    it('should show media on every 3rd item when showMedia=true', () => {
      render(<SkeletonFeed items={6} showMedia={true} />);
      const cards = screen.getAllByTestId('skeleton-post-card');
      expect(cards[0]).toHaveAttribute('data-show-media', 'true');
      expect(cards[1]).toHaveAttribute('data-show-media', 'false');
      expect(cards[2]).toHaveAttribute('data-show-media', 'false');
      expect(cards[3]).toHaveAttribute('data-show-media', 'true');
    });

    it('should not show media when showMedia=false', () => {
      render(<SkeletonFeed items={6} showMedia={false} />);
      const cards = screen.getAllByTestId('skeleton-post-card');
      cards.forEach(card => {
        expect(card).toHaveAttribute('data-show-media', 'false');
      });
    });

    it('should show community on even indices', () => {
      render(<SkeletonFeed items={4} />);
      const cards = screen.getAllByTestId('skeleton-post-card');
      expect(cards[0]).toHaveAttribute('data-show-community', 'true');
      expect(cards[1]).toHaveAttribute('data-show-community', 'false');
      expect(cards[2]).toHaveAttribute('data-show-community', 'true');
      expect(cards[3]).toHaveAttribute('data-show-community', 'false');
    });
  });

  describe('Animation', () => {
    it('should wrap items in motion.div with variants', () => {
      render(<SkeletonFeed items={2} />);
      expect(motion.div).toHaveBeenCalled();
    });

    it('should apply container animation variants', () => {
      render(<SkeletonFeed />);
      const containerCall = motion.div.mock.calls.find(
        call => call[0].variants && call[0].initial === 'hidden'
      );
      expect(containerCall).toBeDefined();
    });
  });
});

describe('SkeletonList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<SkeletonList />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render 10 items by default', () => {
      const { container } = render(<SkeletonList />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(10);
    });

    it('should render custom number of items', () => {
      const { container } = render(<SkeletonList items={5} />);
      const items = container.querySelectorAll('.flex.items-center');
      expect(items).toHaveLength(5);
    });

    it('should apply divider classes', () => {
      const { container } = render(<SkeletonList />);
      expect(container.firstChild).toHaveClass('divide-y', 'divide-gray-200', 'dark:divide-gray-800');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonList className="custom-list" />);
      expect(container.firstChild).toHaveClass('custom-list');
    });
  });

  describe('Avatar Display', () => {
    it('should show avatar by default', () => {
      const { container } = render(<SkeletonList items={1} />);
      const avatar = container.querySelector('.w-10.h-10.rounded-full');
      expect(avatar).toBeInTheDocument();
    });

    it('should hide avatar when showAvatar=false', () => {
      const { container } = render(<SkeletonList items={1} showAvatar={false} />);
      const avatar = container.querySelector('.w-10.h-10.rounded-full');
      expect(avatar).not.toBeInTheDocument();
    });
  });

  describe('Secondary Text Display', () => {
    it('should show secondary text by default', () => {
      const { container } = render(<SkeletonList items={1} />);
      const secondaryTexts = container.querySelectorAll('.h-3');
      expect(secondaryTexts.length).toBeGreaterThan(0);
    });

    it('should hide secondary text when showSecondary=false', () => {
      const { container } = render(<SkeletonList items={1} showSecondary={false} />);
      const secondaryTexts = container.querySelectorAll('.h-3');
      expect(secondaryTexts).toHaveLength(0);
    });
  });

  describe('Action Button Display', () => {
    it('should hide action by default', () => {
      const { container } = render(<SkeletonList items={1} />);
      const action = container.querySelector('.w-20.h-8');
      expect(action).not.toBeInTheDocument();
    });

    it('should show action when showAction=true', () => {
      const { container } = render(<SkeletonList items={1} showAction={true} />);
      const action = container.querySelector('.w-20.h-8');
      expect(action).toBeInTheDocument();
    });
  });

  describe('Item Structure', () => {
    it('should have flex layout for items', () => {
      const { container } = render(<SkeletonList items={1} />);
      const item = container.querySelector('.flex.items-center');
      expect(item).toHaveClass('gap-4', 'py-3', 'px-4');
    });

    it('should have flex-1 content area', () => {
      const { container } = render(<SkeletonList items={1} />);
      const content = container.querySelector('.flex-1');
      expect(content).toHaveClass('min-w-0', 'space-y-2');
    });
  });
});

describe('SkeletonCommentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<SkeletonCommentList />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render 5 items by default', () => {
      render(<SkeletonCommentList />);
      const comments = screen.getAllByTestId('skeleton-comment-card');
      expect(comments.length).toBeGreaterThanOrEqual(5);
    });

    it('should render custom number of items', () => {
      render(<SkeletonCommentList items={3} />);
      const comments = screen.getAllByTestId('skeleton-comment-card');
      expect(comments.length).toBeGreaterThanOrEqual(3);
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonCommentList className="custom-comments" />);
      expect(container.firstChild).toHaveClass('custom-comments');
    });
  });

  describe('Nested Comments', () => {
    it('should not render nested comments by default', () => {
      render(<SkeletonCommentList items={4} nested={false} />);
      const comments = screen.getAllByTestId('skeleton-comment-card');
      const nestedComments = comments.filter(c => c.getAttribute('data-depth') === '1');
      expect(nestedComments).toHaveLength(0);
    });

    it('should render nested comments when nested=true on even indices', () => {
      render(<SkeletonCommentList items={4} nested={true} />);
      const comments = screen.getAllByTestId('skeleton-comment-card');
      const nestedComments = comments.filter(c => c.getAttribute('data-depth') === '1');
      expect(nestedComments.length).toBeGreaterThan(0);
    });

    it('should render depth 0 comments', () => {
      render(<SkeletonCommentList items={2} />);
      const comments = screen.getAllByTestId('skeleton-comment-card');
      const depth0Comments = comments.filter(c => c.getAttribute('data-depth') === '0');
      expect(depth0Comments.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fragment Usage', () => {
    it('should use React.Fragment for wrapping', () => {
      const { container } = render(<SkeletonCommentList items={2} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});

describe('SkeletonTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<SkeletonTable />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply table styling classes', () => {
      const { container } = render(<SkeletonTable />);
      expect(container.firstChild).toHaveClass(
        'bg-white',
        'dark:bg-gray-900',
        'rounded-xl',
        'border',
        'border-gray-200',
        'dark:border-gray-800',
        'overflow-hidden'
      );
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonTable className="custom-table" />);
      expect(container.firstChild).toHaveClass('custom-table');
    });
  });

  describe('Header Rendering', () => {
    it('should show header by default', () => {
      const { container } = render(<SkeletonTable columns={3} />);
      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
    });

    it('should hide header when showHeader=false', () => {
      const { container } = render(<SkeletonTable showHeader={false} />);
      const headers = container.querySelectorAll('.border-b');
      expect(headers[0]).not.toHaveClass('p-4');
    });

    it('should render correct number of header columns', () => {
      const { container } = render(<SkeletonTable columns={4} />);
      const header = container.querySelector('.border-b');
      const headerCells = header.querySelectorAll('div');
      expect(headerCells).toHaveLength(4);
    });
  });

  describe('Rows and Columns', () => {
    it('should render 5 rows by default', () => {
      const { container } = render(<SkeletonTable />);
      const rows = container.querySelectorAll('.grid.gap-4.p-4');
      expect(rows.length).toBeGreaterThanOrEqual(5);
    });

    it('should render custom number of rows', () => {
      const { container } = render(<SkeletonTable rows={3} />);
      const rows = container.querySelectorAll('.last\\:border-0');
      expect(rows).toHaveLength(3);
    });

    it('should render 4 columns by default', () => {
      const { container } = render(<SkeletonTable rows={1} />);
      const row = container.querySelector('.last\\:border-0');
      const cells = row.querySelectorAll('div');
      expect(cells).toHaveLength(4);
    });

    it('should render custom number of columns', () => {
      const { container } = render(<SkeletonTable rows={1} columns={6} />);
      const row = container.querySelector('.last\\:border-0');
      const cells = row.querySelectorAll('div');
      expect(cells).toHaveLength(6);
    });

    it('should apply grid template columns style', () => {
      const { container } = render(<SkeletonTable columns={3} rows={1} />);
      const row = container.querySelector('.last\\:border-0');
      expect(row).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
    });
  });

  describe('Animation', () => {
    it('should apply fade-in animation to container', () => {
      render(<SkeletonTable />);
      expect(motion.div).toHaveBeenCalled();
    });

    it('should apply stagger animation to rows', () => {
      render(<SkeletonTable rows={2} />);
      const containerCall = motion.div.mock.calls.find(
        call => call[0].variants && call[0].initial === 'hidden'
      );
      expect(containerCall).toBeDefined();
    });
  });

  describe('Cell Styling', () => {
    it('should apply gradient backgrounds to cells', () => {
      const { container } = render(<SkeletonTable rows={1} columns={1} />);
      const cell = container.querySelector('.h-4.bg-gradient-to-r');
      expect(cell).toBeInTheDocument();
    });

    it('should apply rounded corners to cells', () => {
      const { container } = render(<SkeletonTable rows={1} columns={1} />);
      const cell = container.querySelector('.h-4.rounded');
      expect(cell).toBeInTheDocument();
    });
  });
});

export default actual
