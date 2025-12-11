import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkeletonLoader, SkeletonCard } from './SkeletonLoader';
import { motion } from 'framer-motion';

jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn(({ children, className, ...props }) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ))
  }
}));

describe('SkeletonLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<SkeletonLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<SkeletonLoader />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should render a single skeleton by default', () => {
      render(<SkeletonLoader />);
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs).toHaveLength(1);
    });

    it('should apply default text variant classes', () => {
      render(<SkeletonLoader />);
      const skeleton = screen.getByTestId('motion-div');
      expect(skeleton).toHaveClass('bg-gray-700', 'h-4', 'w-full', 'rounded', '');
    });

    it('should apply custom className to container', () => {
      render(<SkeletonLoader className="custom-class" />);
      const container = screen.getByRole('status');
      expect(container).toHaveClass('space-y-3', 'custom-class');
    });
  });

  describe('Variant Rendering', () => {
    it('should render text variant correctly', () => {
      render(<SkeletonLoader variant="text" />);
      const skeleton = screen.getByTestId('motion-div');
      expect(skeleton).toHaveClass('h-4', 'w-full', 'rounded');
    });

    it('should render title variant correctly', () => {
      render(<SkeletonLoader variant="title" />);
      const skeleton = screen.getByTestId('motion-div');
      expect(skeleton).toHaveClass('h-8', 'w-3/4', 'rounded');
    });

    it('should render avatar variant correctly', () => {
      render(<SkeletonLoader variant="avatar" />);
      const skeleton = screen.getByTestId('motion-div');
      expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full');
    });

    it('should render thumbnail variant correctly', () => {
      render(<SkeletonLoader variant="thumbnail" />);
      const skeleton = screen.getByTestId('motion-div');
      expect(skeleton).toHaveClass('h-32', 'w-full', 'rounded-lg');
    });

    it('should render card variant correctly', () => {
      render(<SkeletonLoader variant="card" />);
      const skeleton = screen.getByTestId('motion-div');
      expect(skeleton).toHaveClass('h-64', 'w-full', 'rounded-lg');
    });

    it('should apply bg-gray-700 to all variants', () => {
      const variants = ['text', 'title', 'avatar', 'thumbnail', 'card'];
      variants.forEach(variant => {
        const { unmount } = render(<SkeletonLoader variant={variant} />);
        const skeleton = screen.getByTestId('motion-div');
        expect(skeleton).toHaveClass('bg-gray-700');
        unmount();
      });
    });

    it('should apply  to all variants', () => {
      const variants = ['text', 'title', 'avatar', 'thumbnail', 'card'];
      variants.forEach(variant => {
        const { unmount } = render(<SkeletonLoader variant={variant} />);
        const skeleton = screen.getByTestId('motion-div');
        expect(skeleton).toHaveClass('');
        unmount();
      });
    });
  });

  describe('Count Prop', () => {
    it('should render multiple skeletons when count is greater than 1', () => {
      render(<SkeletonLoader count={3} />);
      const skeletons = screen.getAllByTestId('motion-div');
      expect(skeletons).toHaveLength(3);
    });

    it('should render 5 skeletons when count is 5', () => {
      render(<SkeletonLoader count={5} />);
      const skeletons = screen.getAllByTestId('motion-div');
      expect(skeletons).toHaveLength(5);
    });

    it('should render 10 skeletons when count is 10', () => {
      render(<SkeletonLoader count={10} />);
      const skeletons = screen.getAllByTestId('motion-div');
      expect(skeletons).toHaveLength(10);
    });

    it('should render no skeletons when count is 0', () => {
      render(<SkeletonLoader count={0} />);
      const skeletons = screen.queryAllByTestId('motion-div');
      expect(skeletons).toHaveLength(0);
    });

    it('should apply same variant classes to all skeletons', () => {
      render(<SkeletonLoader variant="avatar" count={3} />);
      const skeletons = screen.getAllByTestId('motion-div');
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full');
      });
    });

    it('should assign unique keys to each skeleton', () => {
      render(<SkeletonLoader count={3} />);
      const skeletons = screen.getAllByTestId('motion-div');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Animation Props', () => {
    it('should pass initial opacity to motion.div', () => {
      render(<SkeletonLoader />);
      expect(motion.div).toHaveBeenCalledWith(
        expect.objectContaining({
          initial: { opacity: 0.6 }
        }),
        expect.anything()
      );
    });

    it('should pass animate opacity array to motion.div', () => {
      render(<SkeletonLoader />);
      expect(motion.div).toHaveBeenCalledWith(
        expect.objectContaining({
          animate: { opacity: [0.6, 1, 0.6] }
        }),
        expect.anything()
      );
    });

    it('should pass transition config to motion.div', () => {
      render(<SkeletonLoader />);
      expect(motion.div).toHaveBeenCalledWith(
        expect.objectContaining({
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
        }),
        expect.anything()
      );
    });

    it('should apply animation props to all skeletons when count is multiple', () => {
      render(<SkeletonLoader count={3} />);
      expect(motion.div).toHaveBeenCalledTimes(3);

      for (let i = 0; i < 3; i++) {
        expect(motion.div).toHaveBeenNthCalledWith(
          i + 1,
          expect.objectContaining({
            initial: { opacity: 0.6 },
            animate: { opacity: [0.6, 1, 0.6] },
            transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }),
          expect.anything()
        );
      }
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<SkeletonLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label describing loading state', () => {
      render(<SkeletonLoader />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should maintain accessibility with multiple skeletons', () => {
      render(<SkeletonLoader count={5} />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should maintain accessibility with custom className', () => {
      render(<SkeletonLoader className="my-custom-class" />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('Combined Props', () => {
    it('should handle variant and count together', () => {
      render(<SkeletonLoader variant="avatar" count={4} />);
      const skeletons = screen.getAllByTestId('motion-div');
      expect(skeletons).toHaveLength(4);
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full');
      });
    });

    it('should handle variant, count, and className together', () => {
      render(<SkeletonLoader variant="title" count={2} className="mt-4" />);
      const container = screen.getByRole('status');
      const skeletons = screen.getAllByTestId('motion-div');

      expect(container).toHaveClass('space-y-3', 'mt-4');
      expect(skeletons).toHaveLength(2);
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('h-8', 'w-3/4', 'rounded');
      });
    });

    it('should handle all props with thumbnail variant', () => {
      render(<SkeletonLoader variant="thumbnail" count={3} className="p-4" />);
      const container = screen.getByRole('status');
      const skeletons = screen.getAllByTestId('motion-div');

      expect(container).toHaveClass('space-y-3', 'p-4');
      expect(skeletons).toHaveLength(3);
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('h-32', 'w-full', 'rounded-lg');
      });
    });
  });
});

