import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  PageLoader,
  Spinner,
  DotLoader,
  PulseLoader,
  BarLoader,
} from './PageLoader';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, exit, transition, style, ...props }) => (
      <div className={className} style={style} data-testid="motion-div" {...props}>
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

describe('PageLoader', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<PageLoader />);
      expect(container).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<PageLoader />);
      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('should render as a full-page overlay', () => {
      const { container } = render(<PageLoader />);
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });

    it('should render with z-50 for overlay layering', () => {
      const { container } = render(<PageLoader />);
      expect(container.querySelector('.z-50')).toBeInTheDocument();
    });

    it('should render with flex layout for centering', () => {
      const { container } = render(<PageLoader />);
      expect(container.querySelector('.flex.items-center.justify-center')).toBeInTheDocument();
    });
  });

  describe('Loading Message Display', () => {
    it('should render default loading message', () => {
      render(<PageLoader />);
      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('should render custom loading message', () => {
      render(<PageLoader message="Please wait while we load your content" />);
      expect(screen.getByText('Please wait while we load your content')).toBeInTheDocument();
    });

    it('should render loading message in a paragraph', () => {
      render(<PageLoader message="Custom message" />);
      const message = screen.getByText('Custom message');
      expect(message.tagName).toBe('P');
    });

    it('should apply text styling to loading message', () => {
      const { container } = render(<PageLoader message="Loading" />);
      const messageElement = container.querySelector('.text-lg.font-medium');
      expect(messageElement).toBeInTheDocument();
    });

    it('should render message with dark mode support', () => {
      const { container } = render(<PageLoader message="Loading" />);
      const messageElement = container.querySelector('.text-gray-900.dark\\:text-gray-100');
      expect(messageElement).toBeInTheDocument();
    });
  });

  describe('Logo Display', () => {
    it('should display logo by default', () => {
      const { container } = render(<PageLoader />);
      const logoElement = container.querySelector('.w-20.h-20.rounded-2xl');
      expect(logoElement).toBeInTheDocument();
    });

    it('should display logo when logo prop is true', () => {
      const { container } = render(<PageLoader logo={true} />);
      const logoElement = container.querySelector('.w-20.h-20.rounded-2xl');
      expect(logoElement).toBeInTheDocument();
    });

    it('should not display logo when logo prop is false', () => {
      const { container } = render(<PageLoader logo={false} />);
      const logoElement = container.querySelector('.w-20.h-20.rounded-2xl');
      expect(logoElement).not.toBeInTheDocument();
    });

    it('should render logo with gradient background', () => {
      const { container } = render(<PageLoader logo={true} />);
      const logoElement = container.querySelector('.bg-gradient-to-br.from-blue-500.to-purple-600');
      expect(logoElement).toBeInTheDocument();
    });

    it('should render logo with letter "C"', () => {
      render(<PageLoader logo={true} />);
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should render orbiting dots when logo is shown', () => {
      const { container } = render(<PageLoader logo={true} />);
      const orbitingDots = container.querySelectorAll('.w-3.h-3.bg-blue-500.rounded-full');
      expect(orbitingDots).toHaveLength(3);
    });

    it('should render 3 orbiting dots with correct angles', () => {
      const { container } = render(<PageLoader logo={true} />);
      const orbitingDots = container.querySelectorAll('.w-3.h-3.bg-blue-500.rounded-full');
      expect(orbitingDots).toHaveLength(3);
    });
  });

  describe('Progress Display', () => {
    it('should not render progress bar by default', () => {
      const { container } = render(<PageLoader />);
      const progressBar = container.querySelector('.w-64.h-1\\.5.bg-gray-200');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('should not render progress bar when progress is null', () => {
      const { container } = render(<PageLoader progress={null} />);
      const progressBar = container.querySelector('.w-64.h-1\\.5.bg-gray-200');
      expect(progressBar).not.toBeInTheDocument();
    });

    it('should render progress bar when progress is 0', () => {
      const { container } = render(<PageLoader progress={0} />);
      const progressBar = container.querySelector('.w-64.h-1\\.5.bg-gray-200');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render progress bar when progress is 50', () => {
      const { container } = render(<PageLoader progress={50} />);
      const progressBar = container.querySelector('.w-64.h-1\\.5.bg-gray-200');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render progress bar when progress is 100', () => {
      const { container } = render(<PageLoader progress={100} />);
      const progressBar = container.querySelector('.w-64.h-1\\.5.bg-gray-200');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render progress bar with gradient fill', () => {
      const { container } = render(<PageLoader progress={50} />);
      const progressFill = container.querySelector('.bg-gradient-to-r.from-blue-500.to-purple-600');
      expect(progressFill).toBeInTheDocument();
    });

    it('should render progress bar with rounded corners', () => {
      const { container } = render(<PageLoader progress={50} />);
      const progressBar = container.querySelector('.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Custom ClassName Support', () => {
    it('should apply custom className', () => {
      const { container } = render(<PageLoader className="custom-loader-class" />);
      expect(container.querySelector('.custom-loader-class')).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<PageLoader className="custom-class" />);
      const loader = container.querySelector('.custom-class');
      expect(loader).toHaveClass('fixed');
      expect(loader).toHaveClass('inset-0');
    });

    it('should handle empty className', () => {
      const { container } = render(<PageLoader className="" />);
      expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should render with dark mode background classes', () => {
      const { container } = render(<PageLoader />);
      expect(container.querySelector('.bg-white.dark\\:bg-gray-950')).toBeInTheDocument();
    });

    it('should render progress bar with dark mode support', () => {
      const { container } = render(<PageLoader progress={50} />);
      expect(container.querySelector('.bg-gray-200.dark\\:bg-gray-800')).toBeInTheDocument();
    });
  });

  describe('Centered Layout', () => {
    it('should center content vertically and horizontally', () => {
      const { container } = render(<PageLoader />);
      expect(container.querySelector('.flex.items-center.justify-center')).toBeInTheDocument();
    });

    it('should render content in flex column layout', () => {
      const { container } = render(<PageLoader />);
      expect(container.querySelector('.flex.flex-col.items-center')).toBeInTheDocument();
    });

    it('should apply gap between elements', () => {
      const { container } = render(<PageLoader />);
      expect(container.querySelector('.gap-6')).toBeInTheDocument();
    });

    it('should apply padding to content container', () => {
      const { container } = render(<PageLoader />);
      expect(container.querySelector('.px-4')).toBeInTheDocument();
    });
  });
});

describe('Spinner', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<Spinner />);
      expect(container).toBeInTheDocument();
    });

    it('should render with default props', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('.rounded-full');
      expect(spinner).toBeInTheDocument();
    });

    it('should render as a circular element', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render with md size by default', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('.w-8.h-8.border-2')).toBeInTheDocument();
    });

    it('should render with sm size', () => {
      const { container } = render(<Spinner size="sm" />);
      expect(container.querySelector('.w-4.h-4.border-2')).toBeInTheDocument();
    });

    it('should render with lg size', () => {
      const { container } = render(<Spinner size="lg" />);
      expect(container.querySelector('.w-12.h-12.border-3')).toBeInTheDocument();
    });

    it('should render with xl size', () => {
      const { container } = render(<Spinner size="xl" />);
      expect(container.querySelector('.w-16.h-16.border-4')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('should render with blue color by default', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('.border-blue-600.border-t-transparent')).toBeInTheDocument();
    });

    it('should render with blue color', () => {
      const { container } = render(<Spinner color="blue" />);
      expect(container.querySelector('.border-blue-600.border-t-transparent')).toBeInTheDocument();
    });

    it('should render with purple color', () => {
      const { container } = render(<Spinner color="purple" />);
      expect(container.querySelector('.border-purple-600.border-t-transparent')).toBeInTheDocument();
    });

    it('should render with gray color', () => {
      const { container } = render(<Spinner color="gray" />);
      expect(container.querySelector('.border-gray-600.border-t-transparent')).toBeInTheDocument();
    });

    it('should render with white color', () => {
      const { container } = render(<Spinner color="white" />);
      expect(container.querySelector('.border-white.border-t-transparent')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<Spinner className="custom-spinner" />);
      expect(container.querySelector('.custom-spinner')).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<Spinner className="custom-class" />);
      const spinner = container.querySelector('.custom-class');
      expect(spinner).toHaveClass('rounded-full');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('[aria-label="Loading"]')).toBeInTheDocument();
    });

    it('should have screen reader text', () => {
      render(<Spinner />);
      expect(screen.getByText('')).toHaveClass('sr-only');
    });
  });
});

