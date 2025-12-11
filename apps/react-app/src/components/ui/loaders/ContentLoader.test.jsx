import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ContentLoader,
  InlineLoader,
  ButtonLoader,
  InfiniteLoader,
  LoadingOverlay,
  CardLoader,
  ListLoader,
} from './ContentLoader';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, exit, transition, ...props }) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    p: ({ children, className, initial, animate, transition, ...props }) => (
      <p className={className} data-testid="motion-p" {...props}>
        {children}
      </p>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock PageLoader components
jest.mock('./PageLoader', () => ({
  Spinner: ({ size, color, className }) => (
    <div
      data-testid="spinner"
      data-size={size}
      data-color={color}
      className={className}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only"></span>
    </div>
  ),
  DotLoader: ({ size, className }) => (
    <div
      data-testid="dot-loader"
      data-size={size}
      className={className}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only"></span>
    </div>
  ),
}));

describe('ContentLoader', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ContentLoader />);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('should render without crashing', () => {
      const { container } = render(<ContentLoader />);
      expect(container).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<ContentLoader message="Custom loading message" />);
      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });

    it('should render without message when message is empty string', () => {
      render(<ContentLoader message="" />);
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
    });

    it('should render without message when message is null', () => {
      render(<ContentLoader message={null} />);
      expect(screen.queryByTestId('motion-p')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<ContentLoader className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Loader Types', () => {
    it('should render spinner type by default', () => {
      render(<ContentLoader />);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should render spinner type when explicitly set', () => {
      render(<ContentLoader type="spinner" />);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should render dots type', () => {
      render(<ContentLoader type="dots" />);
      expect(screen.getByTestId('dot-loader')).toBeInTheDocument();
    });

    it('should render pulse type', () => {
      const { container } = render(<ContentLoader type="pulse" />);
      const pulseElement = container.querySelector('.w-12.h-12.rounded-full.bg-blue-600');
      expect(pulseElement).toBeInTheDocument();
    });

    it('should not render spinner when type is dots', () => {
      render(<ContentLoader type="dots" />);
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('should not render dots when type is spinner', () => {
      render(<ContentLoader type="spinner" />);
      expect(screen.queryByTestId('dot-loader')).not.toBeInTheDocument();
    });

    it('should not render pulse when type is spinner', () => {
      const { container } = render(<ContentLoader type="spinner" />);
      const pulseElement = container.querySelector('.w-12.h-12.rounded-full.bg-blue-600');
      expect(pulseElement).not.toBeInTheDocument();
    });
  });

  describe('Center Positioning', () => {
    it('should center content by default', () => {
      const { container } = render(<ContentLoader />);
      expect(
        container.querySelector('.flex.items-center.justify-center.min-h-\\[300px\\]')
      ).toBeInTheDocument();
    });

    it('should center content when center is true', () => {
      const { container } = render(<ContentLoader center={true} />);
      expect(
        container.querySelector('.flex.items-center.justify-center.min-h-\\[300px\\]')
      ).toBeInTheDocument();
    });

    it('should not center content when center is false', () => {
      const { container } = render(<ContentLoader center={false} />);
      expect(
        container.querySelector('.flex.items-center.justify-center.min-h-\\[300px\\]')
      ).not.toBeInTheDocument();
    });
  });

  describe('Overlay Mode', () => {
    it('should not render overlay by default', () => {
      const { container } = render(<ContentLoader />);
      expect(container.querySelector('.absolute.inset-0')).not.toBeInTheDocument();
    });

    it('should render overlay when overlay is true', () => {
      const { container } = render(<ContentLoader overlay={true} />);
      expect(container.querySelector('.absolute.inset-0')).toBeInTheDocument();
    });

    it('should render overlay with backdrop blur', () => {
      const { container } = render(<ContentLoader overlay={true} />);
      expect(container.querySelector('.backdrop-blur-sm')).toBeInTheDocument();
    });

    it('should render overlay with z-10', () => {
      const { container } = render(<ContentLoader overlay={true} />);
      expect(container.querySelector('.z-10')).toBeInTheDocument();
    });

    it('should not render center wrapper when overlay is true', () => {
      const { container } = render(<ContentLoader overlay={true} center={true} />);
      expect(
        container.querySelector('.flex.items-center.justify-center.min-h-\\[300px\\]')
      ).not.toBeInTheDocument();
    });
  });

  describe('Spinner Size', () => {
    it('should render spinner with lg size', () => {
      render(<ContentLoader type="spinner" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'lg');
    });

    it('should render dot loader with lg size', () => {
      render(<ContentLoader type="dots" />);
      const dotLoader = screen.getByTestId('dot-loader');
      expect(dotLoader).toHaveAttribute('data-size', 'lg');
    });
  });
});

describe('InlineLoader', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<InlineLoader />);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should render without message by default', () => {
      const { container } = render(<InlineLoader />);
      expect(container.querySelector('span.text-sm')).not.toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<InlineLoader message="Processing data" />);
      expect(screen.getByText('Processing data')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<InlineLoader className="inline-custom" />);
      expect(container.querySelector('.inline-custom')).toBeInTheDocument();
    });

    it('should render in flex layout with gap', () => {
      const { container } = render(<InlineLoader />);
      expect(container.querySelector('.flex.items-center.gap-2')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render with sm size by default', () => {
      render(<InlineLoader />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'sm');
    });

    it('should render with custom size', () => {
      render(<InlineLoader size="md" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'md');
    });

    it('should render with lg size', () => {
      render(<InlineLoader size="lg" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'lg');
    });
  });
});