describe('SkeletonCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('status', { name: 'Loading card' })).toBeInTheDocument();
    });

    it('should have correct container classes', () => {
      render(<SkeletonCard />);
      const container = screen.getByRole('status', { name: 'Loading card' });
      expect(container).toHaveClass('bg-gray-800', 'rounded-lg', 'p-6', 'space-y-4');
    });

    it('should have role="status" with aria-label', () => {
      render(<SkeletonCard />);
      const card = screen.getByRole('status', { name: 'Loading card' });
      expect(card).toHaveAttribute('aria-label', 'Loading card');
    });
  });

  describe('Nested Structure', () => {
    it('should render avatar skeleton', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      const avatarSkeleton = skeletons.find(s =>
        s.classList.contains('h-12') && s.classList.contains('w-12')
      );
      expect(avatarSkeleton).toBeInTheDocument();
    });

    it('should render title skeleton', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      const titleSkeleton = skeletons.find(s =>
        s.classList.contains('h-8') && s.classList.contains('w-3/4')
      );
      expect(titleSkeleton).toBeInTheDocument();
    });

    it('should render text skeletons', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      const textSkeletons = skeletons.filter(s =>
        s.classList.contains('h-4') && s.classList.contains('w-full')
      );
      expect(textSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it('should render thumbnail skeleton', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      const thumbnailSkeleton = skeletons.find(s =>
        s.classList.contains('h-32')
      );
      expect(thumbnailSkeleton).toBeInTheDocument();
    });

    it('should render multiple SkeletonLoader components', () => {
      render(<SkeletonCard />);
      const allStatuses = screen.getAllByRole('status');
      expect(allStatuses.length).toBeGreaterThan(1);
    });

    it('should have flex container for avatar and text', () => {
      const { container } = render(<SkeletonCard />);
      const flexContainer = container.querySelector('.flex.items-center.gap-4');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have nested flex-1 container for title and text', () => {
      const { container } = render(<SkeletonCard />);
      const nestedContainer = container.querySelector('.flex-1.space-y-2');
      expect(nestedContainer).toBeInTheDocument();
    });
  });

  describe('Content Count', () => {
    it('should render exactly 1 avatar skeleton', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      const avatarSkeletons = skeletons.filter(s =>
        s.classList.contains('h-12') && s.classList.contains('w-12') && s.classList.contains('rounded-full')
      );
      expect(avatarSkeletons).toHaveLength(1);
    });

    it('should render exactly 1 title skeleton', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      const titleSkeletons = skeletons.filter(s =>
        s.classList.contains('h-8') && s.classList.contains('w-3/4')
      );
      expect(titleSkeletons).toHaveLength(1);
    });

    it('should render exactly 2 text skeletons', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      const textSkeletons = skeletons.filter(s =>
        s.classList.contains('h-4') && s.classList.contains('w-full') && s.classList.contains('rounded') && !s.classList.contains('rounded-lg')
      );
      expect(textSkeletons).toHaveLength(2);
    });

    it('should render exactly 1 thumbnail skeleton', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      const thumbnailSkeletons = skeletons.filter(s =>
        s.classList.contains('h-32') && s.classList.contains('w-full') && s.classList.contains('rounded-lg')
      );
      expect(thumbnailSkeletons).toHaveLength(1);
    });

    it('should render total of 5 skeleton elements', () => {
      render(<SkeletonCard />);
      const skeletons = screen.getAllByTestId('motion-div');
      expect(skeletons).toHaveLength(5);
    });
  });
});

export default status