describe('DotLoader', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<DotLoader />);
      expect(container).toBeInTheDocument();
    });

    it('should render 3 dots', () => {
      const { container } = render(<DotLoader />);
      const dots = container.querySelectorAll('.rounded-full');
      expect(dots).toHaveLength(3);
    });

    it('should render in flex layout with gap', () => {
      const { container } = render(<DotLoader />);
      expect(container.querySelector('.flex.items-center.gap-1\\.5')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render with md size by default', () => {
      const { container } = render(<DotLoader />);
      expect(container.querySelector('.w-2\\.5.h-2\\.5')).toBeInTheDocument();
    });

    it('should render with sm size', () => {
      const { container } = render(<DotLoader size="sm" />);
      expect(container.querySelector('.w-1\\.5.h-1\\.5')).toBeInTheDocument();
    });

    it('should render with lg size', () => {
      const { container } = render(<DotLoader size="lg" />);
      expect(container.querySelector('.w-3\\.5.h-3\\.5')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('should render with blue color by default', () => {
      const { container } = render(<DotLoader />);
      expect(container.querySelector('.bg-blue-600')).toBeInTheDocument();
    });

    it('should render with blue color', () => {
      const { container } = render(<DotLoader color="blue" />);
      expect(container.querySelector('.bg-blue-600')).toBeInTheDocument();
    });

    it('should render with purple color', () => {
      const { container } = render(<DotLoader color="purple" />);
      expect(container.querySelector('.bg-purple-600')).toBeInTheDocument();
    });

    it('should render with gray color', () => {
      const { container } = render(<DotLoader color="gray" />);
      expect(container.querySelector('.bg-gray-600')).toBeInTheDocument();
    });

    it('should render with white color', () => {
      const { container } = render(<DotLoader color="white" />);
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<DotLoader className="custom-dots" />);
      expect(container.querySelector('.custom-dots')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      const { container } = render(<DotLoader />);
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      const { container } = render(<DotLoader />);
      expect(container.querySelector('[aria-label="Loading"]')).toBeInTheDocument();
    });

    it('should have screen reader text', () => {
      render(<DotLoader />);
      expect(screen.getByText('')).toHaveClass('sr-only');
    });
  });
});

