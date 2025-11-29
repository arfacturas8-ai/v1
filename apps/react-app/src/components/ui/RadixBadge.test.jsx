import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge, badgeVariants } from './RadixBadge';

describe('Badge', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<Badge>Badge Text</Badge>);
      expect(screen.getByText('Badge Text')).toBeInTheDocument();
    });

    it('renders as div element by default', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild.tagName).toBe('DIV');
    });

    it('renders with empty children', () => {
      const { container } = render(<Badge />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with null children', () => {
      const { container } = render(<Badge>{null}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with undefined children', () => {
      const { container } = render(<Badge>{undefined}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with multiple children', () => {
      render(
        <Badge>
          <span>Part 1</span>
          <span>Part 2</span>
        </Badge>
      );
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant by default', () => {
      const { container } = render(<Badge>Default</Badge>);
      expect(container.firstChild).toHaveClass('bg-blue-9', 'text-white', 'border-transparent');
    });

    it('applies default variant explicitly', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      expect(container.firstChild).toHaveClass('bg-blue-9', 'text-white', 'border-transparent');
    });

    it('applies secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      expect(container.firstChild).toHaveClass('bg-gray-3', 'text-gray-11', 'border-transparent');
    });

    it('applies destructive variant', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>);
      expect(container.firstChild).toHaveClass('bg-red-500', 'text-white', 'border-transparent');
    });

    it('applies outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      expect(container.firstChild).toHaveClass('border-gray-7', 'text-gray-11');
    });

    it('applies success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      expect(container.firstChild).toHaveClass('bg-green-500', 'text-white', 'border-transparent');
    });

    it('applies warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      expect(container.firstChild).toHaveClass('bg-yellow-500', 'text-white', 'border-transparent');
    });

    it('applies glass variant', () => {
      const { container } = render(<Badge variant="glass">Glass</Badge>);
      expect(container.firstChild).toHaveClass('backdrop-blur-md', 'border-white/20', 'bg-white/10', 'text-gray-12');
    });

    it('applies gradient variant', () => {
      const { container } = render(<Badge variant="gradient">Gradient</Badge>);
      expect(container.firstChild).toHaveClass('bg-gradient-to-r', 'from-blue-9', 'to-violet-9', 'text-white', 'border-transparent');
    });

    it('default variant includes shadow', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      expect(container.firstChild).toHaveClass('shadow-lg', 'shadow-blue-9/25');
    });

    it('destructive variant includes shadow', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>);
      expect(container.firstChild).toHaveClass('shadow-lg', 'shadow-red-500/25');
    });

    it('success variant includes shadow', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      expect(container.firstChild).toHaveClass('shadow-lg', 'shadow-green-500/25');
    });

    it('warning variant includes shadow', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      expect(container.firstChild).toHaveClass('shadow-lg', 'shadow-yellow-500/25');
    });

    it('gradient variant includes shadow', () => {
      const { container } = render(<Badge variant="gradient">Gradient</Badge>);
      expect(container.firstChild).toHaveClass('shadow-lg', 'shadow-blue-9/25');
    });

    it('secondary variant includes hover state', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      expect(container.firstChild).toHaveClass('hover:bg-gray-4');
    });

    it('outline variant includes hover state', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      expect(container.firstChild).toHaveClass('hover:bg-gray-2');
    });

    it('glass variant includes hover state', () => {
      const { container } = render(<Badge variant="glass">Glass</Badge>);
      expect(container.firstChild).toHaveClass('hover:bg-white/20');
    });

    it('default variant includes hover shadow', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      expect(container.firstChild).toHaveClass('hover:shadow-xl');
    });
  });

  describe('Sizes', () => {
    it('applies default size by default', () => {
      const { container } = render(<Badge>Default</Badge>);
      expect(container.firstChild).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
    });

    it('applies default size explicitly', () => {
      const { container } = render(<Badge size="default">Default</Badge>);
      expect(container.firstChild).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
    });

    it('applies small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      expect(container.firstChild).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('applies large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      expect(container.firstChild).toHaveClass('px-3', 'py-1', 'text-sm');
    });

    it('small size has less horizontal padding than default', () => {
      const { container: smContainer } = render(<Badge size="sm">Small</Badge>);
      const { container: defaultContainer } = render(<Badge>Default</Badge>);

      expect(smContainer.firstChild).toHaveClass('px-2');
      expect(defaultContainer.firstChild).toHaveClass('px-2.5');
    });

    it('large size has more padding than default', () => {
      const { container: lgContainer } = render(<Badge size="lg">Large</Badge>);
      const { container: defaultContainer } = render(<Badge>Default</Badge>);

      expect(lgContainer.firstChild).toHaveClass('px-3', 'py-1');
      expect(defaultContainer.firstChild).toHaveClass('px-2.5', 'py-0.5');
    });

    it('large size has larger text than default', () => {
      const { container: lgContainer } = render(<Badge size="lg">Large</Badge>);
      const { container: defaultContainer } = render(<Badge>Default</Badge>);

      expect(lgContainer.firstChild).toHaveClass('text-sm');
      expect(defaultContainer.firstChild).toHaveClass('text-xs');
    });
  });

  describe('Base Styling', () => {
    it('has inline-flex display', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('inline-flex', 'items-center');
    });

    it('has rounded-full border radius', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('rounded-full');
    });

    it('has border', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('border');
    });

    it('has font-semibold weight', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('font-semibold');
    });

    it('has transition classes', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('transition-all', 'duration-200');
    });

    it('has focus outline styles', () => {
      const { container } = render(<Badge>Test</Badge>);
      expect(container.firstChild).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-9', 'focus:ring-offset-2');
    });

    it('applies all base classes together', () => {
      const { container } = render(<Badge>Test</Badge>);
      const element = container.firstChild;
      expect(element).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold',
        'transition-all',
        'duration-200'
      );
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-class">Test</Badge>);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(<Badge className="custom-class">Test</Badge>);
      expect(container.firstChild).toHaveClass('custom-class', 'inline-flex', 'bg-blue-9');
    });

    it('allows overriding default styles with custom className', () => {
      const { container } = render(<Badge className="bg-purple-500">Test</Badge>);
      expect(container.firstChild).toHaveClass('bg-purple-500');
    });

    it('handles multiple custom classes', () => {
      const { container } = render(<Badge className="class-one class-two class-three">Test</Badge>);
      expect(container.firstChild).toHaveClass('class-one', 'class-two', 'class-three');
    });

    it('handles empty string className', () => {
      const { container } = render(<Badge className="">Test</Badge>);
      expect(container.firstChild).toHaveClass('inline-flex');
    });

    it('handles undefined className', () => {
      const { container } = render(<Badge className={undefined}>Test</Badge>);
      expect(container.firstChild).toHaveClass('inline-flex');
    });

    it('handles null className', () => {
      const { container } = render(<Badge className={null}>Test</Badge>);
      expect(container.firstChild).toHaveClass('inline-flex');
    });
  });

  describe('Variant and Size Combinations', () => {
    it('combines default variant with small size', () => {
      const { container } = render(<Badge variant="default" size="sm">Test</Badge>);
      expect(container.firstChild).toHaveClass('bg-blue-9', 'px-2', 'py-0.5');
    });

    it('combines secondary variant with large size', () => {
      const { container } = render(<Badge variant="secondary" size="lg">Test</Badge>);
      expect(container.firstChild).toHaveClass('bg-gray-3', 'px-3', 'py-1', 'text-sm');
    });

    it('combines destructive variant with small size', () => {
      const { container } = render(<Badge variant="destructive" size="sm">Test</Badge>);
      expect(container.firstChild).toHaveClass('bg-red-500', 'px-2');
    });

    it('combines outline variant with large size', () => {
      const { container } = render(<Badge variant="outline" size="lg">Test</Badge>);
      expect(container.firstChild).toHaveClass('border-gray-7', 'px-3', 'text-sm');
    });

    it('combines success variant with default size', () => {
      const { container } = render(<Badge variant="success" size="default">Test</Badge>);
      expect(container.firstChild).toHaveClass('bg-green-500', 'px-2.5', 'text-xs');
    });

    it('combines warning variant with large size', () => {
      const { container } = render(<Badge variant="warning" size="lg">Test</Badge>);
      expect(container.firstChild).toHaveClass('bg-yellow-500', 'px-3', 'py-1');
    });

    it('combines glass variant with small size', () => {
      const { container } = render(<Badge variant="glass" size="sm">Test</Badge>);
      expect(container.firstChild).toHaveClass('backdrop-blur-md', 'px-2');
    });

    it('combines gradient variant with large size', () => {
      const { container } = render(<Badge variant="gradient" size="lg">Test</Badge>);
      expect(container.firstChild).toHaveClass('bg-gradient-to-r', 'px-3', 'text-sm');
    });
  });

  describe('HTML Attributes', () => {
    it('passes through data-testid attribute', () => {
      const { container } = render(<Badge data-testid="my-badge">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('data-testid', 'my-badge');
    });

    it('passes through id attribute', () => {
      const { container } = render(<Badge id="badge-id">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('id', 'badge-id');
    });

    it('passes through aria-label attribute', () => {
      const { container } = render(<Badge aria-label="status badge">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('aria-label', 'status badge');
    });

    it('passes through aria-describedby attribute', () => {
      const { container } = render(<Badge aria-describedby="description">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('aria-describedby', 'description');
    });

    it('passes through role attribute', () => {
      const { container } = render(<Badge role="status">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('role', 'status');
    });

    it('passes through title attribute', () => {
      const { container } = render(<Badge title="Badge tooltip">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('title', 'Badge tooltip');
    });

    it('passes through data attributes', () => {
      const { container } = render(<Badge data-custom="value" data-another="test">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('data-custom', 'value');
      expect(container.firstChild).toHaveAttribute('data-another', 'test');
    });

    it('passes through aria-live attribute', () => {
      const { container } = render(<Badge aria-live="polite">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('aria-live', 'polite');
    });

    it('passes through aria-atomic attribute', () => {
      const { container } = render(<Badge aria-atomic="true">Test</Badge>);
      expect(container.firstChild).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Content Types', () => {
    it('renders text content', () => {
      render(<Badge>Text Badge</Badge>);
      expect(screen.getByText('Text Badge')).toBeInTheDocument();
    });

    it('renders numeric content', () => {
      render(<Badge>{42}</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders zero', () => {
      render(<Badge>{0}</Badge>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders negative numbers', () => {
      render(<Badge>{-5}</Badge>);
      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('renders decimal numbers', () => {
      render(<Badge>{3.14}</Badge>);
      expect(screen.getByText('3.14')).toBeInTheDocument();
    });

    it('renders with icon element', () => {
      render(
        <Badge>
          <span className="icon">★</span>
          Premium
        </Badge>
      );
      expect(screen.getByText('★')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders with multiple text elements', () => {
      render(
        <Badge>
          <span>Part 1</span>
          <span> | </span>
          <span>Part 2</span>
        </Badge>
      );
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText(' | ')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });

    it('renders with emoji', () => {
      render(<Badge>🎉 Celebration</Badge>);
      expect(screen.getByText('🎉 Celebration')).toBeInTheDocument();
    });

    it('renders with special characters', () => {
      render(<Badge>&lt;&gt;&amp;</Badge>);
      expect(screen.getByText('<>&')).toBeInTheDocument();
    });

    it('renders long text content', () => {
      const longText = 'This is a very long badge text that might wrap';
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    it('handles onClick events', async () => {
      const handleClick = jest.fn();
      const { container } = render(<Badge onClick={handleClick}>Clickable</Badge>);

      await userEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles onMouseEnter events', () => {
      const handleMouseEnter = jest.fn();
      const { container } = render(<Badge onMouseEnter={handleMouseEnter}>Badge</Badge>);

      fireEvent.mouseEnter(container.firstChild);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('handles onMouseLeave events', () => {
      const handleMouseLeave = jest.fn();
      const { container } = render(<Badge onMouseLeave={handleMouseLeave}>Badge</Badge>);

      fireEvent.mouseLeave(container.firstChild);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles onFocus events', () => {
      const handleFocus = jest.fn();
      const { container } = render(<Badge onFocus={handleFocus} tabIndex={0}>Badge</Badge>);

      fireEvent.focus(container.firstChild);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('handles onBlur events', () => {
      const handleBlur = jest.fn();
      const { container } = render(<Badge onBlur={handleBlur} tabIndex={0}>Badge</Badge>);

      fireEvent.focus(container.firstChild);
      fireEvent.blur(container.firstChild);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles onKeyDown events', () => {
      const handleKeyDown = jest.fn();
      const { container } = render(<Badge onKeyDown={handleKeyDown} tabIndex={0}>Badge</Badge>);

      fireEvent.keyDown(container.firstChild, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('handles onKeyUp events', () => {
      const handleKeyUp = jest.fn();
      const { container } = render(<Badge onKeyUp={handleKeyUp} tabIndex={0}>Badge</Badge>);

      fireEvent.keyUp(container.firstChild, { key: 'Enter' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
    });

    it('passes event object to onClick handler', async () => {
      const handleClick = jest.fn();
      const { container } = render(<Badge onClick={handleClick}>Badge</Badge>);

      await userEvent.click(container.firstChild);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Accessibility', () => {
    it('can be focused with tabIndex', () => {
      const { container } = render(<Badge tabIndex={0}>Focusable</Badge>);
      expect(container.firstChild).toHaveAttribute('tabIndex', '0');
    });

    it('can be non-focusable with tabIndex -1', () => {
      const { container } = render(<Badge tabIndex={-1}>Non-focusable</Badge>);
      expect(container.firstChild).toHaveAttribute('tabIndex', '-1');
    });

    it('supports aria-label for screen readers', () => {
      const { container } = render(<Badge aria-label="5 notifications">5</Badge>);
      expect(container.firstChild).toHaveAttribute('aria-label', '5 notifications');
    });

    it('supports role attribute', () => {
      const { container } = render(<Badge role="status">Online</Badge>);
      expect(container.firstChild).toHaveAttribute('role', 'status');
    });

    it('has visible focus ring styles', () => {
      const { container } = render(<Badge tabIndex={0}>Badge</Badge>);
      expect(container.firstChild).toHaveClass('focus:ring-2', 'focus:ring-blue-9');
    });

    it('focus ring has offset', () => {
      const { container } = render(<Badge>Badge</Badge>);
      expect(container.firstChild).toHaveClass('focus:ring-offset-2');
    });

    it('supports aria-describedby for additional context', () => {
      render(
        <>
          <Badge aria-describedby="badge-desc">New</Badge>
          <span id="badge-desc">This item is new</span>
        </>
      );
      const badge = screen.getByText('New');
      expect(badge).toHaveAttribute('aria-describedby', 'badge-desc');
    });
  });

  describe('Re-rendering', () => {
    it('updates children on re-render', () => {
      const { container, rerender } = render(<Badge>Initial</Badge>);
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(<Badge>Updated</Badge>);
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    it('updates variant on re-render', () => {
      const { container, rerender } = render(<Badge variant="default">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-blue-9');

      rerender(<Badge variant="success">Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-green-500');
      expect(container.firstChild).not.toHaveClass('bg-blue-9');
    });

    it('updates size on re-render', () => {
      const { container, rerender } = render(<Badge size="sm">Badge</Badge>);
      expect(container.firstChild).toHaveClass('px-2');

      rerender(<Badge size="lg">Badge</Badge>);
      expect(container.firstChild).toHaveClass('px-3');
    });

    it('updates className on re-render', () => {
      const { container, rerender } = render(<Badge className="class-one">Badge</Badge>);
      expect(container.firstChild).toHaveClass('class-one');

      rerender(<Badge className="class-two">Badge</Badge>);
      expect(container.firstChild).toHaveClass('class-two');
      expect(container.firstChild).not.toHaveClass('class-one');
    });
  });

  describe('Edge Cases', () => {
    it('renders with very long text', () => {
      const longText = 'A'.repeat(100);
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('renders with boolean value false (does not render)', () => {
      const { container } = render(<Badge>{false}</Badge>);
      expect(container.firstChild.textContent).toBe('');
    });

    it('renders with boolean value true (does not render)', () => {
      const { container } = render(<Badge>{true}</Badge>);
      expect(container.firstChild.textContent).toBe('');
    });

    it('renders with whitespace-only content', () => {
      const { container } = render(<Badge>   </Badge>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with newline characters', () => {
      render(<Badge>Line 1{'\n'}Line 2</Badge>);
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });

    it('handles rapid variant changes', () => {
      const { container, rerender } = render(<Badge variant="default">Badge</Badge>);

      rerender(<Badge variant="success">Badge</Badge>);
      rerender(<Badge variant="warning">Badge</Badge>);
      rerender(<Badge variant="destructive">Badge</Badge>);

      expect(container.firstChild).toHaveClass('bg-red-500');
    });

    it('handles undefined variant gracefully (falls back to default)', () => {
      const { container } = render(<Badge variant={undefined}>Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-blue-9');
    });

    it('handles null variant gracefully (falls back to default)', () => {
      const { container } = render(<Badge variant={null}>Badge</Badge>);
      expect(container.firstChild).toHaveClass('bg-blue-9');
    });

    it('handles undefined size gracefully (falls back to default)', () => {
      const { container } = render(<Badge size={undefined}>Badge</Badge>);
      expect(container.firstChild).toHaveClass('px-2.5');
    });

    it('handles null size gracefully (falls back to default)', () => {
      const { container } = render(<Badge size={null}>Badge</Badge>);
      expect(container.firstChild).toHaveClass('px-2.5');
    });
  });

  describe('badgeVariants Export', () => {
    it('exports badgeVariants function', () => {
      expect(badgeVariants).toBeDefined();
      expect(typeof badgeVariants).toBe('function');
    });

    it('badgeVariants returns string for default', () => {
      const result = badgeVariants();
      expect(typeof result).toBe('string');
      expect(result).toContain('inline-flex');
    });

    it('badgeVariants accepts variant parameter', () => {
      const result = badgeVariants({ variant: 'success' });
      expect(result).toContain('bg-green-500');
    });

    it('badgeVariants accepts size parameter', () => {
      const result = badgeVariants({ size: 'lg' });
      expect(result).toContain('px-3');
    });

    it('badgeVariants accepts both variant and size', () => {
      const result = badgeVariants({ variant: 'destructive', size: 'sm' });
      expect(result).toContain('bg-red-500');
      expect(result).toContain('px-2');
    });
  });

  describe('Integration Scenarios', () => {
    it('renders as notification badge with count', () => {
      render(
        <Badge variant="destructive" size="sm" aria-label="5 unread messages">
          5
        </Badge>
      );
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('5 unread messages')).toBeInTheDocument();
    });

    it('renders as status indicator', () => {
      render(
        <Badge variant="success" role="status" aria-label="Online status">
          Online
        </Badge>
      );
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders as interactive tag', () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Badge variant="outline" onClick={handleClick} tabIndex={0}>
          React
        </Badge>
      );
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(container.firstChild).toHaveAttribute('tabIndex', '0');
    });

    it('renders multiple badges in a group', () => {
      render(
        <div>
          <Badge variant="default">JavaScript</Badge>
          <Badge variant="success">TypeScript</Badge>
          <Badge variant="warning">CSS</Badge>
        </div>
      );
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('CSS')).toBeInTheDocument();
    });

    it('renders with icon and text', () => {
      render(
        <Badge variant="glass">
          <svg className="icon" width="12" height="12" data-testid="star-icon">
            <circle cx="6" cy="6" r="6" />
          </svg>
          <span>Premium</span>
        </Badge>
      );
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('renders as dismissible badge', async () => {
      const handleDismiss = jest.fn();
      render(
        <Badge variant="secondary">
          Tag
          <button onClick={handleDismiss} aria-label="Remove tag">×</button>
        </Badge>
      );

      const dismissButton = screen.getByLabelText('Remove tag');
      await userEvent.click(dismissButton);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for default badge', () => {
      const { container } = render(<Badge>Default Badge</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for all variants', () => {
      const variants = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'glass', 'gradient'];
      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>{variant}</Badge>);
        expect(container.firstChild).toMatchSnapshot(`variant-${variant}`);
      });
    });

    it('matches snapshot for all sizes', () => {
      const sizes = ['sm', 'default', 'lg'];
      sizes.forEach(size => {
        const { container } = render(<Badge size={size}>{size}</Badge>);
        expect(container.firstChild).toMatchSnapshot(`size-${size}`);
      });
    });

    it('matches snapshot for badge with custom className', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for badge with mixed content', () => {
      const { container } = render(
        <Badge variant="gradient" size="lg">
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default element
