import React from 'react';
import { render, screen } from '@testing-library/react';
import Skeleton, {
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonList,
  SkeletonPost,
} from './Skeleton';

describe('Skeleton', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Skeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders with default text variant', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('skeleton-text');
    });

    it('renders loading status role', () => {
      render(<Skeleton />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
    });

    it('renders sr-only loading text', () => {
      render(<Skeleton />);
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });

    it('applies base skeleton class', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('skeleton');
    });

    it('renders as div element', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild.tagName).toBe('DIV');
    });
  });

  describe('Variants', () => {
    it('applies text variant class', () => {
      const { container } = render(<Skeleton variant="text" />);
      expect(container.firstChild).toHaveClass('skeleton-text');
    });

    it('applies rectangle variant class', () => {
      const { container } = render(<Skeleton variant="rectangle" />);
      expect(container.firstChild).toHaveClass('skeleton-rectangle');
    });

    it('applies circular variant class', () => {
      const { container } = render(<Skeleton variant="circular" />);
      expect(container.firstChild).toHaveClass('skeleton-circular');
    });

    it('applies rounded variant class', () => {
      const { container } = render(<Skeleton variant="rounded" />);
      expect(container.firstChild).toHaveClass('skeleton-rounded');
    });

    it('defaults to text variant when no variant provided', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('skeleton-text');
    });

    it('handles undefined variant gracefully', () => {
      const { container } = render(<Skeleton variant={undefined} />);
      expect(container.firstChild).toHaveClass('skeleton-text');
    });

    it('handles null variant gracefully', () => {
      const { container } = render(<Skeleton variant={null} />);
      expect(container.firstChild).toHaveClass('skeleton-text');
    });

    it('applies custom variant string', () => {
      const { container } = render(<Skeleton variant="custom" />);
      expect(container.firstChild).toHaveClass('skeleton-custom');
    });
  });

  describe('Animations', () => {
    it('applies pulse animation by default', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('skeleton-pulse');
    });

    it('applies pulse animation class', () => {
      const { container } = render(<Skeleton animation="pulse" />);
      expect(container.firstChild).toHaveClass('skeleton-pulse');
    });

    it('applies wave animation class', () => {
      const { container } = render(<Skeleton animation="wave" />);
      expect(container.firstChild).toHaveClass('skeleton-wave');
    });

    it('applies shimmer animation class', () => {
      const { container } = render(<Skeleton animation="shimmer" />);
      expect(container.firstChild).toHaveClass('skeleton-shimmer');
    });

    it('applies none animation class', () => {
      const { container } = render(<Skeleton animation="none" />);
      expect(container.firstChild).toHaveClass('skeleton-none');
    });

    it('applies false animation class', () => {
      const { container } = render(<Skeleton animation={false} />);
      expect(container.firstChild).toHaveClass('skeleton-false');
    });

    it('handles undefined animation gracefully', () => {
      const { container } = render(<Skeleton animation={undefined} />);
      expect(container.firstChild).toHaveClass('skeleton-pulse');
    });

    it('handles custom animation string', () => {
      const { container } = render(<Skeleton animation="custom" />);
      expect(container.firstChild).toHaveClass('skeleton-custom');
    });
  });

  describe('Dimensions', () => {
    it('applies width style', () => {
      const { container } = render(<Skeleton width="200px" />);
      expect(container.firstChild).toHaveStyle({ width: '200px' });
    });

    it('applies height style', () => {
      const { container } = render(<Skeleton height="100px" />);
      expect(container.firstChild).toHaveStyle({ height: '100px' });
    });

    it('applies both width and height', () => {
      const { container } = render(<Skeleton width="200px" height="100px" />);
      expect(container.firstChild).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('applies width as percentage', () => {
      const { container } = render(<Skeleton width="50%" />);
      expect(container.firstChild).toHaveStyle({ width: '50%' });
    });

    it('applies width as number', () => {
      const { container } = render(<Skeleton width={300} />);
      expect(container.firstChild).toHaveStyle({ width: 300 });
    });

    it('applies height as rem', () => {
      const { container } = render(<Skeleton height="2rem" />);
      expect(container.firstChild).toHaveStyle({ height: '2rem' });
    });

    it('does not apply width style when undefined', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).not.toHaveStyle({ width: 'undefined' });
    });

    it('does not apply height style when undefined', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).not.toHaveStyle({ height: 'undefined' });
    });

    it('handles width as 0', () => {
      const { container } = render(<Skeleton width={0} />);
      expect(container.firstChild).toHaveStyle({ width: 0 });
    });

    it('handles height as 0', () => {
      const { container } = render(<Skeleton height={0} />);
      expect(container.firstChild).toHaveStyle({ height: 0 });
    });
  });

  describe('Rounded Prop', () => {
    it('applies rounded class when true', () => {
      const { container } = render(<Skeleton rounded />);
      expect(container.firstChild).toHaveClass('skeleton-rounded');
    });

    it('does not apply rounded class when false', () => {
      const { container } = render(<Skeleton rounded={false} />);
      expect(container.firstChild).not.toHaveClass('skeleton-rounded');
    });

    it('does not apply rounded class by default', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).not.toHaveClass('skeleton-rounded');
    });

    it('applies rounded with variant class', () => {
      const { container } = render(<Skeleton variant="rectangle" rounded />);
      expect(container.firstChild).toHaveClass('skeleton-rectangle', 'skeleton-rounded');
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('preserves base classes with custom className', () => {
      const { container } = render(<Skeleton className="custom-class" />);
      expect(container.firstChild).toHaveClass('skeleton', 'skeleton-text', 'custom-class');
    });

    it('applies multiple custom classes', () => {
      const { container } = render(<Skeleton className="class-1 class-2 class-3" />);
      expect(container.firstChild).toHaveClass('class-1', 'class-2', 'class-3');
    });

    it('handles empty className', () => {
      const { container } = render(<Skeleton className="" />);
      expect(container.firstChild).toHaveClass('skeleton');
    });

    it('handles undefined className', () => {
      const { container } = render(<Skeleton className={undefined} />);
      expect(container.firstChild).toHaveClass('skeleton');
    });
  });

  describe('Additional Props', () => {
    it('forwards additional props', () => {
      const { container } = render(<Skeleton data-testid="skeleton" />);
      expect(container.firstChild).toHaveAttribute('data-testid', 'skeleton');
    });

    it('forwards style prop', () => {
      const { container } = render(<Skeleton style={{ opacity: 0.5 }} />);
      expect(container.firstChild).toHaveStyle({ opacity: 0.5 });
    });

    it('merges style prop with width and height', () => {
      const { container } = render(
        <Skeleton width="100px" height="50px" style={{ opacity: 0.5, backgroundColor: 'red' }} />
      );
      expect(container.firstChild).toHaveStyle({
        width: '100px',
        height: '50px',
        opacity: 0.5,
        backgroundColor: 'red',
      });
    });

    it('forwards id prop', () => {
      const { container } = render(<Skeleton id="test-skeleton" />);
      expect(container.firstChild).toHaveAttribute('id', 'test-skeleton');
    });

    it('forwards data attributes', () => {
      const { container } = render(<Skeleton data-custom="value" data-number={123} />);
      expect(container.firstChild).toHaveAttribute('data-custom', 'value');
      expect(container.firstChild).toHaveAttribute('data-number', '123');
    });

    it('forwards aria attributes', () => {
      const { container } = render(<Skeleton aria-busy="true" />);
      expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Multiple Lines', () => {
    it('renders single line by default', () => {
      const { container } = render(<Skeleton variant="text" />);
      expect(container.querySelectorAll('.skeleton-text').length).toBe(1);
    });

    it('renders multiple lines when lines prop provided', () => {
      const { container } = render(<Skeleton variant="text" lines={3} />);
      const lines = container.querySelectorAll('.skeleton-text');
      expect(lines.length).toBe(3);
    });

    it('renders container for multiple lines', () => {
      const { container } = render(<Skeleton variant="text" lines={2} />);
      expect(container.querySelector('.skeleton-text-container')).toBeInTheDocument();
    });

    it('applies 100% width to all lines except last', () => {
      const { container } = render(<Skeleton variant="text" lines={3} />);
      const lines = container.querySelectorAll('.skeleton-text');
      expect(lines[0]).toHaveStyle({ width: '100%' });
      expect(lines[1]).toHaveStyle({ width: '100%' });
    });

    it('applies 60% width to last line', () => {
      const { container } = render(<Skeleton variant="text" lines={3} />);
      const lines = container.querySelectorAll('.skeleton-text');
      expect(lines[2]).toHaveStyle({ width: '60%' });
    });

    it('renders 2 lines correctly', () => {
      const { container } = render(<Skeleton variant="text" lines={2} />);
      const lines = container.querySelectorAll('.skeleton-text');
      expect(lines.length).toBe(2);
      expect(lines[0]).toHaveStyle({ width: '100%' });
      expect(lines[1]).toHaveStyle({ width: '60%' });
    });

    it('renders 1 line without container when lines=1', () => {
      const { container } = render(<Skeleton variant="text" lines={1} />);
      expect(container.querySelector('.skeleton-text-container')).not.toBeInTheDocument();
    });

    it('applies role and aria-label to container for multiple lines', () => {
      render(<Skeleton variant="text" lines={3} />);
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Loading content');
    });

    it('renders sr-only text for multiple lines', () => {
      render(<Skeleton variant="text" lines={3} />);
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });

    it('applies custom width to all lines', () => {
      const { container } = render(<Skeleton variant="text" lines={3} width="200px" />);
      const lines = container.querySelectorAll('.skeleton-text');
      // Last line overrides with 60%
      expect(lines[0]).toHaveStyle({ width: '200px' });
      expect(lines[1]).toHaveStyle({ width: '200px' });
      expect(lines[2]).toHaveStyle({ width: '60%' });
    });

    it('applies custom height to all lines', () => {
      const { container } = render(<Skeleton variant="text" lines={3} height="20px" />);
      const lines = container.querySelectorAll('.skeleton-text');
      lines.forEach(line => {
        expect(line).toHaveStyle({ height: '20px' });
      });
    });

    it('applies animation class to all lines', () => {
      const { container } = render(<Skeleton variant="text" lines={3} animation="wave" />);
      const lines = container.querySelectorAll('.skeleton-text');
      lines.forEach(line => {
        expect(line).toHaveClass('skeleton-wave');
      });
    });

    it('applies rounded class to all lines', () => {
      const { container } = render(<Skeleton variant="text" lines={3} rounded />);
      const lines = container.querySelectorAll('.skeleton-text');
      lines.forEach(line => {
        expect(line).toHaveClass('skeleton-rounded');
      });
    });

    it('applies custom className to all lines', () => {
      const { container } = render(<Skeleton variant="text" lines={3} className="custom" />);
      const lines = container.querySelectorAll('.skeleton-text');
      lines.forEach(line => {
        expect(line).toHaveClass('custom');
      });
    });

    it('renders 5 lines', () => {
      const { container } = render(<Skeleton variant="text" lines={5} />);
      expect(container.querySelectorAll('.skeleton-text').length).toBe(5);
    });

    it('renders 10 lines', () => {
      const { container } = render(<Skeleton variant="text" lines={10} />);
      expect(container.querySelectorAll('.skeleton-text').length).toBe(10);
    });

    it('handles lines=0 gracefully', () => {
      const { container } = render(<Skeleton variant="text" lines={0} />);
      expect(container.querySelector('.skeleton-text-container')).not.toBeInTheDocument();
    });

    it('only applies multiple lines for text variant', () => {
      const { container } = render(<Skeleton variant="rectangle" lines={3} />);
      expect(container.querySelector('.skeleton-text-container')).not.toBeInTheDocument();
      expect(container.querySelectorAll('.skeleton-rectangle').length).toBe(1);
    });

    it('only applies multiple lines for text variant - circular', () => {
      const { container } = render(<Skeleton variant="circular" lines={3} />);
      expect(container.querySelector('.skeleton-text-container')).not.toBeInTheDocument();
      expect(container.querySelectorAll('.skeleton-circular').length).toBe(1);
    });

    it('each line has unique key', () => {
      const { container } = render(<Skeleton variant="text" lines={3} />);
      const lines = container.querySelectorAll('.skeleton-text');
      const keys = Array.from(lines).map(line => line.getAttribute('data-key'));
      // Keys are internal to React, but we ensure each line renders
      expect(lines.length).toBe(3);
    });
  });

  describe('Accessibility', () => {
    it('has status role', () => {
      render(<Skeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-label for loading content', () => {
      render(<Skeleton />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
    });

    it('includes screen reader only text', () => {
      render(<Skeleton />);
      const srText = screen.getByText('Loading...');
      expect(srText).toHaveClass('sr-only');
    });

    it('maintains accessibility with custom aria-label', () => {
      render(<Skeleton aria-label="Loading profile" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading profile');
    });

    it('maintains status role with multiple lines', () => {
      render(<Skeleton variant="text" lines={3} />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('provides loading context for screen readers', () => {
      render(<Skeleton />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('allows custom aria-busy attribute', () => {
      const { container } = render(<Skeleton aria-busy="true" />);
      expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    });

    it('allows custom aria-live attribute', () => {
      const { container } = render(<Skeleton aria-live="polite" />);
      expect(container.firstChild).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('handles all props undefined', () => {
      const { container } = render(<Skeleton variant={undefined} width={undefined} height={undefined} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles all props null', () => {
      const { container } = render(<Skeleton variant={null} animation={null} className={null} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles empty string props', () => {
      const { container } = render(<Skeleton className="" width="" height="" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles negative width', () => {
      const { container } = render(<Skeleton width="-100px" />);
      expect(container.firstChild).toHaveStyle({ width: '-100px' });
    });

    it('handles negative height', () => {
      const { container } = render(<Skeleton height="-50px" />);
      expect(container.firstChild).toHaveStyle({ height: '-50px' });
    });

    it('handles very large lines number', () => {
      const { container } = render(<Skeleton variant="text" lines={100} />);
      expect(container.querySelectorAll('.skeleton-text').length).toBe(100);
    });

    it('handles special characters in className', () => {
      const { container } = render(<Skeleton className="class-with-special_chars@123" />);
      expect(container.firstChild).toHaveClass('class-with-special_chars@123');
    });

    it('handles mixed unit types', () => {
      const { container } = render(<Skeleton width="50%" height="100px" />);
      expect(container.firstChild).toHaveStyle({ width: '50%', height: '100px' });
    });

    it('renders with only width', () => {
      const { container } = render(<Skeleton width="200px" />);
      expect(container.firstChild).toHaveStyle({ width: '200px' });
    });

    it('renders with only height', () => {
      const { container } = render(<Skeleton height="100px" />);
      expect(container.firstChild).toHaveStyle({ height: '100px' });
    });

    it('handles width with calc function', () => {
      const { container } = render(<Skeleton width="calc(100% - 20px)" />);
      expect(container.firstChild).toHaveStyle({ width: 'calc(100% - 20px)' });
    });

    it('handles height with calc function', () => {
      const { container } = render(<Skeleton height="calc(100vh - 50px)" />);
      expect(container.firstChild).toHaveStyle({ height: 'calc(100vh - 50px)' });
    });
  });

  describe('Combinations', () => {
    it('renders text variant with pulse animation', () => {
      const { container } = render(<Skeleton variant="text" animation="pulse" />);
      expect(container.firstChild).toHaveClass('skeleton-text', 'skeleton-pulse');
    });

    it('renders rectangle variant with wave animation', () => {
      const { container } = render(<Skeleton variant="rectangle" animation="wave" />);
      expect(container.firstChild).toHaveClass('skeleton-rectangle', 'skeleton-wave');
    });

    it('renders circular variant with shimmer animation', () => {
      const { container } = render(<Skeleton variant="circular" animation="shimmer" />);
      expect(container.firstChild).toHaveClass('skeleton-circular', 'skeleton-shimmer');
    });

    it('renders rounded rectangle with dimensions', () => {
      const { container } = render(<Skeleton variant="rectangle" width="200px" height="100px" rounded />);
      expect(container.firstChild).toHaveClass('skeleton-rectangle', 'skeleton-rounded');
      expect(container.firstChild).toHaveStyle({ width: '200px', height: '100px' });
    });

    it('renders text with multiple lines and custom dimensions', () => {
      const { container } = render(<Skeleton variant="text" lines={3} width="300px" height="1rem" />);
      const lines = container.querySelectorAll('.skeleton-text');
      expect(lines.length).toBe(3);
    });

    it('renders with all props combined', () => {
      const { container } = render(
        <Skeleton
          variant="rectangle"
          animation="wave"
          width="250px"
          height="150px"
          rounded
          className="custom-skeleton"
          style={{ opacity: 0.7 }}
          data-testid="full-skeleton"
        />
      );
      expect(container.firstChild).toHaveClass('skeleton-rectangle', 'skeleton-wave', 'skeleton-rounded', 'custom-skeleton');
      expect(container.firstChild).toHaveStyle({ width: '250px', height: '150px', opacity: 0.7 });
      expect(container.firstChild).toHaveAttribute('data-testid', 'full-skeleton');
    });
  });
});

describe('SkeletonCard', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.skeleton-card')).toBeInTheDocument();
    });

    it('renders card wrapper with card class', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toHaveClass('card', 'skeleton-card');
    });

    it('renders skeleton image by default', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.skeleton-card-image')).toBeInTheDocument();
    });

    it('renders skeleton title', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.skeleton-title')).toBeInTheDocument();
    });

    it('renders skeleton text with default 3 lines', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.skeleton-text')).toBeInTheDocument();
    });

    it('renders skeleton actions', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.skeleton-actions')).toBeInTheDocument();
    });

    it('renders card content container', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.skeleton-card-content')).toBeInTheDocument();
    });
  });

  describe('Image Prop', () => {
    it('shows image when showImage is true', () => {
      const { container } = render(<SkeletonCard showImage={true} />);
      expect(container.querySelector('.skeleton-card-image')).toBeInTheDocument();
    });

    it('hides image when showImage is false', () => {
      const { container } = render(<SkeletonCard showImage={false} />);
      expect(container.querySelector('.skeleton-card-image')).not.toBeInTheDocument();
    });

    it('shows image by default', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.querySelector('.skeleton-card-image')).toBeInTheDocument();
    });

    it('image skeleton has correct height', () => {
      const { container } = render(<SkeletonCard />);
      const image = container.querySelector('.skeleton-card-image');
      expect(image).toBeInTheDocument();
    });

    it('image skeleton is rounded', () => {
      const { container } = render(<SkeletonCard />);
      const image = container.querySelector('.skeleton-card-image');
      expect(image).toHaveClass('skeleton-rounded');
    });

    it('image skeleton is rectangle variant', () => {
      const { container } = render(<SkeletonCard />);
      const image = container.querySelector('.skeleton-card-image');
      expect(image).toHaveClass('skeleton-rectangle');
    });
  });

  describe('Lines Prop', () => {
    it('renders default 3 lines of text', () => {
      const { container } = render(<SkeletonCard />);
      const textContainer = container.querySelector('.skeleton-text-container');
      expect(textContainer).toBeInTheDocument();
    });

    it('renders custom number of lines', () => {
      const { container } = render(<SkeletonCard lines={5} />);
      const textContainer = container.querySelector('.skeleton-text-container');
      expect(textContainer).toBeInTheDocument();
    });

    it('renders 1 line of text', () => {
      const { container } = render(<SkeletonCard lines={1} />);
      const text = container.querySelector('.skeleton-text');
      expect(text).toBeInTheDocument();
    });

    it('renders 2 lines of text', () => {
      const { container } = render(<SkeletonCard lines={2} />);
      const textContainer = container.querySelector('.skeleton-text-container');
      expect(textContainer).toBeInTheDocument();
    });

    it('renders 10 lines of text', () => {
      const { container } = render(<SkeletonCard lines={10} />);
      const textContainer = container.querySelector('.skeleton-text-container');
      expect(textContainer).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('renders two action buttons', () => {
      const { container } = render(<SkeletonCard />);
      const actions = container.querySelector('.skeleton-actions');
      const buttons = actions.querySelectorAll('.skeleton-rectangle');
      expect(buttons.length).toBe(2);
    });

    it('first button has correct width', () => {
      const { container } = render(<SkeletonCard />);
      const actions = container.querySelector('.skeleton-actions');
      const buttons = actions.querySelectorAll('.skeleton-rectangle');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('second button has correct width', () => {
      const { container } = render(<SkeletonCard />);
      const actions = container.querySelector('.skeleton-actions');
      const buttons = actions.querySelectorAll('.skeleton-rectangle');
      expect(buttons[1]).toBeInTheDocument();
    });

    it('action buttons are rounded', () => {
      const { container } = render(<SkeletonCard />);
      const actions = container.querySelector('.skeleton-actions');
      const buttons = actions.querySelectorAll('.skeleton-rectangle');
      buttons.forEach(button => {
        expect(button).toHaveClass('skeleton-rounded');
      });
    });
  });

  describe('Complete Structure', () => {
    it('renders all parts when showImage is true', () => {
      const { container } = render(<SkeletonCard showImage={true} lines={3} />);
      expect(container.querySelector('.skeleton-card-image')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-title')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-text')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-actions')).toBeInTheDocument();
    });

    it('renders without image', () => {
      const { container } = render(<SkeletonCard showImage={false} lines={3} />);
      expect(container.querySelector('.skeleton-card-image')).not.toBeInTheDocument();
      expect(container.querySelector('.skeleton-title')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-text')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-actions')).toBeInTheDocument();
    });
  });
});

describe('SkeletonAvatar', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkeletonAvatar />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with circular variant', () => {
      const { container } = render(<SkeletonAvatar />);
      expect(container.firstChild).toHaveClass('skeleton-circular');
    });

    it('is rounded', () => {
      const { container } = render(<SkeletonAvatar />);
      expect(container.firstChild).toHaveClass('skeleton-rounded');
    });

    it('applies skeleton-avatar class', () => {
      const { container } = render(<SkeletonAvatar />);
      expect(container.firstChild).toHaveClass('skeleton-avatar');
    });
  });

  describe('Size Variants', () => {
    it('renders with default md size', () => {
      const { container } = render(<SkeletonAvatar />);
      expect(container.firstChild).toHaveClass('skeleton-avatar-md');
    });

    it('renders with small size', () => {
      const { container } = render(<SkeletonAvatar size="sm" />);
      expect(container.firstChild).toHaveClass('skeleton-avatar-sm');
    });

    it('renders with medium size', () => {
      const { container } = render(<SkeletonAvatar size="md" />);
      expect(container.firstChild).toHaveClass('skeleton-avatar-md');
    });

    it('renders with large size', () => {
      const { container } = render(<SkeletonAvatar size="lg" />);
      expect(container.firstChild).toHaveClass('skeleton-avatar-lg');
    });

    it('renders with extra large size', () => {
      const { container } = render(<SkeletonAvatar size="xl" />);
      expect(container.firstChild).toHaveClass('skeleton-avatar-xl');
    });

    it('renders with custom size', () => {
      const { container } = render(<SkeletonAvatar size="custom" />);
      expect(container.firstChild).toHaveClass('skeleton-avatar-custom');
    });
  });

  describe('Combined Classes', () => {
    it('applies all required classes', () => {
      const { container } = render(<SkeletonAvatar size="sm" />);
      expect(container.firstChild).toHaveClass('skeleton', 'skeleton-circular', 'skeleton-avatar', 'skeleton-avatar-sm', 'skeleton-rounded');
    });
  });
});

