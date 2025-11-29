import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SkeletonCard,
  SkeletonPostCard,
  SkeletonCommunityCard,
  SkeletonUserCard,
  SkeletonCommentCard,
} from './SkeletonCard';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, initial, animate, transition, ...props }) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
    article: ({ children, className, style, initial, animate, transition, ...props }) => (
      <article className={className} style={style} {...props}>
        {children}
      </article>
    ),
  },
}));

jest.mock('./SkeletonBase', () => ({
  Skeleton: ({ width, height, className, rounded, 'data-testid': testId, ...props }) => (
    <div
      data-testid={testId || 'skeleton'}
      className={className}
      data-width={width}
      data-height={height}
      data-rounded={rounded}
      role="status"
      aria-label="Loading"
      {...props}
    />
  ),
  SkeletonText: ({ lines, spacing, lastLineWidth, className, 'data-testid': testId }) => (
    <div
      data-testid={testId || 'skeleton-text'}
      className={className}
      data-lines={lines}
      data-spacing={spacing}
      data-last-line-width={lastLineWidth}
    />
  ),
  SkeletonCircle: ({ size, className, 'data-testid': testId }) => (
    <div
      data-testid={testId || 'skeleton-circle'}
      className={className}
      data-size={size}
      role="status"
    />
  ),
  SkeletonButton: ({ size, fullWidth, className, 'data-testid': testId }) => (
    <div
      data-testid={testId || 'skeleton-button'}
      className={className}
      data-size={size}
      data-full-width={fullWidth}
      role="status"
    />
  ),
  SkeletonImage: ({ aspectRatio, className, rounded, 'data-testid': testId }) => (
    <div
      data-testid={testId || 'skeleton-image'}
      className={className}
      data-aspect-ratio={aspectRatio}
      data-rounded={rounded}
      role="status"
    />
  ),
}));

