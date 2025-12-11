import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from './ProgressIndicator';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    circle: ({ children, className, initial, animate, transition, ...props }) => (
      <circle className={className} {...props}>
        {children}
      </circle>
    ),
  },
}));

describe('ProgressIndicator', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<ProgressIndicator />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('should render as a bar variant by default', () => {
      const { container } = render(<ProgressIndicator />);
      const barContainer = container.querySelector('.bg-gray-700.rounded-full');
      expect(barContainer).toBeInTheDocument();
    });

    it('should render with provided value', () => {
      render(<ProgressIndicator value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should render with provided max value', () => {
      render(<ProgressIndicator value={50} max={200} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '200');
    });

    it('should render with label', () => {
      render(<ProgressIndicator label="" />);
      expect(screen.getByText('')).toBeInTheDocument();
    });
  });

  describe('Percentage Display', () => {
    it('should display percentage by default', () => {
      render(<ProgressIndicator value={50} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should hide percentage when showPercentage is false', () => {
      render(<ProgressIndicator value={50} showPercentage={false} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should calculate percentage correctly', () => {
      render(<ProgressIndicator value={25} max={100} />);
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should calculate percentage correctly with custom max', () => {
      render(<ProgressIndicator value={50} max={200} />);
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should round percentage to nearest integer', () => {
      render(<ProgressIndicator value={33.7} max={100} />);
      expect(screen.getByText('34%')).toBeInTheDocument();
    });

    it('should display 0% when value is 0', () => {
      render(<ProgressIndicator value={0} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display 100% when value equals max', () => {
      render(<ProgressIndicator value={100} max={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should cap percentage at 100% when value exceeds max', () => {
      render(<ProgressIndicator value={150} max={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should display 0% when value is negative', () => {
      render(<ProgressIndicator value={-10} max={100} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Linear Progress (Bar Variant)', () => {
    it('should render bar variant', () => {
      const { container } = render(<ProgressIndicator variant="bar" />);
      const progressBar = container.querySelector('.bg-blue-500.h-full.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render bar container with correct styles', () => {
      const { container } = render(<ProgressIndicator variant="bar" />);
      const barContainer = container.querySelector('.bg-gray-700.rounded-full.h-2');
      expect(barContainer).toBeInTheDocument();
    });

    it('should render label above bar when provided', () => {
      const { container } = render(<ProgressIndicator variant="bar" label="Progress" />);
      const labelContainer = container.querySelector('.flex.justify-between.mb-2');
      expect(labelContainer).toBeInTheDocument();
    });

    it('should display both label and percentage in bar variant', () => {
      render(<ProgressIndicator variant="bar" label="Loading" value={50} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should hide percentage in bar variant when showPercentage is false', () => {
      render(<ProgressIndicator variant="bar" label="Loading" value={50} showPercentage={false} />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });
  });

  describe('Circular Progress', () => {
    it('should render circular variant', () => {
      const { container } = render(<ProgressIndicator variant="circular" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render two circles in circular variant', () => {
      const { container } = render(<ProgressIndicator variant="circular" />);
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });

    it('should render background circle with gray color', () => {
      const { container } = render(<ProgressIndicator variant="circular" />);
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveClass('text-gray-700');
    });

    it('should render progress circle with blue color', () => {
      const { container } = render(<ProgressIndicator variant="circular" />);
      const circles = container.querySelectorAll('circle');
      expect(circles[1]).toHaveClass('text-blue-500');
    });

    it('should calculate circumference correctly for medium size', () => {
      const { container } = render(<ProgressIndicator variant="circular" size="md" />);
      const progressCircle = container.querySelectorAll('circle')[1];
      const expectedCircumference = 2 * Math.PI * 30;
      expect(progressCircle).toHaveAttribute('strokeDasharray', expectedCircumference.toString());
    });

    it('should display percentage below circular progress', () => {
      const { container } = render(<ProgressIndicator variant="circular" value={75} />);
      const percentage = screen.getByText('75%');
      expect(percentage).toBeInTheDocument();
    });

    it('should display label below percentage in circular variant', () => {
      render(<ProgressIndicator variant="circular" value={50} label="Uploading" />);
      expect(screen.getByText('Uploading')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should hide percentage in circular variant when showPercentage is false', () => {
      render(<ProgressIndicator variant="circular" value={50} showPercentage={false} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class to circular progress', () => {
      const { container } = render(<ProgressIndicator variant="circular" size="sm" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-12', 'h-12');
    });

    it('should apply medium size class to circular progress by default', () => {
      const { container } = render(<ProgressIndicator variant="circular" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-16', 'h-16');
    });

    it('should apply large size class to circular progress', () => {
      const { container } = render(<ProgressIndicator variant="circular" size="lg" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-24', 'h-24');
    });

    it('should use radius of 20 for small circular progress', () => {
      const { container } = render(<ProgressIndicator variant="circular" size="sm" />);
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('r', '20');
    });

    it('should use radius of 30 for medium circular progress', () => {
      const { container } = render(<ProgressIndicator variant="circular" size="md" />);
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('r', '30');
    });

    it('should use radius of 40 for large circular progress', () => {
      const { container } = render(<ProgressIndicator variant="circular" size="lg" />);
      const circles = container.querySelectorAll('circle');
      expect(circles[0]).toHaveAttribute('r', '40');
    });
  });

  describe('Accessibility', () => {
    it('should have progressbar role', () => {
      render(<ProgressIndicator value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should have aria-valuenow attribute', () => {
      render(<ProgressIndicator value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should have aria-valuemin attribute set to 0', () => {
      render(<ProgressIndicator value={50} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax attribute', () => {
      render(<ProgressIndicator value={50} max={100} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should update aria-valuenow when value changes', () => {
      const { rerender } = render(<ProgressIndicator value={30} />);
      let progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '30');

      rerender(<ProgressIndicator value={70} />);
      progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '70');
    });

    it('should have progressbar role in circular variant', () => {
      render(<ProgressIndicator variant="circular" value={50} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should maintain accessibility attributes in circular variant', () => {
      render(<ProgressIndicator variant="circular" value={50} max={200} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '200');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value', () => {
      render(<ProgressIndicator value={0} />);
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle value exceeding max', () => {
      render(<ProgressIndicator value={150} max={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle negative value', () => {
      render(<ProgressIndicator value={-50} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      render(<ProgressIndicator value={33.333} max={100} />);
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should handle very small max values', () => {
      render(<ProgressIndicator value={0.5} max={1} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should render without label', () => {
      const { container } = render(<ProgressIndicator value={50} />);
      const labelContainer = container.querySelector('.flex.justify-between.mb-2');
      expect(labelContainer).not.toBeInTheDocument();
    });
  });
});

export default progressbar