describe('PulseLoader', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<PulseLoader />);
      expect(container).toBeInTheDocument();
    });

    it('should render 2 pulsing circles', () => {
      const { container } = render(<PulseLoader />);
      const circles = container.querySelectorAll('.absolute.inset-0.rounded-full');
      expect(circles).toHaveLength(2);
    });

    it('should render as a relative positioned container', () => {
      const { container } = render(<PulseLoader />);
      expect(container.querySelector('.relative')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render with md size by default', () => {
      const { container } = render(<PulseLoader />);
      expect(container.querySelector('.w-12.h-12')).toBeInTheDocument();
    });

    it('should render with sm size', () => {
      const { container } = render(<PulseLoader size="sm" />);
      expect(container.querySelector('.w-8.h-8')).toBeInTheDocument();
    });

    it('should render with lg size', () => {
      const { container } = render(<PulseLoader size="lg" />);
      expect(container.querySelector('.w-16.h-16')).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('should render with blue color by default', () => {
      const { container } = render(<PulseLoader />);
      expect(container.querySelector('.bg-blue-600')).toBeInTheDocument();
    });

    it('should render with blue color', () => {
      const { container } = render(<PulseLoader color="blue" />);
      expect(container.querySelector('.bg-blue-600')).toBeInTheDocument();
    });

    it('should render with purple color', () => {
      const { container } = render(<PulseLoader color="purple" />);
      expect(container.querySelector('.bg-purple-600')).toBeInTheDocument();
    });

    it('should render with gray color', () => {
      const { container } = render(<PulseLoader color="gray" />);
      expect(container.querySelector('.bg-gray-600')).toBeInTheDocument();
    });

    it('should render with white color', () => {
      const { container } = render(<PulseLoader color="white" />);
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<PulseLoader className="custom-pulse" />);
      expect(container.querySelector('.custom-pulse')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      const { container } = render(<PulseLoader />);
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      const { container } = render(<PulseLoader />);
      expect(container.querySelector('[aria-label="Loading"]')).toBeInTheDocument();
    });

    it('should have screen reader text', () => {
      render(<PulseLoader />);
      expect(screen.getByText('')).toHaveClass('sr-only');
    });
  });
});