describe('SkeletonCard', () => {
  describe('Basic Rendering', () => {
    it('should render the card skeleton with default props', () => {
      const { container } = render(<SkeletonCard />);
      const card = container.firstChild;

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'dark:bg-gray-900', 'rounded-xl');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonCard className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render with dark mode classes', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toHaveClass('dark:bg-gray-900', 'dark:border-gray-800');
    });

    it('should render with border styling', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toHaveClass('border', 'border-gray-200');
    });

    it('should render with padding', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toHaveClass('p-4');
    });
  });

  describe('Header Section', () => {
    it('should render header by default', () => {
      render(<SkeletonCard />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should hide header when showHeader is false', () => {
      const { container } = render(<SkeletonCard showHeader={false} />);
      const headerSection = container.querySelector('.flex.items-center.gap-3.mb-4');
      expect(headerSection).not.toBeInTheDocument();
    });

    it('should render header with circle and skeleton elements', () => {
      render(<SkeletonCard showHeader={true} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles[0]).toHaveAttribute('data-size', 'md');
    });

    it('should render header with correct layout classes', () => {
      const { container } = render(<SkeletonCard showHeader={true} />);
      const header = container.querySelector('.flex.items-center.gap-3.mb-4');
      expect(header).toHaveClass('flex', 'items-center', 'gap-3', 'mb-4');
    });
  });

  describe('Image Section', () => {
    it('should not render image by default', () => {
      render(<SkeletonCard />);
      const images = screen.queryAllByTestId('skeleton-image');
      expect(images.length).toBe(0);
    });

    it('should render image when showImage is true', () => {
      render(<SkeletonCard showImage={true} />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toBeInTheDocument();
    });

    it('should render image with video aspect ratio', () => {
      render(<SkeletonCard showImage={true} />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toHaveAttribute('data-aspect-ratio', 'video');
    });

    it('should render image with margin bottom', () => {
      render(<SkeletonCard showImage={true} />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toHaveClass('mb-4');
    });
  });

  describe('Content Section', () => {
    it('should render content with default 3 lines', () => {
      render(<SkeletonCard />);
      const text = screen.getByTestId('skeleton-text');
      expect(text).toHaveAttribute('data-lines', '3');
    });

    it('should render content with custom number of lines', () => {
      render(<SkeletonCard contentLines={5} />);
      const text = screen.getByTestId('skeleton-text');
      expect(text).toHaveAttribute('data-lines', '5');
    });

    it('should render content with 1 line', () => {
      render(<SkeletonCard contentLines={1} />);
      const text = screen.getByTestId('skeleton-text');
      expect(text).toHaveAttribute('data-lines', '1');
    });

    it('should render content with small spacing', () => {
      render(<SkeletonCard />);
      const text = screen.getByTestId('skeleton-text');
      expect(text).toHaveAttribute('data-spacing', 'sm');
    });

    it('should render content section with margin bottom', () => {
      const { container } = render(<SkeletonCard />);
      const contentSection = container.querySelector('.mb-4');
      expect(contentSection).toBeInTheDocument();
    });
  });

  describe('Footer Section', () => {
    it('should render footer by default', () => {
      render(<SkeletonCard />);
      const buttons = screen.getAllByTestId('skeleton-button');
      expect(buttons.length).toBe(3);
    });

    it('should hide footer when showFooter is false', () => {
      render(<SkeletonCard showFooter={false} />);
      const buttons = screen.queryAllByTestId('skeleton-button');
      expect(buttons.length).toBe(0);
    });

    it('should render footer with border top', () => {
      const { container } = render(<SkeletonCard showFooter={true} />);
      const footer = container.querySelector('.border-t');
      expect(footer).toHaveClass('border-t', 'border-gray-200', 'dark:border-gray-800');
    });

    it('should render footer with three small buttons', () => {
      render(<SkeletonCard showFooter={true} />);
      const buttons = screen.getAllByTestId('skeleton-button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('data-size', 'sm');
      });
    });

    it('should render footer with correct layout', () => {
      const { container } = render(<SkeletonCard showFooter={true} />);
      const footer = container.querySelector('.flex.items-center.justify-between');
      expect(footer).toHaveClass('flex', 'items-center', 'justify-between', 'pt-3');
    });
  });

  describe('Combined Variants', () => {
    it('should render full card with all sections', () => {
      render(<SkeletonCard showHeader={true} showImage={true} showFooter={true} contentLines={4} />);

      expect(screen.getAllByTestId('skeleton-circle').length).toBeGreaterThan(0);
      expect(screen.getByTestId('skeleton-image')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-text')).toHaveAttribute('data-lines', '4');
      expect(screen.getAllByTestId('skeleton-button').length).toBe(3);
    });

    it('should render minimal card with no header or footer', () => {
      render(<SkeletonCard showHeader={false} showFooter={false} />);

      expect(screen.queryAllByTestId('skeleton-circle').length).toBe(0);
      expect(screen.queryAllByTestId('skeleton-button').length).toBe(0);
      expect(screen.getByTestId('skeleton-text')).toBeInTheDocument();
    });
  });
});

describe('SkeletonPostCard', () => {
  describe('Basic Rendering', () => {
    it('should render post card skeleton', () => {
      const { container } = render(<SkeletonPostCard />);
      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveClass('bg-white', 'dark:bg-gray-900', 'rounded-xl');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonPostCard className="custom-post" />);
      expect(container.querySelector('article')).toHaveClass('custom-post');
    });

    it('should render with overflow hidden', () => {
      const { container } = render(<SkeletonPostCard />);
      expect(container.querySelector('article')).toHaveClass('overflow-hidden');
    });
  });

  describe('Community Section', () => {
    it('should render community info by default', () => {
      render(<SkeletonPostCard showCommunity={true} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should hide community info when showCommunity is false', () => {
      const { container } = render(<SkeletonPostCard showCommunity={false} />);
      const circles = screen.queryAllByTestId('skeleton-circle');
      const skeletons = screen.getAllByTestId('skeleton');

      const hasXsCircle = circles.some(circle => circle.getAttribute('data-size') === 'xs');
      expect(hasXsCircle).toBe(false);
    });

    it('should render community with extra small circle', () => {
      render(<SkeletonPostCard showCommunity={true} />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const xsCircle = circles.find(circle => circle.getAttribute('data-size') === 'xs');
      expect(xsCircle).toBeInTheDocument();
    });
  });

  describe('Media Section', () => {
    it('should not render media by default', () => {
      render(<SkeletonPostCard />);
      const images = screen.queryAllByTestId('skeleton-image');
      expect(images.length).toBe(0);
    });

    it('should render media when showMedia is true', () => {
      render(<SkeletonPostCard showMedia={true} />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('data-aspect-ratio', 'video');
    });
  });

  describe('Compact Variant', () => {
    it('should render 2 title lines when not compact', () => {
      const { container } = render(<SkeletonPostCard compact={false} />);
      const textElements = screen.getAllByTestId('skeleton-text');

      const titleText = textElements[0];
      expect(titleText).toHaveAttribute('data-lines', '2');
    });

    it('should render 1 title line when compact', () => {
      const { container } = render(<SkeletonPostCard compact={true} />);
      const textElements = screen.getAllByTestId('skeleton-text');

      const titleText = textElements[0];
      expect(titleText).toHaveAttribute('data-lines', '1');
    });

    it('should hide content preview when compact', () => {
      const { container } = render(<SkeletonPostCard compact={true} />);
      const textElements = screen.getAllByTestId('skeleton-text');

      expect(textElements.length).toBe(1);
    });

    it('should show content preview when not compact', () => {
      const { container } = render(<SkeletonPostCard compact={false} />);
      const textElements = screen.getAllByTestId('skeleton-text');

      expect(textElements.length).toBe(2);
    });
  });

  describe('Post Actions', () => {
    it('should render post actions section', () => {
      render(<SkeletonPostCard />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render action icons with correct sizing', () => {
      render(<SkeletonPostCard />);
      const skeletons = screen.getAllByTestId('skeleton');

      const has24pxIcons = skeletons.some(s =>
        s.getAttribute('data-width') === '24px' && s.getAttribute('data-height') === '24px'
      );
      expect(has24pxIcons).toBe(true);
    });
  });
});

describe('SkeletonCommunityCard', () => {
  describe('Basic Rendering', () => {
    it('should render community card skeleton', () => {
      const { container } = render(<SkeletonCommunityCard />);
      const card = container.firstChild;
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-xl', 'overflow-hidden');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonCommunityCard className="custom-community" />);
      expect(container.firstChild).toHaveClass('custom-community');
    });
  });

  describe('Cover Image', () => {
    it('should render cover image with landscape aspect ratio', () => {
      render(<SkeletonCommunityCard />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toHaveAttribute('data-aspect-ratio', 'landscape');
    });

    it('should render cover image without rounded corners', () => {
      render(<SkeletonCommunityCard />);
      const image = screen.getByTestId('skeleton-image');
      expect(image).toHaveAttribute('data-rounded', 'none');
    });
  });

  describe('Community Icon and Info', () => {
    it('should render large circle for community icon', () => {
      render(<SkeletonCommunityCard />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const lgCircle = circles.find(circle => circle.getAttribute('data-size') === 'lg');
      expect(lgCircle).toBeInTheDocument();
    });

    it('should render community icon with border styling', () => {
      render(<SkeletonCommunityCard />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const lgCircle = circles.find(circle => circle.getAttribute('data-size') === 'lg');
      expect(lgCircle).toHaveClass('border-4', 'border-white', 'dark:border-gray-900');
    });

    it('should render community icon with negative margin', () => {
      render(<SkeletonCommunityCard />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const lgCircle = circles.find(circle => circle.getAttribute('data-size') === 'lg');
      expect(lgCircle).toHaveClass('-mt-8');
    });
  });

  describe('Description Section', () => {
    it('should render description with 2 lines', () => {
      render(<SkeletonCommunityCard />);
      const text = screen.getByTestId('skeleton-text');
      expect(text).toHaveAttribute('data-lines', '2');
      expect(text).toHaveAttribute('data-spacing', 'sm');
    });
  });

  describe('Stats Section', () => {
    it('should render stats skeletons', () => {
      render(<SkeletonCommunityCard />);
      const skeletons = screen.getAllByTestId('skeleton');

      const statsSkeletons = skeletons.filter(s => s.getAttribute('data-height') === '1rem');
      expect(statsSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Action Button', () => {
    it('should render full width button', () => {
      render(<SkeletonCommunityCard />);
      const button = screen.getByTestId('skeleton-button');
      expect(button).toHaveAttribute('data-size', 'md');
      expect(button).toHaveAttribute('data-full-width', 'true');
    });
  });
});

describe('SkeletonUserCard', () => {
  describe('Basic Rendering', () => {
    it('should render user card skeleton', () => {
      const { container } = render(<SkeletonUserCard />);
      const card = container.firstChild;
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'dark:bg-gray-900', 'p-4');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonUserCard className="custom-user" />);
      expect(container.firstChild).toHaveClass('custom-user');
    });
  });

  describe('Avatar and Basic Info', () => {
    it('should render large circle for avatar', () => {
      render(<SkeletonUserCard />);
      const circles = screen.getAllByTestId('skeleton-circle');
      const lgCircle = circles.find(circle => circle.getAttribute('data-size') === 'lg');
      expect(lgCircle).toBeInTheDocument();
    });

    it('should render user info skeletons', () => {
      render(<SkeletonUserCard />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Bio Section', () => {
    it('should render bio by default', () => {
      render(<SkeletonUserCard showBio={true} />);
      const text = screen.getByTestId('skeleton-text');
      expect(text).toBeInTheDocument();
    });

    it('should hide bio when showBio is false', () => {
      render(<SkeletonUserCard showBio={false} />);
      const texts = screen.queryAllByTestId('skeleton-text');
      expect(texts.length).toBe(0);
    });

    it('should render bio with 2 lines', () => {
      render(<SkeletonUserCard showBio={true} />);
      const text = screen.getByTestId('skeleton-text');
      expect(text).toHaveAttribute('data-lines', '2');
      expect(text).toHaveAttribute('data-spacing', 'xs');
    });
  });

  describe('Action Button', () => {
    it('should render action button with border top', () => {
      const { container } = render(<SkeletonUserCard />);
      const buttonSection = container.querySelector('.border-t');
      expect(buttonSection).toHaveClass('border-t', 'border-gray-200', 'dark:border-gray-800');
    });

    it('should render medium full width button', () => {
      render(<SkeletonUserCard />);
      const button = screen.getByTestId('skeleton-button');
      expect(button).toHaveAttribute('data-size', 'md');
      expect(button).toHaveAttribute('data-full-width', 'true');
    });
  });
});

describe('SkeletonCommentCard', () => {
  describe('Basic Rendering', () => {
    it('should render comment card skeleton', () => {
      const { container } = render(<SkeletonCommentCard />);
      const comment = container.firstChild;
      expect(comment).toBeInTheDocument();
      expect(comment).toHaveClass('py-3');
    });

    it('should apply custom className', () => {
      const { container } = render(<SkeletonCommentCard className="custom-comment" />);
      expect(container.firstChild).toHaveClass('custom-comment');
    });
  });

  describe('Depth/Nesting', () => {
    it('should render with no padding for depth 0', () => {
      const { container } = render(<SkeletonCommentCard depth={0} />);
      const comment = container.firstChild;
      expect(comment).toHaveStyle({ paddingLeft: '0px' });
    });

    it('should render with padding for depth 1', () => {
      const { container } = render(<SkeletonCommentCard depth={1} />);
      const comment = container.firstChild;
      expect(comment).toHaveStyle({ paddingLeft: '16px' });
    });

    it('should render with padding for depth 2', () => {
      const { container } = render(<SkeletonCommentCard depth={2} />);
      const comment = container.firstChild;
      expect(comment).toHaveStyle({ paddingLeft: '32px' });
    });

    it('should render with padding for depth 3', () => {
      const { container } = render(<SkeletonCommentCard depth={3} />);
      const comment = container.firstChild;
      expect(comment).toHaveStyle({ paddingLeft: '48px' });
    });

    it('should calculate correct padding for large depth', () => {
      const { container } = render(<SkeletonCommentCard depth={5} />);
      const comment = container.firstChild;
      expect(comment).toHaveStyle({ paddingLeft: '80px' });
    });
  });

  describe('Avatar and Content', () => {
    it('should render small circle for avatar', () => {
      render(<SkeletonCommentCard />);
      const circle = screen.getByTestId('skeleton-circle');
      expect(circle).toHaveAttribute('data-size', 'sm');
    });

    it('should render comment text with 2 lines', () => {
      render(<SkeletonCommentCard />);
      const text = screen.getByTestId('skeleton-text');
      expect(text).toHaveAttribute('data-lines', '2');
      expect(text).toHaveAttribute('data-spacing', 'xs');
    });
  });

  describe('Comment Actions', () => {
    it('should render action skeletons', () => {
      render(<SkeletonCommentCard />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});

describe('Accessibility', () => {
  it('SkeletonCard should be accessible', () => {
    render(<SkeletonCard />);
    const loadingElements = screen.getAllByRole('status');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('SkeletonPostCard should be accessible', () => {
    render(<SkeletonPostCard />);
    const loadingElements = screen.getAllByRole('status');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('SkeletonCommunityCard should be accessible', () => {
    render(<SkeletonCommunityCard />);
    const loadingElements = screen.getAllByRole('status');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('SkeletonUserCard should be accessible', () => {
    render(<SkeletonUserCard />);
    const loadingElements = screen.getAllByRole('status');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('SkeletonCommentCard should be accessible', () => {
    render(<SkeletonCommentCard />);
    const loadingElements = screen.getAllByRole('status');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});

export default card
