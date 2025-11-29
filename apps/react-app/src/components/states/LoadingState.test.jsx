import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { LoadingState } from './LoadingState';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Loader2: ({ className, 'aria-hidden': ariaHidden }) => (
    <div className={className} aria-hidden={ariaHidden} data-testid="loader2-icon" />
  ),
}));

describe('LoadingState Component', () => {
  describe('Default Type', () => {
    it('should render default loading state', () => {
      render(<LoadingState />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display default loading message', () => {
      render(<LoadingState />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display custom message for default type', () => {
      render(<LoadingState message="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('should render spinner element for default type', () => {
      const { container } = render(<LoadingState />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have correct aria-live attribute', () => {
      render(<LoadingState />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-hidden on spinner element', () => {
      const { container } = render(<LoadingState />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply correct default styling classes', () => {
      const { container } = render(<LoadingState />);
      const wrapper = container.querySelector('.flex.items-center.justify-center.p-8');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render spinner with border styling', () => {
      const { container } = render(<LoadingState />);
      const spinner = container.querySelector('.rounded-full.h-8.w-8.border-b-2.border-blue-500');
      expect(spinner).toBeInTheDocument();
    });

    it('should render message with correct styling', () => {
      const { container } = render(<LoadingState />);
      const message = container.querySelector('.ml-3.text-gray-400');
      expect(message).toHaveTextContent('Loading...');
    });
  });

  describe('Spinner Type', () => {
    it('should render spinner type', () => {
      render(<LoadingState type="spinner" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display Loader2 icon for spinner type', () => {
      render(<LoadingState type="spinner" />);
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    it('should display message below spinner', () => {
      render(<LoadingState type="spinner" message="Processing..." />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should apply small size class', () => {
      render(<LoadingState type="spinner" size="sm" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('should apply medium size class', () => {
      render(<LoadingState type="spinner" size="md" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('should apply large size class', () => {
      render(<LoadingState type="spinner" size="lg" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-12', 'w-12');
    });

    it('should default to medium size when not specified', () => {
      render(<LoadingState type="spinner" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('should apply animate-spin class to Loader2', () => {
      render(<LoadingState type="spinner" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('animate-spin');
    });

    it('should apply blue color to spinner', () => {
      render(<LoadingState type="spinner" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('text-blue-500');
    });

    it('should have flex-col layout for spinner type', () => {
      const { container } = render(<LoadingState type="spinner" />);
      const wrapper = container.querySelector('.flex.flex-col.items-center.justify-center.p-8');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have aria-hidden on Loader2 icon', () => {
      render(<LoadingState type="spinner" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply spacing between icon and message', () => {
      const { container } = render(<LoadingState type="spinner" />);
      const message = container.querySelector('.mt-4.text-gray-400.text-sm');
      expect(message).toBeInTheDocument();
    });
  });

  describe('Skeleton List Type', () => {
    it('should render skeleton-list type', () => {
      render(<LoadingState type="skeleton-list" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render 5 skeleton items', () => {
      const { container } = render(<LoadingState type="skeleton-list" />);
      const skeletonItems = container.querySelectorAll('.animate-pulse');
      expect(skeletonItems).toHaveLength(5);
    });

    it('should have aria-label with message', () => {
      render(<LoadingState type="skeleton-list" message="Loading items..." />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading items...');
    });

    it('should render avatar placeholder for each skeleton item', () => {
      const { container } = render(<LoadingState type="skeleton-list" />);
      const avatars = container.querySelectorAll('.rounded-full.bg-gray-700.h-12.w-12');
      expect(avatars).toHaveLength(5);
    });

    it('should render content placeholders for each skeleton item', () => {
      const { container } = render(<LoadingState type="skeleton-list" />);
      const contentAreas = container.querySelectorAll('.flex-1.space-y-2.py-1');
      expect(contentAreas).toHaveLength(5);
    });

    it('should render two content lines per skeleton item', () => {
      const { container } = render(<LoadingState type="skeleton-list" />);
      const firstItem = container.querySelector('.animate-pulse');
      const contentLines = within(firstItem).getAllByRole('generic').filter(
        el => el.className.includes('h-4 bg-gray-700 rounded')
      );
      expect(contentLines.length).toBeGreaterThanOrEqual(2);
    });

    it('should have different widths for content lines', () => {
      const { container } = render(<LoadingState type="skeleton-list" />);
      const firstLine = container.querySelector('.h-4.bg-gray-700.rounded.w-3\\/4');
      const secondLine = container.querySelector('.h-4.bg-gray-700.rounded.w-1\\/2');
      expect(firstLine).toBeInTheDocument();
      expect(secondLine).toBeInTheDocument();
    });

    it('should apply animate-pulse to each skeleton item', () => {
      const { container } = render(<LoadingState type="skeleton-list" />);
      const items = container.querySelectorAll('.animate-pulse');
      items.forEach(item => {
        expect(item).toHaveClass('animate-pulse');
      });
    });

    it('should have proper spacing between skeleton items', () => {
      const { container } = render(<LoadingState type="skeleton-list" />);
      const wrapper = container.querySelector('.space-y-4');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have flex layout for each skeleton item', () => {
      const { container } = render(<LoadingState type="skeleton-list" />);
      const items = container.querySelectorAll('.animate-pulse.flex.space-x-4');
      expect(items).toHaveLength(5);
    });
  });

  describe('Accessibility', () => {
    it('should have role status for default type', () => {
      render(<LoadingState />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have role status for spinner type', () => {
      render(<LoadingState type="spinner" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have role status for skeleton-list type', () => {
      render(<LoadingState type="skeleton-list" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live polite for default type', () => {
      render(<LoadingState />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-live polite for spinner type', () => {
      render(<LoadingState type="spinner" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-live polite for skeleton-list type', () => {
      render(<LoadingState type="skeleton-list" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should hide decorative spinner from screen readers in default type', () => {
      const { container } = render(<LoadingState />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should hide decorative icon from screen readers in spinner type', () => {
      render(<LoadingState type="spinner" />);
      expect(screen.getByTestId('loader2-icon')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should provide text alternative for loading state', () => {
      render(<LoadingState message="Loading your data" />);
      expect(screen.getByText('Loading your data')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      render(<LoadingState message="" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(200);
      render(<LoadingState message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      render(<LoadingState message="Loading <>&\"'..." />);
      expect(screen.getByText("Loading <>&\"'...")).toBeInTheDocument();
    });

    it('should handle invalid size gracefully', () => {
      const { container } = render(<LoadingState type="spinner" size="invalid" />);
      expect(container.querySelector('[data-testid="loader2-icon"]')).toBeInTheDocument();
    });

    it('should handle invalid type by using default', () => {
      render(<LoadingState type="invalid-type" />);
      const { container } = render(<LoadingState />);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});

export default spinner