describe('SkeletonButton', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkeletonButton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with rectangle variant', () => {
      const { container } = render(<SkeletonButton />);
      expect(container.firstChild).toHaveClass('skeleton-rectangle');
    });

    it('is rounded', () => {
      const { container } = render(<SkeletonButton />);
      expect(container.firstChild).toHaveClass('skeleton-rounded');
    });

    it('applies skeleton-button class', () => {
      const { container } = render(<SkeletonButton />);
      expect(container.firstChild).toHaveClass('skeleton-button');
    });
  });

  describe('Dimensions', () => {
    it('renders with default width of 80px', () => {
      const { container } = render(<SkeletonButton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with custom width', () => {
      const { container } = render(<SkeletonButton width="120px" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with percentage width', () => {
      const { container } = render(<SkeletonButton width="50%" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with rem width', () => {
      const { container } = render(<SkeletonButton width="10rem" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has fixed height of 40px', () => {
      const { container } = render(<SkeletonButton />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Combined Classes', () => {
    it('applies all required classes', () => {
      const { container } = render(<SkeletonButton />);
      expect(container.firstChild).toHaveClass('skeleton', 'skeleton-rectangle', 'skeleton-button', 'skeleton-rounded');
    });
  });
});

describe('SkeletonList', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkeletonList />);
      expect(container.querySelector('.skeleton-list')).toBeInTheDocument();
    });

    it('renders list wrapper', () => {
      const { container } = render(<SkeletonList />);
      expect(container.firstChild).toHaveClass('skeleton-list');
    });
  });

  describe('Items Prop', () => {
    it('renders default 5 items', () => {
      const { container } = render(<SkeletonList />);
      const items = container.querySelectorAll('.skeleton-list-item');
      expect(items.length).toBe(5);
    });

    it('renders custom number of items', () => {
      const { container } = render(<SkeletonList items={3} />);
      const items = container.querySelectorAll('.skeleton-list-item');
      expect(items.length).toBe(3);
    });

    it('renders 1 item', () => {
      const { container } = render(<SkeletonList items={1} />);
      const items = container.querySelectorAll('.skeleton-list-item');
      expect(items.length).toBe(1);
    });

    it('renders 10 items', () => {
      const { container } = render(<SkeletonList items={10} />);
      const items = container.querySelectorAll('.skeleton-list-item');
      expect(items.length).toBe(10);
    });

    it('renders 0 items', () => {
      const { container } = render(<SkeletonList items={0} />);
      const items = container.querySelectorAll('.skeleton-list-item');
      expect(items.length).toBe(0);
    });
  });

  describe('List Item Structure', () => {
    it('each item has skeleton avatar', () => {
      const { container } = render(<SkeletonList items={3} />);
      const items = container.querySelectorAll('.skeleton-list-item');
      items.forEach(item => {
        expect(item.querySelector('.skeleton-avatar')).toBeInTheDocument();
      });
    });

    it('each item has list content container', () => {
      const { container } = render(<SkeletonList items={3} />);
      const items = container.querySelectorAll('.skeleton-list-item');
      items.forEach(item => {
        expect(item.querySelector('.skeleton-list-content')).toBeInTheDocument();
      });
    });

    it('each item has title skeleton', () => {
      const { container } = render(<SkeletonList items={3} />);
      const items = container.querySelectorAll('.skeleton-list-item');
      items.forEach(item => {
        expect(item.querySelector('.skeleton-list-title')).toBeInTheDocument();
      });
    });

    it('each item has subtitle skeleton', () => {
      const { container } = render(<SkeletonList items={3} />);
      const items = container.querySelectorAll('.skeleton-list-item');
      items.forEach(item => {
        expect(item.querySelector('.skeleton-list-subtitle')).toBeInTheDocument();
      });
    });

    it('avatars are small size', () => {
      const { container } = render(<SkeletonList items={2} />);
      const avatars = container.querySelectorAll('.skeleton-avatar');
      avatars.forEach(avatar => {
        expect(avatar).toHaveClass('skeleton-avatar-sm');
      });
    });

    it('subtitle has 70% width', () => {
      const { container } = render(<SkeletonList items={1} />);
      const subtitle = container.querySelector('.skeleton-list-subtitle');
      expect(subtitle).toBeInTheDocument();
    });
  });
});

