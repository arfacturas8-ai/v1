/**
 * CRYB Design System - Badge Component Tests
 * Comprehensive test suite for Badge, BadgeGroup, and NotificationBadge components
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Badge, BadgeGroup, NotificationBadge } from './badge';
import { Star, Heart } from 'lucide-react';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const mockReact = require('react');
  return {
    motion: {
      div: mockReact.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
        mockReact.createElement('div', { ref, ...props }, children)
      )),
    },
    AnimatePresence: ({ children }: { children: any }) => children,
  };
});

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default variant and size', () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText('Default Badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render children text correctly', () => {
      render(<Badge>Test Content</Badge>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Badge className="custom-class">Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('should forward additional HTML attributes', () => {
      render(
        <Badge data-testid="custom-badge" aria-label="test-label">
          Badge
        </Badge>
      );
      const badge = screen.getByTestId('custom-badge');
      expect(badge).toHaveAttribute('aria-label', 'test-label');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should render destructive variant', () => {
      render(<Badge variant="destructive">Destructive</Badge>);
      const badge = screen.getByText('Destructive');
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-cryb-success', 'text-cryb-success-foreground');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-cryb-warning', 'text-cryb-warning-foreground');
    });

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('text-foreground', 'border', 'border-border');
    });

    it('should render muted variant', () => {
      render(<Badge variant="muted">Muted</Badge>);
      const badge = screen.getByText('Muted');
      expect(badge).toHaveClass('bg-muted', 'text-muted-foreground');
    });

    it('should render gradient variant', () => {
      render(<Badge variant="gradient">Gradient</Badge>);
      const badge = screen.getByText('Gradient');
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-primary', 'to-secondary');
    });

    it('should render gradient-cyan variant', () => {
      render(<Badge variant="gradient-cyan">Gradient Cyan</Badge>);
      const badge = screen.getByText('Gradient Cyan');
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-cyan-500', 'to-blue-500');
    });

    it('should render gradient-purple variant', () => {
      render(<Badge variant="gradient-purple">Gradient Purple</Badge>);
      const badge = screen.getByText('Gradient Purple');
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-pink-500');
    });

    it('should render gradient-green variant', () => {
      render(<Badge variant="gradient-green">Gradient Green</Badge>);
      const badge = screen.getByText('Gradient Green');
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-emerald-500');
    });

    it('should render gradient-orange variant', () => {
      render(<Badge variant="gradient-orange">Gradient Orange</Badge>);
      const badge = screen.getByText('Gradient Orange');
      expect(badge).toHaveClass('bg-gradient-to-r', 'from-orange-500', 'to-red-500');
    });

    it('should render glass variant', () => {
      render(<Badge variant="glass">Glass</Badge>);
      const badge = screen.getByText('Glass');
      expect(badge).toHaveClass('bg-background/80', 'backdrop-blur-sm');
    });

    it('should render neon variant', () => {
      render(<Badge variant="neon">Neon</Badge>);
      const badge = screen.getByText('Neon');
      expect(badge).toHaveClass('bg-background', 'border-2', 'border-accent-cyan');
    });

    it('should render shimmer variant', () => {
      render(<Badge variant="shimmer">Shimmer</Badge>);
      const badge = screen.getByText('Shimmer');
      expect(badge).toHaveClass('bg-gradient-to-r', 'animate-shimmer');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('should render default size', () => {
      render(<Badge size="default">Default Size</Badge>);
      const badge = screen.getByText('Default Size');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
    });

    it('should render large size', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });

    it('should render extra large size', () => {
      render(<Badge size="xl">Extra Large</Badge>);
      const badge = screen.getByText('Extra Large');
      expect(badge).toHaveClass('px-4', 'py-1.5', 'text-base');
    });
  });

  describe('Icons', () => {
    it('should render with left icon', () => {
      render(
        <Badge leftIcon={<Star data-testid="left-icon" />}>
          With Left Icon
        </Badge>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('With Left Icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      render(
        <Badge rightIcon={<Heart data-testid="right-icon" />}>
          With Right Icon
        </Badge>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('With Right Icon')).toBeInTheDocument();
    });

    it('should render with both left and right icons', () => {
      render(
        <Badge
          leftIcon={<Star data-testid="left-icon" />}
          rightIcon={<Heart data-testid="right-icon" />}
        >
          Both Icons
        </Badge>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('Both Icons')).toBeInTheDocument();
    });

    it('should apply shrink-0 class to icons', () => {
      render(
        <Badge leftIcon={<Star data-testid="left-icon" />}>
          Icon Badge
        </Badge>
      );
      const icon = screen.getByTestId('left-icon');
      expect(icon.parentElement).toHaveClass('shrink-0');
    });

    it('should mark icons as aria-hidden', () => {
      render(
        <Badge leftIcon={<Star data-testid="left-icon" />}>
          Icon Badge
        </Badge>
      );
      const iconContainer = screen.getByTestId('left-icon').parentElement;
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Dot Indicator', () => {
    it('should render with dot indicator', () => {
      render(<Badge dot>With Dot</Badge>);
      const badge = screen.getByText('With Dot');
      const dot = badge.querySelector('.h-2.w-2.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    it('should not render dot by default', () => {
      render(<Badge>Without Dot</Badge>);
      const badge = screen.getByText('Without Dot');
      const dot = badge.querySelector('.h-2.w-2.rounded-full');
      expect(dot).not.toBeInTheDocument();
    });

    it('should render dot with custom color', () => {
      render(<Badge dot dotColor="#ff0000">Custom Dot Color</Badge>);
      const badge = screen.getByText('Custom Dot Color');
      const dot = badge.querySelector('.h-2.w-2.rounded-full') as HTMLElement;
      expect(dot).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('should render dot with currentColor by default', () => {
      render(<Badge dot>Default Dot Color</Badge>);
      const badge = screen.getByText('Default Dot Color');
      const dot = badge.querySelector('.h-2.w-2.rounded-full') as HTMLElement;
      expect(dot).toHaveStyle({ backgroundColor: 'currentColor' });
    });

    it('should animate dot with pulse animation', () => {
      render(<Badge dot>Animated Dot</Badge>);
      const badge = screen.getByText('Animated Dot');
      const dot = badge.querySelector('.h-2.w-2.rounded-full');
      expect(dot).toHaveClass('');
    });

    it('should mark dot as aria-hidden', () => {
      render(<Badge dot>Dot Badge</Badge>);
      const badge = screen.getByText('Dot Badge');
      const dot = badge.querySelector('.h-2.w-2.rounded-full');
      expect(dot).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Removable Badge', () => {
    it('should render remove button when removable is true', () => {
      render(<Badge removable>Removable</Badge>);
      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      expect(removeButton).toBeInTheDocument();
    });

    it('should render remove button when onRemove is provided', () => {
      const handleRemove = jest.fn();
      render(<Badge onRemove={handleRemove}>With Remove</Badge>);
      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      expect(removeButton).toBeInTheDocument();
    });

    it('should call onRemove when remove button is clicked', async () => {
      const handleRemove = jest.fn();
      const user = userEvent.setup();
      render(<Badge onRemove={handleRemove}>Clickable Remove</Badge>);

      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      await user.click(removeButton);

      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it('should not render remove button by default', () => {
      render(<Badge>No Remove</Badge>);
      const removeButton = screen.queryByRole('button', { name: /remove badge/i });
      expect(removeButton).not.toBeInTheDocument();
    });

    it('should render X icon in remove button', () => {
      render(<Badge removable>Badge</Badge>);
      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      const icon = removeButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-3', 'w-3');
    });

    it('should have proper aria-label for accessibility', () => {
      render(<Badge removable>Badge</Badge>);
      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      expect(removeButton).toHaveAttribute('aria-label', 'Remove badge');
    });

    it('should have button type', () => {
      render(<Badge removable>Badge</Badge>);
      const removeButton = screen.getByRole('button', { name: /remove badge/i });
      expect(removeButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Animation', () => {
    it('should render as motion.div when animated is true', () => {
      render(<Badge animated>Animated Badge</Badge>);
      const badge = screen.getByText('Animated Badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render as regular div when animated is false', () => {
      render(<Badge animated={false}>Not Animated</Badge>);
      const badge = screen.getByText('Not Animated');
      expect(badge).toBeInTheDocument();
      expect(badge.tagName).toBe('DIV');
    });

    it('should render as regular div by default', () => {
      render(<Badge>Default Animation</Badge>);
      const badge = screen.getByText('Default Animation');
      expect(badge.tagName).toBe('DIV');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to the badge element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Badge ref={ref}>Ref Badge</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('Ref Badge');
    });

    it('should allow ref to access DOM methods', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Badge ref={ref}>Ref Badge</Badge>);
      expect(ref.current?.getAttribute).toBeDefined();
      expect(ref.current?.classList).toBeDefined();
    });
  });

  describe('Combined Features', () => {
    it('should render with all features combined', () => {
      const handleRemove = jest.fn();
      render(
        <Badge
          variant="gradient-purple"
          size="lg"
          leftIcon={<Star data-testid="left-icon" />}
          rightIcon={<Heart data-testid="right-icon" />}
          dot
          dotColor="#00ff00"
          onRemove={handleRemove}
          className="custom-class"
        >
          Full Featured
        </Badge>
      );

      const badge = screen.getByText('Full Featured');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('custom-class', 'px-3', 'py-1', 'text-sm');
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove badge/i })).toBeInTheDocument();

      const dot = badge.querySelector('.h-2.w-2.rounded-full') as HTMLElement;
      expect(dot).toHaveStyle({ backgroundColor: '#00ff00' });
    });
  });
});

describe('BadgeGroup Component', () => {
  describe('Basic Rendering', () => {
    it('should render all badge children', () => {
      render(
        <BadgeGroup>
          <Badge>Badge 1</Badge>
          <Badge>Badge 2</Badge>
          <Badge>Badge 3</Badge>
        </BadgeGroup>
      );

      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
    });

    it('should apply default spacing', () => {
      render(
        <BadgeGroup data-testid="badge-group">
          <Badge>Badge 1</Badge>
        </BadgeGroup>
      );

      const group = screen.getByTestId('badge-group');
      expect(group).toHaveClass('gap-2');
    });

    it('should apply custom className', () => {
      render(
        <BadgeGroup className="custom-group" data-testid="badge-group">
          <Badge>Badge</Badge>
        </BadgeGroup>
      );

      const group = screen.getByTestId('badge-group');
      expect(group).toHaveClass('custom-group');
    });
  });

  describe('Spacing', () => {
    it('should apply small spacing', () => {
      render(
        <BadgeGroup spacing="sm" data-testid="badge-group">
          <Badge>Badge</Badge>
        </BadgeGroup>
      );

      const group = screen.getByTestId('badge-group');
      expect(group).toHaveClass('gap-1');
    });

    it('should apply default spacing', () => {
      render(
        <BadgeGroup spacing="default" data-testid="badge-group">
          <Badge>Badge</Badge>
        </BadgeGroup>
      );

      const group = screen.getByTestId('badge-group');
      expect(group).toHaveClass('gap-2');
    });

    it('should apply large spacing', () => {
      render(
        <BadgeGroup spacing="lg" data-testid="badge-group">
          <Badge>Badge</Badge>
        </BadgeGroup>
      );

      const group = screen.getByTestId('badge-group');
      expect(group).toHaveClass('gap-3');
    });
  });

  describe('Max Display Count', () => {
    it('should show all badges when max is not set', () => {
      render(
        <BadgeGroup>
          <Badge>Badge 1</Badge>
          <Badge>Badge 2</Badge>
          <Badge>Badge 3</Badge>
          <Badge>Badge 4</Badge>
          <Badge>Badge 5</Badge>
        </BadgeGroup>
      );

      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
      expect(screen.getByText('Badge 4')).toBeInTheDocument();
      expect(screen.getByText('Badge 5')).toBeInTheDocument();
    });

    it('should limit displayed badges to max count', () => {
      render(
        <BadgeGroup max={3}>
          <Badge>Badge 1</Badge>
          <Badge>Badge 2</Badge>
          <Badge>Badge 3</Badge>
          <Badge>Badge 4</Badge>
          <Badge>Badge 5</Badge>
        </BadgeGroup>
      );

      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
      expect(screen.queryByText('Badge 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Badge 5')).not.toBeInTheDocument();
    });

    it('should show remaining count indicator', () => {
      render(
        <BadgeGroup max={2}>
          <Badge>Badge 1</Badge>
          <Badge>Badge 2</Badge>
          <Badge>Badge 3</Badge>
          <Badge>Badge 4</Badge>
        </BadgeGroup>
      );

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not show remaining count when within max', () => {
      render(
        <BadgeGroup max={5}>
          <Badge>Badge 1</Badge>
          <Badge>Badge 2</Badge>
          <Badge>Badge 3</Badge>
        </BadgeGroup>
      );

      expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
    });

    it('should use muted variant for remaining count badge', () => {
      render(
        <BadgeGroup max={1}>
          <Badge>Badge 1</Badge>
          <Badge>Badge 2</Badge>
          <Badge>Badge 3</Badge>
        </BadgeGroup>
      );

      const remainingBadge = screen.getByText('+2');
      expect(remainingBadge).toHaveClass('bg-muted', 'text-muted-foreground');
    });

    it('should use small size for remaining count badge', () => {
      render(
        <BadgeGroup max={1}>
          <Badge>Badge 1</Badge>
          <Badge>Badge 2</Badge>
        </BadgeGroup>
      );

      const remainingBadge = screen.getByText('+1');
      expect(remainingBadge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to the group container', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <BadgeGroup ref={ref}>
          <Badge>Badge</Badge>
        </BadgeGroup>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

describe('NotificationBadge Component', () => {
  describe('Basic Rendering', () => {
    it('should render notification count', () => {
      render(<NotificationBadge count={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should use destructive variant by default', () => {
      render(<NotificationBadge count={5} />);
      const badge = screen.getByText('5');
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should use small size by default', () => {
      render(<NotificationBadge count={5} />);
      const badge = screen.getByText('5');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('should accept custom variant', () => {
      render(<NotificationBadge count={5} variant="success" />);
      const badge = screen.getByText('5');
      expect(badge).toHaveClass('bg-cryb-success', 'text-cryb-success-foreground');
    });

    it('should accept custom size', () => {
      render(<NotificationBadge count={5} size="lg" />);
      const badge = screen.getByText('5');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });
  });

  describe('Count Display', () => {
    it('should display exact count when below max', () => {
      render(<NotificationBadge count={42} max={99} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should display max+ when count exceeds max', () => {
      render(<NotificationBadge count={150} max={99} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should use default max of 99', () => {
      render(<NotificationBadge count={100} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should display 0 when count is 0 and showZero is true', () => {
      render(<NotificationBadge count={0} showZero />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should not render when count is 0 by default', () => {
      const { container } = render(<NotificationBadge count={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when count is 0 and showZero is false', () => {
      const { container } = render(<NotificationBadge count={0} showZero={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle custom max values', () => {
      render(<NotificationBadge count={1000} max={999} />);
      expect(screen.getByText('999+')).toBeInTheDocument();
    });

    it('should display single digit correctly', () => {
      render(<NotificationBadge count={1} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display double digits correctly', () => {
      render(<NotificationBadge count={15} />);
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to the badge element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<NotificationBadge count={5} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveTextContent('5');
    });

    it('should return null ref when not rendering', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<NotificationBadge count={0} ref={ref} />);
      expect(ref.current).toBeNull();
    });
  });

  describe('Props Forwarding', () => {
    it('should forward additional props to Badge', () => {
      render(
        <NotificationBadge
          count={5}
          data-testid="notification-badge"
          className="custom-notification"
        />
      );

      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveClass('custom-notification');
    });
  });
});

describe('Component Integration', () => {
  it('should render NotificationBadge within BadgeGroup', () => {
    render(
      <BadgeGroup>
        <NotificationBadge count={5} />
        <NotificationBadge count={10} />
        <NotificationBadge count={150} />
      </BadgeGroup>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should handle mixed Badge and NotificationBadge in BadgeGroup', () => {
    render(
      <BadgeGroup max={3}>
        <Badge>Regular</Badge>
        <NotificationBadge count={5} />
        <Badge variant="success">Success</Badge>
        <NotificationBadge count={99} />
      </BadgeGroup>
    );

    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.queryByText('99')).not.toBeInTheDocument();
  });

  it('should work with complex nested structures', () => {
    const handleRemove = jest.fn();
    render(
      <BadgeGroup spacing="lg">
        <Badge
          variant="gradient-cyan"
          size="lg"
          leftIcon={<Star data-testid="star" />}
          dot
          dotColor="#ff0000"
        >
          Featured
        </Badge>
        <NotificationBadge count={42} variant="warning" />
        <Badge variant="glass" onRemove={handleRemove}>
          Removable
        </Badge>
      </BadgeGroup>
    );

    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Removable')).toBeInTheDocument();
    expect(screen.getByTestId('star')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('should have proper role for remove button', () => {
    render(<Badge removable>Badge</Badge>);
    const button = screen.getByRole('button', { name: /remove badge/i });
    expect(button).toBeInTheDocument();
  });

  it('should hide decorative elements from screen readers', () => {
    render(
      <Badge
        leftIcon={<Star data-testid="icon" />}
        dot
      >
        Accessible Badge
      </Badge>
    );

    const icon = screen.getByTestId('icon').parentElement;
    expect(icon).toHaveAttribute('aria-hidden', 'true');

    const badge = screen.getByText('Accessible Badge');
    const dot = badge.querySelector('.h-2.w-2.rounded-full');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('should support focus styles', () => {
    render(<Badge>Focusable Badge</Badge>);
    const badge = screen.getByText('Focusable Badge');
    expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-ring');
  });

  it('should allow custom aria attributes', () => {
    render(
      <Badge aria-label="Custom label" role="status">
        Badge
      </Badge>
    );
    const badge = screen.getByText('Badge');
    expect(badge).toHaveAttribute('aria-label', 'Custom label');
    expect(badge).toHaveAttribute('role', 'status');
  });
});

describe('Edge Cases', () => {
  it('should handle empty children', () => {
    render(<Badge>{''}</Badge>);
    const badge = document.querySelector('.inline-flex');
    expect(badge).toBeInTheDocument();
  });

  it('should handle number as children', () => {
    render(<Badge>{123}</Badge>);
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('should handle React elements as children', () => {
    render(
      <Badge>
        <span data-testid="child-element">Custom Element</span>
      </Badge>
    );
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
  });

  it('should handle BadgeGroup with no children', () => {
    const { container } = render(<BadgeGroup />);
    expect(container.querySelector('.flex')).toBeInTheDocument();
  });

  it('should handle NotificationBadge with negative count', () => {
    render(<NotificationBadge count={-5} />);
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('should handle very large counts in NotificationBadge', () => {
    render(<NotificationBadge count={999999} max={9999} />);
    expect(screen.getByText('9999+')).toBeInTheDocument();
  });

  it('should maintain functionality with multiple remove handlers', async () => {
    const handleRemove1 = jest.fn();
    const handleRemove2 = jest.fn();
    const user = userEvent.setup();

    render(
      <BadgeGroup>
        <Badge onRemove={handleRemove1}>Badge 1</Badge>
        <Badge onRemove={handleRemove2}>Badge 2</Badge>
      </BadgeGroup>
    );

    const buttons = screen.getAllByRole('button', { name: /remove badge/i });
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    expect(handleRemove1).toHaveBeenCalledTimes(1);
    expect(handleRemove2).toHaveBeenCalledTimes(1);
  });
});
