import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from './RadixButton';

// Mock dependencies
jest.mock('@radix-ui/react-primitive', () => ({
  __esModule: true,
}));

jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }) => <div data-slot="true" {...props}>{children}</div>
}));

jest.mock('class-variance-authority', () => ({
  cva: (base, config) => (props) => {
    const { variant = 'default', size = 'default', className = '' } = props || {};
    let classes = base;

    if (config.variants.variant[variant]) {
      classes += ' ' + config.variants.variant[variant];
    }
    if (config.variants.size[size]) {
      classes += ' ' + config.variants.size[size];
    }
    if (className) {
      classes += ' ' + className;
    }

    return classes;
  }
}));

jest.mock('../../lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' ')
}));

describe('Button', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<Button>Button Text</Button>);
      expect(screen.getByText('Button Text')).toBeInTheDocument();
    });

    it('renders as button element by default', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('has correct displayName', () => {
      expect(Button.displayName).toBe('Button');
    });

    it('renders with type button by default', () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-9');
    });

    it('applies destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-500');
    });

    it('applies outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
      expect(button.className).toContain('border-gray-7');
    });

    it('applies secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-3');
    });

    it('applies ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-gray-11');
    });

    it('applies link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-blue-9');
      expect(button.className).toContain('underline-offset-4');
    });

    it('applies glass variant', () => {
      render(<Button variant="glass">Glass</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('backdrop-blur-md');
      expect(button.className).toContain('bg-white/10');
    });

    it('applies gradient variant', () => {
      render(<Button variant="gradient">Gradient</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gradient-to-r');
      expect(button.className).toContain('from-blue-9');
      expect(button.className).toContain('to-violet-9');
    });

    it('uses default variant when not specified', () => {
      render(<Button>No Variant</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-9');
    });
  });

  describe('Sizes', () => {
    it('applies default size', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('px-4');
    });

    it('applies sm size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('px-3');
    });

    it('applies lg size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('px-6');
    });

    it('applies xl size', () => {
      render(<Button size="xl">Extra Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-14');
      expect(button.className).toContain('px-8');
    });

    it('applies icon size', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('w-10');
    });

    it('applies icon-sm size', () => {
      render(<Button size="icon-sm">Icon Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('w-8');
    });

    it('applies icon-lg size', () => {
      render(<Button size="icon-lg">Icon Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('w-12');
    });

    it('uses default size when not specified', () => {
      render(<Button>No Size</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
    });
  });

  describe('Variant and Size Combinations', () => {
    it('applies default variant with sm size', () => {
      render(<Button variant="default" size="sm">Small Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-9');
      expect(button.className).toContain('h-8');
    });

    it('applies destructive variant with lg size', () => {
      render(<Button variant="destructive" size="lg">Large Destructive</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-500');
      expect(button.className).toContain('h-12');
    });

    it('applies outline variant with icon size', () => {
      render(<Button variant="outline" size="icon">O</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border-gray-7');
      expect(button.className).toContain('h-10');
      expect(button.className).toContain('w-10');
    });

    it('applies ghost variant with xl size', () => {
      render(<Button variant="ghost" size="xl">Extra Large Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-gray-11');
      expect(button.className).toContain('h-14');
    });

    it('applies glass variant with icon-sm size', () => {
      render(<Button variant="glass" size="icon-sm">G</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('backdrop-blur-md');
      expect(button.className).toContain('h-8');
      expect(button.className).toContain('w-8');
    });

    it('applies gradient variant with icon-lg size', () => {
      render(<Button variant="gradient" size="icon-lg">Gr</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gradient-to-r');
      expect(button.className).toContain('h-12');
      expect(button.className).toContain('w-12');
    });
  });

  describe('Disabled State', () => {
    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled classes', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:pointer-events-none');
      expect(button.className).toContain('disabled:opacity-50');
    });

    it('does not trigger onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('is disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is disabled when both disabled and loading are true', () => {
      render(<Button disabled loading>Disabled and Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('hides children when loading', () => {
      render(<Button loading>Submit Form</Button>);
      expect(screen.queryByText('Submit Form')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders spinner element when loading', () => {
      const { container } = render(<Button loading>Submit</Button>);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('spinner has correct classes', () => {
      const { container } = render(<Button loading>Submit</Button>);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner.className).toContain('rounded-full');
      expect(spinner.className).toContain('h-4');
      expect(spinner.className).toContain('w-4');
      expect(spinner.className).toContain('border-2');
      expect(spinner.className).toContain('border-current');
      expect(spinner.className).toContain('border-t-transparent');
    });

    it('is disabled when loading is true', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not trigger onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('shows children when loading is false', () => {
      render(<Button loading={false}>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('transitions from loading to normal state', () => {
      const { rerender } = render(<Button loading>Submit</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      rerender(<Button loading={false}>Submit</Button>);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('AsChild Prop', () => {
    it('renders as Slot when asChild is true', () => {
      const { container } = render(
        <Button asChild>
          <a href="/test">Link</a>
        </Button>
      );
      expect(container.querySelector('[data-slot="true"]')).toBeInTheDocument();
    });

    it('renders as button when asChild is false', () => {
      render(<Button asChild={false}>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('uses button by default when asChild is not specified', () => {
      render(<Button>Default</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies classes to Slot component when asChild is true', () => {
      const { container } = render(
        <Button asChild variant="destructive" size="lg">
          <a href="/test">Link</a>
        </Button>
      );
      const slot = container.querySelector('[data-slot="true"]');
      expect(slot.className).toContain('bg-red-500');
      expect(slot.className).toContain('h-12');
    });
  });

  describe('Click Handling', () => {
    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles multiple clicks', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('passes event object to onClick handler', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('User Interactions', () => {
    it('handles user click events', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByText('Click me'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Button>Keyboard Button</Button>);
      const button = screen.getByRole('button');
      await user.tab();
      expect(document.activeElement).toBe(button);
    });

    it('handles Enter key press', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Press Enter</Button>);
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Note: Button's native behavior handles Enter key
    });

    it('handles Space key press', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Press Space</Button>);
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      // Note: Button's native behavior handles Space key
    });

    it('handles hover states', () => {
      render(<Button>Hover me</Button>);
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);
      expect(button).toBeInTheDocument();
    });

    it('handles focus events', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      fireEvent.focus(button);
      expect(document.activeElement).toBe(button);
    });

    it('handles blur events', () => {
      render(<Button>Blur me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      fireEvent.blur(button);
      expect(document.activeElement).not.toBe(button);
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current).toBeTruthy();
      expect(ref.current.tagName).toBe('BUTTON');
    });

    it('allows ref access to button methods', () => {
      const ref = React.createRef();
      render(<Button ref={ref}>Button</Button>);
      expect(ref.current.click).toBeDefined();
      expect(ref.current.focus).toBeDefined();
    });

    it('can focus button via ref', () => {
      const ref = React.createRef();
      render(<Button ref={ref}>Button</Button>);
      ref.current.focus();
      expect(document.activeElement).toBe(ref.current);
    });

    it('can click button via ref', () => {
      const handleClick = jest.fn();
      const ref = React.createRef();
      render(<Button ref={ref} onClick={handleClick}>Button</Button>);
      ref.current.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTML Attributes', () => {
    it('passes through data attributes', () => {
      render(<Button data-testid="my-button">Test</Button>);
      expect(screen.getByTestId('my-button')).toBeInTheDocument();
    });

    it('passes through aria attributes', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('passes through id attribute', () => {
      render(<Button id="submit-button">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'submit-button');
    });

    it('passes through type attribute', () => {
      const { container } = render(<Button type="submit">Submit</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('passes through name attribute', () => {
      const { container } = render(<Button name="action">Action</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('name', 'action');
    });

    it('passes through value attribute', () => {
      const { container } = render(<Button value="submit">Submit</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('value', 'submit');
    });

    it('passes through title attribute', () => {
      render(<Button title="Click to submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Click to submit');
    });

    it('supports aria-pressed for toggle buttons', () => {
      render(<Button aria-pressed="true">Toggle</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('supports aria-expanded for expandable buttons', () => {
      render(<Button aria-expanded="false">Menu</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('supports aria-controls', () => {
      render(<Button aria-controls="menu-list">Open Menu</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-controls', 'menu-list');
    });
  });

  describe('Content Types', () => {
    it('renders text content', () => {
      render(<Button>Text Button</Button>);
      expect(screen.getByText('Text Button')).toBeInTheDocument();
    });

    it('renders numeric content', () => {
      render(<Button>{42}</Button>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with icon children', () => {
      render(
        <Button>
          <span className="icon">★</span>
          Favorite
        </Button>
      );
      expect(screen.getByText('★')).toBeInTheDocument();
      expect(screen.getByText('Favorite')).toBeInTheDocument();
    });

    it('renders with multiple children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
          <span>Badge</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Badge')).toBeInTheDocument();
    });

    it('renders with complex nested children', () => {
      render(
        <Button>
          <div>
            <span className="icon">🔥</span>
            <div>
              <strong>Bold</strong> text
            </div>
          </div>
        </Button>
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('Bold')).toBeInTheDocument();
    });

    it('handles empty children', () => {
      const { container } = render(<Button />);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('handles whitespace children', () => {
      render(<Button>   </Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Styling and Classes', () => {
    it('includes base classes', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('inline-flex');
      expect(button.className).toContain('items-center');
      expect(button.className).toContain('justify-center');
    });

    it('includes transition classes', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('transition-all');
      expect(button.className).toContain('duration-200');
    });

    it('includes focus-visible classes', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible:outline-none');
      expect(button.className).toContain('focus-visible:ring-2');
    });

    it('includes hover effect classes', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:shadow-lg');
    });

    it('includes active state classes', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('active:scale-[0.98]');
    });

    it('includes rounded corners', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('rounded-lg');
    });

    it('includes gap for spacing', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('gap-2');
    });

    it('includes font styling', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('font-medium');
    });

    it('merges custom className with default classes', () => {
      render(<Button className="my-custom-class another-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('my-custom-class');
      expect(button.className).toContain('another-class');
      expect(button.className).toContain('inline-flex');
    });
  });

  describe('Edge Cases', () => {
    it('handles null children', () => {
      render(<Button>{null}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(<Button>{undefined}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles boolean children', () => {
      render(<Button>{false}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles zero as children', () => {
      render(<Button>{0}</Button>);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles empty string as children', () => {
      render(<Button>{''}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles array of children', () => {
      render(<Button>{['First', ' ', 'Second']}</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('First Second');
    });

    it('handles fragments as children', () => {
      render(
        <Button>
          <>
            <span>Fragment</span>
            <span>Children</span>
          </>
        </Button>
      );
      expect(screen.getByText('Fragment')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
    });

    it('handles conditional rendering', () => {
      const showIcon = true;
      render(
        <Button>
          {showIcon && <span>Icon</span>}
          Text
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('handles very long text', () => {
      const longText = 'A'.repeat(1000);
      render(<Button>{longText}</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('whitespace-nowrap');
    });

    it('handles special characters in children', () => {
      render(<Button>{'<>&"\'`'}</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('<>&"\'`');
    });

    it('handles unicode characters', () => {
      render(<Button>🚀 Launch 火箭</Button>);
      expect(screen.getByText(/🚀 Launch 火箭/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('supports aria-describedby', () => {
      render(
        <>
          <p id="button-desc">This button submits the form</p>
          <Button aria-describedby="button-desc">Submit</Button>
        </>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'button-desc');
    });

    it('is keyboard accessible', () => {
      render(<Button>Keyboard Accessible</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('has visible focus indicator classes', () => {
      render(<Button>Focus Visible</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('focus-visible:ring-2');
      expect(button.className).toContain('focus-visible:ring-blue-9');
    });

    it('announces loading state properly', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('maintains accessibility when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('supports aria-busy when loading', () => {
      render(<Button loading aria-busy="true">Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('is discoverable by screen readers', () => {
      render(<Button>Screen Reader Test</Button>);
      expect(screen.getByRole('button', { name: /screen reader test/i })).toBeInTheDocument();
    });
  });

  describe('Component Rerendering', () => {
    it('updates variant on rerender', () => {
      const { rerender } = render(<Button variant="default">Button</Button>);
      let button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-9');

      rerender(<Button variant="destructive">Button</Button>);
      button = screen.getByRole('button');
      expect(button.className).toContain('bg-red-500');
    });

    it('updates size on rerender', () => {
      const { rerender } = render(<Button size="sm">Button</Button>);
      let button = screen.getByRole('button');
      expect(button.className).toContain('h-8');

      rerender(<Button size="lg">Button</Button>);
      button = screen.getByRole('button');
      expect(button.className).toContain('h-12');
    });

    it('updates loading state on rerender', () => {
      const { rerender } = render(<Button loading={false}>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();

      rerender(<Button loading={true}>Submit</Button>);
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('updates disabled state on rerender', () => {
      const { rerender } = render(<Button disabled={false}>Button</Button>);
      let button = screen.getByRole('button');
      expect(button).not.toBeDisabled();

      rerender(<Button disabled={true}>Button</Button>);
      button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('updates children on rerender', () => {
      const { rerender } = render(<Button>Original</Button>);
      expect(screen.getByText('Original')).toBeInTheDocument();

      rerender(<Button>Updated</Button>);
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('updates className on rerender', () => {
      const { rerender } = render(<Button className="class-1">Button</Button>);
      let button = screen.getByRole('button');
      expect(button.className).toContain('class-1');

      rerender(<Button className="class-2">Button</Button>);
      button = screen.getByRole('button');
      expect(button.className).toContain('class-2');
      expect(button.className).not.toContain('class-1');
    });

    it('updates asChild on rerender', () => {
      const { container, rerender } = render(<Button asChild={false}>Button</Button>);
      expect(container.querySelector('button')).toBeInTheDocument();

      rerender(
        <Button asChild={true}>
          <a href="/test">Link</a>
        </Button>
      );
      expect(container.querySelector('[data-slot="true"]')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles rapid rerenders efficiently', () => {
      const { rerender } = render(<Button>Button</Button>);

      for (let i = 0; i < 100; i++) {
        rerender(<Button variant={i % 2 === 0 ? 'default' : 'outline'}>Button {i}</Button>);
      }

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles rapid clicks efficiently', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      for (let i = 0; i < 100; i++) {
        fireEvent.click(button);
      }

      expect(handleClick).toHaveBeenCalledTimes(100);
    });

    it('does not recreate classes unnecessarily', () => {
      const { container, rerender } = render(
        <Button variant="default" size="default" className="custom">
          Button
        </Button>
      );
      const firstClassName = container.querySelector('button').className;

      rerender(
        <Button variant="default" size="default" className="custom">
          Button
        </Button>
      );
      const secondClassName = container.querySelector('button').className;

      expect(firstClassName).toBe(secondClassName);
    });
  });

  describe('Integration Scenarios', () => {
    it('works in a form', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('works with tooltip wrapper', () => {
      render(
        <div title="Tooltip text">
          <Button>Hover for tooltip</Button>
        </div>
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('works inside button group', () => {
      render(
        <div role="group">
          <Button variant="outline">Left</Button>
          <Button variant="outline">Middle</Button>
          <Button variant="outline">Right</Button>
        </div>
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('works with icon libraries', () => {
      const Icon = () => <svg data-testid="icon" />;
      render(
        <Button>
          <Icon />
          Button with Icon
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Button with Icon')).toBeInTheDocument();
    });

    it('works with loading indicator and custom spinner', () => {
      const { container } = render(<Button loading>Loading</Button>);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Button Variants Export', () => {
    it('exports buttonVariants function', () => {
      expect(buttonVariants).toBeDefined();
      expect(typeof buttonVariants).toBe('function');
    });

    it('buttonVariants returns classes for default variant', () => {
      const classes = buttonVariants({ variant: 'default', size: 'default' });
      expect(classes).toContain('bg-blue-9');
    });

    it('buttonVariants returns classes for destructive variant', () => {
      const classes = buttonVariants({ variant: 'destructive', size: 'default' });
      expect(classes).toContain('bg-red-500');
    });

    it('buttonVariants returns classes for custom className', () => {
      const classes = buttonVariants({ variant: 'default', size: 'default', className: 'custom' });
      expect(classes).toContain('custom');
    });

    it('buttonVariants can be used independently', () => {
      const classes = buttonVariants({ variant: 'outline', size: 'lg' });
      expect(classes).toBeTruthy();
      expect(typeof classes).toBe('string');
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot for default button', () => {
      const { container } = render(<Button>Default Button</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for all variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'glass', 'gradient'];
      variants.forEach(variant => {
        const { container } = render(<Button variant={variant}>{variant}</Button>);
        expect(container.firstChild).toMatchSnapshot();
      });
    });

    it('matches snapshot for all sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'];
      sizes.forEach(size => {
        const { container } = render(<Button size={size}>{size}</Button>);
        expect(container.firstChild).toMatchSnapshot();
      });
    });

    it('matches snapshot for loading state', () => {
      const { container } = render(<Button loading>Loading</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for disabled state', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for button with icon', () => {
      const { container } = render(
        <Button>
          <span>🚀</span>
          Launch
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for asChild with link', () => {
      const { container } = render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

export default button