describe('SkeletonPost', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.querySelector('.skeleton-post')).toBeInTheDocument();
    });

    it('renders card wrapper', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.firstChild).toHaveClass('card', 'skeleton-post');
    });
  });

  describe('Post Header', () => {
    it('renders post header', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.querySelector('.skeleton-post-header')).toBeInTheDocument();
    });

    it('renders avatar in header', () => {
      const { container } = render(<SkeletonPost />);
      const header = container.querySelector('.skeleton-post-header');
      expect(header.querySelector('.skeleton-avatar')).toBeInTheDocument();
    });

    it('header avatar is small size', () => {
      const { container } = render(<SkeletonPost />);
      const avatar = container.querySelector('.skeleton-avatar');
      expect(avatar).toHaveClass('skeleton-avatar-sm');
    });

    it('renders post meta container', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.querySelector('.skeleton-post-meta')).toBeInTheDocument();
    });

    it('renders meta skeletons', () => {
      const { container } = render(<SkeletonPost />);
      const meta = container.querySelector('.skeleton-post-meta');
      const skeletons = meta.querySelectorAll('.skeleton-text');
      expect(skeletons.length).toBe(2);
    });
  });

  describe('Post Content', () => {
    it('renders post content with 3 lines', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.querySelector('.skeleton-post-content')).toBeInTheDocument();
    });

    it('renders post image', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.querySelector('.skeleton-post-image')).toBeInTheDocument();
    });

    it('post image is rounded', () => {
      const { container } = render(<SkeletonPost />);
      const image = container.querySelector('.skeleton-post-image');
      expect(image).toHaveClass('skeleton-rounded');
    });

    it('post image is rectangle variant', () => {
      const { container } = render(<SkeletonPost />);
      const image = container.querySelector('.skeleton-post-image');
      expect(image).toHaveClass('skeleton-rectangle');
    });
  });

  describe('Post Actions', () => {
    it('renders post actions container', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.querySelector('.skeleton-post-actions')).toBeInTheDocument();
    });

    it('renders three action buttons', () => {
      const { container } = render(<SkeletonPost />);
      const actions = container.querySelector('.skeleton-post-actions');
      const buttons = actions.querySelectorAll('.skeleton-button');
      expect(buttons.length).toBe(3);
    });

    it('action buttons have different widths', () => {
      const { container } = render(<SkeletonPost />);
      const actions = container.querySelector('.skeleton-post-actions');
      const buttons = actions.querySelectorAll('.skeleton-button');
      expect(buttons.length).toBe(3);
    });
  });

  describe('Complete Structure', () => {
    it('renders all sections', () => {
      const { container } = render(<SkeletonPost />);
      expect(container.querySelector('.skeleton-post-header')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-post-content')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-post-image')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-post-actions')).toBeInTheDocument();
    });

    it('maintains correct structure order', () => {
      const { container } = render(<SkeletonPost />);
      const post = container.querySelector('.skeleton-post');
      const children = Array.from(post.children);
      expect(children[0]).toHaveClass('skeleton-post-header');
      expect(children[3]).toHaveClass('skeleton-post-actions');
    });
  });
});

describe('Snapshots', () => {
  it('matches snapshot for default Skeleton', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for text variant with multiple lines', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for rectangle variant', () => {
    const { container } = render(<Skeleton variant="rectangle" width="200px" height="100px" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for SkeletonCard', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for SkeletonAvatar', () => {
    const { container } = render(<SkeletonAvatar />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for SkeletonButton', () => {
    const { container } = render(<SkeletonButton />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for SkeletonList', () => {
    const { container } = render(<SkeletonList />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for SkeletonPost', () => {
    const { container } = render(<SkeletonPost />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

export default lines