describe('ButtonLoader', () => {
  describe('Rendering', () => {
    it('should render spinner', () => {
      render(<ButtonLoader />);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<ButtonLoader className="button-custom" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveClass('button-custom');
    });
  });

  describe('Size Variants', () => {
    it('should render with sm size by default', () => {
      render(<ButtonLoader />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'sm');
    });

    it('should render with custom size', () => {
      render(<ButtonLoader size="md" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'md');
    });
  });

  describe('Color Variants', () => {
    it('should render with white color by default', () => {
      render(<ButtonLoader />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-color', 'white');
    });

    it('should render with custom color', () => {
      render(<ButtonLoader color="blue" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-color', 'blue');
    });

    it('should render with black color', () => {
      render(<ButtonLoader color="black" />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-color', 'black');
    });
  });
});

describe('InfiniteLoader', () => {
  describe('Rendering', () => {
    it('should render with default message', () => {
      render(<InfiniteLoader />);
      expect(screen.getByText('Loading more...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<InfiniteLoader message="Fetching more items..." />);
      expect(screen.getByText('Fetching more items...')).toBeInTheDocument();
    });

    it('should render spinner with md size', () => {
      render(<InfiniteLoader />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'md');
    });

    it('should apply custom className', () => {
      const { container } = render(<InfiniteLoader className="infinite-custom" />);
      expect(container.querySelector('.infinite-custom')).toBeInTheDocument();
    });

    it('should render with vertical padding', () => {
      const { container } = render(<InfiniteLoader />);
      expect(container.querySelector('.py-8')).toBeInTheDocument();
    });
  });
});

describe('LoadingOverlay', () => {
  describe('Rendering', () => {
    it('should render with default message', () => {
      render(<LoadingOverlay />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingOverlay message="Saving changes..." />);
      expect(screen.getByText('Saving changes...')).toBeInTheDocument();
    });

    it('should render spinner with xl size', () => {
      render(<LoadingOverlay />);
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveAttribute('data-size', 'xl');
    });

    it('should render fixed overlay', () => {
      const { container } = render(<LoadingOverlay />);
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });

    it('should render with z-50', () => {
      const { container } = render(<LoadingOverlay />);
      expect(container.querySelector('.z-50')).toBeInTheDocument();
    });

    it('should render with backdrop blur', () => {
      const { container } = render(<LoadingOverlay />);
      expect(container.querySelector('.backdrop-blur-sm')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<LoadingOverlay className="overlay-custom" />);
      expect(container.querySelector('.overlay-custom')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should not render progress bar by default', () => {
      render(<LoadingOverlay />);
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('should render progress bar when progress is 0', () => {
      render(<LoadingOverlay progress={0} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should render progress bar with custom value', () => {
      render(<LoadingOverlay progress={50} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render progress bar at 100%', () => {
      render(<LoadingOverlay progress={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should not render progress bar when progress is null', () => {
      render(<LoadingOverlay progress={null} />);
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });
  });
});

describe('CardLoader', () => {
  describe('Rendering', () => {
    it('should render 3 cards by default', () => {
      const { container } = render(<CardLoader />);
      const cards = container.querySelectorAll('.bg-white');
      expect(cards).toHaveLength(3);
    });

    it('should render custom count of cards', () => {
      const { container } = render(<CardLoader count={5} />);
      const cards = container.querySelectorAll('.bg-white');
      expect(cards).toHaveLength(5);
    });

    it('should render single card', () => {
      const { container } = render(<CardLoader count={1} />);
      const cards = container.querySelectorAll('.bg-white');
      expect(cards).toHaveLength(1);
    });

    it('should apply custom className', () => {
      const { container } = render(<CardLoader className="card-custom" />);
      expect(container.querySelector('.card-custom')).toBeInTheDocument();
    });

    it('should render cards with space-y-4', () => {
      const { container } = render(<CardLoader />);
      expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    });
  });

  describe('Card Structure', () => {
    it('should render avatar placeholder in each card', () => {
      const { container } = render(<CardLoader count={2} />);
      const avatars = container.querySelectorAll('.w-10.h-10.bg-gray-200.rounded-full');
      expect(avatars).toHaveLength(2);
    });

    it('should render text placeholders in each card', () => {
      const { container } = render(<CardLoader count={1} />);
      const placeholders = container.querySelectorAll('.');
      expect(placeholders.length).toBeGreaterThan(0);
    });

    it('should render cards with rounded-xl', () => {
      const { container } = render(<CardLoader count={1} />);
      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('should render cards with border', () => {
      const { container } = render(<CardLoader count={1} />);
      expect(container.querySelector('.border')).toBeInTheDocument();
    });

    it('should render cards with padding', () => {
      const { container } = render(<CardLoader count={1} />);
      expect(container.querySelector('.p-6')).toBeInTheDocument();
    });
  });
});

describe('ListLoader', () => {
  describe('Rendering', () => {
    it('should render 5 items by default', () => {
      const { container } = render(<ListLoader />);
      const items = container.querySelectorAll('.flex.items-center.gap-4.py-3');
      expect(items).toHaveLength(5);
    });

    it('should render custom count of items', () => {
      const { container } = render(<ListLoader count={3} />);
      const items = container.querySelectorAll('.flex.items-center.gap-4.py-3');
      expect(items).toHaveLength(3);
    });

    it('should render single item', () => {
      const { container } = render(<ListLoader count={1} />);
      const items = container.querySelectorAll('.flex.items-center.gap-4.py-3');
      expect(items).toHaveLength(1);
    });

    it('should apply custom className', () => {
      const { container } = render(<ListLoader className="list-custom" />);
      expect(container.querySelector('.list-custom')).toBeInTheDocument();
    });

    it('should render with dividers', () => {
      const { container } = render(<ListLoader />);
      expect(container.querySelector('.divide-y')).toBeInTheDocument();
    });
  });

  describe('Avatar Display', () => {
    it('should show avatars by default', () => {
      const { container } = render(<ListLoader count={2} />);
      const avatars = container.querySelectorAll('.w-10.h-10.bg-gray-200.rounded-full');
      expect(avatars).toHaveLength(2);
    });

    it('should show avatars when showAvatar is true', () => {
      const { container } = render(<ListLoader count={2} showAvatar={true} />);
      const avatars = container.querySelectorAll('.w-10.h-10.bg-gray-200.rounded-full');
      expect(avatars).toHaveLength(2);
    });

    it('should not show avatars when showAvatar is false', () => {
      const { container } = render(<ListLoader count={2} showAvatar={false} />);
      const avatars = container.querySelectorAll('.w-10.h-10.bg-gray-200.rounded-full');
      expect(avatars).toHaveLength(0);
    });
  });

  describe('List Item Structure', () => {
    it('should render text placeholders in each item', () => {
      const { container } = render(<ListLoader count={1} />);
      const placeholders = container.querySelectorAll('.');
      expect(placeholders.length).toBeGreaterThan(0);
    });

    it('should render items with gap-4', () => {
      const { container } = render(<ListLoader count={1} />);
      expect(container.querySelector('.gap-4')).toBeInTheDocument();
    });

    it('should render items with py-3', () => {
      const { container } = render(<ListLoader count={1} />);
      expect(container.querySelector('.py-3')).toBeInTheDocument();
    });

    it('should render multiple text lines per item', () => {
      const { container } = render(<ListLoader count={1} />);
      const textLines = container.querySelectorAll('.h-4.bg-gray-200, .h-3.bg-gray-200');
      expect(textLines.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Accessibility', () => {
  it('should render ContentLoader with accessible structure', () => {
    const { container } = render(<ContentLoader message="Loading data" />);
    expect(container.querySelector('p')).toHaveTextContent('Loading data');
  });

  it('should render InlineLoader message in span', () => {
    render(<InlineLoader message="Loading" />);
    expect(screen.getByText('Loading').tagName).toBe('SPAN');
  });

  it('should render LoadingOverlay message in paragraph', () => {
    render(<LoadingOverlay message="Processing" />);
    expect(screen.getByText('Processing').tagName).toBe('P');
  });

  it('should render InfiniteLoader message in paragraph', () => {
    render(<InfiniteLoader message="Loading more" />);
    expect(screen.getByText('Loading more').tagName).toBe('P');
  });
});

export default pulseElement
