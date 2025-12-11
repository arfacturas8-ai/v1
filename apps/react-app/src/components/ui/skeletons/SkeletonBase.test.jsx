import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { motion } from 'framer-motion';
import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonButton,
  SkeletonImage,
} from './SkeletonBase';

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, className, style, animate, variants, transition, ...props }, ref) => (
        <div
          ref={ref}
          className={className}
          style={style}
          data-animate={JSON.stringify(animate)}
          data-variants={variants ? JSON.stringify(variants) : undefined}
          data-transition={transition ? JSON.stringify(transition) : undefined}
          {...props}
        >
          {children}
        </div>
      )),
    },
  };
});

describe('Skeleton Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute('aria-label', 'Loading');
    });

    it('should render with sr-only text for screen readers', () => {
      render(<Skeleton />);
      expect(screen.getByText('')).toBeInTheDocument();
      expect(screen.getByText('')).toHaveClass('sr-only');
    });

    it('should render with shimmer variant by default', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('data-animate', 'shimmer');
    });

    it('should render with pulse variant', () => {
      render(<Skeleton variant="pulse" />);
      const skeleton = screen.getByRole('status');
      const animate = JSON.parse(skeleton.getAttribute('data-animate'));
      expect(animate.opacity).toEqual([0.5, 1, 0.5]);
    });
  });

  describe('Width and Height Props', () => {
    it('should apply default width of 100%', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '100%' });
    });

    it('should apply default height of 1rem', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ height: '1rem' });
    });

    it('should apply custom width as string', () => {
      render(<Skeleton width="200px" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '200px' });
    });

    it('should apply custom height as string', () => {
      render(<Skeleton height="50px" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ height: '50px' });
    });

    it('should apply percentage width', () => {
      render(<Skeleton width="75%" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '75%' });
    });

    it('should apply rem-based height', () => {
      render(<Skeleton height="2rem" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ height: '2rem' });
    });
  });

  describe('Rounded Variants', () => {
    it('should not apply rounded class when rounded is "none"', () => {
      render(<Skeleton rounded="none" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton.className).not.toMatch(/rounded-/);
    });

    it('should apply rounded-sm class', () => {
      render(<Skeleton rounded="sm" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-sm');
    });

    it('should apply rounded-md class by default', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('should apply rounded-lg class', () => {
      render(<Skeleton rounded="lg" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('should apply rounded-xl class', () => {
      render(<Skeleton rounded="xl" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-xl');
    });

    it('should apply rounded-2xl class', () => {
      render(<Skeleton rounded="2xl" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-2xl');
    });

    it('should apply rounded-full class', () => {
      render(<Skeleton rounded="full" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-full');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('custom-class');
    });

    it('should apply base classes', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('relative');
      expect(skeleton).toHaveClass('overflow-hidden');
    });

    it('should preserve base classes with custom className', () => {
      render(<Skeleton className="custom-class" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('relative');
      expect(skeleton).toHaveClass('overflow-hidden');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('Shimmer Animation', () => {
    it('should apply shimmer animation by default', () => {
      render(<Skeleton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('data-animate', 'shimmer');
    });

    it('should apply background gradient for shimmer', () => {
      render(<Skeleton variant="shimmer" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('bg-gradient-to-r');
      expect(skeleton.className).toMatch(/from-gray-200/);
      expect(skeleton.className).toMatch(/via-gray-300/);
      expect(skeleton.className).toMatch(/to-gray-200/);
    });

    it('should apply background size for shimmer effect', () => {
      render(<Skeleton variant="shimmer" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ backgroundSize: '200% 100%' });
    });

    it('should have shimmer variants with correct animation properties', () => {
      render(<Skeleton variant="shimmer" />);
      const skeleton = screen.getByRole('status');
      const variants = JSON.parse(skeleton.getAttribute('data-variants'));
      expect(variants.shimmer.backgroundPosition).toEqual(['200% 0', '-200% 0']);
      expect(variants.shimmer.transition.duration).toBe(2);
      expect(variants.shimmer.transition.ease).toBe('linear');
      expect(variants.shimmer.transition.repeat).toBe(Infinity);
    });
  });

  describe('Pulse Animation', () => {
    it('should apply pulse animation when variant is pulse', () => {
      render(<Skeleton variant="pulse" />);
      const skeleton = screen.getByRole('status');
      const animate = JSON.parse(skeleton.getAttribute('data-animate'));
      expect(animate.opacity).toEqual([0.5, 1, 0.5]);
    });

    it('should have correct pulse transition duration', () => {
      render(<Skeleton variant="pulse" />);
      const skeleton = screen.getByRole('status');
      const transition = JSON.parse(skeleton.getAttribute('data-transition'));
      expect(transition.duration).toBe(1.5);
    });

    it('should have infinite repeat for pulse animation', () => {
      render(<Skeleton variant="pulse" />);
      const skeleton = screen.getByRole('status');
      const transition = JSON.parse(skeleton.getAttribute('data-transition'));
      expect(transition.repeat).toBe(Infinity);
    });

    it('should have easeInOut easing for pulse animation', () => {
      render(<Skeleton variant="pulse" />);
      const skeleton = screen.getByRole('status');
      const transition = JSON.parse(skeleton.getAttribute('data-transition'));
      expect(transition.ease).toBe('easeInOut');
    });

    it('should not apply background size for pulse variant', () => {
      render(<Skeleton variant="pulse" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton.style.backgroundSize).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<Skeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<Skeleton />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });

    it('should include sr-only text', () => {
      render(<Skeleton />);
      const srText = screen.getByText('');
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('Additional Props', () => {
    it('should spread additional props to the element', () => {
      render(<Skeleton data-testid="skeleton-test" />);
      expect(screen.getByTestId('skeleton-test')).toBeInTheDocument();
    });

    it('should support custom data attributes', () => {
      render(<Skeleton data-custom="value" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('data-custom', 'value');
    });
  });
});

describe('SkeletonText Component', () => {
  describe('Single Line', () => {
    it('should render single line by default', () => {
      render(<SkeletonText />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(1);
    });

    it('should render single line with default width', () => {
      render(<SkeletonText lines={1} />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '100%' });
    });

    it('should render single line with custom width', () => {
      render(<SkeletonText lines={1} width="50%" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '50%' });
    });
  });

  describe('Multiple Lines', () => {
    it('should render multiple lines', () => {
      render(<SkeletonText lines={3} />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(3);
    });

    it('should render five lines', () => {
      render(<SkeletonText lines={5} />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(5);
    });

    it('should apply different width to last line', () => {
      const { container } = render(<SkeletonText lines={3} lastLineWidth="60%" />);
      const skeletons = screen.getAllByRole('status');
      const lastSkeleton = skeletons[skeletons.length - 1];
      expect(lastSkeleton).toHaveStyle({ width: '60%' });
    });

    it('should apply full width to non-last lines', () => {
      render(<SkeletonText lines={3} />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons[0]).toHaveStyle({ width: '100%' });
      expect(skeletons[1]).toHaveStyle({ width: '100%' });
    });
  });

  describe('Spacing', () => {
    it('should apply xs spacing', () => {
      const { container } = render(<SkeletonText lines={3} spacing="xs" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-1');
    });

    it('should apply sm spacing by default', () => {
      const { container } = render(<SkeletonText lines={3} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-2');
    });

    it('should apply md spacing', () => {
      const { container } = render(<SkeletonText lines={3} spacing="md" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-3');
    });

    it('should apply lg spacing', () => {
      const { container } = render(<SkeletonText lines={3} spacing="lg" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('space-y-4');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to wrapper', () => {
      const { container } = render(<SkeletonText lines={2} className="custom-text-class" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-text-class');
    });
  });
});

describe('SkeletonCircle Component', () => {
  describe('Size Variants', () => {
    it('should render with xs size', () => {
      render(<SkeletonCircle size="xs" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('w-6');
      expect(skeleton).toHaveClass('h-6');
    });

    it('should render with sm size', () => {
      render(<SkeletonCircle size="sm" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('w-8');
      expect(skeleton).toHaveClass('h-8');
    });

    it('should render with md size by default', () => {
      render(<SkeletonCircle />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('w-10');
      expect(skeleton).toHaveClass('h-10');
    });

    it('should render with lg size', () => {
      render(<SkeletonCircle size="lg" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('w-12');
      expect(skeleton).toHaveClass('h-12');
    });

    it('should render with xl size', () => {
      render(<SkeletonCircle size="xl" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('w-16');
      expect(skeleton).toHaveClass('h-16');
    });

    it('should render with 2xl size', () => {
      render(<SkeletonCircle size="2xl" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('w-20');
      expect(skeleton).toHaveClass('h-20');
    });

    it('should render with 3xl size', () => {
      render(<SkeletonCircle size="3xl" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('w-24');
      expect(skeleton).toHaveClass('h-24');
    });
  });

  describe('Shape', () => {
    it('should apply rounded-full class for circular shape', () => {
      render(<SkeletonCircle />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should have auto width and height', () => {
      render(<SkeletonCircle />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: 'auto', height: 'auto' });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<SkeletonCircle className="custom-circle-class" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('custom-circle-class');
    });
  });
});

describe('SkeletonButton Component', () => {
  describe('Size Variants', () => {
    it('should render with xs size', () => {
      render(<SkeletonButton size="xs" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('h-7');
      expect(skeleton).toHaveClass('px-3');
      expect(skeleton).toHaveClass('min-w-[60px]');
    });

    it('should render with sm size', () => {
      render(<SkeletonButton size="sm" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('h-8');
      expect(skeleton).toHaveClass('px-3');
      expect(skeleton).toHaveClass('min-w-[80px]');
    });

    it('should render with md size by default', () => {
      render(<SkeletonButton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('px-4');
      expect(skeleton).toHaveClass('min-w-[100px]');
    });

    it('should render with lg size', () => {
      render(<SkeletonButton size="lg" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('h-12');
      expect(skeleton).toHaveClass('px-6');
      expect(skeleton).toHaveClass('min-w-[120px]');
    });

    it('should render with xl size', () => {
      render(<SkeletonButton size="xl" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('h-14');
      expect(skeleton).toHaveClass('px-8');
      expect(skeleton).toHaveClass('min-w-[140px]');
    });
  });

  describe('Full Width', () => {
    it('should not be full width by default', () => {
      render(<SkeletonButton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: 'auto' });
    });

    it('should apply full width when fullWidth is true', () => {
      render(<SkeletonButton fullWidth />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '100%' });
    });
  });

  describe('Shape', () => {
    it('should apply rounded-lg class', () => {
      render(<SkeletonButton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('should have auto height', () => {
      render(<SkeletonButton />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ height: 'auto' });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<SkeletonButton className="custom-button-class" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('custom-button-class');
    });
  });
});

describe('SkeletonImage Component', () => {
  describe('Aspect Ratio Variants', () => {
    it('should render with square aspect ratio', () => {
      render(<SkeletonImage aspectRatio="square" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('aspect-square');
    });

    it('should render with video aspect ratio by default', () => {
      render(<SkeletonImage />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('aspect-video');
    });

    it('should render with portrait aspect ratio', () => {
      render(<SkeletonImage aspectRatio="portrait" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('aspect-[3/4]');
    });

    it('should render with landscape aspect ratio', () => {
      render(<SkeletonImage aspectRatio="landscape" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('aspect-[4/3]');
    });

    it('should render with ultrawide aspect ratio', () => {
      render(<SkeletonImage aspectRatio="ultrawide" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('aspect-[21/9]');
    });
  });

  describe('Dimensions', () => {
    it('should have 100% width', () => {
      render(<SkeletonImage />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ width: '100%' });
    });

    it('should have auto height', () => {
      render(<SkeletonImage />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveStyle({ height: 'auto' });
    });
  });

  describe('Rounded Variants', () => {
    it('should apply rounded-lg by default', () => {
      render(<SkeletonImage />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('should apply custom rounded value', () => {
      render(<SkeletonImage rounded="xl" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-xl');
    });

    it('should apply rounded-full', () => {
      render(<SkeletonImage rounded="full" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('rounded-full');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<SkeletonImage className="custom-image-class" />);
      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveClass('custom-image-class');
    });
  });
});

export default React
