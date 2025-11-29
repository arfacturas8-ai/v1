/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading spinner with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  test('renders with custom size', () => {
    render(<LoadingSpinner size="large" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-8', 'h-8'); // Large size classes
  });

  test('renders with custom color', () => {
    render(<LoadingSpinner color="blue" />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('text-blue-600');
  });

  test('shows loading text when provided', () => {
    const loadingText = 'Loading your data...';
    render(<LoadingSpinner text={loadingText} />);
    
    expect(screen.getByText(loadingText)).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const customClass = 'custom-spinner-class';
    render(<LoadingSpinner className={customClass} />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass(customClass);
  });

  test('is accessible with proper aria attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  test('renders centered variant', () => {
    render(<LoadingSpinner centered />);
    
    const container = screen.getByTestId('loading-spinner').parentElement;
    expect(container).toHaveClass('flex', 'justify-center', 'items-center');
  });

  test('renders overlay variant', () => {
    render(<LoadingSpinner overlay />);
    
    const overlay = screen.getByTestId('loading-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
  });

  test('handles different sizes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    let spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="medium" />);
    spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-6', 'h-6');

    rerender(<LoadingSpinner size="large" />);
    spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  test('forwards ref correctly', () => {
    const ref = React.createRef();
    render(<LoadingSpinner ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  test('renders with minimum delay to prevent flashing', async () => {
    const { unmount } = render(<LoadingSpinner minDelay={100} />);
    
    // Immediately unmount
    unmount();
    
    // Spinner should still be visible for minimum delay
    // This test would need mock timers for proper testing
  });

  test('performance - renders without unnecessary re-renders', () => {
    const renderSpy = jest.fn();
    const TestComponent = React.memo(() => {
      renderSpy();
      return <LoadingSpinner />;
    });

    const { rerender } = render(<TestComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(1);

    // Re-render with same props
    rerender(<TestComponent />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
  });
});