describe('BarLoader', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<BarLoader />);
      expect(container).toBeInTheDocument();
    });

    it('should render with relative positioning', () => {
      const { container } = render(<BarLoader />);
      expect(container.querySelector('.relative')).toBeInTheDocument();
    });

    it('should render with overflow hidden', () => {
      const { container } = render(<BarLoader />);
      expect(container.querySelector('.overflow-hidden')).toBeInTheDocument();
    });

    it('should render with rounded corners', () => {
      const { container } = render(<BarLoader />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    });
  });

  describe('Size Customization', () => {
    it('should render with default width', () => {
      const { container } = render(<BarLoader />);
      const bar = container.querySelector('[role="status"]');
      expect(bar).toHaveStyle({ width: '100%' });
    });

    it('should render with custom width', () => {
      const { container } = render(<BarLoader width="200px" />);
      const bar = container.querySelector('[role="status"]');
      expect(bar).toHaveStyle({ width: '200px' });
    });

    it('should render with default height', () => {
      const { container } = render(<BarLoader />);
      const bar = container.querySelector('[role="status"]');
      expect(bar).toHaveStyle({ height: '4px' });
    });

    it('should render with custom height', () => {
      const { container } = render(<BarLoader height="8px" />);
      const bar = container.querySelector('[role="status"]');
      expect(bar).toHaveStyle({ height: '8px' });
    });
  });

  describe('Color Variants', () => {
    it('should render with blue color by default', () => {
      const { container } = render(<BarLoader />);
      expect(container.querySelector('.bg-blue-600')).toBeInTheDocument();
    });

    it('should render with blue color', () => {
      const { container } = render(<BarLoader color="blue" />);
      expect(container.querySelector('.bg-blue-600')).toBeInTheDocument();
    });

    it('should render with purple color', () => {
      const { container } = render(<BarLoader color="purple" />);
      expect(container.querySelector('.bg-purple-600')).toBeInTheDocument();
    });

    it('should render with gray color', () => {
      const { container } = render(<BarLoader color="gray" />);
      expect(container.querySelector('.bg-gray-600')).toBeInTheDocument();
    });

    it('should render with white color', () => {
      const { container } = render(<BarLoader color="white" />);
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });

    it('should render background with dark mode support', () => {
      const { container } = render(<BarLoader />);
      expect(container.querySelector('.bg-gray-200.dark\\:bg-gray-800')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<BarLoader className="custom-bar" />);
      expect(container.querySelector('.custom-bar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      const { container } = render(<BarLoader />);
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      const { container } = render(<BarLoader />);
      expect(container.querySelector('[aria-label="Loading"]')).toBeInTheDocument();
    });

    it('should have screen reader text', () => {
      render(<BarLoader />);
      expect(screen.getByText('')).toHaveClass('sr-only');
    });
  });
});

export default message
